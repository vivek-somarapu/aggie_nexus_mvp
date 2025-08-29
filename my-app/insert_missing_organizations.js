require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function insertMissingOrganizations() {
  console.log('🔧 Inserting missing organizations into database...\n');

  // Organizations from the old userOrganizationOptions that need to be added
  const now = new Date().toISOString();
  const missingOrganizations = [
    {
      name: "Aggies Create",
      description: "Student organization focused on and innovation and entrepreneurship",
      created_at: now
    },
    {
      name: "AggieX", 
      description: "Student organization and accelerator program",
      created_at: now
      
    },
    {
      name: "Aggie Entrepreneurs",
      description: "Student entrepreneurship organization",
      created_at: now
    },
    {
      name: "Meloy Engineering Innovation and Entrepreneurship Program (MEIEP)",
      description: "Engineering innovation and entrepreneurship program",
      created_at: now
    },
    {
      name: "McFerrin Experience Team (MET)",
      description: "Student experience and leadership team",
      created_at: now
    },
    {
      name: "Aggie Venture Fund (AVF)",
      description: "Student venture fund organization",
      created_at: now
    },
    {
      name: "Honors Program",
      description: "University honors program",
      created_at: now
    }
  ];

  console.log('📋 Organizations to insert:');
  missingOrganizations.forEach(org => {
    console.log(`  - ${org.name}`);
  });

  // Check which organizations already exist
  const { data: existingOrgs, error: fetchError } = await supabase
    .from('organizations')
    .select('name');

  if (fetchError) {
    console.error('❌ Error fetching existing organizations:', fetchError);
    return;
  }

  const existingOrgNames = existingOrgs?.map(org => org.name) || [];
  console.log('\n📋 Existing organizations in database:');
  existingOrgNames.forEach(name => {
    console.log(`  - ${name}`);
  });

  // Filter out organizations that already exist
  const organizationsToInsert = missingOrganizations.filter(org => 
    !existingOrgNames.includes(org.name)
  );

  if (organizationsToInsert.length === 0) {
    console.log('\n✅ All organizations already exist in the database!');
    return;
  }

  console.log('\n🚀 Inserting new organizations:');
  organizationsToInsert.forEach(org => {
    console.log(`  - ${org.name}`);
  });

  // Insert the missing organizations
  const { data: insertedOrgs, error: insertError } = await supabase
    .from('organizations')
    .insert(organizationsToInsert)
    .select('id, name, description');

  if (insertError) {
    console.error('❌ Error inserting organizations:', insertError);
    return;
  }

  console.log('\n✅ Successfully inserted organizations:');
  insertedOrgs?.forEach(org => {
    console.log(`  - ${org.name} (ID: ${org.id})`);
  });

  console.log(`\n🎯 Inserted ${insertedOrgs?.length || 0} new organizations!`);
}

insertMissingOrganizations().catch(console.error); 