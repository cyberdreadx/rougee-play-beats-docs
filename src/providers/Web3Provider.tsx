import { createWeb3Modal } from '@web3modal/wagmi/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';

import { config, projectId } from '@/config/wallet';

// Setup queryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
  enableOnramp: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00FF00',
    '--w3m-border-radius-master': '4px',
  },
  allWallets: 'HIDE',
  featuredWalletIds: [],
  includeWalletIds: [],
  excludeWalletIds: [],
});

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}