-- Create song likes table
CREATE TABLE public.song_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.song_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view likes"
ON public.song_likes
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own likes"
ON public.song_likes
FOR INSERT
WITH CHECK (wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text));

CREATE POLICY "Users can delete their own likes"
ON public.song_likes
FOR DELETE
USING (wallet_address = ((current_setting('request.headers'::text))::json ->> 'x-wallet-address'::text));

-- Indexes
CREATE INDEX idx_song_likes_wallet ON public.song_likes(wallet_address);
CREATE INDEX idx_song_likes_song ON public.song_likes(song_id);

-- Unique constraint to prevent duplicate likes
CREATE UNIQUE INDEX idx_song_likes_unique ON public.song_likes(wallet_address, song_id);

-- Function to get like count for a song
CREATE OR REPLACE FUNCTION public.get_song_like_count(p_song_id UUID)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)
  FROM public.song_likes
  WHERE song_id = p_song_id;
$$;

-- Function to check if user liked a song
CREATE OR REPLACE FUNCTION public.has_user_liked_song(p_wallet_address TEXT, p_song_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.song_likes
    WHERE wallet_address = p_wallet_address
    AND song_id = p_song_id
  );
$$;