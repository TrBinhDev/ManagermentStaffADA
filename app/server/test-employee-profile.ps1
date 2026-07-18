# Test thu toan bo flow /employees/:id/profile (GET/PUT + doi cccd + dong bo cccdHash).
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-employee-profile.ps1
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
$deptName = "DeptProfile-$suffix"
$posName = "PosProfile-$suffix"
$cccdEmp1 = New-RandomCccd
$cccdEmp2 = New-RandomCccd
$cccdEmp3 = New-RandomCccd

# 1. Chuan bi department + position + employee1
Show-Step "CREATE department + position + employee1"
$dept = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptName } -Token $token -ExpectedStatus 201
$idDept = $dept.id
$pos = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName; departmentId = $idDept } -Token $token -ExpectedStatus 201
$idPos = $pos.id
$emp1 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = $cccdEmp1; fullName = "Emp Profile Test"; positionId = $idPos } -Token $token -ExpectedStatus 201
$idEmp1 = $emp1.id

# 2. GET profile ngay sau khi tao -> phai da co san (tu dong tao luc POST /employees)
Show-Step "GET profile ngay sau khi tao employee"
$profile1 = Invoke-Api -Method Get -Path "/employees/$idEmp1/profile" -Token $token -ExpectedStatus 200
if ($profile1.cccd -ne $cccdEmp1) { throw "FAIL: cccd giai ma khong khop, nhan '$($profile1.cccd)'" }
if ($profile1.avatarUrl -ne "/default-avatar.png") { throw "FAIL: avatarUrl mac dinh khong dung, nhan '$($profile1.avatarUrl)'" }
if ($null -ne $profile1.cccdEncrypted) { throw "FAIL: response khong duoc lo cccdEncrypted" }
Write-Host "OK cccd=$($profile1.cccd) avatarUrl=$($profile1.avatarUrl)" -ForegroundColor Green

# 3. PUT profile bo sung field khac, KHONG doi cccd
Show-Step "PUT profile bo sung thong tin (khong doi cccd)"
$updated1 = Invoke-Api -Method Put -Path "/employees/$idEmp1/profile" -Body @{
    gender = "Nam"; primaryPhone = "0901234567"; bankName = "Vietcombank"; bankAccountNumber = "123456789"
} -Token $token -ExpectedStatus 200
if ($updated1.gender -ne "Nam") { throw "FAIL: gender khong duoc luu" }
if ($updated1.cccd -ne $cccdEmp1) { throw "FAIL: cccd bi doi trong khi khong truyen" }

# 4. GET lai kiem tra field da luu ben
Show-Step "GET lai kiem tra da luu"
$profile1b = Invoke-Api -Method Get -Path "/employees/$idEmp1/profile" -Token $token -ExpectedStatus 200
if ($profile1b.primaryPhone -ne "0901234567") { throw "FAIL: primaryPhone khong duoc giu lai" }

# 5. Tao employee2 de test conflict CCCD_ACTIVE_EXISTS khi doi cccd trong PUT profile
Show-Step "CREATE employee2 (de test conflict)"
$emp2 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = $cccdEmp2; fullName = "Emp2"; positionId = $idPos } -Token $token -ExpectedStatus 201
$idEmp2 = $emp2.id

Show-Step "PUT profile emp1 doi cccd trung voi emp2 dang ACTIVE (ky vong 409)"
Invoke-Api -Method Put -Path "/employees/$idEmp1/profile" -Body @{ cccd = $cccdEmp2 } -Token $token -ExpectedStatus 409 | Out-Null

# 6. Doi cccd emp1 sang so moi hop le -> 200, kiem tra cccdHash duoc dong bo
Show-Step "PUT profile emp1 doi sang cccd moi (ky vong 200)"
$newCccd1 = New-RandomCccd
$updatedCccd = Invoke-Api -Method Put -Path "/employees/$idEmp1/profile" -Body @{ cccd = $newCccd1 } -Token $token -ExpectedStatus 200
if ($updatedCccd.cccd -ne $newCccd1) { throw "FAIL: cccd moi khong duoc ap dung" }

# 7. CCCD cu ($cccdEmp1) gio phai duoc "tha ra" - tao employee moi voi cccd cu phai thanh cong
Show-Step "CREATE employee moi voi CCCD cu cua emp1 (ky vong 201, vi da doi sang cccd moi)"
$empReuseOld = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = $cccdEmp1; fullName = "Emp Reuse Old Cccd"; positionId = $idPos } -Token $token -ExpectedStatus 201
$idEmpReuseOld = $empReuseOld.id

# 8. Tao employee3, resign, roi test CCCD_RESIGNED_EXISTS khi PUT profile emp1 trung cccd emp3
Show-Step "CREATE employee3 + resign"
$emp3 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = $cccdEmp3; fullName = "Emp3"; positionId = $idPos } -Token $token -ExpectedStatus 201
$idEmp3 = $emp3.id
Invoke-Api -Method Patch -Path "/employees/$idEmp3/resign" -Token $token -ExpectedStatus 200 | Out-Null

Show-Step "PUT profile emp1 doi cccd trung voi emp3 da RESIGNED (ky vong 409 + details.employeeId)"
$conflictResigned = Invoke-Api -Method Put -Path "/employees/$idEmp1/profile" -Body @{ cccd = $cccdEmp3 } -Token $token -ExpectedStatus 409
if ($conflictResigned.error.details.employeeId -ne $idEmp3) { throw "FAIL: details.employeeId khong dung" }
Write-Host "OK details.employeeId=$($conflictResigned.error.details.employeeId)" -ForegroundColor Green

# 9. Validate email sai dinh dang -> 400
Show-Step "PUT profile voi email sai dinh dang (ky vong 400)"
Invoke-Api -Method Put -Path "/employees/$idEmp1/profile" -Body @{ email = "khong-phai-email" } -Token $token -ExpectedStatus 400 | Out-Null

# 10. GET/PUT profile cho employee khong ton tai -> 404
Show-Step "GET profile employee khong ton tai (ky vong 404)"
Invoke-Api -Method Get -Path "/employees/00000000-0000-0000-0000-000000000000/profile" -Token $token -ExpectedStatus 404 | Out-Null

Show-Step "PUT profile employee khong ton tai (ky vong 404)"
Invoke-Api -Method Put -Path "/employees/00000000-0000-0000-0000-000000000000/profile" -Body @{ gender = "Nam" } -Token $token -ExpectedStatus 404 | Out-Null

# 11. Don dep
Show-Step "Don dep"
Invoke-Api -Method Delete -Path "/employees/$idEmp1" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/employees/$idEmp2" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/employees/$idEmp3" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/employees/$idEmpReuseOld" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/positions/$idPos" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/departments/$idDept" -Token $token -ExpectedStatus 204 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST EMPLOYEE-PROFILE PASS" -ForegroundColor Green
