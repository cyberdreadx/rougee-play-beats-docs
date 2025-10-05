import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { usePrivy } from '@privy-io/react-auth';

export const useWallet = () => {
  const { address: wagmiAddress, isConnected: wagmiConnected, isConnecting } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { open } = useWeb3Modal();
  const { ready, authenticated, user, login: privyLogin, logout: privyLogout } = usePrivy();

  // Determine the active address and connection status
  const privyWalletAddress = user?.wallet?.address;
  const address = wagmiAddress || privyWalletAddress;
  const isConnected = wagmiConnected || authenticated;

  // Format address for display (e.g., 0x1234...5678)
  const formattedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const connectExternalWallet = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const connectEmailWallet = async () => {
    try {
      await privyLogin();
    } catch (error) {
      console.error('Failed to login with email:', error);
    }
  };

  const handleDisconnect = () => {
    if (wagmiConnected) {
      wagmiDisconnect();
    }
    if (authenticated) {
      privyLogout();
    }
  };

  return {
    isConnected,
    address: formattedAddress,
    fullAddress: address,
    isConnecting,
    connectExternalWallet,
    connectEmailWallet,
    disconnect: handleDisconnect,
    isPrivyReady: ready,
  };
};