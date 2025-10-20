import { useEffect } from 'react';
import { useAccount, useSwitchChain, useConnector } from 'wagmi';
import { base } from 'wagmi/chains';
import { toast } from 'sonner';

/**
 * Ensures the user is always on the Base network
 * Automatically switches if they're on the wrong chain
 * Special handling for Phantom wallet which doesn't show network switching UI
 */
export const useChainChecker = () => {
  const { chain, isConnected, connector } = useAccount();
  const { switchChain, switchChainAsync } = useSwitchChain();

  useEffect(() => {
    // Only check if user is connected
    if (!isConnected || !chain) return;

    // Detect if user is using Phantom wallet
    const isPhantom = connector?.name?.toLowerCase().includes('phantom') || 
                      connector?.id?.toLowerCase().includes('phantom') ||
                      (typeof window !== 'undefined' && (window as any).phantom?.ethereum);

    // If user is on the wrong chain, switch them to Base
    if (chain.id !== base.id) {
      console.log(`🔄 Wrong chain detected (${chain.id}: ${chain.name}). Switching to Base...`);
      console.log(`📱 Wallet: ${connector?.name} (ID: ${connector?.id})`);
      console.log(`👻 Is Phantom: ${isPhantom}`);
      
      // For Phantom wallet, be more aggressive with switching
      if (isPhantom) {
        console.log('👻 Phantom wallet detected - forcing chain switch...');
        
        toast.error('Phantom Wallet: Switching to Base', {
          description: `Phantom wallet detected on ${chain.name}. Auto-switching to Base network...`,
          duration: 5000,
        });

        // Try multiple methods to switch for Phantom
        const attemptPhantomSwitch = async () => {
          try {
            // Method 1: Use wagmi switchChain
            if (switchChainAsync) {
              await switchChainAsync({ chainId: base.id });
              console.log('✅ Phantom switched to Base via wagmi');
              return;
            }
          } catch (error: any) {
            console.warn('⚠️ Wagmi switch failed for Phantom:', error.message);
          }

          // Method 2: Direct wallet_switchEthereumChain request
          try {
            if ((window as any).phantom?.ethereum) {
              await (window as any).phantom.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${base.id.toString(16)}` }], // 0x2105 for Base
              });
              console.log('✅ Phantom switched to Base via direct request');
              return;
            }
          } catch (switchError: any) {
            // If the chain doesn't exist, try to add it
            if (switchError.code === 4902) {
              console.log('📝 Base network not in Phantom, adding it...');
              try {
                await (window as any).phantom.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${base.id.toString(16)}`,
                    chainName: 'Base',
                    nativeCurrency: {
                      name: 'Ethereum',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://mainnet.base.org'],
                    blockExplorerUrls: ['https://basescan.org'],
                  }],
                });
                console.log('✅ Base network added to Phantom and switched');
                return;
              } catch (addError) {
                console.error('❌ Failed to add Base network to Phantom:', addError);
              }
            }
            console.error('❌ Failed to switch Phantom via direct request:', switchError);
          }

          // Method 3: Use provider request if available
          try {
            if (connector && (connector as any).provider) {
              await (connector as any).provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${base.id.toString(16)}` }],
              });
              console.log('✅ Phantom switched to Base via connector provider');
              return;
            }
          } catch (error) {
            console.error('❌ Failed to switch via connector provider:', error);
          }

          // If all methods fail, show persistent error
          toast.error('Phantom Wallet: Manual Switch Required', {
            description: 'Please manually switch to Base network in your Phantom wallet settings',
            duration: 10000,
          });
        };

        attemptPhantomSwitch();
      } else {
        // For non-Phantom wallets, use standard approach
        toast.error('Wrong Network', {
          description: `Please switch to Base network. Currently on ${chain.name} (Chain ID: ${chain.id})`,
          duration: 5000,
        });

        // Attempt to switch to Base
        if (switchChain) {
          try {
            switchChain({ chainId: base.id });
          } catch (error) {
            console.error('Failed to switch chain:', error);
            toast.error('Failed to Switch Network', {
              description: 'Please manually switch your wallet to Base network',
              duration: 7000,
            });
          }
        }
      }
    } else {
      console.log(`✅ Correct chain: ${chain.name} (ID: ${chain.id})`);
    }
  }, [chain, isConnected, switchChain, switchChainAsync, connector]);

  return {
    isOnCorrectChain: chain?.id === base.id,
    currentChain: chain,
    isPhantom: connector?.name?.toLowerCase().includes('phantom') || 
               connector?.id?.toLowerCase().includes('phantom'),
  };
};

