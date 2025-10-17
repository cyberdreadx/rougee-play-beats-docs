-- Fix comment count sync by calling the sync function after comment operations
-- First, ensure the sync function exists
CREATE OR REPLACE FUNCTION public.sync_feed_comment_count(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE feed_posts
  SET comment_count = (
    SELECT COUNT(*)
    FROM feed_comments
    WHERE post_id = p_post_id
  )
  WHERE id = p_post_id;
END;
$$;

-- Recreate the trigger function to properly update counts
CREATE OR REPLACE FUNCTION public.update_feed_post_comment_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
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
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS update_comment_count ON public.feed_comments;
CREATE TRIGGER update_comment_count
  AFTER INSERT OR DELETE ON public.feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_feed_post_comment_count();

-- Sync all existing posts to fix any discrepancies
UPDATE public.feed_posts
SET comment_count = (
  SELECT COUNT(*)
  FROM public.feed_comments
  WHERE feed_comments.post_id = feed_posts.id
);