# Test thu toan bo flow /shifts/:id/capacities (CRUD, unique (shiftId,positionId),
# 404 khong ton tai, capacityId cheo shift khac bi tu choi).
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-shift-position-capacity.ps1
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
$deptName = "CapDept-$suffix"
$posName1 = "CapPos1-$suffix"
$posName2 = "CapPos2-$suffix"
$shiftName = "CapShift-$suffix"
$shiftName2 = "CapShift2-$suffix"

# 1. Fixtures: department, 2 position, 2 shift
Show-Step "CREATE fixtures (department, 2 position, 2 shift)"
$dept = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptName } -Token $token -ExpectedStatus 201
$pos1 = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName1; departmentId = $dept.id } -Token $token -ExpectedStatus 201
$pos2 = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName2; departmentId = $dept.id } -Token $token -ExpectedStatus 201
$shift1 = Invoke-Api -Method Post -Path "/shifts" -Body @{ name = $shiftName; startTime = "06:00"; endTime = "14:00" } -Token $token -ExpectedStatus 201
$shift2 = Invoke-Api -Method Post -Path "/shifts" -Body @{ name = $shiftName2; startTime = "14:00"; endTime = "22:00" } -Token $token -ExpectedStatus 201

# 2. GET capacities cua shift1 -> rong
Show-Step "GET capacities (shift1 moi, ky vong rong)"
$emptyList = Invoke-Api -Method Get -Path "/shifts/$($shift1.id)/capacities" -Token $token -ExpectedStatus 200
if ($emptyList.Count -ne 0) { throw "FAIL: ky vong rong nhung co $($emptyList.Count) dong" }

# 3. GET capacities cua shift khong ton tai -> 404
Show-Step "GET capacities shift khong ton tai (ky vong 404)"
Invoke-Api -Method Get -Path "/shifts/00000000-0000-0000-0000-000000000000/capacities" -Token $token -ExpectedStatus 404 | Out-Null

# 4. POST capacity hop le
Show-Step "POST capacity (pos1, maxStaff=3)"
$cap1 = Invoke-Api -Method Post -Path "/shifts/$($shift1.id)/capacities" -Body @{ positionId = $pos1.id; maxStaff = 3 } -Token $token -ExpectedStatus 201
if ($cap1.position.name -ne $posName1) { throw "FAIL: position long vao khong dung" }

# 5. POST trung cap (shiftId, positionId) -> 409
Show-Step "POST trung cap shift+position (ky vong 409)"
Invoke-Api -Method Post -Path "/shifts/$($shift1.id)/capacities" -Body @{ positionId = $pos1.id; maxStaff = 5 } -Token $token -ExpectedStatus 409 | Out-Null

# 6. POST voi positionId khong ton tai -> 404
Show-Step "POST positionId khong ton tai (ky vong 404)"
Invoke-Api -Method Post -Path "/shifts/$($shift1.id)/capacities" -Body @{ positionId = "00000000-0000-0000-0000-000000000000"; maxStaff = 2 } -Token $token -ExpectedStatus 404 | Out-Null

# 7. POST maxStaff=0 -> 400
Show-Step "POST maxStaff=0 (ky vong 400)"
Invoke-Api -Method Post -Path "/shifts/$($shift1.id)/capacities" -Body @{ positionId = $pos2.id; maxStaff = 0 } -Token $token -ExpectedStatus 400 | Out-Null

# 8. POST cap thu 2 (pos2) cho shift1 -> 201
Show-Step "POST capacity thu 2 (pos2, maxStaff=2)"
$cap2 = Invoke-Api -Method Post -Path "/shifts/$($shift1.id)/capacities" -Body @{ positionId = $pos2.id; maxStaff = 2 } -Token $token -ExpectedStatus 201

# 9. GET list -> 2 dong
Show-Step "GET capacities shift1 sau 2 lan POST (ky vong 2 dong)"
$list2 = Invoke-Api -Method Get -Path "/shifts/$($shift1.id)/capacities" -Token $token -ExpectedStatus 200
if ($list2.Count -ne 2) { throw "FAIL: ky vong 2 dong nhung co $($list2.Count)" }

# 10. PATCH maxStaff cua cap1
Show-Step "PATCH capacity cap1 doi maxStaff=10"
$updatedCap1 = Invoke-Api -Method Patch -Path "/shifts/$($shift1.id)/capacities/$($cap1.id)" -Body @{ maxStaff = 10 } -Token $token -ExpectedStatus 200
if ($updatedCap1.maxStaff -ne 10) { throw "FAIL: maxStaff khong duoc cap nhat" }

# 11. PATCH capacityId khong ton tai -> 404
Show-Step "PATCH capacityId khong ton tai (ky vong 404)"
Invoke-Api -Method Patch -Path "/shifts/$($shift1.id)/capacities/00000000-0000-0000-0000-000000000000" -Body @{ maxStaff = 5 } -Token $token -ExpectedStatus 404 | Out-Null

# 12. PATCH capacityId cua cap1 nhung qua shift2 (sai shift trong URL) -> 404
Show-Step "PATCH cap1 qua shift2 (sai shift, ky vong 404)"
Invoke-Api -Method Patch -Path "/shifts/$($shift2.id)/capacities/$($cap1.id)" -Body @{ maxStaff = 5 } -Token $token -ExpectedStatus 404 | Out-Null

# 13. DELETE cap2
Show-Step "DELETE cap2 (ky vong 204)"
Invoke-Api -Method Delete -Path "/shifts/$($shift1.id)/capacities/$($cap2.id)" -Token $token -ExpectedStatus 204 | Out-Null

Show-Step "GET list sau khi xoa cap2 (ky vong 1 dong)"
# @(...) bat buoc vi ConvertFrom-Json "unwrap" mang JSON chi co 1 phan tu thanh object don,
# khong con la mang nen .Count se rong neu khong ep lai thanh mang.
$list1 = @(Invoke-Api -Method Get -Path "/shifts/$($shift1.id)/capacities" -Token $token -ExpectedStatus 200)
if ($list1.Count -ne 1) { throw "FAIL: ky vong 1 dong nhung co $($list1.Count)" }

# 14. DELETE shift1 -> capacities con lai (cap1) tu dong bi Cascade xoa theo (khong bi chan)
Show-Step "DELETE shift1 (con capacity, ky vong 204 - Cascade tu dong don)"
Invoke-Api -Method Delete -Path "/shifts/$($shift1.id)" -Token $token -ExpectedStatus 204 | Out-Null

# 15. Don dep
Show-Step "Don dep"
Invoke-Api -Method Delete -Path "/shifts/$($shift2.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/positions/$($pos1.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/positions/$($pos2.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/departments/$($dept.id)" -Token $token -ExpectedStatus 204 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST SHIFT-POSITION-CAPACITY PASS" -ForegroundColor Green
