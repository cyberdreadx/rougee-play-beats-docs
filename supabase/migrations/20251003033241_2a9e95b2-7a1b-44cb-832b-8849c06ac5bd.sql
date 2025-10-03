-- Function to increment song play count securely and update artist stats
CREATE OR REPLACE FUNCTION public.increment_play_count(song_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet text;
BEGIN
  -- Increment play count and capture wallet address
  UPDATE public.songs
  SET play_count = play_count + 1,
      updated_at = now()
  WHERE id = song_id
  RETURNING wallet_address INTO v_wallet;

  -- If we have the artist wallet, update their aggregate stats
  IF v_wallet IS NOT NULL THEN
    PERFORM public.update_artist_stats(v_wallet);
  END IF;
END;
$$;

-- Ensure anon and authenticated can execute this RPC
GRANT EXECUTE ON FUNCTION public.increment_play_count(uuid) TO anon, authenticated;