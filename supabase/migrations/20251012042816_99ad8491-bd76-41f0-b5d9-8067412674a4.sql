-- CRITICAL SECURITY FIX: Remove role from profiles table to prevent privilege escalation

-- Step 1: Drop all dependencies on the profiles.role column

-- Drop the sync trigger first
DROP TRIGGER IF EXISTS sync_profile_role_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.sync_profile_role_to_user_roles() CASCADE;

-- Drop the trigger on auth.users that calls handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the public_profiles view (it depends on role column)
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Drop policies that depend on profiles.role
DROP POLICY IF EXISTS "Only admins can delete songs" ON public.songs;
DROP POLICY IF EXISTS "Only admins can view reports" ON public.song_reports;

-- Recreate the admin policies to use user_roles instead
CREATE POLICY "Only admins can delete songs"
ON public.songs
FOR DELETE
TO authenticated
USING (
  public.has_role_by_wallet(
    (current_setting('request.headers')::json->>'x-wallet-address'),
    'admin'::app_role
  )
);

CREATE POLICY "Only admins can view reports"
ON public.song_reports
FOR SELECT
TO authenticated
USING (
  public.has_role_by_wallet(
    (current_setting('request.headers')::json->>'x-wallet-address'),
    'admin'::app_role
  )
);

-- Now we can safely drop the role column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- Recreate public_profiles view without the role column
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  wallet_address,
  display_name,
  artist_name,
  artist_ticker,
  bio,
  avatar_cid,
  avatar_url,
  cover_cid,
  social_links,
  total_songs,
  total_plays,
  verified,
  ticker_created_at,
  created_at,
  updated_at
FROM public.profiles;

-- Secure the user_roles table with admin-only write access
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Read-only access for authenticated users (needed for role checks)
CREATE POLICY "Authenticated users can view user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert/update/delete roles (prevents self-promotion to admin)
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role_by_wallet(
    (current_setting('request.headers')::json->>'x-wallet-address'),
    'admin'::app_role
  )
);

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role_by_wallet(
    (current_setting('request.headers')::json->>'x-wallet-address'),
    'admin'::app_role
  )
)
WITH CHECK (
  public.has_role_by_wallet(
    (current_setting('request.headers')::json->>'x-wallet-address'),
    'admin'::app_role
  )
);

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role_by_wallet(
    (current_setting('request.headers')::json->>'x-wallet-address'),
    'admin'::app_role
  )
);

-- Recreate handle_new_user without setting role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();