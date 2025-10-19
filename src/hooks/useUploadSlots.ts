import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { useReadContract } from "wagmi";
import { Address, formatEther } from "viem";

const XRGE_TOKEN_ADDRESS = "0x147120faEC9277ec02d957584CFCD92B56A24317" as Address;
const MINIMUM_XRGE_REQUIRED = 1_000_000; // 1 million XRGE to unlock unlimited uploads
const FREE_TIER_SLOTS = 20; // Free users get 20 slots
const PREMIUM_TIER_SLOTS = 1000; // Premium users (1M+ XRGE holders) get 1000 slots

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  }
] as const;

export const useUploadSlots = () => {
  const { fullAddress } = useWallet();
  const queryClient = useQueryClient();

  // Check XRGE balance on-chain with caching
  const { data: xrgeBalance, isLoading: isLoadingBalance } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: fullAddress ? [fullAddress as Address] : undefined,
    query: {
      enabled: !!fullAddress,
      staleTime: 180000, // 3 minutes - balance rarely changes
      cacheTime: 600000, // 10 minutes cache
      refetchInterval: false, // Manual refetch only
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  });

  // Get user's upload count from profile
  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['upload-count', fullAddress],
    queryFn: async () => {
      if (!fullAddress) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('total_songs, wallet_address')
        .ilike('wallet_address', fullAddress)
        .maybeSingle();

      if (error) {
        console.error('Error fetching upload slots:', error);
        return null;
      }

      return data;
    },
    enabled: !!fullAddress,
    staleTime: 60000, // Consider data fresh for 60 seconds
    refetchInterval: 120000 // Only refetch every 2 minutes
  });

  // Calculate slots based on XRGE balance
  const xrgeBalanceNumber = xrgeBalance ? parseFloat(formatEther(xrgeBalance)) : 0;
  const isPremium = xrgeBalanceNumber >= MINIMUM_XRGE_REQUIRED;
  const totalSlots = isPremium ? PREMIUM_TIER_SLOTS : FREE_TIER_SLOTS;
  const songsUploaded = profile?.total_songs || 0;
  const slotsRemaining = Math.max(0, totalSlots - songsUploaded);

  return {
    // Slot counts
    slotsRemaining,
    songsUploaded,
    totalSlots,
    
    // Premium status
    isPremium,
    xrgeBalance: xrgeBalanceNumber,
    xrgeRequired: MINIMUM_XRGE_REQUIRED,
    xrgeNeeded: Math.max(0, MINIMUM_XRGE_REQUIRED - xrgeBalanceNumber),
    
    // Loading states
    isLoading: isLoadingBalance || isLoadingProfile,
    
    // Refresh function
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['upload-count', fullAddress] });
    }
  };
};
