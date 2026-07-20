# Test thu toan bo flow /positions/:id/salary-rates (list, tao muc moi tu dong dong muc cu,
# validate, quyen OWNER-only cho POST, va Position bi chan xoa cung khi da co muc luong).
# Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-position-salary-rate.ps1
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

# 0. LOGIN OWNER
Show-Step "LOGIN OWNER"
$loginRes = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = $ownerEmail; password = $ownerPassword } -ExpectedStatus 200
$ownerToken = $loginRes.token

$suffix = Get-Random
$deptName = "SalaryDept-$suffix"
$posName = "SalaryPos-$suffix"

# 1. Tao department + position qua API that
Show-Step "CREATE department + position"
$dept = Invoke-Api -Method Post -Path "/departments" -Body @{ name = $deptName } -Token $ownerToken -ExpectedStatus 201
$pos = Invoke-Api -Method Post -Path "/positions" -Body @{ name = $posName; departmentId = $dept.id } -Token $ownerToken -ExpectedStatus 201
$posId = $pos.id

# 2. GET salary-rates cua position moi tao -> ky vong mang rong
Show-Step "GET salary-rates (position moi, ky vong rong)"
$emptyList = Invoke-Api -Method Get -Path "/positions/$posId/salary-rates" -Token $ownerToken -ExpectedStatus 200
if ($emptyList.Count -ne 0) { throw "FAIL: ky vong danh sach rong nhung co $($emptyList.Count) dong" }

# 3. POST hourlyRate <= 0 -> 400
Show-Step "POST hourlyRate=0 (ky vong 400)"
Invoke-Api -Method Post -Path "/positions/$posId/salary-rates" -Body @{ hourlyRate = 0 } -Token $ownerToken -ExpectedStatus 400 | Out-Null

# 4. POST voi positionId khong ton tai -> 404
Show-Step "POST positionId khong ton tai (ky vong 404)"
Invoke-Api -Method Post -Path "/positions/00000000-0000-0000-0000-000000000000/salary-rates" -Body @{ hourlyRate = 25000 } -Token $ownerToken -ExpectedStatus 404 | Out-Null

# 5. POST muc luong dau tien (OWNER) -> 201, effectiveTo = null
Show-Step "POST muc luong dau tien (OWNER, ky vong 201)"
$rate1 = Invoke-Api -Method Post -Path "/positions/$posId/salary-rates" -Body @{ hourlyRate = 25000 } -Token $ownerToken -ExpectedStatus 201
if ($null -ne $rate1.effectiveTo) { throw "FAIL: muc dau tien phai dang mo (effectiveTo=null)" }
if ($rate1.hourlyRate -ne "25000") { throw "FAIL: hourlyRate khong dung, nhan $($rate1.hourlyRate)" }

# 6. POST muc luong thu 2 -> muc 1 phai tu dong bi dong lai
Show-Step "POST muc luong thu 2 (ky vong dong muc 1 lai)"
$rate2 = Invoke-Api -Method Post -Path "/positions/$posId/salary-rates" -Body @{ hourlyRate = 30000 } -Token $ownerToken -ExpectedStatus 201
if ($null -ne $rate2.effectiveTo) { throw "FAIL: muc moi nhat phai dang mo" }

Show-Step "GET salary-rates sau 2 lan POST (ky vong 2 dong, dong 1 da dong)"
$list2 = Invoke-Api -Method Get -Path "/positions/$posId/salary-rates" -Token $ownerToken -ExpectedStatus 200
if ($list2.Count -ne 2) { throw "FAIL: ky vong 2 dong nhung co $($list2.Count)" }
$closedRate = $list2 | Where-Object { $_.id -eq $rate1.id }
if ($null -eq $closedRate.effectiveTo) { throw "FAIL: muc dau tien phai da bi dong sau khi tao muc moi" }
Write-Host "muc 1 da dong dung effectiveTo=$($closedRate.effectiveTo)"

# 7. MANAGER khong duoc tao muc luong moi (403), nhung van GET duoc (200)
Show-Step "CREATE manager-account de test quyen"
$mgrEmail = "salarymgr-$suffix@ada.local"
$mgrPassword = "Passw0rd123"
Invoke-Api -Method Post -Path "/manager-accounts" -Body @{ email = $mgrEmail; password = $mgrPassword; role = "MANAGER" } -Token $ownerToken -ExpectedStatus 201 | Out-Null
$mgrLogin = Invoke-Api -Method Post -Path "/auth/login" -Body @{ email = $mgrEmail; password = $mgrPassword } -ExpectedStatus 200
$mgrToken = $mgrLogin.token

Show-Step "MANAGER POST salary-rates (ky vong 403)"
Invoke-Api -Method Post -Path "/positions/$posId/salary-rates" -Body @{ hourlyRate = 40000 } -Token $mgrToken -ExpectedStatus 403 | Out-Null

Show-Step "MANAGER GET salary-rates (ky vong 200)"
Invoke-Api -Method Get -Path "/positions/$posId/salary-rates" -Token $mgrToken -ExpectedStatus 200 | Out-Null

# 8. Position da co muc luong -> khong xoa cung duoc (409)
Show-Step "DELETE position da co muc luong (ky vong 409)"
Invoke-Api -Method Delete -Path "/positions/$posId" -Token $ownerToken -ExpectedStatus 409 | Out-Null

# 9. Don dep: xoa manager-account, force-delete position (qua fixture, bo qua Restrict), xoa department
Show-Step "Don dep"
$mgrAccounts = Invoke-Api -Method Get -Path "/manager-accounts?role=MANAGER" -Token $ownerToken -ExpectedStatus 200
$mgrAcc = $mgrAccounts.data | Where-Object { $_.email -eq $mgrEmail }
Invoke-Api -Method Delete -Path "/manager-accounts/$($mgrAcc.id)" -Token $ownerToken -ExpectedStatus 204 | Out-Null
npx tsx scripts/test-fixture.ts force-delete-position $posId | Out-Null
Invoke-Api -Method Delete -Path "/departments/$($dept.id)" -Token $ownerToken -ExpectedStatus 204 | Out-Null

Write-Host ""
Write-Host "TAT CA TEST POSITION-SALARY-RATE PASS" -ForegroundColor Green
