import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Play, Trash2, Pause, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LikeButton from "@/components/LikeButton";
import { ReportButton } from "@/components/ReportButton";

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
              className="flex items-center justify-between p-2 md:p-3 hover:bg-neon-green/5 rounded-lg cursor-pointer transition-all duration-300 border border-transparent hover:border-neon-green/20 group gap-1 md:gap-2"
            >
              <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                <span className="text-neon-green font-mono font-bold text-sm md:text-lg w-5 md:w-8 flex-shrink-0">
                  #{index + 1}
                </span>
                {song.cover_cid && (
                  <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border border-neon-green/30 shadow-md group-hover:shadow-neon-green/20 transition-shadow flex-shrink-0">
                    <img 
                      src={`https://gateway.lighthouse.storage/ipfs/${song.cover_cid}`}
                      alt={song.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs md:text-sm text-foreground font-semibold flex items-center gap-1">
                    <span className="truncate">{song.title}</span>
                    {song.ticker && (
                      <span className="text-neon-green text-[10px] md:text-xs flex-shrink-0">${song.ticker}</span>
                    )}
                  </div>
                  {song.artist && (
                    <Link
                      to={`/artist/${song.wallet_address}`}
                      className="font-mono text-[10px] md:text-sm text-muted-foreground hover:text-neon-green transition-colors truncate flex items-center gap-1"
                    >
                      <span className="truncate">{song.artist}</span>
                      {verifiedMap[song.wallet_address] && (
                        <CheckCircle className="h-3 w-3 text-neon-green" aria-label="Verified artist" />
                      )}
                    </Link>
                  )}
                  <div className="font-mono text-[10px] md:text-xs text-muted-foreground md:hidden">
                    {song.play_count} plays
                  </div>
                </div>
                <div className="hidden md:block font-mono text-xs md:text-sm text-muted-foreground whitespace-nowrap flex-shrink-0">
                  {song.play_count} plays
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                <div className="hidden md:block">
                  <LikeButton songId={song.id} size="sm" showCount={false} />
                </div>
                <div className="hidden md:block">
                  <ReportButton songId={song.id} />
                </div>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayClick(song);
                  }}
                  className={`h-9 w-9 md:h-10 md:w-10 rounded-full bg-neon-green/20 hover:bg-neon-green/30 border border-neon-green/50 transition-all hover:scale-110 ${isCurrentSong(song) && isPlaying ? 'animate-pulse shadow-lg shadow-neon-green/50' : ''}`}
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
