import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { useTokenPrices } from '@/hooks/useTokenPrices';
import { TradeData } from './SongTradingHistory';

interface TradingViewCandlestickChartProps {
  bondingSupply?: string;
  priceInXRGE?: number;
  timeFilter: '1H' | '24H' | '7D' | '30D' | 'ALL';
  trades?: TradeData[]; // Real trading history data
}

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface VolumeData {
  time: number;
  value: number;
  color: string;
}

export const TradingViewCandlestickChart = ({ 
  bondingSupply, 
  priceInXRGE,
  timeFilter,
  trades = []
}: TradingViewCandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { prices } = useTokenPrices();
  
  // Store trade data for tooltip lookup
  const tradeDataRef = useRef<Map<number, TradeData[]>>(new Map());
  
  // Track if we're showing fallback data
  const [showingFallback, setShowingFallback] = useState(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Responsive height based on viewport
    const isMobile = window.innerWidth < 768;
    const chartHeight = isMobile ? 250 : 350;

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#888',
        fontSize: isMobile ? 10 : 12,
      },
      grid: {
        vertLines: { color: '#333', style: 1 },
        horzLines: { color: '#333', style: 1 },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: '#555',
        barSpacing: isMobile ? 3 : 6, // Tighter spacing on mobile
        minBarSpacing: isMobile ? 1 : 2,
      },
      rightPriceScale: {
        visible: true,
        autoScale: true,
        borderColor: '#555',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        mode: 1, // Normal price scale mode
        minimumWidth: isMobile ? 50 : 60, // Smaller price scale on mobile
      },
      crosshair: {
        mode: 1, // Magnet mode - better for touch on mobile
        vertLine: {
          width: 1,
          color: '#00ff9f',
          style: 3, // Dashed line
          labelBackgroundColor: '#00ff9f',
          labelVisible: true,
        },
        horzLine: {
          width: 1,
          color: '#00ff9f',
          style: 3,
          labelBackgroundColor: '#00ff9f',
          labelVisible: true,
        },
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      kineticScroll: {
        touch: true,
        mouse: false,
      },
    });

    chartRef.current = chart;

    // Create candlestick series (v5.x API: import CandlestickSeries and use with addSeries)
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff9f',
      downColor: '#ff4757',
      borderUpColor: '#00ff9f',
      borderDownColor: '#ff4757',
      wickUpColor: '#00ff9f',
      wickDownColor: '#ff4757',
      priceFormat: {
        type: 'price',
        precision: 8,
        minMove: 0.00000001,
      },
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Create volume histogram series (displayed below the main chart)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume', // Separate scale for volume
      scaleMargins: {
        top: 0.90, // Volume takes up bottom 10% of chart (very small)
        bottom: 0,
      },
    });

    volumeSeriesRef.current = volumeSeries;
    console.log('✅ Candlestick and volume series created successfully');

    // Subscribe to crosshair move to show custom tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!tooltipRef.current || !param.time || !param.point) {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
        return;
      }

      const data = param.seriesData.get(candlestickSeries);
      if (!data) {
        tooltipRef.current.style.display = 'none';
        return;
      }

      const candleData = data as any;
      const trades = tradeDataRef.current.get(param.time as number) || [];

      // Calculate buy/sell stats
      const buyTrades = trades.filter(t => t.type === 'buy');
      const sellTrades = trades.filter(t => t.type === 'sell');
      const buyVolume = buyTrades.reduce((sum, t) => sum + t.amount, 0);
      const sellVolume = sellTrades.reduce((sum, t) => sum + t.amount, 0);

      // Format tooltip HTML (smaller font on mobile)
      const time = new Date((param.time as number) * 1000);
      const isMobileTooltip = window.innerWidth < 768;
      const fontSize = isMobileTooltip ? '9px' : '11px';
      
      tooltipRef.current.innerHTML = `
        <div style="font-family: monospace; font-size: ${fontSize}; line-height: 1.4;">
          <div style="color: #00ff9f; font-weight: bold; margin-bottom: 4px;">
            ${time.toLocaleString()}
          </div>
          <div style="margin-bottom: 6px;">
            <div style="color: #888;">O: <span style="color: #fff;">$${candleData.open.toFixed(8)}</span></div>
            <div style="color: #888;">H: <span style="color: #00ff9f;">$${candleData.high.toFixed(8)}</span></div>
            <div style="color: #888;">L: <span style="color: #ff4757;">$${candleData.low.toFixed(8)}</span></div>
            <div style="color: #888;">C: <span style="color: #fff;">$${candleData.close.toFixed(8)}</span></div>
          </div>
          <div style="border-top: 1px solid #333; padding-top: 4px; margin-top: 4px;">
            <div style="color: #00ff9f;">
              ▲ Buys: ${buyTrades.length} (${buyVolume.toLocaleString(undefined, {maximumFractionDigits: 0})} tokens)
            </div>
            <div style="color: #ff4757;">
              ▼ Sells: ${sellTrades.length} (${sellVolume.toLocaleString(undefined, {maximumFractionDigits: 0})} tokens)
            </div>
            <div style="color: #888; margin-top: 2px;">
              Total: ${trades.length} trades
            </div>
          </div>
        </div>
      `;
      
      // Smart positioning: prevent tooltip from going off-screen (especially on mobile)
      tooltipRef.current.style.display = 'block';
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;
      const containerWidth = chartContainerRef.current?.clientWidth || 0;
      const containerHeight = isMobile ? 250 : 350;
      
      // Position to the right by default, but flip to left if it would go off-screen
      let left = param.point.x + 15;
      if (left + tooltipWidth > containerWidth) {
        left = param.point.x - tooltipWidth - 15;
      }
      
      // Position below by default, but flip to above if it would go off-screen
      let top = param.point.y + 15;
      if (top + tooltipHeight > containerHeight) {
        top = param.point.y - tooltipHeight - 15;
      }
      
      tooltipRef.current.style.left = Math.max(0, left) + 'px';
      tooltipRef.current.style.top = Math.max(0, top) + 'px';
    });

    // Handle resize (including mobile orientation changes)
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const isMobileNow = window.innerWidth < 768;
        const newHeight = isMobileNow ? 250 : 350;
        
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: newHeight,
        });
        
        chartRef.current.timeScale().fitContent();
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Also handle orientation change on mobile
    window.addEventListener('orientationchange', handleResize);

    // Store last tap position and timeout
    let tapTimeout: NodeJS.Timeout | null = null;
    let lastTapPosition: { x: number; y: number } | null = null;
    
    // Add tap/click handler to show tooltip on mobile
    const handleTap = (e: MouseEvent | TouchEvent) => {
      if (!chartRef.current || !chartContainerRef.current || !candlestickSeriesRef.current || !tooltipRef.current) return;
      
      const rect = chartContainerRef.current.getBoundingClientRect();
      let clientX: number, clientY: number;
      
      if (e instanceof TouchEvent) {
        const touch = e.touches[0] || e.changedTouches[0];
        if (!touch) return;
        clientX = touch.clientX;
        clientY = touch.clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      
      // Store tap position
      lastTapPosition = { x, y };
      
      // Convert pixel coordinates to time and price
      const timeScale = chartRef.current.timeScale();
      const time = timeScale.coordinateToTime(x);
      
      if (time === null) return;
      
      // Get the data point at this time
      const dataPoint = candlestickSeriesRef.current.dataByIndex(
        timeScale.logicalToCoordinate(time as any) as any
      );
      
      // Find the closest candle data
      const candles = Array.from(tradeDataRef.current.keys());
      const closestTime = candles.reduce((prev, curr) => {
        return Math.abs(curr - (time as number)) < Math.abs(prev - (time as number)) ? curr : prev;
      }, candles[0]);
      
      const trades = tradeDataRef.current.get(closestTime) || [];
      
      if (trades.length === 0) return;
      
      // Calculate OHLC from trades
      const prices = trades.map(t => t.priceUSD);
      const candleData = {
        open: prices[0],
        close: prices[prices.length - 1],
        high: Math.max(...prices),
        low: Math.min(...prices),
      };
      
      // Calculate buy/sell stats
      const buyTrades = trades.filter(t => t.type === 'buy');
      const sellTrades = trades.filter(t => t.type === 'sell');
      const buyVolume = buyTrades.reduce((sum, t) => sum + t.amount, 0);
      const sellVolume = sellTrades.reduce((sum, t) => sum + t.amount, 0);
      
      // Format tooltip HTML
      const displayTime = new Date(closestTime * 1000);
      const isMobileTooltip = window.innerWidth < 768;
      const fontSize = isMobileTooltip ? '9px' : '11px';
      
      tooltipRef.current.innerHTML = `
        <div style="font-family: monospace; font-size: ${fontSize}; line-height: 1.4;">
          <div style="color: #00ff9f; font-weight: bold; margin-bottom: 4px;">
            ${displayTime.toLocaleString()}
          </div>
          <div style="margin-bottom: 6px;">
            <div style="color: #888;">O: <span style="color: #fff;">$${candleData.open.toFixed(8)}</span></div>
            <div style="color: #888;">H: <span style="color: #00ff9f;">$${candleData.high.toFixed(8)}</span></div>
            <div style="color: #888;">L: <span style="color: #ff4757;">$${candleData.low.toFixed(8)}</span></div>
            <div style="color: #888;">C: <span style="color: #fff;">$${candleData.close.toFixed(8)}</span></div>
          </div>
          <div style="border-top: 1px solid #333; padding-top: 4px; margin-top: 4px;">
            <div style="color: #00ff9f;">
              ▲ Buys: ${buyTrades.length} (${buyVolume.toLocaleString(undefined, {maximumFractionDigits: 0})} tokens)
            </div>
            <div style="color: #ff4757;">
              ▼ Sells: ${sellTrades.length} (${sellVolume.toLocaleString(undefined, {maximumFractionDigits: 0})} tokens)
            </div>
            <div style="color: #888; margin-top: 2px;">
              Total: ${trades.length} trades
            </div>
          </div>
        </div>
      `;
      
      // Show tooltip
      tooltipRef.current.style.display = 'block';
      const tooltipWidth = tooltipRef.current.offsetWidth;
      const tooltipHeight = tooltipRef.current.offsetHeight;
      const containerWidth = chartContainerRef.current?.clientWidth || 0;
      const containerHeight = isMobileTooltip ? 250 : 350;
      
      // Position to the right by default, but flip to left if it would go off-screen
      let left = x + 15;
      if (left + tooltipWidth > containerWidth) {
        left = x - tooltipWidth - 15;
      }
      
      // Position below by default, but flip to above if it would go off-screen
      let top = y + 15;
      if (top + tooltipHeight > containerHeight) {
        top = y - tooltipHeight - 15;
      }
      
      tooltipRef.current.style.left = Math.max(0, left) + 'px';
      tooltipRef.current.style.top = Math.max(0, top) + 'px';
      
      // Clear any existing timeout
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }
      
      // Hide tooltip after 5 seconds on mobile
      if (isMobileTooltip) {
        tapTimeout = setTimeout(() => {
          if (tooltipRef.current) {
            tooltipRef.current.style.display = 'none';
          }
        }, 5000);
      }
      
      console.log('📍 Tapped at time:', displayTime, 'showing data for', trades.length, 'trades');
    };
    
    if (chartContainerRef.current) {
      chartContainerRef.current.addEventListener('click', handleTap);
      chartContainerRef.current.addEventListener('touchstart', handleTap, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (chartContainerRef.current) {
        chartContainerRef.current.removeEventListener('click', handleTap);
        chartContainerRef.current.removeEventListener('touchstart', handleTap);
      }
      if (tapTimeout) {
        clearTimeout(tapTimeout);
      }
      chart.remove();
    };
  }, []);

  // Update chart data when dependencies change
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;
    
    // Use REAL trading data if available
    if (trades.length > 0) {
      // Filter trades based on timeFilter
      const now = Date.now();
      const timeFilterMs = {
        '1H': 60 * 60 * 1000,
        '24H': 24 * 60 * 60 * 1000,
        '7D': 7 * 24 * 60 * 60 * 1000,
        '30D': 30 * 24 * 60 * 60 * 1000,
        'ALL': Infinity
      }[timeFilter];
      
      console.log('📊 Time filter:', timeFilter, 'filterMs:', timeFilterMs, 'now:', now);
      console.log('📊 All trades timestamps:', trades.map(t => ({ timestamp: t.timestamp, date: new Date(t.timestamp).toISOString() })));
      
      let filteredTrades = trades.filter(trade => {
        const age = now - trade.timestamp;
        return age <= timeFilterMs;
      }).sort((a, b) => a.timestamp - b.timestamp);
      
      console.log('📊 Filtered trades:', filteredTrades.length, 'out of', trades.length);

      // Fallback: If no trades in selected timeframe, show most recent trades
      if (filteredTrades.length === 0) {
        console.log('📊 No trades in selected time range, showing most recent trades instead');
        setShowingFallback(true);
        
        // Show the most recent trades (up to 20 for shorter timeframes, all for longer)
        const maxTrades = timeFilter === '1H' ? 10 : 
                         timeFilter === '24H' ? 20 : 
                         timeFilter === '7D' ? 50 : 
                         trades.length;
        
        filteredTrades = [...trades].sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, maxTrades)
          .sort((a, b) => a.timestamp - b.timestamp);
        
        console.log('📊 Showing', filteredTrades.length, 'most recent trades as fallback');
        
        if (filteredTrades.length === 0) {
          setShowingFallback(false);
          candlestickSeriesRef.current.setData([]);
          volumeSeriesRef.current.setData([]);
          return;
        }
      } else {
        setShowingFallback(false);
      }

      // Group trades into time-based candlesticks
      // Determine candle period based on data span and desired number of candles
      if (filteredTrades.length === 0) {
        candlestickSeriesRef.current.setData([]);
        volumeSeriesRef.current.setData([]);
        return;
      }

      const firstTradeTime = filteredTrades[0].timestamp;
      const lastTradeTime = filteredTrades[filteredTrades.length - 1].timestamp;
      const timeSpanMs = lastTradeTime - firstTradeTime;
      
      // Target 20-50 candles depending on time range
      const targetCandles = 30;
      const candlePeriodMs = Math.max(60 * 1000, timeSpanMs / targetCandles); // At least 1 minute per candle
      
      console.log('📊 Chart span:', timeSpanMs / (1000 * 60 * 60), 'hours, candle period:', candlePeriodMs / (1000 * 60), 'minutes');

      const candleMap = new Map<number, TradeData[]>();
      
      filteredTrades.forEach((trade) => {
        // Round timestamp down to the nearest candle period
        const candleTime = Math.floor(trade.timestamp / candlePeriodMs) * candlePeriodMs;
        const candleTimeSeconds = Math.floor(candleTime / 1000);
        
        if (!candleMap.has(candleTimeSeconds)) {
          candleMap.set(candleTimeSeconds, []);
        }
        candleMap.get(candleTimeSeconds)!.push(trade);
      });
      
      console.log('📊 Created', candleMap.size, 'candles from', filteredTrades.length, 'trades');

      // Convert to OHLC candlestick data
      const candlestickData: CandlestickData[] = [];
      const volumeData: VolumeData[] = [];

      Array.from(candleMap.entries())
        .sort(([a], [b]) => a - b)
        .forEach(([candleTime, candleTrades]) => {
          const time = candleTime as any; // Already in seconds

          // OHLC: Open = first trade, High = max price, Low = min price, Close = last trade
          const open = candleTrades[0].priceUSD;
          const close = candleTrades[candleTrades.length - 1].priceUSD;
          const high = Math.max(...candleTrades.map(t => t.priceUSD));
          const low = Math.min(...candleTrades.map(t => t.priceUSD));

          candlestickData.push({
            time,
            open,
            high,
            low,
            close,
          });

          // Volume = sum of all trades in this candle
          const totalVolume = candleTrades.reduce((sum, t) => sum + t.amount, 0);
          
          // Count buys vs sells to determine dominant color
          const buyVolume = candleTrades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.amount, 0);
          const sellVolume = candleTrades.filter(t => t.type === 'sell').reduce((sum, t) => sum + t.amount, 0);
          
          // Color based on whether more buying or selling happened
          const color = buyVolume > sellVolume ? '#00ff9f80' : '#ff475780';

          volumeData.push({
            time,
            value: totalVolume,
            color,
          });
          
          // Store trade data for tooltip
          tradeDataRef.current.set(time, candleTrades);
        });

      console.log('📊 Generated candlestick data from real trades:', {
        totalTrades: filteredTrades.length,
        numCandles: candlestickData.length,
        firstCandle: candlestickData[0],
        lastCandle: candlestickData[candlestickData.length - 1],
        timeFilter,
        priceRange: {
          min: Math.min(...candlestickData.map(c => c.low)),
          max: Math.max(...candlestickData.map(c => c.high)),
        }
      });

      candlestickSeriesRef.current.setData(candlestickData);
      volumeSeriesRef.current.setData(volumeData);

      // Fit content to view and ensure proper scaling
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
        
        // Force visible range to show all price data
        setTimeout(() => {
          if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
          }
        }, 100);
      }
    } else {
      // Fallback: No trades yet, show empty chart
      console.log('📊 No trading history available yet');
      candlestickSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
    }
  }, [trades, timeFilter]);

  return (
    <div className="w-full">
      <div style={{ position: 'relative' }} className="w-full overflow-hidden">
        <div 
          ref={chartContainerRef} 
          className="w-full"
          style={{ 
            height: window.innerWidth < 768 ? '250px' : '350px',
            minHeight: '200px',
            touchAction: 'manipulation', // Enable touch interactions
            WebkitTapHighlightColor: 'transparent', // Remove tap highlight on mobile
            cursor: 'crosshair',
          }}
        />
        {/* Custom Tooltip */}
        <div
          ref={tooltipRef}
          style={{
            position: 'absolute',
            display: 'none',
            padding: window.innerWidth < 768 ? '6px 8px' : '8px 12px',
            background: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid #00ff9f',
            borderRadius: '6px',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: window.innerWidth < 768 ? '220px' : '280px',
            boxShadow: '0 4px 12px rgba(0, 255, 159, 0.2)',
            transition: 'opacity 0.2s ease',
          }}
        />
      </div>
      
      {/* Fallback Warning */}
      {showingFallback && (
        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded text-center">
          <p className="text-[9px] sm:text-[10px] text-yellow-400 font-mono">
            ⚠️ No trades in the last {timeFilter}. Showing most recent trades instead.
          </p>
        </div>
      )}
    </div>
  );
};

