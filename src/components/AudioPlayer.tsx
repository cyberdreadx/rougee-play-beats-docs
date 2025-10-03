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
  ticker?: string | null;
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
      setCurrentTime(audio.currentTime || 0);
    };
    
    const updateDuration = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    const handleEnd = () => onSongEnd();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnd);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('canplay', updateDuration);

    // Force initial duration update
    if (audio.duration && !isNaN(audio.duration)) {
      updateDuration();
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnd);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('canplay', updateDuration);
    };
  }, [onSongEnd, currentSong?.id]);

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
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback error:", error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio || !duration || isNaN(value[0])) return;
    
    const newTime = Math.min(value[0], duration);
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
    <Card className="fixed bottom-0 md:bottom-0 left-0 right-0 z-50 glass border-0 mb-0 md:mb-0 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-green/5 via-transparent to-neon-green/5 animate-pulse opacity-50" />
      
      {/* Visualizer bars */}
      {isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 flex items-end gap-0.5 px-2 opacity-30">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-neon-green rounded-t visualizer-bar"
              style={{
                animationDelay: `${i * 0.05}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`
              }}
            />
          ))}
        </div>
      )}
      
      {/* Mobile Compact Player */}
      <div className="md:hidden relative z-10">
        <div className="flex items-center gap-3 p-3 pb-2">
          {currentSong.cover_cid && (
            <div 
              className="relative w-10 h-10 rounded overflow-hidden border border-neon-green/30 shadow-lg flex-shrink-0 cursor-pointer hover:border-neon-green/60 transition-colors"
              onClick={() => navigate(`/trade/${currentSong.id}`)}
            >
              <img 
                src={`https://gateway.lighthouse.storage/ipfs/${currentSong.cover_cid}`}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-neon-green/20 animate-pulse" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-semibold text-foreground truncate flex items-center gap-1">
              <span className="truncate">{currentSong.title}</span>
              {currentSong.ticker && (
                <span className="text-neon-green text-xs flex-shrink-0">${currentSong.ticker}</span>
              )}
            </div>
            {currentSong.artist && (
              <div className="font-mono text-xs text-muted-foreground truncate">
                {currentSong.artist}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-8 w-8"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-neon-green" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPlayPause}
              className="h-10 w-10 rounded-full bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/50 transition-all hover:scale-110"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-neon-green" />
              ) : (
                <Play className="w-5 h-5 text-neon-green fill-neon-green" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile progress slider */}
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground min-w-[35px]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              className="flex-1"
              onValueChange={handleSeek}
            />
            <span className="font-mono text-xs text-muted-foreground min-w-[35px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        
        {/* Mobile volume slider */}
        <div className="px-3 pb-2">
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.1}
            className="w-full"
            onValueChange={handleVolumeChange}
          />
        </div>
      </div>

      {/* Desktop Full Player */}
      <div className="hidden md:flex items-center gap-4 p-4 relative z-10">
        {/* Song Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {currentSong.cover_cid && (
            <div 
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-neon-green/30 shadow-lg shadow-neon-green/20 cursor-pointer hover:border-neon-green/60 transition-all hover:scale-105"
              onClick={() => navigate(`/trade/${currentSong.id}`)}
            >
              <img 
                src={`https://gateway.lighthouse.storage/ipfs/${currentSong.cover_cid}`}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-t from-neon-green/30 to-transparent animate-pulse" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-mono text-sm font-semibold text-foreground truncate flex items-center gap-2">
              <span className="truncate">{currentSong.title}</span>
              {currentSong.ticker && (
                <span className="text-neon-green text-xs flex-shrink-0">${currentSong.ticker}</span>
              )}
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
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="h-12 w-12 rounded-full bg-neon-green/20 hover:bg-neon-green/30 border-2 border-neon-green/50 transition-all hover:scale-110 shadow-lg shadow-neon-green/20"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-neon-green" />
            ) : (
              <Play className="w-6 h-6 text-neon-green fill-neon-green" />
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