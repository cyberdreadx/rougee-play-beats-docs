import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { base } from 'wagmi/chains';

// Your WalletConnect Project ID
export const projectId = 'cd4f138cd45bcb14df400b15eb4e6e7c';

// Define the chains
const chains = [base] as const;

// App metadata
const metadata = {
  name: 'ROUGEE.PLAY',
  description: 'Blockchain Music Platform - Discover, stream, and support artists on the decentralized music platform',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://rougee.play',
  icons: []
};

// Create wagmi config
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: false,
});

export { chains };