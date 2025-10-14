import { Card } from "@/components/ui/card";
import { TrendingUp, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { useSongTradeEvents } from "@/hooks/useSongBondingCurve";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface SongTradingChartProps {
  songTokenAddress?: `0x${string}`;
  onDataUpdate?: () => void;
}

export const SongTradingChart = ({ songTokenAddress, onDataUpdate }: SongTradingChartProps) => {
  const { events, isLoading } = useSongTradeEvents(songTokenAddress);
  const { prices } = useTokenPrices();
  
  if (!songTokenAddress) {
    return (
      <Card className="console-bg tech-border p-4 md:p-6">
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-mono font-bold mb-2">No Trading Data Yet</h3>
          <p className="text-sm text-muted-foreground font-mono max-w-md mx-auto">
            This song hasn't been deployed to the bonding curve yet. Deploy it to start trading and see live price charts.
          </p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="console-bg tech-border p-4 md:p-6">
        <div className="text-center py-12">
          <Loader2 className="h-16 w-16 mx-auto mb-4 text-neon-green animate-spin" />
          <h3 className="text-lg font-mono font-bold mb-2">Loading Chart Data...</h3>
          <p className="text-sm text-muted-foreground font-mono">
            Fetching trade history from blockchain
          </p>
        </div>
      </Card>
    );
  }

  if (events.length === 0 && !isLoading) {
    return (
      <Card className="console-bg tech-border p-4 md:p-6">
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 text-neon-green opacity-50" />
          <h3 className="text-lg md:text-xl font-mono font-bold neon-text mb-4">
            NO TRADES YET
          </h3>
          <div className="max-w-lg mx-auto space-y-3">
            <p className="text-sm text-muted-foreground font-mono">
              ✅ Token is deployed and ready for trading
            </p>
            <p className="text-sm text-muted-foreground font-mono">
              📊 Be the first to trade and see your transaction here!
            </p>
            <div className="mt-6 p-4 console-bg border border-neon-green/30 rounded-lg">
              <p className="text-xs text-yellow-500 font-mono mb-2">
                💡 TIP: Use the BUY and SELL tabs above to start trading
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                Once trading activity begins, you'll see live price movements, volume, and trading history here
              </p>
              <p className="text-xs text-blue-400 font-mono mt-3">
                📡 Chart shows last ~11 days of trading history
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Convert prices to USD for chart
  const chartData = events.map((event) => ({
    time: new Date(event.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: event.timestamp,
    price: event.price * (prices.xrge || 0),
    priceInXRGE: event.price,
    type: event.type,
  }));

  const latestPrice = chartData[chartData.length - 1]?.price || 0;
  const firstPrice = chartData[0]?.price || 0;
  const priceChange = latestPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? ((priceChange / firstPrice) * 100) : 0;

  return (
    <Card className="console-bg tech-border p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg md:text-xl font-mono font-bold neon-text flex items-center">
          <TrendingUp className="h-4 w-4 md:h-5 md:w-5 mr-2" />
          PRICE CHART
        </h3>
        <div className="text-right">
          <div className="text-xs text-muted-foreground font-mono">24h Change</div>
          <div className={`text-sm font-mono font-bold flex items-center justify-end ${priceChange >= 0 ? 'text-neon-green' : 'text-red-500'}`}>
            {priceChange >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
          <XAxis 
            dataKey="time" 
            stroke="#888"
            style={{ fontSize: '10px', fontFamily: 'monospace' }}
          />
          <YAxis 
            stroke="#888"
            style={{ fontSize: '10px', fontFamily: 'monospace' }}
            tickFormatter={(value) => `$${value < 0.01 ? value.toFixed(6) : value.toFixed(4)}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #00ff00',
              borderRadius: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#00ff00' }}
            formatter={(value: number, name: string) => {
              if (name === 'price') {
                return [`$${value < 0.01 ? value.toFixed(10).replace(/\.?0+$/, '') : value.toFixed(6)}`, 'Price'];
              }
              return [value, name];
            }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#00ff00" 
            strokeWidth={2}
            dot={{ fill: '#00ff00', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="p-3 console-bg border border-border rounded">
          <div className="text-muted-foreground mb-1">Total Trades</div>
          <div className="text-lg font-bold text-neon-green">{events.length}</div>
        </div>
        <div className="p-3 console-bg border border-border rounded">
          <div className="text-muted-foreground mb-1">Latest Price</div>
          <div className="text-lg font-bold text-neon-green">
            ${latestPrice < 0.01 ? latestPrice.toFixed(10).replace(/\.?0+$/, '') : latestPrice.toFixed(6)}
          </div>
        </div>
      </div>

      {/* Recent Trades */}
      <div className="mt-4">
        <h4 className="text-sm font-mono font-bold mb-3 text-muted-foreground">RECENT TRADES</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {events.slice(-10).reverse().map((event, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 console-bg border border-border rounded text-xs font-mono">
              <div className="flex items-center gap-2">
                {event.type === 'buy' ? (
                  <ArrowUpRight className="h-3 w-3 text-neon-green" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                )}
                <span className={event.type === 'buy' ? 'text-neon-green' : 'text-red-500'}>
                  {event.type.toUpperCase()}
                </span>
                <span className="text-muted-foreground">
                  {event.tokenAmount.toFixed(2)} tokens
                </span>
              </div>
              <div className="text-right">
                <div className="text-white">
                  ${((event.price * (prices.xrge || 0)) < 0.01 
                    ? (event.price * (prices.xrge || 0)).toFixed(10).replace(/\.?0+$/, '') 
                    : (event.price * (prices.xrge || 0)).toFixed(6))}
                </div>
                <div className="text-muted-foreground text-[10px]">
                  {new Date(event.timestamp * 1000).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
