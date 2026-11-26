@echo off
title SI-DIKA Setup
color 0A
cd /d "%~dp0"

echo.
echo  =========================================
echo   SI-DIKA - Seed Database
echo  =========================================
echo.

REM Pastikan node ada
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  [ERROR] Node.js tidak ditemukan di PATH.
    echo  Pastikan Node.js sudah terinstall dan ada di PATH.
    pause
    exit /b 1
)

echo  Node.js: OK
node --version

echo.
echo  [1/2] Menjalankan prisma db seed...
echo.

REM Jalankan seed via npx (pakai node_modules local jika npx tidak ada di PATH)
where npx >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    npx prisma db seed
) else (
    node node_modules\.bin\prisma db seed
)

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  [ERROR] Seed gagal. Coba jalankan manual:
    echo    cd C:\KIRO\sidikaenggrang\si-dika
    echo    npx prisma db seed
    pause
    exit /b 1
)

echo.
echo  [2/2] Seed selesai!
echo.
echo  =========================================
echo   Akun yang tersedia:
echo   Admin   : admin@si-dika.sch.id / Admin@12345
echo   Teacher : guru.pjok@si-dika.sch.id / Guru@12345
echo   Student : NISN 1234567890 / Siswa@12345
echo  =========================================
echo.
pause
