-- Add new columns to profiles table for decentralized artist profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS cover_cid TEXT,
  ADD COLUMN IF NOT EXISTS artist_ticker TEXT,
  ADD COLUMN IF NOT EXISTS ticker_created_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS profile_metadata_cid TEXT,
  ADD COLUMN IF NOT EXISTS avatar_cid TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS total_plays INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_songs INTEGER DEFAULT 0;

-- Add unique constraints
ALTER TABLE public.profiles 
  ADD CONSTRAINT unique_artist_ticker UNIQUE (artist_ticker);

ALTER TABLE public.profiles 
  ADD CONSTRAINT unique_wallet_address UNIQUE (wallet_address);

-- Create index for faster wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles(wallet_address);

-- Create index for ticker lookups
CREATE INDEX IF NOT EXISTS idx_profiles_artist_ticker ON public.profiles(artist_ticker);

-- Function to check ticker availability
CREATE OR REPLACE FUNCTION public.is_ticker_available(ticker TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE artist_ticker = UPPER(ticker)
  );
$$;

-- Function to update artist stats (total plays, total songs)
CREATE OR REPLACE FUNCTION public.update_artist_stats(artist_wallet TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    total_songs = (SELECT COUNT(*) FROM public.songs WHERE wallet_address = artist_wallet),
    total_plays = (SELECT COALESCE(SUM(play_count), 0) FROM public.songs WHERE wallet_address = artist_wallet),
    updated_at = NOW()
  WHERE wallet_address = artist_wallet;
END;
$$;

-- Add RLS policy for users to update their own profile by wallet
CREATE POLICY "Users can update profile by wallet" 
ON public.profiles 
FOR UPDATE 
USING (wallet_address = current_setting('request.headers')::json->>'x-wallet-address')
WITH CHECK (wallet_address = current_setting('request.headers')::json->>'x-wallet-address');