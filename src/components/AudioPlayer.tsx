import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, CheckCircle, Music, X, ChevronRight, ChevronLeft } from "lucide-react";
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
  onClose?: () => void;
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
  onClose,
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
  const [coverImageError, setCoverImageError] = useState(false);
  const [coverImageLoaded, setCoverImageLoaded] = useState(false);
  const [currentCoverUrlIndex, setCurrentCoverUrlIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();

  // Reset cover image state when song changes
  useEffect(() => {
    setCoverImageError(false);
    setCoverImageLoaded(false);
    setCurrentCoverUrlIndex(0);
  }, [currentSong?.id, currentAd?.id]);

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

  // Computed values (must come before handlers that use them)
  const isAd = !!currentAd;
  const displayTitle = isAd ? currentAd?.title || "" : currentSong?.title || "";
  const displayArtist = isAd ? "Advertisement" : currentSong?.artist || "Unknown Artist";
  const coverCid = isAd ? currentAd?.image_cid : currentSong?.cover_cid;
  const displayCover = coverCid ? (() => {
    try {
      return getIPFSGatewayUrl(coverCid);
    } catch (error) {
      console.warn('Failed to get IPFS gateway URL:', error);
      return "";
    }
  })() : "";

  // Get multiple fallback URLs for the cover image
  const coverFallbackUrls = coverCid ? (() => {
    try {
      return getIPFSGatewayUrls(coverCid, 3, false);
    } catch (error) {
      console.warn('Failed to get IPFS gateway URLs:', error);
      return [];
    }
  })() : [];

  // Get current cover URL to try - use a more defensive approach
  const currentCoverUrl = (() => {
    try {
      return coverFallbackUrls[currentCoverUrlIndex] || displayCover;
    } catch (error) {
      console.warn('Failed to get current cover URL:', error);
      return displayCover;
    }
  })();

  // Handle cover image load success
  const handleCoverImageLoad = () => {
    setCoverImageLoaded(true);
    setCoverImageError(false);
  };

  // Handle cover image load error - try next fallback URL
  const handleCoverImageError = () => {
    console.warn('Cover image failed to load, trying fallback...');
    setCoverImageError(true);

    // Try next fallback URL if available
    try {
      if (coverFallbackUrls && coverFallbackUrls.length > 0 && currentCoverUrlIndex < coverFallbackUrls.length - 1) {
        setCurrentCoverUrlIndex(prev => prev + 1);
        setCoverImageError(false); // Reset error state to try next URL
      }
    } catch (error) {
      console.warn('Failed to check fallback URLs:', error);
    }
  };

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
  
  // Ensure play/pause runs in a direct user gesture (iOS Safari requirement)
  const handlePlayPauseClick = () => {
    const audio = audioRef.current;
    if (!audio) {
      onPlayPause();
      return;
    }
    if (isPlaying) {
      try { audio.pause(); } catch {}
      onPlayPause();
    } else {
      const p = audio.play();
      if (p && typeof (p as any).catch === 'function') {
        (p as Promise<void>).catch((error) => {
          console.error('Playback error (direct):', error);
          toast({ title: '❌ Playback failed', description: error.message || 'Could not play audio', variant: 'destructive' });
        });
      }
      onPlayPause();
    }
  };
  
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const preferredGateway = 'https://gateway.lighthouse.storage/ipfs';
  const audioSource = isAd 
    ? getIPFSGatewayUrl(currentAd.audio_cid, preferredGateway, false) // Prefer direct Lighthouse
    : (currentSong ? getIPFSGatewayUrl(currentSong.audio_cid, preferredGateway, false) : "");

  // Build fallback URLs: other public gateways, then proxy last
  const baseFallbacks = isAd 
    ? getIPFSGatewayUrls(currentAd.audio_cid, 4, false) // Direct IPFS gateways
    : (currentSong ? getIPFSGatewayUrls(currentSong.audio_cid, 4, false) : []);
  const proxyUrl = isAd 
    ? getIPFSGatewayUrl(currentAd.audio_cid, undefined, true)
    : (currentSong ? getIPFSGatewayUrl(currentSong.audio_cid, undefined, true) : '');
  const fallbackUrls = proxyUrl ? [...baseFallbacks, proxyUrl] : baseFallbacks;

  // Handle audio loading errors with fallback
  const handleAudioError = () => {
    if (currentAudioUrlIndex < fallbackUrls.length - 1) {
      const nextIndex = currentAudioUrlIndex + 1;
      console.log(`🔄 Audio failed, trying fallback ${nextIndex + 1}/${fallbackUrls.length}...`);
      setCurrentAudioUrlIndex(nextIndex);
      
      // Update the audio source
      const audio = audioRef.current;
      if (audio) {
        try { audio.pause(); } catch {}
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
      // All fallbacks exhausted
      console.error('❌ All audio gateways failed for:', displayTitle);
      toast({
        title: "Audio Loading Failed",
        description: "Unable to load audio from any gateway. Please check your connection.",
        variant: "destructive",
      });
    }
  };

  if (!currentSong && !currentAd) {
    return null;
  }

  return (
    <>
      {/* Minimized tab view */}
      {isMinimized && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
          <div className="relative">
            <Button
              onClick={() => setIsMinimized(false)}
              className="h-32 w-12 rounded-l-xl rounded-r-none bg-black/40 backdrop-blur-xl border border-white/10 border-r-0 hover:bg-black/60 hover:w-14 transition-all duration-300 flex flex-col items-center justify-center gap-2 shadow-2xl group"
            >
              <ChevronLeft className="h-5 w-5 text-neon-green group-hover:animate-pulse" />
              <div 
                className="flex flex-col items-center gap-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPauseClick();
                }}
              >
                <div className="w-8 h-8 rounded-full border-2 border-neon-green/50 flex items-center justify-center bg-neon-green/10">
                  {isPlaying ? (
                    <Pause className="h-4 w-4 text-neon-green" />
                  ) : (
                    <Play className="h-4 w-4 text-neon-green fill-neon-green" />
                  )}
                </div>
                {isPlaying && (
                  <div className="flex gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-neon-green rounded-full visualizer-bar"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          height: '12px'
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="writing-mode-vertical text-xs font-mono text-muted-foreground max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap" style={{ writingMode: 'vertical-rl' }}>
                {displayTitle.slice(0, 20)}
              </div>
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="absolute -top-8 right-0 h-6 w-6 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-black/60 text-muted-foreground hover:text-foreground"
                title="Close player"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Full player view */}
      {!isMinimized && (
    <Card className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-0 left-0 right-0 z-40 bg-black/20 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden transition-all duration-300">

      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-green/10 via-transparent to-neon-green/10 animate-pulse opacity-60" />

      {/* Top marquee header - scrolls across entire player width */}
      <div className="relative z-10 border-b border-white/10 px-3 py-1">
        <div className="marquee-container">
          <div className="marquee font-mono text-xs md:text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">{displayTitle}</span>
            <span className="mx-2">—</span>
            <span>{displayArtist}</span>
            {!isAd && currentSong?.ticker && (
              <span className="ml-2 text-neon-green">${currentSong.ticker}</span>
            )}
          </div>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            className="h-6 w-6 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
            title="Minimize player"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full hover:bg-white/10 text-muted-foreground hover:text-foreground"
              title="Close player"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
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
          {coverCid && (
            <div
              className="relative w-16 h-16 rounded-lg overflow-hidden border border-neon-green/30 shadow-lg flex-shrink-0 cursor-pointer hover:border-neon-green/60 transition-colors"
              onClick={() => !isAd && currentSong && navigate(`/song/${currentSong.id}`)}
            >
              {coverImageError && (() => {
                try {
                  return currentCoverUrlIndex >= (coverFallbackUrls?.length || 0) - 1;
                } catch (error) {
                  console.warn('Failed to check cover fallback URLs in JSX:', error);
                  return true; // Show fallback icon if there's an error
                }
              })() ? (
                // Fallback: Show music icon when all URLs fail
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <Music className="h-8 w-8 text-neon-green" />
                </div>
              ) : (
                // Try to load image with fallback URLs
                <>
                  <img
                    src={currentCoverUrl}
                    alt={displayTitle}
                    className="w-full h-full object-cover"
                    onLoad={handleCoverImageLoad}
                    onError={handleCoverImageError}
                    style={{
                      display: coverImageLoaded ? 'block' : 'none'
                    }}
                  />
                  {/* Loading placeholder while image loads */}
                  {!coverImageLoaded && !coverImageError && (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <Music className="h-6 w-6 text-neon-green animate-pulse" />
                    </div>
                  )}
                </>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-neon-green/20 animate-pulse" />
              )}
            </div>
          )}
          <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
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
               onClick={handlePlayPauseClick}
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
            {currentSong && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/song/${currentSong.id}`)}
                className="h-8 px-3 font-mono text-xs"
              >
                Trade
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
        {/* Left info area with cover art */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {displayCover && (
            <div 
              className="relative w-20 h-20 rounded-lg overflow-hidden border border-neon-green/30 shadow-lg shadow-neon-green/20 cursor-pointer hover:border-neon-green/60 transition-all hover:scale-105"
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
        </div>

        {/* Controls + Trade button (center column) */}
        <div className="flex flex-col items-center gap-2 flex-[2] max-w-3xl mx-auto">
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
              onClick={handlePlayPauseClick}
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
            {currentSong && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/song/${currentSong.id}`)}
                className="h-8 px-3 font-mono text-xs ml-2"
              >
                Trade
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
        <div className="flex items-center gap-2 justify-end flex-1">
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
    </Card>
      )}

      {/* Hidden Audio Element - Always present to maintain playback state */}
      <audio
        key={(currentSong?.id || currentAd?.id) ?? 'no-media'}
        ref={audioRef}
        src={fallbackUrls[currentAudioUrlIndex] || audioSource}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        controlsList="nodownload"
        
        onError={handleAudioError}
        onCanPlay={() => {
          const audio = audioRef.current;
          if (isPlaying && audio && audio.paused) {
            audio.play().catch(() => {});
          }
        }}
      />
    </>
  );
};

export default AudioPlayer;