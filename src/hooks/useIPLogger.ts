import { useEffect } from 'react';
import { useWallet } from './useWallet';
import { supabase } from '@/integrations/supabase/client';

export const useIPLogger = (action: string) => {
  const { fullAddress, isConnected } = useWallet();

  useEffect(() => {
    if (isConnected && fullAddress) {
      logIP(action);
    }
  }, [isConnected, fullAddress, action]);

  const logIP = async (actionType: string) => {
    if (!fullAddress) return;

    try {
      await supabase.functions.invoke('log-ip', {
        body: {
          walletAddress: fullAddress,
          action: actionType,
        },
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.error('IP logging failed:', error);
    }
  };

  return { logIP };
};