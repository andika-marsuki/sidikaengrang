@echo off
cd /d "C:\KIRO\sidikaenggrang\si-dika"
echo Running prisma db seed...
"C:\Program Files\nodejs\npm.cmd" run db:seed
echo.
echo EXIT_CODE=%ERRORLEVEL%
pause
