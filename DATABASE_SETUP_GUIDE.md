# 🚀 DompetKu - Panduan Aktivasi Database (Backend)

Akun Anda belum bisa digunakan karena tabel-tabel di database Supabase Anda belum dibuat. Ikuti langkah-langkah di bawah ini untuk mengaktifkan semuanya dalam 2 menit.

---

### Step 1: Salin Script SQL
Salin **seluruh isi** file ini di laptop Anda:
**[20260401_initial_schema.sql](file:///Users/felix/Documents/pro-mobile-app/supabase/migrations/20260401_initial_schema.sql)**

---

### Step 2: Buka Supabase SQL Editor
Klik link ini untuk langsung menuju menu SQL Editor di proyek Anda:
👉 **[Supabase New Query Editor](https://supabase.com/dashboard/project/areegmhyxwqlkyqgwkrd/sql/new)**

---

### Step 3: Jalankan (Run)
1. **Tempel (Paste)** teks yang sudah Anda salin tadi ke dalam editor SQL.
2. Klik tombol **"Run"** yang ada di pojok kanan bawah.
3. Tunggu hingga muncul pesan **"Success. No rows returned"**.

---

### Step 4: Matikan "Confirm Email" (Wajib!)
Agar bisa login tanpa ribet buka inbox email:
1. Buka menu: **Authentication** > **Providers** > **Email**.
2. **Matikan (Disabled)** saklar **"Confirm email"**.
3. Klik **Save**.

---

### Step 5: Selesai! 🎉
Kembali ke aplikasi Anda di `http://localhost:8080/auth`:
1. Masuk dengan **Email**: `admin@keuangan.com`
2. Masukkan **Password**: `Admin123!`
3. Sekarang fitur Dashboard, Transaksi, Laporan, dan Budget akan berfungsi penuh!

---

> [!CAUTION]
> Jangan mencoba menyalin akun di aplikasi sebelum menjalankan SQL di atas, karena aplikasi akan error jika tabel database-nya belum ada.
