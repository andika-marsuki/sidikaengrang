@echo off
cd /d "C:\KIRO\sidikaenggrang\si-dika"
echo Running npm install...
"C:\Program Files\nodejs\npm.cmd" install
echo.
echo EXIT_CODE=%ERRORLEVEL%
pause
