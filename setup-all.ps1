# Setup All Script (PowerShell)
Write-Host "🌟 Starting Full Project Setup..." -ForegroundColor Green

Write-Host "--- Backend ---" -ForegroundColor Yellow
Set-Location backend
./setup.ps1
Set-Location ..

# Centralized Reverb Key Generation
if (Test-Path "backend/.env") {
    Write-Host "🔑 Configuring Reverb keys..." -ForegroundColor Cyan
    $envContent = Get-Content "backend/.env"
    $reverbKeyLine = $envContent | Select-String "^REVERB_APP_KEY=(.*)"
    $reverbKey = if ($reverbKeyLine) { $reverbKeyLine.Matches.Groups[1].Value } else { "" }

    if ([string]::IsNullOrWhiteSpace($reverbKey)) {
        Write-Host "📡 Generating new Reverb keys for backend/.env..." -ForegroundColor Yellow
        
        $appId = Get-Random -Minimum 100000 -Maximum 999999
        $bytes = New-Object Byte[] 16
        (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
        $appKey = [Convert]::ToBase64String($bytes).Replace('+', '').Replace('/', '').Replace('=', '').Substring(0, 20)
        
        $bytesSecret = New-Object Byte[] 32
        (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytesSecret)
        $appSecret = [Convert]::ToBase64String($bytesSecret).Replace('+', '').Replace('/', '').Replace('=', '')

        $content = Get-Content "backend/.env"
        # Helper to replace or append
        function Update-EnvVar($lines, $name, $value) {
            if ($lines -match "^$name=") {
                return $lines -replace "^$name=.*", "$name=$value"
            } else {
                return $lines + "$name=$value"
            }
        }

        $content = Update-EnvVar $content "REVERB_APP_ID" $appId
        $content = Update-EnvVar $content "REVERB_APP_KEY" $appKey
        $content = Update-EnvVar $content "REVERB_APP_SECRET" $appSecret
        $content = Update-EnvVar $content "VITE_REVERB_APP_KEY" "`"${appKey}`""
        
        $content | Set-Content "backend/.env"
    }

    # Sync to Frontend folder
    Write-Host "🔄 Syncing Reverb keys to frontend/.env..." -ForegroundColor Cyan
    $beEnv = Get-Content "backend/.env"
    $feKey = ($beEnv | Select-String "^REVERB_APP_KEY=(.*)").Matches.Groups[1].Value

    if (Test-Path "frontend/.env") {
        $feContent = Get-Content "frontend/.env"
        function Update-FE($lines, $name, $value) {
            if ($lines -match "^$name=") { return $lines -replace "^$name=.*", "$name=$value" }
            else { return $lines + "$name=$value" }
        }
        $feContent = Update-FE $feContent "VITE_REVERB_APP_KEY" $feKey
        $feContent = Update-FE $feContent "VITE_REVERB_HOST" "`"localhost`""
        $feContent = Update-FE $feContent "VITE_REVERB_PORT" "8080"
        $feContent = Update-FE $feContent "VITE_REVERB_SCHEME" "http"
        $feContent | Set-Content "frontend/.env"
    }

    # Sync to Deskta folder
    Write-Host "🔄 Syncing Reverb keys to deskta/.env..." -ForegroundColor Cyan
    if (Test-Path "deskta/.env") {
        $deContent = Get-Content "deskta/.env"
        function Update-DE($lines, $name, $value) {
            if ($lines -match "^$name=") { return $lines -replace "^$name=.*", "$name=$value" }
            else { return $lines + "$name=$value" }
        }
        $deContent = Update-DE $deContent "VITE_REVERB_APP_KEY" $feKey
        $deContent = Update-DE $deContent "VITE_REVERB_HOST" "`"localhost`""
        $deContent = Update-DE $deContent "VITE_REVERB_PORT" "8080"
        $deContent = Update-DE $deContent "VITE_REVERB_SCHEME" "http"
        $deContent | Set-Content "deskta/.env"
    }
}

Write-Host "--- Frontend ---" -ForegroundColor Yellow
Set-Location frontend
./setup.ps1
Set-Location ..

Write-Host "--- Desktop ---" -ForegroundColor Yellow
Set-Location deskta
./setup.ps1
Set-Location ..

Write-Host "--- Whatekster ---" -ForegroundColor Yellow
Set-Location whatekster
./setup.ps1
Set-Location ..

Write-Host "✨ All systems set up successfully!" -ForegroundColor Green
