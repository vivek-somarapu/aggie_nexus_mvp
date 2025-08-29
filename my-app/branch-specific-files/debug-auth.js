#!/usr/bin/env node

/**
 * Authentication Debug Script
 * This script helps diagnose auth and user creation issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugAuth() {
  console.log('🔍 Debugging authentication issues...\n');

  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Error: Missing Supabase environment variables!');
    console.log('Please create a .env.local file with:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
    process.exit(1);
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('📡 Connecting to Supabase...');
    console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

    // Check 1: Current session
    console.log('🔐 Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError.message);
    } else if (session) {
      console.log('✅ User is authenticated:');
      console.log(`   User ID: ${session.user.id}`);
      console.log(`   Email: ${session.user.email}`);
      console.log(`   Created: ${session.user.created_at}`);
    } else {
      console.log('❌ No active session found');
    }

    // Check 2: Look for test user in auth.users
    console.log('\n👥 Checking auth.users table...');
    const testEmail = 'test@aggienexus.com';
    
    // Note: We can't directly query auth.users with anon key, but we can try to sign in
    console.log(`🔍 Looking for user: ${testEmail}`);
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'testpassword123'
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('   This means the user exists but password is wrong');
      } else if (signInError.message.includes('Email not confirmed')) {
        console.log('   This means the user exists but email is not confirmed');
      } else if (signInError.message.includes('User not found')) {
        console.log('   This means the user does not exist in auth.users');
      }
    } else {
      console.log('✅ Sign in successful!');
      console.log(`   User ID: ${signInData.user.id}`);
      console.log(`   Email: ${signInData.user.email}`);
    }

    // Check 3: Look for user in public.users
    console.log('\n👤 Checking public.users table...');
    const { data: publicUsers, error: publicUsersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail);

    if (publicUsersError) {
      console.error('❌ Error querying public.users:', publicUsersError.message);
    } else {
      console.log(`✅ Found ${publicUsers?.length || 0} users in public.users with email ${testEmail}`);
      if (publicUsers && publicUsers.length > 0) {
        publicUsers.forEach((user, index) => {
          console.log(`   User ${index + 1}:`);
          console.log(`     ID: ${user.id}`);
          console.log(`     Name: ${user.full_name}`);
          console.log(`     Email: ${user.email}`);
          console.log(`     Created: ${user.created_at}`);
        });
      }
    }

    // Check 4: Try to create a new test user
    console.log('\n🔧 Testing user creation...');
    
    const newTestEmail = `test-${Date.now()}@aggienexus.com`;
    console.log(`Creating new test user: ${newTestEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: newTestEmail,
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Debug Test User',
          email_confirm: true
        }
      }
    });

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message);
    } else {
      console.log('✅ Sign up successful!');
      console.log(`   User ID: ${signUpData.user.id}`);
      console.log(`   Email: ${signUpData.user.email}`);
      console.log(`   Email confirmed: ${signUpData.user.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Try to create profile
      console.log('\n📝 Creating user profile...');
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: signUpData.user.id,
          full_name: 'Debug Test User',
          email: newTestEmail,
          industry: ['Technology'],
          skills: ['JavaScript', 'React'],
          funding_raised: 50000,
          organizations: ['Aggies Create'],
          achievements: ['Funding Milestone'],
          technical_skills: ['Node.js', 'TypeScript'],
          soft_skills: ['Leadership', 'Communication']
        })
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError.message);
      } else {
        console.log('✅ Profile created successfully!');
        console.log(`   Profile ID: ${profileData.id}`);
        console.log(`   Funding: $${profileData.funding_raised}`);
        console.log(`   Organizations: ${profileData.organizations?.join(', ')}`);
      }
    }

    // Check 5: Test authentication flow
    console.log('\n🔄 Testing authentication flow...');
    
    if (signUpData?.user) {
      console.log('Testing sign in with new user...');
      
      const { data: testSignIn, error: testSignInError } = await supabase.auth.signInWithPassword({
        email: newTestEmail,
        password: 'testpassword123'
      });

      if (testSignInError) {
        console.error('❌ Test sign in failed:', testSignInError.message);
      } else {
        console.log('✅ Test sign in successful!');
        console.log(`   Session user: ${testSignIn.user.email}`);
        
        // Test profile access
        const { data: testProfile, error: testProfileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', testSignIn.user.id)
          .single();

        if (testProfileError) {
          console.error('❌ Profile access failed:', testProfileError.message);
        } else {
          console.log('✅ Profile access successful!');
          console.log(`   Name: ${testProfile.full_name}`);
          console.log(`   Funding: $${testProfile.funding_raised}`);
        }
      }
    }

    console.log('\n📊 Summary:');
    console.log('=====================================');
    console.log(`Current session: ${session ? '✅ Active' : '❌ None'}`);
    console.log(`Test user exists (auth): ${signInError ? '❌ No' : '✅ Yes'}`);
    console.log(`Test user exists (public): ${publicUsers?.length > 0 ? '✅ Yes' : '❌ No'}`);
    console.log(`New user creation: ${signUpError ? '❌ Failed' : '✅ Success'}`);
    console.log(`Profile creation: ${profileError ? '❌ Failed' : '✅ Success'}`);

    console.log('\n💡 Recommendations:');
    if (!session) {
      console.log('1. You need to sign in to access protected features');
    }
    if (signInError && signInError.message.includes('User not found')) {
      console.log('2. The test user does not exist in auth.users - run create-test-user.js');
    }
    if (publicUsersError) {
      console.log('3. The public.users table might not exist - check database setup');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  debugAuth();
}

module.exports = { debugAuth }; 