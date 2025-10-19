import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/hooks/useWallet";
import { 
  useXRGESwap, 
  useXRGEQuote, 
  useETHQuote, 
  useXRGEApproval,
  useUSDCApproval,
  useKTAApproval,
  useKTAAllowance,
  useXRGEQuoteFromKTA,
  useKTAQuote,
  useXRGEQuoteFromUSDC,
  useUSDCQuote,
  XRGE_TOKEN_ADDRESS,
  KTA_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS
} from "@/hooks/useXRGESwap";
import { useSellSongTokens, useSellQuote, BONDING_CURVE_ADDRESS } from "@/hooks/useSongBondingCurve";
import { ArrowDownUp, Loader2, Info, GripVertical, CreditCard, Music } from "lucide-react";
import { useFundWallet } from "@privy-io/react-auth";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useBalance, useReadContract, usePublicClient } from "wagmi";
import { formatEther, parseUnits, formatUnits, Address } from "viem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import ethLogo from "@/assets/tokens/ethereum-eth.svg";
import ktaLogo from "@/assets/tokens/kta.png";
import usdcLogo from "@/assets/tokens/usdc.jpg";
import xrgeLogo from "@/assets/tokens/xrge.png";
import { supabase } from "@/integrations/supabase/client";
import { getIPFSGatewayUrl } from "@/lib/ipfs";

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

interface SongToken {
  id: string;
  title: string;
  ticker: string;
  token_address: string;
  cover_cid: string | null;
  balance?: bigint;
}

const Swap = () => {
  const navigate = useNavigate();
  const { isConnected, fullAddress, isPrivyReady } = useWallet();
  const { fundWallet } = useFundWallet();
  const publicClient = usePublicClient();
  
  // Core swap state
  const [fromAmount, setFromAmount] = useState("");
  const [fromToken, setFromToken] = useState<string>("ETH");
  const [toToken, setToToken] = useState<string>(XRGE_TOKEN_ADDRESS);
  const [slippage, setSlippage] = useState("5");
  const [chartHeight, setChartHeight] = useState(280);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Song tokens state
  const [songTokens, setSongTokens] = useState<SongToken[]>([]);
  const [loadingSongTokens, setLoadingSongTokens] = useState(false);
  
  const { prices, calculateUsdValue } = useTokenPrices();

  // Swap hooks
  const { 
    buyXRGE, 
    sellXRGE, 
    approveXRGE,
    buyXRGEWithKTA,
    sellXRGEForKTA,
    approveKTA,
    buyXRGEWithUSDC,
    sellXRGEForUSDC,
    approveUSDC,
    isPending, 
    isConfirming, 
    isSuccess, 
    error 
  } = useXRGESwap();

  // Song token sell hooks
  const { sell: sellSong } = useSellSongTokens();
  
  // Helper functions
  const isNativeToken = (tokenValue: string): boolean => {
    return ['ETH', XRGE_TOKEN_ADDRESS, KTA_TOKEN_ADDRESS, USDC_TOKEN_ADDRESS].includes(tokenValue);
  };
  
  const getTokenType = (token: string): 'native' | 'song' => {
    return isNativeToken(token) ? 'native' : 'song';
  };
  
  const getSongToken = (tokenAddress: string): SongToken | undefined => {
    return songTokens.find(t => t.token_address === tokenAddress);
  };

  const flipTokens = () => {
    const tempToken = fromToken;
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount("");
  };
  
  // Determine token types
  const fromTokenType = getTokenType(fromToken);
  const fromSongToken = fromTokenType === 'song' ? getSongToken(fromToken) : undefined;
  
  // Song token sell quote
  const { xrgeOut: songSellQuote, isLoading: songSellQuoteLoading } = useSellQuote(
    fromSongToken?.token_address as Address | undefined,
    fromAmount
  );
  
  // Native token quotes (for buying XRGE)
  const { expectedXRGE: expectedXRGEFromETH, isLoading: isBuyQuoteLoadingETH } = useXRGEQuote(fromToken === 'ETH' ? fromAmount : "0");
  const { expectedXRGE: expectedXRGEFromKTA, isLoading: isBuyQuoteLoadingKTA } = useXRGEQuoteFromKTA(fromToken === KTA_TOKEN_ADDRESS ? fromAmount : "0");
  const { expectedXRGE: expectedXRGEFromUSDC, isLoading: isBuyQuoteLoadingUSDC } = useXRGEQuoteFromUSDC(fromToken === USDC_TOKEN_ADDRESS ? fromAmount : "0");
  
  // Native token quotes (for selling XRGE)
  const { expectedETH, isLoading: isSellQuoteLoadingETH } = useETHQuote(fromToken === XRGE_TOKEN_ADDRESS && toToken === 'ETH' ? fromAmount : "0");
  const { expectedKTA, isLoading: isSellQuoteLoadingKTA } = useKTAQuote(fromToken === XRGE_TOKEN_ADDRESS && toToken === KTA_TOKEN_ADDRESS ? fromAmount : "0");
  const { expectedUSDC, isLoading: isSellQuoteLoadingUSDC } = useUSDCQuote(fromToken === XRGE_TOKEN_ADDRESS && toToken === USDC_TOKEN_ADDRESS ? fromAmount : "0");
  
  // Approval hooks
  const { hasApproval: hasXRGEApproval, refetch: refetchXRGEApproval } = useXRGEApproval(
    fullAddress as any,
    fromToken === XRGE_TOKEN_ADDRESS ? fromAmount : "0"
  );
  
  const { hasApproval: hasUSDCApproval, refetch: refetchUSDCApproval } = useUSDCApproval(
    fullAddress as any,
    fromToken === USDC_TOKEN_ADDRESS ? fromAmount : "0"
  );
  
  const { hasApproval: hasKTAApproval, refetch: refetchKTAApproval } = useKTAApproval(
    fullAddress as any,
    fromToken === KTA_TOKEN_ADDRESS ? fromAmount : "0"
  );
  const { hasApproval: hasKTAAllowance, refetch: refetchKTAAllowance } = useKTAAllowance(
    fullAddress as any,
    fromToken === KTA_TOKEN_ADDRESS ? fromAmount : "0"
  );
  
  const effectiveHasKTAApproval = hasKTAApproval || hasKTAAllowance;
  
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        refetchXRGEApproval();
        refetchUSDCApproval();
        refetchKTAApproval();
        refetchKTAAllowance();
      }, 2000);
    }
  }, [isSuccess, refetchXRGEApproval, refetchUSDCApproval, refetchKTAApproval, refetchKTAAllowance]);

  // Calculate expected output amount based on from/to tokens
  const getExpectedOutput = (): string => {
    if (!fromAmount || Number(fromAmount) <= 0) return "0";
    
    // Song token → XRGE
    if (fromTokenType === 'song' && toToken === XRGE_TOKEN_ADDRESS) {
      return songSellQuote || "0";
    }
    
    // Native → XRGE
    if (toToken === XRGE_TOKEN_ADDRESS) {
      if (fromToken === 'ETH') return expectedXRGEFromETH || "0";
      if (fromToken === KTA_TOKEN_ADDRESS) return expectedXRGEFromKTA || "0";
      if (fromToken === USDC_TOKEN_ADDRESS) return expectedXRGEFromUSDC || "0";
    }
    
    // XRGE → Native
    if (fromToken === XRGE_TOKEN_ADDRESS) {
      if (toToken === 'ETH') return expectedETH || "0";
      if (toToken === KTA_TOKEN_ADDRESS) return expectedKTA || "0";
      if (toToken === USDC_TOKEN_ADDRESS) return expectedUSDC || "0";
    }
    
    return "0";
  };
  
  const isQuoteLoading = 
    (fromTokenType === 'song' && songSellQuoteLoading) ||
    (fromToken === 'ETH' && isBuyQuoteLoadingETH) ||
    (fromToken === KTA_TOKEN_ADDRESS && (isBuyQuoteLoadingKTA || isSellQuoteLoadingKTA)) ||
    (fromToken === USDC_TOKEN_ADDRESS && (isBuyQuoteLoadingUSDC || isSellQuoteLoadingUSDC)) ||
    (fromToken === XRGE_TOKEN_ADDRESS && toToken === 'ETH' && isSellQuoteLoadingETH);
  
  const expectedOutput = getExpectedOutput();

  // Fetch ETH balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: fullAddress as any,
  });

  // Fetch token balances
  const { data: xrgeBalance, refetch: refetchXrgeBalance } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
    query: { enabled: !!fullAddress },
  });

  const { data: xrgeDecimals } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  });
  
  const { data: ktaTokenDecimals } = useReadContract({
    address: KTA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const { data: ktaBalance, refetch: refetchKtaBalance } = useReadContract({
    address: KTA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
    query: { enabled: !!fullAddress },
  });

  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
    query: { enabled: !!fullAddress },
  });

  // Format balances
  const formatTokenBalance = (balance: bigint | undefined, decimals: number = 18) => {
    if (!balance) return "0.00";
    return (Number(balance) / Math.pow(10, decimals)).toFixed(decimals === 6 ? 2 : 4);
  };

  const ethBalanceFormatted = ethBalance ? Number(formatEther(ethBalance.value)).toFixed(6) : "0.000000";
  const xrgeBalanceFormatted = formatTokenBalance(xrgeBalance as bigint | undefined, Number(xrgeDecimals || 18));
  const ktaBalanceFormatted = formatTokenBalance(ktaBalance as bigint | undefined, Number(xrgeDecimals || 18));
  const usdcBalanceFormatted = formatTokenBalance(usdcBalance as bigint | undefined, 6);

  // Fetch user's song tokens
  useEffect(() => {
    const fetchSongTokens = async () => {
      if (!fullAddress || !publicClient) return;
      
      try {
        setLoadingSongTokens(true);
        
        const { data: userSongs, error } = await supabase
          .from('songs')
          .select('id, title, ticker, token_address, cover_cid')
          .eq('wallet_address', fullAddress)
          .not('token_address', 'is', null);

        if (error) throw error;
        
        if (!userSongs || userSongs.length === 0) {
          setSongTokens([]);
          return;
        }

        const songsWithBalance = await Promise.all(
          userSongs.map(async (song) => {
            try {
              const balance = await publicClient.readContract({
                address: song.token_address as Address,
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [fullAddress as Address],
              } as any) as bigint;

              return {
                ...song,
                balance,
              };
            } catch (error) {
              console.error(`Error fetching balance for ${song.ticker}:`, error);
              return {
                ...song,
                balance: BigInt(0),
              };
            }
          })
        );

        const tokensWithBalance = songsWithBalance.filter(song => song.balance > BigInt(0));
        setSongTokens(tokensWithBalance as SongToken[]);
        console.log(`Found ${tokensWithBalance.length} song tokens with balance`);
      } catch (error) {
        console.error('Error fetching song tokens:', error);
      } finally {
        setLoadingSongTokens(false);
      }
    };

    fetchSongTokens();
  }, [fullAddress, publicClient]);

  useEffect(() => {
    if (isPrivyReady && !isConnected) {
      navigate("/");
    }
  }, [isConnected, isPrivyReady, navigate]);

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Swap Successful!",
        description: "Your transaction has been confirmed.",
      });
      setFromAmount("");
      refetchXRGEApproval();
      refetchEthBalance();
      refetchXrgeBalance();
      refetchKtaBalance();
      refetchUsdcBalance();
    }
  }, [isSuccess]);

  useEffect(() => {
    if (error) {
      const message = (error as any)?.shortMessage || (error as Error)?.message || 'Transaction failed';
      toast({ title: 'Transaction Error', description: message, variant: 'destructive' });
    }
  }, [error]);

  // Unified swap handler
  const handleSwap = async () => {
    if (!fromAmount || Number(fromAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    const slippageBps = Number(slippage) * 100;

    // Song token → XRGE (via bonding curve)
    if (fromTokenType === 'song' && toToken === XRGE_TOKEN_ADDRESS) {
      const songToken = getSongToken(fromToken);
      if (!songToken) {
        toast({ title: "Error", description: "Song token not found", variant: "destructive" });
        return;
      }
      toast({ title: `Selling ${songToken.ticker?.toUpperCase()}`, description: "Please confirm the transaction...", });
      try {
        await sellSong(songToken.token_address as Address, fromAmount, "0");
        setFromAmount("");
        toast({ title: "✅ Swap Successful!", description: `Sold ${fromAmount} ${songToken.ticker?.toUpperCase()} for XRGE`, });
      } catch (error) {
        console.error("Song sell error:", error);
      }
      return;
    }

    // Native → XRGE (buying XRGE)
    if (toToken === XRGE_TOKEN_ADDRESS) {
      toast({ title: "Buying XRGE", description: "Please confirm the swap...", });
      try {
        if (fromToken === 'ETH') {
          await buyXRGE(fromAmount, slippageBps);
        } else if (fromToken === KTA_TOKEN_ADDRESS) {
          if (!effectiveHasKTAApproval) {
            toast({ title: "Approval Required", description: "Please approve KTA first", variant: "destructive" });
            return;
          }
          await buyXRGEWithKTA(fromAmount, slippageBps);
        } else if (fromToken === USDC_TOKEN_ADDRESS) {
          if (!hasUSDCApproval) {
            toast({ title: "Approval Required", description: "Please approve USDC first", variant: "destructive" });
            return;
          }
          await buyXRGEWithUSDC(fromAmount, slippageBps);
        }
        setFromAmount("");
      } catch (error) {
        console.error("Buy XRGE error:", error);
      }
      return;
    }

    // XRGE → Native (selling XRGE)
    if (fromToken === XRGE_TOKEN_ADDRESS) {
      if (!hasXRGEApproval) {
        toast({ title: "Approval Required", description: "Please approve XRGE first", variant: "destructive" });
        return;
      }
      toast({ title: "Selling XRGE", description: "Please confirm the swap...", });
      try {
        if (toToken === 'ETH') {
          await sellXRGE(fromAmount, slippageBps);
        } else if (toToken === KTA_TOKEN_ADDRESS) {
          await sellXRGEForKTA(fromAmount, slippageBps);
        } else if (toToken === USDC_TOKEN_ADDRESS) {
          await sellXRGEForUSDC(fromAmount, slippageBps);
        }
        setFromAmount("");
      } catch (error) {
        console.error("Sell XRGE error:", error);
      }
    }
  };

  // Handle approvals
  const handleApprove = async () => {
    if (!fromAmount || Number(fromAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount", variant: "destructive" });
      return;
    }

    try {
      if (fromToken === KTA_TOKEN_ADDRESS) {
        await approveKTA(fromAmount);
        setTimeout(() => Promise.all([refetchKTAApproval(), refetchKTAAllowance()]), 3000);
      } else if (fromToken === USDC_TOKEN_ADDRESS) {
        await approveUSDC(fromAmount);
        setTimeout(() => refetchUSDCApproval(), 3000);
      } else if (fromToken === XRGE_TOKEN_ADDRESS) {
        await approveXRGE(fromAmount);
        setTimeout(() => refetchXRGEApproval(), 3000);
      }
      toast({ title: "✅ Approval Successful", description: "You can now proceed with the swap" });
    } catch (error) {
      console.error("Approval error:", error);
    }
  };
  
  // Chart resize handlers
  const [lastY, setLastY] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setLastY(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setLastY(e.touches[0].clientY);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const delta = e.clientY - lastY;
    const newHeight = Math.max(200, Math.min(800, chartHeight + delta));
    setChartHeight(newHeight);
    setLastY(e.clientY);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - lastY;
    const newHeight = Math.max(200, Math.min(800, chartHeight + delta));
    setChartHeight(newHeight);
    setLastY(e.touches[0].clientY);
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleTouchEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };
  }, [isDragging, chartHeight, lastY]);

  if (!isPrivyReady || !isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-2xl mb-24 md:mb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-mono text-neon-green mb-2">
            [SWAP TOKENS]
          </h1>
          <p className="text-muted-foreground font-mono">
            Swap between native tokens and music tokens
          </p>
        </div>

        {/* DexScreener Chart */}
        <Card className="p-3 md:p-6 bg-card border-tech-border mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="font-mono text-sm md:text-lg font-bold text-neon-green">
              XRGE Price Chart
            </h2>
            <a 
              href={`https://dexscreener.com/base/${XRGE_TOKEN_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-neon-green hover:underline"
            >
              View on DexScreener →
            </a>
          </div>
          <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
            <iframe
              src={`https://dexscreener.com/base/${XRGE_TOKEN_ADDRESS}?embed=1&theme=dark&trades=0&info=0`}
              className="w-full h-full rounded-t-lg border border-tech-border md:rounded-t-xl pointer-events-auto"
              style={{ border: 0 }}
              allowFullScreen
            />
          </div>
          <div
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className={`
              w-full h-10 flex items-center justify-center cursor-ns-resize touch-none
              bg-gradient-to-b from-muted/50 to-transparent
              border-x border-b border-tech-border rounded-b-lg md:rounded-b-xl
              hover:from-primary/20 active:from-primary/30 transition-colors
              ${isDragging ? 'from-primary/30' : ''}
            `}
          >
            <div className="flex flex-col items-center gap-0.5">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-mono">DRAG TO RESIZE</span>
            </div>
          </div>
        </Card>

        {/* Swap Interface */}
        <Card className="p-4 md:p-6 bg-card border-tech-border">
          <div className="space-y-4">
            {/* FROM Section */}
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">FROM</Label>
              <Card className="p-4 bg-muted/30 border-primary/20">
                <div className="space-y-3">
                  <Select value={fromToken} onValueChange={(value: any) => setFromToken(value)}>
                    <SelectTrigger className="font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Native Tokens */}
                      <SelectItem value="ETH" className="font-mono">
                        <div className="flex items-center gap-2">
                          <img src={ethLogo} alt="ETH" className="w-5 h-5" />
                          <span>ETH</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={XRGE_TOKEN_ADDRESS} className="font-mono">
                        <div className="flex items-center gap-2">
                          <img src={xrgeLogo} alt="XRGE" className="w-5 h-5" />
                          <span>XRGE</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={KTA_TOKEN_ADDRESS} className="font-mono">
                        <div className="flex items-center gap-2">
                          <img src={ktaLogo} alt="KTA" className="w-5 h-5" />
                          <span>KTA</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={USDC_TOKEN_ADDRESS} className="font-mono">
                        <div className="flex items-center gap-2">
                          <img src={usdcLogo} alt="USDC" className="w-5 h-5" />
                          <span>USDC</span>
                        </div>
                      </SelectItem>
                      
                      {/* Song Tokens */}
                      {songTokens.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-xs font-mono text-muted-foreground border-t mt-1">
                            Your Music Tokens
                          </div>
                          {songTokens.map((token) => (
                            <SelectItem key={token.token_address} value={token.token_address} className="font-mono">
                              <div className="flex items-center gap-2">
                                {token.cover_cid ? (
                                  <img 
                                    src={getIPFSGatewayUrl(token.cover_cid)} 
                                    alt={token.title} 
                                    className="w-5 h-5 rounded object-cover" 
                                  />
                                ) : (
                                  <Music className="w-5 h-5" />
                                )}
                                <span>${token.ticker}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="font-mono text-2xl h-14 text-right"
                    step="0.000001"
                  />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>Balance: {
                      fromToken === 'ETH' ? ethBalanceFormatted :
                      fromToken === XRGE_TOKEN_ADDRESS ? xrgeBalanceFormatted :
                      fromToken === KTA_TOKEN_ADDRESS ? ktaBalanceFormatted :
                      fromToken === USDC_TOKEN_ADDRESS ? usdcBalanceFormatted :
                      fromTokenType === 'song' && fromSongToken ? formatUnits(fromSongToken.balance || BigInt(0), 18) :
                      '0.00'
                    }</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        if (fromToken === 'ETH') setFromAmount(ethBalanceFormatted);
                        else if (fromToken === XRGE_TOKEN_ADDRESS) setFromAmount(xrgeBalanceFormatted);
                        else if (fromToken === KTA_TOKEN_ADDRESS) setFromAmount(ktaBalanceFormatted);
                        else if (fromToken === USDC_TOKEN_ADDRESS) setFromAmount(usdcBalanceFormatted);
                        else if (fromTokenType === 'song' && fromSongToken) {
                          setFromAmount(formatUnits(fromSongToken.balance || BigInt(0), 18));
                        }
                      }}
                    >
                      MAX
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Flip Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-2 border-primary/30 bg-background hover:bg-primary/10 hover:border-primary/50 hover:rotate-180 transition-all duration-300"
                onClick={flipTokens}
              >
                <ArrowDownUp className="h-5 w-5" />
              </Button>
            </div>

            {/* TO Section */}
            <div className="space-y-2">
              <Label className="font-mono text-xs text-muted-foreground">TO</Label>
              <Card className="p-4 bg-muted/30 border-primary/20">
                <div className="space-y-3">
                  <Select value={toToken} onValueChange={(value: any) => setToToken(value)}>
                    <SelectTrigger className="font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH" className="font-mono">
                        <div className="flex items-center gap-2">
                          <img src={ethLogo} alt="ETH" className="w-5 h-5" />
                          <span>ETH</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={XRGE_TOKEN_ADDRESS} className="font-mono">
                        <div className="flex items-center gap-2">
                          <img src={xrgeLogo} alt="XRGE" className="w-5 h-5" />
                          <span>XRGE</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={KTA_TOKEN_ADDRESS} className="font-mono">
                        <div className="flex items-center gap-2">
                          <img src={ktaLogo} alt="KTA" className="w-5 h-5" />
                          <span>KTA</span>
                        </div>
                      </SelectItem>
                      <SelectItem value={USDC_TOKEN_ADDRESS} className="font-mono">
                        <div className="flex items-center gap-2">
                          <img src={usdcLogo} alt="USDC" className="w-5 h-5" />
                          <span>USDC</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="font-mono text-2xl h-14 flex items-center justify-end pr-3 bg-muted/50 rounded-md border border-input">
                    {isQuoteLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <span className={expectedOutput && Number(expectedOutput) > 0 ? "text-foreground" : "text-muted-foreground"}>
                        {expectedOutput && Number(expectedOutput) > 0 ? Number(expectedOutput).toFixed(6) : '0.0'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span>Balance: {
                      toToken === 'ETH' ? ethBalanceFormatted :
                      toToken === XRGE_TOKEN_ADDRESS ? xrgeBalanceFormatted :
                      toToken === KTA_TOKEN_ADDRESS ? ktaBalanceFormatted :
                      toToken === USDC_TOKEN_ADDRESS ? usdcBalanceFormatted :
                      '0.00'
                    }</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Slippage Setting */}
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-primary/10">
              <Label className="font-mono text-xs text-muted-foreground">Slippage Tolerance</Label>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {["0.5", "1", "5"].map((val) => (
                    <Button
                      key={val}
                      variant={slippage === val ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSlippage(val)}
                      className="font-mono h-7 px-2 text-xs"
                    >
                      {val}%
                    </Button>
                  ))}
                </div>
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="w-16 h-7 text-center font-mono text-xs"
                  step="0.1"
                  min="0.1"
                  max="50"
                />
              </div>
            </div>

            {/* Transaction Guide - Conditional */}
            {fromAmount && Number(fromAmount) > 0 && (
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Info className="h-4 w-4" />
                <AlertDescription className="font-mono text-xs">
                  <div className="space-y-1.5">
                    <div className="font-bold text-blue-400">💡 Transaction Guide:</div>
                    {fromTokenType === 'song' && (
                      <div className="bg-purple-500/10 p-2 rounded border border-purple-500/20">
                        <div className="font-bold text-purple-400">Music Token → XRGE</div>
                        <div>⚡ Bonding curve sale</div>
                        <div>💰 Instant liquidity</div>
                      </div>
                    )}
                    {fromToken === "ETH" && toToken === XRGE_TOKEN_ADDRESS && (
                      <div className="bg-green-500/10 p-2 rounded border border-green-500/20">
                        <div className="font-bold text-green-400">ETH → XRGE</div>
                        <div>⚡ 1 transaction - Direct swap</div>
                        <div>💰 No approval needed</div>
                      </div>
                    )}
                    {fromToken === USDC_TOKEN_ADDRESS && toToken === XRGE_TOKEN_ADDRESS && (
                      <div className="bg-yellow-500/10 p-2 rounded border border-yellow-500/20">
                        <div className="font-bold text-yellow-400">USDC → XRGE</div>
                        <div>⚡ 2 transactions - Approve + swap</div>
                        <div>💰 Standard ERC-20 process</div>
                      </div>
                    )}
                    {fromToken === KTA_TOKEN_ADDRESS && toToken === XRGE_TOKEN_ADDRESS && (
                      <div className="bg-blue-500/10 p-2 rounded border border-blue-500/20">
                        <div className="font-bold text-blue-400">KTA → XRGE</div>
                        <div>⚡ 2 transactions - Approve + swap</div>
                        <div>💰 Standard ERC-20 process</div>
                      </div>
                    )}
                    {fromToken === XRGE_TOKEN_ADDRESS && (
                      <div className="bg-orange-500/10 p-2 rounded border border-orange-500/20">
                        <div className="font-bold text-orange-400">XRGE → {toToken === 'ETH' ? 'ETH' : toToken === KTA_TOKEN_ADDRESS ? 'KTA' : 'USDC'}</div>
                        <div>⚡ 2 transactions - Approve + swap</div>
                        <div>💰 XRGE approval required</div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Approval Button (if needed) */}
            {fromAmount && Number(fromAmount) > 0 && (
              <>
                {fromToken === KTA_TOKEN_ADDRESS && !effectiveHasKTAApproval && toToken === XRGE_TOKEN_ADDRESS && (
                  <Button
                    onClick={handleApprove}
                    disabled={isPending || isConfirming}
                    className="w-full font-mono"
                    variant="outline"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving KTA...
                      </>
                    ) : (
                      "Approve KTA"
                    )}
                  </Button>
                )}
                {fromToken === USDC_TOKEN_ADDRESS && !hasUSDCApproval && toToken === XRGE_TOKEN_ADDRESS && (
                  <Button
                    onClick={handleApprove}
                    disabled={isPending || isConfirming}
                    className="w-full font-mono"
                    variant="outline"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving USDC...
                      </>
                    ) : (
                      "Approve USDC"
                    )}
                  </Button>
                )}
                {fromToken === XRGE_TOKEN_ADDRESS && !hasXRGEApproval && (
                  <Button
                    onClick={handleApprove}
                    disabled={isPending || isConfirming}
                    className="w-full font-mono"
                    variant="outline"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving XRGE...
                      </>
                    ) : (
                      "Approve XRGE"
                    )}
                  </Button>
                )}
              </>
            )}

            {/* SWAP Button */}
            <Button
              onClick={handleSwap}
              disabled={
                !isConnected ||
                !fromAmount ||
                Number(fromAmount) <= 0 ||
                isQuoteLoading ||
                isPending ||
                isConfirming ||
                isProcessing
              }
              className="w-full font-mono text-lg h-14"
              variant="neon"
              size="lg"
            >
              {!isConnected ? (
                "CONNECT WALLET"
              ) : isPending || isConfirming || isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isPending ? "CONFIRM IN WALLET..." : isConfirming ? "PROCESSING..." : "SWAPPING..."}
                </>
              ) : (
                "SWAP"
              )}
            </Button>

            {/* Apple Pay / Fiat Onramp Button */}
            <Button
              onClick={() => {
                if (fullAddress) {
                  fundWallet({ address: fullAddress as `0x${string}` });
                  toast({
                    title: "Opening Fiat Onramp",
                    description: "Buy ETH with Apple Pay, then return to swap!",
                  });
                }
              }}
              className="w-full font-mono bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
              size="lg"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              BUY ETH WITH APPLE PAY
            </Button>
          </div>
        </Card>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-tech-border">
          <p className="font-mono text-xs text-muted-foreground">
            ⚠️ Multi-hop routing via Aerodrome DEX: ETH → KTA → XRGE
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-2">
            Slippage tolerance protects you from price changes during the swap
          </p>
        </div>
      </main>
    </div>
  );
};

export default Swap;
