import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useFundWallet } from "@privy-io/react-auth";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet as WalletIcon, Copy, Check, CreditCard, ArrowDownToLine } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBalance, useReadContract } from "wagmi";

const XRGE_TOKEN_ADDRESS = "0x147120faEC9277ec02d957584CFCD92B56A24317" as const;

const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

const Wallet = () => {
  const navigate = useNavigate();
  const { fullAddress, isConnected } = useWallet();
  const { fundWallet } = useFundWallet();
  const [copied, setCopied] = useState(false);

  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: fullAddress as `0x${string}`,
  });

  const { data: xrgeBalance, isLoading: xrgeLoading } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
  });

  const { data: xrgeDecimals } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
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

  const formatXrgeBalance = () => {
    if (!xrgeBalance || !xrgeDecimals) return "0.0000";
    const decimals = Number(xrgeDecimals);
    const balance = Number(xrgeBalance) / Math.pow(10, decimals);
    return balance.toFixed(4);
  };

  const handleFundWallet = () => {
    if (fullAddress) {
      fundWallet({ address: fullAddress as `0x${string}` });
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-mono mb-1 text-neon-green">MY WALLET</h1>
          <p className="text-sm text-muted-foreground font-mono">Manage your crypto assets and music collection</p>
        </div>

        {/* Wallet Overview */}
        <Card className="p-4 mb-4 bg-card/50 backdrop-blur border-neon-green/20">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-neon-green/10">
                <WalletIcon className="h-4 w-4 text-neon-green" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-mono">Connected Wallet</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-mono font-bold">{formatAddress(fullAddress || "")}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-5 w-5 p-0"
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
            <Badge variant="outline" className="border-neon-green/50 text-neon-green text-xs">
              Connected
            </Badge>
          </div>

          {/* ETH Balance */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">Ethereum Balance</p>
            {balanceLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
                <span className="text-sm font-mono text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-neon-green">
                  {balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000"}
                </span>
                <span className="text-sm text-muted-foreground font-mono">ETH</span>
              </div>
            )}
          </div>

          {/* XRGE Balance */}
          <div className="border-t border-border pt-4 mt-4">
            <p className="text-xs text-muted-foreground font-mono mb-1">XRGE Token Balance</p>
            {xrgeLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
                <span className="text-sm font-mono text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono text-neon-green">
                  {formatXrgeBalance()}
                </span>
                <span className="text-sm text-muted-foreground font-mono">XRGE</span>
              </div>
            )}
          </div>

          {/* Funding Actions */}
          <div className="border-t border-border pt-4 mt-4">
            <p className="text-xs text-muted-foreground font-mono mb-3">Add Funds</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="neon"
                size="sm"
                onClick={handleFundWallet}
                className="font-mono text-xs"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                BUY CRYPTO
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFundWallet}
                className="font-mono text-xs border-neon-green/50"
              >
                <ArrowDownToLine className="h-3.5 w-3.5 mr-1.5" />
                RECEIVE
              </Button>
            </div>
          </div>
        </Card>

        {/* Artist Tokens */}
        <Card className="p-4 mb-4 bg-card/50 backdrop-blur border-neon-green/20">
          <h2 className="text-lg font-bold font-mono mb-3 text-neon-green">Artist Tokens</h2>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground font-mono mb-1">No artist tokens yet</p>
            <p className="text-3xl font-bold font-mono text-neon-green">0</p>
          </div>
        </Card>

        {/* Purchased Songs */}
        <Card className="p-4 bg-card/50 backdrop-blur border-neon-green/20">
          <h2 className="text-lg font-bold font-mono mb-3 text-neon-green">Purchased Songs</h2>
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground font-mono mb-1">No songs purchased yet</p>
            <p className="text-3xl font-bold font-mono text-neon-green">0</p>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Wallet;
