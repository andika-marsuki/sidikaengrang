@echo off
chcp 65001 >nul
REM =============================================================================
REM SI-DIKA - Verifikasi PWA Manifest & Service Worker
REM TASK-8.4 (PWA Check)
REM
REM Cek keberadaan dan struktur file PWA yang diperlukan untuk deployment.
REM =============================================================================

echo.
echo ========================================
echo SI-DIKA - Verifikasi PWA Readiness
echo ========================================
echo.

set PWA_PASS=1

REM 1. Cek manifest.json
echo [1/5] Memeriksa PWA manifest...
if exist "public\manifest.json" (
  echo [OK] public\manifest.json ditemukan.
  findstr /C:"standalone" "public\manifest.json" >nul 2>&1
  if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] display:standalone tidak ditemukan di manifest.json.
    set PWA_PASS=0
  ) else (
    echo [OK] display: standalone sudah ada.
  )
  findstr /C:"192" "public\manifest.json" >nul 2>&1
  if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Icon 192x192 mungkin belum ada di manifest.
  ) else (
    echo [OK] Icon 192px tercantum di manifest.
  )
) else (
  echo [ERROR] public\manifest.json tidak ditemukan!
  set PWA_PASS=0
)
echo.

REM 2. Cek icon files
echo [2/5] Memeriksa file icon PWA...
if exist "public\icons\icon-192x192.png" (
  echo [OK] icon-192x192.png ada.
) else (
  echo [WARNING] public\icons\icon-192x192.png tidak ditemukan.
  echo         Ganti dengan logo sekolah berukuran 192x192 px.
)
if exist "public\icons\icon-512x512.png" (
  echo [OK] icon-512x512.png ada.
) else (
  echo [WARNING] public\icons\icon-512x512.png tidak ditemukan.
)
echo.

REM 3. Cek service worker (hanya ada setelah "next build")
echo [3/5] Memeriksa service worker...
if exist "public\sw.js" (
  echo [OK] Service worker ditemukan: public\sw.js
) else (
  echo [INFO] public\sw.js belum ada.
  echo        next-pwa membuat file ini hanya saat "next build", bukan "next dev".
  echo        Jalankan JALANKAN_BUILD_PROD.bat terlebih dahulu.
)
echo.

REM 4. Cek konfigurasi next-pwa di next.config.ts
echo [4/5] Memeriksa konfigurasi next-pwa...
findstr /C:"next-pwa" "next.config.ts" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] next-pwa tidak dikonfigurasi di next.config.ts.
  set PWA_PASS=0
) else (
  echo [OK] next-pwa terkonfigurasi di next.config.ts.
)
echo.

REM 5. Cek meta tag PWA di layout.tsx
echo [5/5] Memeriksa meta tag PWA di layout.tsx...
findstr /C:"manifest" "src\app\layout.tsx" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo [WARNING] Meta tag manifest mungkin belum ada di src\app\layout.tsx.
) else (
  echo [OK] Meta tag manifest ada di layout.tsx.
)
echo.

if %PWA_PASS%==1 (
  echo ========================================
  echo PWA READINESS CHECK: LULUS
  echo ========================================
) else (
  echo ========================================
  echo PWA READINESS CHECK: ADA PERINGATAN
  echo Periksa item WARNING/ERROR di atas.
  echo ========================================
)
echo.
