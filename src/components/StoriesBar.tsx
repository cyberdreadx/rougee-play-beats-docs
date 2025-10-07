import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import StoryViewer from "./StoryViewer";
import { Plus } from "lucide-react";
import StoryUpload from "./StoryUpload";
import { useWallet } from "@/hooks/useWallet";
import { getIPFSGatewayUrl } from "@/lib/ipfs";

interface Story {
  id: string;
  wallet_address: string;
  media_path: string;
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
  }, [fullAddress]);

  useEffect(() => {
    const channel = supabase
      .channel('stories-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stories' }, () => fetchStories())
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'stories' }, () => fetchStories())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

    // Add current user's wallet to fetch their profile even if they have no stories
    if (fullAddress) {
      walletAddresses.add(fullAddress);
    }

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
          {/* Current User's Story/Add Button */}
          {fullAddress && (
            <div className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0">
              <div
                onClick={() => {
                  const hasStories = stories[fullAddress!]?.length > 0;
                  hasStories ? setSelectedWallet(fullAddress!) : setShowUpload(true);
                }}
                className="relative w-16 h-16"
              >
                <div className="w-full h-full rounded-full p-[2px] bg-gradient-to-tr from-neon-green/50 via-primary/50 to-neon-green/50">
                  <div className="w-full h-full rounded-full bg-background p-[2px]">
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      {stories[fullAddress]?.length > 0 ? (
                        stories[fullAddress][0].media_type.startsWith('image') ? (
                          <img 
                            src={supabase.storage.from('stories').getPublicUrl(stories[fullAddress][0].media_path).data.publicUrl}
                            alt="Story preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video 
                            src={supabase.storage.from('stories').getPublicUrl(stories[fullAddress][0].media_path).data.publicUrl}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <Avatar className="w-full h-full">
                          <AvatarImage
                            src={
                              profiles[fullAddress]?.avatar_cid
                                ? getIPFSGatewayUrl(profiles[fullAddress].avatar_cid)
                                : undefined
                            }
                          />
                          <AvatarFallback className="bg-primary/20 text-primary">
                            {profiles[fullAddress]?.display_name?.[0]?.toUpperCase() ||
                              fullAddress.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                </div>
                {/* Plus Badge */}
                <div
                  className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-neon-green border-2 border-background flex items-center justify-center z-10"
                  onClick={(e) => { e.stopPropagation(); setShowUpload(true); }}
                  aria-label="Add story"
                  role="button"
                >
                  <Plus className="w-3 h-3 text-background" />
                </div>
              </div>
              <span className="text-xs font-mono">Your Story</span>
            </div>
          )}

          {/* Other Users' Stories */}
          {Object.entries(stories)
            .filter(([walletAddress]) => walletAddress !== fullAddress)
            .map(([walletAddress, userStories]) => {
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
                    <div className="w-full h-full rounded-full overflow-hidden">
                      {userStories[0].media_type.startsWith('image') ? (
                        <img 
                          src={supabase.storage.from('stories').getPublicUrl(userStories[0].media_path).data.publicUrl}
                          alt="Story preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={supabase.storage.from('stories').getPublicUrl(userStories[0].media_path).data.publicUrl}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
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