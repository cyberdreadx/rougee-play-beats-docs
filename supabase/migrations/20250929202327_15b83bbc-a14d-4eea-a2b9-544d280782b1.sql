-- Create songs table for uploaded audio metadata
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  audio_cid TEXT NOT NULL,
  cover_cid TEXT,
  duration INTEGER,
  genre TEXT,
  play_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view songs
CREATE POLICY "Songs are viewable by everyone" 
ON public.songs 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_songs_updated_at
BEFORE UPDATE ON public.songs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_songs_wallet_address ON public.songs(wallet_address);
CREATE INDEX idx_songs_created_at ON public.songs(created_at DESC);
CREATE INDEX idx_songs_play_count ON public.songs(play_count DESC);