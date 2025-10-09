import React, { useRef } from "react";
import { useWallet } from "@/hooks/useWallet";
import Header from "@/components/Header";
import NetworkInfo from "@/components/NetworkInfo";
import Navigation from "@/components/Navigation";
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
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <LandingHero />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20 flex flex-col overflow-x-hidden">
      <Header />
      <NetworkInfo />
      <div className="flex items-center justify-between px-4 py-2">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        {onToggleRadio && (
          <RadioToggle 
            isRadioMode={isRadioMode || false} 
            onToggle={onToggleRadio}
          />
        )}
      </div>
      <div className="flex-1 w-full overflow-x-hidden">
        <div className="flex items-center justify-center py-3">
          <MusicBars bars={8} className="h-6" />
        </div>
        <SearchBar />
        <StoriesBar />
        <TrendingArtists />
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
};

export default Index;