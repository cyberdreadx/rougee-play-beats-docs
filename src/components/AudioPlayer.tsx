import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
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

interface AudioPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSongEnd: () => void;
}

const AudioPlayer = ({ currentSong, isPlaying, onPlayPause, onSongEnd }: AudioPlayerProps) => {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [artistTicker, setArtistTicker] = useState<string | null>(null);

  // Fetch artist ticker
  useEffect(() => {
    const fetchArtistTicker = async () => {
      if (!currentSong?.wallet_address) {
        setArtistTicker(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("artist_ticker")
        .eq("wallet_address", currentSong.wallet_address)
        .maybeSingle();

      setArtistTicker(data?.artist_ticker || null);
    };

    fetchArtistTicker();
  }, [currentSong?.wallet_address]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      if (!isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };
    
    const updateDuration = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    const handleEnd = () => onSongEnd();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('loadeddata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('loadeddata', updateDuration);
    };
  }, [onSongEnd]);

  // Reset time when song changes
  useEffect(() => {
    if (currentSong) {
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentSong?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || isNaN(value[0]) || isNaN(audio.duration)) return;
    
    const newTime = Math.min(value[0], audio.duration);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentSong) {
    return null;
  }

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 tech-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-4 p-4">
        {/* Song Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {currentSong.cover_cid && (
            <img 
              src={`https://gateway.lighthouse.storage/ipfs/${currentSong.cover_cid}`}
              alt={currentSong.title}
              className="w-12 h-12 object-cover rounded border border-neon-green/20"
            />
          )}
          <div className="min-w-0">
            <div className="font-mono text-sm font-semibold text-foreground truncate">
              {currentSong.title}
            </div>
            {currentSong.artist && (
              <div 
                className="font-mono text-xs text-muted-foreground hover:text-neon-green cursor-pointer truncate transition-colors"
                onClick={() => navigate(`/artist/${currentSong.wallet_address}`)}
              >
                {currentSong.artist}
                {artistTicker && <span className="text-neon-green ml-1">${artistTicker}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <Button
            variant="neon"
            size="sm"
            onClick={onPlayPause}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <span className="font-mono text-xs text-muted-foreground min-w-[40px]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              className="flex-1"
              onValueChange={handleSeek}
            />
            <span className="font-mono text-xs text-muted-foreground min-w-[40px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            className="w-20"
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={`https://gateway.lighthouse.storage/ipfs/${currentSong.audio_cid}`}
        preload="metadata"
      />
    </Card>
  );
};

export default AudioPlayer;