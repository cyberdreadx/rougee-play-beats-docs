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
import { AiBadge } from "@/components/AiBadge";
import { useReadContract } from "wagmi";
import { Address } from "viem";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useSongPrice } from "@/hooks/useSongBondingCurve";

const SONG_TOKEN_ABI = [
  {
    inputs: [],
    name: 'bondingCurveSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Mini component to display sparkline for a song card with price
const SongCardSparkline = ({ tokenAddress }: { tokenAddress: string }) => {
  const { prices } = useTokenPrices();
  
  // Get current price from smart contract (same as Trending page)
  const { price: priceInXRGEString } = useSongPrice(tokenAddress as Address);
  const priceInXRGE = priceInXRGEString ? parseFloat(priceInXRGEString) : 0;
  
  const { data: bondingSupply } = useReadContract({
    address: tokenAddress as Address,
    abi: SONG_TOKEN_ABI,
    functionName: 'bondingCurveSupply',
    query: { 
      enabled: !!tokenAddress,
      staleTime: 30000 // Cache for 30 seconds
    }
  });

  const bondingSupplyStr = bondingSupply ? bondingSupply.toString() : undefined;
  const priceUSD = priceInXRGE * (prices.xrge || 0);

  return (
    <div className="space-y-0.5">
      {/* Price */}
      {priceUSD > 0 && (
        <div className="text-[10px] md:text-xs font-mono text-neon-green">
          ${priceUSD < 0.000001 ? priceUSD.toFixed(10) : priceUSD < 0.01 ? priceUSD.toFixed(8) : priceUSD.toFixed(6)}
        </div>
      )}
    </div>
  );
};

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
  ai_usage?: 'none' | 'partial' | 'full' | null;
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
const [displayLimit, setDisplayLimit] = useState<number>(10);

  useEffect(() => {
    fetchSongs();
    checkAdminStatus();
  }, [displayLimit]);

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
      .select('id, title, artist, wallet_address, audio_cid, cover_cid, play_count, ticker, genre, created_at, ai_usage, token_address')
      .order('play_count', { ascending: false })
      .limit(displayLimit);

    if (error) throw error;
    setSongs(data || []);

    // Fetch verified status for artists in the list
    if (data && data.length > 0) {
      const wallets = Array.from(new Set(data.map((s) => s.wallet_address)));
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('wallet_address, verified')
        .in('wallet_address', wallets);
      if (!profilesError && profiles) {
        const map: Record<string, boolean> = {};
        profiles.forEach((p: any) => {
          if (p.wallet_address) {
            // Store by lowercase key for case-insensitive lookup
            map[p.wallet_address.toLowerCase()] = !!p.verified;
          }
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
      <div className="glass-card p-3 md:p-4 space-y-2 mx-0 md:mx-4">
        {/* Display Limit Filter */}
        <div className="flex items-center justify-center gap-2 mb-3 pb-3 border-b border-white/10">
          <span className="text-xs text-muted-foreground font-mono">SHOW:</span>
          <button
            onClick={() => setDisplayLimit(10)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              displayLimit === 10
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                : 'bg-background/50 text-muted-foreground border border-border hover:border-neon-green/30'
            }`}
          >
            TOP 10
          </button>
          <button
            onClick={() => setDisplayLimit(20)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              displayLimit === 20
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                : 'bg-background/50 text-muted-foreground border border-border hover:border-neon-green/30'
            }`}
          >
            TOP 20
          </button>
          <button
            onClick={() => setDisplayLimit(50)}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
              displayLimit === 50
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                : 'bg-background/50 text-muted-foreground border border-border hover:border-neon-green/30'
            }`}
          >
            TOP 50
          </button>
        </div>
        
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
              className="flex items-center justify-between p-2 md:p-4 bg-black/10 backdrop-blur-xl border border-white/10 rounded-xl cursor-pointer shadow-lg hover:bg-white/10 hover:border-white hover:border-2 hover:scale-[1.02] hover:shadow-[0_25px_50px_-12px_rgba(0,255,0,0.25)] group gap-1.5 md:gap-3 active:scale-95 transition-all duration-300"
            >
              <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                <span className="text-neon-green font-mono font-bold text-xs md:text-lg w-5 md:w-8 flex-shrink-0 group-hover:scale-110 group-hover:drop-shadow-lg group-hover:drop-shadow-neon-green/50 transition-all duration-300">
                  #{index + 1}
                </span>
                {song.cover_cid && (
                <div 
                    className="relative w-10 h-10 md:w-14 md:h-14 rounded-lg overflow-hidden border border-neon-green/30 shadow-md flex-shrink-0 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,255,0,0.3)] transition-all duration-300 group/cover"
                  >
                    <img 
                      src={getIPFSGatewayUrl(song.cover_cid)}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover/cover:brightness-110 transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300" />
                    {/* Play button overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-300">
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
                  <div className="font-mono text-[11px] md:text-base text-foreground font-semibold flex items-center gap-1 md:gap-2 flex-wrap group-hover:text-neon-green transition-colors duration-300 group-hover:!text-neon-green">
                    <span className="break-words max-w-full">{song.title}</span>
                    {song.ticker && (
                      <span className="text-neon-green text-[10px] md:text-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-300 group-hover:!scale-110">${song.ticker}</span>
                    )}
                    <AiBadge aiUsage={song.ai_usage} size="sm" />
                  </div>
                  {song.artist && (
                    <Link
                      to={`/artist/${song.wallet_address}`}
                      className="font-mono text-[10px] md:text-sm text-muted-foreground hover:text-neon-green transition-colors flex items-center gap-1 group-hover:translate-x-1 transition-transform duration-300 group-hover:!translate-x-1 max-w-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="break-words">{song.artist}</span>
                      {verifiedMap[song.wallet_address.toLowerCase()] && (
                        <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3 text-neon-green group-hover:scale-110 transition-transform duration-300 group-hover:!scale-110 flex-shrink-0" aria-label="Verified artist" />
                      )}
                    </Link>
                  )}
                  <div className="font-mono text-[10px] md:text-xs text-muted-foreground group-hover:text-white/80 transition-colors duration-300 group-hover:!text-white/80">
                    {song.play_count} plays
                  </div>
                  {/* Price & Sparkline Chart */}
                  {song.token_address ? (
                    <div className="mt-1 md:mt-2">
                      <SongCardSparkline tokenAddress={song.token_address} />
                    </div>
                  ) : (
                    <div className="mt-1 text-[10px] md:text-xs text-muted-foreground/60 font-mono">
                      Not deployed
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
                {/* Mobile: Show like button */}
                <div className="md:hidden scale-90">
                  <LikeButton songId={song.id} size="sm" showCount={false} />
                </div>
                {/* Desktop: Show like and report buttons */}
                <div className="hidden md:flex items-center gap-2">
                  <LikeButton songId={song.id} size="sm" showCount={true} />
                  <ReportButton songId={song.id} />
                </div>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('TopSongs play button clicked for song:', song.title);
                    handlePlayClick(song);
                  }}
                  className={`h-8 w-8 md:h-12 md:w-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-neon-green/30 hover:border-neon-green/50 hover:shadow-2xl hover:shadow-neon-green/30 transition-all hover:scale-110 group-hover:scale-110 shadow-lg ${isCurrentSong(song) && isPlaying ? 'animate-pulse shadow-neon-green/50' : 'shadow-white/10'}`}
                >
                  {isCurrentSong(song) && isPlaying ? (
                    <Pause className="w-3 h-3 md:w-5 md:h-5 text-neon-green" />
                  ) : (
                    <Play className="w-3 h-3 md:w-5 md:h-5 text-neon-green fill-neon-green" />
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
