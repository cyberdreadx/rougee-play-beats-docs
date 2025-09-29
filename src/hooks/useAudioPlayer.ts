import { useState, useCallback } from "react";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  audio_cid: string;
  cover_cid: string | null;
  play_count: number;
  created_at: string;
}

export const useAudioPlayer = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playSong = useCallback((song: Song) => {
    if (currentSong?.id === song.id) {
      // Toggle play/pause for the same song
      setIsPlaying(!isPlaying);
    } else {
      // Play new song
      setCurrentSong(song);
      setIsPlaying(true);
    }
  }, [currentSong, isPlaying]);

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