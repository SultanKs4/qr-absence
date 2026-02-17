# Run Dev Script (PowerShell)
Write-Host "🔥 Starting Development Servers..." -ForegroundColor Green

# Port Cleaning
Write-Host "🧹 Cleaning up ports..." -ForegroundColor Gray
$ports = 8000, 8080, 3050, 5173, 5174
foreach ($port in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($proc) {
        $proc | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    }
}

# Start Backend
Write-Host "📡 Starting Backend (Port 8000)..." -ForegroundColor Cyan
Set-Location backend
$backendProcess = Start-Process php -ArgumentList "artisan serve --port=8000" -PassThru -NoNewWindow
$queueProcess = Start-Process php -ArgumentList "artisan queue:work" -PassThru -NoNewWindow
$reverbProcess = Start-Process php -ArgumentList "artisan reverb:start --host=0.0.0.0 --port=8080" -PassThru -NoNewWindow
Set-Location ..

# Start Frontend
Write-Host "💻 Starting Frontend..." -ForegroundColor Cyan
Set-Location frontend
if (Get-Command bun -ErrorAction SilentlyContinue) {
    $frontendProcess = Start-Process bun -ArgumentList "run dev" -PassThru -NoNewWindow
} else {
    $frontendProcess = Start-Process npm -ArgumentList "run dev" -PassThru -NoNewWindow
}
Set-Location ..

# Start Deskta
Write-Host "🖥️ Starting Desktop Version (Port 5174)..." -ForegroundColor Cyan
Set-Location deskta
if (Get-Command bun -ErrorAction SilentlyContinue) {
    $desktaProcess = Start-Process bun -ArgumentList "run dev" -PassThru -NoNewWindow
} else {
    $desktaProcess = Start-Process npm -ArgumentList "run dev" -PassThru -NoNewWindow
}
Set-Location ..

# Start Whatekster
Write-Host "📱 Starting Whatekster (WhatsApp Gateway) (Port 3050)..." -ForegroundColor Cyan
Write-Host "👉 Scan the QR Code below if it appears!" -ForegroundColor Yellow
Set-Location whatekster
# Run fix script if exists
if (Test-Path "setup-fix.ps1") { ./setup-fix.ps1 }
$env:ENABLE_QRCODE_CLI = "true"
$whateksterProcess = Start-Process node -ArgumentList "server.js" -PassThru -NoNewWindow
Set-Location ..

Write-Host "🚀 All servers are running! Press Ctrl+C to stop." -ForegroundColor Green

try {
    # Keep script running
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "🛑 Shutting down servers..." -ForegroundColor Red
    Stop-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $queueProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $reverbProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $desktaProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $whateksterProcess.Id -ErrorAction SilentlyContinue
}
