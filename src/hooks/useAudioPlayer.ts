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
      // First get current play count
      const { data: currentData, error: fetchError } = await supabase
        .from('songs')
        .select('play_count')
        .eq('id', songId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch current play count:', fetchError);
        return;
      }

      // Then increment it
      const { error } = await supabase
        .from('songs')
        .update({ 
          play_count: (currentData?.play_count || 0) + 1
        })
        .eq('id', songId);

      if (error) {
        console.error('Failed to increment play count:', error);
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