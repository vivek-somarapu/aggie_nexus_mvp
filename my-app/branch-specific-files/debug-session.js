#!/usr/bin/env node

/**
 * Session Debug Script
 * This script helps debug authentication session issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugSession() {
  console.log('🔍 Debugging authentication session...\n');

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
      console.log(`   Email confirmed: ${session.user.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log(`   Session expires: ${session.expires_at}`);
    } else {
      console.log('❌ No active session found');
      console.log('   You need to sign in first');
    }

    // Check 2: Try to sign in with test user
    console.log('\n🔑 Testing sign in...');
    const testEmail = 'test-1755748584952@aggienexus.com';
    const testPassword = 'testpassword123';
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
    } else {
      console.log('✅ Sign in successful!');
      console.log(`   User ID: ${signInData.user.id}`);
      console.log(`   Email: ${signInData.user.email}`);
      console.log(`   Email confirmed: ${signInData.user.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Check session after sign in
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession) {
        console.log('✅ Session created successfully!');
        console.log(`   Session expires: ${new Date(newSession.expires_at * 1000).toLocaleString()}`);
      } else {
        console.log('❌ Session not created after sign in');
      }
    }

    // Check 3: Test profile access
    console.log('\n👤 Testing profile access...');
    if (signInData?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile access failed:', profileError.message);
      } else {
        console.log('✅ Profile access successful!');
        console.log(`   Name: ${profile.full_name}`);
        console.log(`   Email: ${profile.email}`);
        console.log(`   Funding: $${profile.funding_raised}`);
        console.log(`   Organizations: ${profile.organizations?.join(', ')}`);
      }
    }

    // Check 4: Test profile update
    console.log('\n✏️  Testing profile update...');
    if (signInData?.user) {
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          full_name: 'Updated Test User'
        })
        .eq('id', signInData.user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Profile update failed:', updateError.message);
        console.log('   This might be a Row Level Security (RLS) issue');
      } else {
        console.log('✅ Profile update successful!');
        console.log(`   Updated name: ${updateData.full_name}`);
      }
    }

    // Check 5: Test RLS policies
    console.log('\n🔒 Testing Row Level Security...');
    if (signInData?.user) {
      // Try to access all users (should be restricted by RLS)
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .limit(5);

      if (allUsersError) {
        console.error('❌ RLS test failed:', allUsersError.message);
      } else {
        console.log('✅ RLS test successful!');
        console.log(`   Found ${allUsers?.length || 0} users (should be restricted)`);
        if (allUsers && allUsers.length > 0) {
          console.log('   Users found:');
          allUsers.forEach(user => {
            console.log(`     - ${user.full_name} (${user.email})`);
          });
        }
      }
    }

    // Check 6: Browser session storage
    console.log('\n🌐 Browser Session Info:');
    console.log('   Note: This script runs in Node.js, not browser');
    console.log('   In browser, check:');
    console.log('   1. Local Storage: supabase.auth.token');
    console.log('   2. Session Storage: supabase.auth.token');
    console.log('   3. Cookies: supabase-auth-token');

    console.log('\n📊 Summary:');
    console.log('=====================================');
    console.log(`Initial session: ${session ? '✅ Active' : '❌ None'}`);
    console.log(`Sign in: ${signInError ? '❌ Failed' : '✅ Success'}`);
    console.log(`Profile access: ${profileError ? '❌ Failed' : '✅ Success'}`);
    console.log(`Profile update: ${updateError ? '❌ Failed' : '✅ Success'}`);

    console.log('\n💡 Common Solutions:');
    if (!session && !signInError) {
      console.log('1. Sign in through the web app first');
      console.log('2. Check if email confirmation is disabled');
    }
    if (updateError) {
      console.log('3. Check Row Level Security (RLS) policies');
      console.log('4. Verify user has permission to update their own profile');
    }
    if (profileError) {
      console.log('5. Check if the users table exists and has correct structure');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  debugSession();
}

module.exports = { debugSession }; 