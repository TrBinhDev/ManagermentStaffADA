# Test thu toan bo flow /positions (CRUD + unique theo department + 409/404/400).
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-position.ps1
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

# 0. LOGIN
Show-Step "LOGIN"
$loginRes = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = $ownerEmail; password = $ownerPassword } -ExpectedStatus 200
$token = $loginRes.token

$suffix = Get-Random
$deptXName = "DeptX-$suffix"
$deptYName = "DeptY-$suffix"
$posName = "TruongCa-$suffix"

# 1. Tao 2 department qua API that
Show-Step "CREATE department X, Y"
$deptX = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptXName } -Token $token -ExpectedStatus 201
$deptY = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptYName } -Token $token -ExpectedStatus 201
$idDeptX = $deptX.id
$idDeptY = $deptY.id

# 2. Tao position P1 ten posName trong deptX
Show-Step "CREATE position P1 (deptX)"
$p1 = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName; departmentId = $idDeptX } -Token $token -ExpectedStatus 201
$idP1 = $p1.id

# 3. Tao position P2 CUNG TEN posName nhung o deptY -> phai thanh cong (unique theo tung department)
Show-Step "CREATE position P2 cung ten nhung khac department (ky vong 201)"
$p2 = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName; departmentId = $idDeptY } -Token $token -ExpectedStatus 201
$idP2 = $p2.id

# 4. Tao lai posName trong deptX -> 409 (trung trong cung department)
Show-Step "CREATE trung ten trong cung department (ky vong 409)"
Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName; departmentId = $idDeptX } -Token $token -ExpectedStatus 409 | Out-Null

# 5. Tao voi departmentId khong ton tai -> 400
Show-Step "CREATE voi departmentId khong ton tai (ky vong 400)"
Invoke-Api -Method Post -Path "/positions" -Body @{ name = "X"; departmentId = "00000000-0000-0000-0000-000000000000" } -Token $token -ExpectedStatus 400 | Out-Null

# 6. Tao position P3 ten khac trong deptX
Show-Step "CREATE position P3 (deptX)"
$p3 = Invoke-Api -Method Post -Path "/positions" -Body @{ name = "NhanVien-$suffix"; departmentId = $idDeptX } -Token $token -ExpectedStatus 201
$idP3 = $p3.id

# 7. LIST filter theo departmentId=deptX -> ky vong total=2 (P1, P3)
Show-Step "LIST filter departmentId=deptX"
$listX = Invoke-Api -Method Get -Path "/positions?departmentId=$idDeptX" -Token $token -ExpectedStatus 200
if ($listX.total -ne 2) { throw "FAIL: ky vong total=2 nhung la $($listX.total)" }
Write-Host "total=$($listX.total)"

# 8. LIST search theo posName -> ky vong total=2 (P1 + P2, khac department)
Show-Step "LIST search=$posName"
$listSearch = Invoke-Api -Method Get -Path "/positions?search=$posName" -Token $token -ExpectedStatus 200
if ($listSearch.total -ne 2) { throw "FAIL: ky vong total=2 nhung la $($listSearch.total)" }
Write-Host "total=$($listSearch.total)"

# 9. GET BY ID P1, kiem tra department long vao
Show-Step "GET BY ID P1"
$getP1 = Invoke-Api -Method Get -Path "/positions/$idP1" -Token $token -ExpectedStatus 200
if ($getP1.department.name -ne $deptXName) { throw "FAIL: department long vao khong dung" }

# 10. GET BY ID khong ton tai -> 404
Show-Step "GET BY ID khong ton tai (ky vong 404)"
Invoke-Api -Method Get -Path "/positions/00000000-0000-0000-0000-000000000000" -Token $token -ExpectedStatus 404 | Out-Null

# 11. UPDATE P3 doi ten trung voi P1 (cung deptX) -> 409
Show-Step "UPDATE P3 doi ten trung P1 cung department (ky vong 409)"
Invoke-Api -Method Patch -Path "/positions/$idP3" -Body @{ name = $posName } -Token $token -ExpectedStatus 409 | Out-Null

# 12. UPDATE P3 doi ten hop le
Show-Step "UPDATE P3 doi ten hop le"
$newP3Name = "PhoBep-$suffix"
$updatedP3 = Invoke-Api -Method Patch -Path "/positions/$idP3" -Body @{ name = $newP3Name } -Token $token -ExpectedStatus 200
if ($updatedP3.name -ne $newP3Name) { throw "FAIL: ten P3 khong duoc cap nhat" }

# 13. UPDATE P3 chuyen sang deptY (khong trung ten voi P2 vi P3 gio la PhoBep) -> 200
Show-Step "UPDATE P3 chuyen sang deptY (ky vong 200)"
$movedP3 = Invoke-Api -Method Patch -Path "/positions/$idP3" -Body @{ departmentId = $idDeptY } -Token $token -ExpectedStatus 200
if ($movedP3.department.name -ne $deptYName) { throw "FAIL: department cua P3 khong duoc cap nhat" }

# 14. UPDATE P3 sang departmentId khong ton tai -> 400
Show-Step "UPDATE departmentId khong ton tai (ky vong 400)"
Invoke-Api -Method Patch -Path "/positions/$idP3" -Body @{ departmentId = "00000000-0000-0000-0000-000000000000" } -Token $token -ExpectedStatus 400 | Out-Null

# 15. UPDATE khong ton tai -> 404
Show-Step "UPDATE khong ton tai (ky vong 404)"
Invoke-Api -Method Patch -Path "/positions/00000000-0000-0000-0000-000000000000" -Body @{ name = "X" } -Token $token -ExpectedStatus 404 | Out-Null

# 16. Tao Employee fixture gan voi P1 de test DELETE bi chan (module employee chua code)
Show-Step "Tao Employee fixture cho P1"
$employeeId = (npx tsx scripts/test-fixture.ts create-employee $idP1 | Select-Object -Last 1).Trim()
Write-Host "employeeId=$employeeId"

Show-Step "DELETE P1 con Employee (ky vong 409)"
Invoke-Api -Method Delete -Path "/positions/$idP1" -Token $token -ExpectedStatus 409 | Out-Null

Show-Step "Xoa Employee fixture"
npx tsx scripts/test-fixture.ts delete-employee $employeeId | Out-Null

Show-Step "DELETE P1 sau khi het Employee (ky vong 204)"
Invoke-Api -Method Delete -Path "/positions/$idP1" -Token $token -ExpectedStatus 204 | Out-Null

# 17. Don dep: xoa P2, P3, deptX, deptY
Show-Step "Don dep P2, P3, deptX, deptY"
Invoke-Api -Method Delete -Path "/positions/$idP2" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/positions/$idP3" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/departments/$idDeptX" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/departments/$idDeptY" -Token $token -ExpectedStatus 204 | Out-Null

# 18. DELETE lai P1 da xoa -> 404
Show-Step "DELETE lai P1 da xoa (ky vong 404)"
Invoke-Api -Method Delete -Path "/positions/$idP1" -Token $token -ExpectedStatus 404 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST POSITION PASS" -ForegroundColor Green
