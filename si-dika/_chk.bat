@echo off
cd /d "C:\KIRO\sidikaenggrang\si-dika"

(
echo === STATUS CHECK ===
if exist "node_modules\.bin\prisma.cmd" (echo prisma.cmd: OK) else (echo prisma.cmd: MISSING)
if exist "node_modules\.prisma\client\index.js" (echo prisma-client: GENERATED) else (echo prisma-client: NOT GENERATED)
if exist "prisma\migrations" (echo migrations: EXISTS) else (echo migrations: MISSING)
echo === END ===
) > "C:\KIRO\_chk_out.txt" 2>&1
