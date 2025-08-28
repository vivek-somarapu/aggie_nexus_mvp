#!/usr/bin/env node

/**
 * Create Working Test User Script
 * This script creates a test user that will work regardless of email confirmation settings
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createWorkingTestUser() {
  console.log('🔧 Creating working test user...\n');

  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase environment variables!');
    console.log('Please create a .env.local file with:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('\nNote: You need the SERVICE_ROLE_KEY for this method');
    process.exit(1);
  }

  try {
    // Create Supabase client with service role key (admin privileges)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📡 Connecting to Supabase with admin privileges...');

    // Step 1: Create auth user with service role key
    const testEmail = `working-${Date.now()}@aggienexus.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📝 Creating confirmed auth user: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // This confirms the email immediately
      user_metadata: {
        full_name: 'Working Test User'
      }
    });

    if (signUpError) {
      console.error('❌ Auth user creation failed:', signUpError.message);
      return;
    }

    console.log('✅ Confirmed auth user created successfully!');
    console.log(`   User ID: ${signUpData.user.id}`);
    console.log(`   Email: ${signUpData.user.email}`);
    console.log(`   Email confirmed: ${signUpData.user.email_confirmed_at ? 'Yes' : 'No'}`);

    // Step 2: Create user profile
    console.log('\n📝 Creating user profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: signUpData.user.id,
        full_name: 'Working Test User',
        email: testEmail,
        industry: ['Technology'],
        skills: ['JavaScript', 'React', 'Node.js'],
        funding_raised: 125000,
        organizations: ['Aggies Create', 'AggieX Accelerator'],
        achievements: ['Funding Milestone', 'Incubator Graduate', 'Accelerator Graduate'],
        technical_skills: ['TypeScript', 'Next.js', 'Supabase', 'Tailwind CSS'],
        soft_skills: ['Leadership', 'Communication', 'Project Management', 'Team Building'],
        is_texas_am_affiliate: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      return;
    }

    console.log('✅ Profile created successfully!');
    console.log(`   Profile ID: ${profileData.id}`);
    console.log(`   Name: ${profileData.full_name}`);
    console.log(`   Funding: $${profileData.funding_raised}`);

    // Step 3: Test authentication with anon key
    console.log('\n🔐 Testing authentication...');
    
    // Create a new client with anon key for testing
    const anonSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    const { data: signInData, error: signInError } = await anonSupabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      console.log('   This might be due to email auth being disabled');
    } else {
      console.log('✅ Sign in successful!');
      console.log(`   Session user: ${signInData.user.email}`);
      console.log(`   Email confirmed: ${signInData.user.email_confirmed_at ? 'Yes' : 'No'}`);
      
      // Test profile access
      const { data: testProfile, error: testProfileError } = await anonSupabase
        .from('users')
        .select('*')
        .eq('id', signInData.user.id)
        .single();

      if (testProfileError) {
        console.error('❌ Profile access failed:', testProfileError.message);
      } else {
        console.log('✅ Profile access successful!');
        console.log(`   Name: ${testProfile.full_name}`);
        console.log(`   Funding: $${testProfile.funding_raised}`);
        console.log(`   Skills: ${testProfile.skills?.join(', ')}`);
      }
    }

    // Step 4: Display credentials
    console.log('\n📋 Test User Credentials:');
    console.log('=====================================');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
    console.log(`User ID: ${signUpData.user.id}`);
    console.log(`Email Confirmed: Yes`);

    console.log('\n🎮 Gamification Features:');
    console.log('=====================================');
    console.log(`💰 Funding Raised: $125,000`);
    console.log(`🏢 Organizations: Aggies Create, AggieX Accelerator`);
    console.log(`🏆 Achievements: Funding Milestone, Incubator Graduate, Accelerator Graduate`);
    console.log(`💻 Technical Skills: TypeScript, Next.js, Supabase, Tailwind CSS`);
    console.log(`🤝 Soft Skills: Leadership, Communication, Project Management, Team Building`);

    console.log('\n💡 Next Steps:');
    console.log('1. Make sure email auth is enabled in Supabase Dashboard');
    console.log('2. Go to http://localhost:3000');
    console.log('3. Sign in with the credentials above');
    console.log('4. Check your profile page to see the gamification features');

    console.log('\n🔧 Supabase Dashboard Settings:');
    console.log('=====================================');
    console.log('Go to: Authentication → Settings → Email Auth');
    console.log('Make sure these are enabled:');
    console.log('✅ Enable email signups');
    console.log('✅ Enable email signins');
    console.log('❌ Enable email confirmations (turn this OFF)');

    console.log('\n✅ Benefits of this method:');
    console.log('- Email is pre-confirmed');
    console.log('- No email confirmation needed');
    console.log('- Works even with email confirmation enabled');
    console.log('- Perfect for testing');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  createWorkingTestUser();
}

module.exports = { createWorkingTestUser }; 