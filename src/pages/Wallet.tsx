import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useFundWallet } from "@privy-io/react-auth";
import { useIPLogger } from "@/hooks/useIPLogger";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet as WalletIcon, Copy, Check, CreditCard, ArrowDownToLine, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBalance, useReadContract } from "wagmi";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const { fullAddress, isConnected, isPrivyReady } = useWallet();
  const { fundWallet } = useFundWallet();
  const { logIP } = useIPLogger('wallet_visit');
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [minting, setMinting] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [artistToken, setArtistToken] = useState<any>(null);
  const [tokenForm, setTokenForm] = useState({
    name: '',
    symbol: '',
    supply: '1000000',
  });

  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: fullAddress as `0x${string}`,
  });

  const { data: xrgeBalance, isLoading: xrgeLoading, refetch: refetchXrge } = useReadContract({
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
    // Only redirect if Privy is ready and user is not connected
    if (isPrivyReady && !isConnected) {
      navigate("/");
    }
  }, [isConnected, isPrivyReady, navigate]);

  useEffect(() => {
    if (fullAddress) {
      checkArtistToken();
    }
  }, [fullAddress]);

  const checkArtistToken = async () => {
    if (!fullAddress) return;
    
    const { data, error } = await supabase
      .from('artist_tokens')
      .select('*')
      .eq('wallet_address', fullAddress)
      .maybeSingle();

    if (data) {
      setHasToken(true);
      setArtistToken(data);
    }
  };

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

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBalance(), refetchXrge(), checkArtistToken()]);
    toast({
      title: "Balances refreshed",
      description: "Your wallet balances have been updated",
    });
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleMintToken = async () => {
    if (!fullAddress || !tokenForm.name || !tokenForm.symbol) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setMinting(true);
    try {
      // Log IP for mint action
      await logIP('token_mint');

      const { data, error } = await supabase.functions.invoke('deploy-artist-token', {
        body: {
          tokenName: tokenForm.name,
          tokenSymbol: tokenForm.symbol.toUpperCase(),
          totalSupply: tokenForm.supply,
          walletAddress: fullAddress,
        },
      });

      if (error) throw error;

      toast({
        title: "Token deployed! 🎉",
        description: `${tokenForm.name} (${tokenForm.symbol}) deployed successfully`,
      });

      setShowMintDialog(false);
      setTokenForm({ name: '', symbol: '', supply: '1000000' });
      await checkArtistToken();

    } catch (error) {
      console.error('Mint error:', error);
      toast({
        title: "Deployment failed",
        description: error instanceof Error ? error.message : "Failed to deploy token",
        variant: "destructive",
      });
    } finally {
      setMinting(false);
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-mono mb-1 text-neon-green">MY WALLET</h1>
            <p className="text-sm text-muted-foreground font-mono">Manage your crypto assets and music collection</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="font-mono border-neon-green/50"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            REFRESH
          </Button>
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-mono text-neon-green">Artist Token</h2>
            {!hasToken && (
              <Button
                variant="neon"
                size="sm"
                onClick={() => setShowMintDialog(true)}
                className="font-mono text-xs"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                MINT TOKEN
              </Button>
            )}
          </div>
          
          {hasToken && artistToken ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-neon-green/5 border border-neon-green/20">
                <div>
                  <p className="text-sm font-bold font-mono">{artistToken.token_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">${artistToken.token_symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-mono">Supply</p>
                  <p className="text-sm font-bold font-mono text-neon-green">
                    {parseInt(artistToken.total_supply).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="p-2 rounded bg-background/50">
                <p className="text-xs text-muted-foreground font-mono mb-1">Contract</p>
                <p className="text-xs font-mono break-all">{artistToken.contract_address}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground font-mono mb-2">Create your artist token</p>
              <p className="text-xs text-muted-foreground font-mono">
                One-time opportunity to launch your own token
              </p>
            </div>
          )}
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

      {/* Mint Token Dialog */}
      <Dialog open={showMintDialog} onOpenChange={setShowMintDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl">MINT ARTIST TOKEN</DialogTitle>
            <DialogDescription className="font-mono">
              Create your unique artist token. This is a one-time action.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="token-name" className="font-mono text-sm">Token Name</Label>
              <Input
                id="token-name"
                placeholder="My Artist Token"
                value={tokenForm.name}
                onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                className="font-mono mt-1"
              />
            </div>

            <div>
              <Label htmlFor="token-symbol" className="font-mono text-sm">Symbol</Label>
              <Input
                id="token-symbol"
                placeholder="ART"
                value={tokenForm.symbol}
                onChange={(e) => setTokenForm({ ...tokenForm, symbol: e.target.value.toUpperCase() })}
                maxLength={6}
                className="font-mono mt-1"
              />
            </div>

            <div>
              <Label htmlFor="token-supply" className="font-mono text-sm">Total Supply</Label>
              <Input
                id="token-supply"
                type="number"
                value={tokenForm.supply}
                onChange={(e) => setTokenForm({ ...tokenForm, supply: e.target.value })}
                className="font-mono mt-1"
              />
            </div>

            <Button
              variant="neon"
              onClick={handleMintToken}
              disabled={minting || !tokenForm.name || !tokenForm.symbol}
              className="w-full font-mono"
            >
              {minting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  DEPLOYING...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  DEPLOY TOKEN
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
