@echo off
cd /d "C:\KIRO\sidikaenggrang\si-dika"
echo [START] prisma generate > _gen_log.txt
"C:\Program Files\nodejs\npx.cmd" prisma generate >> _gen_log.txt 2>&1
echo [EXIT] %ERRORLEVEL% >> _gen_log.txt
