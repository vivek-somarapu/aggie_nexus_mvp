#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkProjectColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔍 Checking project table columns...');

  try {
    // Get a sample project to see what columns exist
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching projects:', error);
      return;
    }

    if (projects && projects.length > 0) {
      const project = projects[0];
      console.log('✅ Project columns found:');
      console.log('📋 All columns:', Object.keys(project));
      
      // Check for gamification columns
      const gamificationColumns = [
        'funding_received',
        'incubator_accelerator', 
        'organizations',
        'technical_requirements',
        'soft_requirements'
      ];

      console.log('\n🎯 Gamification columns check:');
      gamificationColumns.forEach(col => {
        const exists = col in project;
        const value = project[col];
        console.log(`${exists ? '✅' : '❌'} ${col}: ${exists ? value : 'MISSING'}`);
      });

      // Show sample project data
      console.log('\n📊 Sample project data:');
      console.log('Title:', project.title);
      console.log('Funding received:', project.funding_received);
      console.log('Incubator/Accelerator:', project.incubator_accelerator);
      console.log('Organizations:', project.organizations);
    } else {
      console.log('⚠️  No projects found in database');
    }

  } catch (error) {
    console.error('❌ Error checking project columns:', error);
  }
}

checkProjectColumns(); 