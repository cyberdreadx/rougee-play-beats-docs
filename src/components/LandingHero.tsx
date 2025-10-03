import { Button } from "@/components/ui/button";
import { Music, Zap, Shield, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingHero() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 bg-gradient-to-b from-background via-background/95 to-background">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto mb-16">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-primary/10 rounded-full">
            <Music className="w-16 h-16 text-primary" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
          ROUGEE.PLAY
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          The decentralized music platform where artists own their content and fans discover amazing beats
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto">
            <Zap className="w-5 h-5 mr-2" />
            Connect Wallet
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 py-6 w-full sm:w-auto"
            onClick={() => navigate("/trending")}
          >
            Explore Music
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Decentralized Storage</h3>
          <p className="text-muted-foreground">
            Your music is stored on IPFS via Lighthouse, ensuring permanent and censorship-resistant hosting
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Artist Ownership</h3>
          <p className="text-muted-foreground">
            Artists maintain full ownership of their content with verified profiles and direct fan connections
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-all">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Copyright Protection</h3>
          <p className="text-muted-foreground">
            Built-in ACRCloud scanning ensures all uploaded music respects copyright and platform rules
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto w-full">
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
          <div className="text-sm text-muted-foreground">Artist Ownership</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-primary mb-2">Decentralized</div>
          <div className="text-sm text-muted-foreground">IPFS Storage</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
          <div className="text-sm text-muted-foreground">Stories & Updates</div>
        </div>
        <div className="text-center">
          <div className="text-3xl md:text-4xl font-bold text-primary mb-2">Protected</div>
          <div className="text-sm text-muted-foreground">Copyright Safe</div>
        </div>
      </div>
    </div>
  );
}