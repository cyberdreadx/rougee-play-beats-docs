import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { usePublicClient } from 'wagmi';
import { Address } from 'viem';

interface SongPriceSparklineProps {
  tokenAddress?: string;
  bondingSupply?: string;
  priceInXRGE?: number;
  className?: string;
  height?: number;
  strokeColor?: string;
  showPercentChange?: boolean;
  timeframeHours?: number; // Hours to look back for trades (e.g., 24 for 24h)
  percentChange?: number; // Optional: pass in pre-calculated percent change to ensure consistency
}

export const SongPriceSparkline = ({ 
  tokenAddress,
  bondingSupply, 
  priceInXRGE,
  className = "",
  height = 40,
  strokeColor = "#00ff9f",
  showPercentChange = false,
  timeframeHours = 24, // Default to 24 hours
  percentChange // Optional pre-calculated percent change
}: SongPriceSparklineProps) => {
  const { prices } = useTokenPrices();
  const publicClient = usePublicClient();
  const [tradeData, setTradeData] = useState<{ value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch actual trade data from blockchain
  useEffect(() => {
    const fetchTradeHistory = async () => {
      if (!publicClient || !tokenAddress) {
        setLoading(false);
        return;
      }
      
      try {
        const BONDING_CURVE_ADDRESS = '0xCeE9c18C448487a1deAac3E14974C826142C50b5' as Address;
        const XRGE_ADDRESS = '0x147120faEC9277ec02d957584CFCD92B56A24317' as Address;

        // Calculate block range based on timeframe
        // Base has ~2 second block time
        const currentBlock = await publicClient.getBlockNumber();
        const blocksPerHour = 1800; // 3600 seconds / 2 seconds per block
        const blocksToLookBack = BigInt(Math.floor(blocksPerHour * timeframeHours));
        const fromBlock = currentBlock - blocksToLookBack;

        // Fetch Transfer events for the timeframe
        const transferLogs = await publicClient.getLogs({
          address: tokenAddress as Address,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { indexed: true, name: 'from', type: 'address' },
              { indexed: true, name: 'to', type: 'address' },
              { indexed: false, name: 'value', type: 'uint256' }
            ]
          },
          fromBlock: fromBlock,
          toBlock: 'latest'
        });

        // Fetch XRGE transfers for the same period
        const xrgeLogs = await publicClient.getLogs({
          address: XRGE_ADDRESS,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { indexed: true, name: 'from', type: 'address' },
              { indexed: true, name: 'to', type: 'address' },
              { indexed: false, name: 'value', type: 'uint256' }
            ]
          },
          fromBlock: fromBlock,
          toBlock: 'latest'
        });

        // Map XRGE amounts by transaction
        const xrgeByTx = new Map<string, { buy: number; sell: number }>();
        for (const log of xrgeLogs) {
          const { args } = log as any;
          const from = (args.from as string).toLowerCase();
          const to = (args.to as string).toLowerCase();
          const amount = Number(args.value as bigint) / 1e18;
          
          const isFeeAddress = from === '0xb787433e138893a0ed84d99e82c7da260a940b1e' || to === '0xb787433e138893a0ed84d99e82c7da260a940b1e';
          if (isFeeAddress) continue;
          
          const existing = xrgeByTx.get(log.transactionHash) || { buy: 0, sell: 0 };
          
          if (to === BONDING_CURVE_ADDRESS.toLowerCase()) {
            existing.buy += amount;
          } else if (from === BONDING_CURVE_ADDRESS.toLowerCase()) {
            existing.sell += amount;
          }
          
          xrgeByTx.set(log.transactionHash, existing);
        }

        // Process trades and calculate prices
        const trades: { timestamp: number; priceUSD: number }[] = [];
        
        for (const log of transferLogs) {
          const { args } = log as any;
          const from = (args.from as string).toLowerCase();
          const to = (args.to as string).toLowerCase();
          const amount = Number(args.value as bigint) / 1e18;
          
          if (from === BONDING_CURVE_ADDRESS.toLowerCase() || to === BONDING_CURVE_ADDRESS.toLowerCase()) {
            const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
            const timestamp = Number(block.timestamp) * 1000;
            const isBuy = from === BONDING_CURVE_ADDRESS.toLowerCase();
            
            const xrgeData = xrgeByTx.get(log.transactionHash);
            const xrgeAmount = isBuy ? (xrgeData?.buy || 0) : (xrgeData?.sell || 0);
            
            const priceInXRGE = amount > 0 ? xrgeAmount / amount : 0;
            const priceUSD = priceInXRGE * (prices.xrge || 0);
            
            if (priceUSD > 0) {
              trades.push({ timestamp, priceUSD });
            }
          }
        }

        // Sort by timestamp and sample down to ~20 points for sparkline
        trades.sort((a, b) => a.timestamp - b.timestamp);
        
        const sampledTrades = trades.length > 20
          ? trades.filter((_, i) => i % Math.ceil(trades.length / 20) === 0)
          : trades;
        
        // Add current price as last point if available
        if (priceInXRGE && prices.xrge) {
          sampledTrades.push({
            timestamp: Date.now(),
            priceUSD: priceInXRGE * prices.xrge
          });
        }

        const priceData = sampledTrades.map(t => ({ value: t.priceUSD }));
        
        // If no trades in timeframe but we have bonding curve data, generate fallback
        if (priceData.length < 2 && bondingSupply && priceInXRGE) {
          console.log('⚠️ No trades in timeframe, using bonding curve fallback');
          const BONDING_CURVE_TOTAL = 990_000_000;
          const INITIAL_PRICE = 0.001;
          const PRICE_INCREMENT = 0.000001;
          
          const currentTokensBought = parseFloat(bondingSupply) > 0
            ? BONDING_CURVE_TOTAL - parseFloat(bondingSupply)
            : 0;
          
          const fallbackPoints = [];
          const numPoints = 20;
          
          // Generate from 80% of current to current (recent trend)
          const startTokens = currentTokensBought * 0.8;
          for (let i = 0; i <= numPoints; i++) {
            const tokensBought = startTokens + ((currentTokensBought - startTokens) / numPoints) * i;
            const priceXRGE = INITIAL_PRICE + (tokensBought * PRICE_INCREMENT);
            const priceUSD = priceXRGE * (prices.xrge || 0);
            fallbackPoints.push({ value: priceUSD });
          }
          
          setTradeData(fallbackPoints);
        } else {
          setTradeData(priceData);
        }
      } catch (error) {
        console.error('Error fetching sparkline data:', error);
        setTradeData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeHistory();
  }, [tokenAddress, publicClient, prices.xrge, priceInXRGE, timeframeHours, bondingSupply]);
  
  // Don't render if no meaningful data
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-[8px] text-muted-foreground animate-pulse">...</div>
      </div>
    );
  }

  if (tradeData.length < 2) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height }}>
        <div className="text-[8px] text-muted-foreground">—</div>
      </div>
    );
  }

  // Use pre-calculated percent change if provided, otherwise calculate from trade data
  const calculatedPercentChange = percentChange !== undefined 
    ? percentChange 
    : (() => {
        const firstPrice = tradeData[0].value;
        const lastPrice = tradeData[tradeData.length - 1].value;
        return ((lastPrice - firstPrice) / firstPrice) * 100;
      })();
  
  const isPositive = calculatedPercentChange >= 0;
  
  // Auto-set stroke color based on change if not explicitly set
  const finalStrokeColor = strokeColor === "#00ff9f" && !isPositive ? "#ef4444" : strokeColor;

  return (
    <div className={`${className} flex items-center gap-2`}>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={tradeData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={finalStrokeColor}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showPercentChange && (
        <div className={`text-[10px] font-mono font-bold whitespace-nowrap ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{calculatedPercentChange.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

