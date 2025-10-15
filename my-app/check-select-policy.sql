-- Check what SELECT policies exist on projects table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'projects' AND cmd = 'SELECT';

-- If there's a SELECT policy that filters deleted=false, 
-- it might be preventing the UPDATE from being verified

