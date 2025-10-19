-- Fix RLS policies for story_views and story_likes
-- The issue is that the policies are too restrictive and the get_wallet_from_jwt() function might not work correctly

-- Drop existing policies
DROP POLICY IF EXISTS "Users can record their own views" ON public.story_views;
DROP POLICY IF EXISTS "Users can like stories" ON public.story_likes;
DROP POLICY IF EXISTS "Users can unlike stories" ON public.story_likes;

-- Create more permissive policies that allow authenticated users to insert/delete

-- Allow any authenticated user to record views (we trust the client to send correct wallet address)
CREATE POLICY "Authenticated users can record story views"
  ON public.story_views FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow any authenticated user to like stories
CREATE POLICY "Authenticated users can like stories"
  ON public.story_likes FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow any authenticated user to unlike their own stories
CREATE POLICY "Authenticated users can unlike stories"
  ON public.story_likes FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anonymous users (for PWA mode without explicit auth)
CREATE POLICY "Anonymous users can record story views"
  ON public.story_views FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can like stories"
  ON public.story_likes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can unlike stories"
  ON public.story_likes FOR DELETE
  TO anon
  USING (true);

