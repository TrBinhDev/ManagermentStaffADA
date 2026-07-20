# Test thu toan bo flow /attendance + /employees/:id/payments + /payments:
# check-in bat buoc khop WorkSchedule, check-out tu tinh DailyPayment (vi tri thuc te
# tai workDate qua PositionHistory, khong phai vi tri hien tai), tron lai vi tri sau khi
# check-in nhung truoc check-out van tinh dung luong theo vi tri CU, lam tron toi 1000d.
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-attendance.ps1
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
$deptName = "AttDept-$suffix"
$posOldName = "AttPosOld-$suffix"
$posNewName = "AttPosNew-$suffix"
$shiftName = "AttShift-$suffix"

$today = Get-Date
$workDate = $today.ToString("yyyy-MM-dd")
$queryMonth = $today.Month
$queryYear = $today.Year

# 1. Fixtures: department, 2 position (old + new, cung phong ban), shift, salary rate cho ca 2 vi tri
Show-Step "CREATE fixtures (department, 2 position, shift, 2 muc luong)"
$dept = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptName } -Token $token -ExpectedStatus 201
$posOld = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posOldName; departmentId = $dept.id } -Token $token -ExpectedStatus 201
$posNew = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posNewName; departmentId = $dept.id } -Token $token -ExpectedStatus 201
$shift = Invoke-Api -Method Post -Path "/shifts" -Body @{ name = $shiftName; startTime = "06:00"; endTime = "23:00" } -Token $token -ExpectedStatus 201

Show-Step "SET muc luong: posOld=20000/h, posNew=99999/h (de phat hien neu tinh nham vi tri)"
Invoke-Api -Method Post -Path "/positions/$($posOld.id)/salary-rates" -Body @{ hourlyRate = 20000 } -Token $token -ExpectedStatus 201 | Out-Null
Invoke-Api -Method Post -Path "/positions/$($posNew.id)/salary-rates" -Body @{ hourlyRate = 99999 } -Token $token -ExpectedStatus 201 | Out-Null

Show-Step "CREATE employee o posOld + xep lich hom nay"
$emp = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = (New-RandomCccd); fullName = "Att Emp"; positionId = $posOld.id } -Token $token -ExpectedStatus 201
Invoke-Api -Method Post -Path "/employees/$($emp.id)/work-schedule/bulk" -Body @{ shiftId = $shift.id; workDates = @($workDate) } -Token $token -ExpectedStatus 201 | Out-Null

# 2. Check-in khong co WorkSchedule khop -> 400 (dung shift khac chua xep)
Show-Step "CHECK-IN khong co WorkSchedule khop shift khac (ky vong 400)"
$shiftKhac = Invoke-Api -Method Post -Path "/shifts" -Body @{ name = "AttShiftKhac-$suffix"; startTime = "00:00"; endTime = "05:00" } -Token $token -ExpectedStatus 201
Invoke-Api -Method Post -Path "/attendance/check-in" -Body @{ employeeId = $emp.id; shiftId = $shiftKhac.id; workDate = $workDate } -Token $token -ExpectedStatus 400 | Out-Null

# 3. Check-in dung -> 201
Show-Step "CHECK-IN dung WorkSchedule (ky vong 201)"
$attendance = Invoke-Api -Method Post -Path "/attendance/check-in" -Body @{ employeeId = $emp.id; shiftId = $shift.id; workDate = $workDate } -Token $token -ExpectedStatus 201
if ($null -eq $attendance.checkedInAt) { throw "FAIL: checkedInAt phai duoc set" }
if ($null -ne $attendance.checkedOutAt) { throw "FAIL: checkedOutAt phai con null" }

# 4. Check-in lai lan 2 cho dung (employeeId,workDate,shiftId) -> 409
Show-Step "CHECK-IN lai lan 2 (ky vong 409)"
Invoke-Api -Method Post -Path "/attendance/check-in" -Body @{ employeeId = $emp.id; shiftId = $shift.id; workDate = $workDate } -Token $token -ExpectedStatus 409 | Out-Null

# 5. Doi vi tri nhan vien SANG posNew (mo dong PositionHistory moi) - luc check-out phai
#    VAN tinh theo posOld (vi tri THUC TE tai workDate = hom nay, luc do van con la posOld
#    vi PositionHistory cu dong dung workDate tro di), khong duoc tinh theo posNew hien tai.
Show-Step "PATCH doi vi tri nhan vien sang posNew (SAU khi check-in)"
Invoke-Api -Method Patch -Path "/employees/$($emp.id)" -Body @{ positionId = $posNew.id } -Token $token -ExpectedStatus 200 | Out-Null

# 6. Check-out cho nguoi khac (chua check-in) -> 404 (dung id random)
Show-Step "CHECK-OUT attendanceId khong ton tai (ky vong 404)"
Invoke-Api -Method Patch -Path "/attendance/00000000-0000-0000-0000-000000000000/check-out" -Token $token -ExpectedStatus 404 | Out-Null

# 7. Check-out that -> 200, kiem tra DailyPayment tinh theo posOld (20000/h) khong phai posNew
Show-Step "CHECK-OUT (ky vong 200, luong tinh theo posOld=20000/h)"
Start-Sleep -Seconds 2
$checkoutResult = Invoke-Api -Method Patch -Path "/attendance/$($attendance.id)/check-out" -Token $token -ExpectedStatus 200
if ($null -eq $checkoutResult.dailyPayment) { throw "FAIL: response phai co dailyPayment" }
if ($checkoutResult.dailyPayment.positionId -ne $posOld.id) {
    throw "FAIL: DailyPayment.positionId phai la posOld (vi tri THUC TE tai workDate), nhung la $($checkoutResult.dailyPayment.positionId)"
}
if ($checkoutResult.dailyPayment.hourlyRate -ne "20000") {
    throw "FAIL: hourlyRate phai la 20000 (posOld) nhung la $($checkoutResult.dailyPayment.hourlyRate)"
}
Write-Host "OK dailyPayment tinh dung theo vi tri THUC TE (posOld), khong bi lech sang posNew" -ForegroundColor Green
Write-Host "hoursWorked=$($checkoutResult.dailyPayment.hoursWorked) amount=$($checkoutResult.dailyPayment.amount)"

# 8. Check-out lai lan 2 -> 400 (da check-out roi)
Show-Step "CHECK-OUT lai lan 2 (ky vong 400)"
Invoke-Api -Method Patch -Path "/attendance/$($attendance.id)/check-out" -Token $token -ExpectedStatus 400 | Out-Null

# 9. GET /attendance filter employeeId
Show-Step "GET /attendance filter employeeId"
$attList = Invoke-Api -Method Get -Path "/attendance?employeeId=$($emp.id)" -Token $token -ExpectedStatus 200
if ($attList.total -ne 1) { throw "FAIL: ky vong total=1 nhung la $($attList.total)" }

# 10. GET /employees/:id/payments thang nay -> phai co 1 dong, totalAmount = amount vua tinh
Show-Step "GET /employees/:id/payments"
$empPayments = Invoke-Api -Method Get -Path "/employees/$($emp.id)/payments?month=$queryMonth&year=$queryYear" -Token $token -ExpectedStatus 200
if ($empPayments.data.Count -ne 1) { throw "FAIL: ky vong 1 dong payment nhung co $($empPayments.data.Count)" }
if ([double]$empPayments.totalAmount -ne [double]$checkoutResult.dailyPayment.amount) {
    throw "FAIL: totalAmount khong khop voi amount cua DailyPayment vua tao"
}

# 11. GET /payments tong hop -> phai co employeeId nay
Show-Step "GET /payments tong hop"
$allPayments = Invoke-Api -Method Get -Path "/payments?month=$queryMonth&year=$queryYear" -Token $token -ExpectedStatus 200
$foundInSummary = $allPayments.data | Where-Object { $_.employeeId -eq $emp.id }
if ($null -eq $foundInSummary) { throw "FAIL: khong tim thay employee trong /payments tong hop" }

# 12. Employee moi, co WorkSchedule + check-in nhung vi tri CHUA CO muc luong -> check-out phai 400
Show-Step "CHECK-OUT khi vi tri chua co muc luong (ky vong 400)"
$posNoRate = Invoke-Api -Method Post -Path "/positions" -Body @{ name = "AttPosNoRate-$suffix"; departmentId = $dept.id } -Token $token -ExpectedStatus 201
$emp2 = Invoke-Api -Method Post -Path "/employees" -Body @{ cccd = (New-RandomCccd); fullName = "Att Emp2"; positionId = $posNoRate.id } -Token $token -ExpectedStatus 201
Invoke-Api -Method Post -Path "/employees/$($emp2.id)/work-schedule/bulk" -Body @{ shiftId = $shift.id; workDates = @($workDate) } -Token $token -ExpectedStatus 201 | Out-Null
$attendance2 = Invoke-Api -Method Post -Path "/attendance/check-in" -Body @{ employeeId = $emp2.id; shiftId = $shift.id; workDate = $workDate } -Token $token -ExpectedStatus 201
Invoke-Api -Method Patch -Path "/attendance/$($attendance2.id)/check-out" -Token $token -ExpectedStatus 400 | Out-Null

# 13. Employee da nghi viec -> check-in bi chan 400
Show-Step "CHECK-IN nhan vien da nghi viec (ky vong 400)"
Invoke-Api -Method Patch -Path "/employees/$($emp2.id)/resign" -Token $token -ExpectedStatus 200 | Out-Null
Invoke-Api -Method Post -Path "/attendance/check-in" -Body @{ employeeId = $emp2.id; shiftId = $shift.id; workDate = $workDate } -Token $token -ExpectedStatus 400 | Out-Null

# 14. Don dep - Employee co Attendance/DailyPayment bi Restrict qua API (dung), phai xoa qua
# fixture (force-delete-employee xoa het chuoi: DailyPayment -> Attendance -> WorkSchedule ->
# PositionHistory -> EmploymentPeriod -> EmployeeProfile -> Employee). Sau do moi xoa duoc Position.
Show-Step "Don dep"
npx tsx scripts/test-fixture.ts force-delete-employee $emp.id | Out-Null
npx tsx scripts/test-fixture.ts force-delete-employee $emp2.id | Out-Null
npx tsx scripts/test-fixture.ts force-delete-position $posOld.id | Out-Null
npx tsx scripts/test-fixture.ts force-delete-position $posNew.id | Out-Null
npx tsx scripts/test-fixture.ts force-delete-position $posNoRate.id | Out-Null
Invoke-Api -Method Delete -Path "/shifts/$($shift.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/shifts/$($shiftKhac.id)" -Token $token -ExpectedStatus 204 | Out-Null
Invoke-Api -Method Delete -Path "/departments/$($dept.id)" -Token $token -ExpectedStatus 204 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST ATTENDANCE PASS" -ForegroundColor Green
