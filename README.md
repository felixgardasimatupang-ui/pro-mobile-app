# DompetKu

DompetKu adalah aplikasi pengelolaan keuangan pribadi berbasis Vite + React + Supabase yang sudah disiapkan untuk dipakai di desktop dan perangkat mobile.

## Jalankan lokal

1. Salin file env:
```bash
cp .env.example .env
```
2. Isi nilai Supabase di `.env`
3. Install dependency dan jalankan:
```bash
npm install
npm run dev
```

## Setup sederhana: hidup dan matikan backend

Pada project ini, backend memakai Supabase. Jadi backend tidak dinyalakan dari terminal project seperti Express atau Laravel.

### Cara "menghidupkan" backend

Backend dianggap hidup jika:

1. Project Supabase Anda aktif
2. Tabel database sudah dibuat
3. File `.env` mengarah ke project Supabase yang benar

Langkah ringkas:

1. Buka dashboard Supabase
2. Pastikan project tidak dalam kondisi pause
3. Jalankan migration SQL bila tabel belum ada
4. Pastikan `.env` berisi:
```env
VITE_SUPABASE_PROJECT_ID="..."
VITE_SUPABASE_PUBLISHABLE_KEY="..."
VITE_SUPABASE_URL="https://...supabase.co"
VITE_APP_URL="https://domain-app-anda.com"
```
5. Jalankan frontend:
```bash
npm run dev
```

### Cara "mematikan" backend

Ada 2 arti:

1. Mematikan aplikasi lokal
   Cukup hentikan server frontend di terminal:
```bash
Ctrl + C
```

2. Mematikan backend cloud Supabase
   Buka dashboard Supabase lalu pause/stop project jika opsi itu tersedia pada paket Anda.

### Cara cek backend sedang aktif atau tidak

Backend biasanya aktif jika:

- aplikasi bisa login
- data wallet/kategori/transaksi bisa dimuat
- request ke Supabase tidak error

Kalau mau cek cepat:

```bash
npm run dev
```

lalu buka aplikasi. Jika muncul error tabel atau koneksi, biasanya masalah ada di project Supabase, env, atau schema database.

## Deploy publik

Project ini sudah siap untuk deploy sebagai SPA ke Vercel atau Netlify.

### Opsi 1: Vercel

1. Push repo ini ke GitHub
2. Import project ke Vercel
3. Tambahkan environment variables berikut di dashboard Vercel:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_APP_URL`
4. Build command:
```bash
npm run build
```
5. Output directory:
```bash
dist
```

File [vercel.json](/Users/felix/Documents/Project%20Sementara/pro-mobile-app/vercel.json) sudah menangani rewrite React Router agar route seperti `/dashboard` tetap terbuka saat refresh.

#### Auto-deploy dengan GitHub Actions

Workflow [deploy-vercel.yml](/Users/felix/Documents/Project%20Sementara/pro-mobile-app/.github/workflows/deploy-vercel.yml) sudah disiapkan.

Tambahkan GitHub Actions secrets berikut di repository Anda:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Cara mendapatkannya:

1. `VERCEL_TOKEN`
   Buat di Vercel Account Settings → Tokens
2. `VERCEL_ORG_ID` dan `VERCEL_PROJECT_ID`
   Jalankan `vercel link` secara lokal atau lihat file `.vercel/project.json` setelah project terhubung

Perilaku workflow:

- Push ke `main` → deploy production
- Push ke branch lain → deploy preview
- Sebelum deploy, workflow akan menjalankan `npm ci`, `npm run lint`, dan `npm run test`

#### Push manual ke GitHub

Kalau Anda ingin memicu auto-deploy secara manual lewat push ke GitHub, gunakan langkah ini dari folder project:

```bash
git status
git add .
git commit -m "pesan perubahan anda"
git push origin main
```

Penjelasan singkat:

- `git status` untuk melihat file yang berubah
- `git add .` untuk menyiapkan perubahan
- `git commit -m "..."` untuk menyimpan riwayat perubahan
- `git push origin main` untuk mengirim ke GitHub dan memicu deploy production

Jika ingin membuat preview deployment dulu, push ke branch selain `main`:

```bash
git checkout -b nama-branch-baru
git add .
git commit -m "pesan perubahan anda"
git push origin nama-branch-baru
```

Setelah push, cek status deploy di tab `Actions` pada GitHub repo.

#### Deploy manual ke Vercel dari lokal

Kalau Anda ingin deploy langsung dari terminal tanpa GitHub Actions:

```bash
npm install
npm run build
vercel login
vercel link
vercel
```

Gunakan:

- `vercel` untuk preview deployment
- `vercel --prod` untuk production deployment

Kalau project sudah pernah di-link, Anda tidak perlu mengulang `vercel link` setiap kali deploy.

### Opsi 2: Netlify

1. Push repo ini ke GitHub
2. Import project ke Netlify
3. Tambahkan environment variables yang sama
4. Build command:
```bash
npm run build
```
5. Publish directory:
```bash
dist
```

File [netlify.toml](/Users/felix/Documents/Project%20Sementara/pro-mobile-app/netlify.toml) sudah menangani SPA redirect untuk semua route.

## Catatan penting

- Setelah mengubah `.env`, restart server atau redeploy hosting.
- Pastikan Supabase project yang dipakai di environment variables sama dengan project tempat tabel dan policy sudah dibuat.
- Untuk akses publik penuh, gunakan domain deploy dari Vercel/Netlify atau sambungkan custom domain Anda.
- File `.env` tidak boleh di-commit ke Git. Project ini sekarang sudah mengabaikan `.env` dan `.env.*` di [.gitignore](/Users/felix/Documents/Project%20Sementara/pro-mobile-app/.gitignore).
- `VITE_SUPABASE_PUBLISHABLE_KEY` memang dipakai di frontend, tetapi jangan hard-code di source code. Simpan tetap di environment variable dan pastikan keamanan data dijaga oleh RLS Supabase.
- Untuk proteksi abuse seperti spam login atau spam request, cek pengaturan rate limiting, bot protection, dan auth protection langsung di dashboard Supabase Anda.
- Untuk redirect verifikasi email agar tidak kembali ke `localhost`, isi `VITE_APP_URL` dengan URL publik aplikasi Anda.
