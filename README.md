# 💼 Finance Manager

Aplikasi pengelola keuangan berbasis web yang dibangun dengan Next.js dan Supabase. Memungkinkan Anda mencatat pemasukan, pengeluaran, hutang, dan piutang secara real-time dengan visualisasi data yang interaktif.

## ✨ Fitur

- 🔐 **Authentication** - Login dan Register menggunakan Supabase Auth
- 📊 **Dashboard** - Ringkasan keuangan dengan grafik visual
- 💰 **Transaksi** - Kelola pemasukan, pengeluaran, hutang, dan piutang
- 📈 **Grafik** - Visualisasi data dengan Recharts (Pie Chart & Bar Chart)
- 🔍 **Pencarian & Filter** - Cari dan filter transaksi dengan mudah
- 📄 **Laporan** - Export data ke CSV untuk analisis lebih lanjut
- 🔒 **Keamanan** - Row Level Security (RLS) untuk isolasi data per user
- 📱 **Responsif** - Dapat diakses dari desktop dan mobile

## 🚀 Instalasi

### Prasyarat

- Node.js 18+ dan npm
- Akun Supabase ([https://supabase.com](https://supabase.com))

### Langkah 1: Clone Repository

```bash
git clone <repository-url>
cd finance-manager-v3
```

### Langkah 2: Install Dependencies

```bash
npm install
```

### Langkah 3: Setup Supabase

1. Buat project baru di [Supabase Dashboard](https://supabase.com/dashboard)
2. Ambil **API URL** dan **Anon Key** dari Settings > API
3. Jalankan SQL scripts di folder `sql/`:
   - Buka SQL Editor di Supabase Dashboard
   - Jalankan `sql/01_tables.sql` untuk membuat tabel dan policies
   - Jalankan `sql/02_views.sql` untuk membuat view dashboard
   - Jalankan `sql/03_functions.sql` untuk membuat helper functions

### Langkah 4: Setup Environment Variables

1. Copy file `.env.local.example` menjadi `.env.local`
2. Isi dengan kredensial Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Langkah 5: Jalankan Development Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📁 Struktur Project

```
finance-manager-v3/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page
│   ├── transactions/      # Transaksi page
│   ├── report/           # Laporan page
│   ├── login/            # Login page
│   └── register/         # Register page
├── components/            # Reusable components
│   ├── Navbar.tsx
│   ├── Card.tsx
│   └── TransactionModal.tsx
├── lib/                  # Library configurations
│   └── supabaseClient.ts
├── utils/                # Utility functions
│   └── formatters.ts
├── sql/                  # Database schema
│   ├── 01_tables.sql
│   ├── 02_views.sql
│   └── 03_functions.sql
└── middleware.ts         # Route protection
```

## 🗄️ Database Schema

### Tables

#### profiles
Menyimpan informasi profil user

#### transactions
Menyimpan semua transaksi keuangan

**Types:**
- `income` - Pemasukan
- `expense` - Pengeluaran  
- `debt` - Hutang
- `receivable` - Piutang

### Views

#### dashboard_summary
View untuk menampilkan ringkasan total per user:
- total_income
- total_expense
- total_debt
- total_receivable
- net_balance

## 🔒 Keamanan

Aplikasi menggunakan **Row Level Security (RLS)** untuk memastikan:
- User hanya bisa mengakses data miliknya sendiri
- Setiap tabel memiliki policies yang membatasi akses berdasarkan user_id
- Auth session diverifikasi untuk setiap request

## 📦 Teknologi yang Digunakan

- **Next.js 16** - React framework dengan App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend (Auth & Database)
- **React Hook Form** - Form management
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## 🚀 Deployment

### Deploy ke Vercel

1. Push code ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Tambahkan environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## 📝 Lisensi

MIT License

## 👨‍💻 Development

### Menjalankan Scripts

```bash
# Development mode
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint checking
npm run lint
```

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
- Pastikan file `.env.local` sudah dibuat dan diisi dengan benar
- Restart development server setelah mengubah environment variables

### Error: "Row Level Security policy violation"
- Pastikan SQL scripts sudah dijalankan di Supabase
- Cek apakah policies sudah dibuat dengan benar

### Grafik tidak muncul
- Pastikan data transaksi sudah ada di database
- Cek console untuk error pada Recharts

## 📞 Support

Jika mengalami masalah, silakan buka issue di repository ini.

---

Dibuat dengan ❤️ menggunakan Next.js dan Supabase