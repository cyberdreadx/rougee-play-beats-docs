-- Add ticker column to playlists table
ALTER TABLE public.playlists 
ADD COLUMN ticker TEXT;

-- Add index for ticker column for better query performance
CREATE INDEX idx_playlists_ticker ON public.playlists(ticker);
