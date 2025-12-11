@echo off
chcp 65001 >nul
title MirrorMirror Demo

echo.
echo 🪞 MirrorMirror Demo Launcher
echo =============================
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ⚠️  .env.local が見つかりません
    echo env.example をコピーして設定してください:
    echo   copy env.example .env.local
    pause
    exit /b 1
)

REM Check cloudflared
where cloudflared >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  cloudflared がインストールされていません
    echo インストール: winget install cloudflare.cloudflared
    pause
    exit /b 1
)

echo 🚀 サーバーを起動します...
echo.
echo 📋 2つのターミナルが開きます:
echo    1. Next.js 開発サーバー (localhost:3000)
echo    2. Cloudflare Tunnel (公開URL)
echo.
echo 📱 Tunnel URLをスマホで開いてください
echo.
pause

REM Start Next.js in new window
start "Next.js Server" cmd /k "npm run dev"

REM Wait for Next.js to start
timeout /t 5 /nobreak >nul

REM Start cloudflared in current window
echo.
echo 🌐 Cloudflare Tunnel 開始...
echo.
cloudflared tunnel --url http://localhost:3000

