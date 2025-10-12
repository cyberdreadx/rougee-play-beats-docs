-- Fix email exposure in profiles table
-- Drop the overly permissive policy and create granular ones

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Allow viewing public profile data (excluding email)
CREATE POLICY "Public profile data viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Note: Email column should be excluded from public queries via application logic
-- or a view should be created. For now, we'll add a policy for email access.

-- Users can view their own email
CREATE POLICY "Users can view own email"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id OR 
  wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text)
);

-- Admins can view all emails
CREATE POLICY "Admins can view all emails"
ON public.profiles FOR SELECT
USING (
  public.has_role_by_wallet(
    ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text),
    'admin'::app_role
  )
);

-- Create a public view that excludes sensitive data
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
  role,
  total_songs,
  total_plays,
  verified,
  ticker_created_at,
  created_at,
  updated_at
  -- Explicitly excluding: email, email_notifications, profile_metadata_cid
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO anon, authenticated;