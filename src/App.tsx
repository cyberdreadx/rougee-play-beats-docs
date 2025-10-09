import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Web3Provider from "@/providers/Web3Provider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useRadioPlayer } from "@/hooks/useRadioPlayer";
import { AdDisplay } from "@/components/AdDisplay";
import { useState } from "react";
import AudioPlayer from "@/components/AudioPlayer";
import Footer from "@/components/Footer";
import Index from "./pages/Index";
import Trending from "./pages/Trending";
import Upload from "./pages/Upload";
import Artist from "./pages/Artist";
import ProfileEdit from "./pages/ProfileEdit";
import BecomeArtist from "./pages/BecomeArtist";
import Wallet from "./pages/Wallet";
import SongTrade from "./pages/SongTrade";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const AppContent = () => {
  const radioPlayer = useRadioPlayer();
  const [showAdModal, setShowAdModal] = useState(false);

  return (
    <>
      {radioPlayer.currentAd && (
        <AdDisplay 
          ad={radioPlayer.currentAd} 
          isOpen={!!radioPlayer.currentAd}
          onClose={() => setShowAdModal(false)}
        />
      )}

      <Routes>
        <Route 
          path="/" 
          element={
            <Index 
              playSong={() => {}} 
              currentSong={radioPlayer.currentSong} 
              isPlaying={radioPlayer.isPlaying}
              isRadioMode={radioPlayer.isRadioMode}
              onToggleRadio={() => {
                if (radioPlayer.isRadioMode) {
                  radioPlayer.stopRadio();
                } else {
                  radioPlayer.startRadio();
                }
              }}
            />
          } 
        />
        <Route path="/trending" element={<Trending />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/become-artist" element={<BecomeArtist />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/artist/:walletAddress" element={<Artist playSong={() => {}} currentSong={radioPlayer.currentSong} isPlaying={radioPlayer.isPlaying} />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/song/:songId" element={<SongTrade playSong={() => {}} currentSong={radioPlayer.currentSong} isPlaying={radioPlayer.isPlaying} />} />
        <Route path="/admin" element={<Admin />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <AudioPlayer 
        currentSong={radioPlayer.currentSong}
        currentAd={radioPlayer.currentAd}
        isPlaying={radioPlayer.isPlaying}
        onPlayPause={radioPlayer.togglePlayPause}
        onSongEnd={radioPlayer.onMediaEnd}
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
