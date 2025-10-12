import { usePrivy } from '@privy-io/react-auth';

/**
 * Hook to get Privy authentication token for edge function calls
 */
export const usePrivyToken = () => {
  const { getAccessToken } = usePrivy();

  const getAuthHeaders = async () => {
    const token = await getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  return { getAuthHeaders };
};
