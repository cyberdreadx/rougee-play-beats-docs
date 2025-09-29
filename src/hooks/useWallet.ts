import { useState, useCallback } from "react";

interface WalletState {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: true, // Mock connected state for demo
    address: "0x5a12...26fc",
    isConnecting: false,
  });

  const connect = useCallback(async () => {
    setWallet(prev => ({ ...prev, isConnecting: true }));
    
    try {
      // TODO: Implement actual wallet connection logic
      // This would typically involve calling window.ethereum.request()
      // or similar Web3 wallet integration
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate connection delay
      
      setWallet({
        isConnected: true,
        address: "0x5a12...26fc",
        isConnecting: false,
      });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setWallet(prev => ({ ...prev, isConnecting: false }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({
      isConnected: false,
      address: null,
      isConnecting: false,
    });
  }, []);

  return {
    ...wallet,
    connect,
    disconnect,
  };
};