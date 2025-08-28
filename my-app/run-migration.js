#!/usr/bin/env node

/**
 * Migration Runner
 * This script runs the gamification migration
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('🔄 Running gamification migration...\n');

  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing Supabase environment variables!');
    console.log('Please create a .env.local file with:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    process.exit(1);
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📡 Connecting to Supabase...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'db', 'migrations', '20250127_add_gamification_and_organization_fields.sql');
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Error: Migration file not found!');
      console.log('Expected path:', migrationPath);
      process.exit(1);
    }

    console.log('📖 Reading migration file...');
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');

    // Split into individual statements
    const statements = migrationContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} migration statements\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        console.log(`🔄 Executing: ${statement.substring(0, 60)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('relation already exists')) {
            console.log(`   ⚠️  Skipped (already exists)`);
          } else {
            console.error(`   ❌ Error: ${error.message}`);
            errorCount++;
          }
        } else {
          console.log(`   ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`   ❌ Unexpected error: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log('=====================================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
    } else {
      console.log('\n⚠️  Migration completed with some errors (may be expected)');
    }

    // Verify the new columns exist
    console.log('\n🔍 Verifying new columns...');
    
    // Check users table
    const { data: userColumns, error: userError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .in('column_name', ['funding_raised', 'organizations', 'achievements', 'technical_skills', 'soft_skills']);

    if (userError) {
      console.error('❌ Error checking user columns:', userError.message);
    } else {
      console.log('✅ New user columns:');
      if (userColumns && userColumns.length > 0) {
        userColumns.forEach(col => {
          console.log(`   - ${col.column_name}`);
        });
      } else {
        console.log('   No new columns found');
      }
    }

    // Check projects table
    const { data: projectColumns, error: projectError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'projects')
      .in('column_name', ['funding_received', 'incubator_accelerator', 'organizations', 'technical_requirements', 'soft_requirements']);

    if (projectError) {
      console.error('❌ Error checking project columns:', projectError.message);
    } else {
      console.log('✅ New project columns:');
      if (projectColumns && projectColumns.length > 0) {
        projectColumns.forEach(col => {
          console.log(`   - ${col.column_name}`);
        });
      } else {
        console.log('   No new columns found');
      }
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Create a test user: node create-test-user.js');
    console.log('2. Start the development server: npm run dev');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration }; 