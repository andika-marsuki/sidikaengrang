@echo off
set ROOT=C:\KIRO\sidikaenggrang\si-dika
set OUT=%ROOT%\_status.txt

echo === SI-DIKA Status Check === > "%OUT%"
echo. >> "%OUT%"

echo [node_modules] >> "%OUT%"
if exist "%ROOT%\node_modules" (
    echo EXISTS >> "%OUT%"
) else (
    echo MISSING >> "%OUT%"
)

echo. >> "%OUT%"
echo [.bin\prisma.cmd] >> "%OUT%"
if exist "%ROOT%\node_modules\.bin\prisma.cmd" (
    echo EXISTS >> "%OUT%"
) else (
    echo MISSING >> "%OUT%"
)

echo. >> "%OUT%"
echo [.prisma\client\index.js] >> "%OUT%"
if exist "%ROOT%\node_modules\.prisma\client\index.js" (
    echo EXISTS (Prisma generated OK) >> "%OUT%"
) else (
    echo MISSING (need: npx prisma generate) >> "%OUT%"
)

echo. >> "%OUT%"
echo [.prisma\client\query_engine] >> "%OUT%"
if exist "%ROOT%\node_modules\.prisma\client\query_engine-windows.dll.node" (
    echo EXISTS >> "%OUT%"
) else (
    echo MISSING >> "%OUT%"
)

echo. >> "%OUT%"
echo [prisma\migrations] >> "%OUT%"
if exist "%ROOT%\prisma\migrations" (
    dir /b "%ROOT%\prisma\migrations" >> "%OUT%"
) else (
    echo No migrations folder >> "%OUT%"
)

echo. >> "%OUT%"
echo [.env.local] >> "%OUT%"
if exist "%ROOT%\.env.local" (
    echo EXISTS >> "%OUT%"
) else (
    echo MISSING >> "%OUT%"
)

echo. >> "%OUT%"
echo === End === >> "%OUT%"
type "%OUT%"
