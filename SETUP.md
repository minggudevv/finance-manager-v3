# 🚀 Setup Guide - Finance Manager

## Langkah-langkah Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase

#### A. Buat Project di Supabase
1. Buka [https://supabase.com](https://supabase.com) dan daftar/login
2. Klik "New Project"
3. Isi nama project dan database password
4. Pilih region terdekat
5. Tunggu project selesai dibuat

#### B. Jalankan SQL Scripts
1. Di Supabase Dashboard, klik "SQL Editor"
2. Jalankan scripts berikut secara berurutan:
   - Copy isi dari `sql/01_tables.sql` → Run
   - Copy isi dari `sql/02_views.sql` → Run
   - Copy isi dari `sql/03_functions.sql` → Run

#### C. Ambil API Credentials
1. Di Supabase Dashboard, klik "Settings" (kiri bawah)
2. Klik "API"
3. Copy:
   - `Project URL` (untuk NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (untuk NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 3. Setup Environment Variables

Buat file `.env.local` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Catatan:** File `.env.local` sudah ada di `.gitignore`, jadi tidak akan ter-commit.

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka browser di [http://localhost:3000](http://localhost:3000)

### 5. Daftar Akun Baru

1. Klik tombol "Daftar" di homepage
2. Isi:
   - Nama Lengkap
   - Email
   - Password (min. 6 karakter)
   - Konfirmasi Password
3. Submit form
4. Redirect ke halaman login
5. Login dengan email dan password yang baru dibuat

### 6. Mulai Menggunakan

Setelah login, Anda akan diarahkan ke Dashboard. Fitur yang tersedia:
- ✅ Dashboard dengan grafik dan ringkasan
- ✅ Transaksi (tambah, edit, hapus)
- ✅ Laporan (lihat dan export CSV)

## 🔒 Keamanan Data

Aplikasi menggunakan **Row Level Security (RLS)** di Supabase:
- Setiap user hanya bisa melihat data miliknya sendiri
- Policies sudah dikonfigurasi di SQL scripts
- Session management otomatis oleh Supabase

## 📁 File Penting

- `.env.local` - Environment variables (JANGAN commit)
- `sql/` - Database schema
- `app/` - Next.js pages
- `components/` - Reusable components
- `lib/` - Supabase client
- `utils/` - Helper functions

## 🐛 Troubleshooting

### Error: Missing Supabase environment variables
**Solusi:** Pastikan file `.env.local` sudah dibuat dan diisi dengan benar. Restart dev server.

### Error: Authentication failed
**Solusi:** Pastikan email dan password sudah benar. Cek juga di Supabase Dashboard → Authentication → Users.

### Error: Policy violation
**Solusi:** Pastikan SQL scripts sudah dijalankan. Cek di Supabase → Table Editor bahwa policies ada.

### Database tidak ditemukan
**Solusi:** Pastikan SQL scripts sudah dijalankan. Pastikan tidak ada error saat running SQL.

## ✨ Tips

1. **Lokasi Data:** Semua data disimpan di Supabase cloud database
2. **Backup:** Supabase otomatis backup database Anda
3. **Monitoring:** Gunakan Supabase Dashboard untuk monitoring data
4. **API:** Anda bisa access data via REST API atau GraphQL

## 🚀 Deploy ke Production

### Deploy ke Vercel (Recommended)

1. Push code ke GitHub
2. Buka [vercel.com](https://vercel.com)
3. Import project dari GitHub
4. Tambahkan environment variables di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

Project Anda akan live di `https://your-project.vercel.app`

---

**Selamat! Aplikasi Finance Manager Anda siap digunakan.** 💼✨

