-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_cid TEXT,
  token_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_songs junction table
CREATE TABLE public.playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, song_id)
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlists
CREATE POLICY "Anyone can view playlists"
  ON public.playlists
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own playlists"
  ON public.playlists
  FOR INSERT
  WITH CHECK (wallet_address = get_wallet_from_jwt());

CREATE POLICY "Users can update their own playlists"
  ON public.playlists
  FOR UPDATE
  USING (wallet_address = get_wallet_from_jwt())
  WITH CHECK (wallet_address = get_wallet_from_jwt());

CREATE POLICY "Users can delete their own playlists"
  ON public.playlists
  FOR DELETE
  USING (wallet_address = get_wallet_from_jwt());

-- RLS Policies for playlist_songs
CREATE POLICY "Anyone can view playlist songs"
  ON public.playlist_songs
  FOR SELECT
  USING (true);

CREATE POLICY "Users can add songs to their own playlists if they own the song"
  ON public.playlist_songs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_id 
      AND wallet_address = get_wallet_from_jwt()
    )
    AND
    EXISTS (
      SELECT 1 FROM public.song_purchases
      WHERE song_id = playlist_songs.song_id
      AND buyer_wallet_address = get_wallet_from_jwt()
    )
  );

CREATE POLICY "Users can remove songs from their own playlists"
  ON public.playlist_songs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE id = playlist_id 
      AND wallet_address = get_wallet_from_jwt()
    )
  );

-- Trigger to update updated_at on playlists
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to normalize wallet addresses
CREATE TRIGGER normalize_playlist_wallet_address
  BEFORE INSERT OR UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_wallet_address();

-- Create index for better query performance
CREATE INDEX idx_playlist_songs_playlist_id ON public.playlist_songs(playlist_id);
CREATE INDEX idx_playlist_songs_song_id ON public.playlist_songs(song_id);
CREATE INDEX idx_playlists_wallet_address ON public.playlists(wallet_address);