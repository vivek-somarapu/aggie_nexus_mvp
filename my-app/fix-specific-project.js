// Fix the specific project that's causing the error
// Run this in your browser console

async function fixSpecificProject() {
  const projectId = 'bc5631e9-eeb4-403d-8620-f16846b01c5c';
  
  try {
    console.log('Fixing project:', projectId);
    
    // First, get the project details
    const projectResponse = await fetch(`/api/projects/${projectId}`);
    if (!projectResponse.ok) {
      console.error('Failed to fetch project');
      return;
    }
    
    const project = await projectResponse.json();
    console.log('Project owner:', project.owner_id);
    
    // Check if owner is already a member
    const membersResponse = await fetch(`/api/projects/${projectId}/members`);
    const members = membersResponse.ok ? await membersResponse.json() : [];
    console.log('Current members:', members);
    
    const ownerIsMember = members.some(member => member.user_id === project.owner_id);
    
    if (!ownerIsMember) {
      console.log('Adding owner as member...');
      
      const addResponse = await fetch(`/api/projects/${projectId}/members`, {
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
        console.log('✅ Successfully added owner to project');
      } else {
        const errorText = await addResponse.text();
        console.error('❌ Failed to add owner:', errorText);
      }
    } else {
      console.log('✅ Owner already exists as member');
    }
    
  } catch (error) {
    console.error('Error fixing project:', error);
  }
}

// Run the fix
fixSpecificProject(); 