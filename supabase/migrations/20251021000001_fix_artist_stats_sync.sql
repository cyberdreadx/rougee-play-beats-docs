-- Fix artist stats synchronization
-- Ensure total_songs and total_plays are always accurate in profiles table

-- Function to update artist stats when songs are inserted or deleted
CREATE OR REPLACE FUNCTION public.sync_artist_stats_on_song_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT
  IF (TG_OP = 'INSERT') THEN
    PERFORM public.update_artist_stats(NEW.wallet_address);
    RETURN NEW;
  -- Handle DELETE
  ELSIF (TG_OP = 'DELETE') THEN
    PERFORM public.update_artist_stats(OLD.wallet_address);
    RETURN OLD;
  -- Handle UPDATE (if wallet_address changes, update both old and new)
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.wallet_address != NEW.wallet_address) THEN
      PERFORM public.update_artist_stats(OLD.wallet_address);
      PERFORM public.update_artist_stats(NEW.wallet_address);
    ELSE
      -- If play_count changed, update stats
      IF (OLD.play_count != NEW.play_count) THEN
        PERFORM public.update_artist_stats(NEW.wallet_address);
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_artist_stats_trigger ON public.songs;

-- Create trigger to sync artist stats when songs change
CREATE TRIGGER sync_artist_stats_trigger
  AFTER INSERT OR UPDATE OF play_count, wallet_address OR DELETE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_artist_stats_on_song_change();

-- Backfill all artist stats to ensure accuracy
DO $$
DECLARE
  artist_record RECORD;
BEGIN
  FOR artist_record IN 
    SELECT DISTINCT wallet_address 
    FROM public.songs 
    WHERE wallet_address IS NOT NULL
  LOOP
    PERFORM public.update_artist_stats(artist_record.wallet_address);
  END LOOP;
  
  RAISE NOTICE 'Artist stats backfill completed';
END $$;

-- Also ensure the update_artist_stats function handles case-insensitive matching
CREATE OR REPLACE FUNCTION public.update_artist_stats(artist_wallet TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile stats using case-insensitive wallet matching
  UPDATE public.profiles
  SET 
    total_songs = (
      SELECT COUNT(*) 
      FROM public.songs 
      WHERE LOWER(wallet_address) = LOWER(artist_wallet)
    ),
    total_plays = (
      SELECT COALESCE(SUM(play_count), 0) 
      FROM public.songs 
      WHERE LOWER(wallet_address) = LOWER(artist_wallet)
    ),
    updated_at = NOW()
  WHERE LOWER(wallet_address) = LOWER(artist_wallet);
  
  -- If no profile exists, log it (but don't error)
  IF NOT FOUND THEN
    RAISE NOTICE 'No profile found for wallet: %', artist_wallet;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.sync_artist_stats_on_song_change() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_artist_stats(TEXT) TO anon, authenticated;

