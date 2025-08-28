-- Create Test User for Gamification Features Testing
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Create auth user (if you have access to auth.users table)
-- Note: This might require admin privileges or you may need to create via Supabase Auth API
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(), -- This will be the user ID
  'test@aggienexus.com',
  crypt('TestPassword123!', gen_salt('bf')), -- Encrypted password
  NOW(), -- Email confirmed
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Test User"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Step 2: Get the user ID (you'll need to replace this with the actual ID from step 1)
-- You can find this in the Supabase Dashboard → Authentication → Users
-- Or run: SELECT id FROM auth.users WHERE email = 'test@aggienexus.com';

-- Step 3: Create user profile (replace 'USER_ID_HERE' with the actual user ID)
INSERT INTO public.users (
  id,
  email,
  full_name,
  bio,
  industry,
  skills,
  technical_skills,
  soft_skills,
  organizations,
  funding_raised,
  achievements,
  contact,
  linkedin_url,
  website_url,
  is_texas_am_affiliate,
  graduation_year,
  additional_links,
  created_at,
  updated_at
) VALUES (
  'USER_ID_HERE', -- Replace with actual user ID from step 1
  'test@aggienexus.com',
  'Test User',
  'This is a test user for development and testing of gamification features.',
  ARRAY['Information Technology', 'Education & Training'],
  ARRAY['Programming', 'Design', 'Leadership'],
  ARRAY['Python', 'React', 'Node.js', 'TypeScript'],
  ARRAY['Communication', 'Team Leadership', 'Problem Solving'],
  ARRAY['Aggies Create', 'AggieX'],
  25000.00, -- This will trigger achievement badges
  ARRAY['FIRST_PROJECT', 'TEAM_BUILDER'], -- Pre-populated achievements
  '{"email": "test@aggienexus.com", "phone": "555-123-4567"}',
  'https://linkedin.com/in/testuser',
  'https://testuser.dev',
  true,
  2024,
  '[{"title": "GitHub", "url": "https://github.com/testuser"}, {"title": "Portfolio", "url": "https://testuser.dev"}]',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  bio = EXCLUDED.bio,
  industry = EXCLUDED.industry,
  skills = EXCLUDED.skills,
  technical_skills = EXCLUDED.technical_skills,
  soft_skills = EXCLUDED.soft_skills,
  organizations = EXCLUDED.organizations,
  funding_raised = EXCLUDED.funding_raised,
  achievements = EXCLUDED.achievements,
  contact = EXCLUDED.contact,
  linkedin_url = EXCLUDED.linkedin_url,
  website_url = EXCLUDED.website_url,
  is_texas_am_affiliate = EXCLUDED.is_texas_am_affiliate,
  graduation_year = EXCLUDED.graduation_year,
  additional_links = EXCLUDED.additional_links,
  updated_at = NOW();

-- Step 4: Verify the user was created
SELECT 
  id,
  email,
  full_name,
  funding_raised,
  organizations,
  achievements,
  technical_skills,
  soft_skills,
  created_at
FROM public.users 
WHERE email = 'test@aggienexus.com';

-- Test user credentials:
-- Email: test@aggienexus.com
-- Password: TestPassword123! 