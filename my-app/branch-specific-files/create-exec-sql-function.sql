-- Create the exec_sql function needed for automated database setup
-- Run this in Supabase Dashboard SQL Editor first

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Grant execute permission to anon users (for setup scripts)
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO anon; 