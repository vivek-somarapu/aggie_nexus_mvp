#!/usr/bin/env node

/**
 * Debug Profile Setup Script
 * This script simulates the profile setup process to debug the issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function debugProfileSetup() {
  console.log('🔧 Debugging profile setup process...\n');

  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Error: Missing Supabase environment variables!');
    process.exit(1);
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('📡 Connecting to Supabase...');

    // Step 1: Check authentication
    console.log('\n🔐 Checking authentication...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ User is authenticated:');
      console.log(`   User ID: ${session.user.id}`);
      console.log(`   Email: ${session.user.email}`);
    } else {
      console.log('❌ No active session');
      console.log('   You need to sign in first');
      return;
    }

    // Step 2: Get current profile
    console.log('\n👤 Getting current profile...');
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError.message);
      return;
    }

    console.log('✅ Profile found:');
    console.log(`   Name: ${profile.full_name}`);
    console.log(`   Email: ${profile.email}`);
    console.log(`   Profile setup completed: ${profile.profile_setup_completed}`);

    // Step 3: Simulate the exact payload from profile setup
    console.log('\n🧪 Simulating profile setup payload...');
    const payload = {
      full_name: profile.full_name || "Test User",
      bio: "Test bio for debugging",
      linkedin_url: null,
      website_url: null,
      is_texas_am_affiliate: profile.is_texas_am_affiliate || false,
      graduation_year: profile.graduation_year || null,
      avatar: profile.avatar || null,
      resume_url: profile.resume_url || null,
      industry: profile.industry || [],
      skills: profile.skills || [],
      funding_raised: 50000,
      organizations: ['Aggies Create', 'AggieX Accelerator'],
      achievements: ['Funding Milestone'],
      technical_skills: ['JavaScript', 'React', 'TypeScript'],
      soft_skills: ['Leadership', 'Communication'],
      contact: profile.contact || { email: profile.email, phone: "" },
      profile_setup_completed: true,
      profile_setup_skipped: false,
    };

    console.log('📋 Payload to be sent:');
    console.log(JSON.stringify(payload, null, 2));

    // Step 4: Try the update
    console.log('\n🔄 Attempting profile update...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
      console.error('   Error details:', updateError);
      
      // Check if it's an RLS issue
      if (updateError.message.includes('new row violates row-level security policy')) {
        console.log('\n🔒 This is an RLS (Row Level Security) issue!');
        console.log('   The user might not have permission to update their own profile.');
      }
    } else {
      console.log('✅ Update successful!');
      console.log(`   Updated name: ${updateData.full_name}`);
      console.log(`   Funding: $${updateData.funding_raised}`);
      console.log(`   Organizations: ${updateData.organizations?.join(', ')}`);
      console.log(`   Profile setup completed: ${updateData.profile_setup_completed}`);
    }

    // Step 5: Test the user service approach
    console.log('\n🧪 Testing user service approach...');
    try {
      // Simulate the user service call
      const { data: serviceUpdate, error: serviceError } = await supabase
        .from('users')
        .update({
          full_name: payload.full_name,
          bio: payload.bio,
          funding_raised: payload.funding_raised,
          organizations: payload.organizations,
          achievements: payload.achievements,
          technical_skills: payload.technical_skills,
          soft_skills: payload.soft_skills,
          profile_setup_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (serviceError) {
        console.error('❌ Service update failed:', serviceError.message);
        console.error('   Error details:', serviceError);
      } else {
        console.log('✅ Service update successful!');
        console.log(`   Name: ${serviceUpdate.full_name}`);
        console.log(`   Funding: $${serviceUpdate.funding_raised}`);
      }
    } catch (serviceErr) {
      console.error('❌ Service error:', serviceErr.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('   Stack trace:', error.stack);
  }
}

// Run the script
if (require.main === module) {
  debugProfileSetup();
}

module.exports = { debugProfileSetup }; 