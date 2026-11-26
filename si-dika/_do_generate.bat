@echo off
cd /d "C:\KIRO\sidikaenggrang\si-dika"
set NODE="C:\Program Files\nodejs\node.exe"
set PRISMA_CLI=node_modules\prisma\build\index.js
set LOG=C:\KIRO\sidikaenggrang\si-dika\_generate_log.txt

echo === prisma generate log === > "%LOG%"
echo. >> "%LOG%"

echo Running: %NODE% %PRISMA_CLI% generate
%NODE% %PRISMA_CLI% generate >> "%LOG%" 2>&1
echo [EXIT] %ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo Done. See %LOG%
