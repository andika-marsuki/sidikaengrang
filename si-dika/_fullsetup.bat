@echo off
setlocal

cd /d "C:\KIRO\sidikaenggrang\si-dika"

echo ========================================
echo SI-DIKA - Full Setup
echo ========================================
echo.

echo [1/5] Installing npm packages...
"C:\Program Files\nodejs\npm.cmd" install --loglevel=error
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed with code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo OK - npm install done
echo.

echo [2/5] Generating Prisma Client...
"C:\Program Files\nodejs\npx.cmd" prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: prisma generate failed with code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo OK - prisma generate done
echo.

echo [3/5] Running database migration...
"C:\Program Files\nodejs\npx.cmd" prisma migrate dev --name init
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: prisma migrate failed with code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo OK - prisma migrate done
echo.

echo [4/5] Seeding database...
"C:\Program Files\nodejs\npm.cmd" run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: db seed failed with code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
echo OK - database seeded
echo.

echo [5/5] Type checking...
"C:\Program Files\nodejs\npx.cmd" tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Type check found errors (code %ERRORLEVEL%)
) else (
    echo OK - type check passed
)
echo.

echo ========================================
echo Setup Complete!
echo ========================================
pause
