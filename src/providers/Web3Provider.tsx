import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from '@privy-io/wagmi';
import { PrivyProvider } from '@privy-io/react-auth';
import { base } from 'wagmi/chains';

import { config, privyAppId } from '@/config/wallet';

// Setup queryClient with aggressive caching for Spotify-level performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10 minutes - data stays fresh longer
      cacheTime: 1000 * 60 * 30, // 30 minutes - keep in memory longer
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      refetchOnMount: false, // Don't refetch on component mount if data exists
      refetchOnReconnect: false, // Don't refetch on network reconnect
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 1, // Retry mutations once
    },
  },
});

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email', 'wallet'],
        defaultChain: base,
        supportedChains: [base],
        embeddedWallets: {
          ethereum: { createOnLogin: 'all-users' },
        },
        appearance: {
          theme: 'dark',
          accentColor: '#00FF00',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}