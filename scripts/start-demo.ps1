# MirrorMirror ハッカソンデモ起動スクリプト
# Usage: .\scripts\start-demo.ps1

Write-Host "🪞 MirrorMirror Demo Launcher" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️  .env.local が見つかりません" -ForegroundColor Yellow
    Write-Host "env.example をコピーして設定してください:" -ForegroundColor Yellow
    Write-Host "  copy env.example .env.local" -ForegroundColor Gray
    exit 1
}

# Check if cloudflared is installed
$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    Write-Host "⚠️  cloudflared がインストールされていません" -ForegroundColor Yellow
    Write-Host "インストール: winget install cloudflare.cloudflared" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "🚀 Next.js 開発サーバーを起動中..." -ForegroundColor Green

# Start Next.js in background
$nextProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -NoNewWindow

# Wait for Next.js to start
Start-Sleep -Seconds 5

Write-Host "🌐 Cloudflare Tunnel を開始中..." -ForegroundColor Green
Write-Host ""
Write-Host "📱 下記のURLをスマホで開いてください:" -ForegroundColor Cyan
Write-Host ""

# Start cloudflared tunnel
cloudflared tunnel --url http://localhost:3000

# Cleanup on exit
Stop-Process -Id $nextProcess.Id -ErrorAction SilentlyContinue

