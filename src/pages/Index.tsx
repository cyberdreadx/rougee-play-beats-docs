import React, { useRef } from "react";
import { useAccount } from "wagmi";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NetworkInfo from "@/components/NetworkInfo";
import Navigation from "@/components/Navigation";
import SearchBar from "@/components/SearchBar";
import TrendingArtists from "@/components/TrendingArtists";
import TopSongs, { TopSongsRef } from "@/components/TopSongs";
import StoriesBar from "@/components/StoriesBar";
import LandingHero from "@/components/LandingHero";

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
}

const Index = ({ playSong, currentSong, isPlaying }: IndexProps) => {
  const [activeTab, setActiveTab] = React.useState("DISCOVER");
  const topSongsRef = useRef<TopSongsRef>(null);
  const { address } = useAccount();

  const handlePlayCountUpdate = () => {
    topSongsRef.current?.refreshSongs();
  };

  // Show landing page for non-connected wallets
  if (!address) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <LandingHero />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20 flex flex-col overflow-x-hidden">
      <Header />
      <NetworkInfo />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 w-full overflow-x-hidden">
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