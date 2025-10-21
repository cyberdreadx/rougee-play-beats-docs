import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { Address } from 'viem';

interface Song24hData {
  priceChange24h: number | null;
  volume24h: number;
  loading: boolean;
}

/**
 * Shared hook for fetching 24h data for a song
 * This ensures consistent data between mobile and desktop views
 */
export const useSong24hData = (tokenAddress: Address | null, bondingSupplyStr: string | null) => {
  const [data, setData] = useState<Song24hData>({
    priceChange24h: null,
    volume24h: 0,
    loading: true
  });
  
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetch24hData = async () => {
      console.log('🔍 useSong24hData: Starting fetch for', { tokenAddress, bondingSupplyStr, publicClient: !!publicClient });
      
      if (!publicClient || !tokenAddress || !bondingSupplyStr) {
        console.log('❌ useSong24hData: Missing required params', { publicClient: !!publicClient, tokenAddress, bondingSupplyStr });
        setData({ priceChange24h: null, volume24h: 0, loading: false });
        return;
      }
      
      const BONDING_CURVE_ADDRESS = '0xCeE9c18C448487a1deAac3E14974C826142C50b5' as Address;
      const XRGE_ADDRESS = '0x147120faEC9277ec02d957584CFCD92B56A24317' as Address;
      
      try {
        setData(prev => ({ ...prev, loading: true }));
        
        // Get current block
        const currentBlock = await publicClient.getBlockNumber();
        
        // Base has ~2 second block time, so 24h = ~43,200 blocks
        const blocksIn24h = 43200;
        const fromBlock = currentBlock - BigInt(blocksIn24h);
        
        // Fetch song token Transfer events for 24h
        const songTokenLogs = await publicClient.getLogs({
          address: tokenAddress,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', indexed: true, name: 'from' },
              { type: 'address', indexed: true, name: 'to' },
              { type: 'uint256', indexed: false, name: 'value' }
            ]
          },
          fromBlock,
          toBlock: currentBlock
        });
        
        // Fetch XRGE Transfer events for 24h
        const xrgeLogs = await publicClient.getLogs({
          address: XRGE_ADDRESS,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', indexed: true, name: 'from' },
              { type: 'address', indexed: true, name: 'to' },
              { type: 'uint256', indexed: false, name: 'value' }
            ]
          },
          fromBlock,
          toBlock: currentBlock
        });
        
        // Build a map of XRGE transfers by transaction hash
        const xrgeByTx = new Map<string, number>();
        const FEE_ADDRESS = '0xb787433e138893a0ed84d99e82c7da260a940b1e';
        
        for (const log of xrgeLogs) {
          const { args } = log as any;
          const from = (args.from as string).toLowerCase();
          const to = (args.to as string).toLowerCase();
          const amount = Number(args.value as bigint) / 1e18;
          
          // Skip fee transfers
          if (from === FEE_ADDRESS.toLowerCase() || to === FEE_ADDRESS.toLowerCase()) {
            continue;
          }
          
          // Only count transfers involving the bonding curve
          if (from === BONDING_CURVE_ADDRESS.toLowerCase() || to === BONDING_CURVE_ADDRESS.toLowerCase()) {
            const txHash = log.transactionHash;
            const existing = xrgeByTx.get(txHash) || 0;
            xrgeByTx.set(txHash, existing + amount);
          }
        }
        
        // Calculate volume from song token transfers
        let volume = 0;
        for (const log of songTokenLogs) {
          const { args } = log as any;
          const from = (args.from as string).toLowerCase();
          const to = (args.to as string).toLowerCase();
          const amount = Number(args.value as bigint) / 1e18;
          
          // Only count transfers involving the bonding curve
          if (from === BONDING_CURVE_ADDRESS.toLowerCase() || to === BONDING_CURVE_ADDRESS.toLowerCase()) {
            const txHash = log.transactionHash;
            const xrgeAmount = xrgeByTx.get(txHash) || 0;
            if (xrgeAmount > 0) {
              volume += xrgeAmount;
            }
          }
        }
        
        // Calculate price change from actual trades
        let priceChange24h = 0;
        if (songTokenLogs.length > 0) {
          // Find first and last trade prices
          const trades: { timestamp: number; priceXRGE: number }[] = [];
          
          for (const log of songTokenLogs) {
            const { args } = log as any;
            const from = (args.from as string).toLowerCase();
            const to = (args.to as string).toLowerCase();
            const amount = Number(args.value as bigint) / 1e18;
            
            if (from === BONDING_CURVE_ADDRESS.toLowerCase() || to === BONDING_CURVE_ADDRESS.toLowerCase()) {
              const block = await publicClient.getBlock({ blockNumber: log.blockNumber });
              const timestamp = Number(block.timestamp) * 1000;
              const xrgeAmount = xrgeByTx.get(log.transactionHash) || 0;
              const priceXRGE = amount > 0 ? xrgeAmount / amount : 0;
              
              if (priceXRGE > 0) {
                trades.push({ timestamp, priceXRGE });
              }
            }
          }
          
          if (trades.length >= 2) {
            trades.sort((a, b) => a.timestamp - b.timestamp);
            const firstPrice = trades[0].priceXRGE;
            const lastPrice = trades[trades.length - 1].priceXRGE;
            priceChange24h = ((lastPrice - firstPrice) / firstPrice) * 100;
          }
        }
        
        console.log('✅ useSong24hData: Successfully fetched data', { priceChange24h, volume24h: volume });
        
        setData({
          priceChange24h,
          volume24h: volume,
          loading: false
        });
        
      } catch (error) {
        console.error('Error fetching 24h data:', error);
        setData({
          priceChange24h: null,
          volume24h: 0,
          loading: false
        });
      }
    };

    fetch24hData();
  }, [publicClient, tokenAddress, bondingSupplyStr]);

  return data;
};
