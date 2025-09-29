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
  enableAnalytics: false, // Disable analytics to avoid errors
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00FF00', // Neon green to match ROUGEE.PLAY theme
    '--w3m-border-radius-master': '4px',
  },
  enableOnramp: false, // Disable onramp to reduce complexity
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