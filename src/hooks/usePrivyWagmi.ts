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

      // Get the primary wallet (external wallet first, then embedded)
      const externalWallet = wallets.find(
        (wallet) => wallet.walletClientType !== 'privy' && wallet.walletClientType !== 'embedded_wallet'
      );
      const embeddedWallet = wallets.find(
        (wallet) => wallet.walletClientType === 'privy' || wallet.walletClientType === 'embedded_wallet'
      );

      const primaryWallet = externalWallet || embeddedWallet;
      if (!primaryWallet) {
        console.log('No wallet found yet');
        return;
      }

      console.log('🔍 Available wallets:', wallets.map(w => ({ type: w.walletClientType, address: w.address })));
      console.log('🎯 Using wallet:', { type: primaryWallet.walletClientType, address: primaryWallet.address });

      // Find the appropriate connector
      const injected = connectors.find((c) => c.id === 'injected');
      const privyConnector = connectors.find(
        (connector) => /privy/i.test(connector.id) || /privy/i.test(connector.name)
      );
      
      // Prioritize injected connector for external wallets, privy for embedded
      const target = (primaryWallet.walletClientType !== 'privy' && primaryWallet.walletClientType !== 'embedded_wallet') 
        ? injected || privyConnector || connectors[0]
        : privyConnector || injected || connectors[0];

      if (!target) {
        console.warn('No wagmi connector available to connect');
        return;
      }

      if (!isConnected) {
        try {
          console.log('🔌 Connecting wallet to wagmi using', target.name, target.id);
          console.log('🎯 Target wallet:', { type: primaryWallet.walletClientType, address: primaryWallet.address });
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
