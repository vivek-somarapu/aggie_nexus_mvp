-- Fix the UPDATE policy to allow soft deletes
-- The WITH CHECK clause was preventing updates that set deleted=true

DROP POLICY IF EXISTS "Users can update their own projects" ON "public"."projects";

CREATE POLICY "Users can update their own projects"
ON "public"."projects"
FOR UPDATE
TO public
USING (
  auth.uid() = owner_id
)
WITH CHECK (
  auth.uid() = owner_id
  -- Allow the update even if deleted is being set to true
  -- The key is that we're checking ownership, not deleted status
);

-- Also ensure there's a policy that allows users to delete their own projects
DROP POLICY IF EXISTS "Users can delete their own projects" ON "public"."projects";

CREATE POLICY "Users can delete their own projects"
ON "public"."projects"
FOR DELETE
TO public
USING (
  auth.uid() = owner_id
);

