import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useFundWallet } from "@privy-io/react-auth";
import { useIPLogger } from "@/hooks/useIPLogger";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useSongPrice } from "@/hooks/useSongBondingCurve";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet as WalletIcon, Copy, Check, CreditCard, ArrowDownToLine, RefreshCw, Sparkles, Send, Coins, Zap, Banknote } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useBalance, useReadContract, useSendTransaction, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseEther, formatEther, Address } from "viem";
import xrgeLogo from "@/assets/tokens/xrge.png";
import ktaLogo from "@/assets/tokens/kta.png";

const XRGE_TOKEN_ADDRESS = "0x147120faEC9277ec02d957584CFCD92B56A24317" as const;
const KTA_TOKEN_ADDRESS = "0xc0634090F2Fe6c6d75e61Be2b949464aBB498973" as const;
const USDC_TOKEN_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

// Component for individual song token with real-time price
interface SongTokenItemProps {
  song: {
    id: string;
    title: string;
    artist?: string;
    ticker?: string;
    token_address: string;
    cover_cid?: string;
  };
  userAddress: string;
  xrgeUsdPrice: number;
  onClick: () => void;
}

const SongTokenItem = ({ song, userAddress, xrgeUsdPrice, onClick }: SongTokenItemProps) => {
  const navigate = useNavigate();
  
  // Get user's balance of this token
  const { data: balanceData } = useReadContract({
    address: song.token_address as Address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress as Address],
  });
  
  // Get current price from bonding curve (real-time!)
  const { price: priceInXRGE } = useSongPrice(song.token_address as Address);
  
  const balance = balanceData ? Number(balanceData) / 1e18 : 0;
  const priceXRGE = parseFloat(priceInXRGE) || 0;
  const priceUSD = priceXRGE * xrgeUsdPrice;
  const valueUSD = balance * priceUSD;
  
  // Only render if user has a balance
  if (balance === 0) return null;
  
  return (
    <div
      className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors border border-border cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 flex-1">
        {song.cover_cid ? (
          <img
            src={`https://gateway.pinata.cloud/ipfs/${song.cover_cid}`}
            alt={song.title}
            className="w-10 h-10 rounded object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-neon-green/10 flex items-center justify-center">
            <span className="text-xs font-mono font-bold text-neon-green">
              {song.ticker?.[0] || '?'}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold font-mono truncate">{song.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground font-mono">{song.ticker || 'Unknown'}</p>
          </div>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold font-mono text-neon-green">
          {balance.toLocaleString(undefined, {maximumFractionDigits: 2})}
        </p>
        {valueUSD > 0 ? (
          <>
            <p className="text-xs text-muted-foreground font-mono">
              ${valueUSD.toFixed(2)}
            </p>
            {priceUSD > 0 && (
              <p className="text-[10px] text-muted-foreground/70 font-mono">
                ${priceUSD < 0.01 ? priceUSD.toFixed(6) : priceUSD.toFixed(4)}/token
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground/60 font-mono italic">
            Loading price...
          </p>
        )}
      </div>
    </div>
  );
};

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
  const { prices, calculateUsdValue } = useTokenPrices();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendType, setSendType] = useState<'ETH' | 'XRGE' | 'KTA'>('ETH');
  const [sendForm, setSendForm] = useState({
    to: '',
    amount: '',
  });
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);

  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({
    address: fullAddress as `0x${string}`,
  });

  const { data: xrgeBalance, isLoading: xrgeLoading, refetch: refetchXrge } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!fullAddress,
      refetchInterval: 5000, // Refetch every 5 seconds
    },
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

  const { data: usdcBalance, isLoading: usdcLoading, refetch: refetchUsdc } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
  });

  const { data: usdcDecimals } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
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
      fetchAllSongs();
    }
  }, [fullAddress]);
  
  const fetchAllSongs = async () => {
    if (!fullAddress) return;
    
    setLoadingSongs(true);
    try {
      // Get all deployed songs with token addresses
      const { data: songs, error } = await supabase
        .from('songs')
        .select('id, title, artist, ticker, token_address, cover_cid')
        .not('token_address', 'is', null);
        
      if (error) throw error;
      
      setAllSongs(songs || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
      setAllSongs([]);
    } finally {
      setLoadingSongs(false);
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

  const formatUsdcBalance = () => {
    if (!usdcBalance || !usdcDecimals) return "0.0000";
    const decimals = Number(usdcDecimals);
    const balance = Number(usdcBalance) / Math.pow(10, decimals);
    return balance.toFixed(4);
  };

  const handleFundWallet = () => {
    if (fullAddress) {
      fundWallet({ address: fullAddress as `0x${string}` });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchBalance(), refetchXrge(), refetchKta(), refetchUsdc(), fetchAllSongs()]);
    toast({
      title: "Balances refreshed",
      description: "Your wallet balances have been updated",
    });
    setTimeout(() => setRefreshing(false), 500);
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
              <div className="p-2 rounded-lg bg-neon-green/10 flex items-center justify-center">
                <img src={xrgeLogo} alt="XRGE" className="h-6 w-6 object-contain" />
              </div>
              <div className="flex-1">
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
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  ≈ ${calculateUsdValue(parseFloat(formatXrgeBalance()), 'xrge').toFixed(2)} USD
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-mono text-muted-foreground">{formatAddress(XRGE_TOKEN_ADDRESS)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(XRGE_TOKEN_ADDRESS);
                      toast({
                        title: "Address copied!",
                        description: "XRGE token address copied to clipboard",
                      });
                    }}
                    className="h-4 w-4 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
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
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <img src="/src/assets/tokens/kta.png" alt="KTA" className="h-5 w-5 object-contain" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">KEETA Token Balance</p>
            </div>
            {ktaLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
                <span className="text-sm font-mono text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-neon-green">
                    {formatKtaBalance()}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">KTA</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  ≈ ${calculateUsdValue(parseFloat(formatKtaBalance()), 'kta').toFixed(2)} USD
                </p>
              </>
            )}
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs font-mono text-muted-foreground">{formatAddress(KTA_TOKEN_ADDRESS)}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await navigator.clipboard.writeText(KTA_TOKEN_ADDRESS);
                  toast({
                    title: "Address copied!",
                    description: "KEETA token address copied to clipboard",
                  });
                }}
                className="h-4 w-4 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
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
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-neon-green">
                    {balance ? parseFloat(balance.formatted).toFixed(4) : "0.0000"}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">ETH</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  ≈ ${balance ? calculateUsdValue(parseFloat(balance.formatted), 'eth').toFixed(2) : '0.00'} USD
                </p>
              </>
            )}
          </div>

          {/* USDC Balance */}
          <div className="border-t border-border pt-3 mt-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Coins className="h-5 w-5 text-blue-400" />
              </div>
              <p className="text-xs text-muted-foreground font-mono">USDC Token Balance</p>
            </div>
            {usdcLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-neon-green" />
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono text-neon-green">
                    {formatUsdcBalance()}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">USDC</span>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-0.5">
                  ≈ ${calculateUsdValue(parseFloat(formatUsdcBalance()), 'usdc').toFixed(2)} USD
                </p>
              </>
            )}
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs font-mono text-muted-foreground">{formatAddress(USDC_TOKEN_ADDRESS)}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(USDC_TOKEN_ADDRESS)}
                className="h-5 w-5"
              >
                <Copy className="h-3 w-3" />
              </Button>
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

        {/* Purchased Songs */}
        <Card className="p-4 bg-card/50 backdrop-blur border-neon-green/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold font-mono text-foreground">My Song Tokens</h2>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                Real-time prices from bonding curve
              </p>
            </div>
            <Badge variant="outline" className="border-neon-green/50 text-neon-green font-mono">
              {allSongs.length} songs
            </Badge>
          </div>
          
          {loadingSongs ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-neon-green mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-mono">Loading your music collection...</p>
            </div>
          ) : allSongs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground font-mono mb-2">No song tokens yet</p>
              <p className="text-xs text-muted-foreground font-mono mb-3">
                Buy song tokens to support your favorite artists
              </p>
              <Button
                variant="neon"
                size="sm"
                onClick={() => navigate('/trending')}
                className="font-mono text-xs"
              >
                BROWSE SONGS
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {allSongs.map((song) => (
                <SongTokenItem
                  key={song.id}
                  song={song}
                  userAddress={fullAddress!}
                  xrgeUsdPrice={prices.xrge}
                  onClick={() => navigate(`/song/${song.id}`)}
                />
              ))}
            </div>
          )}
        </Card>
      </main>

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
