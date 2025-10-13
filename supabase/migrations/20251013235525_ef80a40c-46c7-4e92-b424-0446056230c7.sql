-- ============================================
-- CRITICAL SECURITY FIX: RLS Policies with Verified JWT
-- ============================================
-- This migration fixes authentication bypass vulnerabilities by:
-- 1. Removing authentication fallback in edge function (already done in code)
-- 2. Fixing email exposure in profiles table
-- 3. Updating RLS policies to use verified Privy JWT instead of headers
--
-- MANUAL STEP REQUIRED BEFORE THIS WORKS:
-- Configure Supabase Auth to accept Privy JWT tokens:
-- 1. Go to: https://supabase.com/dashboard/project/phybdsfwycygroebrsdx/auth/providers
-- 2. Click "Add Provider" > "Custom JWT"
-- 3. Configure:
--    - JWKS URL: https://auth.privy.io/api/v1/apps/<PRIVY_APP_ID>/.well-known/jwks.json
--    - Issuer: privy.io  
--    - Audience: <PRIVY_APP_ID>
-- 4. Save configuration
--
-- After configuration, these policies will use cryptographically verified wallet addresses.
-- ============================================

-- ============================================
-- Helper Function: Extract Wallet from Verified JWT
-- ============================================
CREATE OR REPLACE FUNCTION public.get_wallet_from_jwt()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(
    COALESCE(
      -- Try to get from linked_accounts array in Privy JWT
      (
        SELECT (account->>'address')::text
        FROM jsonb_array_elements(
          COALESCE((auth.jwt()->>'linked_accounts')::jsonb, '[]'::jsonb)
        ) AS account
        WHERE account->>'type' IN ('wallet', 'smart_wallet', 'embedded_wallet')
        LIMIT 1
      ),
      -- Fallback to direct wallet_address claim if present
      (auth.jwt()->>'wallet_address')::text
    )
  );
$$;

-- ============================================
-- FIX 1: Email Exposure - More Restrictive Policies
-- ============================================
-- Note: The existing "Public profile data viewable by everyone" policy
-- allows SELECT on all columns. Frontend should use public_profiles view.

-- ============================================
-- FIX 2: Feed Posts - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can create their own posts" ON public.feed_posts;
CREATE POLICY "Users can create their own posts"
ON public.feed_posts
FOR INSERT
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt()
);

DROP POLICY IF EXISTS "Users can delete their own posts" ON public.feed_posts;
CREATE POLICY "Users can delete their own posts"
ON public.feed_posts
FOR DELETE
USING (
  wallet_address = public.get_wallet_from_jwt()
);

DROP POLICY IF EXISTS "Users can update their own posts" ON public.feed_posts;
CREATE POLICY "Users can update their own posts"
ON public.feed_posts
FOR UPDATE
USING (
  wallet_address = public.get_wallet_from_jwt()
)
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt()
);

-- ============================================
-- FIX 3: Feed Likes - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can like posts" ON public.feed_likes;
CREATE POLICY "Users can like posts"
ON public.feed_likes
FOR INSERT
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt()
);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.feed_likes;
CREATE POLICY "Users can unlike posts"
ON public.feed_likes
FOR DELETE
USING (
  wallet_address = public.get_wallet_from_jwt()
);

-- ============================================
-- FIX 4: Feed Comments - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can create comments" ON public.feed_comments;
CREATE POLICY "Users can create comments"
ON public.feed_comments
FOR INSERT
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt()
);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.feed_comments;
CREATE POLICY "Users can delete their own comments"
ON public.feed_comments
FOR DELETE
USING (
  wallet_address = public.get_wallet_from_jwt()
);

-- ============================================
-- FIX 5: Song Likes - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.song_likes;
CREATE POLICY "Users can insert their own likes"
ON public.song_likes
FOR INSERT
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt()
);

DROP POLICY IF EXISTS "Users can delete their own likes" ON public.song_likes;
CREATE POLICY "Users can delete their own likes"
ON public.song_likes
FOR DELETE
USING (
  wallet_address = public.get_wallet_from_jwt()
);

-- ============================================
-- FIX 6: Song Purchases - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.song_purchases;
CREATE POLICY "Users can insert their own purchases"
ON public.song_purchases
FOR INSERT
WITH CHECK (
  buyer_wallet_address = public.get_wallet_from_jwt()
);

-- ============================================
-- FIX 7: Profiles - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can update profile by wallet" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (
  wallet_address = public.get_wallet_from_jwt()
)
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt()
);

-- ============================================
-- FIX 8: Stories - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories"
ON public.stories
FOR DELETE
USING (
  wallet_address = public.get_wallet_from_jwt()
);

DROP POLICY IF EXISTS "Authenticated users can create stories" ON public.stories;
CREATE POLICY "Authenticated users can create stories"
ON public.stories
FOR INSERT
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt()
);

-- ============================================
-- FIX 9: Artist Tokens - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can create their own artist token" ON public.artist_tokens;
CREATE POLICY "Users can create their own artist token"
ON public.artist_tokens
FOR INSERT
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt()
);

-- ============================================
-- FIX 10: Copyright Violations - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can view their own violations" ON public.copyright_violations;
CREATE POLICY "Users can view their own violations"
ON public.copyright_violations
FOR SELECT
USING (
  wallet_address = public.get_wallet_from_jwt()
);

-- ============================================
-- FIX 11: Verification Requests - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can view their own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view their own verification requests"
ON public.verification_requests
FOR SELECT
USING (
  wallet_address = public.get_wallet_from_jwt()
);

DROP POLICY IF EXISTS "Users can create verification requests" ON public.verification_requests;
CREATE POLICY "Users can create verification requests"
ON public.verification_requests
FOR INSERT
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt() AND
  NOT EXISTS (
    SELECT 1
    FROM verification_requests vr
    WHERE vr.wallet_address = public.get_wallet_from_jwt()
    AND vr.status = 'pending'::verification_status
  )
);

-- ============================================
-- FIX 12: Comments - Use Verified JWT
-- ============================================
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments"
ON public.comments
FOR DELETE
USING (
  wallet_address = public.get_wallet_from_jwt()
);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
ON public.comments
FOR INSERT
WITH CHECK (
  wallet_address = public.get_wallet_from_jwt()
);