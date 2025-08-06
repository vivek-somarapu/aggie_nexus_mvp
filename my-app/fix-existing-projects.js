// Script to fix existing projects by adding owners to project_members table
// Run this in your browser console on any page

async function fixExistingProjects() {
  try {
    // Get all projects
    const response = await fetch('/api/projects');
    if (!response.ok) {
      console.error('Failed to fetch projects');
      return;
    }
    
    const projects = await response.json();
    console.log(`Found ${projects.length} projects`);
    
    // For each project, check if owner exists in project_members
    for (const project of projects) {
      console.log(`Checking project: ${project.title} (${project.id})`);
      
      // Get project members
      const membersResponse = await fetch(`/api/projects/${project.id}/members`);
      const members = membersResponse.ok ? await membersResponse.json() : [];
      
      // Check if owner is already a member
      const ownerIsMember = members.some(member => member.user_id === project.owner_id);
      
      if (!ownerIsMember) {
        console.log(`Adding owner to project: ${project.title}`);
        
        // Add owner as member
        const addResponse = await fetch(`/api/projects/${project.id}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            members: [{
              user_id: project.owner_id,
              role: 'Owner'
            }]
          })
        });
        
        if (addResponse.ok) {
          console.log(`✅ Successfully added owner to ${project.title}`);
        } else {
          console.error(`❌ Failed to add owner to ${project.title}:`, await addResponse.text());
        }
      } else {
        console.log(`✅ Owner already exists for ${project.title}`);
      }
    }
    
    console.log('Finished fixing existing projects');
  } catch (error) {
    console.error('Error fixing projects:', error);
  }
}

// Run the fix
fixExistingProjects(); 