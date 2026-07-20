# Test thu toan bo flow /employees (CRUD + resign/rehire + CCCD dedup/encrypt).
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-employee.ps1
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"
$ownerEmail = "owner@ada.local"
$ownerPassword = "binh2004"

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
$deptName = "DeptEmp-$suffix"
$posName = "PosEmp-$suffix"
$cccd1 = New-RandomCccd

# 1. Chuan bi department + position that qua API
Show-Step "CREATE department + position"
$dept = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptName } -Token $token -ExpectedStatus 201
$idDept = $dept.id
$pos = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName; departmentId = $idDept } -Token $token -ExpectedStatus 201
$idPos = $pos.id

# 2. CREATE employee
Show-Step "CREATE employee"
$emp1 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = $cccd1; fullName = "Nguyen Van A"; dob = "1995-05-20"; positionId = $idPos } -Token $token -ExpectedStatus 201
$idEmp1 = $emp1.id
Write-Host "employee code=$($emp1.code) id=$idEmp1"
if (-not ($emp1.code -match "^NV\d{4}$")) { throw "FAIL: code khong dung format NVxxxx, nhan '$($emp1.code)'" }

# 3. Kiem tra EmployeeProfile.cccdEncrypted da duoc tu dong upsert
Show-Step "Kiem tra EmployeeProfile.cccdEncrypted da duoc luu"
$profileJson = npx tsx scripts/test-fixture.ts get-employee-profile $idEmp1 | Select-Object -Last 1
$profile = $profileJson | ConvertFrom-Json
if (-not $profile.cccdEncrypted) { throw "FAIL: cccdEncrypted khong duoc luu tu dong luc tao employee" }
if ($profile.cccdEncrypted -eq $cccd1) { throw "FAIL: cccdEncrypted dang luu plaintext, khong ma hoa" }
Write-Host "OK cccdEncrypted da duoc luu (khong phai plaintext)" -ForegroundColor Green

# 4. CREATE trung CCCD (dang ACTIVE) -> 409
Show-Step "CREATE trung CCCD dang ACTIVE (ky vong 409)"
Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = $cccd1; fullName = "Nguyen Van B"; positionId = $idPos } -Token $token -ExpectedStatus 409 | Out-Null

# 5. CREATE voi positionId khong ton tai -> 400
Show-Step "CREATE voi positionId khong ton tai (ky vong 400)"
Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = New-RandomCccd; fullName = "X"; positionId = "00000000-0000-0000-0000-000000000000" } -Token $token -ExpectedStatus 400 | Out-Null

# 6. LIST filter positionId, departmentId, search
Show-Step "LIST filter positionId"
$listPos = Invoke-Api -Method Get -Path "/employees?positionId=$idPos" -Token $token -ExpectedStatus 200
if ($listPos.total -lt 1) { throw "FAIL: ky vong total >= 1" }

Show-Step "LIST filter departmentId (join qua position)"
$listDept = Invoke-Api -Method Get -Path "/employees?departmentId=$idDept" -Token $token -ExpectedStatus 200
if ($listDept.total -lt 1) { throw "FAIL: ky vong total >= 1" }

Show-Step "LIST search theo code"
$listSearch = Invoke-Api -Method Get -Path "/employees?search=$($emp1.code)" -Token $token -ExpectedStatus 200
if ($listSearch.total -lt 1) { throw "FAIL: ky vong tim thay theo code" }

# 7. GET BY ID
Show-Step "GET BY ID"
$getEmp1 = Invoke-Api -Method Get -Path "/employees/$idEmp1" -Token $token -ExpectedStatus 200
if ($getEmp1.position.department.name -ne $deptName) { throw "FAIL: nested position/department khong dung" }

# 8. GET BY ID khong ton tai -> 404
Show-Step "GET BY ID khong ton tai (ky vong 404)"
Invoke-Api -Method Get -Path "/employees/00000000-0000-0000-0000-000000000000" -Token $token -ExpectedStatus 404 | Out-Null

# 9. UPDATE fullName/dob
Show-Step "UPDATE fullName"
$updated = Invoke-Api -Method Patch -Path "/employees/$idEmp1" -Body @{ fullName = "Nguyen Van A Updated" } -Token $token -ExpectedStatus 200
if ($updated.fullName -ne "Nguyen Van A Updated") { throw "FAIL: fullName khong duoc cap nhat" }

# 10. UPDATE positionId khong ton tai -> 400
Show-Step "UPDATE positionId khong ton tai (ky vong 400)"
Invoke-Api -Method Patch -Path "/employees/$idEmp1" -Body @{ positionId = "00000000-0000-0000-0000-000000000000" } -Token $token -ExpectedStatus 400 | Out-Null

# 11. UPDATE khong ton tai -> 404
Show-Step "UPDATE khong ton tai (ky vong 404)"
Invoke-Api -Method Patch -Path "/employees/00000000-0000-0000-0000-000000000000" -Body @{ fullName = "X" } -Token $token -ExpectedStatus 404 | Out-Null

# 12. RESIGN
Show-Step "RESIGN"
$resigned = Invoke-Api -Method Patch -Path "/employees/$idEmp1/resign" -Token $token -ExpectedStatus 200
if ($resigned.status -ne "RESIGNED") { throw "FAIL: status phai la RESIGNED" }

# 13. RESIGN lai -> 400 ALREADY_RESIGNED
Show-Step "RESIGN lai (ky vong 400)"
Invoke-Api -Method Patch -Path "/employees/$idEmp1/resign" -Token $token -ExpectedStatus 400 | Out-Null

# 14. CREATE nhan vien moi voi CCCD cua nguoi da RESIGNED -> 409 kem employeeId
Show-Step "CREATE trung CCCD cua nguoi da RESIGNED (ky vong 409 + details.employeeId)"
$errData = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = $cccd1; fullName = "Nguoi Khac"; positionId = $idPos } -Token $token -ExpectedStatus 409
if ($errData.error.details.employeeId -ne $idEmp1) { throw "FAIL: details.employeeId khong dung, nhan $($errData.error.details.employeeId)" }
Write-Host "OK details.employeeId=$($errData.error.details.employeeId)" -ForegroundColor Green

# 15. REHIRE khong truyen positionId -> giu nguyen vi tri cu
Show-Step "REHIRE (giu nguyen positionId)"
$rehired = Invoke-Api -Method Patch -Path "/employees/$idEmp1/rehire" -Token $token -ExpectedStatus 200
if ($rehired.status -ne "ACTIVE") { throw "FAIL: status phai la ACTIVE sau rehire" }

# 16. REHIRE lai khi da ACTIVE -> 400 NOT_RESIGNED
Show-Step "REHIRE lai khi da ACTIVE (ky vong 400)"
Invoke-Api -Method Patch -Path "/employees/$idEmp1/rehire" -Token $token -ExpectedStatus 400 | Out-Null

# 17. DELETE employee -> 204
Show-Step "DELETE employee (ky vong 204)"
Invoke-Api -Method Delete -Path "/employees/$idEmp1" -Token $token -ExpectedStatus 204 | Out-Null

# 18. DELETE lai -> 404
Show-Step "DELETE lai employee da xoa (ky vong 404)"
Invoke-Api -Method Delete -Path "/employees/$idEmp1" -Token $token -ExpectedStatus 404 | Out-Null

# 19. Don dep position + department
Show-Step "Don dep position + department"
Invoke-Api -Method Delete -Path "/positions/$idPos" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/departments/$idDept" -Token $token -ExpectedStatus 204 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST EMPLOYEE PASS" -ForegroundColor Green
