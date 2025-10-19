import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Activity } from "lucide-react";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMemo, useState } from "react";

interface SongTradingChartProps {
  songTokenAddress?: `0x${string}`;
  onDataUpdate?: () => void;
  priceInXRGE?: number;
  bondingSupply?: string;
}

export const SongTradingChart = ({ songTokenAddress, priceInXRGE, bondingSupply: bondingSupplyProp }: SongTradingChartProps) => {
  const { prices } = useTokenPrices();
  const [timeFilter, setTimeFilter] = useState<'1H' | '24H' | '7D' | '30D' | 'ALL'>('ALL');
  
  // Generate complete price history using ONLY the bonding curve formula
  // No API calls needed - just math!
  const priceHistory = useMemo(() => {
    const BONDING_CURVE_TOTAL = 990_000_000;
    const INITIAL_PRICE = 0.001; // XRGE
    const PRICE_INCREMENT = 0.000001; // XRGE per token
    
    // Calculate current tokens bought
    const currentTokensBought = bondingSupplyProp && parseFloat(bondingSupplyProp) > 0
      ? BONDING_CURVE_TOTAL - parseFloat(bondingSupplyProp)
      : 0;
    
    // Generate price points from 0 to current supply
    const points = [];
    const numPoints = 100; // 100 data points for smooth chart
    
    for (let i = 0; i <= numPoints; i++) {
      // Calculate supply at this point (0% to 100% of current supply)
      const tokensBought = (currentTokensBought / numPoints) * i;
      
      // Calculate price using bonding curve formula
      // Price = INITIAL_PRICE + (tokensBought * PRICE_INCREMENT)
      const priceXRGE = INITIAL_PRICE + (tokensBought * PRICE_INCREMENT);
      const priceUSD = priceXRGE * (prices.xrge || 0);
      
      points.push({
        supply: tokensBought / 1_000_000, // Convert to millions for readability
        priceXRGE,
        priceUSD,
        progress: (tokensBought / BONDING_CURVE_TOTAL) * 100
      });
    }
    
    console.log('📊 Formula-based price history:', {
      totalPoints: points.length,
      currentSupply: currentTokensBought,
      currentPriceXRGE: priceInXRGE,
      calculatedCurrentPrice: points[points.length - 1]?.priceXRGE,
      xrgeUsdRate: prices.xrge
    });
    
    return points;
  }, [bondingSupplyProp, prices.xrge, priceInXRGE]);
  
  // Filter data based on time range
  const filteredHistory = useMemo(() => {
    if (timeFilter === 'ALL' || priceHistory.length === 0) {
      return priceHistory;
    }
    
    // Calculate what percentage of data to show based on time filter
    // This is a simplified version - ideally you'd use timestamps
    const percentageToShow = {
      '1H': 5,   // Show last 5% of data
      '24H': 20,  // Show last 20%
      '7D': 50,   // Show last 50%
      '30D': 75   // Show last 75%
    }[timeFilter];
    
    const startIndex = Math.floor(priceHistory.length * (1 - percentageToShow / 100));
    return priceHistory.slice(startIndex);
  }, [priceHistory, timeFilter]);
  
  const BONDING_CURVE_TOTAL = 990_000_000;
  const currentSupplyFromData = bondingSupplyProp && parseFloat(bondingSupplyProp) > 0 
    ? BONDING_CURVE_TOTAL - parseFloat(bondingSupplyProp) 
    : 0;
  
  const currentPriceUSD = priceInXRGE ? priceInXRGE * (prices.xrge || 0) : 0;

  if (!songTokenAddress) {
    return (
      <Card className="console-bg tech-border p-4 md:p-6">
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-mono font-bold mb-2">No Trading Data Yet</h3>
          <p className="text-sm text-muted-foreground font-mono max-w-md mx-auto">
            This song hasn't been deployed to the bonding curve yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="console-bg tech-border p-3 sm:p-4 md:p-6">
      <div className="mb-3 md:mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <h3 className="text-base sm:text-lg font-mono font-bold neon-text flex items-center gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            PRICE HISTORY
          </h3>
          
          {/* Time Filter Buttons */}
          <div className="flex gap-1 flex-wrap">
            {(['1H', '24H', '7D', '30D', 'ALL'] as const).map((filter) => (
              <Button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                variant={timeFilter === filter ? "default" : "outline"}
                size="sm"
                className={`
                  h-6 px-2 text-[10px] sm:text-xs font-mono
                  ${timeFilter === filter 
                    ? 'bg-neon-green text-black hover:bg-neon-green/90' 
                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }
                `}
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
        
        <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mb-2">
          Live bonding curve progression - price increases with each token sold
        </p>
      </div>

      {/* Chart */}
      <div className="h-[200px] sm:h-[250px] md:h-[300px] mb-4">
        {filteredHistory.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredHistory} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <defs>
                <linearGradient id="priceGradientUSD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff9f" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#00ff9f" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
              <XAxis 
                dataKey="supply" 
                stroke="#888"
                style={{ fontSize: '9px' }}
                tickFormatter={(value) => `${value.toFixed(1)}M`}
                tick={{ fill: '#888' }}
              />
              <YAxis 
                stroke="#888"
                style={{ fontSize: '9px' }}
                tickFormatter={(value) => {
                  if (value < 0.00001) return `$${value.toExponential(2)}`;
                  if (value < 0.01) return `$${value.toFixed(6)}`;
                  return `$${value.toFixed(4)}`;
                }}
                tick={{ fill: '#888' }}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #00ff9f',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  padding: '6px 8px'
                }}
                labelStyle={{ color: '#00ff9f', fontSize: '10px' }}
                formatter={(value: number, name: string) => {
                  if (name === 'priceUSD') {
                    return [`$${value < 0.01 ? value.toFixed(10) : value.toFixed(6)}`, 'Price'];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => `${label}M bought`}
              />
              <Area
                type="monotone"
                dataKey="priceUSD"
                stroke="#00ff9f"
                strokeWidth={2}
                fill="url(#priceGradientUSD)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-xs sm:text-sm text-muted-foreground font-mono">Loading price data...</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 pt-4 border-t border-border">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mb-1 truncate">Current Price</p>
          <p className="text-xs sm:text-sm md:text-base font-mono font-bold text-neon-green truncate">
            {currentPriceUSD > 0 ? (
              currentPriceUSD < 0.01 
                ? `$${currentPriceUSD.toFixed(10).replace(/\.?0+$/, '')}` 
                : `$${currentPriceUSD.toFixed(6)}`
            ) : (
              "Loading..."
            )}
          </p>
          {priceInXRGE && (
            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
              {priceInXRGE.toFixed(6)} XRGE
            </p>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mb-1 truncate">Tokens Bought</p>
          <p className="text-xs sm:text-sm md:text-base font-mono font-bold text-blue-400 truncate">
            {currentSupplyFromData > 0 
              ? `${(currentSupplyFromData / 1_000_000).toFixed(2)}M`
              : "0.00M"
            }
          </p>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
            {currentSupplyFromData > 0
              ? `${(currentSupplyFromData / BONDING_CURVE_TOTAL * 100).toFixed(2)}%`
              : "Just deployed"
            }
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-mono mb-1 truncate">Initial Price</p>
          <p className="text-xs sm:text-sm md:text-base font-mono font-bold text-purple-400 truncate">
            ${(0.001 * (prices.xrge || 0)).toFixed(8)}
          </p>
          <p className="text-[9px] sm:text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
            0.001 XRGE
          </p>
        </div>
      </div>

      <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
        <p className="text-[10px] text-blue-400 font-mono text-center">
          💡 The bonding curve ensures price increases with demand. Early buyers get lower prices!
        </p>
      </div>
    </Card>
  );
};
