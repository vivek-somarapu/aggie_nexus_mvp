const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creating test user...');

    // Test user credentials
    const testUser = {
      email: 'testing1@aggiex.com',
      password: 'testpassword123',
      full_name: 'Test User',
      role: 'manager' // Give them manager role for testing
    };

    // 1. Create auth user
    console.log('Creating auth user...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: testUser.full_name
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created:', authData.user.id);

    // 2. Create profile in users table
    console.log('Creating user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testUser.email,
        full_name: testUser.full_name,
        role: testUser.role,
        bio: 'This is a test user for manual testing of the AggieX platform.',
        industry: ['Technology', 'Engineering'],
        skills: ['JavaScript', 'React', 'Node.js', 'Python'],
        graduation_year: 2025,
        is_texas_am_affiliate: true,
        profile_setup_completed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      return;
    }

    console.log('User profile created successfully');

    // 3. Create a test organization
    console.log('Creating test organization...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Organization',
        description: 'A test organization for manual testing',
        website_url: 'https://test-org.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating organization:', orgError);
      return;
    }

    console.log('Test organization created:', orgData.id);

    // 4. Make the test user a manager of the test organization
    console.log('Making test user an organization manager...');
    const { error: managerError } = await supabase
      .from('organization_managers')
      .insert({
        org_id: orgData.id,
        user_id: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (managerError) {
      console.error('Error making user organization manager:', managerError);
      return;
    }

    console.log('Test user made organization manager');

    // 5. Create a test event
    console.log('Creating test event...');
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .insert({
        title: 'Test Event for Manual Testing',
        description: 'This is a test event to verify the event management functionality.',
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        location: 'Test Location, College Station, TX',
        created_by: authData.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating test event:', eventError);
      return;
    }

    console.log('Test event created:', eventData.id);

    // 6. Create a test project
    console.log('Creating test project...');
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        title: 'Test Project for Manual Testing',
        description: 'This is a test project to verify the project management functionality.',
        owner_id: authData.user.id,
        is_idea: false,
        recruitment_status: 'open',
        industry: ['Technology'],
        required_skills: ['JavaScript', 'React'],
        location_type: 'hybrid',
        estimated_start: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        estimated_end: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        contact_info: { email: testUser.email },
        project_status: 'active',
        deleted: false,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (projectError) {
      console.error('Error creating test project:', projectError);
      return;
    }

    console.log('Test project created:', projectData.id);

    console.log('\n=== TEST USER CREATED SUCCESSFULLY ===');
    console.log('Email:', testUser.email);
    console.log('Password:', testUser.password);
    console.log('Role:', testUser.role);
    console.log('User ID:', authData.user.id);
    console.log('Organization ID:', orgData.id);
    console.log('Test Event ID:', eventData.id);
    console.log('Test Project ID:', projectData.id);
    console.log('\nYou can now log in with these credentials to test the site manually.');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser(); 