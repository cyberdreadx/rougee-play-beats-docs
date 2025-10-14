import { useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useConnect, useAccount } from 'wagmi';

/**
 * Ensures Privy's embedded wallet is connected to wagmi
 * This fixes "Connector not connected" errors when using wagmi hooks
 */
export const usePrivyWagmi = () => {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { connectors, connect } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    const connectPrivyWallet = async () => {
      // Wait for Privy to be ready
      if (!ready || !authenticated) return;
      
      // If wagmi is already connected, we're good
      if (isConnected) return;

      // Get Privy's embedded wallet
      const embeddedWallet = wallets.find(
        (wallet) => wallet.walletClientType === 'privy'
      );

      if (!embeddedWallet) {
        console.log('No Privy embedded wallet found yet');
        return;
      }

      // Find the Privy connector in wagmi
      const privyConnector = connectors.find(
        (connector) => connector.id === 'injected' || connector.name.toLowerCase().includes('privy')
      );

      if (privyConnector && !isConnected) {
        try {
          console.log('🔌 Connecting Privy wallet to wagmi...');
          await connect({ connector: privyConnector });
          console.log('✅ Privy wallet connected to wagmi');
        } catch (error) {
          console.error('Failed to connect Privy wallet to wagmi:', error);
        }
      }
    };

    connectPrivyWallet();
  }, [ready, authenticated, wallets, isConnected, connectors, connect]);

  return { isConnected };
};
