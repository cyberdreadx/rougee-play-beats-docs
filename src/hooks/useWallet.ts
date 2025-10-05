import { usePrivy } from '@privy-io/react-auth';

export const useWallet = () => {
  const { ready, authenticated, user, login, logout } = usePrivy();

  // Get wallet address from Privy (supports smart/embedded)
  const walletAccount = user?.linkedAccounts?.find((account: any) =>
    ['wallet', 'smart_wallet', 'embedded_wallet'].includes(account.type)
  ) as any;
  const address = walletAccount?.address as string | undefined;

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