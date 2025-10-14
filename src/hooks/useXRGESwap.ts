import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount, useChainId, usePublicClient } from "wagmi";
import { parseEther, parseUnits, formatEther, Address } from "viem";
import { toast } from "@/hooks/use-toast";

// XRGESwapper contract address on Base
const XRGE_SWAPPER_ADDRESS = "0x53BeF6a3e261798246919854bC3ACCab2576F31F" as Address;
export const XRGE_TOKEN_ADDRESS = "0x147120faEC9277ec02d957584CFCD92B56A24317" as Address;
export const KTA_TOKEN_ADDRESS = "0xc0634090F2Fe6c6d75e61Be2b949464aBB498973" as Address; // KTA Token on Base
export const USDC_TOKEN_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as Address;

// Contract ABI (only functions we need)
const XRGE_SWAPPER_ABI = [
  {
    inputs: [{ name: "slippageBps", type: "uint256" }],
    name: "swapETHForXRGESimple",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "xrgeAmount", type: "uint256" },
      { name: "slippageBps", type: "uint256" },
    ],
    name: "swapXRGEForETHSimple",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "ethAmount", type: "uint256" }],
    name: "getExpectedXRGEOutput",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "xrgeAmount", type: "uint256" }],
    name: "getExpectedETHOutput",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "checkXRGEApproval",
    outputs: [
      { name: "hasApproval", type: "bool" },
      { name: "currentAllowance", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "checkUSDCApproval",
    outputs: [
      { name: "hasApproval", type: "bool" },
      { name: "currentAllowance", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "user", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "checkKTAApproval",
    outputs: [
      { name: "hasApproval", type: "bool" },
      { name: "currentAllowance", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "ktaAmount", type: "uint256" },
      { name: "slippageBps", type: "uint256" },
    ],
    name: "swapKTAForXRGESimple",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "xrgeAmount", type: "uint256" },
      { name: "slippageBps", type: "uint256" },
    ],
    name: "swapXRGEForKTASimple",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "ktaAmount", type: "uint256" }],
    name: "getExpectedXRGEFromKTA",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "xrgeAmount", type: "uint256" }],
    name: "getExpectedKTAFromXRGE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "usdcAmount", type: "uint256" },
      { name: "slippageBps", type: "uint256" },
    ],
    name: "swapUSDCForXRGESimple",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "xrgeAmount", type: "uint256" },
      { name: "slippageBps", type: "uint256" },
    ],
    name: "swapXRGEForUSDCSimple",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "usdcAmount", type: "uint256" }],
    name: "getExpectedXRGEFromUSDC",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "xrgeAmount", type: "uint256" }],
    name: "getExpectedUSDCFromXRGE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const ERC20_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const useXRGESwap = () => {
  const { address: accountAddress } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContract, writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Buy XRGE with ETH
  const buyXRGE = async (ethAmount: string, slippageBps: number = 500) => {
    console.log("buyXRGE called with:", { ethAmount, slippageBps, accountAddress, chainId });

    if (!accountAddress || !chainId) {
      console.error("Wallet not properly connected");
      toast({
        title: "Wallet Error",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      return;
    }

    try {
      const value = parseEther(ethAmount);
      console.log("Parsed value:", value.toString());

      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_SWAPPER_ADDRESS,
        abi: XRGE_SWAPPER_ABI,
        functionName: "swapETHForXRGESimple",
        args: [BigInt(slippageBps)],
        value,
      };

      console.log("Calling writeContractAsync with config:", config);
      const submittedHash = await writeContractAsync(config as any);
      console.log("Transaction submitted (buy) hash:", submittedHash);
    } catch (err) {
      console.error("Buy XRGE error:", err);
      toast({
        title: "Transaction Failed",
        description: err instanceof Error ? err.message : "Failed to swap ETH for XRGE",
        variant: "destructive",
      });
    }
  };

  // Approve XRGE for swapper contract
  const approveXRGE = async (amount: string, spenderAddress?: Address) => {
    const spender = spenderAddress || XRGE_SWAPPER_ADDRESS; // Default to swapper if not specified
    console.log("approveXRGE called with:", { amount, spender, accountAddress, chainId });

    if (!accountAddress || !chainId) {
      console.error("Wallet not properly connected");
      toast({
        title: "Wallet Error",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }

    try {
      const value = parseEther(amount);
      console.log("Parsed value:", value.toString());

      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [spender, value],
      };

      console.log("Calling writeContractAsync for approval with config:", config);
      const submittedHash = await writeContractAsync(config as any);
      console.log("Transaction submitted (approve) hash:", submittedHash);
      return submittedHash;
    } catch (err) {
      console.error("Approve error:", err);
      toast({
        title: "Approval Failed",
        description: err instanceof Error ? err.message : "Failed to approve XRGE",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Sell XRGE for ETH
  const sellXRGE = async (xrgeAmount: string, slippageBps: number = 500) => {
    console.log("sellXRGE called with:", { xrgeAmount, slippageBps, accountAddress, chainId });

    if (!accountAddress || !chainId) {
      console.error("Wallet not properly connected");
      toast({
        title: "Wallet Error",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      return;
    }

    try {
      const value = parseEther(xrgeAmount);
      console.log("Parsed value:", value.toString());

      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_SWAPPER_ADDRESS,
        abi: XRGE_SWAPPER_ABI,
        functionName: "swapXRGEForETHSimple",
        args: [value, BigInt(slippageBps)],
      };

      console.log("Calling writeContractAsync for sell with config:", config);
      const submittedHash = await writeContractAsync(config as any);
      console.log("Transaction submitted (sell) hash:", submittedHash);
    } catch (err) {
      console.error("Sell XRGE error:", err);
      toast({
        title: "Transaction Failed",
        description: err instanceof Error ? err.message : "Failed to swap XRGE for ETH",
        variant: "destructive",
      });
    }
  };

  // Buy XRGE with KTA
  const buyXRGEWithKTA = async (ktaAmount: string, slippageBps: number = 500) => {
    if (!accountAddress || !chainId) {
      toast({
        title: "Wallet Error",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Swapping KTA to XRGE:", { ktaAmount, slippageBps, accountAddress, chainId, XRGE_SWAPPER_ADDRESS });
      const value = parseEther(ktaAmount);
      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_SWAPPER_ADDRESS,
        abi: XRGE_SWAPPER_ABI,
        functionName: "swapKTAForXRGESimple",
        args: [value, BigInt(slippageBps)],
      };

      const submittedHash = await writeContractAsync(config as any);
      console.log("Transaction submitted (buy with KTA) hash:", submittedHash);
      
      toast({
        title: "KTA to XRGE Swap",
        description: "Swap transaction submitted successfully",
      });
      
      return submittedHash;
    } catch (err) {
      console.error("Buy XRGE with KTA error:", err);
      toast({
        title: "Transaction Failed",
        description: err instanceof Error ? err.message : "Failed to swap KTA for XRGE",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Sell XRGE for KTA
  const sellXRGEForKTA = async (xrgeAmount: string, slippageBps: number = 500) => {
    if (!accountAddress || !chainId) {
      toast({
        title: "Wallet Error",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Selling XRGE for KTA:", { xrgeAmount, slippageBps, accountAddress, chainId });
      
      const value = parseEther(xrgeAmount);
      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_SWAPPER_ADDRESS,
        abi: XRGE_SWAPPER_ABI,
        functionName: "swapXRGEForKTASimple",
        args: [value, BigInt(slippageBps)],
      };

      const submittedHash = await writeContractAsync(config as any);
      console.log("Transaction submitted (sell for KTA) hash:", submittedHash);
      toast({
        title: "Swap Submitted",
        description: "Please wait for confirmation...",
      });
      return submittedHash;
    } catch (err) {
      console.error("Sell XRGE for KTA error:", err);
      toast({
        title: "Transaction Failed",
        description: err instanceof Error ? err.message : "Failed to swap XRGE for KTA",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Approve KTA for swapper contract
  const approveKTA = async (amount: string) => {
    if (!accountAddress || !chainId) {
      toast({
        title: "Wallet Error",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }

    try {
      console.log("Approving KTA:", { amount, accountAddress, chainId, KTA_TOKEN_ADDRESS, XRGE_SWAPPER_ADDRESS });
      const value = parseEther(amount);
      const config = {
        account: accountAddress,
        chainId: chainId,
        address: KTA_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [XRGE_SWAPPER_ADDRESS, value],
      };

      const submittedHash = await writeContractAsync(config as any);
      console.log("Transaction submitted (approve KTA) hash:", submittedHash);
      
      toast({
        title: "KTA Approved",
        description: "KTA approval transaction submitted successfully",
      });
      
      return submittedHash;
    } catch (err) {
      console.error("Approve KTA error:", err);
      toast({
        title: "Approval Failed",
        description: err instanceof Error ? err.message : "Failed to approve KTA",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Buy XRGE with USDC
  const buyXRGEWithUSDC = async (usdcAmount: string, slippageBps: number = 500) => {
    if (!accountAddress || !chainId) {
      toast({
        title: "Wallet Error",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      return;
    }

    try {
      // USDC has 6 decimals
      const value = parseUnits(usdcAmount, 6);
      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_SWAPPER_ADDRESS,
        abi: XRGE_SWAPPER_ABI,
        functionName: "swapUSDCForXRGESimple",
        args: [value, BigInt(slippageBps)],
      };

      const submittedHash = await writeContractAsync(config as any);
      console.log("Transaction submitted (buy with USDC) hash:", submittedHash);
    } catch (err) {
      console.error("Buy XRGE with USDC error:", err);
      toast({
        title: "Transaction Failed",
        description: err instanceof Error ? err.message : "Failed to swap USDC for XRGE",
        variant: "destructive",
      });
    }
  };

  // Sell XRGE for USDC
  const sellXRGEForUSDC = async (xrgeAmount: string, slippageBps: number = 500) => {
    if (!accountAddress || !chainId) {
      toast({
        title: "Wallet Error",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      return;
    }

    try {
      const value = parseEther(xrgeAmount);
      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_SWAPPER_ADDRESS,
        abi: XRGE_SWAPPER_ABI,
        functionName: "swapXRGEForUSDCSimple",
        args: [value, BigInt(slippageBps)],
      };

      const submittedHash = await writeContractAsync(config as any);
      console.log("Transaction submitted (sell for USDC) hash:", submittedHash);
    } catch (err) {
      console.error("Sell XRGE for USDC error:", err);
      toast({
        title: "Transaction Failed",
        description: err instanceof Error ? err.message : "Failed to swap XRGE for USDC",
        variant: "destructive",
      });
    }
  };

  // Approve USDC for swapper contract
  const approveUSDC = async (amount: string) => {
    if (!accountAddress || !chainId) {
      toast({
        title: "Wallet Error",
        description: "Please ensure your wallet is properly connected",
        variant: "destructive",
      });
      throw new Error("Wallet not connected");
    }

    try {
      // USDC has 6 decimals
      const value = parseUnits(amount, 6);
      const config = {
        account: accountAddress,
        chainId: chainId,
        address: USDC_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [XRGE_SWAPPER_ADDRESS, value],
      };

      const submittedHash = await writeContractAsync(config as any);
      console.log("Transaction submitted (approve USDC) hash:", submittedHash);
      return submittedHash;
    } catch (err) {
      console.error("Approve USDC error:", err);
      toast({
        title: "Approval Failed",
        description: err instanceof Error ? err.message : "Failed to approve USDC",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Get XRGE balance using wagmi hook with refetch capability
  const { data: xrgeBalanceData, refetch: refetchXRGEBalance } = useReadContract({
    address: XRGE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: accountAddress ? [accountAddress] : undefined,
    query: {
      enabled: !!accountAddress,
      refetchInterval: 2000, // Auto-refetch every 2 seconds
    },
  });

  const getXRGEBalance = async () => {
    if (!accountAddress || !publicClient) {
      console.log("Cannot get XRGE balance: missing accountAddress or publicClient");
      return "0";
    }
    
    try {
      console.log("Getting XRGE balance for address:", accountAddress);
      
      // Use publicClient to directly read from the blockchain (bypasses cache)
      const balance = await publicClient.readContract({
        address: XRGE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: "balanceOf",
        args: [accountAddress],
      } as any) as bigint;
      
      const formattedBalance = formatEther(balance);
      console.log("XRGE balance fetched:", formattedBalance, "for address:", accountAddress);
      return formattedBalance;
    } catch (error) {
      console.error("Error fetching XRGE balance:", error);
      return "0";
    }
  };

  return {
    buyXRGE,
    sellXRGE,
    approveXRGE,
    buyXRGEWithKTA,
    sellXRGEForKTA,
    approveKTA,
    buyXRGEWithUSDC,
    sellXRGEForUSDC,
    approveUSDC,
    getXRGEBalance,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
};

// Hook to get quote for buying XRGE
export const useXRGEQuote = (ethAmount: string) => {
  const value = ethAmount ? parseEther(ethAmount) : BigInt(0);

  const { data, isLoading } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: "getExpectedXRGEOutput",
    args: [value],
    query: {
      enabled: !!ethAmount && Number(ethAmount) > 0,
    },
  });

  return {
    expectedXRGE: data ? formatEther(data) : "0",
    isLoading,
  };
};

// Hook to get quote for selling XRGE
export const useETHQuote = (xrgeAmount: string) => {
  const value = xrgeAmount ? parseEther(xrgeAmount) : BigInt(0);

  const { data, isLoading } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: "getExpectedETHOutput",
    args: [value],
    query: {
      enabled: !!xrgeAmount && Number(xrgeAmount) > 0,
    },
  });

  return {
    expectedETH: data ? formatEther(data) : "0",
    isLoading,
  };
};

// Hook to check XRGE approval status
export const useXRGEApproval = (userAddress: Address | undefined, amount: string) => {
  const value = amount ? parseEther(amount) : BigInt(0);

  const { data, isLoading, refetch } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: "checkXRGEApproval",
    args: userAddress && value ? [userAddress, value] : undefined,
    query: {
      enabled: !!userAddress && !!amount && Number(amount) > 0,
    },
  });

  return {
    hasApproval: data?.[0] ?? false,
    currentAllowance: data?.[1] ? formatEther(data[1]) : "0",
    isLoading,
    refetch,
  };
};

// Hook to check USDC approval for buying XRGE
export const useUSDCApproval = (userAddress: Address | undefined, amount: string) => {
  const value = amount ? parseUnits(amount, 6) : BigInt(0); // USDC has 6 decimals

  const { data, isLoading, refetch } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: "checkUSDCApproval",
    args: userAddress && value ? [userAddress, value] : undefined,
    query: {
      enabled: !!userAddress && !!amount && Number(amount) > 0,
    },
  });

  return {
    hasApproval: data?.[0] ?? false,
    currentAllowance: data?.[1] ? (Number(data[1]) / 1e6).toFixed(6) : "0", // USDC has 6 decimals
    isLoading,
    refetch,
  };
};

// Hook to check KTA approval for buying XRGE
export const useKTAApproval = (userAddress: Address | undefined, amount: string) => {
  const value = amount ? parseEther(amount) : BigInt(0); // KTA has 18 decimals

  const { data, isLoading, refetch } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: "checkKTAApproval",
    args: userAddress && value ? [userAddress, value] : undefined,
    query: {
      enabled: !!userAddress && !!amount && Number(amount) > 0,
    },
  });

  return {
    hasApproval: data?.[0] ?? false,
    currentAllowance: data?.[1] ? formatEther(data[1]) : "0",
    isLoading,
    refetch,
  };
};

// Hook to get quote for buying XRGE with KTA
export const useXRGEQuoteFromKTA = (ktaAmount: string) => {
  const value = ktaAmount ? parseEther(ktaAmount) : BigInt(0);

  const { data, isLoading } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: "getExpectedXRGEFromKTA",
    args: [value],
    query: {
      enabled: !!ktaAmount && Number(ktaAmount) > 0,
    },
  });

  return {
    expectedXRGE: data ? formatEther(data) : "0",
    isLoading,
  };
};

// Hook to get quote for selling XRGE for KTA
export const useKTAQuote = (xrgeAmount: string) => {
  const value = xrgeAmount ? parseEther(xrgeAmount) : BigInt(0);

  const { data, isLoading } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: "getExpectedKTAFromXRGE",
    args: [value],
    query: {
      enabled: !!xrgeAmount && Number(xrgeAmount) > 0,
    },
  });

  return {
    expectedKTA: data ? formatEther(data) : "0",
    isLoading,
  };
};

// Hook to get quote for buying XRGE with USDC
export const useXRGEQuoteFromUSDC = (usdcAmount: string) => {
  const value = usdcAmount ? parseUnits(usdcAmount, 6) : BigInt(0);

  const { data, isLoading } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: "getExpectedXRGEFromUSDC",
    args: [value],
    query: {
      enabled: !!usdcAmount && Number(usdcAmount) > 0,
    },
  });

  return {
    expectedXRGE: data ? formatEther(data) : "0",
    isLoading,
  };
};

// Hook to get quote for selling XRGE for USDC
export const useUSDCQuote = (xrgeAmount: string) => {
  const value = xrgeAmount ? parseEther(xrgeAmount) : BigInt(0);

  const { data, isLoading } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: "getExpectedUSDCFromXRGE",
    args: [value],
    query: {
      enabled: !!xrgeAmount && Number(xrgeAmount) > 0,
    },
  });

  return {
    expectedUSDC: data ? (Number(data) / 1e6).toFixed(6) : "0", // USDC has 6 decimals
    isLoading,
  };
};
