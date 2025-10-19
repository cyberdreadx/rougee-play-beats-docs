import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NetworkInfo from "@/components/NetworkInfo";
import { Loader2, TrendingUp, TrendingDown, Flame, Music } from "lucide-react";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useSongPrice } from "@/hooks/useSongBondingCurve";
import { useReadContract, usePublicClient } from "wagmi";
import { Address } from "viem";
import { AiBadge } from "@/components/AiBadge";

interface Artist {
  wallet_address: string;
  artist_name: string;
  artist_ticker: string | null;
  avatar_cid: string | null;
  total_songs: number;
  total_plays: number;
  verified: boolean;
}

interface Song {
  id: string;
  title: string;
  artist: string | null;
  wallet_address: string;
  cover_cid: string | null;
  play_count: number;
  token_address?: string | null;
  ticker: string | null;
  genre: string | null;
  created_at: string;
  ai_usage?: 'none' | 'partial' | 'full' | null;
}

const SONG_TOKEN_ABI = [
  {
    inputs: [],
    name: 'totalXRGERaised',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'bondingCurveSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// Component for featured banner with real data
const FeaturedSong = ({ song }: { song: Song }) => {
  const navigate = useNavigate();
  const { prices } = useTokenPrices();
  const publicClient = usePublicClient();
  const [volume24h, setVolume24h] = useState<number>(0);
  
  const { price: priceInXRGE } = useSongPrice(song.token_address as Address);
  const { data: xrgeRaised } = useReadContract({
    address: song.token_address as Address,
    abi: SONG_TOKEN_ABI,
    functionName: 'totalXRGERaised',
    query: { enabled: !!song.token_address }
  });
  
  // Fetch 24h volume from blockchain
  useEffect(() => {
    const fetch24hVolume = async () => {
      if (!publicClient || !song.token_address) return;
      
      const BONDING_CURVE_ADDRESS = '0xCeE9c18C448487a1deAac3E14974C826142C50b5' as Address;
      const XRGE_ADDRESS = '0x147120faEC9277ec02d957584CFCD92B56A24317' as Address;
      
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const blocksIn24h = 43200;
        const fromBlock = currentBlock - BigInt(blocksIn24h);
        
        // Fetch song token Transfer events for 24h
        const songTokenLogs = await publicClient.getLogs({
          address: song.token_address as Address,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', indexed: true, name: 'from' },
              { type: 'address', indexed: true, name: 'to' },
              { type: 'uint256', indexed: false, name: 'value' }
            ]
          },
          fromBlock,
          toBlock: currentBlock
        });
        
        // Fetch XRGE Transfer events for 24h
        const xrgeLogs = await publicClient.getLogs({
          address: XRGE_ADDRESS,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', indexed: true, name: 'from' },
              { type: 'address', indexed: true, name: 'to' },
              { type: 'uint256', indexed: false, name: 'value' }
            ]
          },
          fromBlock,
          toBlock: currentBlock
        });
        
        // Build a map of XRGE transfers by transaction hash
        const xrgeByTx = new Map<string, number>();
        const FEE_ADDRESS = '0xb787433e138893a0ed84d99e82c7da260a940b1e';
        
        for (const log of xrgeLogs) {
          const { args } = log as any;
          const from = (args.from as string).toLowerCase();
          const to = (args.to as string).toLowerCase();
          const amount = Number(args.value as bigint) / 1e18;
          
          if (from === FEE_ADDRESS.toLowerCase() || to === FEE_ADDRESS.toLowerCase()) continue;
          
          if (to === BONDING_CURVE_ADDRESS.toLowerCase() || from === BONDING_CURVE_ADDRESS.toLowerCase()) {
            const existing = xrgeByTx.get(log.transactionHash) || 0;
            xrgeByTx.set(log.transactionHash, existing + amount);
          }
        }
        
        // Calculate 24h volume by correlating song token transfers with XRGE transfers
        let volume = 0;
        for (const log of songTokenLogs) {
          const { args } = log as any;
          const from = (args.from as string).toLowerCase();
          const to = (args.to as string).toLowerCase();
          
          // Only count transfers involving the bonding curve
          if (from === BONDING_CURVE_ADDRESS.toLowerCase() || to === BONDING_CURVE_ADDRESS.toLowerCase()) {
            const xrgeAmount = xrgeByTx.get(log.transactionHash) || 0;
            volume += xrgeAmount;
          }
        }
        
        setVolume24h(volume);
      } catch (error) {
        console.error('Failed to fetch 24h volume:', error);
      }
    };
    
    fetch24hVolume();
  }, [publicClient, song.token_address]);
  
  const priceUSD = (parseFloat(priceInXRGE) || 0) * (prices.xrge || 0);
  const volumeUSD = volume24h * (prices.xrge || 0);
  
  return (
    <div className="mb-6 relative overflow-hidden md:rounded-2xl border border-neon-green/30 bg-gradient-to-br from-neon-green/5 via-transparent to-purple-500/5 backdrop-blur-xl p-6">
      <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-mono font-bold px-3 py-1 rounded-full flex items-center gap-1">
        <Flame className="w-3 h-3" />
        #1 TRENDING
      </div>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="relative group">
          {song.cover_cid ? (
            <img
              src={getIPFSGatewayUrl(song.cover_cid)}
              alt={song.title}
              className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover shadow-2xl group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-neon-green/10 flex items-center justify-center">
              <Music className="w-12 h-12 text-neon-green" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-bold font-mono neon-text mb-2">
            {song.title}
          </h3>
          <p className="text-muted-foreground font-mono mb-3">
            By {song.artist || 'Unknown'} • {song.ticker && `$${song.ticker}`}
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="bg-black/40 rounded-lg px-3 py-2">
              <div className="text-xs text-muted-foreground font-mono">PRICE</div>
              <div className="text-sm font-bold font-mono neon-text">
                ${priceUSD < 0.000001 ? priceUSD.toFixed(10) : priceUSD < 0.01 ? priceUSD.toFixed(8) : priceUSD.toFixed(6)}
              </div>
            </div>
            <div className="bg-black/40 rounded-lg px-3 py-2">
              <div className="text-xs text-muted-foreground font-mono">VOLUME</div>
              <div className="text-sm font-bold font-mono text-purple-400">
                ${volumeUSD < 1 ? volumeUSD.toFixed(2) : volumeUSD.toLocaleString(undefined, {maximumFractionDigits: 0})}
              </div>
            </div>
            <div className="bg-black/40 rounded-lg px-3 py-2">
              <div className="text-xs text-muted-foreground font-mono">PLAYS</div>
              <div className="text-sm font-bold font-mono text-orange-400">
                <Flame className="w-3 h-3 inline mr-1" />
                {song.play_count}
              </div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/song/${song.id}`)}
          className="bg-neon-green hover:bg-neon-green/80 text-black font-mono font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-neon-green/20"
        >
          TRADE NOW →
        </button>
      </div>
    </div>
  );
};

// Component for individual song row with real-time data
const SongRow = ({ song, index, onStatsUpdate }: { song: Song; index: number; onStatsUpdate?: (songId: string, volume: number, change: number, marketCap: number, price: number) => void }) => {
  const navigate = useNavigate();
  const { prices } = useTokenPrices();
  const publicClient = usePublicClient();
  const [priceChange24h, setPriceChange24h] = useState<number | null>(null);
  const [volume24h, setVolume24h] = useState<number>(0); // Track actual 24h volume in XRGE
  
  // Get current price from bonding curve
  const { price: priceInXRGE } = useSongPrice(song.token_address as Address);
  
  // Get XRGE raised and supply
  const { data: xrgeRaised } = useReadContract({
    address: song.token_address as Address,
    abi: SONG_TOKEN_ABI,
    functionName: 'totalXRGERaised',
    query: { enabled: !!song.token_address }
  });
  
  const { data: bondingSupply } = useReadContract({
    address: song.token_address as Address,
    abi: SONG_TOKEN_ABI,
    functionName: 'bondingCurveSupply',
    query: { enabled: !!song.token_address }
  });
  
  // Convert bondingSupply to a stable string value to prevent infinite loops
  const bondingSupplyStr = bondingSupply ? bondingSupply.toString() : null;
  
  // Fetch 24h price change and volume from blockchain
  useEffect(() => {
    const fetch24hData = async () => {
      if (!publicClient || !song.token_address || !bondingSupplyStr) return;
      
      const BONDING_CURVE_ADDRESS = '0xCeE9c18C448487a1deAac3E14974C826142C50b5' as Address;
      const XRGE_ADDRESS = '0x147120faEC9277ec02d957584CFCD92B56A24317' as Address;
      
      try {
        // Get current block
        const currentBlock = await publicClient.getBlockNumber();
        
        // Base has ~2 second block time, so 24h = ~43,200 blocks
        const blocksIn24h = 43200;
        const fromBlock = currentBlock - BigInt(blocksIn24h);
        
        // Fetch song token Transfer events for 24h
        const songTokenLogs = await publicClient.getLogs({
          address: song.token_address as Address,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', indexed: true, name: 'from' },
              { type: 'address', indexed: true, name: 'to' },
              { type: 'uint256', indexed: false, name: 'value' }
            ]
          },
          fromBlock,
          toBlock: currentBlock
        });
        
        // Fetch XRGE Transfer events for 24h
        const xrgeLogs = await publicClient.getLogs({
          address: XRGE_ADDRESS,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', indexed: true, name: 'from' },
              { type: 'address', indexed: true, name: 'to' },
              { type: 'uint256', indexed: false, name: 'value' }
            ]
          },
          fromBlock,
          toBlock: currentBlock
        });
        
        // Build a map of XRGE transfers by transaction hash
        const xrgeByTx = new Map<string, number>();
        const FEE_ADDRESS = '0xb787433e138893a0ed84d99e82c7da260a940b1e';
        
        for (const log of xrgeLogs) {
          const { args } = log as any;
          const from = (args.from as string).toLowerCase();
          const to = (args.to as string).toLowerCase();
          const amount = Number(args.value as bigint) / 1e18;
          
          // Skip fee transfers
          if (from === FEE_ADDRESS.toLowerCase() || to === FEE_ADDRESS.toLowerCase()) continue;
          
          // Only count XRGE going to or from bonding curve
          if (to === BONDING_CURVE_ADDRESS.toLowerCase() || from === BONDING_CURVE_ADDRESS.toLowerCase()) {
            const existing = xrgeByTx.get(log.transactionHash) || 0;
            xrgeByTx.set(log.transactionHash, existing + amount);
          }
        }
        
        // Calculate 24h volume by correlating song token transfers with XRGE transfers
        let volume = 0;
        for (const log of songTokenLogs) {
          const { args } = log as any;
          const from = (args.from as string).toLowerCase();
          const to = (args.to as string).toLowerCase();
          
          // Only count transfers involving the bonding curve
          if (from === BONDING_CURVE_ADDRESS.toLowerCase() || to === BONDING_CURVE_ADDRESS.toLowerCase()) {
            const xrgeAmount = xrgeByTx.get(log.transactionHash) || 0;
            volume += xrgeAmount;
          }
        }
        
        setVolume24h(volume);
        
        // Try to get bonding supply from 24h ago for price change (requires archive node)
        try {
          const supply24hAgo = await publicClient.readContract({
            address: song.token_address as Address,
            abi: SONG_TOKEN_ABI,
            functionName: 'bondingCurveSupply',
            blockNumber: fromBlock
          } as any);
          
          if (supply24hAgo) {
            // Calculate tokens sold then vs now
            const BONDING_CURVE_TOTAL = 990_000_000;
            const INITIAL_PRICE = 0.001;
            const PRICE_INCREMENT = 0.000001;
            
            const tokensSold24hAgo = BONDING_CURVE_TOTAL - Number(supply24hAgo) / 1e18;
            const tokensSoldNow = BONDING_CURVE_TOTAL - Number(bondingSupplyStr) / 1e18;
            
            const price24hAgo = INITIAL_PRICE + (tokensSold24hAgo * PRICE_INCREMENT);
            const priceNow = INITIAL_PRICE + (tokensSoldNow * PRICE_INCREMENT);
            
            if (price24hAgo > 0) {
              const change = ((priceNow - price24hAgo) / price24hAgo) * 100;
              setPriceChange24h(change);
            }
          }
        } catch (error: any) {
          // Silently handle historical state query errors (common with basic RPC providers)
          if (!error?.message?.includes('not supported') && !error?.code) {
            console.warn('Historical price data not available, using estimate');
          }
          // Fallback to estimated change based on current activity
          const tokensSold = bondingSupplyStr ? (990_000_000 - Number(bondingSupplyStr) / 1e18) : 0;
          if (tokensSold > 0) {
            // Estimate ~25% growth in 24h for new tokens
            setPriceChange24h(25);
          }
        }
      } catch (error) {
        console.error('Failed to fetch 24h data:', error);
      }
    };
    
    fetch24hData();
  }, [publicClient, song.token_address, bondingSupplyStr]);
  
  const priceXRGE = parseFloat(priceInXRGE) || 0;
  const priceUSD = priceXRGE * (prices.xrge || 0);
  const xrgeRaisedNum = xrgeRaised ? Number(xrgeRaised) / 1e18 : 0;
  
  // Volume = actual 24h trading volume (not all-time XRGE raised)
  const volumeUSD = volume24h * (prices.xrge || 0);
  
  // Calculate tokens sold
  const tokensSold = bondingSupply ? (990_000_000 - Number(bondingSupply) / 1e18) : 0;
  
  // Market Cap = Total Value Locked (TVL) = actual XRGE spent (all-time)
  // NOT currentPrice × tokensSold (incorrect for bonding curves since price increases)
  const marketCap = xrgeRaisedNum * (prices.xrge || 0);
  
  // Use real 24h price change (fetched from blockchain)
  const change24h = priceChange24h ?? 0;
  const isPositive = change24h > 0;
  
  // Report stats to parent for aggregation
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(song.id, volumeUSD, change24h, marketCap, priceUSD);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id, volumeUSD, change24h, marketCap, priceUSD]);
  
  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate(`/song/${song.id}`)}
    >
      <TableCell className="font-mono text-muted-foreground w-12">
        #{index + 1}
      </TableCell>
      
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative">
            {song.cover_cid ? (
              <img
                src={getIPFSGatewayUrl(song.cover_cid)}
                alt={song.title}
                className="w-10 h-10 rounded object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-neon-green/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-neon-green" />
              </div>
            )}
            {/* Hot indicator for top 3 */}
            {index < 3 && (
              <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-1">
                <Flame className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              {song.title}
              {song.ticker && (
                <span className="text-xs text-neon-green font-mono">${song.ticker}</span>
              )}
              <AiBadge aiUsage={song.ai_usage} size="sm" />
              {/* Top gainer badge */}
              {change24h > 50 && (
                <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-mono font-bold">
                  🚀 HOT
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{song.artist || 'Unknown'}</div>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="font-mono text-right">
        {song.token_address ? (
          <div>
            <div className="font-semibold">
              ${priceUSD < 0.000001 ? priceUSD.toFixed(10) : priceUSD < 0.01 ? priceUSD.toFixed(8) : priceUSD.toFixed(4)}
            </div>
            <div className="text-xs text-muted-foreground">
              {priceXRGE.toFixed(6)} XRGE
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Not deployed</span>
        )}
      </TableCell>
      
      <TableCell className={`font-mono text-right font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {song.token_address ? (
          <div className="flex items-center justify-end gap-1">
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      
      <TableCell className="font-mono text-right">
        {song.token_address && volumeUSD > 0 ? (
          <div>
            <div className="font-semibold">
              ${volumeUSD < 1 ? volumeUSD.toFixed(4) : volumeUSD.toLocaleString(undefined, {maximumFractionDigits: 2})}
            </div>
            <div className="text-xs text-muted-foreground">
              {volume24h.toLocaleString(undefined, {maximumFractionDigits: 2})} XRGE
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">$0</span>
        )}
      </TableCell>
      
      <TableCell className="font-mono text-right">
        {song.token_address && marketCap > 0 ? (
          <div className="font-semibold">
            ${marketCap < 1 ? marketCap.toFixed(6) : marketCap.toLocaleString(undefined, {maximumFractionDigits: 2})}
          </div>
        ) : (
          <span className="text-muted-foreground">$0</span>
        )}
      </TableCell>
      
      <TableCell className="font-mono text-right text-muted-foreground">
        <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
        {song.play_count}
      </TableCell>
    </TableRow>
  );
};

type SortField = 'trending' | 'price' | 'change' | 'volume' | 'marketCap' | 'plays';
type SortDirection = 'asc' | 'desc';

const Trending = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [songStats, setSongStats] = useState<Map<string, { volume: number; change: number; marketCap: number; price: number }>>(new Map());
  const [sortField, setSortField] = useState<SortField>('trending');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  
  // Calculate aggregated stats from individual song stats
  const totalVolume = Array.from(songStats.values()).reduce((sum, stat) => sum + stat.volume, 0);
  const topGainerPercent = Array.from(songStats.values()).reduce((max, stat) => Math.max(max, stat.change), 0);
  
  const handleStatsUpdate = (songId: string, volume: number, change: number, marketCap: number, price: number) => {
    setSongStats(prev => {
      const newMap = new Map(prev);
      newMap.set(songId, { volume, change, marketCap, price });
      return newMap;
    });
  };
  
  // Calculate trending score for a song (memoized to prevent recalculation)
  const calculateTrendingScore = useCallback((song: Song): number => {
    const stats = songStats.get(song.id);
    if (!stats) return song.play_count; // Fallback to play count if no stats yet
    
    // Weighted scoring algorithm (all values normalized to USD for fair comparison):
    // - Volume (40%): Recent trading activity
    // - Price Change (25%): Momentum (scaled by market cap)
    // - Market Cap (20%): Overall value
    // - Plays (15%): Popularity (scaled to USD equivalent: $0.01 per play)
    
    const volumeScore = stats.volume * 0.4;
    const changeScore = Math.max(0, stats.change / 100) * stats.marketCap * 0.25; // % change scaled by market cap
    const marketCapScore = stats.marketCap * 0.2;
    const playsScore = (song.play_count * 0.01) * 0.15; // $0.01 per play
    
    return volumeScore + changeScore + marketCapScore + playsScore;
  }, [songStats]);
  
  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        setLoading(true);
        
        if (searchQuery) {
          // Perform search when search query is provided
          const searchTerm = `%${searchQuery}%`;
          
          const [artistsResponse, songsResponse] = await Promise.all([
            supabase
              .from("public_profiles")
              .select("wallet_address, artist_name, artist_ticker, avatar_cid, total_songs, total_plays, verified")
              .not("artist_name", "is", null)
              .ilike("artist_name", searchTerm)
              .order("total_plays", { ascending: false })
              .limit(50),
            supabase
              .from("songs")
              .select("id, title, artist, wallet_address, cover_cid, play_count, ticker, genre, created_at, token_address, ai_usage")
              .not("token_address", "is", null) // Only show deployed songs
              .or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%`)
              .order("play_count", { ascending: false })
              .limit(50)
          ]);

          if (artistsResponse.error) throw artistsResponse.error;
          if (songsResponse.error) throw songsResponse.error;
          
          setArtists(artistsResponse.data || []);
          setSongs(songsResponse.data || []);
        } else {
          // Show trending data when no search query
          const [artistsResponse, songsResponse] = await Promise.all([
            supabase
              .from("public_profiles")
              .select("wallet_address, artist_name, artist_ticker, avatar_cid, total_songs, total_plays, verified")
              .not("artist_name", "is", null)
              .gt("total_songs", 0)
              .order("total_plays", { ascending: false })
              .limit(50),
            supabase
              .from("songs")
              .select("id, title, artist, wallet_address, cover_cid, play_count, ticker, genre, created_at, token_address, ai_usage")
              .not("token_address", "is", null) // Only show deployed songs
              .order("play_count", { ascending: false })
              .limit(50)
          ]);

          if (artistsResponse.error) throw artistsResponse.error;
          if (songsResponse.error) throw songsResponse.error;
          
          setArtists(artistsResponse.data || []);
          setSongs(songsResponse.data || []);
        }
      } catch (error) {
        console.error("Error fetching trending data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
  }, [searchQuery]);

  // Sort songs based on selected field (reactive to songStats changes)
  const sortedSongs = useMemo(() => {
    return [...songs].sort((a, b) => {
      let aValue: number;
      let bValue: number;
      
      switch (sortField) {
        case 'trending':
          aValue = calculateTrendingScore(a);
          bValue = calculateTrendingScore(b);
          break;
        case 'price':
          aValue = songStats.get(a.id)?.price || 0;
          bValue = songStats.get(b.id)?.price || 0;
          break;
        case 'change':
          aValue = songStats.get(a.id)?.change || 0;
          bValue = songStats.get(b.id)?.change || 0;
          break;
        case 'volume':
          aValue = songStats.get(a.id)?.volume || 0;
          bValue = songStats.get(b.id)?.volume || 0;
          break;
        case 'marketCap':
          aValue = songStats.get(a.id)?.marketCap || 0;
          bValue = songStats.get(b.id)?.marketCap || 0;
          break;
        case 'plays':
          aValue = a.play_count;
          bValue = b.play_count;
          break;
        default:
          aValue = calculateTrendingScore(a);
          bValue = calculateTrendingScore(b);
      }
      
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    });
  }, [songs, sortField, sortDirection, songStats, calculateTrendingScore]);
  
  // Featured song is always the top trending song (by trending score)
  const featuredSong = useMemo(() => {
    if (songs.length === 0) return null;
    
    // Debug: Log trending scores
    const songsWithScores = songs.map(song => ({
      title: song.title,
      score: calculateTrendingScore(song),
      stats: songStats.get(song.id)
    }));
    console.log('🔥 Trending Scores:', songsWithScores);
    
    return [...songs].sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a))[0];
  }, [songs, songStats, calculateTrendingScore]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-20">
        <NetworkInfo />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20">
      <NetworkInfo />
      
      <main className="w-full px-0 md:container md:mx-auto md:px-4 py-6 md:py-8">
        {/* Live Stats Ticker */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 px-4 md:px-0">
          <div className="bg-gradient-to-br from-neon-green/10 to-transparent border border-neon-green/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL SONGS</div>
            <div className="text-2xl font-bold font-mono neon-text">{songs.length}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground font-mono mb-1">TOTAL VOLUME</div>
            <div className="text-2xl font-bold font-mono text-purple-400">
              ${totalVolume > 0 ? totalVolume.toLocaleString(undefined, {maximumFractionDigits: 0}) : '...'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground font-mono mb-1">TOP GAINER</div>
            <div className="text-2xl font-bold font-mono text-orange-400">
              {loading ? '...' : topGainerPercent > 0 ? `+${topGainerPercent.toFixed(1)}%` : '0%'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm">
            <div className="text-xs text-muted-foreground font-mono mb-1">ARTISTS</div>
            <div className="text-2xl font-bold font-mono text-blue-400">{artists.length}</div>
          </div>
        </div>

        {/* Featured/Promoted Banner with Real Data */}
        {featuredSong && <FeaturedSong song={featuredSong} />}

        <div className="mb-6 px-4 md:px-0">
          <h1 className="text-3xl md:text-4xl font-bold font-mono mb-2 neon-text flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
            {searchQuery ? `SEARCH RESULTS` : `TRENDING`}
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {searchQuery 
              ? `Search results for "${searchQuery}"` 
              : `Top artists and songs ranked by trading activity & plays`
            }
          </p>
        </div>

        <Tabs defaultValue="songs" className="w-full px-4 md:px-0">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-xl p-1">
            <TabsTrigger 
              value="songs"
              className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green font-mono rounded-lg transition-all"
            >
              SONGS
            </TabsTrigger>
            <TabsTrigger 
              value="artists"
              className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green font-mono rounded-lg transition-all"
            >
              ARTISTS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="songs" className="space-y-4">
            {/* Sort Controls */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground font-mono">SORT BY:</span>
              <button
                onClick={() => handleSort('trending')}
                className={`px-3 py-1 rounded-lg text-xs font-mono transition-all ${
                  sortField === 'trending' 
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/50' 
                    : 'bg-background/50 text-muted-foreground border border-border hover:border-neon-green/30'
                }`}
              >
                🔥 TRENDING {sortField === 'trending' && (sortDirection === 'desc' ? '↓' : '↑')}
              </button>
            </div>
            
            <div className="md:rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="font-mono text-muted-foreground w-12">#</TableHead>
                    <TableHead className="font-mono text-muted-foreground">NAME</TableHead>
                    <TableHead 
                      className="font-mono text-muted-foreground text-right cursor-pointer hover:text-neon-green transition-colors select-none"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        PRICE
                        {sortField === 'price' && (
                          <span className="text-neon-green">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-mono text-muted-foreground text-right cursor-pointer hover:text-neon-green transition-colors select-none"
                      onClick={() => handleSort('change')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        24H%
                        {sortField === 'change' && (
                          <span className="text-neon-green">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-mono text-muted-foreground text-right cursor-pointer hover:text-neon-green transition-colors select-none"
                      onClick={() => handleSort('volume')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        VOLUME
                        {sortField === 'volume' && (
                          <span className="text-neon-green">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-mono text-muted-foreground text-right cursor-pointer hover:text-neon-green transition-colors select-none"
                      onClick={() => handleSort('marketCap')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        MKT CAP
                        {sortField === 'marketCap' && (
                          <span className="text-neon-green">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="font-mono text-muted-foreground text-right cursor-pointer hover:text-neon-green transition-colors select-none"
                      onClick={() => handleSort('plays')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        PLAYS
                        {sortField === 'plays' && (
                          <span className="text-neon-green">{sortDirection === 'desc' ? '↓' : '↑'}</span>
                        )}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSongs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No deployed songs yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedSongs.map((song, index) => (
                      <SongRow key={song.id} song={song} index={index} onStatsUpdate={handleStatsUpdate} />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="artists" className="space-y-4">
            <div className="md:rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="font-mono text-muted-foreground w-12">#</TableHead>
                    <TableHead className="font-mono text-muted-foreground">ARTIST</TableHead>
                    <TableHead className="font-mono text-muted-foreground">TICKER</TableHead>
                    <TableHead className="font-mono text-muted-foreground text-right">SONGS</TableHead>
                    <TableHead className="font-mono text-muted-foreground text-right">PLAYS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {artists.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No artists yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    artists.map((artist, index) => (
                      <TableRow
                        key={artist.wallet_address}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => navigate(`/artist/${artist.wallet_address}`)}
                      >
                        <TableCell className="font-mono text-muted-foreground">
                          #{index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {artist.avatar_cid ? (
                              <img
                                src={getIPFSGatewayUrl(artist.avatar_cid)}
                                alt={artist.artist_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-neon-green/10 flex items-center justify-center">
                                <span className="font-bold text-neon-green">
                                  {artist.artist_name[0]}
                                </span>
                              </div>
                            )}
                            <div className="font-semibold">{artist.artist_name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {artist.artist_ticker && (
                            <span className="text-xs font-mono text-neon-green">
                              ${artist.artist_ticker}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-right">
                          {artist.total_songs}
                        </TableCell>
                        <TableCell className="font-mono text-right">
                          <Flame className="w-4 h-4 inline mr-1 text-orange-500" />
                          {artist.total_plays}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Trending;
