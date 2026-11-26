# SI-DIKA — Panduan Deployment Produksi

> Fase 9 — Deployment Readiness  
> Target platform: **Vercel** + **Neon PostgreSQL**

---

## Prasyarat

| Item | Versi |
|---|---|
| Node.js | ≥ 18.17.0 |
| npm | ≥ 9.0 |
| Akun Vercel | [vercel.com](https://vercel.com) |
| Akun Neon | [neon.tech](https://neon.tech) |
| Repository Git | GitHub / GitLab / Bitbucket |

---

## 1. Setup Database Produksi — Neon PostgreSQL

### 1.1 Buat Project Neon

1. Login ke [console.neon.tech](https://console.neon.tech)
2. **New Project** → nama: `si-dika-prod` → region: pilih terdekat (Singapore/Asia)
3. Salin **Connection String** dari dashboard Neon.

Neon memberi dua jenis connection string:
- **Pooled** (pgBouncer) → gunakan sebagai `DATABASE_URL` di runtime (Next.js)
- **Direct** (non-pooled) → gunakan sebagai `DIRECT_URL` khusus untuk Prisma migrate/seed

### 1.2 Jalankan Migrasi Database

Dari mesin lokal, dengan `DIRECT_URL` di-set ke connection string direct Neon:

```bash
npx prisma migrate deploy
```

> Perintah ini menerapkan semua migrasi dari folder `prisma/migrations/` tanpa interaktif.
> Cocok untuk CI/CD pipeline.

### 1.3 Seed Data Awal (opsional)

```bash
npx prisma db seed
```

---

## 2. Environment Variables Produksi

Daftarkan semua variabel berikut di **Vercel Project Settings → Environment Variables**:

| Variabel | Nilai | Keterangan |
|---|---|---|
| `DATABASE_URL` | `postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require&channel_binding=require` | Connection string **pooled** dari Neon (untuk runtime) |
| `DIRECT_URL` | `postgresql://...@ep-xxx.neon.tech/neondb?sslmode=require` | Connection string **direct** dari Neon (untuk Prisma migrate di CI) |
| `AUTH_SECRET` | Random string 32+ karakter | Generate: `openssl rand -base64 32` atau [generate-secret.vercel.app](https://generate-secret.vercel.app/32) |
| `NEXTAUTH_SECRET` | Sama dengan `AUTH_SECRET` | Diperlukan Auth.js v5 dan v4 compat |
| `AUTH_URL` | `https://<domain-vercel>.vercel.app` | URL produksi lengkap dengan https |
| `NEXTAUTH_URL` | `https://<domain-vercel>.vercel.app` | Sama dengan `AUTH_URL` |
| `NODE_ENV` | `production` | Diisi otomatis oleh Vercel |

> **Penting:** Jangan pernah commit nilai `.env` yang berisi kredensial database produksi ke repository.

---

## 3. Deploy ke Vercel

### 3.1 Hubungkan Repository

```bash
# Install Vercel CLI (opsional, bisa juga lewat UI)
npm i -g vercel

# Dari folder si-dika/
vercel
```

Atau via UI:
1. Buka [vercel.com/new](https://vercel.com/new)
2. Import repository Git yang berisi project ini
3. **Root Directory**: set ke `si-dika` jika repo adalah monorepo
4. **Framework Preset**: Next.js (auto-detect)
5. **Build Command**: `npm run build` (default)
6. **Output Directory**: `.next` (default)

### 3.2 Konfigurasi Build

Vercel akan menjalankan `npm run build` secara otomatis setiap kali ada push ke branch yang terhubung.

Tambahkan Build Command berikut di Vercel untuk menjalankan Prisma generate sebelum build:

```
npx prisma generate && next build
```

Atau buat file `vercel.json` di root project:

```json
{
  "buildCommand": "npx prisma generate && next build",
  "installCommand": "npm ci"
}
```

### 3.3 Verifikasi Deployment

Setelah deploy berhasil:
1. Buka `https://<domain>.vercel.app/api/health` → harus mengembalikan `{ status: "ok" }`
2. Buka `https://<domain>.vercel.app/login` → halaman login harus muncul
3. Login dengan akun guru dari seed data
4. Buat assessment dan verifikasi data tersimpan

---

## 4. Konfigurasi vercel.json (Opsional)

Buat file `si-dika/vercel.json` untuk konfigurasi lanjutan:

```json
{
  "buildCommand": "npx prisma generate && next build",
  "installCommand": "npm ci",
  "regions": ["sin1"],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    },
    {
      "source": "/api/export/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

> `regions: ["sin1"]` mendeploy ke region Singapore — latensi terendah untuk Indonesia.

---

## 5. CI/CD Pipeline — GitHub Actions

Buat file `.github/workflows/ci.yml` untuk pipeline otomatis:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-test-build:
    name: Lint → Test → Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: si-dika/package-lock.json

      - name: Install dependencies
        working-directory: si-dika
        run: npm ci

      - name: Generate Prisma client
        working-directory: si-dika
        run: npx prisma generate

      - name: Lint
        working-directory: si-dika
        run: npm run lint

      - name: Run tests
        working-directory: si-dika
        run: npm run test

      - name: Build production
        working-directory: si-dika
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          NEXTAUTH_URL: https://your-domain.vercel.app
        run: npm run build
```

> Simpan `DATABASE_URL` dan `AUTH_SECRET` di **GitHub Repository → Settings → Secrets → Actions**.

---

## 6. Checklist Deployment Akhir

Gunakan checklist ini sebelum go-live:

### Database
- [ ] Neon PostgreSQL project dibuat dan region dipilih
- [ ] `DATABASE_URL` (pooled) dan `DIRECT_URL` (direct) tersedia
- [ ] `npx prisma migrate deploy` berhasil di environment prod
- [ ] Seed data awal sudah dijalankan (atau admin account dibuat manual)

### Vercel
- [ ] Repository terhubung ke Vercel project
- [ ] Semua environment variables sudah diisi di Vercel dashboard
- [ ] Build Command diatur: `npx prisma generate && next build`
- [ ] Root Directory diatur dengan benar (jika monorepo)
- [ ] Deploy berhasil dan domain aktif

### Verifikasi Fungsional
- [ ] `GET /api/health` → `200 { status: "ok" }`
- [ ] Login guru berhasil
- [ ] Daftar siswa tampil
- [ ] Buat assessment baru → data tersimpan
- [ ] Export Excel → file ter-download dengan data benar
- [ ] Export PDF → file ter-download dengan format benar
- [ ] Mode offline: buat assessment offline → sambung → data tersync

### PWA
- [ ] Service worker terdaftar (DevTools → Application → Service Workers)
- [ ] Manifest terbaca (DevTools → Application → Manifest)
- [ ] "Install App" muncul di browser (atau banner install di mobile)
- [ ] Offline fallback bekerja

---

## 7. Environment Variables Lengkap (.env.example Produksi)

```env
# =============================================================================
# SI-DIKA — Environment Variables PRODUKSI
# Isi semua nilai ini di Vercel Dashboard → Project Settings → Environment Variables
# =============================================================================

# ── Database (Neon PostgreSQL) ────────────────────────────────────────────────
# Pooled connection (untuk runtime Next.js — gunakan pgBouncer endpoint)
DATABASE_URL="postgresql://neondb_owner:<password>@ep-xxx-yyy.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Direct connection (untuk prisma migrate deploy — bypass pgBouncer)
DIRECT_URL="postgresql://neondb_owner:<password>@ep-xxx-yyy.us-east-2.aws.neon.tech/neondb?sslmode=require"

# ── Auth.js ───────────────────────────────────────────────────────────────────
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
AUTH_SECRET="<random-32-bytes-base64>"
NEXTAUTH_SECRET="<same-as-AUTH_SECRET>"

# URL produksi (harus https, tanpa trailing slash)
AUTH_URL="https://si-dika.vercel.app"
NEXTAUTH_URL="https://si-dika.vercel.app"
```

---

## Referensi

- [Neon PostgreSQL Docs](https://neon.tech/docs)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Auth.js v5 Deployment](https://authjs.dev/getting-started/deployment)
- [next-pwa Docs](https://github.com/shadowwalker/next-pwa)
