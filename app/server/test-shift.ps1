# Test thu toan bo flow /shifts (CRUD + unique name + validate HH:MM + isActive filter +
# chan xoa cung khi da co WorkSchedule).
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-shift.ps1
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
$shiftName = "CaSang-$suffix"

# 1. CREATE hop le
Show-Step "CREATE shift hop le"
$shift1 = Invoke-Api -Method Post -Path "/shifts" -Body @{ name = $shiftName; startTime = "06:00"; endTime = "14:00" } -Token $token -ExpectedStatus 201
$id1 = $shift1.id
if ($shift1.isActive -ne $true) { throw "FAIL: isActive phai mac dinh true" }

# 2. CREATE trung ten -> 409
Show-Step "CREATE trung ten (ky vong 409)"
Invoke-Api -Method Post -Path "/shifts" -Body @{ name = $shiftName; startTime = "07:00"; endTime = "15:00" } -Token $token -ExpectedStatus 409 | Out-Null

# 3. CREATE gio sai dinh dang -> 400
Show-Step "CREATE startTime sai dinh dang (ky vong 400)"
Invoke-Api -Method Post -Path "/shifts" -Body @{ name = "X-$suffix"; startTime = "6:00"; endTime = "14:00" } -Token $token -ExpectedStatus 400 | Out-Null

Show-Step "CREATE endTime sai dinh dang (ky vong 400)"
Invoke-Api -Method Post -Path "/shifts" -Body @{ name = "Y-$suffix"; startTime = "06:00"; endTime = "25:00" } -Token $token -ExpectedStatus 400 | Out-Null

# 4. CREATE ca qua dem (endTime < startTime) -> van phai hop le (khong bi chan)
Show-Step "CREATE ca qua dem 22:00->06:00 (ky vong 201, khong bi chan)"
$overnightName = "CaDem-$suffix"
$shiftOvernight = Invoke-Api -Method Post -Path "/shifts" -Body @{ name = $overnightName; startTime = "22:00"; endTime = "06:00" } -Token $token -ExpectedStatus 201
$idOvernight = $shiftOvernight.id

# 5. GET BY ID
Show-Step "GET BY ID"
Invoke-Api -Method Get -Path "/shifts/$id1" -Token $token -ExpectedStatus 200 | Out-Null

Show-Step "GET BY ID khong ton tai (ky vong 404)"
Invoke-Api -Method Get -Path "/shifts/00000000-0000-0000-0000-000000000000" -Token $token -ExpectedStatus 404 | Out-Null

# 6. UPDATE doi gio + isActive=false
Show-Step "UPDATE doi gio hop le"
$updated = Invoke-Api -Method Patch -Path "/shifts/$id1" -Body @{ startTime = "05:30" } -Token $token -ExpectedStatus 200
if ($updated.startTime -ne "05:30") { throw "FAIL: startTime khong duoc cap nhat" }

Show-Step "UPDATE isActive=false"
$deactivated = Invoke-Api -Method Patch -Path "/shifts/$id1" -Body @{ isActive = $false } -Token $token -ExpectedStatus 200
if ($deactivated.isActive -ne $false) { throw "FAIL: isActive khong duoc cap nhat" }

Show-Step "UPDATE gio sai dinh dang (ky vong 400)"
Invoke-Api -Method Patch -Path "/shifts/$id1" -Body @{ startTime = "99:99" } -Token $token -ExpectedStatus 400 | Out-Null

Show-Step "UPDATE khong ton tai (ky vong 404)"
Invoke-Api -Method Patch -Path "/shifts/00000000-0000-0000-0000-000000000000" -Body @{ name = "X" } -Token $token -ExpectedStatus 404 | Out-Null

# 7. LIST filter isActive=false -> phai co id1
Show-Step "LIST filter isActive=false"
$listInactive = Invoke-Api -Method Get -Path "/shifts?isActive=false" -Token $token -ExpectedStatus 200
$found = $listInactive.data | Where-Object { $_.id -eq $id1 }
if ($null -eq $found) { throw "FAIL: khong tim thay shift da an trong filter isActive=false" }

# 8. Bat lai isActive=true de tiep tuc test xoa
Invoke-Api -Method Patch -Path "/shifts/$id1" -Body @{ isActive = $true } -Token $token -ExpectedStatus 200 | Out-Null

# 9. DELETE bi chan boi WorkSchedule se duoc test lai trong test-work-schedule.ps1 (buoc 5),
# luc do moi co API that de tao WorkSchedule. O day chi test DELETE binh thuong khi chua dung lan nao.
Show-Step "DELETE shift chua dung lan nao (ky vong 204)"
Invoke-Api -Method Delete -Path "/shifts/$idOvernight" -Token $token -ExpectedStatus 204 | Out-Null

Show-Step "Don dep id1"
Invoke-Api -Method Delete -Path "/shifts/$id1" -Token $token -ExpectedStatus 204 | Out-Null

Show-Step "DELETE lai id1 da xoa (ky vong 404)"
Invoke-Api -Method Delete -Path "/shifts/$id1" -Token $token -ExpectedStatus 404 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST SHIFT PASS" -ForegroundColor Green
