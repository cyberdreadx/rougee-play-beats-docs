import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWallet } from "@/hooks/useWallet";

interface LikeButtonProps {
  songId: string;
  initialLikeCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
}

export default function LikeButton({ 
  songId, 
  initialLikeCount = 0, 
  size = "md",
  showCount = true 
}: LikeButtonProps) {
  const { isConnected, fullAddress: address, connect } = useWallet();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isConnected && address) {
      checkIfLiked();
      fetchLikeCount();
    }
  }, [songId, isConnected, address]);

  const checkIfLiked = async () => {
    if (!address) return;

    try {
      const { data, error } = await supabase
        .from('feed_likes')
        .select('id')
        .eq('wallet_address', address)
        .eq('post_id', songId)
        .maybeSingle();

      if (error) throw error;
      setIsLiked(!!data);
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const fetchLikeCount = async () => {
    try {
      const { count, error } = await supabase
        .from('feed_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', songId);

      if (error) throw error;
      setLikeCount(count || 0);
    } catch (error) {
      console.error('Error fetching like count:', error);
    }
  };

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isConnected) {
      toast.error("Log in to like songs");
      connect();
      return;
    }

    if (!address) {
      toast.error("Setting up your wallet... please try again in a moment");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('like-song', {
        body: { 
          songId, 
          action: isLiked ? 'unlike' : 'like',
          walletAddress: address.toLowerCase(),
        },
      });

      if (error) throw error;

      setIsLiked(!isLiked);
      setLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast.error("Failed to update like");
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLike}
        disabled={isLoading}
        className={`${sizeClasses[size]} rounded-full transition-all hover:scale-110 ${
          isLiked 
            ? 'bg-pink-500/20 hover:bg-pink-500/30 border-2 border-pink-500' 
            : 'bg-muted/50 hover:bg-muted border-2 border-transparent hover:border-pink-500/50'
        }`}
      >
        <Heart 
          size={iconSizes[size]}
          className={`transition-colors ${
            isLiked ? 'fill-pink-500 text-pink-500' : 'text-muted-foreground'
          }`}
        />
      </Button>
      {showCount && (
        <span className="font-mono text-sm text-muted-foreground min-w-[30px]">
          {likeCount}
        </span>
      )}
    </div>
  );
}