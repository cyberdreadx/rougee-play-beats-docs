import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import { useWallet } from "@/hooks/useWallet";
import { useXRGESwap, useXRGEQuote, useETHQuote, useXRGEApproval } from "@/hooks/useXRGESwap";
import { ArrowDownUp, Loader2, Wallet } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useBalance } from "wagmi";
import { formatEther } from "viem";

const Swap = () => {
  const navigate = useNavigate();
  const { isConnected, fullAddress } = useWallet();
  const [buyAmount, setBuyAmount] = useState("");
  const [sellAmount, setSellAmount] = useState("");
  const [slippage, setSlippage] = useState("5");

  console.log('Swap component rendered', { isConnected, fullAddress, buyAmount, slippage });

  const { buyXRGE, sellXRGE, approveXRGE, isPending, isConfirming, isSuccess } = useXRGESwap();
  const { expectedXRGE, isLoading: isBuyQuoteLoading } = useXRGEQuote(buyAmount);
  const { expectedETH, isLoading: isSellQuoteLoading } = useETHQuote(sellAmount);
  const { hasApproval, refetch: refetchApproval } = useXRGEApproval(
    fullAddress as any,
    sellAmount
  );

  // Fetch ETH balance
  const { data: ethBalance, refetch: refetchEthBalance } = useBalance({
    address: fullAddress as any,
  });

  console.log('Button state:', { 
    isPending, 
    isConfirming, 
    buyAmount, 
    disabled: isPending || isConfirming || !buyAmount 
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
    }
  }, [isSuccess, refetchApproval, refetchEthBalance]);

  const handleBuy = () => {
    console.log('handleBuy clicked', { buyAmount, slippage });
    
    if (!buyAmount || Number(buyAmount) <= 0) {
      console.log('Invalid amount detected');
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid ETH amount",
        variant: "destructive",
      });
      return;
    }
    
    console.log('Calling buyXRGE with:', buyAmount, Number(slippage) * 100);
    buyXRGE(buyAmount, Number(slippage) * 100);
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
    sellXRGE(sellAmount, Number(slippage) * 100);
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
    approveXRGE(sellAmount);
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
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
        <Card className="p-4 bg-card border-tech-border mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-neon-green" />
              <span className="font-mono text-sm text-muted-foreground">ETH Balance:</span>
            </div>
            <span className="font-mono text-lg font-bold">
              {ethBalance ? Number(formatEther(ethBalance.value)).toFixed(6) : '0.000000'} ETH
            </span>
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
                  <Label htmlFor="buy-eth" className="font-mono text-sm">
                    ETH Amount
                  </Label>
                  <Input
                    id="buy-eth"
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
                        `≈ ${Number(expectedXRGE).toFixed(4)} XRGE`
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

                <Button
                  onClick={handleBuy}
                  disabled={isPending || isConfirming || !buyAmount}
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
                    "BUY XRGE"
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Sell Tab */}
            <TabsContent value="sell" className="space-y-6">
              <div className="space-y-4">
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
                  <Label className="font-mono text-sm">Expected ETH</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="font-mono text-lg">
                      {isSellQuoteLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        `≈ ${Number(expectedETH).toFixed(6)} ETH`
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
                    onClick={handleApprove}
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
