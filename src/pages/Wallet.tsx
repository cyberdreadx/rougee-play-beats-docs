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
import { Loader2, Wallet as WalletIcon, Copy, Check, CreditCard, ArrowDownToLine, RefreshCw, Sparkles, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBalance, useReadContract, useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseEther, formatEther } from "viem";

const XRGE_TOKEN_ADDRESS = "0x147120faEC9277ec02d957584CFCD92B56A24317" as const;
const KTA_TOKEN_ADDRESS = "0xc0634090F2Fe6c6d75e61Be2b949464aBB498973" as const;

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
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;

const Wallet = () => {
  const navigate = useNavigate();
  const { fullAddress, isConnected, isPrivyReady } = useWallet();
  const { address: accountAddress, chain } = useAccount();
  const { fundWallet } = useFundWallet();
  const { logIP } = useIPLogger('wallet_visit');
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMintDialog, setShowMintDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [minting, setMinting] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [artistToken, setArtistToken] = useState<any>(null);
  const [sendType, setSendType] = useState<'ETH' | 'XRGE' | 'KTA'>('ETH');
  const [tokenForm, setTokenForm] = useState({
    name: '',
    symbol: '',
    supply: '1000000',
  });
  const [sendForm, setSendForm] = useState({
    to: '',
    amount: '',
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

  const { data: ktaBalance, isLoading: ktaLoading, refetch: refetchKta } = useReadContract({
    address: KTA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
  });

  const { data: ktaDecimals } = useReadContract({
    address: KTA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const { sendTransaction, data: ethTxHash, isPending: ethSending, error: ethError } = useSendTransaction();
  const { writeContract, data: tokenTxHash, isPending: tokenSending, error: tokenError } = useWriteContract();
  
  const { isLoading: ethTxLoading, isSuccess: ethTxSuccess } = useWaitForTransactionReceipt({
    hash: ethTxHash,
  });
  
  const { isLoading: tokenTxLoading, isSuccess: tokenTxSuccess } = useWaitForTransactionReceipt({
    hash: tokenTxHash,
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

  const formatKtaBalance = () => {
    if (!ktaBalance || !ktaDecimals) return "0.0000";
    const decimals = Number(ktaDecimals);
    const balance = Number(ktaBalance) / Math.pow(10, decimals);
    return balance.toFixed(4);
  };

  const handleFundWallet = () => {
    if (fullAddress) {
      fundWallet({ address: fullAddress as `0x${string}` });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBalance(), refetchXrge(), refetchKta(), checkArtistToken()]);
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

  const handleSend = async () => {
    if (!sendForm.to || !sendForm.amount) {
      toast({
        title: "Missing information",
        description: "Please enter recipient address and amount",
        variant: "destructive",
      });
      return;
    }

    try {
      if (sendType === 'ETH') {
        sendTransaction({
          to: sendForm.to as `0x${string}`,
          value: parseEther(sendForm.amount),
        });
      } else {
        const tokenAddress = sendType === 'XRGE' ? XRGE_TOKEN_ADDRESS : KTA_TOKEN_ADDRESS;
        const decimals = Number((sendType === 'XRGE' ? xrgeDecimals : ktaDecimals) || 18);
        const amount = BigInt(Math.floor(parseFloat(sendForm.amount) * Math.pow(10, decimals)));
        
        if (!accountAddress || !chain) {
          throw new Error("Wallet not properly connected");
        }
        
        writeContract({
          account: accountAddress,
          chain: chain,
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [sendForm.to as `0x${string}`, amount],
        });
      }
    } catch (error) {
      console.error('Send error:', error);
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Failed to send",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (ethTxSuccess) {
      toast({
        title: "ETH sent successfully! 🎉",
        description: `Sent ${sendForm.amount} ETH to ${sendForm.to.slice(0, 6)}...${sendForm.to.slice(-4)}`,
      });
      setShowSendDialog(false);
      setSendForm({ to: '', amount: '' });
      refetchBalance();
    }
  }, [ethTxSuccess]);

  useEffect(() => {
    if (tokenTxSuccess) {
      toast({
        title: `${sendType} sent successfully! 🎉`,
        description: `Sent ${sendForm.amount} ${sendType} to ${sendForm.to.slice(0, 6)}...${sendForm.to.slice(-4)}`,
      });
      setShowSendDialog(false);
      setSendForm({ to: '', amount: '' });
      if (sendType === 'XRGE') {
        refetchXrge();
      } else {
        refetchKta();
      }
    }
  }, [tokenTxSuccess]);

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
                <p className="text-xs text-muted-foreground font-mono">XRGE Token Balance</p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  {xrgeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
                  ) : (
                    <>
                      <span className="text-2xl font-bold font-mono text-neon-green">
                        {formatXrgeBalance()}
                      </span>
                      <span className="text-sm text-muted-foreground font-mono">XRGE</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-mono mb-1">Connected Wallet</p>
              <div className="flex items-center gap-2">
                <p className="text-xs font-mono font-bold">{formatAddress(fullAddress || "")}</p>
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
              <Badge variant="outline" className="border-neon-green/50 text-neon-green text-xs mt-1">
                Connected
              </Badge>
            </div>
          </div>

          {/* KEETA Balance */}
          <div className="border-t border-border pt-3 mt-3">
            <p className="text-xs text-muted-foreground font-mono mb-1">KEETA Token Balance</p>
            {ktaLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
                <span className="text-sm font-mono text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-neon-green">
                  {formatKtaBalance()}
                </span>
                <span className="text-xs text-muted-foreground font-mono">KTA</span>
              </div>
            )}
          </div>

          {/* ETH Balance */}
          <div className="border-t border-border pt-3 mt-3">
            <p className="text-xs text-muted-foreground font-mono mb-1">Ethereum Balance</p>
            {balanceLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
                <span className="text-sm font-mono text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold font-mono text-neon-green">
                  {balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000"}
                </span>
                <span className="text-xs text-muted-foreground font-mono">ETH</span>
              </div>
            )}
          </div>

          {/* USDC Balance (Placeholder) */}
          <div className="border-t border-border pt-3 mt-3">
            <p className="text-xs text-muted-foreground font-mono mb-1">USDC Token Balance</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-neon-green">0.0000</span>
              <span className="text-xs text-muted-foreground font-mono">USDC</span>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border pt-3 mt-3">
            <p className="text-xs text-muted-foreground font-mono mb-2">Actions</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="neon"
                size="sm"
                onClick={handleFundWallet}
                className="font-mono text-xs"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                BUY CRYPTO
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFundWallet}
                className="font-mono text-xs border-neon-green/50"
              >
                <ArrowDownToLine className="h-3 w-3 mr-1" />
                RECEIVE
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSendDialog(true)}
                className="font-mono text-xs border-neon-green/50"
              >
                <Send className="h-3 w-3 mr-1" />
                SEND
              </Button>
            </div>
          </div>
        </Card>

        {/* Artist Tokens */}
        <Card className="p-4 mb-4 bg-card/50 backdrop-blur border-neon-green/20">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold font-mono text-foreground">Artist Token</h2>
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
          <h2 className="text-base font-bold font-mono mb-3 text-foreground">Purchased Songs</h2>
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

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl">SEND CRYPTO</DialogTitle>
            <DialogDescription className="font-mono">
              Send ETH or XRGE tokens to another wallet
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label className="font-mono text-sm mb-2">Asset Type</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={sendType === 'ETH' ? 'neon' : 'outline'}
                  size="sm"
                  onClick={() => setSendType('ETH')}
                  className="font-mono"
                >
                  ETH
                </Button>
                <Button
                  variant={sendType === 'XRGE' ? 'neon' : 'outline'}
                  size="sm"
                  onClick={() => setSendType('XRGE')}
                  className="font-mono"
                >
                  XRGE
                </Button>
                <Button
                  variant={sendType === 'KTA' ? 'neon' : 'outline'}
                  size="sm"
                  onClick={() => setSendType('KTA')}
                  className="font-mono"
                >
                  KTA
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="send-to" className="font-mono text-sm">Recipient Address</Label>
              <Input
                id="send-to"
                placeholder="0x..."
                value={sendForm.to}
                onChange={(e) => setSendForm({ ...sendForm, to: e.target.value })}
                className="font-mono mt-1"
              />
            </div>

            <div>
              <Label htmlFor="send-amount" className="font-mono text-sm">
                Amount ({sendType})
              </Label>
              <Input
                id="send-amount"
                type="number"
                step="0.0001"
                placeholder="0.0"
                value={sendForm.amount}
                onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                className="font-mono mt-1"
              />
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Available: {sendType === 'ETH' 
                  ? (balance ? parseFloat(balance.formatted).toFixed(4) : '0')
                  : sendType === 'XRGE'
                  ? formatXrgeBalance()
                  : formatKtaBalance()} {sendType}
              </p>
            </div>

            <Button
              variant="neon"
              onClick={handleSend}
              disabled={ethSending || tokenSending || ethTxLoading || tokenTxLoading || !sendForm.to || !sendForm.amount}
              className="w-full font-mono"
            >
              {(ethSending || tokenSending || ethTxLoading || tokenTxLoading) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  SENDING...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  SEND {sendType}
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
