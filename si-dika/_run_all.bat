@echo off
setlocal EnableDelayedExpansion
set "ROOT=C:\Users\Lenovo\OneDrive\Documents\sidikaenggrang\si-dika"
set "NODE=C:\Program Files\nodejs\node.exe"
set "NPM=C:\Program Files\nodejs\npm.cmd"
set "NPX=C:\Program Files\nodejs\npx.cmd"

cd /d "%ROOT%"

echo ============================================================
echo [0] Node + npm versions
echo ============================================================
"%NODE%" -v
"%NPM%" -v
echo.

echo ============================================================
echo [1] npm install
echo ============================================================
"%NPM%" install --prefer-offline 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm install failed with exit %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
echo npm install OK
echo.

echo ============================================================
echo [2] prisma generate
echo ============================================================
"%NPX%" prisma generate 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: prisma generate failed
    exit /b %ERRORLEVEL%
)
echo prisma generate OK
echo.

echo ============================================================
echo [3] prisma migrate deploy  (Neon)
echo ============================================================
"%NPX%" prisma migrate deploy 2>&1
if %ERRORLEVEL% neq 0 (
    echo prisma migrate deploy failed, trying migrate dev...
    "%NPX%" prisma migrate dev --name init --skip-seed 2>&1
    if !ERRORLEVEL! neq 0 (
        echo ERROR: prisma migrate also failed
        exit /b !ERRORLEVEL!
    )
)
echo prisma migrate OK
echo.

echo ============================================================
echo [4] prisma db seed
echo ============================================================
"%NPX%" prisma db seed 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: seed failed with exit %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)
echo prisma seed OK
echo.

echo ============================================================
echo [5] tsc --noEmit  (type check)
echo ============================================================
"%NPX%" tsc --noEmit 2>&1
if %ERRORLEVEL% neq 0 (
    echo WARNING: TypeScript errors found — see above
) else (
    echo tsc OK - zero errors
)
echo.

echo ============================================================
echo ALL STEPS DONE
echo ============================================================
