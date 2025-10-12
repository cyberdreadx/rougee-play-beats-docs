import { useEffect } from 'react';
import { useWallet } from './useWallet';
import { supabase } from '@/integrations/supabase/client';
import { usePrivy } from '@privy-io/react-auth';

export const useIPLogger = (action: string) => {
  const { fullAddress, isConnected } = useWallet();
  const { getAccessToken } = usePrivy();

  useEffect(() => {
    if (isConnected && fullAddress) {
      logIP(action);
    }
  }, [isConnected, fullAddress, action]);

  const logIP = async (actionType: string) => {
    if (!fullAddress) return;

    try {
      const token = await getAccessToken();
      
      await supabase.functions.invoke('log-ip', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: {
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