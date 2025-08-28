#!/usr/bin/env node

/**
 * Check Columns Script
 * This script checks if the gamification columns exist in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkColumns() {
  console.log('🔍 Checking if gamification columns exist...\n');

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

    // Try to select the new columns directly
    console.log('\n🧪 Testing column access...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id, full_name, funding_raised, organizations, achievements, technical_skills, soft_skills')
      .limit(1);

    if (testError) {
      console.error('❌ Error accessing columns:', testError.message);
      console.log('   This means the gamification columns do not exist yet.');
      console.log('\n💡 Solution:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Run the migration SQL I provided');
      console.log('3. Then test the profile setup again');
    } else {
      console.log('✅ Gamification columns exist!');
      console.log('   Sample data:', testData);
      
      // Test updating with new fields
      console.log('\n🧪 Testing update with new fields...');
      const { data: updateData, error: updateError } = await supabase
        .from('users')
        .update({
          funding_raised: 75000,
          organizations: ['Aggies Create', 'AggieX Accelerator'],
          achievements: ['Funding Milestone'],
          technical_skills: ['JavaScript', 'React', 'TypeScript'],
          soft_skills: ['Leadership', 'Communication']
        })
        .eq('id', testData[0].id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Update failed:', updateError.message);
      } else {
        console.log('✅ Update successful!');
        console.log(`   Funding: $${updateData.funding_raised}`);
        console.log(`   Organizations: ${updateData.organizations?.join(', ')}`);
        console.log(`   Technical Skills: ${updateData.technical_skills?.join(', ')}`);
        console.log(`   Soft Skills: ${updateData.soft_skills?.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  checkColumns();
}

module.exports = { checkColumns }; 