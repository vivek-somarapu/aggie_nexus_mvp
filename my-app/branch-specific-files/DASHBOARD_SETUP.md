# Database Setup via Supabase Dashboard

## Option 2: Using Supabase Dashboard SQL Editor

If you don't want to use the service role key, you can set up the database directly in the Supabase Dashboard.

### Step 1: Initial Database Setup

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `yiaqdgsfptonzeiyydut`
3. **Navigate to**: SQL Editor (in the left sidebar)
4. **Create a new query** and paste the contents of `database_backup_fixed.sql`
5. **Run the query** (click the "Run" button)

### Step 2: Run Gamification Migration

1. **Create another new query** in the SQL Editor
2. **Paste the contents** of `db/migrations/20250127_add_gamification_and_organization_fields.sql`
3. **Run the query**

### Step 3: Verify Setup

1. **Go to**: Table Editor (in the left sidebar)
2. **Check that these tables exist**:
   - `users`
   - `projects`
   - `events`
   - `project_bookmarks`
   - `rsvps`

### Step 4: Create Test User

After the database is set up, you can run:
```bash
node create-test-user.js
```

### Step 5: Start Development Server

```bash
npm run dev
```

## What This Method Does

- **No service role key needed**: Uses the dashboard's built-in admin privileges
- **Visual feedback**: You can see exactly what's happening
- **Error handling**: Dashboard shows clear error messages
- **Rollback capability**: You can undo changes if needed

## Advantages of Dashboard Method

✅ **No additional keys needed**  
✅ **Visual confirmation**  
✅ **Better error messages**  
✅ **Can see table structure**  
✅ **Easy to debug**  

## Disadvantages

❌ **Manual process**  
❌ **Can't automate**  
❌ **Need to copy-paste SQL**  

## Recommended Approach

For a one-time setup, the **Dashboard method is perfectly fine** and actually easier for beginners. You only need to do this once per project. 