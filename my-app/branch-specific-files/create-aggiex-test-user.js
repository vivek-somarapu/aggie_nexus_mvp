#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createAggieXTestUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const testEmail = `aggiex-test-${Date.now()}@tamu.edu`;
  const testPassword = 'testpassword123';

  try {
    console.log('🔧 Creating AggieX test user...');
    console.log(`📧 Email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'AggieX Test User'
      }
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      return;
    }

    console.log('✅ Auth user created successfully');

    // 2. Create profile with AggieX organization
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testEmail,
        full_name: 'AggieX Test User',
        organizations: ['AggieX'],
        organization_claims: [
          {
            organization: 'AggieX',
            claimed_at: new Date().toISOString(),
            verification_method: 'email_domain',
            status: 'verified'
          }
        ],
        organization_verifications: {
          'AggieX': {
            verified_at: new Date().toISOString(),
            verified_by: 'system',
            verification_method: 'email_domain',
            notes: 'Auto-verified via @tamu.edu email domain'
          }
        },
        profile_setup_completed: true,
        profile_setup_skipped: false,
        is_texas_am_affiliate: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError);
      return;
    }

    console.log('✅ Profile created successfully with AggieX verification');
    console.log('🎯 This user can now claim "AggieX Accelerator" for projects!');
    console.log('\n📋 Test Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('\n🚀 Next steps:');
    console.log('   1. Log in with these credentials');
    console.log('   2. Create a new project');
    console.log('   3. You should see "AggieX Accelerator" as an available program');
    console.log('   4. Select it and save the project');
    console.log('   5. Check that the badge appears on the project page');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
  }
}

createAggieXTestUser(); 