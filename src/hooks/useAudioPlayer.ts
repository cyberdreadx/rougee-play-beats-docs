import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  wallet_address: string;
  audio_cid: string;
  cover_cid: string | null;
  play_count: number;
  created_at: string;
}

export const useAudioPlayer = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const incrementPlayCount = useCallback(async (songId: string) => {
    try {
      // First get current song data
      const { data: currentData, error: fetchError } = await supabase
        .from('songs')
        .select('play_count, wallet_address')
        .eq('id', songId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch current song data:', fetchError);
        return;
      }

      // Increment play count
      const { error: updateError } = await supabase
        .from('songs')
        .update({ 
          play_count: (currentData?.play_count || 0) + 1
        })
        .eq('id', songId);

      if (updateError) {
        console.error('Failed to increment play count:', updateError);
        return;
      }

      // Update artist stats if wallet address exists
      if (currentData?.wallet_address) {
        const { error: statsError } = await supabase.rpc('update_artist_stats', {
          artist_wallet: currentData.wallet_address
        });

        if (statsError) {
          console.error('Failed to update artist stats:', statsError);
        }
      }
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  }, []);

  const playSong = useCallback((song: Song) => {
    if (currentSong?.id === song.id) {
      // Toggle play/pause for the same song
      setIsPlaying(!isPlaying);
    } else {
      // Play new song and increment play count
      setCurrentSong(song);
      setIsPlaying(true);
      incrementPlayCount(song.id);
    }
  }, [currentSong, isPlaying, incrementPlayCount]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const stopSong = useCallback(() => {
    setIsPlaying(false);
    setCurrentSong(null);
  }, []);

  const onSongEnd = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return {
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    stopSong,
    onSongEnd,
  };
};