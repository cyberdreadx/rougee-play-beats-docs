import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getIPFSGatewayUrl, getIPFSGatewayUrls } from "@/lib/ipfs";
import { useToast } from "@/hooks/use-toast";
interface Song {
  id: string;
  title: string;
  artist: string | null;
  wallet_address: string;
  audio_cid: string;
  cover_cid: string | null;
  token_address?: string | null;
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
  const [isVerified, setIsVerified] = useState(false);
  const [currentAudioUrlIndex, setCurrentAudioUrlIndex] = useState(0);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const { toast } = useToast();

  // Fetch artist ticker and verified status
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!currentSong?.wallet_address) {
        setArtistTicker(null);
        setIsVerified(false);
        return;
      }

      const { data } = await supabase
        .from("public_profiles")
        .select("artist_ticker, verified")
        .eq("wallet_address", currentSong.wallet_address)
        .maybeSingle();

      setArtistTicker(data?.artist_ticker || null);
      setIsVerified(data?.verified || false);
    };

    fetchArtistData();
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
      setCurrentAudioUrlIndex(0); // Reset to first URL
    }
  }, [currentSong?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const title = currentAd?.title || currentSong?.title || 'Audio';
      toast({
        title: '▶️ Playing',
        description: title,
      });
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Playback error:", error);
          toast({
            title: '❌ Playback failed',
            description: error.message || 'Could not play audio',
            variant: 'destructive',
          });
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong?.id, currentSong?.title, currentAd, toast]);

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
    ? (currentAd.image_cid ? getIPFSGatewayUrl(currentAd.image_cid) : "") 
    : (currentSong?.cover_cid ? getIPFSGatewayUrl(currentSong.cover_cid) : "");
  const audioSource = isAd 
    ? getIPFSGatewayUrl(currentAd.audio_cid, undefined, true) // Use proxy first for reliability (Range/CORS)
    : (currentSong ? getIPFSGatewayUrl(currentSong.audio_cid, undefined, true) : "");

  // Get fallback URLs for robust loading (Lighthouse primary, other gateways as backup)
  const fallbackUrls = isAd 
    ? getIPFSGatewayUrls(currentAd.audio_cid, 4, true) // Proxy + gateways fallback
    : (currentSong ? getIPFSGatewayUrls(currentSong.audio_cid, 4, true) : []);

  // Debug logging
  useEffect(() => {
    if (audioSource) {
      console.log('Audio source URL:', audioSource);
      console.log('Fallback URLs:', fallbackUrls);
    }
  }, [audioSource, fallbackUrls]);

  // Handle audio loading errors with fallback
  const handleAudioError = () => {
    console.error('Audio loading failed, trying fallback URLs...');
    toast({
      title: 'Audio failed to load',
      description: currentAudioUrlIndex < fallbackUrls.length - 1
        ? `Trying fallback ${currentAudioUrlIndex + 2} of ${fallbackUrls.length}`
        : 'All gateways failed',
      variant: currentAudioUrlIndex < fallbackUrls.length - 1 ? undefined : 'destructive',
    });
    if (currentAudioUrlIndex < fallbackUrls.length - 1) {
      const nextIndex = currentAudioUrlIndex + 1;
      setCurrentAudioUrlIndex(nextIndex);
      console.log('Trying fallback URL:', fallbackUrls[nextIndex]);
      
      // Update the audio source
      const audio = audioRef.current;
      if (audio) {
        audio.src = fallbackUrls[nextIndex];
        audio.load();
        if (isPlaying) {
          const p = audio.play();
          if (p && typeof (p as any).catch === 'function') {
            (p as Promise<void>).catch(() => {
              console.warn('Play() failed after switching fallback');
            });
          }
        }
      }
    } else {
      console.error('All audio URLs failed to load');
    }
  };

  if (!currentSong && !currentAd) {
    return null;
  }

  return (
    <Card className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-green/10 via-transparent to-neon-green/10 animate-pulse opacity-60" />
      
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
          {displayCover && (
            <div 
              className="relative w-12 h-12 rounded-lg overflow-hidden border border-neon-green/30 shadow-lg flex-shrink-0 cursor-pointer hover:border-neon-green/60 transition-colors"
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
            <div className="font-mono text-base font-semibold text-foreground truncate flex items-center gap-2">
              <span className="truncate">{displayTitle}</span>
              {!isAd && currentSong?.ticker && (
                <span className="text-neon-green text-sm flex-shrink-0">${currentSong.ticker}</span>
              )}
            </div>
            <div 
              className="font-mono text-sm text-muted-foreground hover:text-neon-green cursor-pointer truncate flex items-center gap-1 transition-colors"
              onClick={() => !isAd && currentSong && navigate(`/artist/${currentSong.wallet_address}`)}
            >
              <span className="truncate">{displayArtist}</span>
              {!isAd && isVerified && (
                <CheckCircle className="h-3 w-3 text-neon-green flex-shrink-0" aria-label="Verified artist" />
              )}
              {!isAd && artistTicker && <span className="text-neon-green flex-shrink-0">${artistTicker}</span>}
            </div>
            {/* Additional info line for mobile */}
            {!isAd && currentSong && (
              <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <span>{currentSong.play_count} plays</span>
                <span>•</span>
                <span>{new Date(currentSong.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {onShuffle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onShuffle}
                className={`h-8 w-8 ${shuffleEnabled ? 'text-neon-green' : 'text-muted-foreground'}`}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            )}
            {onPrevious && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrevious}
                className="h-9 w-9 text-muted-foreground"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onPlayPause}
              className="h-12 w-12 rounded-full bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/50 transition-all hover:scale-110"
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="h-7 w-7"
              title="Debug Info"
            >
              🔧
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
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              className="flex-1"
              onValueChange={handleVolumeChange}
            />
            <span className="font-mono text-xs text-muted-foreground min-w-[30px]">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>
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
              className="font-mono text-xs text-muted-foreground hover:text-neon-green cursor-pointer truncate transition-colors flex items-center gap-1"
              onClick={() => !isAd && currentSong && navigate(`/artist/${currentSong.wallet_address}`)}
            >
              <span className="truncate">{displayArtist}</span>
              {!isAd && isVerified && (
                <CheckCircle className="h-3 w-3 text-neon-green flex-shrink-0" aria-label="Verified artist" />
              )}
              {!isAd && artistTicker && <span className="text-neon-green flex-shrink-0">${artistTicker}</span>}
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
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="text-neon-green hover:text-neon-green/80"
            title="Debug Info"
          >
            🔧
          </Button>
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

      {/* Debug Info */}
      {showDebugInfo && (
        <div className="absolute top-0 left-0 right-0 bg-black/90 text-white p-4 text-xs font-mono z-50">
          <div className="space-y-1">
            <div><strong>Current URL:</strong> {fallbackUrls[currentAudioUrlIndex] || audioSource}</div>
            <div><strong>URL Index:</strong> {currentAudioUrlIndex} / {fallbackUrls.length}</div>
            <div><strong>Fallback URLs:</strong></div>
            {fallbackUrls.map((url, index) => (
              <div key={index} className={`ml-2 ${index === currentAudioUrlIndex ? 'text-green-400' : 'text-gray-400'}`}>
                {index}: {url}
              </div>
            ))}
            <div><strong>Duration:</strong> {duration}s</div>
            <div><strong>Current Time:</strong> {currentTime}s</div>
          </div>
        </div>
      )}

      {/* Hidden Audio Element */}
      <audio
        key={(currentSong?.id || currentAd?.id) ?? 'no-media'}
        ref={audioRef}
        src={fallbackUrls[currentAudioUrlIndex] || audioSource}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        onError={handleAudioError}
        onLoadStart={() => {
          const url = fallbackUrls[currentAudioUrlIndex] || audioSource;
          console.log('Audio loading started for:', url);
          toast({ title: 'Loading audio…', description: new URL(url).host });
        }}
        onCanPlay={() => {
          const audio = audioRef.current;
          const url = fallbackUrls[currentAudioUrlIndex] || audioSource;
          console.log('Audio can play:', url);
          if (currentAudioUrlIndex > 0) {
            toast({ title: 'Loaded via fallback', description: new URL(url).host });
          }
          if (isPlaying && audio && audio.paused) {
            const p = audio.play();
            if (p && typeof (p as any).catch === 'function') {
              (p as Promise<void>).catch((err) => {
                console.warn('Autoplay retry failed:', err);
              });
            }
          }
        }}
      />
    </Card>
  );
};

export default AudioPlayer;