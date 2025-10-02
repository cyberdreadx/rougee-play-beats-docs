-- Fix search_path for security
DROP FUNCTION IF EXISTS public.is_ticker_available(TEXT);
CREATE OR REPLACE FUNCTION public.is_ticker_available(ticker TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE artist_ticker = UPPER(ticker)
  );
$$;

DROP FUNCTION IF EXISTS public.update_artist_stats(TEXT);
CREATE OR REPLACE FUNCTION public.update_artist_stats(artist_wallet TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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