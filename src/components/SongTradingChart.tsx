import { Card } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useSongTradeEvents } from "@/hooks/useSongBondingCurve";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface SongTradingChartProps {
  songTokenAddress?: `0x${string}`;
  onDataUpdate?: () => void;
  priceInXRGE?: number;
  bondingSupply?: string;
}

export const SongTradingChart = ({ songTokenAddress, priceInXRGE, bondingSupply: bondingSupplyProp }: SongTradingChartProps) => {
  const { prices } = useTokenPrices();
  const { events, isLoading: eventsLoading } = useSongTradeEvents(songTokenAddress);
  const [chartType, setChartType] = useState<'curve' | 'price'>('curve');
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d' | 'all'>('all');
  
  // Filter events by timeframe
  const filteredEvents = useMemo(() => {
    if (events.length === 0) return [];
    
    const now = Math.floor(Date.now() / 1000);
    let cutoffTime = 0;
    
    switch (timeframe) {
      case '1h':
        cutoffTime = now - 3600;
        break;
      case '4h':
        cutoffTime = now - 14400;
        break;
      case '1d':
        cutoffTime = now - 86400;
        break;
      case 'all':
      default:
        cutoffTime = 0;
    }
    
    return events.filter(e => e.timestamp >= cutoffTime);
  }, [events, timeframe]);
  
  // Generate price chart data from events
  const priceChartData = useMemo(() => {
    if (filteredEvents.length === 0) return [];
    
    return filteredEvents.map(event => ({
      time: new Date(event.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: event.timestamp,
      price: event.price * (prices.xrge || 0), // Convert to USD
      priceXRGE: event.price,
      type: event.type
    }));
  }, [filteredEvents, prices.xrge]);
  
  // Generate bonding curve visualization data
  const bondingCurveData = useMemo(() => {
    const BONDING_CURVE_TOTAL = 990_000_000;
    const INITIAL_PRICE = 0.001; // XRGE
    const PRICE_INCREMENT = 0.000001; // XRGE
    
    // Use current supply from bondingSupply if available, otherwise show full curve
    let currentSupply = 0;
    if (bondingSupplyProp && parseFloat(bondingSupplyProp) > 0) {
      currentSupply = BONDING_CURVE_TOTAL - parseFloat(bondingSupplyProp);
    }
    
    // Generate points along the curve
    const points = [];
    const numPoints = 50;
    const maxSupply = currentSupply > 0 
      ? Math.min(currentSupply * 2, BONDING_CURVE_TOTAL) 
      : BONDING_CURVE_TOTAL / 10; // Show first 10% if no supply data
    
    for (let i = 0; i <= numPoints; i++) {
      const supply = (maxSupply / numPoints) * i;
      const price = (INITIAL_PRICE + (PRICE_INCREMENT * supply)) * (prices.xrge || 0.000001);
      points.push({
        supply: supply / 1_000_000, // Convert to millions
        price: price,
        isCurrent: currentSupply > 0 && Math.abs(supply - currentSupply) < (maxSupply / numPoints)
      });
    }
    
    console.log('📊 Bonding curve data:', { bondingSupply: bondingSupplyProp, currentSupply, points: points.length, xrgePrice: prices.xrge });
    return points;
  }, [bondingSupplyProp, prices.xrge]);
  
  console.log('📊 Price events:', { total: events.length, filtered: filteredEvents.length, timeframe });
  
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

  // Always show chart if we have data points (fallback to default curve if no supply data)
  const currentPriceUSD = priceInXRGE ? priceInXRGE * (prices.xrge || 0) : 0;
  const BONDING_CURVE_TOTAL = 990_000_000;
  const currentSupplyFromData = bondingSupplyProp && parseFloat(bondingSupplyProp) > 0 
    ? BONDING_CURVE_TOTAL - parseFloat(bondingSupplyProp) 
    : 0;

  return (
    <Card className="console-bg tech-border p-4 md:p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-mono font-bold neon-text flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {chartType === 'curve' ? 'BONDING CURVE' : 'PRICE CHART'}
          </h3>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'curve' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('curve')}
              className="text-xs font-mono h-7"
            >
              CURVE
            </Button>
            <Button
              variant={chartType === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('price')}
              className="text-xs font-mono h-7"
              disabled={events.length === 0 && !eventsLoading}
            >
              PRICE
            </Button>
          </div>
        </div>
        
        {chartType === 'price' && (
          <div className="flex gap-1 mb-3">
            {(['1h', '4h', '1d', 'all'] as const).map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe(tf)}
                className="text-[10px] font-mono h-6 px-2"
              >
                {tf.toUpperCase()}
              </Button>
            ))}
          </div>
        )}
        
        <p className="text-xs text-muted-foreground font-mono mb-2">
          {chartType === 'curve' 
            ? 'Price increases as more tokens are bought from the curve'
            : `Showing ${filteredEvents.length} trades${timeframe !== 'all' ? ` (last ${timeframe})` : ''}`
          }
        </p>
      </div>

      {/* Chart */}
      <div className="h-[250px] md:h-[300px] mb-4">
        {chartType === 'curve' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={bondingCurveData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff9f" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff9f" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
              <XAxis 
                dataKey="supply" 
                stroke="#888"
                style={{ fontSize: '10px' }}
                label={{ value: 'Supply (M tokens)', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 11 }}
              />
              <YAxis 
                stroke="#888"
                style={{ fontSize: '10px' }}
                tickFormatter={(value) => `$${value.toFixed(6)}`}
                label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #00ff9f',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#00ff9f' }}
                formatter={(value: number) => [`$${value.toFixed(8)}`, 'Price']}
                labelFormatter={(label) => `${label}M tokens sold`}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#00ff9f"
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : priceChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={priceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.3} />
              <XAxis 
                dataKey="time" 
                stroke="#888"
                style={{ fontSize: '10px' }}
                label={{ value: 'Time', position: 'insideBottom', offset: -5, fill: '#888', fontSize: 11 }}
              />
              <YAxis 
                stroke="#888"
                style={{ fontSize: '10px' }}
                tickFormatter={(value) => `$${value < 0.01 ? value.toFixed(8) : value.toFixed(6)}`}
                label={{ value: 'Price (USD)', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #00ff9f',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
                labelStyle={{ color: '#00ff9f' }}
                formatter={(value: number, name: string) => [
                  `$${value < 0.01 ? value.toFixed(8) : value.toFixed(6)}`,
                  'Price'
                ]}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#00ff9f"
                strokeWidth={2}
                dot={{ fill: '#00ff9f', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : eventsLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green mx-auto mb-2"></div>
              <p className="text-xs text-muted-foreground font-mono">Loading trades...</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground font-mono">No trades yet</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">Current Price</p>
          <p className="text-lg font-mono font-bold text-neon-green">
            {currentPriceUSD > 0 ? (
              currentPriceUSD < 0.01 
                ? `$${currentPriceUSD.toFixed(10).replace(/\.?0+$/, '')}` 
                : `$${currentPriceUSD.toFixed(6)}`
            ) : (
              "Loading..."
            )}
          </p>
          {priceInXRGE && (
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {priceInXRGE.toFixed(6)} XRGE
            </p>
          )}
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">Tokens Sold</p>
          <p className="text-lg font-mono font-bold text-blue-400">
            {currentSupplyFromData > 0 
              ? `${(currentSupplyFromData / 1_000_000).toFixed(2)}M`
              : "0.00M"
            }
          </p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            {currentSupplyFromData > 0
              ? `${(currentSupplyFromData / BONDING_CURVE_TOTAL * 100).toFixed(2)}% of curve`
              : "Just deployed"
            }
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
