@echo off
cd /d "C:\KIRO\sidikaenggrang\si-dika"
echo Running prisma migrate dev --name init...
"C:\Program Files\nodejs\npx.cmd" prisma migrate dev --name init
echo.
echo EXIT_CODE=%ERRORLEVEL%
pause
