import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Share2, Image as ImageIcon, Send, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { getIPFSGatewayUrl } from '@/lib/ipfs';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import StoriesBar from '@/components/StoriesBar';
import LikeButton from '@/components/LikeButton';
import { usePrivyToken } from '@/hooks/usePrivyToken';
interface FeedComment {
  id: string;
  wallet_address: string;
  comment_text: string;
  created_at: string;
  profiles?: {
    artist_name: string | null;
    avatar_cid: string | null;
    verified: boolean | null;
  };
}
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
    verified: boolean | null;
  };
}
export default function Feed() {
  const {
    fullAddress,
    isConnected
  } = useWallet();
  const { getAuthHeaders } = usePrivyToken();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [contentText, setContentText] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, FeedComment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  useEffect(() => {
    loadPosts();
    if (isConnected && fullAddress) {
      loadLikedPosts();
    }
  }, [isConnected, fullAddress]);
  const loadPosts = async () => {
    try {
      const {
        data: postsData,
        error
      } = await supabase.from('feed_posts').select('*').order('created_at', {
        ascending: false
      }).limit(50);
      if (error) throw error;

      // Fetch profiles separately (case-insensitive by using ilike OR filter)
      const walletAddresses = [...new Set(postsData?.map(p => p.wallet_address) || [])];
      let profilesData: { wallet_address: string; artist_name: string | null; avatar_cid: string | null; verified: boolean | null }[] = [];
      if (walletAddresses.length) {
        const orFilter = walletAddresses.map((a) => `wallet_address.ilike.${a}`).join(',');
        const { data } = await supabase
          .from('profiles')
          .select('wallet_address, artist_name, avatar_cid, verified')
          .or(orFilter);
        profilesData = data || [];
      }
      
      console.log('Profiles data:', profilesData);

      // Merge data (normalize addresses to lowercase)
      const postsWithProfiles = postsData?.map(post => ({
        ...post,
        profiles: profilesData?.find(p => p.wallet_address?.toLowerCase() === post.wallet_address?.toLowerCase()) || null
      })) || [];
      setPosts(postsWithProfiles as FeedPost[]);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast({
        title: 'Error loading feed',
        description: 'Failed to load posts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  const loadLikedPosts = async () => {
    if (!fullAddress) return;
    try {
      const {
        data,
        error
      } = await supabase.from('feed_likes').select('post_id').eq('wallet_address', fullAddress);
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
        variant: 'destructive'
      });
      return;
    }
    if (!contentText && !mediaFile) {
      toast({
        title: 'Empty post',
        description: 'Please add text or media',
        variant: 'destructive'
      });
      return;
    }
    setPosting(true);
    try {
      const baseHeaders = await getAuthHeaders();
      const headers: Record<string, string> = { ...baseHeaders };
      if (fullAddress) headers['x-wallet-address'] = fullAddress;
      
      const formData = new FormData();
      if (contentText) formData.append('content_text', contentText);
      if (mediaFile) formData.append('media', mediaFile);
      const response = await supabase.functions.invoke('create-feed-post', {
        headers,
        body: formData
      });
      if (response.error) throw response.error;
      toast({
        title: 'Posted!',
        description: 'Your post was uploaded to IPFS and published'
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
        variant: 'destructive'
      });
    } finally {
      setPosting(false);
    }
  };
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
      const {
        data: commentsData,
        error
      } = await supabase.from('feed_comments').select('*').eq('post_id', postId).order('created_at', {
        ascending: false
      });
      if (error) throw error;

      // Fetch profiles for comment authors
      const walletAddresses = [...new Set(commentsData?.map(c => c.wallet_address) || [])];
      const {
        data: profilesData
      } = await supabase.from('profiles').select('wallet_address, artist_name, avatar_cid, verified').in('wallet_address', walletAddresses);
      
      console.log('Comment profiles data:', profilesData);
      const commentsWithProfiles = commentsData?.map(comment => ({
        ...comment,
        profiles: profilesData?.find(p => p.wallet_address === comment.wallet_address) || null
      })) || [];
      setComments(prev => ({
        ...prev,
        [postId]: commentsWithProfiles as FeedComment[]
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };
  const handleAddComment = async (postId: string) => {
    if (!isConnected || !fullAddress) {
      toast({
        title: 'Connect wallet',
        description: 'Please connect your wallet to comment',
        variant: 'destructive'
      });
      return;
    }
    const text = commentText[postId]?.trim();
    if (!text) return;
    try {
      const {
        error
      } = await supabase.from('feed_comments').insert({
        post_id: postId,
        wallet_address: fullAddress,
        comment_text: text
      });
      if (error) throw error;
      setCommentText(prev => ({
        ...prev,
        [postId]: ''
      }));
      await loadComments(postId);
      loadPosts(); // Refresh to update comment count
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Failed to add comment',
        variant: 'destructive'
      });
    }
  };
  const toggleLike = async (postId: string) => {
    if (!isConnected || !fullAddress) {
      toast({
        title: 'Connect wallet',
        description: 'Please connect your wallet to like posts',
        variant: 'destructive'
      });
      return;
    }
    const isLiked = likedPosts.has(postId);
    try {
      if (isLiked) {
        await supabase.from('feed_likes').delete().eq('post_id', postId).eq('wallet_address', fullAddress);
        setLikedPosts(prev => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      } else {
        await supabase.from('feed_likes').insert({
          post_id: postId,
          wallet_address: fullAddress
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
  return <>
      <Header />
      <Navigation />
      <StoriesBar />
      <div className="min-h-screen bg-background pt-20 md:pt-32 pb-24 md:pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 glitch-text">GLTCH Feed</h1>
            <p className="text-muted-foreground">Decentralized social feed on IPFS</p>
          </div>

          {/* Post Creator */}
          {isConnected && <Card className="p-4 md:p-6 space-y-4 bg-card/50 backdrop-blur-sm border-tech-border max-w-2xl mx-auto">
              <Textarea placeholder="What's on your mind?" value={contentText} onChange={e => setContentText(e.target.value)} className="min-h-[100px] resize-none" />

              {mediaPreview && <div className="relative">
                  <img src={mediaPreview} alt="Preview" className="max-h-64 rounded-lg mx-auto" />
                  <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => {
              setMediaFile(null);
              setMediaPreview(null);
            }}>
                    Remove
                  </Button>
                </div>}

              <div className="flex gap-2">
                <Input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden" id="media-upload" />
                <label htmlFor="media-upload">
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Add Media
                    </span>
                  </Button>
                </label>

                <Button onClick={handlePost} disabled={posting || !contentText && !mediaFile} className="ml-auto">
                  <Send className="w-4 h-4 mr-2" />
                  {posting ? 'Posting to IPFS...' : 'Post'}
                </Button>
              </div>
            </Card>}

          {/* Feed */}
          <div className="max-w-2xl mx-auto space-y-4">
            {loading ? <div className="text-center py-8 text-muted-foreground">Loading feed...</div> : posts.length === 0 ? <div className="text-center py-8 text-muted-foreground">
                No posts yet. Be the first to post!
              </div> : posts.map(post => <Card key={post.id} className="p-4 bg-card/50 backdrop-blur-sm border-tech-border flex flex-col">
                  {/* Post Header */}
                  <div className="flex items-center gap-2 mb-3">
                    {post.profiles?.avatar_cid ? <img src={getIPFSGatewayUrl(post.profiles.avatar_cid)} alt="Avatar" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary text-xs">
                          {post.profiles?.artist_name?.[0] || '?'}
                        </span>
                      </div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate flex items-center gap-1">
                        {post.profiles?.artist_name || `${post.wallet_address.slice(0, 6)}...${post.wallet_address.slice(-4)}`}
                        {post.profiles?.verified && (
                          <CheckCircle className="h-3.5 w-3.5 text-neon-green flex-shrink-0" aria-label="Verified artist" />
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTimeAgo(post.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  {post.content_text && <p className="mb-3 text-sm whitespace-pre-wrap line-clamp-6">{post.content_text}</p>}

                  {/* Post Media */}
                  {post.media_cid && <div className="mb-3 rounded-lg overflow-hidden">
                      {post.media_type === 'image' ? <img src={getIPFSGatewayUrl(post.media_cid)} alt="Post media" className="w-full max-h-[600px] object-contain bg-black/5 rounded-lg" /> : post.media_type === 'video' ? <video src={getIPFSGatewayUrl(post.media_cid)} controls className="w-full max-h-[600px] object-contain rounded-lg" /> : null}
                    </div>}

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 pt-3 mt-auto border-t border-border">
                    <LikeButton songId={post.id} initialLikeCount={post.like_count} size="sm" showCount={true} />

                    <button onClick={() => toggleComments(post.id)} className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comment_count}</span>
                    </button>

                    <button className="flex items-center gap-1.5 text-xs hover:text-primary transition-colors ml-auto">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedComments.has(post.id) && <div className="pt-4 mt-4 border-t border-border space-y-4">
                      {/* Add Comment */}
                      {isConnected && <div className="flex gap-2">
                          <Input placeholder="Add a comment..." value={commentText[post.id] || ''} onChange={e => setCommentText(prev => ({
                  ...prev,
                  [post.id]: e.target.value
                }))} onKeyPress={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(post.id);
                  }
                }} className="flex-1" />
                          <Button size="sm" onClick={() => handleAddComment(post.id)} disabled={!commentText[post.id]?.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>}

                      {/* Comments List */}
                      <div className="space-y-3">
                        {comments[post.id]?.map(comment => <div key={comment.id} className="flex gap-3">
                            {comment.profiles?.avatar_cid ? <img src={getIPFSGatewayUrl(comment.profiles.avatar_cid)} alt="Avatar" className="w-8 h-8 rounded-full object-cover flex-shrink-0" /> : <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                <span className="text-primary text-xs">
                                  {comment.profiles?.artist_name?.[0] || '?'}
                                </span>
                              </div>}
                            <div className="flex-1">
                              <p className="text-sm font-semibold flex items-center gap-1">
                                {comment.profiles?.artist_name || `${comment.wallet_address.slice(0, 6)}...${comment.wallet_address.slice(-4)}`}
                                {comment.profiles?.verified && (
                                  <CheckCircle className="h-3 w-3 text-neon-green flex-shrink-0" aria-label="Verified artist" />
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">{comment.comment_text}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatTimeAgo(comment.created_at)}
                              </p>
                            </div>
                          </div>)}
                      </div>
                    </div>}
                </Card>)}
          </div>
        </div>
      </div>
    </>;
}