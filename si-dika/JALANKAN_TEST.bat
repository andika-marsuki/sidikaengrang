@echo off
title SI-DIKA Unit Tests
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"
echo.
echo ===================================================
echo   SI-DIKA - Running Unit Tests (Vitest)
echo ===================================================
echo.
"C:\Program Files\nodejs\node.exe" node_modules\vitest\vitest.mjs run --reporter=verbose 2>&1
echo.
echo Exit code: %ERRORLEVEL%
pause
