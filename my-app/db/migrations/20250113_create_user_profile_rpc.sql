-- Create a function to safely create user profiles that bypasses RLS
-- This function is called with SECURITY DEFINER so it runs with the privileges of the function owner
-- It validates that the authenticated user is creating their own profile

CREATE OR REPLACE FUNCTION public.create_user_profile(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_email_verified boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile jsonb;
BEGIN
  -- Validate that the authenticated user is creating their own profile
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to create a profile';
  END IF;
  
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Users can only create their own profile';
  END IF;
  
  -- Check if profile already exists
  SELECT row_to_json(u.*)::jsonb INTO v_profile
  FROM public.users u
  WHERE u.id = p_user_id;
  
  IF v_profile IS NOT NULL THEN
    -- Profile already exists, return it
    RETURN v_profile;
  END IF;
  
  -- Insert the user profile
  INSERT INTO public.users (
    id,
    email,
    full_name,
    email_verified,
    industry,
    skills,
    contact,
    views,
    is_texas_am_affiliate,
    deleted,
    last_login_at,
    profile_setup_completed,
    profile_setup_skipped
  )
  VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_email_verified,
    ARRAY[]::text[],
    ARRAY[]::text[],
    jsonb_build_object('email', p_email),
    0,
    false,
    false,
    now(),
    false,
    false
  );
  
  -- Return the newly created profile
  SELECT row_to_json(u.*)::jsonb INTO v_profile
  FROM public.users u
  WHERE u.id = p_user_id;
  
  RETURN v_profile;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile(uuid, text, text, boolean) TO anon;

-- Add comment
COMMENT ON FUNCTION public.create_user_profile IS 'Creates a user profile in the users table. Bypasses RLS but validates that users can only create their own profile.';

