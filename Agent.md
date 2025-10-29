# 💼 Finance Manager App — Rundown Pengembangan (Supabase + Next.js)

## 🏗️ 1. Persiapan Proyek
- Buat project baru menggunakan **Next.js (App Router)** dengan **Tailwind CSS**.
- Gunakan **Supabase** sebagai backend untuk **Auth** dan **Database**.
- Pilih bahasa: **JavaScript** atau **TypeScript**.
- Instal library pendukung seperti:
  - `@supabase/supabase-js`
  - `react-hook-form`
  - `lucide-react` atau `heroicons`
  - `recharts` untuk grafik dashboard

### Struktur Direktori
- `app/` → berisi halaman (login, register, dashboard)
- `components/` → komponen UI seperti Navbar, Sidebar, Card
- `lib/` → konfigurasi Supabase
- `utils/` → helper seperti format uang
- `styles/` → file CSS global

---

## 🧠 2. Setup Supabase
- Buat project di [https://supabase.com](https://supabase.com)
- Ambil **API URL** dan **Anon Key**
- Buat koneksi Supabase di `lib/supabaseClient.js`
- Pastikan environment variable disiapkan di `.env.local`

---

## 🔐 3. Authentication (Register dan Login)
- Halaman **Register**: input `email`, `password`, `confirm password`, `name`
- Halaman **Login**: input `email`, `password`
- Gunakan Supabase Auth untuk membuat akun dan login
- Tambahkan **middleware** untuk melindungi route dashboard
- Jika user belum login → redirect ke halaman login

---

## 🧾 4. Struktur Database (Supabase SQL)
### Tabel:
1. **profiles** → menyimpan nama user
2. **transactions** → menyimpan semua transaksi (pemasukan, pengeluaran, hutang, piutang)
3. **dashboard_summary (view)** → menampilkan total ringkasan tiap user

### Jenis Transaksi:
- `income` → pemasukan  
- `expense` → pengeluaran  
- `debt` → hutang  
- `receivable` → piutang  

---

## 💰 5. Fitur Utama

### 🏠 Dashboard
- Menampilkan total pemasukan, pengeluaran, hutang, dan piutang.
- Gunakan grafik (misal pie chart atau bar chart) untuk visualisasi.
- Data diambil dari view `dashboard_summary`.

### 💵 Pemasukan & Pengeluaran
- Mengelola transaksi keuangan harian.
- Bisa tambah, edit, hapus, dan filter berdasarkan tanggal.
- Disimpan di tabel `transactions` dengan `type='income'` atau `type='expense'`.

### 🤝 Hutang & Piutang
- Mengelola data hutang dan piutang.
- Gunakan `type='debt'` dan `type='receivable'`.
- Tambahkan deskripsi untuk nama pihak yang terlibat.

### 🧮 Form Transaksi
- Input: jenis transaksi, jumlah, kategori, deskripsi, dan tanggal.
- Setelah disimpan, data muncul langsung di dashboard.

---

## 📊 6. Dashboard (Visualisasi)
- Gunakan **Recharts** untuk menampilkan perbandingan pendapatan dan pengeluaran.
- Tambahkan grafik tren bulanan.
- Tampilkan ringkasan total saldo saat ini.

---

## 🧾 7. Data Nyata (Non-Dummy)
- Semua transaksi tersimpan langsung ke database Supabase.
- Tidak menggunakan data dummy.
- Setiap user memiliki data transaksi masing-masing.

---

## 🔒 8. Keamanan
- Aktifkan **Row Level Security (RLS)** di tabel `transactions`.
- Buat policy agar user hanya bisa mengakses data miliknya sendiri.
- Pastikan auth user ID sama dengan user_id di tabel transaksi.

---

## ✅ 9. Fitur Tambahan (Opsional)
- Export data ke **CSV atau PDF**
- Filter transaksi berdasarkan rentang tanggal
- Mode **Dark/Light**
- Notifikasi dengan `react-hot-toast`
- Fitur **search** transaksi berdasarkan deskripsi atau kategori

---

## 🚀 10. Deployment
- Deploy frontend ke **Vercel**
- Supabase otomatis online (backend)
- Pastikan environment variable diatur:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Tes login, register, dan semua fitur transaksi di production.

---

## 📘 Ringkasan Akhir
Aplikasi **Finance Manager** ini memiliki:
- Register & Login (Supabase Auth)
- Dashboard dengan ringkasan keuangan
- Fitur pemasukan, pengeluaran, hutang, dan piutang
- Database nyata (PostgreSQL di Supabase)
- Keamanan berbasis RLS
- UI modern dan responsif
