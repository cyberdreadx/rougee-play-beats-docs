-- Create feed_posts table for decentralized social feed
CREATE TABLE public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  content_text TEXT,
  media_cid TEXT,
  media_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can view posts
CREATE POLICY "Anyone can view feed posts"
  ON public.feed_posts
  FOR SELECT
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "Users can create their own posts"
  ON public.feed_posts
  FOR INSERT
  WITH CHECK (wallet_address IS NOT NULL);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
  ON public.feed_posts
  FOR DELETE
  USING (wallet_address = ((current_setting('request.headers'))::json->>'x-wallet-address'));

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
  ON public.feed_posts
  FOR UPDATE
  USING (wallet_address = ((current_setting('request.headers'))::json->>'x-wallet-address'));

-- Create feed_likes table
CREATE TABLE public.feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, wallet_address)
);

-- Enable RLS on likes
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON public.feed_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.feed_likes
  FOR INSERT
  WITH CHECK (wallet_address IS NOT NULL);

CREATE POLICY "Users can unlike posts"
  ON public.feed_likes
  FOR DELETE
  USING (wallet_address = ((current_setting('request.headers'))::json->>'x-wallet-address'));

-- Add indexes for performance
CREATE INDEX idx_feed_posts_created_at ON public.feed_posts(created_at DESC);
CREATE INDEX idx_feed_posts_wallet ON public.feed_posts(wallet_address);
CREATE INDEX idx_feed_likes_post ON public.feed_likes(post_id);

-- Trigger to update like_count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_like_count
AFTER INSERT OR DELETE ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION update_post_like_count();