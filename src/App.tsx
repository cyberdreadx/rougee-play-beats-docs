import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Web3Provider from "@/providers/Web3Provider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import AudioPlayer from "@/components/AudioPlayer";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Artist from "./pages/Artist";
import ProfileEdit from "./pages/ProfileEdit";
import BecomeArtist from "./pages/BecomeArtist";
import Wallet from "./pages/Wallet";
import SongTrade from "./pages/SongTrade";
import NotFound from "./pages/NotFound";

const AppContent = () => {
  const { currentSong, isPlaying, playSong, togglePlayPause, onSongEnd } = useAudioPlayer();

  return (
    <>
      <Routes>
        <Route path="/" element={<Index playSong={playSong} currentSong={currentSong} isPlaying={isPlaying} />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/become-artist" element={<BecomeArtist />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/artist/:walletAddress" element={<Artist playSong={playSong} currentSong={currentSong} isPlaying={isPlaying} />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/song/:songId" element={<SongTrade playSong={playSong} currentSong={currentSong} isPlaying={isPlaying} />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <AudioPlayer 
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onSongEnd={onSongEnd}
      />
    </>
  );
};

const App = () => (
  <ThemeProvider>
    <Web3Provider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </Web3Provider>
  </ThemeProvider>
);

export default App;
