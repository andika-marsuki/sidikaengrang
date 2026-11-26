@echo off
cd /d "C:\KIRO\sidikaenggrang\si-dika"
echo Running prisma generate...
"C:\Program Files\nodejs\npx.cmd" prisma generate
echo.
echo EXIT_CODE=%ERRORLEVEL%
pause
