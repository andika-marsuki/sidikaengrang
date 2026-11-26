@echo off
set "NPM=C:\Program Files\nodejs\npm.cmd"
set "ROOT=C:\Users\Lenovo\OneDrive\Documents\sidikaenggrang\si-dika"
set "LOG=%ROOT%\_npm_install_log.txt"

cd /d "%ROOT%"
echo [START] npm install > "%LOG%"
"%NPM%" install >> "%LOG%" 2>&1
echo [EXIT] %ERRORLEVEL% >> "%LOG%"
