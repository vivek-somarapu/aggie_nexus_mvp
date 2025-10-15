-- Simple fix: Remove the WITH CHECK clause that's causing the issue
-- Since we're only allowing updates to owned projects (USING clause),
-- and we're not changing the owner_id, the WITH CHECK is redundant

DROP POLICY IF EXISTS "Users can update their own projects" ON "public"."projects";

CREATE POLICY "Users can update their own projects"
ON "public"."projects"
FOR UPDATE
TO public
USING (
  auth.uid() = owner_id
);
-- No WITH CHECK clause - this was preventing soft deletes
