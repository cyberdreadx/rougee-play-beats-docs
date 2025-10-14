import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { Address, parseEther, formatEther } from 'viem';
import { toast } from 'sonner';

// Contract addresses on Base mainnet
export const SONG_FACTORY_ADDRESS = '0xA69ab1E008Fb6003D5B73b7b1b6887C0aC86d1ec' as Address;
export const BONDING_CURVE_ADDRESS = '0xCeE9c18C448487a1deAac3E14974C826142C50b5' as Address;
export const XRGE_TOKEN_ADDRESS = '0x147120faec9277ec02d957584cfcd92b56a24317' as Address;

// Contract ABIs
const SONG_FACTORY_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'ipfsHash', type: 'string' }
    ],
    name: 'createSong',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'songToken', type: 'address' },
      { indexed: true, name: 'creator', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'symbol', type: 'string' },
      { indexed: false, name: 'ipfsHash', type: 'string' }
    ],
    name: 'SongCreated',
    type: 'event'
  }
] as const;

const BONDING_CURVE_ABI = [
  {
    inputs: [
      { name: 'songToken', type: 'address' },
      { name: 'minTokens', type: 'uint256' },
      { name: 'slippageBps', type: 'uint256' }
    ],
    name: 'buyWithETH',
    outputs: [{ name: 'tokensBought', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'songToken', type: 'address' },
      { name: 'xrgeAmount', type: 'uint256' },
      { name: 'minTokens', type: 'uint256' }
    ],
    name: 'buyWithXRGE',
    outputs: [{ name: 'tokensBought', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'songToken', type: 'address' },
      { name: 'tokenAmount', type: 'uint256' },
      { name: 'minXRGE', type: 'uint256' }
    ],
    name: 'sell',
    outputs: [{ name: 'xrgeReceived', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'songToken', type: 'address' }],
    name: 'getCurrentPrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'currentSupply', type: 'uint256' },
      { name: 'xrgeAmount', type: 'uint256' }
    ],
    name: 'calculateTokensForXRGE',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [
      { name: 'currentSupply', type: 'uint256' },
      { name: 'tokenAmount', type: 'uint256' }
    ],
    name: 'calculateXRGEForTokens',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'buyer', type: 'address' },
      { indexed: true, name: 'songToken', type: 'address' },
      { indexed: false, name: 'xrgeSpent', type: 'uint256' },
      { indexed: false, name: 'tokensBought', type: 'uint256' }
    ],
    name: 'SongTokenBought',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'seller', type: 'address' },
      { indexed: true, name: 'songToken', type: 'address' },
      { indexed: false, name: 'tokensSold', type: 'uint256' },
      { indexed: false, name: 'xrgeReceived', type: 'uint256' }
    ],
    name: 'SongTokenSold',
    type: 'event'
  }
] as const;

const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

const SONG_TOKEN_ABI = [
  {
    inputs: [],
    name: 'getMetadata',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'ipfsHash', type: 'string' },
      { name: 'creator', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'totalSupply', type: 'uint256' },
      { name: 'xrgeRaised', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  ...ERC20_ABI
] as const;

// Hook for creating songs
export const useCreateSong = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash });

  const createSong = (name: string, symbol: string, ipfsHash: string) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      writeContract({
        address: SONG_FACTORY_ADDRESS,
        abi: SONG_FACTORY_ABI,
        functionName: 'createSong',
        args: [name, symbol, ipfsHash],
      } as any);
    } catch (err) {
      console.error('Error creating song:', err);
      toast.error('Failed to create song');
    }
  };

  return {
    createSong,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    receipt,
  };
};

// Hook for buying song tokens
export const useBuySongTokens = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const buyWithETH = (songTokenAddress: Address, ethAmount: string, slippageBps: number = 500) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      writeContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'buyWithETH',
        args: [songTokenAddress, 0n, BigInt(slippageBps)],
        value: parseEther(ethAmount),
      } as any);
    } catch (err) {
      console.error('Error buying tokens:', err);
      toast.error('Failed to buy tokens');
    }
  };

  const buyWithXRGE = (songTokenAddress: Address, xrgeAmount: string, minTokens: string = '0') => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      writeContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'buyWithXRGE',
        args: [songTokenAddress, parseEther(xrgeAmount), parseEther(minTokens)],
      } as any);
    } catch (err) {
      console.error('Error buying with XRGE:', err);
      toast.error('Failed to buy with XRGE');
    }
  };

  return {
    buyWithETH,
    buyWithXRGE,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
};

// Hook for selling song tokens
export const useSellSongTokens = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const sell = (songTokenAddress: Address, tokenAmount: string, minXRGE: string = '0') => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      writeContract({
        address: BONDING_CURVE_ADDRESS,
        abi: BONDING_CURVE_ABI,
        functionName: 'sell',
        args: [songTokenAddress, parseEther(tokenAmount), parseEther(minXRGE)],
      } as any);
    } catch (err) {
      console.error('Error selling tokens:', err);
      toast.error('Failed to sell tokens');
    }
  };

  return {
    sell,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
};

// Hook for approving tokens
export const useApproveToken = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (tokenAddress: Address, amount: string) => {
    try {
      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BONDING_CURVE_ADDRESS, parseEther(amount)],
      } as any);
    } catch (err) {
      console.error('Error approving token:', err);
      toast.error('Failed to approve token');
    }
  };

  return {
    approve,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
};

// Hook for getting current price
export const useSongPrice = (songTokenAddress: Address | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: BONDING_CURVE_ADDRESS,
    abi: BONDING_CURVE_ABI,
    functionName: 'getCurrentPrice',
    args: songTokenAddress ? [songTokenAddress] : undefined,
    query: {
      enabled: !!songTokenAddress,
    },
  });

  return {
    price: data ? formatEther(data) : '0',
    isLoading,
    error,
    refetch,
  };
};

// Hook for getting song metadata
export const useSongMetadata = (songTokenAddress: Address | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: songTokenAddress,
    abi: SONG_TOKEN_ABI,
    functionName: 'getMetadata',
    query: {
      enabled: !!songTokenAddress,
    },
  });

  if (!data) {
    return { metadata: null, isLoading, error, refetch };
  }

  return {
    metadata: {
      name: data[0],
      symbol: data[1],
      ipfsHash: data[2],
      creator: data[3],
      createdAt: new Date(Number(data[4]) * 1000),
      totalSupply: formatEther(data[5]),
      xrgeRaised: formatEther(data[6]),
    },
    isLoading,
    error,
    refetch,
  };
};

// Hook for getting token balance
export const useSongTokenBalance = (songTokenAddress: Address | undefined, userAddress: Address | undefined) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: songTokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!(songTokenAddress && userAddress),
    },
  });

  return {
    balance: data ? formatEther(data) : '0',
    isLoading,
    error,
    refetch,
  };
};

// Hook for checking token approval
export const useSongTokenApproval = (
  songTokenAddress: Address | undefined,
  userAddress: Address | undefined,
  amount: string
) => {
  const { data, isLoading, error, refetch } = useReadContract({
    address: songTokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: userAddress ? [userAddress, BONDING_CURVE_ADDRESS] : undefined,
    query: {
      enabled: !!(songTokenAddress && userAddress),
    },
  });

  const isApproved = data ? data >= parseEther(amount || '0') : false;

  return {
    allowance: data ? formatEther(data) : '0',
    isApproved,
    isLoading,
    error,
    refetch,
  };
};
