import { usePrivy } from '@privy-io/react-auth';

export const useWallet = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Get smart wallet address from Privy
  const smartWallet = user?.linkedAccounts?.find((account: any) => 
    account.type === 'wallet'
  ) as any;
  const address = smartWallet?.address as string | undefined;

  // Format address for display (e.g., 0x1234...5678)
  const formattedAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const connect = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Failed to login:', error);
    }
  };

  return {
    isConnected: authenticated,
    address: formattedAddress,
    fullAddress: address,
    isConnecting: !ready,
    connect,
    disconnect: logout,
    isPrivyReady: ready,
  };
};