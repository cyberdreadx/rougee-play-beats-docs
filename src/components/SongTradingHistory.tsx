import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { usePublicClient } from 'wagmi';
import { Address } from 'viem';
import { Loader2 } from 'lucide-react';

interface TradeData {
  timestamp: number;
  price: number;
  type: 'buy' | 'sell';
  amount: number;
  priceUSD: number;
}

interface ChartDataPoint {
  time: string;
  price: number;
  volume: number;
}

interface SongTradingHistoryProps {
  tokenAddress: Address;
  xrgeUsdPrice: number;
}

const SongTradingHistory = ({ tokenAddress, xrgeUsdPrice }: SongTradingHistoryProps) => {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();

  useEffect(() => {
    fetchTradingHistory();
  }, [tokenAddress]);

  const fetchTradingHistory = async () => {
    if (!publicClient || !tokenAddress) return;
    
    setLoading(true);
    try {
      console.log('Fetching trade history for token:', tokenAddress);

      // Fetch Transfer events directly from blockchain
      const TRANSFER_EVENT = {
        type: 'event',
        name: 'Transfer',
        inputs: [
          { name: 'from', type: 'address', indexed: true },
          { name: 'to', type: 'address', indexed: true },
          { name: 'value', type: 'uint256', indexed: false }
        ]
      } as const;

      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock - BigInt(100000);

      const transferLogs = await publicClient.getLogs({
        address: tokenAddress,
        event: TRANSFER_EVENT,
        fromBlock,
        toBlock: 'latest'
      });

      console.log(`Found ${transferLogs.length} total transfer events`);

      // Find the bonding curve address by looking for the address that appears most as 'from'
      const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;
      const fromCounts = new Map<string, number>();
      
      for (const log of transferLogs) {
        const { args } = log as any;
        const from = (args.from as Address).toLowerCase();
        const amount = Number(args.value as bigint) / 1e18;
        
        if (from !== ZERO_ADDRESS.toLowerCase() && amount < 5_000_000) {
          fromCounts.set(from, (fromCounts.get(from) || 0) + 1);
        }
      }
      
      // The address with most transfers is likely the bonding curve
      let bondingCurveAddress = '';
      let maxCount = 0;
      for (const [addr, count] of fromCounts) {
        if (count > maxCount) {
          maxCount = count;
          bondingCurveAddress = addr;
        }
      }
      
      console.log(`Detected bonding curve address: ${bondingCurveAddress} (${maxCount} transfers)`);

      // Process transfers into trades
      const INITIAL_PRICE = 0.001;
      const PRICE_INCREMENT = 0.000001;
      
      const allTrades: TradeData[] = [];
      let trackedSupply = 0;

      for (const log of transferLogs) {
        const { args } = log as any;
        const from = args.from as Address;
        const to = args.to as Address;
        const value = args.value as bigint;
        const amount = Number(value) / 1e18;

        console.log(`Transfer: ${amount.toLocaleString()} tokens from ${from.slice(0,10)}... to ${to.slice(0,10)}...`);

        // Skip zero address minting/burning
        if (from === ZERO_ADDRESS || to === ZERO_ADDRESS) {
          console.log(`  ⏭️ Skipping: zero address`);
          continue;
        }

        // Skip massive transfers (initial bonding curve setup)
        if (amount > 5_000_000) {
          console.log(`  ⏭️ Skipping: setup transfer`);
          continue;
        }

        // Only process transfers involving the bonding curve
        if (from.toLowerCase() !== bondingCurveAddress && to.toLowerCase() !== bondingCurveAddress) {
          console.log(`  ⏭️ Skipping: doesn't involve bonding curve`);
          continue;
        }

        // Get block timestamp - fallback to estimated time if RPC doesn't support getBlock
        let timestamp: number;
        try {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
          timestamp = Number(block.timestamp) * 1000;
        } catch (error) {
          // If getBlock not supported, estimate timestamp from block number
          // Base has ~2 second block time
          const currentBlock = await publicClient.getBlockNumber();
          const blockDiff = Number(currentBlock - log.blockNumber);
          timestamp = Date.now() - (blockDiff * 2000);
        }
        
        // BUY: FROM bonding curve TO user
        // SELL: FROM user TO bonding curve
        const isBuy = from.toLowerCase() === bondingCurveAddress;
        
        // Update supply
        if (isBuy) {
          trackedSupply += amount;
        } else {
          trackedSupply = Math.max(0, trackedSupply - amount);
        }
        
        console.log(`  ✅ COUNTED: ${isBuy ? 'BUY' : 'SELL'}`);
        
        // Calculate price using bonding curve formula
        const priceInXRGE = INITIAL_PRICE + (trackedSupply * PRICE_INCREMENT);
        const priceUSD = priceInXRGE * xrgeUsdPrice;
        
        console.log(`📊 ${isBuy ? 'BUY' : 'SELL'}: ${amount.toLocaleString()} tokens`);
        console.log(`   Supply: ${trackedSupply.toLocaleString()} (${(trackedSupply/990_000_000*100).toFixed(2)}% of bonding curve)`);
        console.log(`   Price: ${priceInXRGE.toFixed(6)} XRGE = $${priceUSD.toFixed(8)}`);
        console.log(`   Time: ${new Date(timestamp).toLocaleString()}`);
        
        allTrades.push({
          timestamp,
          price: priceInXRGE,
          type: isBuy ? 'buy' : 'sell',
          amount,
          priceUSD
        });
      }

      // Sort by timestamp
      allTrades.sort((a, b) => a.timestamp - b.timestamp);
      setTrades(allTrades);

      // Create chart data (hourly aggregation)
      const hourlyData = aggregateToHourly(allTrades);
      setChartData(hourlyData);

      console.log(`Loaded ${allTrades.length} trades`);
    } catch (error) {
      console.error('Error fetching trading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const aggregateToHourly = (trades: TradeData[]): ChartDataPoint[] => {
    if (trades.length === 0) return [];

    const hourlyMap = new Map<number, { prices: number[]; volume: number }>();

    trades.forEach(trade => {
      const hourKey = Math.floor(trade.timestamp / (1000 * 60 * 60));
      const existing = hourlyMap.get(hourKey) || { prices: [], volume: 0 };
      
      existing.prices.push(trade.priceUSD);
      existing.volume += trade.amount;
      
      hourlyMap.set(hourKey, existing);
    });

    return Array.from(hourlyMap.entries())
      .map(([hourKey, data]) => ({
        time: new Date(hourKey * 1000 * 60 * 60).toLocaleTimeString('en-US', { 
          month: 'short',
          day: 'numeric',
          hour: '2-digit'
        }),
        price: data.prices[data.prices.length - 1], // Last price in hour
        volume: data.volume
      }))
      .slice(-48); // Last 48 hours
  };

  if (loading) {
    return (
      <Card className="p-6 console-bg tech-border">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
          <span className="ml-3 font-mono text-muted-foreground">Loading trade history...</span>
        </div>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="p-6 console-bg tech-border">
        <div className="text-center py-12">
          <p className="font-mono text-muted-foreground">No trades yet. Be the first to trade!</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Price Chart */}
      <Card className="p-4 md:p-6 console-bg tech-border">
        <h3 className="font-mono font-bold text-lg mb-4 neon-text">PRICE HISTORY</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#00ff00" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              style={{ fontSize: '12px', fontFamily: 'monospace' }}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px', fontFamily: 'monospace' }}
              tickFormatter={(value) => `$${value.toFixed(6)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#000',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
              formatter={(value: any) => [`$${Number(value).toFixed(6)}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#00ff00" 
              strokeWidth={2}
              fill="url(#priceGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Volume Chart */}
      <Card className="p-4 md:p-6 console-bg tech-border">
        <h3 className="font-mono font-bold text-lg mb-4 text-purple-400">VOLUME</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              style={{ fontSize: '12px', fontFamily: 'monospace' }}
            />
            <YAxis 
              stroke="#666"
              style={{ fontSize: '12px', fontFamily: 'monospace' }}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#000',
                border: '1px solid #a855f7',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
              formatter={(value: any) => [Number(value).toLocaleString(undefined, {maximumFractionDigits: 0}), 'Tokens']}
            />
            <Area 
              type="monotone" 
              dataKey="volume" 
              stroke="#a855f7" 
              strokeWidth={2}
              fill="url(#volumeGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Recent Trades */}
      <Card className="p-4 md:p-6 console-bg tech-border">
        <h3 className="font-mono font-bold text-lg mb-4 text-cyan-400">RECENT TRADES</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {trades.slice(-10).reverse().map((trade, i) => (
            <div 
              key={i}
              className="flex justify-between items-center p-3 bg-black/30 rounded border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                  trade.type === 'buy' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                  {trade.type.toUpperCase()}
                </div>
                <div className="text-sm font-mono">
                  <div className="text-foreground font-semibold">
                    {trade.amount.toLocaleString(undefined, {maximumFractionDigits: 0})} tokens
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-neon-green font-mono font-bold">
                  ${trade.priceUSD.toFixed(6)}
                </div>
                <div className="text-muted-foreground text-xs font-mono">
                  {trade.price.toFixed(4)} XRGE
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SongTradingHistory;

