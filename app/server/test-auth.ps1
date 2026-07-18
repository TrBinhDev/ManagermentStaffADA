# Test thu con toan bo flow /auth. Chay: pnpm --filter server run seed (mot lan) roi pnpm --filter server run dev,
# sau do chay script nay o mot terminal khac: powershell -File test-auth.ps1
$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"
$ownerEmail = "owner@ada.local"
$ownerPassword = "Owner@123"

function Show-Step($title) {
    Write-Host ""
    Write-Host "== $title ==" -ForegroundColor Cyan
}

function Show-Json($obj) {
    $obj | ConvertTo-Json -Depth 5 | Write-Host
}

# 1. LOGIN
Show-Step "LOGIN"
$loginBody = @{ email = $ownerEmail; password = $ownerPassword } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -SessionVariable webSession
Show-Json $loginRes
$accessToken = $loginRes.token
if (-not $accessToken) { throw "Khong lay duoc access token, dung lai." }

# 2. GET ME
Show-Step "GET /auth/me"
$meRes = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers @{ Authorization = "Bearer $accessToken" } -WebSession $webSession
Show-Json $meRes

# 3. REFRESH
Show-Step "POST /auth/refresh"
$refreshRes = Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method Post -WebSession $webSession
Show-Json $refreshRes
$accessToken = $refreshRes.token

# 4. CHANGE PASSWORD (doi xong doi lai luon de chay lai script nhieu lan khong bi ket)
Show-Step "PATCH /auth/change-password"
$newPassword = "Owner@456"
$changeBody = @{ oldPassword = $ownerPassword; newPassword = $newPassword } | ConvertTo-Json
$changeRes = Invoke-RestMethod -Uri "$baseUrl/auth/change-password" -Method Patch -Body $changeBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $accessToken" } -WebSession $webSession
Show-Json $changeRes

Show-Step "PATCH /auth/change-password (doi lai mat khau cu)"
$revertBody = @{ oldPassword = $newPassword; newPassword = $ownerPassword } | ConvertTo-Json
$revertRes = Invoke-RestMethod -Uri "$baseUrl/auth/change-password" -Method Patch -Body $revertBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $accessToken" } -WebSession $webSession
Show-Json $revertRes

# 5. LOGOUT
Show-Step "POST /auth/logout"
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/logout" -Method Post -Headers @{ Authorization = "Bearer $accessToken" } -WebSession $webSession | Out-Null
} catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 204) { throw }
}
Write-Host "Logout OK (204)" -ForegroundColor Green

# 6. REFRESH SAU KHI LOGOUT -> phai bi 401 vi session da bi xoa khoi Redis
Show-Step "POST /auth/refresh (sau logout, ky vong 401)"
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/refresh" -Method Post -WebSession $webSession
    Write-Host "LOI: refresh van thanh cong sau logout!" -ForegroundColor Red
} catch {
    Write-Host "OK - refresh bi tu choi nhu ky vong:" -ForegroundColor Green
    Write-Host $_.ErrorDetails.Message
}
