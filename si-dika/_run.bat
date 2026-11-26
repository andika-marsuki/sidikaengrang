@echo off
setlocal

set NODE="C:\Program Files\nodejs\node.exe"
set NPM="C:\Program Files\nodejs\npm.cmd"
set NPX="C:\Program Files\nodejs\npx.cmd"

cd /d "C:\Users\Lenovo\OneDrive\Documents\sidikaenggrang\si-dika"

echo [1] node version
%NODE% -v
echo [2] npm version
%NPM% -v

echo.
echo ==========================================
echo STEP: npm install -g neon@latest
echo ==========================================
%NPM% install -g neon@latest 2>&1
echo npm-install-neon exit: %ERRORLEVEL%

echo.
echo ==========================================
echo STEP: neon --version
echo ==========================================
%NODE% "%APPDATA%\npm\node_modules\neon\dist\cli.js" --version 2>&1
echo neon-version exit: %ERRORLEVEL%
