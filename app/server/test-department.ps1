# Test thu toan bo flow /departments (CRUD + 409/404 edge case).
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-department.ps1
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

# 0. LOGIN de lay access token
Show-Step "LOGIN"
$loginRes = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = $ownerEmail; password = $ownerPassword } -ExpectedStatus 200
$token = $loginRes.token

$suffix = Get-Random
$nameA = "Bep-$suffix"
$nameB = "PhucVu-$suffix"
$nameA2 = "BepMoi-$suffix"

# 1. CREATE A, B
Show-Step "CREATE department A"
$deptA = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $nameA } -Token $token -ExpectedStatus 201
$idA = $deptA.id

Show-Step "CREATE department B"
$deptB = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $nameB } -Token $token -ExpectedStatus 201
$idB = $deptB.id

# 2. CREATE trung ten -> 409
Show-Step "CREATE trung ten (ky vong 409)"
Invoke-Api -Method Post -Path "/departments" -Body @{ name = $nameA } -Token $token -ExpectedStatus 409 | Out-Null

# 3. LIST co search
Show-Step "LIST co search"
$listRes = Invoke-Api -Method Get -Path "/departments?search=$suffix&page=1&limit=20" -Token $token -ExpectedStatus 200
if ($listRes.total -lt 2) { throw "FAIL: ky vong total >= 2 nhung la $($listRes.total)" }
Write-Host "total=$($listRes.total) page=$($listRes.page) limit=$($listRes.limit)"

# 4. GET BY ID
Show-Step "GET BY ID (dept A)"
$getA = Invoke-Api -Method Get -Path "/departments/$idA" -Token $token -ExpectedStatus 200
if ($getA.name -ne $nameA) { throw "FAIL: ten khong khop" }

# 5. GET BY ID khong ton tai -> 404
Show-Step "GET BY ID khong ton tai (ky vong 404)"
Invoke-Api -Method Get -Path "/departments/00000000-0000-0000-0000-000000000000" -Token $token -ExpectedStatus 404 | Out-Null

# 6. UPDATE doi ten hop le
Show-Step "UPDATE doi ten hop le"
$updated = Invoke-Api -Method Patch -Path "/departments/$idA" -Body @{ name = $nameA2 } -Token $token -ExpectedStatus 200
if ($updated.name -ne $nameA2) { throw "FAIL: update khong ap dung ten moi" }

# 7. UPDATE doi ten trung voi B -> 409
Show-Step "UPDATE doi ten trung (ky vong 409)"
Invoke-Api -Method Patch -Path "/departments/$idA" -Body @{ name = $nameB } -Token $token -ExpectedStatus 409 | Out-Null

# 8. UPDATE khong ton tai -> 404
Show-Step "UPDATE khong ton tai (ky vong 404)"
Invoke-Api -Method Patch -Path "/departments/00000000-0000-0000-0000-000000000000" -Body @{ name = "X" } -Token $token -ExpectedStatus 404 | Out-Null

# 9. Tao Position gan voi dept B (fixture truc tiep qua Prisma vi chua co Position API)
Show-Step "Tao Position fixture cho dept B"
$positionId = (npx tsx scripts/test-fixture.ts create-position $idB | Select-Object -Last 1).Trim()
Write-Host "positionId=$positionId"

# 10. DELETE dept B khi con Position -> 409
Show-Step "DELETE dept B con Position (ky vong 409)"
Invoke-Api -Method Delete -Path "/departments/$idB" -Token $token -ExpectedStatus 409 | Out-Null

# 11. Don dep Position, roi DELETE dept B lai -> 204
Show-Step "Xoa Position fixture"
npx tsx scripts/test-fixture.ts delete-position $positionId | Out-Null

Show-Step "DELETE dept B sau khi het Position (ky vong 204)"
Invoke-Api -Method Delete -Path "/departments/$idB" -Token $token -ExpectedStatus 204 | Out-Null

# 12. DELETE dept A (khong co Position) -> 204
Show-Step "DELETE dept A (ky vong 204)"
Invoke-Api -Method Delete -Path "/departments/$idA" -Token $token -ExpectedStatus 204 | Out-Null

# 13. DELETE lai dept A da xoa -> 404
Show-Step "DELETE lai dept A da xoa (ky vong 404)"
Invoke-Api -Method Delete -Path "/departments/$idA" -Token $token -ExpectedStatus 404 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST DEPARTMENT PASS" -ForegroundColor Green
