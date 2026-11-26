@echo off
chcp 65001 >nul
REM =============================================================================
REM SI-DIKA - Build Production Verification Script
REM TASK-8.4
REM
REM Jalankan script ini untuk:
REM 1. Muat env vars dari .env.local lalu .env (fallback)
REM 2. Prisma generate
REM 3. Unit tests
REM 4. Next.js production build
REM 5. Verifikasi artifact build (service worker, manifest, export routes)
REM
REM EXIT:0 = build berhasil dan semua check lulus
REM EXIT:1 = build gagal atau ada check yang tidak lulus
REM =============================================================================

echo.
echo ========================================
echo SI-DIKA - Build Production Verification
echo ========================================
echo.

REM ------------------------------------------------------------------
REM Langkah 1: Muat environment variables dari file .env
REM ------------------------------------------------------------------
echo [1/5] Memuat environment variables...

REM Coba .env.local lebih dahulu, lalu .env sebagai fallback
if exist ".env.local" (
  echo   Membaca .env.local...
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env.local") do (
    if not "%%A"=="" if not "%%B"=="" (
      set "%%A=%%B"
    )
  )
)

if exist ".env" (
  echo   Membaca .env...
  for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env") do (
    if not "%%A"=="" if not "%%B"=="" (
      REM Jangan timpa nilai yang sudah diset dari .env.local
      if not defined %%A (
        set "%%A=%%B"
      )
    )
  )
)

REM Verifikasi variabel wajib
if not defined DATABASE_URL (
  echo [ERROR] DATABASE_URL tidak ditemukan di .env atau .env.local.
  exit /b 1
)
if not defined AUTH_SECRET (
  if not defined NEXTAUTH_SECRET (
    echo [ERROR] AUTH_SECRET atau NEXTAUTH_SECRET tidak ditemukan.
    exit /b 1
  )
)
echo [OK] Environment variables terkonfigurasi.
echo.

REM ------------------------------------------------------------------
REM Langkah 2: Prisma generate
REM ------------------------------------------------------------------
echo [2/5] Menjalankan prisma generate...
call npm run db:generate
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Prisma generate gagal.
  exit /b 1
)
echo [OK] Prisma client generated.
echo.

REM ------------------------------------------------------------------
REM Langkah 3: Unit tests
REM ------------------------------------------------------------------
echo [3/5] Menjalankan unit tests...
call npm run test
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Unit tests gagal. Perbaiki sebelum build.
  exit /b 1
)
echo [OK] Semua unit tests lulus.
echo.

REM ------------------------------------------------------------------
REM Langkah 4: Production build
REM ------------------------------------------------------------------
echo [4/5] Menjalankan next build (beberapa menit)...
call npm run build
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Next.js build gagal. Periksa error di atas.
  exit /b 1
)
echo [OK] Build produksi selesai.
echo.

REM ------------------------------------------------------------------
REM Langkah 5: Verifikasi artifact
REM ------------------------------------------------------------------
echo [5/5] Verifikasi output build...

if not exist "public\manifest.json" (
  echo [ERROR] PWA manifest tidak ditemukan: public\manifest.json
  exit /b 1
)
echo [OK] PWA manifest: public\manifest.json

if exist "public\sw.js" (
  echo [OK] Service worker: public\sw.js
) else (
  echo [WARNING] public\sw.js belum ada. Next-pwa membuat file ini saat build.
)

if exist "public\icons\icon-192x192.png" (
  echo [OK] PWA icon 192px tersedia.
) else (
  echo [WARNING] public\icons\icon-192x192.png tidak ditemukan.
)

if exist "public\icons\icon-512x512.png" (
  echo [OK] PWA icon 512px tersedia.
) else (
  echo [WARNING] public\icons\icon-512x512.png tidak ditemukan.
)

if not exist ".next\server\app\api\export\excel\[classId]\route.js" (
  echo [ERROR] Export Excel route tidak ada di build output.
  exit /b 1
)
echo [OK] Export Excel route terbuild.

if not exist ".next\server\app\api\export\pdf\[classId]\route.js" (
  echo [ERROR] Export PDF route tidak ada di build output.
  exit /b 1
)
echo [OK] Export PDF route terbuild.

if not exist ".next\server\app\(dashboard)\report\[classId]\page.js" (
  echo [WARNING] Report page tidak ada di build output.
) else (
  echo [OK] Report page terbuild.
)

echo.
echo ========================================
echo BUILD VERIFICATION COMPLETE - LULUS
echo ========================================
echo.
echo Langkah berikutnya:
echo   npm run start       -- test production server lokal (port 3000)
echo   DEPLOYMENT_GUIDE.md -- panduan deploy ke Vercel + Neon
echo.
exit /b 0
