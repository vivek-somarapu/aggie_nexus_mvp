#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updateProjectWithIncubator() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔧 Updating project with incubator data...');

  try {
    // Get the most recent project
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Error fetching projects:', error);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('❌ No projects found');
      return;
    }

    const project = projects[0];
    console.log('📋 Found project:', project.title);

    // Update the project with incubator data
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update({
        incubator_accelerator: ['Aggies Create Incubator'],
        funding_received: 50000
      })
      .eq('id', project.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating project:', updateError);
      return;
    }

    console.log('✅ Project updated successfully!');
    console.log('📊 Updated data:');
    console.log('- Incubator/Accelerator:', updatedProject.incubator_accelerator);
    console.log('- Funding received:', updatedProject.funding_received);
    console.log('\n🎉 Now refresh the projects page to see the badges!');

  } catch (error) {
    console.error('❌ Error updating project:', error);
  }
}

updateProjectWithIncubator(); 