import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { useWallet } from "@/hooks/useWallet";
import { 
  useXRGESwap, 
  useXRGEQuote, 
  useETHQuote, 
  useXRGEApproval,
  useXRGEQuoteFromKTA,
  useKTAQuote,
  useXRGEQuoteFromUSDC,
  useUSDCQuote,
  XRGE_TOKEN_ADDRESS,
  KTA_TOKEN_ADDRESS,
  USDC_TOKEN_ADDRESS
} from "@/hooks/useXRGESwap";
import { ArrowDownUp, Loader2, Wallet, Coins, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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
  const { isConnected, fullAddress } = useWallet();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [slippage, setSlippage] = useState("5");
  const [selectedToken, setSelectedToken] = useState<"ETH" | "KTA" | "USDC">("ETH");
  
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


  useEffect(() => {
    if (!isConnected) {
      navigate("/");
    }
  }, [isConnected, navigate]);

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

  const handleBuy = () => {
    if (!buyAmount || Number(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a valid ${selectedToken} amount`,
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

  const handleSell = () => {
    if (!sellAmount || Number(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid XRGE amount",
        variant: "destructive",
      });
      return;
    }
    
    const slippageBps = Number(slippage) * 100;
    
    if (selectedToken === "ETH") {
      sellXRGE(sellAmount, slippageBps);
    } else if (selectedToken === "KTA") {
      sellXRGEForKTA(sellAmount, slippageBps);
    } else if (selectedToken === "USDC") {
      sellXRGEForUSDC(sellAmount, slippageBps);
    }
  };

  const handleApprove = () => {
    if (!sellAmount || Number(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid XRGE amount",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedToken === "ETH") {
      // ETH doesn't need approval
      return;
    } else if (selectedToken === "KTA") {
      approveKTA(buyAmount);
    } else if (selectedToken === "USDC") {
      approveUSDC(buyAmount);
    }
  };
  
  const handleApproveXRGE = () => {
    if (!sellAmount || Number(sellAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid XRGE amount",
        variant: "destructive",
      });
      return;
    }
    
    approveXRGE(sellAmount);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-mono text-neon-green mb-2">
            [SWAP XRGE]
          </h1>
          <p className="text-muted-foreground font-mono">
            Buy or sell XRGE tokens instantly
          </p>
        </div>

        {/* Balance Display */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-card border-tech-border">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-neon-green" />
                <span className="font-mono text-xs text-muted-foreground">ETH</span>
              </div>
              <span className="font-mono text-lg font-bold">
                {ethBalance ? Number(formatEther(ethBalance.value)).toFixed(6) : '0.000000'}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ≈ ${ethBalance ? calculateUsdValue(Number(formatEther(ethBalance.value)), 'eth').toFixed(2) : '0.00'}
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-card border-tech-border">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-neon-green" />
                <span className="font-mono text-xs text-muted-foreground">XRGE</span>
              </div>
              <span className="font-mono text-lg font-bold">
                {xrgeBalance && xrgeDecimals 
                  ? (Number(xrgeBalance) / Math.pow(10, Number(xrgeDecimals))).toFixed(2)
                  : '0.00'}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ≈ ${xrgeBalance && xrgeDecimals 
                  ? calculateUsdValue(Number(xrgeBalance) / Math.pow(10, Number(xrgeDecimals)), 'xrge').toFixed(2)
                  : '0.00'}
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-card border-tech-border">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-neon-green" />
                <span className="font-mono text-xs text-muted-foreground">KTA</span>
              </div>
              <span className="font-mono text-lg font-bold">
                {ktaBalance && xrgeDecimals 
                  ? (Number(ktaBalance) / Math.pow(10, Number(xrgeDecimals))).toFixed(2)
                  : '0.00'}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ≈ ${ktaBalance && xrgeDecimals 
                  ? calculateUsdValue(Number(ktaBalance) / Math.pow(10, Number(xrgeDecimals)), 'kta').toFixed(2)
                  : '0.00'}
              </span>
            </div>
          </Card>

          <Card className="p-4 bg-card border-tech-border">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-neon-green" />
                <span className="font-mono text-xs text-muted-foreground">USDC</span>
              </div>
              <span className="font-mono text-lg font-bold">
                {usdcBalance 
                  ? (Number(usdcBalance) / Math.pow(10, 6)).toFixed(2)
                  : '0.00'}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                ≈ ${usdcBalance 
                  ? calculateUsdValue(Number(usdcBalance) / Math.pow(10, 6), 'usdc').toFixed(2)
                  : '0.00'}
              </span>
            </div>
          </Card>
        </div>

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
                {/* Token Selector */}
                <div>
                  <Label htmlFor="token-select" className="font-mono text-sm">
                    Pay With
                  </Label>
                  <Select value={selectedToken} onValueChange={(value: any) => setSelectedToken(value)}>
                    <SelectTrigger className="mt-2 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="KTA">KTA</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
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

                {selectedToken !== "ETH" && (
                  <Button
                    onClick={handleApprove}
                    disabled={isPending || isConfirming || !buyAmount}
                    className="w-full font-mono"
                    variant="outline"
                    size="sm"
                  >
                    {isPending || isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        APPROVING...
                      </>
                    ) : (
                      `APPROVE ${selectedToken}`
                    )}
                  </Button>
                )}

                <Button
                  type="button"
                  onClick={handleBuy}
                  disabled={isPending || isConfirming || !buyAmount}
                  className="w-full font-mono relative z-10 pointer-events-auto"
                  variant="neon"
                  size="lg"
                >
                  {isPending || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isPending ? "CONFIRMING..." : "PROCESSING..."}
                    </>
                  ) : (
                    `BUY XRGE WITH ${selectedToken}`
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Sell Tab */}
            <TabsContent value="sell" className="space-y-6">
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
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="KTA">KTA</SelectItem>
                      <SelectItem value="USDC">USDC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sell-xrge" className="font-mono text-sm">
                    XRGE Amount
                  </Label>
                  <Input
                    id="sell-xrge"
                    type="number"
                    step="0.001"
                    placeholder="0.0"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className="mt-2 font-mono"
                  />
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
                      "APPROVE XRGE"
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
                      "SELL XRGE"
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
