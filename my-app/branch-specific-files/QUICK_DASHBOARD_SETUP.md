# Quick Database Setup via Supabase Dashboard

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project: `yiaqdgsfptonzeiyydut`

### Step 2: Run Initial Setup
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy the **entire contents** of `database_backup_fixed.sql`
4. Paste it into the SQL Editor
5. Click **"Run"** (the play button)

### Step 3: Run Gamification Migration
1. Click **"New query"** again
2. Copy the **entire contents** of `db/migrations/20250127_add_gamification_and_organization_fields.sql`
3. Paste it into the SQL Editor
4. Click **"Run"**

### Step 4: Verify Setup
1. Click **"Table Editor"** in the left sidebar
2. You should see these tables:
   - `users`
   - `projects`
   - `events`
   - `project_bookmarks`
   - `user_bookmarks`
   - `rsvps`

### Step 5: Create Test User
```bash
node create-test-user.js
```

### Step 6: Start Development Server
```bash
npm run dev
```

## What You'll See

✅ **Visual confirmation** of each step  
✅ **Clear error messages** if something goes wrong  
✅ **Table structure** visible in Table Editor  
✅ **No additional keys needed**  

## Expected Results

After running both SQL files, you should see:
- All tables created successfully
- Sample data inserted
- New gamification columns added to `users` and `projects` tables

## If You Get Errors

- **"relation already exists"**: This is normal, just means the table was already created
- **"duplicate key"**: This is normal, just means the data was already inserted
- **Other errors**: Check the error message and let me know

## Next Steps

Once the database is set up:
1. The test user script will work
2. Your app will be able to connect
3. You can test the gamification features 