# Quick Setup Checklist

## ✅ Essential Steps (Do These First)

### 1. Install Dependencies
```bash
cd my-app
npm install
```

### 2. Create Environment File
Create `.env.local` in the `my-app` directory:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Run Database Migration
**Option A: Supabase Dashboard (Easiest)**
1. Go to your Supabase project → SQL Editor
2. Copy/paste the contents of `db/migrations/20250127_add_gamification_and_organization_fields.sql`
3. Click "Run"

**Option B: Command Line**
```bash
psql -d your_database_url -f db/migrations/20250127_add_gamification_and_organization_fields.sql
```

### 4. Start Development Server
```bash
npm run dev
```

## 🧪 Test the New Features

### Quick Test
1. Open `http://localhost:3000`
2. Sign up/login
3. Go to profile page
4. Try adding:
   - Funding amount: $15000
   - Organization: "Aggies Create"
   - Technical skills: "Python", "React"
   - Soft skills: "Leadership", "Communication"

### Run Test Script
```bash
node test-gamification.js
```

## 🔍 Verify Everything Works

- [ ] Server starts without errors
- [ ] Can access homepage
- [ ] Can sign up/login
- [ ] Profile page loads
- [ ] Can add funding amounts
- [ ] Achievement badges appear
- [ ] Organization badges display
- [ ] Skill selectors work
- [ ] Data saves correctly

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "next: command not found" | Run `npm install` |
| "Supabase client failed" | Check `.env.local` exists and has correct values |
| "Database migration failed" | Use Supabase Dashboard SQL Editor |
| "TypeScript errors" | Run `npm run build` to see specific errors |

## 📞 Need Help?

1. Check the full `SETUP_GUIDE.md` for detailed instructions
2. Verify your Supabase project is active
3. Ensure all environment variables are set
4. Check browser console and terminal for error messages 