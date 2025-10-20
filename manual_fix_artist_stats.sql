-- Manual fix to update all artist stats right now
-- Run this in Supabase SQL Editor

-- Update all artist stats manually
DO $$
DECLARE
  artist_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  FOR artist_record IN 
    SELECT DISTINCT LOWER(wallet_address) as wallet_address
    FROM public.songs 
    WHERE wallet_address IS NOT NULL
  LOOP
    PERFORM public.update_artist_stats(artist_record.wallet_address);
    updated_count := updated_count + 1;
  END LOOP;
  
  RAISE NOTICE 'Updated % artist profiles', updated_count;
END $$;

-- Verify the results
SELECT 
  p.artist_name,
  p.total_songs as songs,
  p.total_plays as plays,
  p.wallet_address
FROM profiles p
WHERE p.artist_name IS NOT NULL
  AND (p.total_songs > 0 OR p.total_plays > 0)
ORDER BY p.total_plays DESC
LIMIT 10;

