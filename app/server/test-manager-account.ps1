# Test thu toan bo flow /manager-accounts (CRUD + khoa tai khoan force-logout qua Redis
# + reset-password force-logout + chan sua OWNER + phan quyen [OWNER] only).
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-manager-account.ps1
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

function Login-As {
    param([string]$Email, [string]$Password, [int]$ExpectedStatus = 200)
    $body = @{ email = $Email; password = $Password } | ConvertTo-Json
    try {
        $resp = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json" -SessionVariable session -UseBasicParsing
        $status = [int]$resp.StatusCode
        $data = $resp.Content | ConvertFrom-Json
    } catch {
        $status = [int]$_.Exception.Response.StatusCode.value__
        $data = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message | ConvertFrom-Json } else { $null }
        $session = $null
    }
    if ($status -ne $ExpectedStatus) { throw "FAIL LOGIN $Email : ky vong $ExpectedStatus nhung nhan $status" }
    Write-Host "OK  LOGIN $Email -> $status" -ForegroundColor Green
    return @{ Token = $data.token; Session = $session }
}

function Try-Refresh {
    param($Session)
    try {
        $resp = Invoke-WebRequest -Uri "$baseUrl/auth/refresh" -Method Post -WebSession $Session -UseBasicParsing
        return [int]$resp.StatusCode
    } catch {
        return [int]$_.Exception.Response.StatusCode.value__
    }
}

function New-RandomCccd {
    -join ((0..11) | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 })
}

# 0. LOGIN OWNER
Show-Step "LOGIN OWNER"
$ownerToken = (Login-As -Email $ownerEmail -Password $ownerPassword).Token

$suffix = Get-Random
$deptName = "DeptMgr-$suffix"
$posName = "PosMgr-$suffix"
$acc1Email = "manager1-$suffix@ada.local"
$acc1Password = "Manager@123"
$acc2Email = "manager2-$suffix@ada.local"
$acc2Password = "Manager@123"
$acc3Email = "manager3-$suffix@ada.local"
$acc3Password = "Manager@123"

# 1. Chuan bi department + position + 2 employee (1 ACTIVE, 1 se RESIGNED)
Show-Step "CREATE department + position + employee1 (ACTIVE) + employee2 (se resign)"
$dept = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptName } -Token $ownerToken -ExpectedStatus 201
$idDept = $dept.id
$pos = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName; departmentId = $idDept } -Token $ownerToken -ExpectedStatus 201
$idPos = $pos.id
$emp1 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = New-RandomCccd; fullName = "Emp Active For Mgr"; positionId = $idPos } -Token $ownerToken -ExpectedStatus 201
$idEmp1 = $emp1.id
$emp2 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = New-RandomCccd; fullName = "Emp Resigned For Mgr"; positionId = $idPos } -Token $ownerToken -ExpectedStatus 201
$idEmp2 = $emp2.id
Invoke-Api -Method Patch -Path "/employees/$idEmp2/resign" -Token $ownerToken -ExpectedStatus 200 | Out-Null

# 2. CREATE acc1 (gan voi emp1 dang ACTIVE)
Show-Step "CREATE acc1 gan voi employee1 ACTIVE (ky vong 201)"
$acc1 = Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = $acc1Email; password = $acc1Password; role = "MANAGER"; employeeId = $idEmp1 } -Token $ownerToken -ExpectedStatus 201
$idAcc1 = $acc1.id
if ($acc1.employee.fullName -ne "Emp Active For Mgr") { throw "FAIL: employee.fullName khong dung trong response" }

# 3. CREATE trung email -> 409
Show-Step "CREATE trung email (ky vong 409)"
Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = $acc1Email; password = "Xyz@1234"; role = "MANAGER" } -Token $ownerToken -ExpectedStatus 409 | Out-Null

# 4. CREATE password yeu -> 400
Show-Step "CREATE password yeu (ky vong 400)"
Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = "weak-$suffix@ada.local"; password = "123"; role = "MANAGER" } -Token $ownerToken -ExpectedStatus 400 | Out-Null

# 5. CREATE voi role khac MANAGER -> 400 (zod literal chan)
Show-Step "CREATE voi role=OWNER (ky vong 400, zod chan)"
Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = "hacker-$suffix@ada.local"; password = "Abc@1234"; role = "OWNER" } -Token $ownerToken -ExpectedStatus 400 | Out-Null

# 6. CREATE voi employeeId khong ton tai -> 400
Show-Step "CREATE voi employeeId khong ton tai (ky vong 400)"
Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = "x1-$suffix@ada.local"; password = "Abc@1234"; role = "MANAGER"; employeeId = "00000000-0000-0000-0000-000000000000" } -Token $ownerToken -ExpectedStatus 400 | Out-Null

# 7. CREATE voi employeeId da RESIGNED -> 400
Show-Step "CREATE voi employeeId da RESIGNED (ky vong 400)"
Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = "x2-$suffix@ada.local"; password = "Abc@1234"; role = "MANAGER"; employeeId = $idEmp2 } -Token $ownerToken -ExpectedStatus 400 | Out-Null

# 8. CREATE voi employeeId da co tai khoan khac (emp1 da gan acc1) -> 409
Show-Step "CREATE voi employeeId da co tai khoan (ky vong 409)"
Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = "x3-$suffix@ada.local"; password = "Abc@1234"; role = "MANAGER"; employeeId = $idEmp1 } -Token $ownerToken -ExpectedStatus 409 | Out-Null

# 9. CREATE acc2, acc3 (khong gan employee)
Show-Step "CREATE acc2, acc3 (khong gan employee)"
$acc2 = Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = $acc2Email; password = $acc2Password; role = "MANAGER" } -Token $ownerToken -ExpectedStatus 201
$idAcc2 = $acc2.id
$acc3 = Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = $acc3Email; password = $acc3Password; role = "MANAGER" } -Token $ownerToken -ExpectedStatus 201
$idAcc3 = $acc3.id

# 10. LIST filter role=MANAGER, isActive=true
Show-Step "LIST filter role=MANAGER&isActive=true"
$list1 = Invoke-Api -Method Get -Path "/manager-accounts?role=MANAGER&isActive=true" -Token $ownerToken -ExpectedStatus 200
if ($list1.total -lt 3) { throw "FAIL: ky vong total >= 3, nhan $($list1.total)" }

# 11. GET BY ID acc1
Show-Step "GET BY ID acc1"
$getAcc1 = Invoke-Api -Method Get -Path "/manager-accounts/$idAcc1" -Token $ownerToken -ExpectedStatus 200
if ($getAcc1.email -ne $acc1Email) { throw "FAIL: email khong dung" }

# 12. GET BY ID khong ton tai -> 404
Show-Step "GET BY ID khong ton tai (ky vong 404)"
Invoke-Api -Method Get -Path "/manager-accounts/00000000-0000-0000-0000-000000000000" -Token $ownerToken -ExpectedStatus 404 | Out-Null

# 13. Test authorize('OWNER') - dang nhap bang acc3 (MANAGER), goi endpoint nay phai bi 403
Show-Step "MANAGER (acc3) goi GET /manager-accounts (ky vong 403)"
$acc3Login = Login-As -Email $acc3Email -Password $acc3Password
$forbidden = Invoke-Api -Method Get -Path "/manager-accounts" -Token $acc3Login.Token -ExpectedStatus 403
Write-Host "OK 403 FORBIDDEN nhu ky vong" -ForegroundColor Green

# 14. Khoa acc1 (isActive=false) va kiem tra force-logout qua Redis session
Show-Step "LOGIN acc1 truoc khi bi khoa (de lay refresh session)"
$acc1Login = Login-As -Email $acc1Email -Password $acc1Password

Show-Step "OWNER khoa acc1 (isActive=false)"
$locked = Invoke-Api -Method Patch -Path "/manager-accounts/$idAcc1" -Body @{ isActive = $false } -Token $ownerToken -ExpectedStatus 200
if ($locked.isActive -ne $false) { throw "FAIL: isActive khong duoc cap nhat thanh false" }

Show-Step "Refresh bang session acc1 sau khi bi khoa (ky vong 401, session Redis da bi xoa)"
$refreshStatus = Try-Refresh -Session $acc1Login.Session
if ($refreshStatus -ne 401) { throw "FAIL: ky vong 401 sau khi khoa tai khoan nhung nhan $refreshStatus" }
Write-Host "OK refresh bi tu choi (401) - force-logout hoat dong dung" -ForegroundColor Green

Show-Step "LOGIN lai acc1 sau khi bi khoa (ky vong 401, tai khoan da khoa)"
Login-As -Email $acc1Email -Password $acc1Password -ExpectedStatus 401 | Out-Null

# 15. Doi email acc2, kiem tra trung email
Show-Step "PATCH doi email acc2"
$newAcc2Email = "manager2-updated-$suffix@ada.local"
$updatedAcc2 = Invoke-Api -Method Patch -Path "/manager-accounts/$idAcc2" -Body @{ email = $newAcc2Email } -Token $ownerToken -ExpectedStatus 200
if ($updatedAcc2.email -ne $newAcc2Email) { throw "FAIL: email khong duoc cap nhat" }

Show-Step "PATCH doi email acc2 trung voi acc3 (ky vong 409)"
Invoke-Api -Method Patch -Path "/manager-accounts/$idAcc2" -Body @{ email = $acc3Email } -Token $ownerToken -ExpectedStatus 409 | Out-Null

# 16. Reset password acc2 va kiem tra force-logout + dang nhap bang mat khau moi
Show-Step "LOGIN acc2 truoc khi reset password (de lay refresh session cu)"
$acc2LoginOld = Login-As -Email $newAcc2Email -Password $acc2Password

Show-Step "OWNER reset password acc2"
$newAcc2Password = "NewManager@456"
Invoke-Api -Method Patch -Path "/manager-accounts/$idAcc2/reset-password" -Body @{ newPassword = $newAcc2Password } -Token $ownerToken -ExpectedStatus 200 | Out-Null

Show-Step "Refresh bang session cu acc2 sau reset-password (ky vong 401)"
$refreshStatus2 = Try-Refresh -Session $acc2LoginOld.Session
if ($refreshStatus2 -ne 401) { throw "FAIL: ky vong 401 sau reset-password nhung nhan $refreshStatus2" }
Write-Host "OK session cu bi vo hieu sau reset-password" -ForegroundColor Green

Show-Step "LOGIN acc2 bang mat khau cu (ky vong 401)"
Login-As -Email $newAcc2Email -Password $acc2Password -ExpectedStatus 401 | Out-Null

Show-Step "LOGIN acc2 bang mat khau moi (ky vong 200)"
Login-As -Email $newAcc2Email -Password $newAcc2Password -ExpectedStatus 200 | Out-Null

# 17. Chan sua/xoa OWNER
Show-Step "Lay id cua OWNER qua /auth/me"
$ownerMe = Invoke-Api -Method Get -Path "/auth/me" -Token $ownerToken -ExpectedStatus 200
$idOwner = $ownerMe.id

Show-Step "PATCH OWNER isActive=false (ky vong 400 CANNOT_MODIFY_OWNER)"
Invoke-Api -Method Patch -Path "/manager-accounts/$idOwner" -Body @{ isActive = $false } -Token $ownerToken -ExpectedStatus 400 | Out-Null

Show-Step "RESET-PASSWORD OWNER (ky vong 400)"
Invoke-Api -Method Patch -Path "/manager-accounts/$idOwner/reset-password" -Body @{ newPassword = "Whatever@123" } -Token $ownerToken -ExpectedStatus 400 | Out-Null

Show-Step "DELETE OWNER (ky vong 400)"
Invoke-Api -Method Delete -Path "/manager-accounts/$idOwner" -Token $ownerToken -ExpectedStatus 400 | Out-Null

# 18. DELETE acc1, acc2, acc3
Show-Step "DELETE acc1 (da bi khoa, van xoa duoc, ky vong 204)"
Invoke-Api -Method Delete -Path "/manager-accounts/$idAcc1" -Token $ownerToken -ExpectedStatus 204 | Out-Null

Show-Step "DELETE lai acc1 (ky vong 404)"
Invoke-Api -Method Delete -Path "/manager-accounts/$idAcc1" -Token $ownerToken -ExpectedStatus 404 | Out-Null

Invoke-Api -Method Delete -Path "/manager-accounts/$idAcc2" -Token $ownerToken -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/manager-accounts/$idAcc3" -Token $ownerToken -ExpectedStatus 204 | Out-Null

# 19. Don dep employee/position/department
Show-Step "Don dep employee/position/department"
Invoke-Api -Method Delete -Path "/employees/$idEmp1" -Token $ownerToken -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/employees/$idEmp2" -Token $ownerToken -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/positions/$idPos" -Token $ownerToken -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/departments/$idDept" -Token $ownerToken -ExpectedStatus 204 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST MANAGER-ACCOUNT PASS" -ForegroundColor Green
