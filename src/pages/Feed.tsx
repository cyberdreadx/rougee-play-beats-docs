import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Heart, MessageCircle, Share2, Image as ImageIcon, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getIPFSGatewayUrl } from '@/lib/ipfs';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import StoriesBar from '@/components/StoriesBar';

interface FeedPost {
  id: string;
  wallet_address: string;
  content_text: string | null;
  media_cid: string | null;
  media_type: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  profiles?: {
    artist_name: string | null;
    avatar_cid: string | null;
  };
}

export default function Feed() {
  const { fullAddress, isConnected } = useWallet();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [contentText, setContentText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPosts();
    if (isConnected && fullAddress) {
      loadLikedPosts();
    }
  }, [isConnected, fullAddress]);

  const loadPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles separately
      const walletAddresses = [...new Set(postsData?.map(p => p.wallet_address) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('wallet_address, artist_name, avatar_cid')
        .in('wallet_address', walletAddresses);

      // Merge data
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: profilesData?.find(p => p.wallet_address === post.wallet_address) || null,
      })) || [];

      setPosts(postsWithProfiles as FeedPost[]);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Error loading feed',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLikedPosts = async () => {
    if (!fullAddress) return;

    try {
      const { data, error } = await supabase
        .from('feed_likes')
        .select('post_id')
        .eq('wallet_address', fullAddress);

      if (error) throw error;
      setLikedPosts(new Set(data?.map(like => like.post_id) || []));
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!isConnected || !fullAddress) {
      toast({
        title: 'Connect wallet',
        description: 'Please connect your wallet to post',
        variant: 'destructive',
      });
      return;
    }

    if (!contentText && !mediaFile) {
      toast({
        title: 'Empty post',
        description: 'Please add text or media',
        variant: 'destructive',
      });
      return;
    }

    setPosting(true);

    try {
      const formData = new FormData();
      formData.append('wallet_address', fullAddress);
      if (contentText) formData.append('content_text', contentText);
      if (mediaFile) formData.append('media', mediaFile);

      const response = await supabase.functions.invoke('create-feed-post', {
        body: formData,
      });

      if (response.error) throw response.error;

      toast({
        title: 'Posted!',
        description: 'Your post was uploaded to IPFS and published',
      });

      setContentText('');
      setMediaFile(null);
      setMediaPreview(null);
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Post failed',
        description: error instanceof Error ? error.message : 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!isConnected || !fullAddress) {
      toast({
        title: 'Connect wallet',
        description: 'Please connect your wallet to like posts',
        variant: 'destructive',
      });
      return;
    }

    const isLiked = likedPosts.has(postId);

    try {
      if (isLiked) {
        await supabase
          .from('feed_likes')
          .delete()
          .eq('post_id', postId)
          .eq('wallet_address', fullAddress);

        setLikedPosts(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        await supabase
          .from('feed_likes')
          .insert({
            post_id: postId,
            wallet_address: fullAddress,
          });

        setLikedPosts(prev => new Set(prev).add(postId));
      }

      loadPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
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

  return (
    <>
      <Header />
      <Navigation />
      <StoriesBar />
      <div className="min-h-screen bg-background pt-32 pb-32 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 glitch-text">GLTCH Feed</h1>
            <p className="text-muted-foreground">Decentralized social feed on IPFS</p>
          </div>

          {/* Post Creator */}
          {isConnected && (
            <Card className="p-4 space-y-4 bg-card/50 backdrop-blur-sm border-tech-border">
              <Textarea
                placeholder="What's on your mind?"
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="min-h-[100px] resize-none"
              />

              {mediaPreview && (
                <div className="relative">
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="max-h-64 rounded-lg mx-auto"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="hidden"
                  id="media-upload"
                />
                <label htmlFor="media-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Add Media
                    </span>
                  </Button>
                </label>

                <Button
                  onClick={handlePost}
                  disabled={posting || (!contentText && !mediaFile)}
                  className="ml-auto"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {posting ? 'Posting to IPFS...' : 'Post'}
                </Button>
              </div>
            </Card>
          )}

          {/* Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading feed...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No posts yet. Be the first to post!
              </div>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="p-4 bg-card/50 backdrop-blur-sm border-tech-border">
                  {/* Post Header */}
                  <div className="flex items-center gap-3 mb-3">
                    {post.profiles?.avatar_cid ? (
                      <img
                        src={getIPFSGatewayUrl(post.profiles.avatar_cid)}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary text-sm">
                          {post.profiles?.artist_name?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">
                        {post.profiles?.artist_name || `${post.wallet_address.slice(0, 6)}...${post.wallet_address.slice(-4)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(post.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  {post.content_text && (
                    <p className="mb-3 whitespace-pre-wrap">{post.content_text}</p>
                  )}

                  {/* Post Media */}
                  {post.media_cid && (
                    <div className="mb-3 rounded-lg overflow-hidden">
                      {post.media_type === 'image' ? (
                        <img
                          src={getIPFSGatewayUrl(post.media_cid)}
                          alt="Post media"
                          className="w-full max-h-96 object-cover"
                        />
                      ) : post.media_type === 'video' ? (
                        <video
                          src={getIPFSGatewayUrl(post.media_cid)}
                          controls
                          className="w-full max-h-96"
                        />
                      ) : null}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-6 pt-3 border-t border-border">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Heart
                        className={`w-5 h-5 ${likedPosts.has(post.id) ? 'fill-red-500 text-red-500' : ''}`}
                      />
                      <span>{post.like_count}</span>
                    </button>

                    <button className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comment_count}</span>
                    </button>

                    <button className="flex items-center gap-2 text-sm hover:text-primary transition-colors ml-auto">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
