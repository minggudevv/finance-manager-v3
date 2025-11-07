# 🚀 Setup Guide - Finance Manager

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Supabase

#### A. Create Project in Supabase
1. Visit [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project name and database password
4. Select the nearest region
5. Wait for project to be created

#### B. Run SQL Scripts
1. In Supabase Dashboard, click "SQL Editor"
2. Run the following scripts in sequence:
   - Copy content from `database_stable\v1.0.0.sql` → Run
   - Or run each SQL file from the `sql/` directory sequentially if needed

#### C. Get API Credentials
1. In Supabase Dashboard, click "Settings" (bottom left)
2. Click "API"
3. Copy:
   - `Project URL` (for NEXT_PUBLIC_SUPABASE_URL)
   - `anon public` key (for NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 3. Setup Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** The `.env.local` file is already in `.gitignore`, so it will not be committed.

### 4. Run Development Server

```bash
npm run dev
```

Open browser at [http://localhost:3000](http://localhost:3000)

### 5. Create New Account

1. Click the "Register" button on homepage
2. Fill in:
   - Full Name
   - Email
   - Password (min. 6 characters)
   - Confirm Password
3. Submit form
4. Redirect to login page
5. Login with the newly created email and password

### 6. Start Using

After login, you will be redirected to Dashboard. Available features:
- ✅ Dashboard with charts and summary
- ✅ Transactions (add, edit, delete)
- ✅ Products & Orders
- ✅ Reports (view and export to CSV)
- ✅ Responsive mobile navigation
- ✅ Version management system

## 🔒 Data Security

The application uses **Row Level Security (RLS)** in Supabase:
- Each user can only view their own data
- Policies are configured in SQL scripts
- Session management is handled automatically by Supabase

## 📁 Important Files

- `.env.local` - Environment variables (DO NOT commit)
- `database_stable/` - Versioned database schema
- `app/` - Next.js pages
- `components/` - Reusable components
- `lib/` - Supabase client
- `utils/` - Helper functions
- `features/update-manager/` - Update management system

## 🐛 Troubleshooting

### Error: Missing Supabase environment variables
**Solution:** Make sure the `.env.local` file is created and filled correctly. Restart dev server.

### Error: Authentication failed
**Solution:** Verify that email and password are correct. Also check in Supabase Dashboard → Authentication → Users.

### Error: Policy violation
**Solution:** Ensure SQL scripts have been executed. Check in Supabase → Table Editor that policies exist.

### Database not found
**Solution:** Make sure SQL scripts have been executed. Ensure no errors occurred while running SQL.

## ✨ Tips

1. **Data Location:** All data is stored in the Supabase cloud database
2. **Backup:** Supabase automatically backs up your database
3. **Monitoring:** Use Supabase Dashboard for data monitoring
4. **API:** You can access data via REST API or GraphQL
5. **Versioning:** Database schemas are version controlled in the `database_stable/` directory

## 🚀 Deploy to Production

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Import project from GitHub
4. Add environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

Your project will be live at `https://your-project.vercel.app`

---

**Congratulations! Your Finance Manager application is ready to use.** 💼✨

