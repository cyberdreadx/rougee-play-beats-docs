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
        (connector) => /privy/i.test(connector.id) || /privy/i.test(connector.name)
      );
      const injected = connectors.find((c) => c.id === 'injected');
      const target = privyConnector || injected || connectors[0];

      if (!target) {
        console.warn('No wagmi connector available to connect');
        return;
      }

      if (!isConnected) {
        try {
          console.log('🔌 Connecting wallet to wagmi using', target.name, target.id);
          await connect({ connector: target });
          console.log('✅ Wallet connected to wagmi');
        } catch (error) {
          console.error('Failed to connect wallet to wagmi:', error);
        }
      }
    };

    connectPrivyWallet();
  }, [ready, authenticated, wallets, isConnected, connectors, connect]);

  return { isConnected };
};
