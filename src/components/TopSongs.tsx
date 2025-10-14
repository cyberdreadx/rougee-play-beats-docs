import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Play, Trash2, Pause, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LikeButton from "@/components/LikeButton";
import { ReportButton } from "@/components/ReportButton";
import { getIPFSGatewayUrl } from "@/lib/ipfs";

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
  genre?: string | null;
}

interface TopSongsProps {
  onPlaySong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayCountUpdate?: () => void;
}

export interface TopSongsRef {
  refreshSongs: () => void;
}

const TopSongs = forwardRef<TopSongsRef, TopSongsProps>(({ onPlaySong, currentSong, isPlaying, onPlayCountUpdate }, ref) => {
  const { toast } = useToast();
  const navigate = useNavigate();
const { address } = useWallet();
const [songs, setSongs] = useState<Song[]>([]);
const [loading, setLoading] = useState(true);
const [isAdmin, setIsAdmin] = useState(false);
const [verifiedMap, setVerifiedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchSongs();
    checkAdminStatus();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshSongs: fetchSongs,
  }));

  const checkAdminStatus = async () => {
    try {
      if (address) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('wallet_address', address)
          .eq('role', 'admin')
          .maybeSingle();
        
        setIsAdmin(!!data);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

const fetchSongs = async () => {
  try {
    const { data, error } = await supabase
      .from('songs')
      .select('id, title, artist, wallet_address, audio_cid, cover_cid, play_count, ticker, genre, created_at')
      .order('play_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    setSongs(data || []);

    // Fetch verified status for artists in the list
    if (data && data.length > 0) {
      const wallets = Array.from(new Set(data.map((s) => s.wallet_address)));
      const { data: profiles, error: profilesError } = await supabase
        .from('public_profiles')
        .select('wallet_address, verified')
        .in('wallet_address', wallets);
      if (!profilesError && profiles) {
        const map: Record<string, boolean> = {};
        profiles.forEach((p: any) => {
          if (p.wallet_address) map[p.wallet_address] = !!p.verified;
        });
        setVerifiedMap(map);
      }
    }
  } catch (error) {
    console.error('Error fetching songs:', error);
  } finally {
    setLoading(false);
  }
};

  const handlePlayClick = (song: Song) => {
    onPlaySong(song);
    // Refresh play counts immediately and after a delay to allow the database update
    onPlayCountUpdate?.();
    setTimeout(() => {
      onPlayCountUpdate?.();
    }, 1500);
  };

  const isCurrentSong = (song: Song) => currentSong?.id === song.id;

  const deleteSong = async (songId: string, songTitle: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;

      // Remove from local state
      setSongs(songs.filter(song => song.id !== songId));
      
      toast({
        title: "Song deleted",
        description: `"${songTitle}" has been removed`,
      });
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        title: "Error",
        description: "Failed to delete song",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="w-full overflow-x-hidden">
      <div className="glass-card p-3 md:p-4 space-y-2 mx-4">
        {loading ? (
          <div className="text-muted-foreground font-mono">Loading songs...</div>
        ) : songs.length === 0 ? (
          <div className="flex items-center justify-between p-2">
            <span className="font-mono text-muted-foreground">
              No songs uploaded yet. Be the first to launch!
            </span>
          </div>
        ) : (
          songs.map((song, index) => (
            <div 
              key={song.id} 
              onClick={() => navigate(`/song/${song.id}`)}
              className="flex items-center justify-between p-3 md:p-4 bg-black/10 backdrop-blur-xl border border-white/10 rounded-xl cursor-pointer shadow-lg group gap-2 md:gap-3 active:scale-95"
              style={{ 
                transition: 'all 0.3s ease',
                ':hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'white',
                  borderWidth: '2px',
                  transform: 'scale(1.02)',
                  boxShadow: '0 25px 50px -12px rgba(0, 255, 0, 0.25)'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'white';
                e.currentTarget.style.borderWidth = '2px';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 255, 0, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderWidth = '1px';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              }}
              onTouchStart={(e) => {
                // Touch feedback for mobile
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.borderColor = 'white';
                e.currentTarget.style.borderWidth = '2px';
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 255, 0, 0.25)';
              }}
              onTouchEnd={(e) => {
                // Keep the effect for a moment on mobile
                setTimeout(() => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderWidth = '1px';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }, 150);
              }}
            >
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                <span className="text-neon-green font-mono font-bold text-base md:text-lg w-6 md:w-8 flex-shrink-0 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:drop-shadow-neon-green/50 transition-all duration-300">
                  #{index + 1}
                </span>
                {song.cover_cid && (
                  <div 
                    className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border border-neon-green/30 shadow-md flex-shrink-0"
                    onMouseEnter={(e) => {
                      const img = e.currentTarget.querySelector('img');
                      const overlay = e.currentTarget.querySelector('.play-overlay');
                      const gradient = e.currentTarget.querySelector('.gradient-overlay');
                      if (img) img.style.filter = 'brightness(1.1)';
                      if (overlay) overlay.style.opacity = '1';
                      if (gradient) gradient.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      const img = e.currentTarget.querySelector('img');
                      const overlay = e.currentTarget.querySelector('.play-overlay');
                      const gradient = e.currentTarget.querySelector('.gradient-overlay');
                      if (img) img.style.filter = 'brightness(1)';
                      if (overlay) overlay.style.opacity = '0';
                      if (gradient) gradient.style.opacity = '0';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }}
                    onTouchStart={(e) => {
                      // Touch feedback for mobile album art
                      const img = e.currentTarget.querySelector('img');
                      const overlay = e.currentTarget.querySelector('.play-overlay');
                      const gradient = e.currentTarget.querySelector('.gradient-overlay');
                      if (img) img.style.filter = 'brightness(1.1)';
                      if (overlay) overlay.style.opacity = '1';
                      if (gradient) gradient.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.3)';
                    }}
                    onTouchEnd={(e) => {
                      // Keep the effect for a moment on mobile
                      setTimeout(() => {
                        const img = e.currentTarget.querySelector('img');
                        const overlay = e.currentTarget.querySelector('.play-overlay');
                        const gradient = e.currentTarget.querySelector('.gradient-overlay');
                        if (img) img.style.filter = 'brightness(1)';
                        if (overlay) overlay.style.opacity = '0';
                        if (gradient) gradient.style.opacity = '0';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                      }, 200);
                    }}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    <img 
                      src={getIPFSGatewayUrl(song.cover_cid)}
                      alt={song.title}
                      className="w-full h-full object-cover"
                      style={{ transition: 'filter 0.3s ease' }}
                    />
                    <div className="gradient-overlay absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0" style={{ transition: 'opacity 0.3s ease' }} />
                    {/* Play button overlay on hover */}
                    <div className="play-overlay absolute inset-0 flex items-center justify-center opacity-0" style={{ transition: 'opacity 0.3s ease' }}>
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                        {isCurrentSong(song) && isPlaying ? (
                          <Pause className="w-4 h-4 md:w-5 md:h-5 text-black" />
                        ) : (
                          <Play className="w-4 h-4 md:w-5 md:h-5 text-black fill-black" />
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-sm md:text-base text-foreground font-semibold flex items-center gap-2 group-hover:text-neon-green transition-colors duration-300 group-hover:!text-neon-green">
                    <span className="truncate">{song.title}</span>
                    {song.ticker && (
                      <span className="text-neon-green text-xs md:text-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 group-hover:!scale-110">${song.ticker}</span>
                    )}
                  </div>
                  {song.artist && (
                    <Link
                      to={`/artist/${song.wallet_address}`}
                      className="font-mono text-xs md:text-sm text-muted-foreground hover:text-neon-green transition-colors truncate flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300 group-hover:!translate-x-1"
                    >
                      <span className="truncate">{song.artist}</span>
                      {verifiedMap[song.wallet_address] && (
                        <CheckCircle className="h-3 w-3 text-neon-green group-hover:scale-110 transition-transform duration-300 group-hover:!scale-110" aria-label="Verified artist" />
                      )}
                    </Link>
                  )}
                  <div className="font-mono text-xs text-muted-foreground group-hover:text-white/80 transition-colors duration-300 group-hover:!text-white/80">
                    {song.play_count} plays
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                {/* Mobile: Show like button */}
                <div className="md:hidden">
                  <LikeButton songId={song.id} size="sm" showCount={false} />
                </div>
                {/* Desktop: Show like and report buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <LikeButton songId={song.id} size="sm" showCount={false} />
                  <ReportButton songId={song.id} />
                </div>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayClick(song);
                  }}
                  className={`h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-neon-green/30 hover:border-neon-green/50 hover:shadow-2xl hover:shadow-neon-green/30 transition-all hover:scale-110 group-hover:scale-110 shadow-lg ${isCurrentSong(song) && isPlaying ? 'animate-pulse shadow-neon-green/50' : 'shadow-white/10'}`}
                >
                  {isCurrentSong(song) && isPlaying ? (
                    <Pause className="w-4 h-4 md:w-5 md:h-5 text-neon-green" />
                  ) : (
                    <Play className="w-4 h-4 md:w-5 md:h-5 text-neon-green fill-neon-green" />
                  )}
                </Button>
                {isAdmin && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSong(song.id, song.title);
                    }}
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
});

TopSongs.displayName = "TopSongs";

export default TopSongs;
