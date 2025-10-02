import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';
import { useArtistProfile } from './useArtistProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useCurrentUserProfile = () => {
  const { fullAddress } = useWallet();
  const { profile, loading, refresh } = useArtistProfile(fullAddress || null);
  const [updating, setUpdating] = useState(false);

  const updateProfile = async (formData: FormData) => {
    if (!fullAddress) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return false;
    }

    try {
      setUpdating(true);
      
      const response = await supabase.functions.invoke('update-artist-profile', {
        body: formData,
      });

      if (response.error) throw response.error;

      toast({
        title: "Profile updated!",
        description: "Your artist profile has been saved to IPFS",
      });

      await refresh();
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
      return false;
    } finally {
      setUpdating(false);
    }
  };

  return {
    profile,
    loading,
    updating,
    isArtist: !!profile,
    updateProfile,
    refresh,
  };
};
