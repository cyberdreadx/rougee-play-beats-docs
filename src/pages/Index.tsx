import React, { useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NetworkInfo from "@/components/NetworkInfo";
import Navigation from "@/components/Navigation";
import SearchBar from "@/components/SearchBar";
import LiveStream from "@/components/LiveStream";
import TrendingArtists from "@/components/TrendingArtists";
import TopSongs, { TopSongsRef } from "@/components/TopSongs";
import AudioPlayer from "@/components/AudioPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const Index = () => {
  const [activeTab, setActiveTab] = React.useState("DISCOVER");
  const { currentSong, isPlaying, playSong, togglePlayPause, onSongEnd } = useAudioPlayer();
  const topSongsRef = useRef<TopSongsRef>(null);

  const handlePlayCountUpdate = () => {
    topSongsRef.current?.refreshSongs();
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20 flex flex-col">
      <Header />
      <NetworkInfo />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="px-2 md:px-0 flex-1">
        <SearchBar />
        <LiveStream />
        <TrendingArtists />
        <TopSongs 
          ref={topSongsRef}
          onPlaySong={playSong}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayCountUpdate={handlePlayCountUpdate}
        />
      </div>
      
      <Footer />
      
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