import { useQuery } from "@tanstack/react-query";

interface TokenPrices {
  eth: number;
  xrge: number;
  kta: number;
  usdc: number;
}

export const useTokenPrices = () => {
  const { data: prices, isLoading } = useQuery<TokenPrices>({
    queryKey: ['token-prices'],
    queryFn: async () => {
      // Fetch prices from CoinGecko or similar API
      // For now, using mock data - replace with actual API calls
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        const data = await response.json();
        
        return {
          eth: data.ethereum?.usd || 0,
          xrge: 0.01, // Mock price - replace with actual
          kta: 0.005, // Mock price - replace with actual
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
