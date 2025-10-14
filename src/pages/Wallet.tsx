import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useFundWallet } from "@privy-io/react-auth";
import { useIPLogger } from "@/hooks/useIPLogger";
import { useTokenPrices } from "@/hooks/useTokenPrices";
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
  const { prices, calculateUsdValue } = useTokenPrices();
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
  const [songTokens, setSongTokens] = useState<any[]>([]);
  const [loadingSongTokens, setLoadingSongTokens] = useState(false);

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
      fetchSongTokenBalances();
    }
  }, [fullAddress]);
  
  const fetchSongTokenBalances = async () => {
    if (!fullAddress) return;
    
    setLoadingSongTokens(true);
    try {
      // Get all deployed songs with token addresses
      const { data: songs, error } = await supabase
        .from('songs')
        .select('id, title, artist, ticker, token_address, cover_cid')
        .not('token_address', 'is', null);
        
      if (error) throw error;
      
      if (!songs || songs.length === 0) {
        setSongTokens([]);
        return;
      }
      
      const BONDING_CURVE_ADDRESS = '0xCeE9c18C448487a1deAac3E14974C826142C50b5';
      
      // For each song, check balance and get current price
      const tokensWithBalances = await Promise.all(
        songs.map(async (song) => {
          try {
            // Get user balance
            const balanceResponse = await fetch(`https://base-mainnet.g.alchemy.com/v2/24-aCNa8b19h_zgsR_292`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [{
                  to: song.token_address,
                  data: `0x70a08231000000000000000000000000${fullAddress.slice(2)}` // balanceOf(address)
                }, 'latest']
              })
            });
            
            const balanceResult = await balanceResponse.json();
            const balance = balanceResult.result ? BigInt(balanceResult.result) : 0n;
            const balanceFormatted = Number(balance) / 1e18;
            
            if (balanceFormatted === 0) {
              return { ...song, balance: 0, hasBalance: false };
            }
            
            // Get total supply (includes all tokens in circulation)
            const supplyResponse = await fetch(`https://base-mainnet.g.alchemy.com/v2/24-aCNa8b19h_zgsR_292`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 2,
                method: 'eth_call',
                params: [{
                  to: song.token_address,
                  data: `0x18160ddd` // totalSupply()
                }, 'latest']
              })
            });
            
            const supplyResult = await supplyResponse.json();
            const totalSupply = supplyResult.result || '0x0';
            
            console.log(`📊 ${song.ticker} Total Supply:`, {
              totalSupplyHex: totalSupply,
              totalSupplyFormatted: totalSupply !== '0x0' ? Number(BigInt(totalSupply)) / 1e18 : 0
            });
            
            // Get current price from bonding curve (XRGE per token)
            const priceResponse = await fetch(`https://base-mainnet.g.alchemy.com/v2/24-aCNa8b19h_zgsR_292`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 3,
                method: 'eth_call',
                params: [{
                  to: BONDING_CURVE_ADDRESS,
                  data: `0x81c6f11b000000000000000000000000${song.token_address.slice(2)}` // getCurrentPrice(songToken)
                }, 'latest']
              })
            });
            
            const priceResult = await priceResponse.json();
            console.log(`🔍 ${song.ticker} Price result:`, priceResult);
            
            // Price is in XRGE per token (wei)
            const priceInXRGE = priceResult.result ? Number(BigInt(priceResult.result)) / 1e18 : 0;
            
            // Apply 3% sell fee (bonding curve charges 3% on sells)
            const priceAfterFee = priceInXRGE * 0.97;
            
            // Calculate total XRGE output for user's balance
            const xrgeOutput = balanceFormatted * priceAfterFee;
            
            // Convert XRGE to USD using DEXScreener price
            const valueInUSD = xrgeOutput * prices.xrge;
            const priceInUSD = priceAfterFee * prices.xrge;
            
            console.log(`💰 ${song.ticker} Detailed Calculation:`, {
              tokenBalance: balanceFormatted,
              pricePerTokenXRGE: priceInXRGE,
              priceAfter3percentFee: priceAfterFee,
              totalXRGEOutput: xrgeOutput,
              xrgeUsdPrice: prices.xrge,
              pricePerTokenUSD: priceInUSD,
              totalValueUSD: valueInUSD,
              calculation: `${balanceFormatted} tokens × ${priceAfterFee} XRGE × $${prices.xrge} = $${valueInUSD}`
            });
            
            // Get 24h price change from actual trading events
            let priceChange24h = 0;
            try {
              const currentBlock = await fetch(`https://base-mainnet.g.alchemy.com/v2/24-aCNa8b19h_zgsR_292`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 4,
                  method: 'eth_blockNumber',
                  params: []
                })
              }).then(r => r.json()).then(r => parseInt(r.result, 16));
              
              // Base has ~2 second block time, so 24h = ~43,200 blocks
              const blocksIn24h = 43200;
              const fromBlock = Math.max(0, currentBlock - blocksIn24h);
              
              // Fetch buy events from last 24h
              const buyLogsResponse = await fetch(`https://base-mainnet.g.alchemy.com/v2/24-aCNa8b19h_zgsR_292`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 5,
                  method: 'eth_getLogs',
                  params: [{
                    address: BONDING_CURVE_ADDRESS,
                    topics: [
                      '0xed2139962991808c7844aa6ae143213c450f46fdaf87a70e49578f8e07e4565d', // SongTokenBought event
                      null,
                      `0x000000000000000000000000${song.token_address.slice(2).toLowerCase()}`
                    ],
                    fromBlock: `0x${fromBlock.toString(16)}`,
                    toBlock: 'latest'
                  }]
                })
              });
              
              const buyLogsResult = await buyLogsResponse.json();
              const buyLogs = buyLogsResult.result || [];
              
              if (buyLogs.length > 0) {
                // Get the oldest trade (24h ago) to calculate price change
                const oldestTrade = buyLogs[0];
                const xrgeSpent = BigInt(oldestTrade.data.slice(0, 66));
                const tokensBought = BigInt('0x' + oldestTrade.data.slice(66, 130));
                
                if (tokensBought > 0n) {
                  const priceAt24hAgo = Number(xrgeSpent) / Number(tokensBought);
                  
                  if (priceInXRGE > 0 && priceAt24hAgo > 0) {
                    priceChange24h = ((priceInXRGE - priceAt24hAgo) / priceAt24hAgo) * 100;
                  }
                }
              }
            } catch (err) {
              console.error('Error calculating 24h price change:', err);
              priceChange24h = 0;
            }
            
            return {
              ...song,
              balance: balanceFormatted,
              hasBalance: true,
              priceInXRGE,
              priceInUSD,
              valueInUSD,
              priceChange24h
            };
          } catch (err) {
            console.error(`Error fetching data for ${song.title}:`, err);
            return { ...song, balance: 0, hasBalance: false };
          }
        })
      );
      
      // Only show tokens where user has a balance
      const ownedTokens = tokensWithBalances.filter(t => t.hasBalance);
      setSongTokens(ownedTokens);
      
    } catch (error) {
      console.error('Error fetching song tokens:', error);
    } finally {
      setLoadingSongTokens(false);
    }
  };

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
    await Promise.all([refetchBalance(), refetchXrge(), refetchKta(), checkArtistToken(), fetchSongTokenBalances()]);
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
            <p className="text-xs text-muted-foreground font-mono mb-1">KEETA Token Balance</p>
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
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold font-mono text-foreground">My Song Tokens</h2>
              {songTokens.length > 0 && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  Total Value: ${songTokens.reduce((sum, t) => sum + (t.valueInUSD || 0), 0).toFixed(2)}
                </p>
              )}
            </div>
            <Badge variant="outline" className="border-neon-green/50 text-neon-green font-mono">
              {songTokens.length}
            </Badge>
          </div>
          
          {loadingSongTokens ? (
            <div className="text-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-neon-green mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-mono">Loading your music collection...</p>
            </div>
          ) : songTokens.length === 0 ? (
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
              {songTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors border border-border cursor-pointer"
                  onClick={() => navigate(`/song/${token.id}`)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {token.cover_cid ? (
                      <img
                        src={`https://gateway.pinata.cloud/ipfs/${token.cover_cid}`}
                        alt={token.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-neon-green/10 flex items-center justify-center">
                        <span className="text-xs font-mono font-bold text-neon-green">
                          {token.ticker?.[0] || '?'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold font-mono truncate">{token.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground font-mono">{token.ticker || 'Unknown'}</p>
                        {token.priceChange24h !== undefined && token.priceChange24h !== 0 && (
                          <span className={`text-xs font-mono font-bold ${token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {token.priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(token.priceChange24h).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-neon-green">
                      {token.balance.toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {token.valueInUSD ? `$${token.valueInUSD.toFixed(2)}` : '$0.00'}
                    </p>
                    {token.priceInUSD && (
                      <p className="text-[10px] text-muted-foreground/70 font-mono">
                        ${token.priceInUSD < 0.01 ? token.priceInUSD.toFixed(6) : token.priceInUSD.toFixed(4)}/token
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
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
