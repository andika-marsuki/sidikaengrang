# SI-DIKA

**Sistem Informasi Digital Kebugaran Aktif**

Aplikasi web untuk evaluasi kebugaran jasmani berbasis permainan tradisional egrang, digunakan untuk mata pelajaran PJOK (Pendidikan Jasmani, Olahraga, dan Kesehatan).

---

## 🎯 Fitur Utama

### ✅ Fase 0-3 (Sudah Selesai)

- **Autentikasi Multi-Role:** Admin, Teacher, Student
  - Login menggunakan email (admin/teacher) atau NISN 10-digit (siswa)
- **Manajemen Master Data Siswa:**
  - CRUD siswa dengan API lengkap
  - Import bulk dari CSV/Excel
  - Filter & pagination
- **Profil Siswa dengan Kalkulasi BMI:**
  - Kalkulasi BMI otomatis dari antropometri terakhir
  - Rekomendasi tinggi pijakan egrang yang aman
  - Riwayat assessment & badge
- **Manajemen Spesifikasi Egrang:**
  - Daftar standar alat egrang yang digunakan
- **Role-Based Access Control (RBAC):**
  - Middleware proteksi route
  - Fine-grained permission per endpoint

### 🚧 Fase 4-9 (Dalam Pengembangan)

- Modul assessment lapangan (stopwatch, counter, rubrik)
- Offline-first dengan IndexedDB sync
- Grafik visualisasi Pre-Test vs Post-Test
- Gamifikasi dengan badge system
- Export rapor PDF & Excel
- PWA untuk mobile field use

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend:** Next.js API Routes + Server Actions
- **Database:** PostgreSQL (Neon Cloud) + Prisma ORM
- **Authentication:** Auth.js v5 (JWT session)
- **Offline:** Dexie.js (IndexedDB)
- **Validation:** Zod
- **Testing:** Vitest (unit tests) + Testing Library (integration)

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL database (atau gunakan Neon Cloud yang sudah dikonfigurasi)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma Client
npx prisma generate

# 3. Run database migration
npx prisma migrate dev --name init

# 4. Seed database dengan data demo
npm run db:seed

# 5. Start dev server
npm run dev
```

Buka `http://localhost:3000` di browser.

### Login Demo

**Admin:**
- Email: `admin@si-dika.sch.id`
- Password: `Admin@12345`

**Teacher:**
- Email: `guru.pjok@si-dika.sch.id`
- Password: `Guru@12345`

**Student (login via NISN):**
- Identifier: `1234567890`
- Password: `Siswa@12345`

---

## 📚 Documentation

- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** — Panduan setup lengkap & troubleshooting
- **[PROGRESS_REPORT.md](./PROGRESS_REPORT.md)** — Laporan detail implementasi Fase 0-3
- **[SPEC.md](../SPEC.md)** — Spesifikasi lengkap sistem
- **[tasks.md](./.kiro/specs/si-dika/tasks.md)** — Task breakdown per fase

---

## 🗂️ Project Structure

```
si-dika/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Seed data script
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── students/      # Student management pages
│   │   │   ├── egrang-specs/  # Egrang spec pages
│   │   │   └── dashboard/     # Main dashboard
│   │   └── api/               # API routes
│   │       ├── auth/          # Auth.js endpoints
│   │       ├── students/      # Student CRUD + import
│   │       ├── egrang-specs/  # Egrang spec CRUD
│   │       └── health/        # Health check endpoint
│   ├── lib/
│   │   ├── auth.ts            # Auth.js config + RBAC helpers
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── scoring-engine.ts  # Scoring logic
│   │   ├── bmi.ts             # BMI calculator
│   │   └── speed-norms.ts     # Speed norms lookup table
│   ├── schemas/
│   │   └── student.schema.ts  # Zod validation schemas
│   ├── types/
│   │   └── index.ts           # Shared TypeScript types
│   └── middleware.ts          # Route protection middleware
├── .env.local                 # Environment variables (not in Git)
├── .env.example               # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 🧪 Testing

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Format
npm run format

# Unit tests (Fase 8)
npm run test

# Test coverage
npm run test:coverage
```

---

## 📦 Database Schema

### Models

- **User** — Admin, Teacher, Student accounts
- **Student** — Master data siswa (NISN, kelas, gender, tanggal lahir)
- **EgrangSpec** — Spesifikasi alat egrang (tinggi pijakan, panjang tongkat, material)
- **Assessment** — Sesi penilaian (antropometri + data lapangan + rubrik + skor)
- **StudentBadge** — Lencana pencapaian siswa

### Seed Data

Setelah `npm run db:seed`:
- 3 users (admin, teacher, student)
- 5 students dengan assessment lengkap
- 3 egrang specs
- 5 assessments (pre-test, post-test, practice)
- 3 badges (ZERO_FALL, IRON_BALANCE, MOST_IMPROVED)

---

## 🤝 Contributing

Proyek ini dikembangkan untuk penelitian pendidikan. Untuk kontribusi:

1. Fork repository
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

[MIT License](./LICENSE) — feel free to use for educational purposes.

---

## 📧 Contact & Support

- **Developer:** [Your Name/Team]
- **Email:** [contact@example.com]
- **GitHub:** [repo URL]

---

**Built with ❤️ by Kiro AI Development Agent**  
Last updated: 26 November 2026
