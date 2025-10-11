import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from "lucide-react";
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

interface Ad {
  id: string;
  title: string;
  audio_cid: string;
  image_cid: string | null;
  duration: number;
}

interface AudioPlayerProps {
  currentSong: Song | null;
  currentAd?: Ad | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSongEnd: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onShuffle?: () => void;
  onRepeat?: () => void;
  shuffleEnabled?: boolean;
  repeatMode?: 'off' | 'all' | 'one';
}

const AudioPlayer = ({ 
  currentSong, 
  currentAd, 
  isPlaying, 
  onPlayPause, 
  onSongEnd,
  onNext,
  onPrevious,
  onShuffle,
  onRepeat,
  shuffleEnabled = false,
  repeatMode = 'off'
}: AudioPlayerProps) => {
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

  const isAd = !!currentAd;
  const displayTitle = isAd ? currentAd.title : currentSong?.title || "";
  const displayArtist = isAd ? "Advertisement" : currentSong?.artist || "Unknown Artist";
  const displayCover = isAd 
    ? (currentAd.image_cid ? `https://gateway.lighthouse.storage/ipfs/${currentAd.image_cid}` : "") 
    : (currentSong?.cover_cid ? `https://gateway.lighthouse.storage/ipfs/${currentSong.cover_cid}` : "");
  const audioSource = isAd 
    ? `https://gateway.lighthouse.storage/ipfs/${currentAd.audio_cid}`
    : (currentSong ? `https://gateway.lighthouse.storage/ipfs/${currentSong.audio_cid}` : "");

  if (!currentSong && !currentAd) {
    return null;
  }

  return (
    <Card className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 glass border-0 overflow-hidden">
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
        <div className="flex items-center gap-2 p-2 pb-1">
          {displayCover && (
            <div 
              className="relative w-10 h-10 rounded overflow-hidden border border-neon-green/30 shadow-lg flex-shrink-0 cursor-pointer hover:border-neon-green/60 transition-colors"
              onClick={() => !isAd && currentSong && navigate(`/song/${currentSong.id}`)}
            >
              <img 
                src={displayCover}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-neon-green/20 animate-pulse" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-mono text-sm font-semibold text-foreground truncate flex items-center gap-1">
              <span className="truncate">{displayTitle}</span>
              {!isAd && currentSong?.ticker && (
                <span className="text-neon-green text-xs flex-shrink-0">${currentSong.ticker}</span>
              )}
            </div>
            <div className="font-mono text-xs text-muted-foreground truncate">
              {displayArtist}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {onShuffle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onShuffle}
                className={`h-7 w-7 ${shuffleEnabled ? 'text-neon-green' : 'text-muted-foreground'}`}
              >
                <Shuffle className="w-3 h-3" />
              </Button>
            )}
            {onPrevious && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="h-8 w-8 text-muted-foreground"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
            )}
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
            {onNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="h-8 w-8 text-muted-foreground"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            )}
            {onRepeat && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRepeat}
                className={`h-7 w-7 ${repeatMode !== 'off' ? 'text-neon-green' : 'text-muted-foreground'}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-3 h-3" />
                ) : (
                  <Repeat className="w-3 h-3" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-7 w-7"
            >
              {isMuted ? (
                <VolumeX className="w-3 h-3 text-muted-foreground" />
              ) : (
                <Volume2 className="w-3 h-3 text-neon-green" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile progress slider */}
        <div className="px-2 pb-1">
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] text-muted-foreground min-w-[30px]">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              className="flex-1"
              onValueChange={handleSeek}
            />
            <span className="font-mono text-[10px] text-muted-foreground min-w-[30px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        
        {/* Mobile volume slider */}
        <div className="px-2 pb-1">
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
          {displayCover && (
            <div 
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-neon-green/30 shadow-lg shadow-neon-green/20 cursor-pointer hover:border-neon-green/60 transition-all hover:scale-105"
              onClick={() => !isAd && currentSong && navigate(`/song/${currentSong.id}`)}
            >
              <img 
                src={displayCover}
                alt={displayTitle}
                className="w-full h-full object-cover"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-t from-neon-green/30 to-transparent animate-pulse" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-mono text-sm font-semibold text-foreground truncate flex items-center gap-2">
              <span className="truncate">{displayTitle}</span>
              {!isAd && currentSong?.ticker && (
                <span className="text-neon-green text-xs flex-shrink-0">${currentSong.ticker}</span>
              )}
            </div>
            <div 
              className="font-mono text-xs text-muted-foreground hover:text-neon-green cursor-pointer truncate transition-colors"
              onClick={() => !isAd && currentSong && navigate(`/artist/${currentSong.wallet_address}`)}
            >
              {displayArtist}
              {!isAd && artistTicker && <span className="text-neon-green ml-1">${artistTicker}</span>}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
          {/* Main control buttons */}
          <div className="flex items-center gap-3">
            {onShuffle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onShuffle}
                className={`h-8 w-8 transition-colors ${shuffleEnabled ? 'text-neon-green' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            )}
            
            {onPrevious && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
            )}
            
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

            {onNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="h-9 w-9 text-muted-foreground hover:text-foreground transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            )}

            {onRepeat && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRepeat}
                className={`h-8 w-8 transition-colors ${repeatMode !== 'off' ? 'text-neon-green' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2 w-full">
            <span className="font-mono text-xs text-muted-foreground min-w-[40px] text-right">
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
        src={audioSource}
        preload="metadata"
      />
    </Card>
  );
};

export default AudioPlayer;