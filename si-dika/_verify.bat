@echo off
setlocal

cd /d "C:\KIRO\sidikaenggrang\si-dika"

echo ========================================
echo SI-DIKA - Verification Script
echo ========================================
echo.

echo [1/3] Checking if node_modules exists...
if not exist "node_modules" (
    echo ERROR: node_modules not found. Run npm install first.
    pause
    exit /b 1
)
echo OK - node_modules found
echo.

echo [2/3] Checking Prisma Client...
if not exist "node_modules\.prisma\client" (
    echo WARNING: Prisma Client not generated. Running prisma generate...
    "C:\Program Files\nodejs\npx.cmd" prisma generate
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: prisma generate failed
        pause
        exit /b 1
    )
)
echo OK - Prisma Client ready
echo.

echo [3/3] Running TypeScript type check...
"C:\Program Files\nodejs\npx.cmd" tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo WARNING: Type check found errors (see above)
    echo This is expected if npm install hasn't completed yet.
    pause
    exit /b 1
) else (
    echo OK - No TypeScript errors
)
echo.

echo ========================================
echo Verification Complete!
echo ========================================
echo.
echo Next steps:
echo 1. If node_modules missing: run npm install
echo 2. Run database migration: npx prisma migrate dev --name init
echo 3. Seed database: npm run db:seed
echo 4. Start dev server: npm run dev
echo 5. Open http://localhost:3000/login
echo.
pause
