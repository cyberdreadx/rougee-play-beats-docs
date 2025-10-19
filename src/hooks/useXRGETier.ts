import { useReadContract } from "wagmi";
import { Address, formatEther } from "viem";

const XRGE_TOKEN_ADDRESS = "0x147120faEC9277ec02d957584CFCD92B56A24317" as Address;

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

export interface XRGETier {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  minAmount: number;
  benefits: string[];
}

export const XRGE_TIERS: XRGETier[] = [
  {
    name: "Diamond Whale",
    icon: "💎",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/50",
    minAmount: 10_000_000, // 10M+ XRGE
    benefits: ["Unlimited uploads", "Premium badge", "VIP status", "Early access"]
  },
  {
    name: "Platinum Whale",
    icon: "🐋",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/50",
    minAmount: 5_000_000, // 5M+ XRGE
    benefits: ["Unlimited uploads", "Premium badge", "Whale status"]
  },
  {
    name: "Gold Whale",
    icon: "👑",
    color: "text-yellow-400",
    bgColor: "bg-gradient-to-r from-yellow-500/20 to-amber-500/20",
    borderColor: "border-yellow-500 shadow-lg shadow-yellow-500/50",
    minAmount: 1_000_000, // 1M+ XRGE
    benefits: ["Unlimited uploads", "Premium badge"]
  },
  {
    name: "Degen",
    icon: "🦍",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/50",
    minAmount: 100_000, // 100K+ XRGE
    benefits: ["20 uploads", "Strong holder"]
  },
  {
    name: "Ape",
    icon: "🦧",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/50",
    minAmount: 10_000, // 10K+ XRGE
    benefits: ["20 uploads", "Holder badge"]
  },
  {
    name: "Holder",
    icon: "🎵",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/50",
    minAmount: 1_000, // 1K+ XRGE
    benefits: ["20 uploads", "Community member"]
  },
];

export const useXRGETier = (walletAddress: string | null) => {
  // Check XRGE balance on-chain
  const { data: xrgeBalance, isLoading } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: walletAddress ? [walletAddress as Address] : undefined,
    query: {
      enabled: !!walletAddress,
      staleTime: 60000,
      refetchInterval: 120000,
    }
  });

  const xrgeBalanceNumber = xrgeBalance ? parseFloat(formatEther(xrgeBalance)) : 0;

  // Find the highest tier the user qualifies for
  const tier = XRGE_TIERS.find(t => xrgeBalanceNumber >= t.minAmount) || null;

  const isPremium = xrgeBalanceNumber >= 1_000_000; // 1M+ XRGE

  return {
    tier,
    xrgeBalance: xrgeBalanceNumber,
    isPremium,
    isLoading,
    isWhale: xrgeBalanceNumber >= 1_000_000,
    isDegen: xrgeBalanceNumber >= 100_000,
  };
};

