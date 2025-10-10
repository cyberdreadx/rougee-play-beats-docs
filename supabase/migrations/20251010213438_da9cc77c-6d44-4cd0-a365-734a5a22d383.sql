-- Create triggers to keep like_count and comment_count in sync on feed_posts
DO $$ BEGIN
  -- Create like count trigger if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_feed_like_count'
  ) THEN
    CREATE TRIGGER trg_feed_like_count
    AFTER INSERT OR DELETE ON public.feed_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_post_like_count();
  END IF;

  -- Create comment count trigger if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_feed_comment_count'
  ) THEN
    CREATE TRIGGER trg_feed_comment_count
    AFTER INSERT OR DELETE ON public.feed_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_feed_post_comment_count();
  END IF;
END $$;
