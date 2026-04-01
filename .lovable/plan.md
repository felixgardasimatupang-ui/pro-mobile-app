

# Aplikasi Manajemen Keuangan Pribadi 💰

Aplikasi mobile native (Capacitor) untuk mencatat pemasukan & pengeluaran dengan tampilan profesional dan keamanan tinggi.

## Halaman & Fitur

### 1. Authentication
- Login/Register dengan Email, Google, dan Phone (SMS)
- Forgot password & reset password flow
- Session management yang aman

### 2. Dashboard Utama
- Ringkasan saldo total semua wallet
- Grafik pemasukan vs pengeluaran (chart bulanan/mingguan)
- Transaksi terbaru
- Indikator budget (progress bar per kategori)

### 3. Pencatatan Transaksi
- Form input: jumlah, kategori, wallet, tanggal, catatan
- Toggle pemasukan/pengeluaran
- Kategori preset (Makanan, Transport, Belanja, Tagihan, Hiburan, Gaji, Investasi, dll)
- User bisa tambah kategori custom dengan icon & warna

### 4. Multi Wallet
- Daftar wallet (Cash, Bank, E-Wallet, dll)
- Tambah/edit/hapus wallet
- Saldo per wallet otomatis terhitung
- Transfer antar wallet

### 5. Budget / Anggaran
- Set batas pengeluaran per kategori per bulan
- Progress bar visual (hijau → kuning → merah)
- Notifikasi saat mendekati/melebihi batas

### 6. Laporan & Export
- Laporan pemasukan vs pengeluaran per periode
- Filter berdasarkan wallet, kategori, tanggal
- Grafik pie chart & bar chart
- Export ke PDF dan CSV

### 7. Profil & Pengaturan
- Edit profil user
- Pengaturan mata uang
- Dark mode toggle

## Desain UI
- Clean & modern dengan card-based layout
- Warna utama: biru tua (profesional & trustworthy)
- Aksen hijau untuk pemasukan, merah untuk pengeluaran
- Bottom navigation bar (Dashboard, Transaksi, Budget, Laporan, Profil)
- Responsive mobile-first design

## Backend (Lovable Cloud / Supabase)
- Tabel: profiles, wallets, categories, transactions, budgets, user_roles
- Row Level Security (RLS) pada semua tabel
- Edge functions untuk export laporan

## Setup Mobile (Capacitor)
- Konfigurasi Capacitor untuk build ke iOS & Android
- Instruksi deploy ke device/emulator

