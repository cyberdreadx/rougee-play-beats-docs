import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { mainnet, arbitrum, polygon, base, optimism } from 'wagmi/chains';

// Your WalletConnect Project ID
export const projectId = 'cd4f138cd45bcb14df400b15eb4e6e7c';

// Define the chains
const chains = [mainnet, arbitrum, polygon, base, optimism] as const;

// App metadata
const metadata = {
  name: 'ROUGEE.PLAY',
  description: 'Blockchain Music Platform - Discover, stream, and support artists on the decentralized music platform',
  url: 'https://rougee.play', // Update with your domain
  icons: ['https://rougee.play/icon-192x192.png'] // Update with your icon
};

// Create wagmi config
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableWalletConnect: true,
  enableInjected: true,
  enableEIP6963: true,
  enableCoinbase: true,
});

export { chains };