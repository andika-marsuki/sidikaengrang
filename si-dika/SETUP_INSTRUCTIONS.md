# SI-DIKA — Setup Instructions

## Status Implementasi

✅ **Fase 0** — Inisialisasi Proyek (Bootstrap Next.js, Tailwind, ESLint, Prettier, PWA config)  
✅ **Fase 1** — Database & ORM (Prisma schema, seed data)  
✅ **Fase 2** — Autentikasi & RBAC (Auth.js v5, login page, middleware, RBAC helpers)  
✅ **Fase 3** — Manajemen Master Data (API CRUD Students, Import CSV/Excel, Profil Siswa + BMI, Egrang Specs)

**Fase 4-9** akan dikerjakan setelah verifikasi Fase 0-3 berhasil.

---

## Prerequisites

- **Node.js** v18+ dan npm (sudah terinstal di `C:\Program Files\nodejs`)
- **PostgreSQL** database (menggunakan Neon PostgreSQL cloud)
- **Git** (untuk version control)

---

## Setup Database & Instalasi

### Langkah 1: Install Dependencies

Jalankan file batch yang sudah disiapkan:

```cmd
cd C:\KIRO\sidikaenggrang\si-dika
_fullsetup.bat
```

Atau jalankan manual satu per satu:

```cmd
cd C:\KIRO\sidikaenggrang\si-dika

# Install npm packages
npm install

# Generate Prisma Client
npx prisma generate

# Run database migration
npx prisma migrate dev --name init

# Seed database dengan data awal
npm run db:seed

# Type check
npx tsc --noEmit
```

### Langkah 2: Verifikasi Database Connection

Jalankan Prisma Studio untuk melihat data seed:

```cmd
npm run db:studio
```

Atau test endpoint health:

```cmd
npm run dev
```

Lalu buka browser ke `http://localhost:3000/api/health` - harus mengembalikan JSON:

```json
{
  "success": true,
  "status": "healthy",
  "database": "connected",
  "timestamp": "..."
}
```

---

## Verifikasi Fase 2 & 3

### Test Login

1. Jalankan dev server:
   ```cmd
   npm run dev
   ```

2. Buka `http://localhost:3000/login`

3. Login menggunakan akun seed:

   **Admin:**
   - Email: `admin@si-dika.sch.id`
   - Password: `Admin@12345`

   **Teacher:**
   - Email: `guru.pjok@si-dika.sch.id`
   - Password: `Guru@12345`

   **Student (login menggunakan NISN):**
   - Identifier: `1234567890` (NISN, tanpa domain email)
   - Password: `Siswa@12345`

4. Setelah login berhasil, harus redirect ke `/dashboard`

### Test API Endpoints

Gunakan REST client (Postman/Insomnia) atau curl:

```bash
# GET list students (perlu login token)
curl http://localhost:3000/api/students

# GET health check (public)
curl http://localhost:3000/api/health

# GET egrang specs
curl http://localhost:3000/api/egrang-specs
```

### Test Halaman UI

Akses halaman-halaman berikut (harus login dulu):

- `/dashboard` — Dashboard utama dengan statistik
- `/students` — Daftar siswa dengan filter dan pagination
- `/students/[id]` — Profil siswa dengan BMI, rekomendasi pijakan, riwayat assessment, dan badge
- `/egrang-specs` — Daftar spesifikasi egrang

---

## Data Seed yang Tersedia

Setelah `npm run db:seed`, database berisi:

### Users (3)
- **admin@si-dika.sch.id** (role: ADMIN, password: `Admin@12345`)
- **guru.pjok@si-dika.sch.id** (role: TEACHER, password: `Guru@12345`)
- **1234567890@siswa.si-dika.sch.id** (role: STUDENT, password: `Siswa@12345`)

### Students (5)
- Budi Santoso (NISN: 1234567890, kelas: VII-A)
- Siti Nurhaliza (NISN: 1234567891, kelas: VII-A)
- Ahmad Zaki (NISN: 1234567892, kelas: VII-B)
- Dewi Lestari (NISN: 1234567893, kelas: VIII-A)
- Fikri Ramadhan (NISN: 1234567894, kelas: VIII-B)

### EgrangSpec (3)
- Egrang SD Standar 20cm Bambu
- Egrang SMP Standar 30cm Bambu
- Egrang SMP Kompetisi 40cm Kayu

### Assessments (5)
- Pre-test dan post-test untuk Budi dan Siti
- Practice untuk Ahmad

### Badges (3)
- Siti: ZERO_FALL + IRON_BALANCE
- Budi: MOST_IMPROVED

---

## Troubleshooting

### npm install gagal dengan error ERESOLVE

Jalankan dengan flag:
```cmd
npm install --legacy-peer-deps
```

### Prisma migrate gagal

Pastikan `DATABASE_URL` di `.env.local` sudah benar dan database online.

Test koneksi:
```cmd
npx prisma db pull
```

### TypeScript error saat compile

Jalankan:
```cmd
npx tsc --noEmit
```

Periksa error dan perbaiki. Semua kode Fase 2-3 sudah type-safe.

---

## Next Steps (Fase 4-9)

Setelah verifikasi berhasil, lanjut implementasi:

- **Fase 4** — Scoring Engine (unit tests untuk kalkulasi skor)
- **Fase 5** — Modul Assessment Lapangan (stopwatch, counter, rubrik form, offline sync)
- **Fase 6** — Dashboard & Visualisasi (grafik Recharts, badge display, offline banner)
- **Fase 7** — Export Rapor (Excel + PDF)
- **Fase 8** — Testing & QA (Vitest unit tests, integration tests)
- **Fase 9** — Deployment (Vercel, CI/CD)

---

## File Penting yang Telah Dibuat

### Fase 2 - Autentikasi
- `src/lib/auth.ts` — Auth.js v5 config + RBAC helpers
- `src/app/api/auth/[...nextauth]/route.ts` — Auth API route
- `src/app/(auth)/login/page.tsx` — Login page dengan dukungan NISN
- `src/middleware.ts` — Route protection & RBAC middleware

### Fase 3 - Master Data
- `src/app/api/students/route.ts` — GET + POST students
- `src/app/api/students/[id]/route.ts` — GET + PATCH + DELETE student by ID
- `src/app/api/students/import/route.ts` — Import CSV/Excel
- `src/app/api/egrang-specs/route.ts` — GET + POST egrang specs
- `src/app/api/health/route.ts` — Health check endpoint
- `src/schemas/student.schema.ts` — Zod validation schema
- `src/app/(dashboard)/students/page.tsx` — Daftar siswa (Server Component)
- `src/app/(dashboard)/students/[id]/page.tsx` — Profil siswa + BMI + badges
- `src/app/(dashboard)/egrang-specs/page.tsx` — Manajemen spesifikasi egrang
- `src/app/(dashboard)/dashboard/page.tsx` — Dashboard utama
- `src/app/(dashboard)/layout.tsx` — Dashboard layout dengan navbar

### Library/Utilities (sudah ada sejak Fase 1)
- `src/lib/prisma.ts` — Prisma client singleton
- `src/lib/scoring-engine.ts` — Scoring logic (Fase 4)
- `src/lib/bmi.ts` — BMI calculator + rekomendasi pijakan
- `src/lib/speed-norms.ts` — Tabel norma kecepatan
- `src/types/index.ts` — Shared TypeScript types

---

## Kontak & Dukungan

Untuk pertanyaan atau masalah selama setup, hubungi:
- **Developer Lead:** [email/kontak]
- **GitHub Issues:** [repo URL]

---

**Last Updated:** 26 November 2026 (auto-generated by Kiro AI Agent)
