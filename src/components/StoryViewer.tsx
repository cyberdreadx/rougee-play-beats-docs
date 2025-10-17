import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft, ChevronRight, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";

interface Story {
  id: string;
  wallet_address: string;
  media_path: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
  view_count?: number;
  like_count?: number;
}

interface StoryViewerProps {
  stories: Story[];
  profile: any;
  onClose: () => void;
  allStories: { [walletAddress: string]: Story[] };
  profiles: { [key: string]: any };
  currentWallet: string;
}

const StoryViewer = ({
  stories,
  profile,
  onClose,
  allStories,
  profiles,
  currentWallet,
}: StoryViewerProps) => {
  const navigate = useNavigate();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [currentWalletAddress, setCurrentWalletAddress] = useState(currentWallet);
  const [progress, setProgress] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const { fullAddress } = useWallet();
  const { toast } = useToast();

  const walletAddresses = Object.keys(allStories);
  const currentWalletIndex = walletAddresses.indexOf(currentWalletAddress);
  const currentStories = allStories[currentWalletAddress];
  const currentStory = currentStories[currentStoryIndex];
  const currentProfile = profiles[currentWalletAddress];

  // Record view when story changes
  useEffect(() => {
    const recordView = async () => {
      if (!fullAddress || !currentStory) return;
      
      try {
        await supabase
          .from('story_views')
          .insert({
            story_id: currentStory.id,
            viewer_wallet_address: fullAddress.toLowerCase()
          });
      } catch (error) {
        // Ignore duplicate errors (user already viewed this story)
        console.log('View already recorded');
      }
    };

    recordView();
  }, [currentStory?.id, fullAddress]);

  // Check if user liked current story and get like count
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!fullAddress || !currentStory) return;
      
      const { data } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', currentStory.id)
        .eq('wallet_address', fullAddress.toLowerCase())
        .maybeSingle();
      
      setHasLiked(!!data);
      setLikeCount(currentStory.like_count || 0);
    };

    checkLikeStatus();
  }, [currentStory?.id, fullAddress]);

  useEffect(() => {
    setProgress(0);
    setVideoDuration(null);
    
    const duration = currentStory.media_type === "video" 
      ? (videoDuration ? videoDuration * 1000 : 15000) 
      : 5000;
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 100 / (duration / 100);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex, currentWalletAddress, videoDuration]);

  const handleNext = () => {
    if (currentStoryIndex < currentStories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentWalletIndex < walletAddresses.length - 1) {
      setCurrentWalletAddress(walletAddresses[currentWalletIndex + 1]);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentWalletIndex > 0) {
      const prevWallet = walletAddresses[currentWalletIndex - 1];
      setCurrentWalletAddress(prevWallet);
      setCurrentStoryIndex(allStories[prevWallet].length - 1);
    }
  };

  const handleLike = async () => {
    if (!fullAddress) {
      toast({
        title: "Login required",
        description: "Please connect your wallet to like stories",
        variant: "destructive",
      });
      return;
    }

    try {
      if (hasLiked) {
        // Unlike
        await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', currentStory.id)
          .eq('wallet_address', fullAddress.toLowerCase());
        
        setHasLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase
          .from('story_likes')
          .insert({
            story_id: currentStory.id,
            wallet_address: fullAddress.toLowerCase()
          });
        
        setHasLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {currentStories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{
                width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? "100%" : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            onClose();
            navigate(`/artist/${currentWalletAddress}`);
          }}
        >
          <Avatar className="w-10 h-10 border-2 border-white">
            <AvatarImage
              src={
                currentProfile?.avatar_cid
                  ? getIPFSGatewayUrl(currentProfile.avatar_cid, undefined, true)
                  : undefined
              }
            />
            <AvatarFallback className="bg-primary/20 text-white">
              {currentProfile?.display_name?.[0]?.toUpperCase() ||
                currentWalletAddress.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">
              {currentProfile?.display_name ||
                `${currentWalletAddress.slice(0, 6)}...${currentWalletAddress.slice(-4)}`}
            </p>
            <p className="text-white/70 text-sm">
              {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Media */}
      <div className="relative w-full h-full flex items-center justify-center">
        {currentStory.media_type === "image" ? (
          <img
            src={supabase.storage.from('stories').getPublicUrl(currentStory.media_path).data.publicUrl}
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <video
            src={supabase.storage.from('stories').getPublicUrl(currentStory.media_path).data.publicUrl}
            autoPlay
            muted
            playsInline
            // iOS Safari inline playback hint
            // @ts-ignore
            webkit-playsinline
            controls={false}
            preload="metadata"
            className="max-h-full max-w-full object-contain"
            onEnded={handleNext}
            onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
          />
        )}

        {/* Caption and Stats */}
        <div className="absolute bottom-20 left-0 right-0 px-8">
          {currentStory.caption && (
            <p className="text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-lg inline-block mb-4">
              {currentStory.caption}
            </p>
          )}
          
          {/* View and Like counts */}
          <div className="flex items-center gap-4 justify-center text-white">
            <div className="flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">{currentStory.view_count || 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-black/50 px-3 py-1 rounded-full">
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-500 text-red-500' : ''}`} />
              <span className="text-sm font-medium">{likeCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Like Button */}
      <div className="absolute bottom-32 right-8 z-10">
        <Button
          variant="ghost"
          size="icon"
          className={`w-14 h-14 rounded-full ${hasLiked ? 'bg-red-500/20' : 'bg-black/50'}`}
          onClick={handleLike}
        >
          <Heart 
            className={`w-7 h-7 ${hasLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
          />
        </Button>
      </div>

      {/* Navigation */}
      <div className="absolute inset-0 flex">
        <div className="flex-1 cursor-pointer" onClick={handlePrevious} />
        <div className="flex-1 cursor-pointer" onClick={handleNext} />
      </div>

      {/* Navigation buttons */}
      {currentWalletIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white"
          onClick={handlePrevious}
        >
          <ChevronLeft className="w-8 h-8" />
        </Button>
      )}
      {currentWalletIndex < walletAddresses.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
          onClick={handleNext}
        >
          <ChevronRight className="w-8 h-8" />
        </Button>
      )}
    </div>
  );
};

export default StoryViewer;