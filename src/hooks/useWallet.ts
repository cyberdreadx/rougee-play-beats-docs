import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';

export const useWallet = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useWeb3Modal();

  // Format address for display (e.g., 0x1234...5678)
  const formattedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const connect = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  return {
    isConnected,
    address: formattedAddress,
    fullAddress: address,
    isConnecting,
    connect,
    disconnect: handleDisconnect,
  };
};