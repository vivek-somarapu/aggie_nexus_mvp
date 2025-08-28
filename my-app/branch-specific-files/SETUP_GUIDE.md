# Development Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Supabase Account** and project
4. **Git** (for version control)

## Step 1: Install Dependencies

```bash
cd my-app
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Wait for the project to be set up

### 2.2 Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **anon public** key
   - **service_role** key (keep this secret!)

### 2.3 Create Environment File
Create a `.env.local` file in the `my-app` directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 3: Set Up Database

### 3.1 Run Database Migration
You have two options:

**Option A: Using Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `db/migrations/20250127_add_gamification_and_organization_fields.sql`
4. Click "Run" to execute the migration

**Option B: Using psql (if you have direct database access)**
```bash
psql -d postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres -f db/migrations/20250127_add_gamification_and_organization_fields.sql
```

### 3.2 Verify Migration
Check that the new columns were added:
1. Go to **Table Editor** in Supabase Dashboard
2. Check the `users` table - you should see new columns:
   - `funding_raised`
   - `organizations`
   - `achievements`
   - `technical_skills`
   - `soft_skills`
3. Check the `projects` table - you should see new columns:
   - `funding_received`
   - `incubator_accelerator`
   - `organizations`
   - `technical_requirements`
   - `soft_requirements`

## Step 4: Start Development Server

```bash
npm run dev
```

The server should start at `http://localhost:3000`

## Step 5: Test the Application

### 5.1 Basic Functionality
1. Open `http://localhost:3000` in your browser
2. You should see the Aggie Nexus homepage
3. Try signing up for a new account
4. Verify authentication works

### 5.2 Test Gamification Features
1. Go to your profile page
2. Try adding:
   - **Funding Amount**: Enter a value like $15000 to see achievement badges
   - **Organizations**: Select "Aggies Create" or "AggieX"
   - **Technical Skills**: Use the categorized skill selector
   - **Soft Skills**: Add communication or leadership skills
3. Save your profile and verify the data persists

### 5.3 Run Test Script
```bash
node test-gamification.js
```

## Troubleshooting

### Common Issues

**1. "next: command not found"**
```bash
npm install
```

**2. "Supabase client creation failed"**
- Check your `.env.local` file exists
- Verify your Supabase credentials are correct
- Make sure your Supabase project is active

**3. "Database migration failed"**
- Check your database connection
- Verify you have the correct permissions
- Try running the migration through the Supabase dashboard

**4. "TypeScript errors"**
```bash
npm run build
```
This will show any type errors that need to be fixed.

### Environment Variables Checklist

Make sure your `.env.local` file contains:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Database Migration Checklist

Verify these columns exist in your database:
- [ ] `users.funding_raised`
- [ ] `users.organizations`
- [ ] `users.achievements`
- [ ] `users.technical_skills`
- [ ] `users.soft_skills`
- [ ] `projects.funding_received`
- [ ] `projects.incubator_accelerator`
- [ ] `projects.organizations`
- [ ] `projects.technical_requirements`
- [ ] `projects.soft_requirements`

## Next Steps

Once everything is working:

1. **Test all gamification features**
2. **Create some test data**
3. **Verify the UI components work correctly**
4. **Check that existing functionality still works**
5. **Deploy to production when ready**

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the terminal output for server errors
3. Verify your Supabase project is active
4. Ensure all environment variables are set correctly 