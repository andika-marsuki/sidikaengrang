# Specification: SI-EGRANG (Sistem Informasi Digital Kebugaran Aktif Permainan Tradisional Egrang)

## 1. Overview & Purpose
**SI-EGRANG** adalah aplikasi sistem informasi evaluasi kebugaran jasmani berbasis permainan tradisional egrang untuk mata pelajaran Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK). Aplikasi ini menggantikan pencatatan manual guru di lapangan dengan sistem penilaian digital yang objektif, terukur secara biomekanika (keseimbangan statis, keseimbangan dinamis, koordinasi mata-tangan-kaki, dan daya tahan otot), serta mendukung mode **Offline-First** untuk digunakan di lapangan terbuka dengan koneksi internet terbatas.

### Target Users
1. **Guru PJOK (Assessor):** Melakukan input data antropometri siswa, mengoperasikan stopwatch/counter lapangan, mengisi rubrik observasi motorik, dan mencetak rapor kebugaran.
2. **Admin Sekolah:** Mengelola master data siswa, kelas, tahun ajaran, dan standarisasi spesifikasi alat egrang.
3. **Siswa / Orang Tua (Viewer):** Melihat hasil evaluasi kebugaran, grafik perkembangan *pre-test* ke *post-test*, dan lencana pencapaian (*gamification badges*).

---

## 2. Tech Stack & Architecture Constraints
* **Frontend (Mobile/Field PWA & Web Dashboard):** Next.js (App Router) dengan TypeScript, Tailwind CSS, dan dukungan Progressive Web App (PWA) untuk instalasi di perangkat seluler guru.
* **Offline Storage & Sync:** IndexedDB (menggunakan Dexie.js) sebagai penyimpanan lokal utama saat offline, dengan mekanisme *background sync* ke server saat koneksi tersedia.
* **Backend & API:** Next.js API Routes / Server Actions (atau REST API) dengan validasi skema menggunakan Zod.
* **Database & ORM:** PostgreSQL dengan Prisma ORM.
* **Authentication:** Auth.js / JWT dengan Role-Based Access Control (`ADMIN`, `TEACHER`, `STUDENT`).
* **Export Engine:** Library pembuatan laporan PDF (`@react-pdf/renderer` atau `jspdf`) dan Excel (`xlsx`).

---

## 3. Functional Requirements (EARS Format)

### 3.1. Manajemen Master Data & Antropometri
* **REQ-1.1:** *When* Admin atau Guru mengunggah file CSV/Excel data siswa, *the system shall* memvalidasi format kolom (`nisn`, `nama`, `kelas`, `jenis_kelamin`, `tanggal_lahir`) dan menyimpan data siswa ke database.
* **REQ-1.2:** *When* Guru menginput `tinggi_badan` (cm) dan `berat_badan` (kg) siswa, *the system shall* menghitung nilai Body Mass Index (BMI) secara otomatis dan merekomendasikan tinggi pijakan egrang yang aman sesuai proporsi tinggi badan siswa.
* **REQ-1.3:** *The system shall* memungkinkan Admin/Guru mendaftarkan spesifikasi standar alat egrang yang digunakan dalam pengujian (`tinggi_pijakan_cm`, `panjang_tongkat_cm`, `jenis_bahan`).

### 3.2. Modul Penilaian Lapangan (Field Assessment & Stopwatch)
* **REQ-2.1:** *When* Guru memilih siswa dan memulai sesi uji lintasan egrang, *the system shall* menyediakan antarmuka *high-contrast* dengan tombol stopwatch (`Start`, `Pause`, `Stop`, `Reset`) yang mencatat `waktu_tempuh` dalam presisi milidetik/detik.
* **REQ-2.2:** *While* stopwatch berjalan, *the system shall* menyediakan tombol *one-tap counter* besar untuk mencatat `jumlah_jatuh` (kaki menyentuh tanah sebelum garis finis) dan `jumlah_langkah` secara real-time tanpa menghentikan waktu.
* **REQ-2.3:** *If* perangkat guru kehilangan koneksi internet saat berada di lapangan, *then the system shall* tetap menyimpan seluruh data stopwatch, counter, dan rubrik ke dalam IndexedDB lokal dengan status `PENDING_SYNC`.
* **REQ-2.4:** *When* koneksi internet kembali terdeteksi, *the system shall* melakukan sinkronisasi data `PENDING_SYNC` ke database PostgreSQL secara otomatis tanpa menimpa data yang lebih baru.

### 3.3. Smart Rubrik Motorik & Biomekanika
* **REQ-3.1:** *The system shall* menyediakan formulir rubrik penilaian skala Likert (1–4) untuk 4 indikator utama:
  1. **Keseimbangan Statis (`skor_statis`):** Kemampuan naik dan berdiri diam di atas pijakan selama minimal 5 detik tanpa bantuan.
  2. **Keseimbangan Dinamis (`skor_dinamis`):** Kemampuan mempertahankan pusat gravitasi saat berjalan lurus maupun berbelok.
  3. **Koordinasi Mata-Tangan-Kaki (`skor_koordinasi`):** Sinkronisasi tarikan tangan pada tongkat, ayunan langkah kaki, dan arah pandangan mata ke depan (tidak menunduk terus-menerus).
  4. **Daya Tahan & Postur (`skor_postur`):** Kestabilan posisi punggung dan kekuatan genggaman hingga akhir lintasan.
* **REQ-3.2:** *When* Guru memilih angka skor (1–4) pada setiap indikator, *the system shall* menampilkan deskripsi kriteria singkat untuk mencegah bias penilaian antar-guru.

### 3.4. Mesin Kalkulasi Skor Kebugaran (Scoring Engine)
* **REQ-4.1:** *When* data uji lapangan dan rubrik disimpan, *the system shall* menghitung `skor_akhir` (skala 0–100) berdasarkan pembobotan terstandarisasi:
  * **40% Komponen Rubrik Motorik:** `((skor_statis + skor_dinamis + skor_koordinasi + skor_postur) / 16) * 40`
  * **35% Komponen Keseimbangan & Kontrol (Penalti Jatuh):** Maksimal 35 poin, dikurangi 5 poin setiap kali `jumlah_jatuh` terjadi (batas minimum 0 poin).
  * **25% Komponen Kecepatan & Daya Tahan:** Rasio `jarak_lintasan / waktu_tempuh` dibandingkan dengan norma kecepatan berdasarkan kelompok usia dan jenis kelamin.
* **REQ-4.2:** *The system shall* mengklasifikasikan `skor_akhir` ke dalam 4 predikat kebugaran:
  * `85 - 100`: **Sangat Baik (Prima)**
  * `70 - 84`: **Baik (Kompeten)**
  * `55 - 69`: **Cukup (Berkembang)**
  * `< 55`: **Kurang (Perlu Pendampingan)**
* **REQ-4.3:** *The system shall* menghasilkan rekomendasi latihan perbaikan secara otomatis berdasarkan indikator dengan nilai terendah (misal: jika `skor_koordinasi <= 2`, sistem menyarankan latihan fokus pandang dan ritme ayunan tangan).

### 3.5. Pelaporan, Visualisasi & Gamifikasi
* **REQ-5.1:** *The system shall* menampilkan grafik perbandingan *Pre-Test* dan *Post-Test* untuk setiap siswa guna memantau peningkatan kebugaran jasmani.
* **REQ-5.2:** *When* siswa memenuhi kriteria tertentu (misal: `jumlah_jatuh == 0` pada lintasan 15m, atau peningkatan skor `>= 15%`), *the system shall* memberikan lencana digital (*badge*) pada profil siswa.
* **REQ-5.3:** *When* Guru menekan tombol "Ekspor Rapor Kelas", *the system shall* mengunduh rekap nilai seluruh siswa dalam kelas tersebut dalam format `.xlsx` dan `.pdf` yang siap dilampirkan pada administrasi Kurikulum Merdeka.

---

## 4. Data Models (Prisma Schema Reference)

```prisma
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
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(TEACHER)
  createdAt DateTime @default(now())
  assessments Assessment[]
}

model Student {
  id           String   @id @default(cuid())
  nisn         String   @unique
  name         String
  className    String
  gender       Gender
  birthDate    DateTime
  assessments  Assessment[]
  badges       StudentBadge[]
  createdAt    DateTime @default(now())
}

model EgrangSpec {
  id             String   @id @default(cuid())
  name           String   // e.g., "Egrang SD Standar 30cm"
  stepHeightCm   Int      // Tinggi pijakan dari tanah
  poleLengthCm   Int      // Panjang total tongkat
  material       String   // Bambu / Kayu
  assessments    Assessment[]
}

model Assessment {
  id               String     @id @default(cuid())
  studentId        String
  student          Student    @relation(fields: [studentId], references: [id])
  teacherId        String
  teacher          User       @relation(fields: [teacherId], references: [id])
  egrangSpecId     String
  egrangSpec       EgrangSpec @relation(fields: [egrangSpecId], references: [id])
  testType         TestType   @default(PRE_TEST)
  
  // Antropometri saat tes
  heightCm         Float
  weightKg         Float
  bmi              Float
  
  // Data Lapangan
  trackDistanceM   Float      @default(10.0)
  durationSeconds  Float
  fallCount        Int        @default(0)
  stepCount        Int?
  
  // Rubrik Motorik (1 - 4)
  scoreStatic      Int
  scoreDynamic     Int
  scoreCoord       Int
  scorePosture     Int
  
  // Hasil Kalkulasi
  finalScore       Float
  predicate        String
  recommendation   String     @db.Text
  
  assessedAt       DateTime   @default(now())
  syncedAt         DateTime   @default(now())
}

model StudentBadge {
  id          String   @id @default(cuid())
  studentId   String
  student     Student  @relation(fields: [studentId], references: [id])
  badgeCode   String   // e.g., "ZERO_FALL", "IRON_BALANCE", "MOST_IMPROVED"
  badgeTitle  String
  awardedAt   DateTime @default(now())
}