#!/usr/bin/env node

/**
 * Check Complete Database Script
 * This script checks what tables and columns exist in the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkCompleteDatabase() {
  console.log('🔍 Checking complete database structure...\n');

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

    // Expected tables
    const expectedTables = [
      'users',
      'projects', 
      'events',
      'rsvps',
      'project_bookmarks',
      'user_bookmarks'
    ];

    console.log('\n📋 Checking tables...');
    const existingTables = [];

    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);

        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
        } else {
          console.log(`   ✅ ${tableName}: Exists`);
          existingTables.push(tableName);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: ${err.message}`);
      }
    }

    // Check users table columns
    console.log('\n👤 Checking users table columns...');
    const expectedUserColumns = [
      'id', 'email', 'full_name', 'avatar', 'bio', 'linkedin_url', 'website_url',
      'industry', 'skills', 'graduation_year', 'is_texas_am_affiliate',
      'contact', 'resume_url', 'profile_setup_completed', 'profile_setup_skipped',
      'funding_raised', 'organizations', 'achievements', 'technical_skills', 'soft_skills',
      'created_at', 'updated_at', 'last_login_at', 'is_manager', 'additional_links'
    ];

    for (const columnName of expectedUserColumns) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select(columnName)
          .limit(1);

        if (error && error.message.includes('column')) {
          console.log(`   ❌ ${columnName}: Missing`);
        } else {
          console.log(`   ✅ ${columnName}: Exists`);
        }
      } catch (err) {
        console.log(`   ❌ ${columnName}: ${err.message}`);
      }
    }

    // Check projects table columns
    console.log('\n📁 Checking projects table columns...');
    const expectedProjectColumns = [
      'id', 'title', 'description', 'owner_id', 'industry', 'required_skills',
      'funding_received', 'incubator_accelerator', 'organizations', 
      'technical_requirements', 'soft_requirements', 'created_at', 'updated_at'
    ];

    for (const columnName of expectedProjectColumns) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(columnName)
          .limit(1);

        if (error && error.message.includes('column')) {
          console.log(`   ❌ ${columnName}: Missing`);
        } else {
          console.log(`   ✅ ${columnName}: Exists`);
        }
      } catch (err) {
        console.log(`   ❌ ${columnName}: ${err.message}`);
      }
    }

    // Check events table
    console.log('\n📅 Checking events table...');
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, description, start_time, end_time, location, created_by')
        .limit(1);

      if (error) {
        console.log(`   ❌ Events table: ${error.message}`);
      } else {
        console.log(`   ✅ Events table: Exists with data`);
      }
    } catch (err) {
      console.log(`   ❌ Events table: ${err.message}`);
    }

    // Check rsvps table
    console.log('\n🎫 Checking rsvps table...');
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('id, user_id, event_id, status')
        .limit(1);

      if (error) {
        console.log(`   ❌ RSVPs table: ${error.message}`);
      } else {
        console.log(`   ✅ RSVPs table: Exists with data`);
      }
    } catch (err) {
      console.log(`   ❌ RSVPs table: ${err.message}`);
    }

    // Summary
    console.log('\n📊 Database Status Summary:');
    console.log('=====================================');
    console.log(`Tables found: ${existingTables.length}/${expectedTables.length}`);
    console.log(`Missing tables: ${expectedTables.length - existingTables.length}`);

    if (existingTables.length < expectedTables.length) {
      console.log('\n❌ Missing tables:');
      expectedTables.forEach(table => {
        if (!existingTables.includes(table)) {
          console.log(`   - ${table}`);
        }
      });
    }

    console.log('\n💡 Next Steps:');
    if (existingTables.length < expectedTables.length) {
      console.log('1. Run the complete database backup in Supabase Dashboard');
      console.log('2. Copy the contents of database_backup_fixed.sql');
      console.log('3. Run the gamification migration');
    } else {
      console.log('✅ Database structure looks complete!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  checkCompleteDatabase();
}

module.exports = { checkCompleteDatabase }; 