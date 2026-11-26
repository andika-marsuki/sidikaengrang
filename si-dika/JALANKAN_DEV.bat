@echo off
title SI-DIKA Dev Server
color 0B
cd /d "%~dp0"

echo.
echo  =========================================
echo   SI-DIKA - Start Dev Server
echo  =========================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js tidak ditemukan. Install dari https://nodejs.org
    pause
    exit /b 1
)

echo  Membuka: http://localhost:3000
echo  Tekan Ctrl+C untuk menghentikan server.
echo.

where npm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    npm run dev
) else (
    node node_modules\.bin\next dev
)
