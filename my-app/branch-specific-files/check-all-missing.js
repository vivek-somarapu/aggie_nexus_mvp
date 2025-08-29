#!/usr/bin/env node

/**
 * Check All Missing Database Items
 * This script checks for all missing tables and columns based on the errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkAllMissing() {
  console.log('🔍 Checking ALL missing database items...\n');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Error: Missing Supabase environment variables!');
    process.exit(1);
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log('📡 Connecting to Supabase...\n');

    // Check all expected tables
    const expectedTables = [
      'users',
      'projects', 
      'events',
      'rsvps',
      'project_bookmarks',
      'user_bookmarks',
      'project_application_details',
      'project_inquiries',
      'project_applications'
    ];

    console.log('📋 Checking all tables...');
    const existingTables = [];
    const missingTables = [];

    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);

        if (error) {
          console.log(`   ❌ ${tableName}: ${error.message}`);
          missingTables.push(tableName);
        } else {
          console.log(`   ✅ ${tableName}: Exists`);
          existingTables.push(tableName);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName}: ${err.message}`);
        missingTables.push(tableName);
      }
    }

    // Check events table columns specifically
    console.log('\n📅 Checking events table columns...');
    const expectedEventColumns = [
      'id', 'title', 'description', 'start_time', 'end_time', 'location', 
      'created_by', 'status', 'max_participants', 'current_participants',
      'created_at', 'updated_at'
    ];

    for (const columnName of expectedEventColumns) {
      try {
        const { data, error } = await supabase
          .from('events')
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

    // Check users table for missing columns
    console.log('\n👤 Checking users table for missing columns...');
    const missingUserColumns = ['last_login_at', 'is_manager'];
    
    for (const columnName of missingUserColumns) {
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

    // Summary
    console.log('\n📊 Complete Database Status:');
    console.log('=====================================');
    console.log(`Tables found: ${existingTables.length}/${expectedTables.length}`);
    console.log(`Missing tables: ${missingTables.length}`);

    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:');
      missingTables.forEach(table => {
        console.log(`   - ${table}`);
      });
    }

    console.log('\n💡 Action Required:');
    console.log('You need to run the COMPLETE database backup to fix all missing items.');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy the entire contents of database_backup_fixed.sql');
    console.log('3. Run the SQL to create all missing tables and columns');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

if (require.main === module) {
  checkAllMissing();
}

module.exports = { checkAllMissing }; 