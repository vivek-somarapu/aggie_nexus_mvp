-- Migration: Moves data from old tables ot new tables, and deletes unnecessary user columns
-- Date: 2025-08-27

-- 1. First, we need to check and see if is_manager is true, then make role == 'admin' in public.users
UPDATE public.users
SET role = 'admin'
WHERE is_manager = true;

-- 2. Delete column is_manager from public.users
ALTER TABLE public.users DROP COLUMN is_manager CASCADE;

-- 3. Drop incubator_accelerator column and organizations column from public.projects
ALTER TABLE public.projects DROP COLUMN incubator_accelerator;
ALTER TABLE public.projects DROP COLUMN organizations;