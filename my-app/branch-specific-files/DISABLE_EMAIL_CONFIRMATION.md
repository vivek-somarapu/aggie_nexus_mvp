# Disable Email Confirmation in Supabase

## Quick Setup for Development

### Step 1: Go to Supabase Dashboard
1. Open: https://supabase.com/dashboard
2. Select your project: `yiaqdgsfptonzeiyydut`

### Step 2: Navigate to Authentication Settings
1. Click **"Authentication"** in the left sidebar
2. Click **"Settings"** tab
3. Scroll down to **"Email Auth"** section

### Step 3: Disable Email Confirmation
1. Find **"Confirm email"** option
2. **Turn it OFF** (toggle switch)
3. Click **"Save"**

### Step 4: Test User Creation
Now you can run:
```bash
node create-simple-test-user.js
```

The user will be able to sign in immediately without email confirmation.

## What This Does

✅ **No email confirmation required**  
✅ **Immediate sign-in possible**  
✅ **Perfect for development/testing**  
✅ **Can be re-enabled for production**  

## Security Note

- This is **only for development**
- **Re-enable** email confirmation before deploying to production
- Email confirmation is important for security in real applications

## Alternative: Keep Email Confirmation But Auto-Confirm

If you want to keep email confirmation enabled but auto-confirm users:

1. Go to **Authentication → Settings → Email Templates**
2. Customize the confirmation email
3. Or use the service role key to manually confirm users

## Recommended Approach

For your development workflow:
1. **Disable email confirmation** during development
2. **Use the simple test user script**
3. **Re-enable** before production deployment 