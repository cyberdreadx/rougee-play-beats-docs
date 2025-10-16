-- Create story_views table to track who viewed which story
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_wallet_address TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_wallet_address)
);

-- Create story_likes table to track who liked which story
CREATE TABLE IF NOT EXISTS public.story_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(story_id, wallet_address)
);

-- Enable RLS on both tables
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- Policies for story_views
CREATE POLICY "Anyone can view story views"
  ON public.story_views FOR SELECT
  USING (true);

CREATE POLICY "Users can record their own views"
  ON public.story_views FOR INSERT
  WITH CHECK (viewer_wallet_address = get_wallet_from_jwt());

-- Story owner can see who viewed their stories
CREATE POLICY "Story owners can see their story views"
  ON public.story_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id = story_views.story_id
      AND stories.wallet_address = get_wallet_from_jwt()
    )
  );

-- Policies for story_likes
CREATE POLICY "Anyone can view story likes"
  ON public.story_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like stories"
  ON public.story_likes FOR INSERT
  WITH CHECK (wallet_address = get_wallet_from_jwt());

CREATE POLICY "Users can unlike stories"
  ON public.story_likes FOR DELETE
  USING (wallet_address = get_wallet_from_jwt());

-- Create indexes for better performance
CREATE INDEX idx_story_views_story_id ON public.story_views(story_id);
CREATE INDEX idx_story_views_viewer ON public.story_views(viewer_wallet_address);
CREATE INDEX idx_story_likes_story_id ON public.story_likes(story_id);
CREATE INDEX idx_story_likes_wallet ON public.story_likes(wallet_address);

-- Add view_count and like_count columns to stories for quick access
ALTER TABLE public.stories 
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Create function to update view count
CREATE OR REPLACE FUNCTION public.update_story_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories 
    SET view_count = view_count + 1 
    WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories 
    SET view_count = GREATEST(view_count - 1, 0)
    WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create function to update like count
CREATE OR REPLACE FUNCTION public.update_story_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories 
    SET like_count = like_count + 1 
    WHERE id = NEW.story_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories 
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.story_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers to auto-update counts
CREATE TRIGGER update_story_view_count_trigger
  AFTER INSERT OR DELETE ON public.story_views
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_view_count();

CREATE TRIGGER update_story_like_count_trigger
  AFTER INSERT OR DELETE ON public.story_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_like_count();