import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import NetworkInfo from "@/components/NetworkInfo";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Artist {
  wallet_address: string;
  artist_name: string;
  artist_ticker: string | null;
  avatar_cid: string | null;
  total_songs: number;
  total_plays: number;
  verified: boolean;
}

const Trending = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingArtists = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("wallet_address, artist_name, artist_ticker, avatar_cid, total_songs, total_plays, verified")
          .not("artist_name", "is", null)
          .gt("total_songs", 0)
          .order("total_plays", { ascending: false })
          .limit(50);

        if (error) throw error;
        setArtists(data || []);
      } catch (error) {
        console.error("Error fetching trending artists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingArtists();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toString();
  };

  const getTrendIndicator = (index: number) => {
    // Mock trend data - in real app would compare with previous period
    const trend = Math.random();
    if (trend > 0.6) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0.4) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-20">
        <Header />
        <NetworkInfo />
        <Navigation activeTab="TRENDING" />
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20">
      <Header />
      <NetworkInfo />
      <Navigation activeTab="TRENDING" />
      
      <main className="w-full px-4 md:px-6 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-mono neon-text mb-2">
            TRENDING ARTISTS
          </h1>
          <p className="text-sm font-mono text-muted-foreground">
            Top artists ranked by total plays
          </p>
        </div>

        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-neon-green/20 hover:bg-transparent">
                <TableHead className="w-12 font-mono text-neon-green">#</TableHead>
                <TableHead className="font-mono text-neon-green">ARTIST</TableHead>
                <TableHead className="font-mono text-neon-green">TICKER</TableHead>
                <TableHead className="font-mono text-neon-green text-right">SONGS</TableHead>
                <TableHead className="font-mono text-neon-green text-right">PLAYS</TableHead>
                <TableHead className="font-mono text-neon-green text-center w-16">24H</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="font-mono text-muted-foreground">
                      No trending artists yet. Be the first to launch music!
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                artists.map((artist, index) => (
                  <TableRow
                    key={artist.wallet_address}
                    className="border-neon-green/10 cursor-pointer hover:bg-neon-green/5 transition-colors"
                    onClick={() => navigate(`/artist/${artist.wallet_address}`)}
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-neon-green/20">
                          <AvatarImage
                            src={artist.avatar_cid ? `https://gateway.lighthouse.storage/ipfs/${artist.avatar_cid}` : undefined}
                            alt={artist.artist_name}
                          />
                          <AvatarFallback className="bg-neon-green/10 text-neon-green font-mono">
                            {artist.artist_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium">
                            {artist.artist_name}
                          </span>
                          {artist.verified && (
                            <Badge variant="secondary" className="text-xs">
                              ✓
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {artist.artist_ticker ? (
                        <Badge variant="outline" className="font-mono">
                          ${artist.artist_ticker}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground font-mono text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {artist.total_songs}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-neon-green">
                      {formatNumber(artist.total_plays)}
                    </TableCell>
                    <TableCell className="text-center">
                      {getTrendIndicator(index)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Trending;
