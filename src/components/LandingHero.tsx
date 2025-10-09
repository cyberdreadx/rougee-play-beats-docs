import { Button } from "@/components/ui/button";
import { Shield, TrendingUp, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import WalletButton from "@/components/WalletButton";

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 bg-gradient-to-b from-background via-background/95 to-background">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-16">
        <div className="mb-4 flex justify-center">
          <img src={logo} alt="ROUGEE.PLAY Logo" className="w-12 h-12 rounded-full object-cover border border-primary/20" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          ROUGEE.PLAY
        </h1>
        
        <p className="text-xs md:text-sm text-muted-foreground mb-6 max-w-2xl mx-auto">
          The decentralized music platform where artists own their content and fans discover amazing beats
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="w-full sm:w-auto">
            <WalletButton />
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs px-4 py-2 w-full sm:w-auto"
            onClick={() => navigate("/trending")}
          >
            Explore Music
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-all">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Decentralized Storage</h3>
          <p className="text-muted-foreground text-xs">
            Your music is stored on IPFS via Lighthouse, ensuring permanent and censorship-resistant hosting
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-all">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
            <Music className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Artist Ownership</h3>
          <p className="text-muted-foreground text-xs">
            Artists maintain full ownership of their content with verified profiles and direct fan connections
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-3 hover:border-primary/50 transition-all">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-semibold mb-1">Copyright Protection</h3>
          <p className="text-muted-foreground text-xs">
            Built-in ACRCloud scanning ensures all uploaded music respects copyright and platform rules
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold text-primary mb-1">100%</div>
          <div className="text-[10px] text-muted-foreground">Artist Ownership</div>
        </div>
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold text-primary mb-1">Decentralized</div>
          <div className="text-[10px] text-muted-foreground">IPFS Storage</div>
        </div>
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold text-primary mb-1">24/7</div>
          <div className="text-[10px] text-muted-foreground">Stories & Updates</div>
        </div>
        <div className="text-center">
          <div className="text-lg md:text-xl font-bold text-primary mb-1">Protected</div>
          <div className="text-[10px] text-muted-foreground">Copyright Safe</div>
        </div>
      </div>
    </div>
  );
}