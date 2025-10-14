import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PostsDebugProps {
  walletAddress: string;
}

export default function PostsDebug({ walletAddress }: PostsDebugProps) {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const debugPosts = async () => {
    setLoading(true);
    try {
      // Get all posts to see what's in the database
      const { data: allPostsData, error: allError } = await supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (allError) throw allError;

      // Get posts for this specific wallet
      const { data: filteredData, error: filteredError } = await supabase
        .from('feed_posts')
        .select('*')
        .ilike('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

      if (filteredError) throw filteredError;

      setAllPosts(allPostsData || []);
      setFilteredPosts(filteredData || []);

      console.log('All posts (last 20):', allPostsData);
      console.log('Filtered posts for wallet:', walletAddress, filteredData);
    } catch (error) {
      console.error('Debug error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      debugPosts();
    }
  }, [walletAddress]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Posts Debug</CardTitle>
        <p className="text-sm text-gray-600">
          Debug post fetching for wallet: {walletAddress}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={debugPosts} disabled={loading}>
          {loading ? 'Debugging...' : 'Debug Posts'}
        </Button>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">All Posts (Last 20):</h3>
            <div className="text-sm text-gray-600">
              Found {allPosts.length} posts total
            </div>
            <div className="max-h-40 overflow-y-auto">
              {allPosts.map((post, index) => (
                <div key={post.id} className="p-2 border rounded mb-2 text-xs">
                  <div><strong>ID:</strong> {post.id}</div>
                  <div><strong>Wallet:</strong> {post.wallet_address}</div>
                  <div><strong>Content:</strong> {post.content_text || 'No text'}</div>
                  <div><strong>Created:</strong> {new Date(post.created_at).toLocaleString()}</div>
                  <div><strong>Matches target?</strong> {post.wallet_address?.toLowerCase() === walletAddress?.toLowerCase() ? '✅' : '❌'}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold">Filtered Posts for {walletAddress}:</h3>
            <div className="text-sm text-gray-600">
              Found {filteredPosts.length} posts
            </div>
            <div className="max-h-40 overflow-y-auto">
              {filteredPosts.map((post, index) => (
                <div key={post.id} className="p-2 border rounded mb-2 text-xs">
                  <div><strong>ID:</strong> {post.id}</div>
                  <div><strong>Wallet:</strong> {post.wallet_address}</div>
                  <div><strong>Content:</strong> {post.content_text || 'No text'}</div>
                  <div><strong>Created:</strong> {new Date(post.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800">Debug Info:</h4>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• Check if posts exist in database</li>
            <li>• Verify wallet address case sensitivity</li>
            <li>• Compare filtered vs all posts</li>
            <li>• Check if posts are being created with correct wallet</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}


