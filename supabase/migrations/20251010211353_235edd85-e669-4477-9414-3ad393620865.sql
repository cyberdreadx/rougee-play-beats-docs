-- Create feed_comments table
CREATE TABLE IF NOT EXISTS public.feed_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view comments"
  ON public.feed_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.feed_comments
  FOR INSERT
  WITH CHECK (wallet_address IS NOT NULL);

CREATE POLICY "Users can delete their own comments"
  ON public.feed_comments
  FOR DELETE
  USING (wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text));

-- Create index for faster queries
CREATE INDEX idx_feed_comments_post_id ON public.feed_comments(post_id);

-- Create trigger to update comment count
CREATE OR REPLACE FUNCTION update_feed_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts 
    SET comment_count = comment_count + 1 
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts 
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
AFTER INSERT OR DELETE ON public.feed_comments
FOR EACH ROW
EXECUTE FUNCTION update_feed_post_comment_count();