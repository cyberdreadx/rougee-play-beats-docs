-- Debug query to check artist stats
-- Run this in Supabase SQL Editor

-- Check what's in the profiles table vs actual song counts
SELECT 
  p.wallet_address,
  p.artist_name,
  p.total_songs as cached_songs,
  p.total_plays as cached_plays,
  (SELECT COUNT(*) FROM songs WHERE LOWER(songs.wallet_address) = LOWER(p.wallet_address)) as actual_songs,
  (SELECT COALESCE(SUM(play_count), 0) FROM songs WHERE LOWER(songs.wallet_address) = LOWER(p.wallet_address)) as actual_plays
FROM profiles p
WHERE p.artist_name IS NOT NULL
ORDER BY actual_songs DESC
LIMIT 10;

-- Check if the trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'sync_artist_stats_trigger';

-- Check if the function exists
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_name IN ('sync_artist_stats_on_song_change', 'update_artist_stats')
  AND routine_schema = 'public';

