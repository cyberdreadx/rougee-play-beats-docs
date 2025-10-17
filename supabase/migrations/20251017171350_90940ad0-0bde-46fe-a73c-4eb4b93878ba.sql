-- Fix comment counts for feed posts
-- Recalculate actual comment counts from feed_comments table
UPDATE feed_posts
SET comment_count = (
  SELECT COUNT(*)
  FROM feed_comments
  WHERE feed_comments.post_id = feed_posts.id
);

-- Create a function to sync comment count with actual comments
CREATE OR REPLACE FUNCTION sync_feed_comment_count(p_post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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