import { usePrivy } from '@privy-io/react-auth';

/**
 * Hook to get Privy authentication token for edge function calls
 */
export const usePrivyToken = () => {
  const { getAccessToken, user } = usePrivy();

  const getAuthHeaders = async () => {
    try {
      console.log('🔑 Getting Privy access token...');
      const accounts = user?.linkedAccounts?.map((acc: any) => ({ 
        type: acc.type, 
        address: acc.address || acc.email || 'N/A'
      }));
      console.log('👤 User linked accounts:', accounts);
      
      const token = await getAccessToken();
      
      if (!token) {
        console.error('❌ No access token received from Privy');
        throw new Error('Failed to get authentication token');
      }
      
      console.log('✅ Access token obtained (length:', token.length, ')');
      
      // Decode JWT to see what's actually in it (only the payload, not verifying signature)
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        console.log('🔓 JWT Payload:', payload);
        console.log('🔓 JWT linked_accounts:', payload.linked_accounts);
      } catch (e) {
        console.error('Failed to decode JWT:', e);
      }
      
      return {
        Authorization: `Bearer ${token}`,
        'x-privy-token': token,
      };
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      throw error;
    }
  };

  return { getAuthHeaders };
};
