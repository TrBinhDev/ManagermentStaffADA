# Test thu toan bo flow work-schedule: bulk create (created/rejected theo maxStaff),
# idempotent khi bam lai ngay da xep, PATCH doi ca (co block khi day), DELETE, chan nhan
# vien da nghi viec, GET theo thang (rieng nhan vien + tong hop toan nha hang).
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-work-schedule.ps1
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"
$ownerEmail = "owner@ada.local"
$ownerPassword = "binh2004"

function Show-Step($title) {
    Write-Host ""
    Write-Host "== $title ==" -ForegroundColor Cyan
}

function New-RandomCccd {
    -join ((0..11) | ForEach-Object { Get-Random -Minimum 0 -Maximum 10 })
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
$deptName = "WsDept-$suffix"
$posName = "WsPos-$suffix"
$shift1Name = "WsShift1-$suffix"
$shift2Name = "WsShift2-$suffix"

# Chon ngay co dinh giua thang sau de tranh lech thang khi cong don ngay (day10..day13).
$today = Get-Date
$nextMonth = $today.AddMonths(1)
$baseDate = Get-Date -Year $nextMonth.Year -Month $nextMonth.Month -Day 10
$dayA = $baseDate.ToString("yyyy-MM-dd")
$dayB = $baseDate.AddDays(1).ToString("yyyy-MM-dd")
$dayC = $baseDate.AddDays(2).ToString("yyyy-MM-dd")
$dayD = $baseDate.AddDays(3).ToString("yyyy-MM-dd")
$queryMonth = $baseDate.Month
$queryYear = $baseDate.Year

# 1. Fixtures
Show-Step "CREATE fixtures (department, position, 2 shift)"
$dept = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptName } -Token $token -ExpectedStatus 201
$pos = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName; departmentId = $dept.id } -Token $token -ExpectedStatus 201
$shift1 = Invoke-Api -Method Post -Path "/shifts" -Body @{ name = $shift1Name; startTime = "06:00"; endTime = "14:00" } -Token $token -ExpectedStatus 201
$shift2 = Invoke-Api -Method Post -Path "/shifts" -Body @{ name = $shift2Name; startTime = "14:00"; endTime = "22:00" } -Token $token -ExpectedStatus 201

Show-Step "CREATE capacity shift1+pos maxStaff=1 (shift2 khong gioi han)"
Invoke-Api -Method Post -Path "/shifts/$($shift1.id)/capacities" -Body @{ positionId = $pos.id; maxStaff = 1 } -Token $token -ExpectedStatus 201 | Out-Null

Show-Step "CREATE 3 employee (emp1, emp2 ACTIVE cung vi tri, emp3 se resign)"
$emp1 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = (New-RandomCccd); fullName = "WS Emp1"; positionId = $pos.id } -Token $token -ExpectedStatus 201
$emp2 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = (New-RandomCccd); fullName = "WS Emp2"; positionId = $pos.id } -Token $token -ExpectedStatus 201
$emp3 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = (New-RandomCccd); fullName = "WS Emp3"; positionId = $pos.id } -Token $token -ExpectedStatus 201
Invoke-Api -Method Patch -Path "/employees/$($emp3.id)/resign" -Token $token -ExpectedStatus 200 | Out-Null

# 2. GET work-schedule nhan vien moi -> rong
Show-Step "GET work-schedule emp1 truoc khi xep (ky vong rong)"
$emptyList = Invoke-Api -Method Get -Path "/employees/$($emp1.id)/work-schedule?month=$queryMonth&year=$queryYear" -Token $token -ExpectedStatus 200
if ($emptyList.Count -ne 0) { throw "FAIL: ky vong rong nhung co $($emptyList.Count) dong" }

# 3. Bulk create cho nhan vien da nghi viec -> 400
Show-Step "POST bulk cho emp3 da nghi viec (ky vong 400)"
Invoke-Api -Method Post -Path "/employees/$($emp3.id)/work-schedule/bulk" -Body @{ shiftId = $shift1.id; workDates = @($dayA) } -Token $token -ExpectedStatus 400 | Out-Null

# 4. Bulk create emp1: dayA, dayB tren shift1 (capacity 1, chua ai xep) -> ca 2 deu created
Show-Step "POST bulk emp1: dayA+dayB tren shift1 (ky vong ca 2 created)"
$bulk1 = Invoke-Api -Method Post -Path "/employees/$($emp1.id)/work-schedule/bulk" -Body @{ shiftId = $shift1.id; workDates = @($dayA, $dayB) } -Token $token -ExpectedStatus 201
if ($bulk1.created.Count -ne 2) { throw "FAIL: ky vong 2 created nhung co $($bulk1.created.Count)" }
if ($bulk1.rejected.Count -ne 0) { throw "FAIL: ky vong 0 rejected nhung co $($bulk1.rejected.Count)" }

# 5. Bulk create lai CHINH XAC dayA cho emp1 (da xep roi) -> idempotent, van la created
Show-Step "POST bulk emp1 lai dayA (da xep, ky vong idempotent = created)"
$bulk1Again = Invoke-Api -Method Post -Path "/employees/$($emp1.id)/work-schedule/bulk" -Body @{ shiftId = $shift1.id; workDates = @($dayA) } -Token $token -ExpectedStatus 201
if ($bulk1Again.created.Count -ne 1) { throw "FAIL: ky vong idempotent created=1" }

# 6. Bulk create emp2: dayA tren shift1 -> da day (emp1 chiem mat 1/1) -> rejected
Show-Step "POST bulk emp2: dayA tren shift1 da day boi emp1 (ky vong rejected)"
$bulk2 = Invoke-Api -Method Post -Path "/employees/$($emp2.id)/work-schedule/bulk" -Body @{ shiftId = $shift1.id; workDates = @($dayA) } -Token $token -ExpectedStatus 201
if ($bulk2.rejected.Count -ne 1 -or $bulk2.rejected[0] -ne $dayA) { throw "FAIL: ky vong dayA bi rejected cho emp2" }
if ($bulk2.created.Count -ne 0) { throw "FAIL: ky vong 0 created cho emp2" }

# 7. Bulk create emp2: dayC tren shift2 (khong gioi han) -> created
Show-Step "POST bulk emp2: dayC tren shift2 khong gioi han (ky vong created)"
$bulk2b = Invoke-Api -Method Post -Path "/employees/$($emp2.id)/work-schedule/bulk" -Body @{ shiftId = $shift2.id; workDates = @($dayC) } -Token $token -ExpectedStatus 201
if ($bulk2b.created.Count -ne 1) { throw "FAIL: ky vong dayC created cho emp2" }

$listEmp2 = @(Invoke-Api -Method Get -Path "/employees/$($emp2.id)/work-schedule?month=$queryMonth&year=$queryYear" -Token $token -ExpectedStatus 200)
$scheduleEmp2DayC = $listEmp2 | Where-Object { $_.shiftId -eq $shift2.id }

# 8. Bulk create emp1: dayD tren shift2 (khong gioi han) -> created (de test PATCH bi block sau)
Show-Step "POST bulk emp1: dayD tren shift2 (ky vong created)"
Invoke-Api -Method Post -Path "/employees/$($emp1.id)/work-schedule/bulk" -Body @{ shiftId = $shift2.id; workDates = @($dayD) } -Token $token -ExpectedStatus 201 | Out-Null
$listEmp1 = @(Invoke-Api -Method Get -Path "/employees/$($emp1.id)/work-schedule?month=$queryMonth&year=$queryYear" -Token $token -ExpectedStatus 200)
$scheduleEmp1DayD = $listEmp1 | Where-Object { $_.workDate -like "$dayD*" -and $_.shiftId -eq $shift2.id }
if ($null -eq $scheduleEmp1DayD) { throw "FAIL: khong tim thay schedule emp1 dayD tren shift2" }

# 9. Bulk create emp2: dayD tren shift1 (capacity 1, chua ai) -> created, chiem mat slot dayD/shift1
Show-Step "POST bulk emp2: dayD tren shift1 (ky vong created, chiem slot)"
Invoke-Api -Method Post -Path "/employees/$($emp2.id)/work-schedule/bulk" -Body @{ shiftId = $shift1.id; workDates = @($dayD) } -Token $token -ExpectedStatus 201 | Out-Null

# 10. PATCH schedule emp1/dayD (dang shift2) -> doi sang shift1 -> da day boi emp2 -> 400
Show-Step "PATCH emp1 dayD doi sang shift1 da day (ky vong 400)"
Invoke-Api -Method Patch -Path "/employees/$($emp1.id)/work-schedule/$($scheduleEmp1DayD.id)" -Body @{ shiftId = $shift1.id } -Token $token -ExpectedStatus 400 | Out-Null

# 11. PATCH schedule emp2/dayC (dang shift2, khong gioi han) -> doi sang shift2 lai (chinh no, khong gioi han) -> 200
Show-Step "PATCH emp2 dayC doi ca hop le (ky vong 200)"
$patched = Invoke-Api -Method Patch -Path "/employees/$($emp2.id)/work-schedule/$($scheduleEmp2DayC.id)" -Body @{ shiftId = $shift2.id } -Token $token -ExpectedStatus 200
if ($patched.shiftId -ne $shift2.id) { throw "FAIL: shiftId sau PATCH khong dung" }

# 12. PATCH scheduleId khong ton tai -> 404
Show-Step "PATCH scheduleId khong ton tai (ky vong 404)"
Invoke-Api -Method Patch -Path "/employees/$($emp1.id)/work-schedule/00000000-0000-0000-0000-000000000000" -Body @{ shiftId = $shift2.id } -Token $token -ExpectedStatus 404 | Out-Null

# 13. PATCH scheduleId cua emp1 nhung goi qua URL emp2 (sai chu) -> 404
Show-Step "PATCH scheduleId cua emp1 qua URL emp2 (ky vong 404)"
Invoke-Api -Method Patch -Path "/employees/$($emp2.id)/work-schedule/$($scheduleEmp1DayD.id)" -Body @{ shiftId = $shift2.id } -Token $token -ExpectedStatus 404 | Out-Null

# 14. GET tong hop toan nha hang, filter shiftId=shift1 -> phai co it nhat emp1(dayA,dayB) + emp2(dayD)
Show-Step "GET /work-schedule tong hop filter shiftId=shift1"
$summary = @(Invoke-Api -Method Get -Path "/work-schedule?month=$queryMonth&year=$queryYear&shiftId=$($shift1.id)" -Token $token -ExpectedStatus 200)
if ($summary.Count -lt 3) { throw "FAIL: ky vong it nhat 3 dong (emp1 dayA+dayB, emp2 dayD) nhung co $($summary.Count)" }

# 15. DELETE 1 schedule
Show-Step "DELETE schedule emp1 dayB (ky vong 204)"
$scheduleEmp1DayB = $listEmp1 | Where-Object { $_.workDate -like "$dayB*" }
Invoke-Api -Method Delete -Path "/employees/$($emp1.id)/work-schedule/$($scheduleEmp1DayB.id)" -Token $token -ExpectedStatus 204 | Out-Null

Show-Step "DELETE lai schedule da xoa (ky vong 404)"
Invoke-Api -Method Delete -Path "/employees/$($emp1.id)/work-schedule/$($scheduleEmp1DayB.id)" -Token $token -ExpectedStatus 404 | Out-Null

# 16. Don dep
Show-Step "Don dep"
Invoke-Api -Method Delete -Path "/employees/$($emp1.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/employees/$($emp2.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/employees/$($emp3.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/shifts/$($shift1.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/shifts/$($shift2.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/positions/$($pos.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/departments/$($dept.id)" -Token $token -ExpectedStatus 204 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST WORK-SCHEDULE PASS" -ForegroundColor Green
