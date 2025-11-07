# 💼 Finance Manager

A web-based financial management application built with Next.js and Supabase. It allows you to record income, expenses, debts, and receivables in real-time with interactive data visualization.

## ✨ Features

- 🔐 **Authentication** - Login and Register using Supabase Auth
- 📊 **Dashboard** - Financial summary with visual charts
- 💰 **Transactions** - Manage income, expenses, debts, and receivables
- 📈 **Charts** - Data visualization with Recharts (Pie Chart & Bar Chart)
- 🔍 **Search & Filter** - Easily search and filter transactions
- 📄 **Reporting** - Export data to CSV for further analysis
- 🔒 **Security** - Row Level Security (RLS) for per-user data isolation
- 📱 **Responsive** - Accessible from desktop and mobile devices
- 🔄 **Auto Update** - Automatic application update system
- 📦 **Version Control** - Database schema version management

## 🚀 Installation

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([https://supabase.com](https://supabase.com))

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd finance-manager-v3
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup Supabase

1. Create a new project at [Supabase Dashboard](https://supabase.com/dashboard)
2. Get your **API URL** and **Anon Key** from Settings > API
3. Run SQL scripts in the `database_stable/` folder:
   - Open SQL Editor in Supabase Dashboard
   - Run `database_stable\v1.0.0.sql` to create tables, views, and functions
   - Or run each SQL file sequentially if needed

### Step 4: Setup Environment Variables

1. Copy `.env.local.example` file to `.env.local`
2. Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Version Information

**Current Application Version:** 1.0.0  
**Current Database Version:** 1.0.0

### Version Management
- Application version is defined in `package.json`
- Database schema versions are stored in `database_stable/` directory
- Database changes are managed through versioned SQL files

## 📁 Project Structure

```
finance-manager-v3/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page
│   ├── transactions/      # Transactions page
│   ├── report/           # Report page
│   ├── login/            # Login page
│   └── register/         # Register page
├── components/            # Reusable components
│   ├── Navbar.tsx
│   ├── Card.tsx
│   ├── TransactionModal.tsx
│   └── MobileNav.tsx
├── lib/                  # Library configurations
│   └── supabaseClient.ts
├── utils/                # Utility functions
│   └── formatters.ts
├── database_stable/      # Versioned database schema
│   ├── v1.0.0.sql       # Initial stable schema
│   ├── version_control.md
│   └── migration_template.sql
├── features/             # Feature flags and update management
│   └── update-manager/
└── middleware.ts         # Route protection
```

## 🗄️ Database Schema

### Version Management
- Stable database schema is located in `database_stable/` directory
- Each version follows semantic versioning (vX.Y.Z format)
- Migration scripts are provided for schema updates

### Tables

#### profiles
Stores user profile information

#### transactions
Stores all financial transactions

**Types:**
- `income` - Income
- `expense` - Expense  
- `debt` - Debt
- `receivable` - Receivable

### Views

#### dashboard_summary
View to display summary totals per user:
- total_income
- total_expense
- total_debt
- total_receivable
- net_balance

## 🔒 Security

The application uses **Row Level Security (RLS)** to ensure:
- Users can only access their own data
- Each table has policies limiting access based on user_id
- Auth session is verified for every request

## 🔄 Update System

The application includes an automatic update system that allows administrators to update the application through the dashboard. The system includes:

- Version tracking
- Update notifications
- Automated update process
- Rollback capabilities

## 📦 Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Backend (Auth & Database)
- **React Hook Form** - Form management
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## 🚀 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project at [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## 📝 License

MIT License

## 👨‍💻 Development

### Running Scripts

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
- Ensure `.env.local` file is created and properly filled
- Restart development server after changing environment variables

### Error: "Row Level Security policy violation"
- Make sure SQL scripts have been executed in Supabase
- Check if policies are created correctly

### Charts not showing
- Ensure transaction data exists in the database
- Check console for errors from Recharts

## 📞 Support

If you encounter problems, please open an issue in this repository.

---

Built with ❤️ using Next.js and Supabase