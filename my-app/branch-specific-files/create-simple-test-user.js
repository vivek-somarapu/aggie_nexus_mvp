#!/usr/bin/env node

/**
 * Simple Test User Creation Script
 * This script creates a test user with proper authentication handling
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createSimpleTestUser() {
  console.log('🔧 Creating simple test user...\n');

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

    // Step 1: Create auth user
    const testEmail = `test-${Date.now()}@aggienexus.com`;
    const testPassword = 'testpassword123';
    
    console.log(`📝 Creating auth user: ${testEmail}`);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          email_confirm: true
        }
      }
    });

    if (signUpError) {
      console.error('❌ Auth user creation failed:', signUpError.message);
      return;
    }

    console.log('✅ Auth user created successfully!');
    console.log(`   User ID: ${signUpData.user.id}`);
    console.log(`   Email: ${signUpData.user.email}`);

    // Step 2: Create user profile
    console.log('\n📝 Creating user profile...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: signUpData.user.id,
        full_name: 'Test User',
        email: testEmail,
        industry: ['Technology'],
        skills: ['JavaScript', 'React', 'Node.js'],
        funding_raised: 75000,
        organizations: ['Aggies Create', 'AggieX Accelerator'],
        achievements: ['Funding Milestone', 'Incubator Graduate'],
        technical_skills: ['TypeScript', 'Next.js', 'Supabase'],
        soft_skills: ['Leadership', 'Communication', 'Project Management']
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message);
      console.log('   This might be because the user already exists or table issues');
      return;
    }

    console.log('✅ Profile created successfully!');
    console.log(`   Profile ID: ${profileData.id}`);
    console.log(`   Name: ${profileData.full_name}`);
    console.log(`   Funding: $${profileData.funding_raised}`);
    console.log(`   Organizations: ${profileData.organizations?.join(', ')}`);

    // Step 3: Test authentication
    console.log('\n🔐 Testing authentication...');
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
    } else {
      console.log('✅ Sign in successful!');
      console.log(`   Session user: ${signInData.user.email}`);
      
      // Test profile access
      const { data: testProfile, error: testProfileError } = await supabase
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
    console.log(`Profile ID: ${profileData.id}`);

    console.log('\n🎮 Gamification Features:');
    console.log('=====================================');
    console.log(`💰 Funding Raised: $${profileData.funding_raised}`);
    console.log(`🏢 Organizations: ${profileData.organizations?.join(', ')}`);
    console.log(`🏆 Achievements: ${profileData.achievements?.join(', ')}`);
    console.log(`💻 Technical Skills: ${profileData.technical_skills?.join(', ')}`);
    console.log(`🤝 Soft Skills: ${profileData.soft_skills?.join(', ')}`);

    console.log('\n💡 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Go to http://localhost:3000');
    console.log('3. Sign in with the credentials above');
    console.log('4. Check your profile page to see the gamification features');

    console.log('\n⚠️  Note:');
    console.log('- This user will need email confirmation in production');
    console.log('- For testing, you can disable email confirmation in Supabase Dashboard');
    console.log('- Go to Authentication → Settings → Email Auth → Disable "Confirm email"');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  createSimpleTestUser();
}

module.exports = { createSimpleTestUser }; 