import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import NetworkInfo from "@/components/NetworkInfo";
import Navigation from "@/components/Navigation";
import { useArtistProfile } from "@/hooks/useArtistProfile";
import { useWallet } from "@/hooks/useWallet";
import StoriesBar from "@/components/StoriesBar";
import LikeButton from "@/components/LikeButton";
import { ReportButton } from "@/components/ReportButton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink, Edit, Music, Play, Calendar, Instagram, Globe, Users, Wallet, MessageSquare, Send, CheckCircle, Upload } from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Song {
  id: string;
  title: string;
  artist: string;
  wallet_address: string;
  audio_cid: string;
  cover_cid: string | null;
  token_address?: string | null;
  play_count: number;
  created_at: string;
  ticker?: string | null;
}

interface FeedPost {
  id: string;
  content_text: string | null;
  media_cid: string | null;
  media_type: string | null;
  wallet_address: string;
  created_at: string;
  like_count: number;
  comment_count: number;
}

interface FeedComment {
  id: string;
  wallet_address: string;
  comment_text: string;
  created_at: string;
  profiles?: {
    artist_name: string | null;
    avatar_cid: string | null;
  };
}

interface ArtistProps {
  playSong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
}

const Artist = ({ playSong, currentSong, isPlaying }: ArtistProps) => {
  const { walletAddress } = useParams<{ walletAddress: string }>();
  const navigate = useNavigate();
  const { fullAddress } = useWallet();
  const { profile, loading, error } = useArtistProfile(walletAddress || null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [holdersCount, setHoldersCount] = useState<number>(0);
  const [holdingsCount, setHoldingsCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const isOwnProfile = fullAddress?.toLowerCase() === walletAddress?.toLowerCase();

  useEffect(() => {
    const fetchArtistSongs = async () => {
      if (!walletAddress) return;

      try {
        setLoadingSongs(true);
        const { data, error } = await supabase
          .from("songs")
          .select("id, title, artist, wallet_address, audio_cid, cover_cid, play_count, ticker, created_at")
          .ilike("wallet_address", walletAddress)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSongs(data || []);
      } catch (err) {
        console.error("Error fetching artist songs:", err);
        toast({
          title: "Error loading songs",
          description: "Failed to load artist's music",
          variant: "destructive",
        });
      } finally {
        setLoadingSongs(false);
      }
    };

    fetchArtistSongs();
  }, [walletAddress]);

  useEffect(() => {
    const fetchArtistPosts = async () => {
      if (!walletAddress) return;

      try {
        setLoadingPosts(true);
        console.log('Fetching posts for wallet:', walletAddress);
        
        const { data, error } = await supabase
          .from("feed_posts")
          .select("*")
          .ilike("wallet_address", walletAddress)
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        console.log('Found posts:', data?.length || 0, 'posts for wallet:', walletAddress);
        console.log('Posts data:', data);
        setPosts(data || []);
      } catch (err) {
        console.error("Error fetching artist posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchArtistPosts();
  }, [walletAddress, refreshKey]);

  useEffect(() => {
    const fetchSocialStats = async () => {
      if (!walletAddress) return;

      try {
        setLoadingStats(true);
        
        // Get holders count (people who bought this artist's songs)
        const { data: holdersData, error: holdersError } = await supabase
          .rpc('get_holders_count', { artist_wallet: walletAddress });

        if (holdersError) throw holdersError;
        setHoldersCount(holdersData || 0);

        // Get holdings count (artists whose songs this wallet bought)
        const { data: holdingsData, error: holdingsError } = await supabase
          .rpc('get_holdings_count', { buyer_wallet: walletAddress });

        if (holdingsError) throw holdingsError;
        setHoldingsCount(holdingsData || 0);
      } catch (err) {
        console.error("Error fetching social stats:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchSocialStats();
  }, [walletAddress]);

  const toggleComments = async (postId: string) => {
    const isExpanded = expandedComments.has(postId);
    
    if (isExpanded) {
      setExpandedComments(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    } else {
      setExpandedComments(prev => new Set(prev).add(postId));
      await loadComments(postId);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const { data: commentsData, error } = await supabase
        .from('feed_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const walletAddresses = [...new Set(commentsData?.map(c => c.wallet_address) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('wallet_address, artist_name, avatar_cid')
        .in('wallet_address', walletAddresses);

      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesData?.find(p => p.wallet_address?.toLowerCase() === comment.wallet_address?.toLowerCase()) || null,
      })) || [];

      setComments(prev => ({ ...prev, [postId]: commentsWithProfiles as FeedComment[] }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!fullAddress) {
      toast({
        title: 'Connect wallet',
        description: 'Please connect your wallet to comment',
        variant: 'destructive',
      });
      return;
    }

    const text = commentText[postId]?.trim();
    if (!text) return;

    try {
      const { error } = await supabase
        .from('feed_comments')
        .insert({
          post_id: postId,
          wallet_address: fullAddress,
          comment_text: text,
        });

      if (error) throw error;

      setCommentText(prev => ({ ...prev, [postId]: '' }));
      await loadComments(postId);
      
      // Update comment count in local state
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Failed to add comment',
        variant: 'destructive',
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="font-mono text-muted-foreground">Artist profile not found</p>
          <Button variant="neon" onClick={() => navigate("/")}>
            GO HOME
          </Button>
        </div>
      </div>
    );
  }

  const coverUrl = profile.cover_cid ? getIPFSGatewayUrl(profile.cover_cid) : null;
  const avatarUrl = profile.avatar_cid ? getIPFSGatewayUrl(profile.avatar_cid) : null;
  const coverPosition = profile.social_links?.coverPosition || 50; // Default to center (50%)

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <Navigation />
      <NetworkInfo />

      {/* Cover Photo Hero */}
      <div 
        className="relative h-64 w-full"
        style={coverUrl ? {
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: `center ${coverPosition}%`
        } : undefined}
      >
        {!coverUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Avatar Overlapping Cover */}
        <div className="absolute bottom-0 left-8 transform translate-y-1/2">
          <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
            <AvatarImage src={avatarUrl || undefined} alt={profile.artist_name || profile.display_name || 'Profile avatar'} className="object-cover" />
            <AvatarFallback className="bg-primary/20 text-neon-green font-mono text-4xl">
              {(profile.artist_name || profile.display_name || profile.wallet_address || '??').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-6xl mx-auto px-6 py-8 pt-20">
        <StoriesBar />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-mono font-bold neon-text">
                {profile.artist_name}
              </h1>
              {profile.verified && (
                <>
                  <CheckCircle className="h-5 w-5 text-neon-green" aria-label="Verified artist" />
                  <Badge className="bg-neon-green/20 text-neon-green border-neon-green">VERIFIED</Badge>
                </>
              )}
            </div>
            {profile.artist_ticker && (
              <p className="text-2xl font-mono text-neon-green mb-2">
                ${profile.artist_ticker}
              </p>
            )}
            <p className="text-sm font-mono text-muted-foreground">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </p>
          </div>

          {isOwnProfile && (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button variant="neon" onClick={() => navigate("/upload")}>
                <Upload className="h-4 w-4 mr-2" />
                UPLOAD MUSIC
              </Button>
              <Button variant="outline" onClick={() => navigate("/profile/edit")}>
                <Edit className="h-4 w-4 mr-2" />
                EDIT PROFILE
              </Button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="console-bg tech-border p-4 text-center">
            <Music className="h-6 w-6 mx-auto mb-2 text-neon-green" />
            <p className="text-2xl font-mono font-bold">{profile.total_songs || 0}</p>
            <p className="text-xs font-mono text-muted-foreground">SONGS</p>
          </Card>
          <Card className="console-bg tech-border p-4 text-center">
            <Play className="h-6 w-6 mx-auto mb-2 text-neon-green" />
            <p className="text-2xl font-mono font-bold">{profile.total_plays || 0}</p>
            <p className="text-xs font-mono text-muted-foreground">PLAYS</p>
          </Card>
          <Card className="console-bg tech-border p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-neon-green" />
            <p className="text-2xl font-mono font-bold">
              {loadingStats ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : holdersCount}
            </p>
            <p className="text-xs font-mono text-muted-foreground">HOLDERS</p>
          </Card>
          <Card className="console-bg tech-border p-4 text-center">
            <Wallet className="h-6 w-6 mx-auto mb-2 text-neon-green" />
            <p className="text-2xl font-mono font-bold">
              {loadingStats ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : holdingsCount}
            </p>
            <p className="text-xs font-mono text-muted-foreground">HOLDINGS</p>
          </Card>
          <Card className="console-bg tech-border p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-neon-green" />
            <p className="text-xs font-mono font-bold">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs font-mono text-muted-foreground">MEMBER SINCE</p>
          </Card>
          {profile.profile_metadata_cid && (
            <Card className="console-bg tech-border p-4 text-center">
              <a
                href={getIPFSGatewayUrl(profile.profile_metadata_cid)}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-neon-green transition-colors"
              >
                <ExternalLink className="h-6 w-6 mx-auto mb-2" />
                <p className="text-xs font-mono font-bold">VIEW ON</p>
                <p className="text-xs font-mono text-muted-foreground">IPFS</p>
              </a>
            </Card>
          )}
        </div>

        {/* Bio & Social Links */}
        {(profile.bio || profile.social_links) && (
          <Card className="console-bg tech-border p-6 mb-8">
            {profile.bio && (
              <p className="font-mono text-sm mb-4 whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
            {profile.social_links && (
              <div className="flex gap-4">
                {profile.social_links.twitter && (
                  <a
                    href={profile.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-neon-green transition-colors"
                  >
                    <FaXTwitter className="h-5 w-5" />
                  </a>
                )}
                {profile.social_links.instagram && (
                  <a
                    href={profile.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-neon-green transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {profile.social_links.website && (
                  <a
                    href={profile.social_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-neon-green transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Tabs for Music and Posts */}
        <Tabs defaultValue="music" className="w-full">
          <TabsList className="w-full justify-start mb-6 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
            <TabsTrigger 
              value="music" 
              className="font-mono data-[state=active]:bg-white/10 data-[state=active]:text-neon-green data-[state=active]:shadow-lg data-[state=active]:shadow-neon-green/20 data-[state=active]:border data-[state=active]:border-neon-green/30 data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white/80 data-[state=inactive]:hover:bg-white/5 transition-all duration-300 rounded-xl px-6 py-3 backdrop-blur-sm"
            >
              <Music className="h-4 w-4 mr-2" />
              MUSIC
            </TabsTrigger>
            <TabsTrigger 
              value="posts" 
              className="font-mono data-[state=active]:bg-white/10 data-[state=active]:text-neon-green data-[state=active]:shadow-lg data-[state=active]:shadow-neon-green/20 data-[state=active]:border data-[state=active]:border-neon-green/30 data-[state=inactive]:text-white/60 data-[state=inactive]:hover:text-white/80 data-[state=inactive]:hover:bg-white/5 transition-all duration-300 rounded-xl px-6 py-3 backdrop-blur-sm"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              POSTS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music">
            {loadingSongs ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
              </div>
            ) : songs.length === 0 ? (
              <Card className="console-bg tech-border p-6 text-center">
                <p className="font-mono text-muted-foreground">No songs uploaded yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {songs.map((song) => {
                  const coverUrl = song.cover_cid ? getIPFSGatewayUrl(song.cover_cid) : null;
                  
                  return (
                    <Card
                      key={song.id}
                      className="console-bg tech-border p-4 cursor-pointer hover:border-neon-green transition-colors group"
                      onClick={() => playSong(song)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Album Artwork */}
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 rounded tech-border overflow-hidden bg-primary/20">
                            {coverUrl ? (
                              <img 
                                src={coverUrl} 
                                alt={song.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="h-6 w-6 text-neon-green" />
                              </div>
                            )}
                          </div>
                          {/* Play Icon Overlay */}
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {currentSong?.id === song.id && isPlaying ? (
                              <Loader2 className="h-6 w-6 text-neon-green animate-spin" />
                            ) : (
                              <Play className="h-6 w-6 text-neon-green" />
                            )}
                          </div>
                        </div>
                        
                        {/* Song Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-mono font-bold text-lg truncate group-hover:text-neon-green transition-colors flex items-center gap-2">
                            <span className="truncate">{song.title}</span>
                            {song.ticker && (
                              <span className="text-neon-green text-sm flex-shrink-0">${song.ticker}</span>
                            )}
                          </p>
                          <p className="text-sm font-mono text-muted-foreground">
                            {song.play_count} plays
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
                          <LikeButton songId={song.id} size="sm" showCount={false} />
                          <ReportButton songId={song.id} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-lg">Posts ({posts.length})</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRefreshKey(prev => prev + 1)}
                disabled={loadingPosts}
              >
                {loadingPosts ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
            
            {loadingPosts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
              </div>
            ) : posts.length === 0 ? (
              <Card className="console-bg tech-border p-6 text-center">
                <p className="font-mono text-muted-foreground">No posts yet</p>
                <p className="font-mono text-xs text-muted-foreground mt-2">
                  Posts you create will appear here
                </p>
              </Card>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <Card key={post.id} className="console-bg tech-border p-6">
                    {post.content_text && (
                      <p className="font-mono text-sm mb-4 whitespace-pre-wrap">
                        {post.content_text}
                      </p>
                    )}
                    
                    {post.media_cid && post.media_type && (
                      <div className="mb-4">
                        {post.media_type.startsWith('image') ? (
                          <img 
                            src={getIPFSGatewayUrl(post.media_cid)}
                            alt="Post media"
                            className="w-full rounded tech-border"
                          />
                        ) : post.media_type.startsWith('video') ? (
                          <video 
                            src={getIPFSGatewayUrl(post.media_cid)}
                            controls
                            className="w-full rounded tech-border"
                          />
                        ) : null}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground font-mono border-t border-border pt-4 mt-4">
                      <div className="flex items-center gap-2">
                        <LikeButton songId={post.id} size="sm" showCount={true} entityType="post" />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComments(post.id)}
                        className="flex items-center gap-1 font-mono"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.comment_count}</span>
                      </Button>
                      <span className="ml-auto">
                        {formatTimeAgo(post.created_at)}
                      </span>
                    </div>

                    {/* Comments Section */}
                    {expandedComments.has(post.id) && (
                      <div className="mt-4 space-y-4 border-t border-border pt-4">
                        {/* Add Comment Input */}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add a comment..."
                            value={commentText[post.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(post.id);
                              }
                            }}
                            className="font-mono text-sm"
                          />
                          <Button
                            size="sm"
                            variant="neon"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentText[post.id]?.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage 
                                  src={comment.profiles?.avatar_cid ? getIPFSGatewayUrl(comment.profiles.avatar_cid) : undefined} 
                                />
                                <AvatarFallback className="bg-primary/20 text-neon-green text-xs">
                                  {(comment.profiles?.artist_name || comment.wallet_address).substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-xs font-semibold">
                                    {comment.profiles?.artist_name || `${comment.wallet_address.slice(0, 6)}...${comment.wallet_address.slice(-4)}`}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(comment.created_at)}
                                  </span>
                                </div>
                                <p className="font-mono text-sm">{comment.comment_text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Artist;
