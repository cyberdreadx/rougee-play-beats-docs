import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Web3Provider from "@/providers/Web3Provider";
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import Artist from "./pages/Artist";
import ProfileEdit from "./pages/ProfileEdit";
import BecomeArtist from "./pages/BecomeArtist";
import NotFound from "./pages/NotFound";

const App = () => (
  <Web3Provider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/become-artist" element={<BecomeArtist />} />
          <Route path="/artist/:walletAddress" element={<Artist />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </Web3Provider>
);

export default App;
