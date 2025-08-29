#!/usr/bin/env node

/**
 * Database Structure Checker
 * This script helps diagnose database schema issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkDatabase() {
  console.log('🔍 Checking database structure...\n');

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

    // Check 1: List all tables in public schema
    console.log('📋 Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('❌ Error fetching tables:', tablesError.message);
    } else {
      console.log('✅ Available tables in public schema:');
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      } else {
        console.log('   No tables found in public schema');
      }
    }

    // Check 2: Try to access users table directly
    console.log('\n👥 Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.error('❌ Error accessing users table:', usersError.message);
      console.log('   This suggests the users table might not exist or have different permissions');
    } else {
      console.log('✅ Users table exists and is accessible');
    }

    // Check 3: Look for similar table names
    console.log('\n🔍 Looking for user-related tables...');
    const userRelatedTables = tables?.filter(table => 
      table.table_name.toLowerCase().includes('user') ||
      table.table_name.toLowerCase().includes('profile') ||
      table.table_name.toLowerCase().includes('account')
    );

    if (userRelatedTables && userRelatedTables.length > 0) {
      console.log('✅ Found potential user-related tables:');
      userRelatedTables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    } else {
      console.log('   No user-related tables found');
    }

    // Check 4: Check auth schema
    console.log('\n🔐 Checking auth schema...');
    const { data: authTables, error: authError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'auth');

    if (authError) {
      console.error('❌ Error fetching auth tables:', authError.message);
    } else {
      console.log('✅ Available tables in auth schema:');
      if (authTables && authTables.length > 0) {
        authTables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      } else {
        console.log('   No tables found in auth schema');
      }
    }

    // Check 5: Test connection with a simple query
    console.log('\n🔗 Testing basic connection...');
    const { data: testData, error: testError } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .limit(1);

    if (testError) {
      console.error('❌ Basic connection test failed:', testError.message);
    } else {
      console.log('✅ Basic connection successful');
    }

    console.log('\n📊 Summary:');
    console.log('=====================================');
    console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`Supabase Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`);
    console.log(`Users table: ${usersError ? '❌ Not found' : '✅ Found'}`);
    console.log(`Total tables: ${tables?.length || 0}`);
    console.log(`Auth tables: ${authTables?.length || 0}`);

    if (usersError) {
      console.log('\n💡 Next Steps:');
      console.log('1. Check if you ran the initial database migration');
      console.log('2. Verify you\'re connecting to the correct Supabase project');
      console.log('3. Check if the users table has a different name');
      console.log('4. Run the database migration if needed');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  checkDatabase();
}

module.exports = { checkDatabase }; 