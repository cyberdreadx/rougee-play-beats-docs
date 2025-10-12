-- Fix the security definer view issue by dropping and recreating without SECURITY DEFINER
DROP VIEW IF EXISTS public.public_profiles;

-- Create view without SECURITY DEFINER to enforce caller's permissions
CREATE VIEW public.public_profiles WITH (security_invoker=true) AS
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
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;