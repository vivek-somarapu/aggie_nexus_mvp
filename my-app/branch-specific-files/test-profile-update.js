#!/usr/bin/env node

/**
 * Test Profile Update Script
 * This script tests the profile update functionality to debug the issue
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testProfileUpdate() {
  console.log('🔧 Testing profile update functionality...\n');

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

    // Step 1: Check if we can find a test user
    console.log('\n🔍 Looking for test users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .limit(5);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`✅ Found ${users?.length || 0} users`);
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.full_name} (${user.email}) - ID: ${user.id}`);
      });
    }

    // Step 2: Check database schema
    console.log('\n📋 Checking database schema...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .in('column_name', ['funding_raised', 'organizations', 'achievements', 'technical_skills', 'soft_skills']);

    if (columnsError) {
      console.error('❌ Error checking schema:', columnsError.message);
    } else {
      console.log('✅ Database columns found:');
      if (columns && columns.length > 0) {
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
      } else {
        console.log('   ❌ No gamification columns found!');
        console.log('   This means the migration was not run properly.');
      }
    }

    // Step 3: Test a simple update without new fields
    if (users && users.length > 0) {
      const testUser = users[0];
      console.log(`\n🧪 Testing simple update for user: ${testUser.full_name}`);
      
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          full_name: testUser.full_name + ' (Test)',
          updated_at: new Date().toISOString()
        })
        .eq('id', testUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Simple update failed:', updateError.message);
        console.error('   Error details:', updateError);
      } else {
        console.log('✅ Simple update successful!');
        console.log(`   Updated name: ${updateData.full_name}`);
      }
    }

    // Step 4: Test update with new fields (if they exist)
    if (users && users.length > 0 && columns && columns.length > 0) {
      const testUser = users[0];
      console.log(`\n🧪 Testing gamification update for user: ${testUser.full_name}`);
      
      const gamificationData = {
        funding_raised: 50000,
        organizations: ['Aggies Create'],
        achievements: ['Funding Milestone'],
        technical_skills: ['JavaScript', 'React'],
        soft_skills: ['Leadership'],
        updated_at: new Date().toISOString()
      };

      const { data: gamificationUpdate, error: gamificationError } = await supabase
        .from('users')
        .update(gamificationData)
        .eq('id', testUser.id)
        .select()
        .single();

      if (gamificationError) {
        console.error('❌ Gamification update failed:', gamificationError.message);
        console.error('   Error details:', gamificationError);
      } else {
        console.log('✅ Gamification update successful!');
        console.log(`   Funding: $${gamificationUpdate.funding_raised}`);
        console.log(`   Organizations: ${gamificationUpdate.organizations?.join(', ')}`);
      }
    }

    // Step 5: Check RLS policies
    console.log('\n🔒 Checking Row Level Security...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('policy_name, permissive, roles, cmd')
      .eq('table_schema', 'public')
      .eq('table_name', 'users');

    if (policiesError) {
      console.error('❌ Error checking RLS policies:', policiesError.message);
    } else {
      console.log('✅ RLS policies found:');
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`   - ${policy.policy_name}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`);
        });
      } else {
        console.log('   No RLS policies found');
      }
    }

    console.log('\n📊 Summary:');
    console.log('=====================================');
    console.log(`Users found: ${users?.length || 0}`);
    console.log(`Gamification columns: ${columns?.length || 0}`);
    console.log(`RLS policies: ${policies?.length || 0}`);

    console.log('\n💡 Recommendations:');
    if (!columns || columns.length === 0) {
      console.log('1. Run the gamification migration: node run-migration.js');
    }
    if (policies && policies.length > 0) {
      console.log('2. Check RLS policies - they might be blocking updates');
    }
    console.log('3. Make sure you\'re authenticated when testing updates');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  testProfileUpdate();
}

module.exports = { testProfileUpdate }; 