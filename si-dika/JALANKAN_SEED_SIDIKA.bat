@echo off
REM ========================================================================
REM SI-DIKA - Re-seed Database with Updated Email Domains
REM 
REM Jalankan batch ini untuk update seed data dengan domain baru:
REM   admin@si-dika.sch.id
REM   guru.pjok@si-dika.sch.id
REM   1234567890@siswa.si-dika.sch.id
REM ========================================================================

echo.
echo ===================================================
echo   SI-DIKA - Re-seeding Database (Updated Emails)
echo ===================================================
echo.

cd /d "C:\KIRO\sidikaenggrang\si-dika"

set "PATH=C:\Program Files\nodejs;%PATH%"
set "DATABASE_URL=postgresql://neondb_owner:npg_ak0stiA6yOgZ@ep-shy-hall-bexj95t3-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
set "DIRECT_URL=postgresql://neondb_owner:npg_ak0stiA6yOgZ@ep-shy-hall-bexj95t3.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require"
set "AUTH_SECRET=si-dika-secret-2025-xK9mPqR3nLvW8dYt"
set "NEXTAUTH_SECRET=si-dika-secret-2025-xK9mPqR3nLvW8dYt"
set "NEXTAUTH_URL=http://localhost:3000"
set "AUTH_URL=http://localhost:3000"

echo [1/1] Running seed script...
"C:\Program Files\nodejs\node.exe" node_modules\ts-node\dist\bin.js --compiler-options "{\"module\":\"CommonJS\"}" prisma\seed.ts

if %ERRORLEVEL% equ 0 (
    echo.
    echo ===================================================
    echo   SEED SELESAI!
    echo ===================================================
    echo.
    echo Akun login baru:
    echo   ADMIN    : admin@si-dika.sch.id      / Admin@12345
    echo   TEACHER  : guru.pjok@si-dika.sch.id  / Guru@12345
    echo   STUDENT  : 1234567890 (NISN)         / Siswa@12345
    echo.
) else (
    echo.
    echo [ERROR] Seed gagal dengan exit code %ERRORLEVEL%
    echo.
)

pause
