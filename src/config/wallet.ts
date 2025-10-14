import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';
import { base } from 'wagmi/chains';

// Your Privy App ID (publishable key)
export const privyAppId = 'cmfr2qk33005dl20dh3yirnho';

// RPC endpoints - QuickNode with fallback
const RPC_URLS = [
  'https://late-necessary-yard.base-mainnet.quiknode.pro/71b03e5aaf7eea88b47d530b91a2cdfca7438775/', // QuickNode (CORS enabled)
  'https://mainnet.base.org', // Fallback: Public Base RPC
];

// Define the chains
const chains = [base] as const;

// Create wagmi config for Privy with fallback RPCs
export const config = createConfig({
  chains,
  transports: {
    [base.id]: http(RPC_URLS[0], {
      batch: true,
      timeout: 30_000,
      retryCount: 3,
    }),
  },
});

export { chains };