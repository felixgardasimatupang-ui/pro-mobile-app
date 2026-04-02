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

## Deploy publik

Project ini sudah siap untuk deploy sebagai SPA ke Vercel atau Netlify.

### Opsi 1: Vercel

1. Push repo ini ke GitHub
2. Import project ke Vercel
3. Tambahkan environment variables berikut di dashboard Vercel:
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
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
