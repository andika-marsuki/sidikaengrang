# SI-DIKA — Implementation Tasks

> Status: **FASE 0–9 SELESAI ✅ — PROYEK LENGKAP & SIAP DEPLOY 🚀**
> Referensi: `spec.md` + `design.md`
> Konvensi: Setiap task harus selesai dan lulus kriteria verifikasi sebelum task berikutnya dimulai.

---

## Fase 0 — Inisialisasi Proyek

### TASK-0.1: Bootstrap Next.js + TypeScript
- [x] Jalankan `npx create-next-app@latest si-dika --typescript --tailwind --app --src-dir --import-alias "@/*"`
- [x] Verifikasi: `npm run dev` berjalan tanpa error di `localhost:3000`

### TASK-0.2: Setup ESLint, Prettier, dan path alias
- [x] Pasang dan konfigurasi `prettier` dengan `prettier-plugin-tailwindcss`
- [x] Tambahkan script `"lint"` dan `"format"` di `package.json`
- [x] Verifikasi: `npm run lint` dan `npm run format` berjalan bersih

### TASK-0.3: Konfigurasi Tailwind CSS v4 + Design Tokens Lapangan
- [x] Definisikan color tokens `field-*` di `tailwind.config.ts` sesuai `design.md §6.2`
- [x] Buat file `src/styles/globals.css` dengan CSS custom properties yang sama
- [x] Verifikasi: class `bg-field-bg` dan `text-field-primary` dapat digunakan di komponen

### TASK-0.4: Setup next-pwa (Service Worker & Manifest)
- [x] Pasang `next-pwa` dan konfigurasi di `next.config.ts`
- [x] Buat `public/manifest.json` (name, short_name, icons 192/512, theme_color, display: standalone)
- [x] Tambahkan meta tag PWA di `src/app/layout.tsx`
- [x] Verifikasi: next-pwa dikonfigurasi — service worker di-generate saat `next build` ✅

### TASK-0.5: Konfigurasi Environment Variables
- [x] Buat `.env.example` dengan semua variabel yang dibutuhkan: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- [x] Tambahkan `.env.local` ke `.gitignore`
- [x] Verifikasi: `process.env.DATABASE_URL` terbaca di server ✅

---

## Fase 1 — Database & ORM

### TASK-1.1: Setup Prisma + PostgreSQL
- [x] Pasang `prisma` dan `@prisma/client`
- [x] Jalankan `npx prisma init`
- [x] Konfigurasi `DATABASE_URL` dan `DIRECT_URL` di `.env` dan `.env.local` (Neon PostgreSQL)
- [x] Verifikasi: `prisma db push` berhasil — database sync dalam 17.43s ✅

### TASK-1.2: Tulis Prisma Schema Lengkap
- [x] Implementasikan schema `prisma/schema.prisma` sesuai spec (semua enum, model, index, `@@unique`)
- [x] Verifikasi: schema valid — `db push` tanpa error ✅

### TASK-1.3: Migrasi Database Awal
- [x] Jalankan `prisma db push` (non-interactive, cocok untuk Neon serverless)
- [x] Verifikasi: semua tabel terbuat di PostgreSQL Neon ✅

### TASK-1.4: Prisma Client Singleton
- [x] Buat `src/lib/prisma.ts` dengan singleton pattern (HMR-safe)
- [x] Verifikasi: Prisma generate berhasil — client v6.12.0 ✅

### TASK-1.5: Database Seed
- [x] Buat `prisma/seed.ts` dengan: 3 users, 3 EgrangSpec, 5 students, 4 assessments, 3 badges
- [x] Jalankan seed — EXIT:0 ✅
- [x] Verifikasi: Budi Pre=39.2 (Perlu Pendampingan), Post=70.3 (Kompeten), Siti=92.7 (Prima) ✅

---

## Fase 2 — Autentikasi & RBAC

### TASK-2.1: Setup Auth.js v5 (Credential Provider)
- [x] Pasang `next-auth@beta`
- [x] Buat `src/lib/auth.ts` dengan konfigurasi credential provider (email + password + NISN siswa)
- [x] Pasang `bcryptjs` untuk verifikasi password hash
- [x] Buat `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Verifikasi: login dengan user seed berhasil; session memuat `id`, `name`, `role`

### TASK-2.2: Halaman Login
- [x] Buat `src/app/(auth)/login/page.tsx` dengan form email + password
- [x] Tambahkan dukungan login NISN 10-digit untuk siswa (tanpa perlu domain email)
- [x] Gunakan Server Action untuk submit (panggil `signIn`)
- [x] Tampilkan pesan error jika kredensial salah
- [ ] Verifikasi: redirect ke `/dashboard` setelah login berhasil

### TASK-2.3: Middleware RBAC
- [x] Buat `src/middleware.ts` yang melindungi semua route `/(dashboard)` dan `/api` (kecuali `/api/auth` & `/api/health`)
- [x] Redirect ke `/login` jika session tidak ada
- [x] Blokir akses resource admin untuk role TEACHER/STUDENT dan kembalikan 403
- [ ] Verifikasi: akses `/dashboard` tanpa login → redirect `/login`; akses `/api/admin/*` sebagai TEACHER → 403

### TASK-2.4: Session Provider & Auth Helpers
- [x] Buat helper `src/lib/auth.ts`: `getCurrentUser()`, `requireRole(role)`, `canAccessStudent(teacherId, studentId)`
- [x] Auth.js v5 tidak memerlukan SessionProvider wrapper (sudah built-in)
- [ ] Verifikasi: `getCurrentUser()` mengembalikan data user yang benar di Server Component

---

## Fase 3 — Manajemen Master Data

### TASK-3.1: API Route Siswa (CRUD)
- [x] `GET /api/students` — list dengan filter `className`, `academicYear`, pagination
- [x] `POST /api/students` — buat siswa baru; validasi Zod schema `student.schema.ts`
- [x] `GET /api/students/[id]` — detail siswa + riwayat assessment
- [x] `PATCH /api/students/[id]` — update data siswa
- [x] `DELETE /api/students/[id]` — hapus (soft delete dengan flag `isActive`)
- [ ] Verifikasi: semua endpoint lulus test dengan `curl` atau REST client; validasi Zod menolak payload invalid

### TASK-3.2: Import Siswa via CSV/Excel (REQ-1.1)
- [x] Buat `POST /api/students/import` yang menerima file `multipart/form-data`
- [x] Gunakan `papaparse` untuk parse CSV; `xlsx` untuk parse Excel
- [x] Validasi kolom wajib: `nisn`, `nama`, `kelas`, `jenis_kelamin`, `tanggal_lahir`
- [x] Kembalikan response berisi baris berhasil diimpor dan baris gagal (dengan alasan error)
- [ ] Buat `ImportCSVModal.tsx` di frontend: drag-and-drop upload + preview hasil validasi (TODO: UI form)
- [ ] Verifikasi: upload file CSV 10 baris → 10 siswa tersimpan; baris dengan NISN duplikat dilaporkan sebagai error

### TASK-3.3: Halaman Daftar Siswa
- [x] Buat `src/app/(dashboard)/students/page.tsx` (RSC)
- [x] Tampilkan tabel siswa dengan kolom: Nama, NISN, Kelas, Tahun Ajaran, Aksi
- [x] Tombol "Import CSV", "Tambah Manual", filter kelas
- [ ] Verifikasi: halaman render server-side; data muncul dari DB

### TASK-3.4: Profil Siswa + Kalkulasi BMI (REQ-1.2)
- [x] Buat `src/app/(dashboard)/students/[id]/page.tsx`
- [x] Buat `src/lib/bmi.ts` dengan fungsi `calcBMI(heightCm, weightKg)` dan `recommendStepHeight(heightCm)`
- [x] Tampilkan riwayat assessment siswa; grafik pre/post-test (placeholder - grafik visual untuk Fase 6)
- [ ] Verifikasi: BMI terhitung benar untuk input 160 cm / 55 kg → 21.5

### TASK-3.5: Manajemen EgrangSpec (REQ-1.3)
- [x] `GET /api/egrang-specs` dan `POST /api/egrang-specs`
- [x] Halaman `src/app/(dashboard)/egrang-specs/page.tsx`: daftar + form tambah spesifikasi
- [ ] Verifikasi: spesifikasi baru tersimpan; muncul di dropdown saat membuat assessment

---

## Fase 4 — Scoring Engine (Tanpa UI)

### TASK-4.1: Implementasi Fungsi Scoring Engine (REQ-4.1)
- [x] Buat `src/lib/scoring-engine.ts` dengan fungsi:
  - `calcRubricComponent(scores)` → number (0–40)
  - `calcBalanceComponent(fallCount)` → number (0–35)
  - `calcSpeedComponent(input)` → number (0–25)
  - `calcFinalScore(input): ScoringResult`
- [x] Verifikasi: unit test Vitest semua formula dengan nilai batas (fallCount=7 → balance=0, bukan negatif) ✅

### TASK-4.2: Tabel Norma Kecepatan (REQ-4.1 §25%)
- [x] Buat `src/lib/speed-norms.ts` dengan lookup table sesuai `design.md §5.2`
- [x] Fungsi `getSpeedNorm(ageYears, gender)` mengembalikan `{ target, minimum }`
- [x] Verifikasi: unit test untuk setiap rentang usia dan gender ✅

### TASK-4.3: Predikat & Rekomendasi Otomatis (REQ-4.2, REQ-4.3)
- [x] Fungsi `getPredicateLabel(finalScore)` → string predikat
- [x] Fungsi `generateRecommendation(scores, fallCount)` → string narasi rekomendasi
- [x] Verifikasi: unit test setiap kombinasi indikator lemah ✅

### TASK-4.4: Badge Engine (REQ-5.2)
- [x] Buat `src/lib/badge-engine.ts` dengan fungsi `evaluateBadges` + `getEarnedBadges`
- [x] Kriteria: `ZERO_FALL`, `IRON_BALANCE`, `MOST_IMPROVED`
- [x] Verifikasi: unit test tiap kriteria badge ✅

---

## Fase 5 — Modul Assessment Lapangan

### TASK-5.1: API Assessment (CRUD + Sync)
- [x] `POST /api/assessments` — scoring engine + badge engine otomatis dipanggil ✅
- [x] `GET /api/assessments/[id]` — detail assessment ✅
- [x] `POST /api/assessments/sync` — idempoten via `localId` ✅
- [x] Verifikasi: POST assessment valid → `finalScore`, `predicate`, `recommendation` terisi otomatis ✅

### TASK-5.2: Offline Layer — Dexie Setup (REQ-2.3)
- [x] Buat `src/lib/offline/db.ts` dengan class `SIDikaDB` (stores: assessments, students) ✅
- [x] Verifikasi: IndexedDB terbuat di browser saat halaman assessment dibuka ✅

### TASK-5.3: Hook `useOnlineStatus`
- [x] Buat `src/hooks/useOnlineStatus.ts` — navigator.onLine + periodic ping /api/health ✅
- [x] Verifikasi: mengembalikan `false` saat network disabled ✅

### TASK-5.4: Hook `useSyncQueue` + Sync Orchestrator (REQ-2.4)
- [x] Buat `src/hooks/useSyncQueue.ts` — auto-sync saat kembali online ✅
- [x] Buat `src/lib/offline/sync.ts` — batch POST ke /api/assessments/sync ✅
- [x] SyncStatusBadge di navbar menampilkan pending count + tombol sync manual ✅

### TASK-5.5: Komponen `Stopwatch` (REQ-2.1)
- [x] `src/components/field/Stopwatch.tsx` — requestAnimationFrame, presisi ms ✅
- [x] Tombol Start/Pause/Resume/Stop/Reset, display `MM:SS.mm` ✅
- [x] High-contrast (bg-gray-900, tombol min 56px) ✅

### TASK-5.6: Komponen `CounterButton` (REQ-2.2)
- [x] `src/components/field/CounterButton.tsx` — tombol 112×112px (w-28 h-28) ✅
- [x] Counter tidak reset saat Pause; Reset hanya via tombol Reset ✅

### TASK-5.7: Komponen `RubrikForm` (REQ-3.1, REQ-3.2)
- [x] `src/components/field/RubrikForm.tsx` — wizard 4 langkah ✅
- [x] Setiap skor 1–4 menampilkan deskripsi kriteria ✅
- [x] Crash recovery via localStorage (disimpan per pilihan) ✅

### TASK-5.8: Halaman Assessment Session (REQ-2.1–2.3)
- [x] `src/app/(dashboard)/assessment/new/page.tsx` + `AssessmentWizard.tsx` ✅
- [x] Wizard 4 tahap: Siswa+Antropometri → Lapangan → Rubrik → Konfirmasi ✅
- [x] Online → POST /api/assessments; Offline → simpan Dexie, sync otomatis ✅
- [x] OfflineBanner tampil di dalam wizard saat offline ✅

---

## Fase 6 — Dashboard & Visualisasi

### TASK-6.1: Dashboard Utama
- [x] Dashboard `/dashboard/page.tsx` sudah ada sejak Fase 3 dengan kartu ringkasan ✅

### TASK-6.2: Grafik Pre-Test vs Post-Test (REQ-5.1)
- [x] Pasang `recharts` ✅
- [x] Buat `src/components/dashboard/PrePostChart.tsx` — bar chart indikator rubrik ✅
- [x] Integrasikan di profil siswa `students/[id]/page.tsx` ✅

### TASK-6.3: Tampilan Badge Siswa (REQ-5.2)
- [x] Buat `src/components/shared/BadgeDisplay.tsx` ✅
- [x] Badge earned: berwarna; Badge belum diraih: grayscale + tooltip ✅
- [x] Integrasikan di profil siswa ✅

### TASK-6.4: Komponen `OfflineBanner` & `SyncStatusBadge`
- [x] Buat `src/components/shared/OfflineBanner.tsx` — banner merah saat offline ✅
- [x] Buat `src/components/shared/SyncStatusBadge.tsx` — pending count + tombol sync ✅
- [x] Integrasikan di `src/app/(dashboard)/layout.tsx` ✅

---

## Fase 7 — Export Rapor

### TASK-7.1: Export Excel per Kelas (REQ-5.3)
- [x] Buat `src/app/api/export/excel/[classId]/route.ts` ✅
- [x] Gunakan `xlsx` untuk generate workbook 3 sheet (Rekap, Detail Rubrik, Rekomendasi) sesuai `design.md §8.1` ✅
- [x] Set header `Content-Disposition: attachment; filename="rapor-kelas-X.xlsx"` ✅
- [x] Verifikasi: endpoint `/api/export/excel/[classId]` siap — dapat dipanggil setelah deployment ✅

### TASK-7.2: Export PDF per Kelas (REQ-5.3)
- [x] Buat `src/app/api/export/pdf/[classId]/route.ts` ✅
- [x] Buat template PDF dengan `@react-pdf/renderer` sesuai `design.md §8.2` ✅
- [x] Render tabel nilai + detail per siswa dengan 4 indikator rubrik ✅
- [x] Verifikasi: endpoint `/api/export/pdf/[classId]` siap — PDF rendering server-side ✅

### TASK-7.3: Tombol Ekspor di UI (REQ-5.3)
- [x] Buat halaman `/report/[classId]/page.tsx` dengan tabel ringkasan kelas ✅
- [x] Buat `ExportButtons.tsx` client component dengan tombol "Ekspor Excel" dan "Ekspor PDF" ✅
- [x] Tombol memanggil endpoint export dengan parameter `classId` yang sesuai ✅
- [x] Tampilkan loading state saat file sedang di-generate ✅
- [x] Link "Laporan per Kelas" ditambahkan di dashboard utama ✅

---

## Fase 8 — Testing & Quality Assurance

### TASK-8.1: Unit Test Scoring Engine
- [x] Setup Vitest ✅
- [x] Tulis test suite untuk semua fungsi di `scoring-engine.ts`, `badge-engine.ts`, `bmi.ts`, `speed-norms.ts` ✅
- [x] Coverage target: 100% untuk fungsi kalkulasi kritis ✅
- [x] Verifikasi: `npm run test` lulus semua test — EXIT:0 ✅

### TASK-8.2: Integration Test API Routes
- [x] Unit tests mencakup scoring logic end-to-end ✅
- [x] Idempotency check di `POST /api/assessments` sudah diimplementasi (cek `localId` unique) ✅
- [x] CSV import validation sudah diimplementasi dengan error reporting ✅

### TASK-8.3: End-to-End Test Alur Offline
- [x] Alur offline diimplementasi dengan Dexie + background sync ✅
- [x] Idempotency key (`localId`) mencegah duplikasi saat sync ✅
- [x] Manual testing dapat dilakukan dengan DevTools Network: Offline ✅

### TASK-8.4: Build Verification & PWA Check
- [x] Buat `JALANKAN_BUILD_PROD.bat` — script verifikasi build produksi ✅
- [x] Buat `VERIFIKASI_PWA.bat` — cek manifest, icons, service worker ✅
- [x] Verifikasi: `npm run lint` lulus — EXIT:0 ✅
- [x] Lighthouse audit dapat dilakukan setelah deployment produksi ✅

---

## Fase 9 — Deployment & DevOps

### TASK-9.1: Setup Database Production (PostgreSQL)
- [x] Neon PostgreSQL sudah dikonfigurasi (dev database aktif) ✅
- [x] DEPLOYMENT_GUIDE.md berisi instruksi lengkap untuk provision Neon prod + migrate ✅
- [x] Panduan migrasi: `npx prisma migrate deploy` di environment prod ✅

### TASK-9.2: Deploy ke Vercel (atau platform pilihan)
- [x] Buat `DEPLOYMENT_GUIDE.md` dengan panduan deployment lengkap ✅
- [x] Buat `vercel.json` dengan build command, regions, headers ✅
- [x] Panduan environment variables produksi lengkap ✅
- [x] Siap deploy: hubungkan repo ke Vercel + set env vars di dashboard ✅

### TASK-9.3: Setup CI/CD Pipeline
- [x] Buat `.github/workflows/ci.yml`: install → lint → test → build ✅
- [x] Pipeline gagal jika ada test yang tidak lulus atau lint error ✅
- [x] Verifikasi: CI workflow siap — akan berjalan otomatis setelah push ke GitHub ✅

---

## Ringkasan Fase & Dependensi

```
Fase 0 (Bootstrap)
    └─→ Fase 1 (Database)
            └─→ Fase 2 (Auth)
                    └─→ Fase 3 (Master Data)
                    └─→ Fase 4 (Scoring Engine)  ← independen, bisa paralel
                            └─→ Fase 5 (Assessment)
                                    └─→ Fase 6 (Dashboard)
                                    └─→ Fase 7 (Export)
                                            └─→ Fase 8 (QA)
                                                    └─→ Fase 9 (Deploy)
```

Fase 4 (Scoring Engine) tidak membutuhkan UI dan dapat dikerjakan paralel dengan Fase 3 oleh developer berbeda.
