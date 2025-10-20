-- Add bonding curve support to playlists table
-- This allows playlists to be deployed as tradeable tokens

-- Add play_count for trending playlists
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS play_count INTEGER NOT NULL DEFAULT 0;

-- Add genre for categorization
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS genre TEXT;

-- Add is_public flag
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT true;

-- Add total_duration_seconds for playlist length
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS total_duration_seconds INTEGER;

-- Add song_count for quick access
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS song_count INTEGER NOT NULL DEFAULT 0;

-- Create playlist_likes table (similar to song_likes)
CREATE TABLE IF NOT EXISTS public.playlist_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, wallet_address)
);

-- Enable RLS on playlist_likes
ALTER TABLE public.playlist_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlist_likes
CREATE POLICY "Anyone can view playlist likes"
  ON public.playlist_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like playlists"
  ON public.playlist_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can unlike playlists"
  ON public.playlist_likes
  FOR DELETE
  TO authenticated
  USING (true);

-- Also allow anonymous users (for PWA mode)
CREATE POLICY "Anonymous users can like playlists"
  ON public.playlist_likes
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can unlike playlists"
  ON public.playlist_likes
  FOR DELETE
  TO anon
  USING (true);

-- Create playlist_plays table for tracking plays
CREATE TABLE IF NOT EXISTS public.playlist_plays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  wallet_address TEXT,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on playlist_plays
ALTER TABLE public.playlist_plays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlist_plays
CREATE POLICY "Anyone can view playlist plays"
  ON public.playlist_plays
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can record playlist plays"
  ON public.playlist_plays
  FOR INSERT
  WITH CHECK (true);

-- Function to update playlist play count
CREATE OR REPLACE FUNCTION public.increment_playlist_play_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.playlists
  SET play_count = play_count + 1
  WHERE id = NEW.playlist_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment play count
DROP TRIGGER IF EXISTS increment_playlist_play_count_trigger ON public.playlist_plays;
CREATE TRIGGER increment_playlist_play_count_trigger
  AFTER INSERT ON public.playlist_plays
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_playlist_play_count();

-- Function to update song_count when songs are added/removed
CREATE OR REPLACE FUNCTION public.update_playlist_song_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.playlists
    SET song_count = song_count + 1
    WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.playlists
    SET song_count = song_count - 1
    WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update song count
DROP TRIGGER IF EXISTS update_playlist_song_count_trigger ON public.playlist_songs;
CREATE TRIGGER update_playlist_song_count_trigger
  AFTER INSERT OR DELETE ON public.playlist_songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_playlist_song_count();

-- Add like_count column to playlists for caching
ALTER TABLE public.playlists 
ADD COLUMN IF NOT EXISTS like_count INTEGER NOT NULL DEFAULT 0;

-- Function to update like count
CREATE OR REPLACE FUNCTION public.update_playlist_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.playlists
    SET like_count = like_count + 1
    WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.playlists
    SET like_count = like_count - 1
    WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update like count
DROP TRIGGER IF EXISTS update_playlist_like_count_trigger ON public.playlist_likes;
CREATE TRIGGER update_playlist_like_count_trigger
  AFTER INSERT OR DELETE ON public.playlist_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_playlist_like_count();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_likes_playlist_id ON public.playlist_likes(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_likes_wallet_address ON public.playlist_likes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_playlist_plays_playlist_id ON public.playlist_plays(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlists_play_count ON public.playlists(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_token_address ON public.playlists(token_address) WHERE token_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_playlists_is_public ON public.playlists(is_public) WHERE is_public = true;

-- Trigger to normalize wallet addresses in playlist_likes
CREATE TRIGGER normalize_playlist_likes_wallet_address
  BEFORE INSERT OR UPDATE ON public.playlist_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_wallet_address();

-- Update RLS policy for playlist_songs to allow adding any song (not just owned ones)
-- This is more flexible for playlist creation
DROP POLICY IF EXISTS "Users can add songs to their own playlists if they own the song" ON public.playlist_songs;
CREATE POLICY "Users can add songs to their own playlists"
  ON public.playlist_songs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_id 
      AND wallet_address = get_wallet_from_jwt()
    )
  );

