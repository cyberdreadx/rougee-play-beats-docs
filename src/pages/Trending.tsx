import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";

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
  ticker: string | null;
  genre: string | null;
  created_at: string;
}

const Trending = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
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
            .select("id, title, artist, wallet_address, cover_cid, play_count, ticker, genre, created_at")
            .order("play_count", { ascending: false })
            .limit(50)
        ]);

        if (artistsResponse.error) throw artistsResponse.error;
        if (songsResponse.error) throw songsResponse.error;
        
        setArtists(artistsResponse.data || []);
        setSongs(songsResponse.data || []);
      } catch (error) {
        console.error("Error fetching trending data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingData();
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
            TRENDING
          </h1>
          <p className="text-sm font-mono text-muted-foreground">
            Top artists and songs ranked by plays
          </p>
        </div>

        <Tabs defaultValue="artists" className="w-full">
          <TabsList className="grid w-full max-w-md mb-6 grid-cols-2">
            <TabsTrigger value="artists" className="font-mono">ARTISTS</TabsTrigger>
            <TabsTrigger value="songs" className="font-mono">SONGS</TabsTrigger>
          </TabsList>

          <TabsContent value="artists">
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
                                alt={artist.artist_name || 'Artist'}
                              />
                              <AvatarFallback className="bg-neon-green/10 text-neon-green font-mono">
                                {(artist.artist_name || '??').substring(0, 2).toUpperCase()}
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
          </TabsContent>

          <TabsContent value="songs">
            <div className="glass-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-neon-green/20 hover:bg-transparent">
                    <TableHead className="w-12 font-mono text-neon-green">#</TableHead>
                    <TableHead className="font-mono text-neon-green">SONG</TableHead>
                    <TableHead className="font-mono text-neon-green">ARTIST</TableHead>
                    <TableHead className="font-mono text-neon-green">GENRE</TableHead>
                    <TableHead className="font-mono text-neon-green text-right">PLAYS</TableHead>
                    <TableHead className="font-mono text-neon-green text-center w-16">24H</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {songs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <p className="font-mono text-muted-foreground">
                          No trending songs yet. Upload your first track!
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    songs.map((song, index) => (
                      <TableRow
                        key={song.id}
                        className="border-neon-green/10 cursor-pointer hover:bg-neon-green/5 transition-colors"
                        onClick={() => navigate(`/song/${song.id}`)}
                      >
                        <TableCell className="font-mono text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-neon-green/20 rounded-sm">
                              <AvatarImage
                                src={song.cover_cid ? `https://gateway.lighthouse.storage/ipfs/${song.cover_cid}` : undefined}
                                alt={song.title || 'Song'}
                              />
                              <AvatarFallback className="bg-neon-green/10 text-neon-green font-mono rounded-sm">
                                {(song.title || '??').substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-mono font-medium">
                                {song.title}
                              </div>
                              {song.ticker && (
                                <Badge variant="outline" className="text-xs font-mono mt-1">
                                  ${song.ticker}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          {song.artist || (
                            <span className="text-muted-foreground text-sm">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {song.genre ? (
                            <Badge variant="secondary" className="font-mono text-xs">
                              {song.genre}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground font-mono text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-neon-green">
                          {formatNumber(song.play_count)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getTrendIndicator(index)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="font-mono text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/song/${song.id}`);
                            }}
                          >
                            TRADE
                          </Button>
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
