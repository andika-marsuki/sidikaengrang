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

echo [1/6] Approving install scripts... >> "%LOG%"
echo [1/6] Approving install scripts...
%NPM% install-scripts approve @prisma/client >> "%LOG%" 2>&1
%NPM% install-scripts approve @prisma/engines >> "%LOG%" 2>&1
%NPM% install-scripts approve prisma >> "%LOG%" 2>&1
%NPM% install-scripts approve esbuild >> "%LOG%" 2>&1
echo [EXIT approve] %ERRORLEVEL% >> "%LOG%"

echo [2/6] npm install with scripts... >> "%LOG%"
echo [2/6] npm install with scripts...
%NPM% install >> "%LOG%" 2>&1
echo [EXIT npm install] %ERRORLEVEL% >> "%LOG%"
if %ERRORLEVEL% NEQ 0 goto :error

echo [3/6] prisma generate... >> "%LOG%"
echo [3/6] prisma generate...
%NPX% prisma generate >> "%LOG%" 2>&1
echo [EXIT prisma generate] %ERRORLEVEL% >> "%LOG%"
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] prisma generate failed, trying local binary... >> "%LOG%"
    node_modules\.bin\prisma generate >> "%LOG%" 2>&1
    echo [EXIT local prisma generate] %ERRORLEVEL% >> "%LOG%"
)

echo [4/6] prisma migrate deploy... >> "%LOG%"
echo [4/6] prisma migrate deploy...
%NPX% prisma migrate deploy >> "%LOG%" 2>&1
echo [EXIT prisma migrate deploy] %ERRORLEVEL% >> "%LOG%"
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] deploy failed, trying migrate dev... >> "%LOG%"
    %NPX% prisma migrate dev --name init >> "%LOG%" 2>&1
    echo [EXIT prisma migrate dev] %ERRORLEVEL% >> "%LOG%"
)

echo [5/6] prisma db seed... >> "%LOG%"
echo [5/6] prisma db seed...
%NPM% run db:seed >> "%LOG%" 2>&1
echo [EXIT db:seed] %ERRORLEVEL% >> "%LOG%"

echo [6/6] tsc type check... >> "%LOG%"
echo [6/6] tsc type check...
%NPX% tsc --noEmit >> "%LOG%" 2>&1
echo [EXIT tsc] %ERRORLEVEL% >> "%LOG%"

echo. >> "%LOG%"
echo [DONE] Setup complete. >> "%LOG%"
echo [DONE] All steps attempted. Check _setup_log.txt for details.
goto :done

:error
echo. >> "%LOG%"
echo [FAILED] Critical step failed. >> "%LOG%"
echo [FAILED] Check _setup_log.txt

:done
echo. >> "%LOG%"
echo --- End of log --- >> "%LOG%"
