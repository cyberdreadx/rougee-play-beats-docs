import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StoryViewer from "./StoryViewer";
import { Plus } from "lucide-react";
import StoryUpload from "./StoryUpload";
import { useWallet } from "@/hooks/useWallet";

interface Story {
  id: string;
  wallet_address: string;
  media_cid: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
}

interface GroupedStories {
  [walletAddress: string]: Story[];
}

const StoriesBar = () => {
  const { fullAddress } = useWallet();
  const [stories, setStories] = useState<GroupedStories>({});
  const [profiles, setProfiles] = useState<{ [key: string]: any }>({});
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    const { data, error } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stories:", error);
      return;
    }

    // Group stories by wallet address
    const grouped: GroupedStories = {};
    const walletAddresses = new Set<string>();

    data?.forEach((story) => {
      if (!grouped[story.wallet_address]) {
        grouped[story.wallet_address] = [];
      }
      grouped[story.wallet_address].push(story);
      walletAddresses.add(story.wallet_address);
    });

    setStories(grouped);

    // Fetch profiles for these wallets
    if (walletAddresses.size > 0) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .in("wallet_address", Array.from(walletAddresses));

      const profileMap: { [key: string]: any } = {};
      profileData?.forEach((profile) => {
        profileMap[profile.wallet_address] = profile;
      });
      setProfiles(profileMap);
    }
  };

  if (Object.keys(stories).length === 0 && !fullAddress) {
    return null;
  }

  return (
    <>
      <div className="w-full overflow-x-auto pb-4 mb-6">
        <div className="flex gap-4 px-4">
          {/* Add Story Button */}
          {fullAddress && (
            <div className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0">
              <div
                onClick={() => setShowUpload(true)}
                className="w-16 h-16 rounded-full border-2 border-dashed border-neon-green flex items-center justify-center bg-background/50 hover:bg-background transition-all"
              >
                <Plus className="w-6 h-6 text-neon-green" />
              </div>
              <span className="text-xs font-mono">Add Story</span>
            </div>
          )}

          {/* Stories */}
          {Object.entries(stories).map(([walletAddress, userStories]) => {
            const profile = profiles[walletAddress];
            const hasUnviewed = true; // Could track viewed stories in localStorage
            
            return (
              <div
                key={walletAddress}
                className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0"
                onClick={() => setSelectedWallet(walletAddress)}
              >
                <div
                  className={`w-16 h-16 rounded-full p-[2px] ${
                    hasUnviewed
                      ? "bg-gradient-to-tr from-neon-green via-primary to-neon-green"
                      : "bg-border"
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-background p-[2px]">
                    <Avatar className="w-full h-full">
                      <AvatarImage
                        src={
                          profile?.avatar_cid
                            ? getIPFSGatewayUrl(profile.avatar_cid)
                            : undefined
                        }
                      />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {profile?.display_name?.[0]?.toUpperCase() ||
                          walletAddress.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <span className="text-xs font-mono max-w-[80px] truncate">
                  {profile?.display_name ||
                    `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {selectedWallet && (
        <StoryViewer
          stories={stories[selectedWallet]}
          profile={profiles[selectedWallet]}
          onClose={() => setSelectedWallet(null)}
          allStories={stories}
          profiles={profiles}
          currentWallet={selectedWallet}
        />
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowUpload(false)} />
          <div className="relative z-10">
            <StoryUpload />
          </div>
        </div>
      )}
    </>
  );
};

export default StoriesBar;