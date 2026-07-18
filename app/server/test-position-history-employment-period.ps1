# Test thu PositionHistory + EmploymentPeriod: mo/dong dong theo vong doi nhan vien
# (create/doi vi tri/resign/rehire), va Position bi chan xoa neu da tung co lich su.
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-position-history-employment-period.ps1
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"
$ownerEmail = "owner@ada.local"
$ownerPassword = "Owner@123"

function Show-Step($title) {
    Write-Host ""
    Write-Host "== $title ==" -ForegroundColor Cyan
}

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Path,
        $Body = $null,
        [string]$Token = $null,
        [int]$ExpectedStatus = 0
    )

    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    $uri = "$baseUrl$Path"

    try {
        if ($null -ne $Body) {
            $json = $Body | ConvertTo-Json
            $resp = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -Body $json -ContentType "application/json" -UseBasicParsing
        } else {
            $resp = Invoke-WebRequest -Uri $uri -Method $Method -Headers $headers -UseBasicParsing
        }
        $status = [int]$resp.StatusCode
        $data = if ($resp.Content) { $resp.Content | ConvertFrom-Json } else { $null }
    } catch {
        $status = [int]$_.Exception.Response.StatusCode.value__
        $data = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message | ConvertFrom-Json } else { $null }
    }

    if ($ExpectedStatus -ne 0 -and $status -ne $ExpectedStatus) {
        throw "FAIL $Method $Path : ky vong $ExpectedStatus nhung nhan $status. Body: $($data | ConvertTo-Json -Depth 5)"
    }

    Write-Host "OK  $Method $Path -> $status" -ForegroundColor Green
    return $data
}

function New-RandomCccd {
    -join ((0..11) | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 })
}

# 0. LOGIN
Show-Step "LOGIN"
$loginRes = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = $ownerEmail; password = $ownerPassword } -ExpectedStatus 200
$token = $loginRes.token

$suffix = Get-Random
$deptName = "DeptHist-$suffix"
$pos1Name = "Pos1Hist-$suffix"
$pos2Name = "Pos2Hist-$suffix"

# 1. Chuan bi department + 2 position
Show-Step "CREATE department + 2 position"
$dept = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptName } -Token $token -ExpectedStatus 201
$idDept = $dept.id
$pos1 = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $pos1Name; departmentId = $idDept } -Token $token -ExpectedStatus 201
$idPos1 = $pos1.id
$pos2 = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $pos2Name; departmentId = $idDept } -Token $token -ExpectedStatus 201
$idPos2 = $pos2.id

# 2. CREATE employee o pos1 -> phai tu mo 1 dong PositionHistory + 1 dong EmploymentPeriod
Show-Step "CREATE employee o Pos1"
$emp = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = New-RandomCccd; fullName = "Emp Hist Test"; positionId = $idPos1 } -Token $token -ExpectedStatus 201
$idEmp = $emp.id

Show-Step "GET position-history ngay sau khi tao (ky vong 1 dong, dang mo, position=Pos1)"
$ph1 = @(Invoke-Api -Method Get -Path "/employees/$idEmp/position-history" -Token $token -ExpectedStatus 200)
if ($ph1.Count -ne 1) { throw "FAIL: ky vong 1 dong PositionHistory, nhan $($ph1.Count)" }
if ($null -ne $ph1[0].endDate) { throw "FAIL: dong dau phai dang mo (endDate=null)" }
if ($ph1[0].position.name -ne $pos1Name) { throw "FAIL: position khong dung" }
Write-Host "OK days=$($ph1[0].days)" -ForegroundColor Green

Show-Step "GET employment-periods ngay sau khi tao (ky vong 1 dong, dang mo)"
$ep1 = @(Invoke-Api -Method Get -Path "/employees/$idEmp/employment-periods" -Token $token -ExpectedStatus 200)
if ($ep1.Count -ne 1) { throw "FAIL: ky vong 1 dong EmploymentPeriod, nhan $($ep1.Count)" }
if ($null -ne $ep1[0].endDate) { throw "FAIL: dong dau phai dang mo" }

# 3. Doi vi tri sang Pos2 -> dong dong cu, mo dong moi trong PositionHistory; EmploymentPeriod KHONG doi
Show-Step "PATCH doi vi tri sang Pos2"
Invoke-Api -Method Patch -Path "/employees/$idEmp" -Body @{ positionId = $idPos2 } -Token $token -ExpectedStatus 200 | Out-Null

Show-Step "GET position-history sau khi doi vi tri (ky vong 2 dong: dong 1 da dong, dong 2 dang mo o Pos2)"
$ph2 = @(Invoke-Api -Method Get -Path "/employees/$idEmp/position-history" -Token $token -ExpectedStatus 200)
if ($ph2.Count -ne 2) { throw "FAIL: ky vong 2 dong, nhan $($ph2.Count)" }
if ($null -eq $ph2[0].endDate) { throw "FAIL: dong dau tien phai da dong sau khi doi vi tri" }
if ($null -ne $ph2[1].endDate) { throw "FAIL: dong thu 2 phai dang mo" }
if ($ph2[1].position.name -ne $pos2Name) { throw "FAIL: dong thu 2 phai la Pos2" }

Show-Step "GET employment-periods sau khi doi vi tri (ky vong VAN 1 dong, khong doi)"
$ep2 = @(Invoke-Api -Method Get -Path "/employees/$idEmp/employment-periods" -Token $token -ExpectedStatus 200)
if ($ep2.Count -ne 1) { throw "FAIL: doi vi tri khong duoc lam anh huong EmploymentPeriod, nhan $($ep2.Count) dong" }

# 4. RESIGN -> dong ca 2 bang
Show-Step "RESIGN"
Invoke-Api -Method Patch -Path "/employees/$idEmp/resign" -Token $token -ExpectedStatus 200 | Out-Null

Show-Step "GET position-history sau resign (dong cuoi phai da dong)"
$ph3 = @(Invoke-Api -Method Get -Path "/employees/$idEmp/position-history" -Token $token -ExpectedStatus 200)
if ($null -eq $ph3[$ph3.Count - 1].endDate) { throw "FAIL: dong cuoi PositionHistory phai da dong sau resign" }

Show-Step "GET employment-periods sau resign (dong phai da dong)"
$ep3 = @(Invoke-Api -Method Get -Path "/employees/$idEmp/employment-periods" -Token $token -ExpectedStatus 200)
if ($null -eq $ep3[0].endDate) { throw "FAIL: EmploymentPeriod phai da dong sau resign" }

# 5. REHIRE (giu nguyen Pos2) -> mo dong MOI o ca 2 bang, tinh lai tu dau
Show-Step "REHIRE (giu nguyen Pos2)"
Invoke-Api -Method Patch -Path "/employees/$idEmp/rehire" -Token $token -ExpectedStatus 200 | Out-Null

Show-Step "GET position-history sau rehire (ky vong 3 dong, dong 3 dang mo o Pos2)"
$ph4 = @(Invoke-Api -Method Get -Path "/employees/$idEmp/position-history" -Token $token -ExpectedStatus 200)
if ($ph4.Count -ne 3) { throw "FAIL: ky vong 3 dong sau rehire, nhan $($ph4.Count)" }
if ($null -ne $ph4[2].endDate) { throw "FAIL: dong thu 3 (moi) phai dang mo" }
if ($ph4[2].position.name -ne $pos2Name) { throw "FAIL: dong moi phai van la Pos2 (rehire khong doi vi tri)" }

Show-Step "GET employment-periods sau rehire (ky vong 2 dong, dong 2 dang mo, tinh lai tu dau)"
$ep4 = @(Invoke-Api -Method Get -Path "/employees/$idEmp/employment-periods" -Token $token -ExpectedStatus 200)
if ($ep4.Count -ne 2) { throw "FAIL: ky vong 2 dong sau rehire, nhan $($ep4.Count)" }
if ($null -ne $ep4[1].endDate) { throw "FAIL: dong thu 2 (moi) phai dang mo" }
if ($ep4[1].days -ne 0) { throw "FAIL: dong moi phai tinh lai tu 0 ngay, nhan $($ep4[1].days)" }

# 6. Position da tung co lich su (Pos1, khong ai dang giu) van bi chan xoa
Show-Step "DELETE Pos1 (khong ai dang giu nhung da tung co lich su, ky vong 409)"
Invoke-Api -Method Delete -Path "/positions/$idPos1" -Token $token -ExpectedStatus 409 | Out-Null

# 7. GET timeline cho employee khong ton tai -> 404
Show-Step "GET position-history employee khong ton tai (ky vong 404)"
Invoke-Api -Method Get -Path "/employees/00000000-0000-0000-0000-000000000000/position-history" -Token $token -ExpectedStatus 404 | Out-Null

Show-Step "GET employment-periods employee khong ton tai (ky vong 404)"
Invoke-Api -Method Get -Path "/employees/00000000-0000-0000-0000-000000000000/employment-periods" -Token $token -ExpectedStatus 404 | Out-Null

# 8. Don dep: xoa employee (cascade xoa het lich su), roi Pos1 xoa duoc, Pos2, department
Show-Step "Don dep"
Invoke-Api -Method Delete -Path "/employees/$idEmp" -Token $token -ExpectedStatus 204 | Out-Null

Show-Step "DELETE Pos1 sau khi employee (va lich su cua no) da bi xoa (ky vong 204)"
Invoke-Api -Method Delete -Path "/positions/$idPos1" -Token $token -ExpectedStatus 204 | Out-Null

Invoke-Api -Method Delete -Path "/positions/$idPos2" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/departments/$idDept" -Token $token -ExpectedStatus 204 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST POSITION-HISTORY / EMPLOYMENT-PERIOD PASS" -ForegroundColor Green
