-- Test if we can update the deleted field directly
-- Run this as the authenticated user to see if RLS allows it

-- First, let's see what projects the current user owns
SELECT id, title, owner_id, deleted 
FROM projects 
WHERE owner_id = auth.uid()
LIMIT 1;

-- Then try to update one (replace 'your-project-id' with an actual project ID)
-- UPDATE projects 
-- SET deleted = true, last_updated = NOW()
-- WHERE id = 'your-project-id' AND owner_id = auth.uid();

-- If the above works, the RLS policy is correct
-- If it fails, we need to adjust the policy
