import { http } from "wagmi";
import { createConfig } from "@privy-io/wagmi";
import { base } from "wagmi/chains";

// Your Privy App ID (publishable key)
export const privyAppId = "cmfr2qk33005dl20dh3yirnho";

// RPC endpoints - QuickNode with fallback
const RPC_URLS = [
  "https://base-mainnet.g.alchemy.com/v2/24-aCNa8b19h_zgsR_292", // Alchemy Base mainnet (primary for transactions)
  "https://rpc.ankr.com/base", // Ankr public RPC (fallback)
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
