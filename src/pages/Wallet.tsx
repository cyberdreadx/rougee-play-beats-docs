import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import Header from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet as WalletIcon, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBalance } from "wagmi";

const Wallet = () => {
  const navigate = useNavigate();
  const { fullAddress, isConnected } = useWallet();
  const [copied, setCopied] = useState(false);

  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: fullAddress as `0x${string}`,
  });

  useEffect(() => {
    if (!isConnected) {
      navigate("/");
    }
  }, [isConnected, navigate]);

  const copyAddress = async () => {
    if (fullAddress) {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      toast({
        title: "Address copied!",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-mono mb-2 text-neon-green">MY WALLET</h1>
          <p className="text-muted-foreground font-mono">Manage your crypto assets and music collection</p>
        </div>

        {/* Wallet Overview */}
        <Card className="p-6 mb-6 bg-card/50 backdrop-blur border-neon-green/20">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-neon-green/10">
                <WalletIcon className="h-6 w-6 text-neon-green" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-mono">Connected Wallet</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono font-bold">{formatAddress(fullAddress || "")}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-neon-green" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="border-neon-green/50 text-neon-green">
              Connected
            </Badge>
          </div>

          {/* ETH Balance */}
          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground font-mono mb-2">Ethereum Balance</p>
            {balanceLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-neon-green" />
                <span className="font-mono text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold font-mono text-neon-green">
                  {balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000"}
                </span>
                <span className="text-xl text-muted-foreground font-mono">ETH</span>
              </div>
            )}
          </div>
        </Card>

        {/* Artist Tokens */}
        <Card className="p-6 mb-6 bg-card/50 backdrop-blur border-neon-green/20">
          <h2 className="text-xl font-bold font-mono mb-4 text-neon-green">Artist Tokens</h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground font-mono mb-2">No artist tokens yet</p>
            <p className="text-5xl font-bold font-mono text-neon-green">0</p>
          </div>
        </Card>

        {/* Purchased Songs */}
        <Card className="p-6 bg-card/50 backdrop-blur border-neon-green/20">
          <h2 className="text-xl font-bold font-mono mb-4 text-neon-green">Purchased Songs</h2>
          <div className="text-center py-8">
            <p className="text-muted-foreground font-mono mb-2">No songs purchased yet</p>
            <p className="text-5xl font-bold font-mono text-neon-green">0</p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Wallet;
