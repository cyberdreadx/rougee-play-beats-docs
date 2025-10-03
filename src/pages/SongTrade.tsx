import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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

  // Placeholder bonding curve data (will be replaced with real blockchain data)
  const currentPrice = 0.00015; // XRGE per token
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
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("song_id", songId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
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

    // TODO: Implement bonding curve buy logic
    toast({
      title: "Coming Soon",
      description: `Buy ${buyAmount} XRGE worth of tokens - Smart contract deployment pending`,
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

    // TODO: Implement bonding curve sell logic
    toast({
      title: "Coming Soon",
      description: `Sell ${sellAmount} tokens - Smart contract deployment pending`,
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <NetworkInfo />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Song Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="console-bg tech-border p-6 lg:col-span-2">
            <div className="flex items-start gap-6">
              <Avatar className="h-32 w-32 border-2 border-neon-green">
                <AvatarImage
                  src={song.cover_cid ? getIPFSGatewayUrl(song.cover_cid) : undefined}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary/20 text-neon-green font-mono text-3xl">
                  {song.title.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <h1 className="text-3xl font-mono font-bold neon-text mb-2">{song.title}</h1>
                <p className="text-lg text-muted-foreground font-mono mb-4">
                  By {song.artist || "Unknown Artist"}
                </p>

                <div className="flex flex-wrap gap-3 mb-4">
                  <Badge variant="outline" className="font-mono">
                    <Play className="h-3 w-3 mr-1" />
                    {song.play_count} plays
                  </Badge>
                  <Badge variant="outline" className="font-mono">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    ${marketCap} MCap
                  </Badge>
                  <Badge variant="outline" className="font-mono">
                    <Users className="h-3 w-3 mr-1" />
                    {holders} holders
                  </Badge>
                </div>

                <Button 
                  variant="neon" 
                  className="w-full sm:w-auto"
                  onClick={() => song && playSong(song)}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {currentSong?.id === song.id && isPlaying ? "PLAYING..." : "PLAY SONG"}
                </Button>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="console-bg tech-border p-6">
            <h3 className="text-lg font-mono font-bold neon-text mb-4">CURRENT PRICE</h3>
            <div className="text-3xl font-mono font-bold text-neon-green mb-2">
              ${currentPrice.toFixed(6)}
            </div>
            <p className="text-sm text-muted-foreground font-mono mb-4">per token</p>
            
            <div className="space-y-2 text-sm font-mono">
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

        {/* Main Content */}
        <Tabs defaultValue="trade" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="trade">TRADE</TabsTrigger>
            <TabsTrigger value="holders">HOLDERS</TabsTrigger>
            <TabsTrigger value="comments">COMMENTS ({comments.length})</TabsTrigger>
          </TabsList>

          {/* Trade Tab */}
          <TabsContent value="trade">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Buy Card */}
              <Card className="console-bg tech-border p-6">
                <h3 className="text-xl font-mono font-bold neon-text mb-4 flex items-center">
                  <ArrowUpRight className="h-5 w-5 mr-2 text-green-500" />
                  BUY
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-mono text-muted-foreground mb-2 block">
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

                  <div className="console-bg p-4 rounded-lg border border-border">
                    <div className="flex justify-between text-sm font-mono mb-2">
                      <span className="text-muted-foreground">You will receive:</span>
                      <span className="text-foreground">
                        ~{buyAmount ? (parseFloat(buyAmount) / currentPrice).toFixed(2) : "0"} tokens
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">Price impact:</span>
                      <span className="text-green-500">~0.5%</span>
                    </div>
                  </div>

                  <Button onClick={handleBuy} className="w-full" variant="neon">
                    BUY NOW
                  </Button>

                  <p className="text-xs text-muted-foreground font-mono text-center">
                    ⚠️ Smart contracts pending deployment
                  </p>
                </div>
              </Card>

              {/* Sell Card */}
              <Card className="console-bg tech-border p-6">
                <h3 className="text-xl font-mono font-bold neon-text mb-4 flex items-center">
                  <ArrowDownRight className="h-5 w-5 mr-2 text-red-500" />
                  SELL
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-mono text-muted-foreground mb-2 block">
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

                  <div className="console-bg p-4 rounded-lg border border-border">
                    <div className="flex justify-between text-sm font-mono mb-2">
                      <span className="text-muted-foreground">You will receive:</span>
                      <span className="text-foreground">
                        ~{sellAmount ? (parseFloat(sellAmount) * currentPrice).toFixed(6) : "0"} XRGE
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-mono">
                      <span className="text-muted-foreground">Price impact:</span>
                      <span className="text-red-500">~0.5%</span>
                    </div>
                  </div>

                  <Button onClick={handleSell} className="w-full" variant="outline">
                    SELL NOW
                  </Button>

                  <p className="text-xs text-muted-foreground font-mono text-center">
                    ⚠️ Smart contracts pending deployment
                  </p>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Holders Tab */}
          <TabsContent value="holders">
            <Card className="console-bg tech-border p-6">
              <h3 className="text-xl font-mono font-bold neon-text mb-6">TOP HOLDERS</h3>
              
              <div className="space-y-3">
                {/* Placeholder holders - will be replaced with blockchain data */}
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 console-bg border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-neon-green">
                        <AvatarFallback className="bg-primary/20 text-neon-green font-mono">
                          #{i}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-mono text-sm">0x{Math.random().toString(16).substr(2, 8)}...</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {(Math.random() * 100000).toFixed(0)} tokens
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono">
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
          <TabsContent value="comments">
            <Card className="console-bg tech-border p-6">
              <h3 className="text-xl font-mono font-bold neon-text mb-6 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                COMMENTS
              </h3>

              {/* Post Comment */}
              <div className="mb-6 space-y-3">
                <Textarea
                  placeholder="Share your thoughts..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="font-mono resize-none"
                  rows={3}
                />
                <Button onClick={handlePostComment} variant="neon" className="w-full sm:w-auto">
                  POST COMMENT
                </Button>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {loadingComments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground font-mono">
                    No comments yet. Be the first!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="console-bg p-4 border border-border rounded-lg">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 border border-neon-green">
                          <AvatarFallback className="bg-primary/20 text-neon-green font-mono">
                            {comment.wallet_address.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-mono text-sm font-semibold">
                              {comment.wallet_address.substring(0, 6)}...{comment.wallet_address.substring(38)}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="font-mono text-sm text-foreground">{comment.comment_text}</p>
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
