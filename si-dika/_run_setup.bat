@echo off
setlocal
set NPM="C:\Program Files\nodejs\npm.cmd"
set NPX="C:\Program Files\nodejs\npx.cmd"
set ROOT=C:\KIRO\sidikaenggrang\si-dika
set LOG=%ROOT%\_setup_log.txt

cd /d "%ROOT%"

echo ============================================ > "%LOG%"
echo SI-DIKA Setup Log >> "%LOG%"
echo ============================================ >> "%LOG%"
echo. >> "%LOG%"

echo [1/4] npm install... >> "%LOG%"
echo [1/4] npm install...
%NPM% install >> "%LOG%" 2>&1
echo [EXIT npm install] %ERRORLEVEL% >> "%LOG%"
if %ERRORLEVEL% NEQ 0 goto :error

echo [2/4] prisma generate... >> "%LOG%"
echo [2/4] prisma generate...
%NPX% prisma generate >> "%LOG%" 2>&1
echo [EXIT prisma generate] %ERRORLEVEL% >> "%LOG%"
if %ERRORLEVEL% NEQ 0 goto :error

echo [3/4] prisma migrate dev... >> "%LOG%"
echo [3/4] prisma migrate dev...
%NPX% prisma migrate dev --name init >> "%LOG%" 2>&1
echo [EXIT prisma migrate] %ERRORLEVEL% >> "%LOG%"
if %ERRORLEVEL% NEQ 0 goto :error

echo [4/4] prisma db seed... >> "%LOG%"
echo [4/4] prisma db seed...
%NPM% run db:seed >> "%LOG%" 2>&1
echo [EXIT db:seed] %ERRORLEVEL% >> "%LOG%"
if %ERRORLEVEL% NEQ 0 goto :error

echo. >> "%LOG%"
echo [SUCCESS] All steps completed. >> "%LOG%"
echo [SUCCESS] All steps completed.
goto :done

:error
echo. >> "%LOG%"
echo [FAILED] Step failed with error %ERRORLEVEL% >> "%LOG%"
echo [FAILED] Check _setup_log.txt for details.
echo See: %LOG%

:done
echo. >> "%LOG%"
echo Done. >> "%LOG%"
