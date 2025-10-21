import { useQuery } from "@tanstack/react-query";
import { KTA_TOKEN_ADDRESS } from "@/hooks/useXRGESwap";

interface TokenPrices {
  eth: number;
  xrge: number;
  kta: number;
  usdc: number;
}

const XRGE_TOKEN_ADDRESS = "0x147120faEC9277ec02d957584CFCD92B56A24317";

export const useTokenPrices = () => {
  const { data: prices, isLoading } = useQuery<TokenPrices>({
    queryKey: ['token-prices'],
    queryFn: async () => {
      try {
        // Fetch ETH price from CoinGecko
        const ethResponse = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        const ethData = await ethResponse.json();
        const ethPrice = ethData.ethereum?.usd || 0;

        // Fetch XRGE price from DEX Screener
        let xrgePrice = 0;
        try {
          const xrgeResponse = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${XRGE_TOKEN_ADDRESS}`
          );
          const xrgeData = await xrgeResponse.json();
          
          if (xrgeData.pairs && xrgeData.pairs.length > 0) {
            // Sort pairs by liquidity (highest first) and filter for Base chain
            const basePairs = xrgeData.pairs
              .filter((pair: any) => pair.chainId === 'base')
              .sort((a: any, b: any) => {
                const aLiq = parseFloat(a.liquidity?.usd || '0');
                const bLiq = parseFloat(b.liquidity?.usd || '0');
                return bLiq - aLiq;
              });
            
            // Use the pair with highest liquidity on Base
            const bestPair = basePairs[0] || xrgeData.pairs[0];
            
            if (bestPair?.priceUsd) {
              xrgePrice = parseFloat(bestPair.priceUsd);
            }
          }
        } catch (error) {
          console.error('Failed to fetch XRGE price from DEX Screener:', error);
        }

        // Fetch KTA price from DEX Screener
        let ktaPrice = 0;
        try {
          const ktaResponse = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${KTA_TOKEN_ADDRESS}`
          );
          const ktaData = await ktaResponse.json();
          
          const basePair = ktaData.pairs?.find((pair: any) => 
            pair.chainId === 'base'
          ) || ktaData.pairs?.[0];
          
          ktaPrice = basePair?.priceUsd ? parseFloat(basePair.priceUsd) : 0;
        } catch (error) {
          console.error('Failed to fetch KTA price from DEX Screener:', error);
        }
        
        return {
          eth: ethPrice,
          xrge: xrgePrice,
          kta: ktaPrice,
          usdc: 1, // USDC is pegged to $1
        };
      } catch (error) {
        console.error('Failed to fetch token prices:', error);
        return {
          eth: 0,
          xrge: 0,
          kta: 0,
          usdc: 1,
        };
      }
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const calculateUsdValue = (tokenAmount: number, tokenSymbol: keyof TokenPrices) => {
    if (!prices) return 0;
    return tokenAmount * prices[tokenSymbol];
  };

  return {
    prices: prices || { eth: 0, xrge: 0, kta: 0, usdc: 1 },
    isLoading,
    calculateUsdValue,
  };
};
