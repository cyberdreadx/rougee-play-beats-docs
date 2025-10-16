import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/useWallet";
import { 
  useXRGESwap, 
  useXRGEQuote, 
  useETHQuote, 
  useXRGEApproval,
  useUSDCApproval,
  useKTAApproval,
  useXRGEQuoteFromKTA,
  useKTAQuote,
  useXRGEQuoteFromUSDC,
  useUSDCQuote,
  XRGE_TOKEN_ADDRESS,
  KTA_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS
} from "@/hooks/useXRGESwap";
import { ArrowDownUp, Loader2, Wallet, Coins, ChevronDown, Info, GripVertical } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useBalance, useReadContract } from "wagmi";
import { formatEther } from "viem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTokenPrices } from "@/hooks/useTokenPrices";

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

const Swap = () => {
  const navigate = useNavigate();
  const { isConnected, fullAddress, isPrivyReady } = useWallet();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [slippage, setSlippage] = useState("5");
  const [selectedToken, setSelectedToken] = useState<"ETH" | "KTA" | "USDC">("ETH");
  const [chartHeight, setChartHeight] = useState(280); // Default mobile height
  const [isDragging, setIsDragging] = useState(false);
  
  const { prices, calculateUsdValue } = useTokenPrices();

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
  
  // ETH quotes
  const { expectedXRGE: expectedXRGEFromETH, isLoading: isBuyQuoteLoadingETH } = useXRGEQuote(buyAmount);
  const { expectedETH, isLoading: isSellQuoteLoadingETH } = useETHQuote(sellAmount);
  
  // KTA quotes
  const { expectedXRGE: expectedXRGEFromKTA, isLoading: isBuyQuoteLoadingKTA } = useXRGEQuoteFromKTA(buyAmount);
  const { expectedKTA, isLoading: isSellQuoteLoadingKTA } = useKTAQuote(sellAmount);
  
  // USDC quotes
  const { expectedXRGE: expectedXRGEFromUSDC, isLoading: isBuyQuoteLoadingUSDC } = useXRGEQuoteFromUSDC(buyAmount);
  const { expectedUSDC, isLoading: isSellQuoteLoadingUSDC } = useUSDCQuote(sellAmount);
  
  const { hasApproval, refetch: refetchApproval } = useXRGEApproval(
    fullAddress as any,
    sellAmount
  );
  
  // Debug approval status
  console.log('🔍 Approval Debug:', {
    hasApproval,
    sellAmount,
    fullAddress,
    isPending,
    isConfirming
  });
  
  const { hasApproval: hasUSDCApproval, refetch: refetchUSDCApproval } = useUSDCApproval(
    fullAddress as any,
    buyAmount
  );
  
  const { hasApproval: hasKTAApproval, refetch: refetchKTAApproval } = useKTAApproval(
    fullAddress as any,
    buyAmount
  );
  
  // Refetch approval status when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      console.log("Transaction successful, refetching approval status...");
      // Wait a bit for blockchain to update
      setTimeout(() => {
        refetchApproval();
        refetchUSDCApproval();
        refetchKTAApproval();
      }, 2000);
    }
  }, [isSuccess, refetchApproval, refetchUSDCApproval, refetchKTAApproval]);

  // Dynamic values based on selected token
  const expectedBuyAmount = selectedToken === "ETH" ? expectedXRGEFromETH 
    : selectedToken === "KTA" ? expectedXRGEFromKTA 
    : expectedXRGEFromUSDC;
  
  const expectedSellAmount = selectedToken === "ETH" ? expectedETH 
    : selectedToken === "KTA" ? expectedKTA 
    : expectedUSDC;
  
  const isBuyQuoteLoading = selectedToken === "ETH" ? isBuyQuoteLoadingETH 
    : selectedToken === "KTA" ? isBuyQuoteLoadingKTA 
    : isBuyQuoteLoadingUSDC;
  
  const isSellQuoteLoading = selectedToken === "ETH" ? isSellQuoteLoadingETH 
    : selectedToken === "KTA" ? isSellQuoteLoadingKTA 
    : isSellQuoteLoadingUSDC;

  // Fetch ETH balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: fullAddress as any,
  });

  // Fetch XRGE balance
  const { data: xrgeBalance, refetch: refetchXrgeBalance } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!fullAddress,
    },
  });

  const { data: xrgeDecimals } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  // Fetch KTA balance
  const { data: ktaBalance, refetch: refetchKtaBalance } = useReadContract({
    address: KTA_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!fullAddress,
    },
  });

  // Fetch USDC balance
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: USDC_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: fullAddress ? [fullAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!fullAddress,
    },
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

  useEffect(() => {
    // Only redirect if Privy is ready and user is not connected
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
      setBuyAmount("");
      setSellAmount("");
      refetchApproval();
      refetchEthBalance();
      refetchXrgeBalance();
      refetchKtaBalance();
      refetchUsdcBalance();
    }
  }, [isSuccess, refetchApproval, refetchEthBalance, refetchXrgeBalance, refetchKtaBalance, refetchUsdcBalance]);

  useEffect(() => {
    if (error) {
      const message = (error as any)?.shortMessage || (error as Error)?.message || 'Transaction failed';
      toast({ title: 'Transaction Error', description: message, variant: 'destructive' });
      console.error('Transaction error:', error);
    }
  }, [error]);

  const handleApproveUSDC = async () => {
    if (!buyAmount || Number(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid USDC amount",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Approving USDC",
      description: "Please confirm the approval in your wallet...",
    });

    try {
      const txHash = await approveUSDC(buyAmount);
      console.log("USDC Approval transaction submitted, hash:", txHash);
      
      toast({
        title: "Approval Submitted",
        description: "Waiting for confirmation...",
      });

      // Poll for approval status
      let attempts = 0;
      const maxAttempts = 20;
      const pollInterval = setInterval(async () => {
        attempts++;
        console.log(`Polling USDC approval status... attempt ${attempts}/${maxAttempts}`);
        await refetchUSDCApproval();
        
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          console.log("Max polling attempts reached for USDC approval");
        }
      }, 2000);

      // Also refetch after 5 seconds to be safe
      setTimeout(async () => {
        await refetchUSDCApproval();
        clearInterval(pollInterval);
        toast({
          title: "USDC Approved",
          description: "You can now buy XRGE",
        });
      }, 5000);
    } catch (err) {
      console.error("USDC Approval error:", err);
      toast({
        title: "Approval Failed",
        description: err instanceof Error ? err.message : "Failed to approve USDC",
        variant: "destructive",
      });
    }
  };

  const handleBuy = () => {
    if (!buyAmount || Number(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a valid ${selectedToken} amount`,
        variant: "destructive",
      });
      return;
    }
    
    // Check USDC approval if using USDC
    if (selectedToken === "USDC" && !hasUSDCApproval) {
      toast({
        title: "Approval Required",
        description: "Please approve USDC first before buying",
        variant: "destructive",
      });
      return;
    }
    
    // Check KTA approval if using KTA
    if (selectedToken === "KTA" && !hasKTAApproval) {
      toast({
        title: "Approval Required",
        description: "Please approve KTA first before buying",
        variant: "destructive",
      });
      return;
    }
    
    const slippageBps = Number(slippage) * 100;
    
    if (selectedToken === "ETH") {
      buyXRGE(buyAmount, slippageBps);
    } else if (selectedToken === "KTA") {
      buyXRGEWithKTA(buyAmount, slippageBps);
    } else if (selectedToken === "USDC") {
      buyXRGEWithUSDC(buyAmount, slippageBps);
    }
  };

  const handleSell = async () => {
    if (!sellAmount || Number(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid XRGE amount",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasApproval) {
      toast({
        title: "Approval Required",
        description: "Please approve XRGE first before selling",
        variant: "destructive",
      });
      return;
    }
    
    const slippageBps = Number(slippage) * 100;
    
    toast({
      title: "Selling XRGE",
      description: "Step 2 of 2: Please confirm the swap in your wallet...",
    });
    
    try {
      let txHash;
      if (selectedToken === "ETH") {
        txHash = await sellXRGE(sellAmount, slippageBps);
      } else if (selectedToken === "KTA") {
        txHash = await sellXRGEForKTA(sellAmount, slippageBps);
      } else if (selectedToken === "USDC") {
        txHash = await sellXRGEForUSDC(sellAmount, slippageBps);
      }
      
      console.log("Sell transaction hash:", txHash);
      
      // Reset the amount to clear the approval state
      setSellAmount("");
      
      // Refetch balances after successful swap
      setTimeout(() => {
        refetchXrgeBalance();
        if (selectedToken === "KTA") refetchKtaBalance();
        if (selectedToken === "USDC") refetchUsdcBalance();
        if (selectedToken === "ETH") refetchEthBalance();
      }, 3000);
      
      toast({
        title: "✅ Swap Successful!",
        description: `Swapped ${sellAmount} XRGE for ${selectedToken}`,
      });
    } catch (error) {
      console.error("Sell failed:", error);
      // Error toast already shown by hook
    }
  };

  const handleApprove = async () => {
    if (!buyAmount || Number(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a valid ${selectedToken} amount`,
        variant: "destructive",
      });
      return;
    }
    
    if (selectedToken === "ETH") {
      // ETH doesn't need approval
      return;
    }
    
    toast({
      title: `Approving ${selectedToken}`,
      description: "Please confirm the approval in your wallet...",
    });
    
    try {
      let txHash;
      if (selectedToken === "KTA") {
        txHash = await approveKTA(buyAmount);
      } else if (selectedToken === "USDC") {
        txHash = await approveUSDC(buyAmount);
      }
      
      console.log(`${selectedToken} Approval transaction submitted, hash:`, txHash);
      
      toast({
        title: "Approval Submitted",
        description: "Waiting for confirmation...",
      });

      // Poll for approval status
      let attempts = 0;
      const maxAttempts = 20;
      const pollInterval = setInterval(async () => {
        attempts++;
        console.log(`Polling ${selectedToken} approval status... attempt ${attempts}/${maxAttempts}`);
        if (selectedToken === "USDC") {
          await refetchUSDCApproval();
        } else if (selectedToken === "KTA") {
          await refetchKTAApproval();
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          console.log(`Max polling attempts reached for ${selectedToken} approval`);
        }
      }, 2000);

      // Also refetch after 5 seconds to be safe
      setTimeout(async () => {
        if (selectedToken === "USDC") {
          await refetchUSDCApproval();
        } else if (selectedToken === "KTA") {
          await refetchKTAApproval();
        }
        clearInterval(pollInterval);
        toast({
          title: `${selectedToken} Approved`,
          description: "You can now buy XRGE",
        });
      }, 5000);
    } catch (err) {
      console.error(`${selectedToken} Approval error:`, err);
      toast({
        title: "Approval Failed",
        description: err instanceof Error ? err.message : `Failed to approve ${selectedToken}`,
        variant: "destructive",
      });
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

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

  const handleApproveXRGE = async () => {
    if (!sellAmount || Number(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid XRGE amount",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Approving XRGE",
      description: "Step 1 of 2: Please confirm the approval in your wallet...",
    });
    
    try {
      const txHash = await approveXRGE(sellAmount);
      console.log("XRGE approval tx:", txHash);
      
      // Wait a bit for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refetch approval status multiple times to ensure it updates
      console.log("Refetching approval status...");
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refetchApproval();
        console.log(`Approval check ${i + 1}/5`);
      }
      
      toast({
        title: "✅ Approval Successful",
        description: "You can now proceed to sell XRGE",
      });
    } catch (error) {
      console.error("Approval failed:", error);
      // Error toast already shown by hook
    }
  };

  // Show nothing while Privy is initializing
  if (!isPrivyReady) {
    return null;
  }

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-6 md:py-8 max-w-2xl mb-24 md:mb-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-mono text-neon-green mb-2">
            [SWAP XRGE]
          </h1>
          <p className="text-muted-foreground font-mono">
            Buy or sell XRGE tokens instantly
          </p>
        </div>

        {/* DexScreener Chart - Resizable */}
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
          {/* Resizable chart container */}
          <div className="relative w-full" style={{ height: `${chartHeight}px` }}>
            <iframe
              src={`https://dexscreener.com/base/${XRGE_TOKEN_ADDRESS}?embed=1&theme=dark&trades=0&info=0`}
              className="w-full h-full rounded-t-lg border border-tech-border md:rounded-t-xl pointer-events-auto"
              style={{ border: 0 }}
              allowFullScreen
            />
          </div>
          {/* Drag handle */}
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

        <Card className="p-6 bg-card border-tech-border">
          <Tabs defaultValue="buy" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="buy" className="font-mono">
                BUY XRGE
              </TabsTrigger>
              <TabsTrigger value="sell" className="font-mono">
                SELL XRGE
              </TabsTrigger>
            </TabsList>

            {/* Buy Tab */}
            <TabsContent value="buy" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="token-select" className="font-mono text-sm">
                    Pay With
                  </Label>
                  <Select value={selectedToken} onValueChange={(value: any) => setSelectedToken(value)}>
                    <SelectTrigger className="mt-2 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH" className="font-mono">
                        <div className="flex items-center justify-between w-full">
                          <span>ETH</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {ethBalanceFormatted} ≈ ${calculateUsdValue(Number(ethBalanceFormatted), 'eth').toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="KTA" className="font-mono">
                        <div className="flex items-center justify-between w-full">
                          <span>KTA</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {ktaBalanceFormatted} ≈ ${calculateUsdValue(Number(ktaBalanceFormatted), 'kta').toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="USDC" className="font-mono">
                        <div className="flex items-center justify-between w-full">
                          <span>USDC</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {usdcBalanceFormatted} ≈ ${calculateUsdValue(Number(usdcBalanceFormatted), 'usdc').toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="buy-amount" className="font-mono text-sm">
                    {selectedToken} Amount
                  </Label>
                  <Input
                    id="buy-amount"
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                    className="mt-2 font-mono"
                  />
                </div>

                <div className="flex justify-center">
                  <ArrowDownUp className="h-6 w-6 text-neon-green" />
                </div>

                <div>
                  <Label className="font-mono text-sm">Expected XRGE</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="font-mono text-lg">
                      {isBuyQuoteLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        `≈ ${Number(expectedBuyAmount).toFixed(4)} XRGE`
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="buy-slippage" className="font-mono text-sm">
                    Slippage Tolerance (%)
                  </Label>
                  <div className="flex gap-2 mt-2">
                    {["0.5", "1", "5"].map((val) => (
                      <Button
                        key={val}
                        variant={slippage === val ? "neon" : "outline"}
                        size="sm"
                        onClick={() => setSlippage(val)}
                        className="font-mono"
                      >
                        {val}%
                      </Button>
                    ))}
                    <Input
                      id="buy-slippage"
                      type="number"
                      step="0.1"
                      placeholder="Custom"
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      className="w-24 font-mono"
                    />
                  </div>
                </div>

                {selectedToken !== "ETH" && !((selectedToken === "USDC" && hasUSDCApproval) || (selectedToken === "KTA" && hasKTAApproval)) && (
                  <Alert className="border-neon-green/30 bg-neon-green/5">
                    <Info className="h-4 w-4 text-neon-green" />
                    <AlertDescription className="font-mono text-xs">
                      Buying with {selectedToken} requires 2 transactions: First approve {selectedToken}, then confirm the swap.
                    </AlertDescription>
                  </Alert>
                )}

                {selectedToken !== "ETH" && (
                  <Button
                    onClick={handleApprove}
                    disabled={
                      isPending || 
                      isConfirming || 
                      !buyAmount || 
                      (selectedToken === "USDC" && hasUSDCApproval) ||
                      (selectedToken === "KTA" && hasKTAApproval)
                    }
                    className="w-full font-mono"
                    variant={(selectedToken === "USDC" && hasUSDCApproval) || (selectedToken === "KTA" && hasKTAApproval) ? "default" : "outline"}
                    size="sm"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        APPROVING...
                      </>
                    ) : (selectedToken === "USDC" && hasUSDCApproval) || (selectedToken === "KTA" && hasKTAApproval) ? (
                      `✓ ${selectedToken} APPROVED`
                    ) : (
                      `STEP 1: APPROVE ${selectedToken}`
                    )}
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleBuy}
                  disabled={
                    isPending || 
                    isConfirming || 
                    !buyAmount || 
                    (selectedToken === "USDC" && !hasUSDCApproval) ||
                    (selectedToken === "KTA" && !hasKTAApproval)
                  }
                  className="w-full font-mono relative z-10 pointer-events-auto"
                  variant="neon"
                  size="lg"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isPending ? "CONFIRMING..." : "PROCESSING..."}
                    </>
                  ) : selectedToken === "USDC" || selectedToken === "KTA" ? (
                    `STEP 2: BUY XRGE WITH ${selectedToken}`
                  ) : (
                    `BUY XRGE WITH ${selectedToken}`
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Sell Tab */}
            <TabsContent value="sell" className="space-y-6">
              {/* Info Alert */}
              <Alert className="border-neon-green/20 bg-neon-green/5">
                <Info className="h-4 w-4 text-neon-green" />
                <AlertDescription className="font-mono text-sm">
                  Selling requires 2 transactions: First approve XRGE, then confirm the sell.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                {/* Token Selector */}
                <div>
                  <Label htmlFor="sell-token-select" className="font-mono text-sm">
                    Receive
                  </Label>
                  <Select value={selectedToken} onValueChange={(value: any) => setSelectedToken(value)}>
                    <SelectTrigger className="mt-2 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH" className="font-mono">
                        <div className="flex items-center justify-between w-full">
                          <span>ETH</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {ethBalanceFormatted} ≈ ${calculateUsdValue(Number(ethBalanceFormatted), 'eth').toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="KTA" className="font-mono">
                        <div className="flex items-center justify-between w-full">
                          <span>KTA</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {ktaBalanceFormatted} ≈ ${calculateUsdValue(Number(ktaBalanceFormatted), 'kta').toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="USDC" className="font-mono">
                        <div className="flex items-center justify-between w-full">
                          <span>USDC</span>
                          <span className="text-xs text-muted-foreground ml-4">
                            {usdcBalanceFormatted} ≈ ${calculateUsdValue(Number(usdcBalanceFormatted), 'usdc').toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sell-xrge" className="font-mono text-sm">
                      XRGE Amount
                    </Label>
                    <span className="font-mono text-xs text-muted-foreground">
                      Balance: {xrgeBalanceFormatted} XRGE
                    </span>
                  </div>
                  <Input
                    id="sell-xrge"
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className="mt-2 font-mono"
                  />
                  <button
                    onClick={() => setSellAmount(xrgeBalanceFormatted)}
                    className="text-xs text-neon-green hover:text-neon-green/80 font-mono mt-1"
                    type="button"
                  >
                    MAX
                  </button>
                </div>

                <div className="flex justify-center">
                  <ArrowDownUp className="h-6 w-6 text-neon-green" />
                </div>

                <div>
                  <Label className="font-mono text-sm">Expected {selectedToken}</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="font-mono text-lg">
                      {isSellQuoteLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        `≈ ${Number(expectedSellAmount).toFixed(selectedToken === "USDC" ? 6 : selectedToken === "ETH" ? 6 : 4)} ${selectedToken}`
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="sell-slippage" className="font-mono text-sm">
                    Slippage Tolerance (%)
                  </Label>
                  <div className="flex gap-2 mt-2">
                    {["0.5", "1", "5"].map((val) => (
                      <Button
                        key={val}
                        variant={slippage === val ? "neon" : "outline"}
                        size="sm"
                        onClick={() => setSlippage(val)}
                        className="font-mono"
                      >
                        {val}%
                      </Button>
                    ))}
                    <Input
                      id="sell-slippage"
                      type="number"
                      step="0.1"
                      placeholder="Custom"
                      value={slippage}
                      onChange={(e) => setSlippage(e.target.value)}
                      className="w-24 font-mono"
                    />
                  </div>
                </div>

                {!hasApproval && sellAmount && Number(sellAmount) > 0 ? (
                  <Button
                    onClick={handleApproveXRGE}
                    disabled={isPending || isConfirming}
                    className="w-full font-mono"
                    variant="outline"
                    size="lg"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        APPROVING...
                      </>
                    ) : (
                      "STEP 1: APPROVE XRGE"
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSell}
                    disabled={isPending || isConfirming || !sellAmount || !hasApproval}
                    className="w-full font-mono"
                    variant="neon"
                    size="lg"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isPending ? "CONFIRMING..." : "PROCESSING..."}
                      </>
                    ) : (
                      "STEP 2: SELL XRGE"
                    )}
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
