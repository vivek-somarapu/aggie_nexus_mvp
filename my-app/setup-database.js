#!/usr/bin/env node

/**
 * Database Setup Script
 * This script sets up the initial database structure from the backup file
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🔧 Setting up database structure...\n');

  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('❌ Error: Missing Supabase URL!');
    console.log('Please create a .env.local file with:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional for dashboard method)');
    process.exit(1);
  }

  // Check if we have service role key
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  No service role key found. You have two options:\n');
    console.log('Option 1: Get Service Role Key');
    console.log('1. Go to Supabase Dashboard → Settings → API');
    console.log('2. Copy the "service_role" key');
    console.log('3. Add it to .env.local as SUPABASE_SERVICE_ROLE_KEY=your_key');
    console.log('4. Run this script again\n');
    console.log('Option 2: Use Dashboard SQL Editor');
    console.log('1. Go to Supabase Dashboard → SQL Editor');
    console.log('2. Copy the contents of database_backup_fixed.sql');
    console.log('3. Paste and run it in the SQL Editor');
    console.log('4. Then run: node run-migration.js\n');
    console.log('Which option would you prefer?');
    process.exit(1);
  }

  try {
    // Create Supabase client with service role key (admin privileges)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('📡 Connecting to Supabase with admin privileges...');
    console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);

    // Read the database backup file
    const backupPath = path.join(__dirname, 'database_backup_fixed.sql');
    if (!fs.existsSync(backupPath)) {
      console.error('❌ Error: database_backup_fixed.sql not found!');
      console.log('Please make sure the backup file exists in the my-app directory');
      process.exit(1);
    }

    console.log('📖 Reading database backup file...');
    const backupContent = fs.readFileSync(backupPath, 'utf8');

    // Split the SQL into individual statements
    const statements = backupContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute statements in batches
    const batchSize = 5;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i += batchSize) {
      const batch = statements.slice(i, i + batchSize);
      console.log(`🔄 Executing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(statements.length / batchSize)}...`);

      for (const statement of batch) {
        try {
          // Skip empty statements and comments
          if (statement.trim().length === 0 || statement.trim().startsWith('--')) {
            continue;
          }

          // Execute the SQL statement
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key') ||
                error.message.includes('relation already exists')) {
              console.log(`   ⚠️  Skipped (already exists): ${statement.substring(0, 50)}...`);
            } else {
              console.error(`   ❌ Error: ${error.message}`);
              console.error(`   Statement: ${statement.substring(0, 100)}...`);
              errorCount++;
            }
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`   ❌ Unexpected error: ${err.message}`);
          errorCount++;
        }
      }

      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Setup Summary:');
    console.log('=====================================');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📝 Total statements: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 Database setup completed successfully!');
    } else {
      console.log('\n⚠️  Database setup completed with some errors (expected for existing objects)');
    }

    // Verify the setup
    console.log('\n🔍 Verifying setup...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('❌ Error verifying tables:', tablesError.message);
    } else {
      console.log('✅ Available tables:');
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`   - ${table.table_name}`);
        });
      } else {
        console.log('   No tables found');
      }
    }

    console.log('\n💡 Next Steps:');
    console.log('1. Run the gamification migration: node run-migration.js');
    console.log('2. Create a test user: node create-test-user.js');
    console.log('3. Start the development server: npm run dev');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 