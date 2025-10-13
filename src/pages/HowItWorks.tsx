import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Music, 
  Coins, 
  ArrowRightLeft, 
  Lock, 
  Upload, 
  TrendingUp,
  Wallet,
  Play,
  Share2
} from "lucide-react";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Wallet,
      title: "1. Connect Your Wallet",
      description: "First, connect your crypto wallet. It's like logging in, but cooler!",
      details: "Click the wallet button → Connect → Done! Your wallet is your account.",
      color: "text-blue-500"
    },
    {
      icon: Music,
      title: "2. Listen to Music",
      description: "Browse and play amazing music from artists around the world.",
      details: "Every song is stored safely on IPFS. No one can delete or censor it!",
      color: "text-purple-500"
    },
    {
      icon: Coins,
      title: "3. Artists Create Tokens",
      description: "When artists upload music, they get special tokens (like digital trading cards).",
      details: "Each song has XRGE tokens. Artists get some, and the rest go to a trading pool.",
      color: "text-green-500"
    },
    {
      icon: ArrowRightLeft,
      title: "4. Trade Tokens",
      description: "You can swap your crypto for XRGE tokens or other tokens.",
      details: "Use ETH, KTA, or USDC to buy XRGE. Trade back anytime you want!",
      color: "text-orange-500"
    },
    {
      icon: TrendingUp,
      title: "5. Support Artists",
      description: "When you buy an artist's tokens, you support them directly.",
      details: "Artists keep 100% ownership of their music. They make money when tokens trade!",
      color: "text-pink-500"
    },
    {
      icon: Share2,
      title: "6. Share & Earn",
      description: "Share music with friends and watch your tokens grow in value.",
      details: "The more popular a song gets, the more valuable its tokens become!",
      color: "text-cyan-500"
    }
  ];

  const features = [
    {
      icon: Lock,
      title: "Copyright Protected",
      description: "Every song is checked for copyright before upload",
      emoji: "🛡️"
    },
    {
      icon: Upload,
      title: "IPFS Storage",
      description: "Music stored forever on decentralized storage",
      emoji: "☁️"
    },
    {
      icon: Coins,
      title: "Token Trading",
      description: "Buy and sell music tokens like digital collectibles",
      emoji: "💎"
    },
    {
      icon: Play,
      title: "Free Listening",
      description: "Listen to all music for free, anytime",
      emoji: "🎵"
    }
  ];

  return (
    <>
      <Helmet>
        <title>How It Works - ROUGEE.PLAY</title>
        <meta name="description" content="Learn how ROUGEE.PLAY works in simple steps. Upload music, trade tokens, and support artists." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        
        <main className="container mx-auto px-4 py-8 mb-20">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              How It Works
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Music + Blockchain = Magic ✨
            </p>
            <p className="text-lg text-muted-foreground mt-2">
              Super simple. No tech knowledge needed!
            </p>
          </div>

          {/* Main Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card 
                  key={index} 
                  className="hover:shadow-lg transition-all duration-300 hover:scale-105 border-2"
                >
                  <CardHeader>
                    <div className={`${step.color} mb-4 flex justify-center`}>
                      <div className="bg-muted rounded-full p-4">
                        <Icon className="h-8 w-8" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{step.title}</CardTitle>
                    <CardDescription className="text-base">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {step.details}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Simple Explanation */}
          <Card className="mb-16 bg-gradient-to-r from-primary/10 to-purple-500/10 border-2">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Think of it like this...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="text-6xl">🎵</div>
              <p className="text-lg">
                <strong>ROUGEE.PLAY</strong> is like Spotify + Trading Cards + Crypto
              </p>
              <div className="grid md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-background rounded-lg">
                  <div className="text-3xl mb-2">🎧</div>
                  <p className="font-semibold">Listen Free</p>
                  <p className="text-sm text-muted-foreground">Like Spotify</p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <div className="text-3xl mb-2">🃏</div>
                  <p className="font-semibold">Collect Tokens</p>
                  <p className="text-sm text-muted-foreground">Like Trading Cards</p>
                </div>
                <div className="p-4 bg-background rounded-lg">
                  <div className="text-3xl mb-2">💰</div>
                  <p className="font-semibold">Trade & Earn</p>
                  <p className="text-sm text-muted-foreground">Like Crypto</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Why It's Awesome</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-all">
                    <CardContent className="pt-6">
                      <div className="text-5xl mb-4">{feature.emoji}</div>
                      <div className="mb-3">
                        <Icon className="h-6 w-6 mx-auto text-primary" />
                      </div>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* FAQ Section */}
          <Card className="mb-16">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Quick Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">💰 What is XRGE?</h3>
                <p className="text-muted-foreground">
                  XRGE is the main token on our platform. Think of it like game coins you can trade for real money!
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">🎵 Can I listen for free?</h3>
                <p className="text-muted-foreground">
                  Yes! All music is 100% free to listen to. You only need tokens if you want to trade and support artists.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">👨‍🎨 How do artists make money?</h3>
                <p className="text-muted-foreground">
                  Artists get tokens when they upload music. When people buy and trade these tokens, artists earn money!
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">🔒 Is my music safe?</h3>
                <p className="text-muted-foreground">
                  Super safe! Music is stored on IPFS (decentralized storage) and protected by blockchain. Nobody can delete or steal it!
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">🆕 Do I need crypto experience?</h3>
                <p className="text-muted-foreground">
                  Nope! If you can use an app, you can use ROUGEE.PLAY. Just connect a wallet and start exploring!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Ready to Start?</h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of music lovers and artists!
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate("/")}
                className="text-lg px-8"
              >
                🎵 Explore Music
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/swap")}
                className="text-lg px-8"
              >
                💱 Start Trading
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/become-artist")}
                className="text-lg px-8"
              >
                🎤 Become Artist
              </Button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default HowItWorks;
