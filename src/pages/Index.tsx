import React, { useRef } from "react";
import { useWallet } from "@/hooks/useWallet";
import NetworkInfo from "@/components/NetworkInfo";
import SearchBar from "@/components/SearchBar";
import TrendingArtists from "@/components/TrendingArtists";
import TopSongs, { TopSongsRef } from "@/components/TopSongs";
import StoriesBar from "@/components/StoriesBar";
import LandingHero from "@/components/LandingHero";
import MusicBars from "@/components/MusicBars";
import { RadioToggle } from "@/components/RadioToggle";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  wallet_address: string;
  audio_cid: string;
  cover_cid: string | null;
  token_address?: string | null;
  play_count: number;
  created_at: string;
}

interface IndexProps {
  playSong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  isRadioMode?: boolean;
  onToggleRadio?: () => void;
}

const Index = ({ playSong, currentSong, isPlaying, isRadioMode, onToggleRadio }: IndexProps) => {
  const [activeTab, setActiveTab] = React.useState("DISCOVER");
  const topSongsRef = useRef<TopSongsRef>(null);
  const { isConnected } = useWallet();

  const handlePlayCountUpdate = () => {
    topSongsRef.current?.refreshSongs();
  };

  // Show landing page for non-connected wallets
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background flex flex-col pb-24 md:pb-20">
        <LandingHero />
        
        {/* Discovery Sections */}
        <div className="flex-1 w-full overflow-x-hidden space-y-6 pb-8">
          <div className="px-4">
            <h2 className="text-lg font-bold font-mono mb-3 text-primary">
              🔥 TRENDING ARTISTS
            </h2>
          </div>
          <TrendingArtists />
          
          <div className="px-4">
            <h2 className="text-lg font-bold font-mono mb-3 text-primary">
              🎵 TOP SONGS
            </h2>
          </div>
          <TopSongs 
            ref={topSongsRef}
            onPlaySong={playSong}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayCountUpdate={handlePlayCountUpdate}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20 flex flex-col overflow-x-hidden">
      <NetworkInfo />
      <div className="flex items-center justify-between px-4 md:px-6 py-4 gap-3">
        {onToggleRadio && (
          <RadioToggle 
            isRadioMode={isRadioMode || false} 
            onToggle={onToggleRadio}
          />
        )}
      </div>
      <div className="flex-1 w-full overflow-x-hidden">
        <div className="flex items-center justify-center py-3 md:py-4">
          <MusicBars bars={6} className="h-6 md:h-8" />
        </div>
        <div className="px-4 md:px-6">
          <SearchBar />
        </div>
        <div className="px-2 md:px-0">
          <StoriesBar />
        </div>
        <div className="px-2 md:px-0">
          <TrendingArtists />
        </div>
        <div className="px-2 md:px-0">
          <TopSongs 
            ref={topSongsRef}
            onPlaySong={playSong}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlayCountUpdate={handlePlayCountUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;