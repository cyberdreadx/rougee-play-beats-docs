import React, { useRef } from "react";
import Header from "@/components/Header";
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
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <NetworkInfo />
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="px-4 md:px-0">
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