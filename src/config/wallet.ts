import { http } from 'wagmi';
import { createConfig } from '@privy-io/wagmi';
import { base } from 'wagmi/chains';

// Your Privy App ID (publishable key)
export const privyAppId = 'cmfr2qk33005dl20dh3yirnho';

// Define the chains
const chains = [base] as const;

// Create wagmi config for Privy
export const config = createConfig({
  chains,
  transports: {
    [base.id]: http(),
  },
});

export { chains };