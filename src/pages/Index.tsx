import React from "react";
import Header from "@/components/Header";
import NetworkInfo from "@/components/NetworkInfo";
import Navigation from "@/components/Navigation";
import SearchBar from "@/components/SearchBar";
import LiveStream from "@/components/LiveStream";
import TrendingArtists from "@/components/TrendingArtists";
import TopSongs from "@/components/TopSongs";
import AudioPlayer from "@/components/AudioPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const Index = () => {
  const [activeTab, setActiveTab] = React.useState("DISCOVER");
  const { currentSong, isPlaying, playSong, togglePlayPause, onSongEnd } = useAudioPlayer();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <NetworkInfo />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <SearchBar />
      <LiveStream />
      <TrendingArtists />
      <TopSongs 
        onPlaySong={playSong}
        currentSong={currentSong}
        isPlaying={isPlaying}
      />
      
      {/* Audio Player */}
      <AudioPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onSongEnd={onSongEnd}
      />
    </div>
  );
};

export default Index;