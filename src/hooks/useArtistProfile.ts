import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchProfileFromIPFS } from '@/lib/ipfs';

export interface ArtistProfile {
  wallet_address: string;
  display_name?: string;
  artist_name?: string;
  artist_ticker?: string;
  bio?: string;
  avatar_cid?: string;
  cover_cid?: string;
  profile_metadata_cid?: string;
  social_links?: Record<string, string>;
  verified: boolean;
  total_plays: number;
  total_songs: number;
  created_at: string;
  updated_at: string;
  avatarUrl?: string;
  coverUrl?: string;
}

export const useArtistProfile = (walletAddress: string | null) => {
  const [profile, setProfile] = useState<ArtistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch from Supabase cache
      const { data: cachedProfile, error: cacheError } = await supabase
        .from('profiles')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle();

      if (cacheError) throw cacheError;

      if (!cachedProfile) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // If we have metadata CID, fetch full profile from IPFS
      if (cachedProfile.profile_metadata_cid) {
        try {
          const ipfsProfile = await fetchProfileFromIPFS(cachedProfile.profile_metadata_cid);
          setProfile({ ...cachedProfile, ...ipfsProfile });
        } catch (ipfsError) {
          console.error('Failed to fetch from IPFS, using cache:', ipfsError);
          // Fallback to cached data
          setProfile(cachedProfile as ArtistProfile);
        }
      } else {
        setProfile(cachedProfile as ArtistProfile);
      }
    } catch (err) {
      console.error('Error fetching artist profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [walletAddress]);

  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
  };
};
