import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useCurrentUserProfile } from "@/hooks/useCurrentUserProfile";
import Header from "@/components/Header";
import NetworkInfo from "@/components/NetworkInfo";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Music, 
  Shield, 
  Coins, 
  Zap, 
  Globe, 
  Users, 
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useEffect } from "react";

const BecomeArtist = () => {
  const navigate = useNavigate();
  const { isConnected, connect } = useWallet();
  const { profile, loading } = useCurrentUserProfile();

  useEffect(() => {
    // If user already has a profile, redirect to profile edit
    if (profile && profile.artist_name) {
      navigate("/profile/edit");
    }
  }, [profile, navigate]);

  const handleGetStarted = () => {
    if (!isConnected) {
      connect();
    } else {
      navigate("/profile/edit");
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Decentralized Ownership",
      description: "Your music lives on IPFS forever. No platform can take it down or delete your content.",
      color: "text-neon-green"
    },
    {
      icon: Coins,
      title: "Unique Artist Ticker",
      description: "Claim your $TICKER symbol - a permanent, tradeable identity on the blockchain.",
      color: "text-blue-500"
    },
    {
      icon: Globe,
      title: "Verifiable on IPFS",
      description: "Every profile, song, and image is cryptographically verified and permanently stored.",
      color: "text-purple-500"
    },
    {
      icon: Users,
      title: "Direct Fan Connection",
      description: "Connect with listeners directly through your wallet address. No middleman.",
      color: "text-yellow-500"
    },
    {
      icon: TrendingUp,
      title: "Trending Algorithm",
      description: "Get discovered by fans through our play-count based trending system.",
      color: "text-pink-500"
    },
    {
      icon: Zap,
      title: "Instant Publishing",
      description: "Upload and publish music to IPFS in seconds. Your songs are live immediately.",
      color: "text-orange-500"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Connect Your Wallet",
      description: "Use any Web3 wallet to authenticate. Your wallet is your artist identity."
    },
    {
      number: "02",
      title: "Create Your Profile",
      description: "Upload cover art, avatar, claim your unique $TICKER, and add your bio."
    },
    {
      number: "03",
      title: "Upload Your Music",
      description: "Publish tracks directly to IPFS. Each song gets a permanent decentralized link."
    },
    {
      number: "04",
      title: "Build Your Fanbase",
      description: "Share your artist profile, get plays, and rise in the trending charts."
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <NetworkInfo />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <Badge className="bg-neon-green/20 text-neon-green border-neon-green font-mono">
            DECENTRALIZED MUSIC PLATFORM
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-mono font-bold neon-text">
            BECOME AN ARTIST
          </h1>
          
          <p className="text-xl text-muted-foreground font-mono max-w-3xl mx-auto">
            Launch your music career on a truly decentralized platform. 
            Own your content, claim your ticker, and connect directly with fans.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button 
              variant="neon" 
              size="lg"
              onClick={handleGetStarted}
              className="font-mono text-lg"
            >
              {!isConnected ? (
                <>
                  CONNECT WALLET
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              ) : (
                <>
                  CREATE PROFILE
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/")}
              className="font-mono text-lg"
            >
              EXPLORE MUSIC
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-mono font-bold neon-text text-center mb-8">
            WHY LAUNCH HERE?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="console-bg tech-border p-6 hover:border-neon-green transition-colors">
                <feature.icon className={`h-10 w-10 mb-4 ${feature.color}`} />
                <h3 className="font-mono font-bold text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-mono font-bold neon-text text-center mb-8">
            HOW IT WORKS
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <Card key={index} className="console-bg tech-border p-6 relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-mono font-bold text-neon-green/10">
                  {step.number}
                </div>
                <div className="relative z-10">
                  <div className="text-2xl font-mono font-bold text-neon-green mb-2">
                    {step.number}
                  </div>
                  <h3 className="font-mono font-bold text-lg mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-mono">
                    {step.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* What You Get */}
        <Card className="console-bg tech-border p-8 mb-16">
          <h2 className="text-3xl font-mono font-bold neon-text text-center mb-8">
            WHAT YOU GET
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-3">
              <CheckCircle2 className="h-6 w-6 text-neon-green flex-shrink-0" />
              <div>
                <h4 className="font-mono font-bold mb-1">Permanent Artist Profile</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  Cover photo, avatar, bio, and social links - all stored on IPFS
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-6 w-6 text-neon-green flex-shrink-0" />
              <div>
                <h4 className="font-mono font-bold mb-1">Unique $TICKER Symbol</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  Claim your 3-10 character ticker - yours forever, tradeable later
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-6 w-6 text-neon-green flex-shrink-0" />
              <div>
                <h4 className="font-mono font-bold mb-1">Unlimited Music Uploads</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  Upload as many tracks as you want - each stored permanently on IPFS
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-6 w-6 text-neon-green flex-shrink-0" />
              <div>
                <h4 className="font-mono font-bold mb-1">Artist Dashboard</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  Track your total plays, songs, and see your trending position
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-6 w-6 text-neon-green flex-shrink-0" />
              <div>
                <h4 className="font-mono font-bold mb-1">Verifiable Authenticity</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  Every upload gets a CID you can verify on IPFS gateways
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <CheckCircle2 className="h-6 w-6 text-neon-green flex-shrink-0" />
              <div>
                <h4 className="font-mono font-bold mb-1">Featured Placement</h4>
                <p className="text-sm text-muted-foreground font-mono">
                  Appear in Trending Artists section based on your play count
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* CTA Section */}
        <Card className="console-bg tech-border p-12 text-center">
          <Music className="h-16 w-16 text-neon-green mx-auto mb-6" />
          <h2 className="text-3xl font-mono font-bold neon-text mb-4">
            READY TO LAUNCH?
          </h2>
          <p className="text-lg text-muted-foreground font-mono mb-8 max-w-2xl mx-auto">
            Join the decentralized music revolution. No gatekeepers, no platform fees, 
            just you and your fans on the blockchain.
          </p>
          <Button 
            variant="neon" 
            size="lg"
            onClick={handleGetStarted}
            className="font-mono text-lg px-8"
          >
            {!isConnected ? (
              <>
                CONNECT WALLET TO START
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                CREATE YOUR ARTIST PROFILE
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default BecomeArtist;
