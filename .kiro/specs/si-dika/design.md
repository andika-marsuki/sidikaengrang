# SI-DIKA — Technical Design Document

> Status: **APPROVED — Implementasi Fase 0 & 1 Selesai**
> Referensi: `SPEC.md` v1.0

---

## 1. Arsitektur Sistem

### 1.1 Gambaran Umum

SI-DIKA menggunakan arsitektur **Offline-First PWA** berlapis tiga:

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (Browser / PWA — Next.js App Router)                │
│  ┌────────────────────┐   ┌─────────────────────────────┐  │
│  │  React Server       │   │  Client Components           │  │
│  │  Components (RSC)   │   │  - Stopwatch / Counter       │  │
│  │  - Dashboard        │   │  - Rubrik Form               │  │
│  │  - Laporan / Rapor  │   │  - Offline Status Banner     │  │
│  └────────────────────┘   └────────────┬────────────────┘  │
│                                         │                    │
│                            ┌────────────▼────────────────┐  │
│                            │  Dexie.js (IndexedDB)        │  │
│                            │  Local store — PENDING_SYNC  │  │
│                            └────────────┬────────────────┘  │
└─────────────────────────────────────────┼────────────────────┘
                 Service Worker (bg-sync) │ online
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│  SERVER (Next.js — Vercel / VPS)                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Layer: App Router Route Handlers + Server Actions│  │
│  │  Validation: Zod schemas                              │  │
│  │  Auth: Auth.js (JWT) + RBAC middleware                │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │  Prisma ORM  ←→  PostgreSQL                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Pemilihan Rendering Strategy

| Halaman | Strategy | Alasan |
|---|---|---|
| `/dashboard` | RSC + ISR (60 s) | Data agregat kelas, tidak real-time |
| `/assessment/[id]` | Client Component | Stopwatch & counter butuh state lokal |
| `/students` | RSC + Server Action | CRUD dengan revalidation |
| `/report/[classId]` | RSC | Render PDF/Excel di server |
| `/login` | RSC | Statis, tidak ada interaktivitas |

---

## 2. Struktur Folder Proyek

```
si-dika/
├── .kiro/
│   └── specs/si-dika/
│       ├── spec.md
│       ├── design.md          ← dokumen ini
│       └── tasks.md
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── public/
│   ├── icons/                 # PWA icons (192, 512 px)
│   ├── manifest.json
│   └── sw.js                  # Service Worker (di-generate next-pwa)
│
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Shell dengan sidebar & offline banner
│   │   │   ├── page.tsx       # Dashboard ringkasan kelas
│   │   │   ├── students/
│   │   │   │   ├── page.tsx   # Daftar siswa
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Profil siswa + riwayat
│   │   │   ├── assessment/
│   │   │   │   ├── page.tsx      # Pilih siswa → mulai sesi
│   │   │   │   └── [sessionId]/
│   │   │   │       └── page.tsx  # Stopwatch + Counter + Rubrik
│   │   │   ├── egrang-specs/
│   │   │   │   └── page.tsx
│   │   │   └── report/
│   │   │       └── [classId]/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── students/
│   │       │   ├── route.ts        # GET list, POST create
│   │       │   └── [id]/route.ts   # GET, PATCH, DELETE
│   │       ├── assessments/
│   │       │   ├── route.ts        # POST create assessment
│   │       │   ├── [id]/route.ts   # GET, PATCH
│   │       │   └── sync/route.ts   # POST bulk sync dari offline queue
│   │       ├── egrang-specs/
│   │       │   └── route.ts
│   │       └── export/
│   │           ├── excel/[classId]/route.ts
│   │           └── pdf/[classId]/route.ts
│   │
│   ├── components/
│   │   ├── ui/                # Primitif: Button, Card, Badge, Input
│   │   ├── field/             # Komponen lapangan (high-contrast)
│   │   │   ├── Stopwatch.tsx
│   │   │   ├── CounterButton.tsx
│   │   │   └── RubrikForm.tsx
│   │   ├── dashboard/
│   │   │   ├── ClassSummaryCard.tsx
│   │   │   └── PrePostChart.tsx
│   │   ├── students/
│   │   │   ├── StudentTable.tsx
│   │   │   ├── ImportCSVModal.tsx
│   │   │   └── AnthropometryForm.tsx
│   │   └── shared/
│   │       ├── OfflineBanner.tsx
│   │       ├── SyncStatusBadge.tsx
│   │       └── BadgeDisplay.tsx
│   │
│   ├── lib/
│   │   ├── auth.ts            # Auth.js config + RBAC helpers
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── scoring-engine.ts  # Kalkulasi skor, predikat, rekomendasi
│   │   ├── badge-engine.ts    # Logika evaluasi badge
│   │   ├── bmi.ts             # Kalkulasi BMI + rekomendasi pijakan
│   │   ├── speed-norms.ts     # Tabel norma kecepatan per usia/gender
│   │   └── offline/
│   │       ├── db.ts          # Dexie instance & schema
│   │       ├── sync.ts        # Background sync orchestrator
│   │       └── queue.ts       # PENDING_SYNC queue helpers
│   │
│   ├── hooks/
│   │   ├── useStopwatch.ts
│   │   ├── useOnlineStatus.ts
│   │   └── useSyncQueue.ts
│   │
│   ├── schemas/               # Zod validation schemas
│   │   ├── student.schema.ts
│   │   ├── assessment.schema.ts
│   │   └── egrang-spec.schema.ts
│   │
│   └── types/
│       └── index.ts           # Shared TypeScript types & enums
│
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 3. Skema Database Prisma (Lengkap)

Skema berikut memperluas referensi dari `SPEC.md` dengan tambahan field yang dibutuhkan sistem:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  TEACHER
  STUDENT
}

enum Gender {
  L
  P
}

enum TestType {
  PRE_TEST
  POST_TEST
  PRACTICE
}

model User {
  id          String       @id @default(cuid())
  email       String       @unique
  name        String
  password    String       // bcrypt hash
  role        Role         @default(TEACHER)
  schoolId    String?      // future multi-school support
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  assessments Assessment[]
}

model Student {
  id          String         @id @default(cuid())
  nisn        String         @unique
  name        String
  className   String         // e.g., "VII-A"
  academicYear String        // e.g., "2024/2025"
  gender      Gender
  birthDate   DateTime
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  assessments Assessment[]
  badges      StudentBadge[]
}

model EgrangSpec {
  id            String       @id @default(cuid())
  name          String
  stepHeightCm  Int
  poleLengthCm  Int
  material      String
  createdAt     DateTime     @default(now())
  assessments   Assessment[]
}

model Assessment {
  id             String     @id @default(cuid())
  studentId      String
  student        Student    @relation(fields: [studentId], references: [id])
  teacherId      String
  teacher        User       @relation(fields: [teacherId], references: [id])
  egrangSpecId   String
  egrangSpec     EgrangSpec @relation(fields: [egrangSpecId], references: [id])
  testType       TestType   @default(PRE_TEST)

  // Antropometri
  heightCm       Float
  weightKg       Float
  bmi            Float

  // Data Lapangan
  trackDistanceM Float      @default(10.0)
  durationSeconds Float
  fallCount      Int        @default(0)
  stepCount      Int?

  // Rubrik Motorik (1–4)
  scoreStatic    Int
  scoreDynamic   Int
  scoreCoord     Int
  scorePosture   Int

  // Hasil Kalkulasi
  finalScore     Float
  predicate      String     // "Prima" | "Kompeten" | "Berkembang" | "Perlu Pendampingan"
  recommendation String     @db.Text

  // Audit
  assessedAt     DateTime   @default(now())
  syncedAt       DateTime   @default(now())
  localId        String?    // ID dari IndexedDB untuk dedup saat sync

  @@index([studentId, testType, assessedAt])
  @@index([teacherId])
}

model StudentBadge {
  id          String   @id @default(cuid())
  studentId   String
  student     Student  @relation(fields: [studentId], references: [id])
  badgeCode   String   // "ZERO_FALL" | "IRON_BALANCE" | "MOST_IMPROVED"
  badgeTitle  String
  awardedAt   DateTime @default(now())

  @@unique([studentId, badgeCode])  // satu badge per jenis per siswa
}
```

### Catatan Desain Database

- Field `localId` pada `Assessment` digunakan sebagai idempotency key saat proses background sync, mencegah duplikasi data jika request diulang.
- Index komposit `[studentId, testType, assessedAt]` mengoptimalkan query grafik pre/post-test.
- `@@unique([studentId, badgeCode])` memastikan setiap badge hanya diberikan sekali per siswa.

---

## 4. Offline-First: Dexie.js & Background Sync

### 4.1 Skema IndexedDB (Dexie)

```typescript
// src/lib/offline/db.ts
import Dexie, { type Table } from 'dexie';

export interface LocalAssessment {
  localId: string;          // cuid() dibuat di client
  status: 'PENDING_SYNC' | 'SYNCED' | 'CONFLICT';
  payload: AssessmentPayload;
  createdAt: number;        // Unix timestamp
  syncAttempts: number;
  lastError?: string;
}

export interface LocalStudent {
  localId: string;
  data: StudentPayload;
  status: 'PENDING_SYNC' | 'SYNCED';
}

class SIDikaDB extends Dexie {
  assessments!: Table<LocalAssessment>;
  students!: Table<LocalStudent>;

  constructor() {
    super('si-dika-db');
    this.version(1).stores({
      assessments: 'localId, status, createdAt',
      students:    'localId, status',
    });
  }
}

export const db = new SIDikaDB();
```

### 4.2 Alur Kerja Offline-First

```
Guru membuka halaman Assessment
        │
        ▼
  [useOnlineStatus] → cek navigator.onLine + ping /api/health
        │
   ┌────┴────┐
offline     online
   │            │
   ▼            ▼
Simpan ke   POST /api/assessments
Dexie       (langsung ke server)
status=     ────────────────────
PENDING     Jika gagal (network
            error) → fallback ke
            Dexie + PENDING_SYNC
        │
        ▼
  [useSyncQueue] berjalan di background
  setiap kali onLine event terpicu
        │
        ▼
  Ambil semua record status=PENDING_SYNC
  dari Dexie, urutkan berdasarkan createdAt
        │
        ▼
  POST /api/assessments/sync
  (kirim array, server idempotent via localId)
        │
        ▼
  Tandai status=SYNCED di Dexie
  Tampilkan toast "X data berhasil disinkronkan"
```

### 4.3 Strategi Conflict Resolution

Server menggunakan field `localId` sebagai idempotency key:
- Jika `Assessment` dengan `localId` yang sama sudah ada → server mengabaikan (return 200 dengan data existing).
- Server **tidak menimpa** data yang sudah ada; prinsipnya *first write wins* untuk mencegah kehilangan data lapangan.
- Jika terjadi konflik nyata (data yang sama diedit di dua perangkat berbeda), sistem mencatat status `CONFLICT` di Dexie dan menampilkan notifikasi kepada guru untuk resolusi manual.

### 4.4 Service Worker (next-pwa)

```
Cache Strategy per Resource:
- Halaman App Shell         → CacheFirst (stale-while-revalidate)
- API /api/students         → NetworkFirst (fallback ke IndexedDB)
- API /api/assessments      → NetworkOnly (tulis selalu ke Dexie dulu)
- Font & Static Assets      → CacheFirst (max-age 1 tahun)
```

---

## 5. Scoring Engine

Semua logika kalkulasi diisolasi di `src/lib/scoring-engine.ts` agar dapat diuji secara unit dan dijalankan baik di client (saat offline) maupun server.

### 5.1 Formula

```typescript
// src/lib/scoring-engine.ts

export interface ScoringInput {
  scoreStatic:    number;  // 1–4
  scoreDynamic:   number;  // 1–4
  scoreCoord:     number;  // 1–4
  scorePosture:   number;  // 1–4
  fallCount:      number;
  durationSeconds: number;
  trackDistanceM: number;
  ageYears:       number;
  gender:         'L' | 'P';
}

export interface ScoringResult {
  rubricComponent:   number;  // maks 40
  balanceComponent:  number;  // maks 35
  speedComponent:    number;  // maks 25
  finalScore:        number;  // 0–100
  predicate:         string;
  recommendation:    string;
}

// Komponen Rubrik (40%)
function calcRubric(input: ScoringInput): number {
  const raw = input.scoreStatic + input.scoreDynamic +
              input.scoreCoord  + input.scorePosture;
  return (raw / 16) * 40;
}

// Komponen Keseimbangan & Kontrol (35%, penalti jatuh)
function calcBalance(fallCount: number): number {
  return Math.max(0, 35 - fallCount * 5);
}

// Komponen Kecepatan (25%)
// Dibandingkan dengan speed norm tabel per usia+gender
function calcSpeed(input: ScoringInput): number {
  const actualSpeed = input.trackDistanceM / input.durationSeconds;
  const norm = getSpeedNorm(input.ageYears, input.gender); // m/s
  const ratio = Math.min(actualSpeed / norm.target, 1.5);  // cap 150%
  return Math.min((ratio / 1.5) * 25, 25);
}
```

### 5.2 Tabel Norma Kecepatan (Speed Norms)

Data norma kecepatan disimpan di `src/lib/speed-norms.ts` sebagai lookup table berdasarkan rentang usia dan jenis kelamin. Nilai awal mengacu pada standar tes kebugaran egrang Dikdasmen:

| Usia | Gender | Target (m/s) | Minimum (m/s) |
|------|--------|-------------|---------------|
| 7–9  | L      | 0.35        | 0.15          |
| 7–9  | P      | 0.30        | 0.12          |
| 10–12| L      | 0.50        | 0.25          |
| 10–12| P      | 0.45        | 0.20          |
| 13–15| L      | 0.65        | 0.35          |
| 13–15| P      | 0.55        | 0.28          |

### 5.3 Rekomendasi Otomatis

```
IF scoreCoord   <= 2 → "Latihan fokus pandang: tatap titik tetap 5 m ke depan,
                        ayunkan tongkat berirama 1-2-1-2 tanpa melihat kaki."
IF scoreStatic  <= 2 → "Latihan keseimbangan statis: berdiri di atas batu bata
                        10×20 cm selama 10 detik, tingkatkan durasi tiap sesi."
IF scoreDynamic <= 2 → "Latihan lintasan zig-zag ringan dengan tongkat kayu
                        setinggi pinggang sebelum naik egrang."
IF scorePosture <= 2 → "Latihan penguatan core: plank 20 detik × 3 set,
                        dan latihan genggaman dengan bola tenis."
IF fallCount    >= 3 → "Kurangi jarak lintasan ke 5 m, fokus pada mounting
                        (naik ke pijakan) hingga stabil sebelum menambah jarak."
```

Jika lebih dari satu indikator lemah, rekomendasi digabung berurutan dari yang terlemah.

---

## 6. Desain UI High-Contrast (Mode Lapangan)

### 6.1 Prinsip Desain

Halaman assessment lapangan dirancang untuk:
- **Visibilitas di luar ruangan** (sinar matahari langsung): kontras minimum WCAG AA (4.5:1), preferensi AAA.
- **Operasi satu tangan**: tombol utama minimal 64×64 px, zona tap aman di area ibu jari.
- **Minimal distraksi kognitif**: tampilkan hanya kontrol yang relevan per tahap (Step-by-Step wizard).

### 6.2 Color Palette (Mode Lapangan)

| Token | Hex | Penggunaan |
|---|---|---|
| `field-bg` | `#0A0A0A` | Background utama (hitam pekat) |
| `field-surface` | `#1A1A1A` | Card / panel |
| `field-primary` | `#FACC15` | Tombol Start, angka stopwatch (kuning cerah) |
| `field-danger` | `#EF4444` | Tombol Stop, counter Jatuh |
| `field-success` | `#22C55E` | Status "Tersimpan", badge Synced |
| `field-muted` | `#9CA3AF` | Teks sekunder |
| `field-text` | `#F9FAFB` | Teks utama (putih) |

### 6.3 Komponen Stopwatch

```
┌─────────────────────────────────────────┐
│  ← Budi Santoso     [🔴 OFFLINE]        │  ← Header 48px
├─────────────────────────────────────────┤
│                                         │
│         ██████████                      │
│         00:34.721                       │  ← Display 72px bold
│                                         │
│  [   ▶ START   ]  [  ⏸ PAUSE  ]        │  ← Tombol 64px height
│  [   ■ STOP    ]  [  ↺ RESET  ]        │
│                                         │
├─────────────────────────────────────────┤
│  JATUH          LANGKAH                 │
│  ┌──────────┐   ┌──────────┐           │
│  │    👟    │   │    👣    │           │
│  │    3     │   │   12     │   ← 80px  │
│  │  [  +  ] │   │  [  +  ] │           │
│  └──────────┘   └──────────┘           │
└─────────────────────────────────────────┘
```

### 6.4 Komponen Rubrik (Wizard Step 2)

Rubrik ditampilkan sebagai 4 kartu vertikal, satu per satu (swipe atau tombol Lanjut), agar guru tidak salah tap:

```
┌─────────────────────────────────────────┐
│  Indikator 2 dari 4                     │
│  KESEIMBANGAN DINAMIS                   │
├─────────────────────────────────────────┤
│  Pilih skor (1–4):                      │
│                                         │
│  [1] Tidak mampu berjalan > 2 langkah  │
│  [2] Berjalan tetapi sering oleng       │
│  [3] Berjalan stabil, 1–2× koreksi     │
│  [4] Berjalan lancar tanpa koreksi     │  ← tap memilih, beri highlight
│                                         │
│  [← Kembali]              [Lanjut →]   │
└─────────────────────────────────────────┘
```

### 6.5 Responsive Breakpoints

| Breakpoint | Target perangkat | Catatan |
|---|---|---|
| `< 640px` | Smartphone guru (mode lapangan) | High-contrast, tombol besar |
| `640–1024px` | Tablet / iPad | Layout 2 kolom |
| `> 1024px` | Desktop / Laptop sekolah | Dashboard full dengan sidebar |

---

## 7. Alur Autentikasi & RBAC

### 7.1 Role & Permission Matrix

| Resource | ADMIN | TEACHER | STUDENT |
|---|---|---|---|
| Kelola User | ✅ | ❌ | ❌ |
| Import/CRUD Siswa | ✅ | ✅ | ❌ |
| Buat Assessment | ❌ | ✅ | ❌ |
| Lihat Assessment sendiri | ❌ | ✅ | ✅ |
| Ekspor Rapor | ✅ | ✅ | ❌ |
| Kelola EgrangSpec | ✅ | Lihat saja | ❌ |

### 7.2 Middleware

```typescript
// src/middleware.ts
export const config = {
  matcher: ['/(dashboard|api)/:path*'],
};

// Alur:
// 1. Periksa session JWT (Auth.js)
// 2. Jika tidak ada session → redirect /login
// 3. Periksa role vs route:
//    /api/admin/* → role === 'ADMIN' saja
//    /api/assessments → role === 'TEACHER' || 'ADMIN'
//    /api/students/[id]/report → semua role (dengan filter studentId)
```

---

## 8. Export Engine

### 8.1 Excel (`.xlsx`)

Menggunakan library `xlsx` (SheetJS). Dijalankan di Route Handler `/api/export/excel/[classId]`.

Struktur sheet:
- **Sheet 1 "Rekap Kelas":** satu baris per siswa, kolom: NISN, Nama, Kelas, Jenis Kelamin, Jenis Tes, Komponen Rubrik, Komponen Keseimbangan, Komponen Kecepatan, Skor Akhir, Predikat.
- **Sheet 2 "Detail Rubrik":** breakdown nilai per indikator motorik.
- **Sheet 3 "Rekomendasi":** daftar rekomendasi per siswa.

### 8.2 PDF (`.pdf`)

Menggunakan `@react-pdf/renderer`. Template rapor per kelas berisi:
- Header: logo sekolah, nama kelas, guru, tahun ajaran.
- Tabel nilai per siswa (sama dengan Sheet 1 Excel).
- Halaman terpisah per siswa: grafik radar 4 indikator, grafik bar pre/post-test, narasi rekomendasi.

---

## 9. Dependency List

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "typescript": "^5.x",
    "tailwindcss": "^4.x",
    "prisma": "^6.x",
    "@prisma/client": "^6.x",
    "auth.js": "^5.x",
    "dexie": "^4.x",
    "dexie-react-hooks": "^1.x",
    "zod": "^3.x",
    "xlsx": "^0.18.x",
    "@react-pdf/renderer": "^3.x",
    "recharts": "^2.x",
    "next-pwa": "^5.x",
    "bcryptjs": "^2.x",
    "cuid2": "^2.x",
    "papaparse": "^5.x"
  },
  "devDependencies": {
    "vitest": "^2.x",
    "@testing-library/react": "^16.x",
    "prettier": "^3.x",
    "eslint": "^9.x"
  }
}
```

---

## 10. Keputusan Desain & Trade-off

| Keputusan | Alternatif Dipertimbangkan | Alasan Dipilih |
|---|---|---|
| Next.js App Router | Pages Router, Remix | App Router mendukung RSC yang mengurangi JS bundle di dashboard; cocok untuk hybrid SSR+Client |
| Dexie.js | localForage, PouchDB | API lebih ergonomis untuk TypeScript; mendukung reactive queries via `dexie-react-hooks` |
| Auth.js v5 | Lucia Auth, custom JWT | Paling matang untuk Next.js; mendukung credential provider + session management |
| `@react-pdf/renderer` | jsPDF, Puppeteer | Render PDF deklaratif di React; tidak butuh browser headless di server |
| Recharts | Chart.js, Victory | Ringan, composable, dukungan SSR baik di Next.js |
| `xlsx` (SheetJS) | exceljs | Bundle lebih kecil; cukup untuk kebutuhan export tanpa formula kompleks |
