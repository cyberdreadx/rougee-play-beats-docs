import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import NetworkInfo from "@/components/NetworkInfo";
import Navigation from "@/components/Navigation";
import LikeButton from "@/components/LikeButton";
import { ReportButton } from "@/components/ReportButton";
import { SongTradingChart } from "@/components/SongTradingChart";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import { useWallet } from "@/hooks/useWallet";
import { Play, TrendingUp, Users, MessageSquare, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  wallet_address: string;
  audio_cid: string;
  cover_cid: string | null;
  play_count: number;
  created_at: string;
}

interface Comment {
  id: string;
  wallet_address: string;
  user_name: string | null;
  comment_text: string;
  created_at: string;
  profiles?: {
    artist_name: string | null;
    avatar_cid: string | null;
  };
}

interface SongTradeProps {
  playSong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
}

const SongTrade = ({ playSong, currentSong, isPlaying }: SongTradeProps) => {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const { fullAddress, isConnected } = useWallet();

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [songTokenAddress, setSongTokenAddress] = useState<`0x${string}` | undefined>();

  // Import bonding curve hooks (will be implemented after useWallet is updated)
  // TODO: Integrate real blockchain data once song tokens are deployed
  const currentPrice = 0.00015; // XRGE per token - will be fetched from useSongPrice
  const marketCap = 2450; // USD
  const holders = 23;

  useEffect(() => {
    if (songId) {
      fetchSong();
      fetchComments();
    }
  }, [songId]);

  const fetchSong = async () => {
    try {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("id", songId)
        .single();

      if (error) throw error;
      setSong(data);
    } catch (error) {
      console.error("Error fetching song:", error);
      toast({
        title: "Error",
        description: "Failed to load song",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data: commentsData, error } = await supabase
        .from("comments")
        .select("*")
        .eq("song_id", songId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for comment authors
      const walletAddresses = [...new Set(commentsData?.map(c => c.wallet_address) || [])];
      const { data: profilesData } = await supabase
        .from('public_profiles')
        .select('wallet_address, artist_name, avatar_cid')
        .in('wallet_address', walletAddresses);

      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesData?.find(p => p.wallet_address === comment.wallet_address) || null,
      })) || [];

      setComments(commentsWithProfiles as Comment[]);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleBuy = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy",
        variant: "destructive",
      });
      return;
    }

    if (!songTokenAddress) {
      toast({
        title: "Song Token Not Deployed",
        description: "This song hasn't been deployed to the bonding curve yet. Contact the artist to deploy it.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement with useBuySongTokens hook
    toast({
      title: "Buy Feature Ready",
      description: `Ready to buy ${buyAmount} ETH worth of tokens. Integration will be completed in next update.`,
    });
  };

  const handleSell = () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to sell",
        variant: "destructive",
      });
      return;
    }

    if (!songTokenAddress) {
      toast({
        title: "Song Token Not Deployed",
        description: "This song hasn't been deployed to the bonding curve yet.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement with useSellSongTokens hook
    toast({
      title: "Sell Feature Ready",
      description: `Ready to sell ${sellAmount} tokens. Integration will be completed in next update.`,
    });
  };

  const handlePostComment = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to comment",
        variant: "destructive",
      });
      return;
    }

    if (!commentText.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          song_id: songId,
          wallet_address: fullAddress,
          comment_text: commentText.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Comment posted!",
        description: "Your comment has been added",
      });

      setCommentText("");
      fetchComments();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-mono text-muted-foreground">Song not found</h1>
          <Button onClick={() => navigate("/")} className="mt-4" variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const coverImageUrl = song.cover_cid ? getIPFSGatewayUrl(song.cover_cid) : '/og-image.png';
  const pageUrl = `https://edbd29f5-fe8e-435d-b3d2-8111ac95287a.lovableproject.com/song/${song.id}`;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      <Helmet>
        <title>{song.title} - {song.artist || 'Unknown Artist'} | ROUGEE.PLAY</title>
        <meta name="description" content={`Listen to ${song.title} by ${song.artist || 'Unknown Artist'} on ROUGEE.PLAY. Stream and trade music NFTs on the blockchain.`} />
        
        <meta property="og:title" content={`${song.title} - ${song.artist || 'Unknown Artist'}`} />
        <meta property="og:description" content={`Listen to ${song.title} by ${song.artist || 'Unknown Artist'} on ROUGEE.PLAY`} />
        <meta property="og:image" content={coverImageUrl} />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:type" content="music.song" />
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${song.title} - ${song.artist || 'Unknown Artist'}`} />
        <meta name="twitter:description" content={`Listen to ${song.title} by ${song.artist || 'Unknown Artist'} on ROUGEE.PLAY`} />
        <meta name="twitter:image" content={coverImageUrl} />
      </Helmet>

      <Header />
      <Navigation />
      <NetworkInfo />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8">
        {/* Song Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="console-bg tech-border p-4 md:p-6 lg:col-span-2">
            <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24 md:h-32 md:w-32 border-2 border-neon-green shrink-0">
                <AvatarImage
                  src={song.cover_cid ? getIPFSGatewayUrl(song.cover_cid) : undefined}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/20 text-neon-green font-mono text-2xl md:text-3xl">
                  {song.title.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 w-full min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-mono font-bold neon-text mb-1 md:mb-2 truncate">
                  {song.title}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground font-mono mb-3 md:mb-4 truncate">
                  By {song.artist || "Unknown Artist"}
                </p>

                <div className="flex flex-wrap gap-2 md:gap-3 mb-3 md:mb-4">
                  <Badge variant="outline" className="font-mono text-xs">
                    <Play className="h-3 w-3 mr-1" />
                    {song.play_count} plays
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    ${marketCap} MCap
                  </Badge>
                  <Badge variant="outline" className="font-mono text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {holders} holders
                  </Badge>
                </div>

                <div className="flex gap-2 md:gap-3">
                  <Button 
                    variant="neon" 
                    size="sm"
                    className="flex-1 text-xs sm:text-sm"
                    onClick={() => song && playSong(song)}
                  >
                    <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {currentSong?.id === song.id && isPlaying ? "PLAYING..." : "PLAY"}
                  </Button>
                  <LikeButton songId={song.id} size="sm" />
                  <ReportButton songId={song.id} />
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="console-bg tech-border p-4 md:p-6">
            <h3 className="text-base md:text-lg font-mono font-bold neon-text mb-3 md:mb-4">CURRENT PRICE</h3>
            <div className="text-2xl md:text-3xl font-mono font-bold text-neon-green mb-1 md:mb-2">
              ${currentPrice.toFixed(6)}
            </div>
            <p className="text-xs md:text-sm text-muted-foreground font-mono mb-3 md:mb-4">per token</p>
            
            <div className="space-y-2 text-xs md:text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Cap:</span>
                <span className="text-foreground">${marketCap}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Holders:</span>
                <span className="text-foreground">{holders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h Volume:</span>
                <span className="text-foreground">$124</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Trading Chart */}
        <div className="mb-6 md:mb-8">
          <SongTradingChart songTokenAddress={songTokenAddress} />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="trade" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 h-auto">
            <TabsTrigger value="trade" className="text-xs sm:text-sm">TRADE</TabsTrigger>
            <TabsTrigger value="holders" className="text-xs sm:text-sm">HOLDERS</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">COMMENTS ({comments.length})</span>
              <span className="sm:hidden">💬 ({comments.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Trade Tab */}
          <TabsContent value="trade" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
              {/* Buy Card */}
              <Card className="console-bg tech-border p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-mono font-bold neon-text mb-4 flex items-center">
                  <ArrowUpRight className="h-4 w-4 md:h-5 md:w-5 mr-2 text-green-500" />
                  BUY
                </h3>

                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="text-xs md:text-sm font-mono text-muted-foreground mb-2 block">
                      Amount (XRGE)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="console-bg p-3 md:p-4 rounded-lg border border-border">
                    <div className="flex justify-between text-xs md:text-sm font-mono mb-2">
                      <span className="text-muted-foreground">You will receive:</span>
                      <span className="text-foreground">
                        ~{buyAmount ? (parseFloat(buyAmount) / currentPrice).toFixed(2) : "0"} tokens
                      </span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm font-mono">
                      <span className="text-muted-foreground">Price impact:</span>
                      <span className="text-green-500">~0.5%</span>
                    </div>
                  </div>

                  <Button onClick={handleBuy} className="w-full" variant="neon" size="sm">
                    BUY NOW
                  </Button>

                  <p className="text-xs text-muted-foreground font-mono text-center">
                    {songTokenAddress ? '✅ Bonding curve active' : '⚠️ Song not deployed to bonding curve'}
                  </p>
                </div>
              </Card>

              {/* Sell Card */}
              <Card className="console-bg tech-border p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-mono font-bold neon-text mb-4 flex items-center">
                  <ArrowDownRight className="h-4 w-4 md:h-5 md:w-5 mr-2 text-red-500" />
                  SELL
                </h3>

                <div className="space-y-3 md:space-y-4">
                  <div>
                    <label className="text-xs md:text-sm font-mono text-muted-foreground mb-2 block">
                      Amount (Tokens)
                    </label>
                    <Input
                      type="number"
                      placeholder="0.0"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="console-bg p-3 md:p-4 rounded-lg border border-border">
                    <div className="flex justify-between text-xs md:text-sm font-mono mb-2">
                      <span className="text-muted-foreground">You will receive:</span>
                      <span className="text-foreground">
                        ~{sellAmount ? (parseFloat(sellAmount) * currentPrice).toFixed(6) : "0"} XRGE
                      </span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm font-mono">
                      <span className="text-muted-foreground">Price impact:</span>
                      <span className="text-red-500">~0.5%</span>
                    </div>
                  </div>

                  <Button onClick={handleSell} className="w-full" variant="outline" size="sm">
                    SELL NOW
                  </Button>

                  <p className="text-xs text-muted-foreground font-mono text-center">
                    {songTokenAddress ? '✅ Bonding curve active' : '⚠️ Song not deployed to bonding curve'}
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Holders Tab */}
          <TabsContent value="holders" className="mt-0">
            <Card className="console-bg tech-border p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-mono font-bold neon-text mb-4 md:mb-6">TOP HOLDERS</h3>
              
              <div className="space-y-2 md:space-y-3">
                {/* Placeholder holders - will be replaced with blockchain data */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-2 md:p-3 console-bg border border-border rounded-lg">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-neon-green shrink-0">
                        <AvatarFallback className="bg-primary/20 text-neon-green font-mono text-xs">
                          #{i}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs md:text-sm truncate">0x{Math.random().toString(16).substr(2, 8)}...</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {(Math.random() * 100000).toFixed(0)} tokens
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-xs shrink-0">
                      {(Math.random() * 15).toFixed(2)}%
                    </Badge>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground font-mono text-center mt-4">
                ⚠️ Placeholder data - will connect to blockchain
              </p>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="mt-0">
            <Card className="console-bg tech-border p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-mono font-bold neon-text mb-4 md:mb-6 flex items-center">
                <MessageSquare className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                COMMENTS
              </h3>

              {/* Post Comment */}
              <div className="mb-4 md:mb-6 space-y-2 md:space-y-3">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="font-mono resize-none text-sm"
                  rows={3}
                />
                <Button onClick={handlePostComment} variant="neon" size="sm" className="w-full sm:w-auto">
                  POST COMMENT
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-3 md:space-y-4">
                {loadingComments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground font-mono">
                    No comments yet. Be the first!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="console-bg p-3 md:p-4 border border-border rounded-lg">
                      <div className="flex items-start gap-2 md:gap-3">
                        <Avatar className="h-8 w-8 md:h-10 md:w-10 border border-neon-green shrink-0">
                          {comment.profiles?.avatar_cid && (
                            <AvatarImage
                              src={getIPFSGatewayUrl(comment.profiles.avatar_cid)}
                              className="object-cover"
                            />
                          )}
                          <AvatarFallback className="bg-primary/20 text-neon-green font-mono text-xs">
                            {comment.profiles?.artist_name?.[0]?.toUpperCase() || comment.wallet_address.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                            <p className="font-mono text-xs md:text-sm font-semibold truncate">
                              {comment.profiles?.artist_name || `${comment.wallet_address.substring(0, 6)}...${comment.wallet_address.substring(38)}`}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="font-mono text-xs md:text-sm text-foreground break-words">{comment.comment_text}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SongTrade;
