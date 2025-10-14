import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

interface SongTradingChartProps {
  songTokenAddress?: `0x${string}`;
}

// Placeholder data - will be replaced with real blockchain event data
const generateMockPriceData = () => {
  const data = [];
  let price = 0.001;
  const now = Date.now();
  
  for (let i = 0; i < 24; i++) {
    const timestamp = now - (24 - i) * 3600000; // hourly data for 24h
    price = price * (1 + (Math.random() - 0.4) * 0.1); // some volatility
    data.push({
      time: new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      price: parseFloat(price.toFixed(6)),
      volume: Math.floor(Math.random() * 1000) + 100,
    });
  }
  return data;
};

const priceData = generateMockPriceData();

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="console-bg border border-neon-green p-3 rounded-lg">
        <p className="text-xs font-mono text-muted-foreground mb-1">{payload[0].payload.time}</p>
        <p className="text-sm font-mono font-bold text-neon-green">
          ${payload[0].value?.toFixed(6)} XRGE
        </p>
        {payload[0].payload.volume && (
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Vol: ${payload[0].payload.volume}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const VolumeTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="console-bg border border-neon-green p-3 rounded-lg">
        <p className="text-xs font-mono text-muted-foreground mb-1">{payload[0].payload.time}</p>
        <p className="text-sm font-mono font-bold text-neon-green">
          ${payload[0].value} Volume
        </p>
      </div>
    );
  }
  return null;
};

export const SongTradingChart = ({ songTokenAddress }: SongTradingChartProps) => {
  // Only show mock data if not deployed
  const showMockData = !songTokenAddress;
  const currentPrice = priceData[priceData.length - 1]?.price || 0;
  const previousPrice = priceData[priceData.length - 2]?.price || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = ((priceChange / previousPrice) * 100).toFixed(2);
  const isPositive = priceChange >= 0;

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

  return (
    <Card className="console-bg tech-border p-4 md:p-6">
      <div className="mb-4 md:mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg md:text-xl font-mono font-bold neon-text flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            PRICE CHART
          </h3>
          <div className="text-right">
            <div className="text-xl md:text-2xl font-mono font-bold text-neon-green">
              ${currentPrice.toFixed(6)}
            </div>
            <div className={`text-xs md:text-sm font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{priceChangePercent}% (24h)
            </div>
          </div>
        </div>
        
        <p className="text-xs text-yellow-500 font-mono">
          ⚠️ Demo chart - Real blockchain data coming soon
        </p>
      </div>

      <Tabs defaultValue="price" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="price" className="text-xs sm:text-sm">
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            PRICE
          </TabsTrigger>
          <TabsTrigger value="volume" className="text-xs sm:text-sm">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            VOLUME
          </TabsTrigger>
        </TabsList>

        <TabsContent value="price" className="mt-0">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--neon-green))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--neon-green))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px', fontFamily: 'monospace' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px', fontFamily: 'monospace' }}
                tickFormatter={(value) => `$${value.toFixed(4)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--neon-green))"
                fill="url(#priceGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>

        <TabsContent value="volume" className="mt-0">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px', fontFamily: 'monospace' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px', fontFamily: 'monospace' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<VolumeTooltip />} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="hsl(var(--primary))"
                fill="url(#volumeGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-3 gap-3 md:gap-4 mt-4 md:mt-6">
        <div className="console-bg p-2 md:p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-mono mb-1">24h High</p>
          <p className="text-sm md:text-base font-mono font-bold text-foreground">
            ${Math.max(...priceData.map(d => d.price)).toFixed(6)}
          </p>
        </div>
        <div className="console-bg p-2 md:p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-mono mb-1">24h Low</p>
          <p className="text-sm md:text-base font-mono font-bold text-foreground">
            ${Math.min(...priceData.map(d => d.price)).toFixed(6)}
          </p>
        </div>
        <div className="console-bg p-2 md:p-3 rounded-lg border border-border">
          <p className="text-xs text-muted-foreground font-mono mb-1">24h Vol</p>
          <p className="text-sm md:text-base font-mono font-bold text-foreground">
            ${priceData.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};
