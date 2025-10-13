import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount, useChainId } from 'wagmi';
import { parseEther, formatEther, Address } from 'viem';
import { toast } from '@/hooks/use-toast';

// XRGESwapper contract address on Base
const XRGE_SWAPPER_ADDRESS = '0x3B0F149C81fF268aaA968BcD149ddccBd8007Cf8' as Address;
const XRGE_TOKEN_ADDRESS = '0x37d126c98aa9543C3f89e1f38e828aFDbC20e5dC' as Address;

// Contract ABI (only functions we need)
const XRGE_SWAPPER_ABI = [
  {
    inputs: [{ name: 'slippageBps', type: 'uint256' }],
    name: 'swapETHForXRGESimple',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'xrgeAmount', type: 'uint256' },
      { name: 'slippageBps', type: 'uint256' },
    ],
    name: 'swapXRGEForETHSimple',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'ethAmount', type: 'uint256' }],
    name: 'getExpectedXRGEOutput',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'xrgeAmount', type: 'uint256' }],
    name: 'getExpectedETHOutput',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'checkXRGEApproval',
    outputs: [
      { name: 'hasApproval', type: 'bool' },
      { name: 'currentAllowance', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export const useXRGESwap = () => {
  const { address: accountAddress } = useAccount();
  const chainId = useChainId();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Buy XRGE with ETH
  const buyXRGE = (ethAmount: string, slippageBps: number = 500) => {
    console.log('buyXRGE called with:', { ethAmount, slippageBps, accountAddress, chainId });
    
    if (!accountAddress || !chainId) {
      console.error('Wallet not properly connected');
      toast({
        title: 'Wallet Error',
        description: 'Please ensure your wallet is properly connected',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const value = parseEther(ethAmount);
      console.log('Parsed value:', value.toString());
      
      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_SWAPPER_ADDRESS,
        abi: XRGE_SWAPPER_ABI,
        functionName: 'swapETHForXRGESimple',
        args: [BigInt(slippageBps)],
        value,
      };
      
      console.log('Calling writeContract with config:', config);
      writeContract(config as any);
    } catch (err) {
      console.error('Buy XRGE error:', err);
      toast({
        title: 'Transaction Failed',
        description: err instanceof Error ? err.message : 'Failed to swap ETH for XRGE',
        variant: 'destructive',
      });
    }
  };

  // Approve XRGE for swapper contract
  const approveXRGE = (amount: string) => {
    console.log('approveXRGE called with:', { amount, accountAddress, chainId });
    
    if (!accountAddress || !chainId) {
      console.error('Wallet not properly connected');
      toast({
        title: 'Wallet Error',
        description: 'Please ensure your wallet is properly connected',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const value = parseEther(amount);
      console.log('Parsed value:', value.toString());
      
      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [XRGE_SWAPPER_ADDRESS, value],
      };
      
      console.log('Calling writeContract for approval with config:', config);
      writeContract(config as any);
    } catch (err) {
      console.error('Approve error:', err);
      toast({
        title: 'Approval Failed',
        description: err instanceof Error ? err.message : 'Failed to approve XRGE',
        variant: 'destructive',
      });
    }
  };

  // Sell XRGE for ETH
  const sellXRGE = (xrgeAmount: string, slippageBps: number = 500) => {
    console.log('sellXRGE called with:', { xrgeAmount, slippageBps, accountAddress, chainId });
    
    if (!accountAddress || !chainId) {
      console.error('Wallet not properly connected');
      toast({
        title: 'Wallet Error',
        description: 'Please ensure your wallet is properly connected',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const value = parseEther(xrgeAmount);
      console.log('Parsed value:', value.toString());
      
      const config = {
        account: accountAddress,
        chainId: chainId,
        address: XRGE_SWAPPER_ADDRESS,
        abi: XRGE_SWAPPER_ABI,
        functionName: 'swapXRGEForETHSimple',
        args: [value, BigInt(slippageBps)],
      };
      
      console.log('Calling writeContract for sell with config:', config);
      writeContract(config as any);
    } catch (err) {
      console.error('Sell XRGE error:', err);
      toast({
        title: 'Transaction Failed',
        description: err instanceof Error ? err.message : 'Failed to swap XRGE for ETH',
        variant: 'destructive',
      });
    }
  };

  return {
    buyXRGE,
    sellXRGE,
    approveXRGE,
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
    functionName: 'getExpectedXRGEOutput',
    args: [value],
    query: {
      enabled: !!ethAmount && Number(ethAmount) > 0,
    },
  });

  return {
    expectedXRGE: data ? formatEther(data) : '0',
    isLoading,
  };
};

// Hook to get quote for selling XRGE
export const useETHQuote = (xrgeAmount: string) => {
  const value = xrgeAmount ? parseEther(xrgeAmount) : BigInt(0);
  
  const { data, isLoading } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: 'getExpectedETHOutput',
    args: [value],
    query: {
      enabled: !!xrgeAmount && Number(xrgeAmount) > 0,
    },
  });

  return {
    expectedETH: data ? formatEther(data) : '0',
    isLoading,
  };
};

// Hook to check XRGE approval status
export const useXRGEApproval = (userAddress: Address | undefined, amount: string) => {
  const value = amount ? parseEther(amount) : BigInt(0);
  
  const { data, isLoading, refetch } = useReadContract({
    address: XRGE_SWAPPER_ADDRESS,
    abi: XRGE_SWAPPER_ABI,
    functionName: 'checkXRGEApproval',
    args: userAddress && value ? [userAddress, value] : undefined,
    query: {
      enabled: !!userAddress && !!amount && Number(amount) > 0,
    },
  });

  return {
    hasApproval: data?.[0] ?? false,
    currentAllowance: data?.[1] ? formatEther(data[1]) : '0',
    isLoading,
    refetch,
  };
};
