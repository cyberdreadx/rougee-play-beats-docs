import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from './useWallet';
import { usePublicClient } from 'wagmi';
import { toast } from 'sonner';
import type { Address } from 'viem';

export interface Playlist {
  id: string;
  wallet_address: string;
  name: string;
  description?: string;
  cover_cid?: string;
  token_address?: string;
  ticker?: string;
  created_at: string;
  updated_at: string;
  song_count?: number;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  added_at: string;
  songs?: {
    id: string;
    title: string;
    artist: string;
    audio_cid: string;
    cover_cid?: string;
    play_count: number;
    ticker?: string;
  };
}

export interface PurchasedSong {
  song_id: string;
  title: string;
  artist: string;
  audio_cid: string;
  cover_cid?: string;
  play_count: number;
  ticker?: string;
  purchase_date: string;
}

export const usePlaylists = () => {
  const { fullAddress, isConnected } = useWallet();
  const publicClient = usePublicClient();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's playlists
  const fetchPlaylists = async () => {
    if (!fullAddress) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('playlists')
        .select(`
          *,
          playlist_songs(count)
        `)
        .eq('wallet_address', fullAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const playlistsWithCount = data?.map(playlist => ({
        ...playlist,
        song_count: playlist.playlist_songs?.[0]?.count || 0
      })) || [];

      setPlaylists(playlistsWithCount);
    } catch (err: any) {
      console.error('Error fetching playlists:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create a new playlist
  const createPlaylist = async (name: string, description?: string, coverCid?: string, ticker?: string) => {
    if (!fullAddress) {
      toast.error('Please connect your wallet');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          wallet_address: fullAddress.toLowerCase(),
          name,
          description,
          cover_cid: coverCid
          // ticker: ticker?.toUpperCase() // Temporarily disabled until database is updated
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Playlist created successfully');
      await fetchPlaylists(); // Refresh the list
      return data;
    } catch (err: any) {
      console.error('Error creating playlist:', err);
      toast.error(err.message || 'Failed to create playlist');
      return null;
    }
  };

  // Update playlist
  const updatePlaylist = async (playlistId: string, updates: Partial<Pick<Playlist, 'name' | 'description' | 'cover_cid'>>) => {
    if (!fullAddress) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      const { error } = await supabase
        .from('playlists')
        .update(updates)
        .eq('id', playlistId)
        .eq('wallet_address', fullAddress.toLowerCase());

      if (error) throw error;

      toast.success('Playlist updated successfully');
      await fetchPlaylists(); // Refresh the list
      return true;
    } catch (err: any) {
      console.error('Error updating playlist:', err);
      toast.error(err.message || 'Failed to update playlist');
      return false;
    }
  };

  // Delete playlist
  const deletePlaylist = async (playlistId: string) => {
    if (!fullAddress) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('wallet_address', fullAddress.toLowerCase());

      if (error) throw error;

      toast.success('Playlist deleted successfully');
      await fetchPlaylists(); // Refresh the list
      return true;
    } catch (err: any) {
      console.error('Error deleting playlist:', err);
      toast.error(err.message || 'Failed to delete playlist');
      return false;
    }
  };

  // Add song to playlist
  const addSongToPlaylist = async (playlistId: string, songId: string) => {
    console.log('🎵 addSongToPlaylist called:', { playlistId, songId, fullAddress });
    
    if (!fullAddress) {
      console.error('🎵 No wallet address!');
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      // Check if song is already in the playlist
      console.log('🎵 Checking for existing song in playlist...');
      const { data: existingSong, error: checkError } = await supabase
        .from('playlist_songs')
        .select('id')
        .eq('playlist_id', playlistId)
        .eq('song_id', songId)
        .limit(1);

      if (checkError) {
        console.error('🎵 Error checking for existing song:', checkError);
        throw checkError;
      }

      if (existingSong && existingSong.length > 0) {
        console.log('🎵 Song already in playlist!');
        toast.error('Song is already in this playlist');
        return false;
      }

      console.log('🎵 Getting current max position...');
      // Get the current max position in the playlist
      const { data: maxPosData, error: maxPosError } = await supabase
        .from('playlist_songs')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      if (maxPosError) {
        console.error('🎵 Error getting max position:', maxPosError);
        throw maxPosError;
      }

      const nextPosition = (maxPosData?.[0]?.position || 0) + 1;
      console.log('🎵 Next position:', nextPosition);

      console.log('🎵 Inserting song into playlist...');
      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: songId,
          position: nextPosition
        });

      if (error) {
        console.error('🎵 Error inserting song:', error);
        throw error;
      }

      console.log('🎵 Song added successfully!');
      toast.success('Song added to playlist');
      await fetchPlaylists(); // Refresh the list
      return true;
    } catch (err: any) {
      console.error('🎵 Error adding song to playlist:', err);
      toast.error(err.message || 'Failed to add song to playlist');
      return false;
    }
  };

  // Remove song from playlist
  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    if (!fullAddress) {
      toast.error('Please connect your wallet');
      return false;
    }

    try {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId);

      if (error) throw error;

      toast.success('Song removed from playlist');
      await fetchPlaylists(); // Refresh the list
      return true;
    } catch (err: any) {
      console.error('Error removing song from playlist:', err);
      toast.error(err.message || 'Failed to remove song from playlist');
      return false;
    }
  };

  // Fetch playlist songs
  const fetchPlaylistSongs = async (playlistId: string): Promise<PlaylistSong[]> => {
    try {
      const { data, error } = await supabase
        .from('playlist_songs')
        .select(`
          *,
          songs (
            id,
            title,
            artist,
            audio_cid,
            cover_cid,
            play_count,
            ticker
          )
        `)
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching playlist songs:', err);
      toast.error(err.message || 'Failed to fetch playlist songs');
      return [];
    }
  };

  // Fetch user's purchased songs (from database purchases)
  const fetchPurchasedSongs = async (): Promise<PurchasedSong[]> => {
    if (!fullAddress) return [];

    try {
      const { data, error } = await supabase
        .from('song_purchases')
        .select(`
          song_id,
          created_at,
          songs (
            id,
            title,
            artist,
            audio_cid,
            cover_cid,
            play_count,
            ticker
          )
        `)
        .eq('buyer_wallet_address', fullAddress.toLowerCase())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map(purchase => ({
        song_id: purchase.song_id,
        title: purchase.songs.title,
        artist: purchase.songs.artist,
        audio_cid: purchase.songs.audio_cid,
        cover_cid: purchase.songs.cover_cid,
        play_count: purchase.songs.play_count,
        ticker: purchase.songs.ticker,
        purchase_date: purchase.created_at
      })) || [];
    } catch (err: any) {
      console.error('Error fetching purchased songs:', err);
      return [];
    }
  };

  // Fetch songs you hold from your wallet (web3 detection)
  const fetchHeldSongs = async (): Promise<PurchasedSong[]> => {
    if (!fullAddress) return [];

    try {
      console.log('🔍 Detecting songs held by wallet:', fullAddress);
      
      // Get all songs with token addresses
      const { data: allSongs, error: songsError } = await supabase
        .from('songs')
        .select('id, title, artist, audio_cid, cover_cid, play_count, ticker, token_address, wallet_address')
        .not('token_address', 'is', null);

      if (songsError) throw songsError;

      if (!allSongs || allSongs.length === 0) {
        console.log('No songs with token addresses found');
        return [];
      }

      console.log(`Found ${allSongs.length} songs with tokens`);

      // Check which songs this wallet holds tokens for
      const heldSongs: PurchasedSong[] = [];
      
      for (const song of allSongs) {
        if (!song.token_address) continue;

        try {
          // First check database purchases
          const { data: purchases, error: purchaseError } = await supabase
            .from('song_purchases')
            .select('created_at')
            .eq('song_id', song.id)
            .eq('buyer_wallet_address', fullAddress.toLowerCase())
            .limit(1);

          if (purchaseError) {
            console.warn(`Error checking purchases for song ${song.id}:`, purchaseError);
          }

          // If we have a purchase record, add to held songs
          if (purchases && purchases.length > 0) {
            console.log(`✅ Found purchase record for ${song.title}`);
            heldSongs.push({
              song_id: song.id,
              title: song.title,
              artist: song.artist,
              audio_cid: song.audio_cid,
              cover_cid: song.cover_cid,
              play_count: song.play_count,
              ticker: song.ticker,
              purchase_date: purchases[0].created_at
            });
            } else {
              // If no purchase record, check if this is a song you created (you own your own songs)
              if (song.wallet_address?.toLowerCase() === fullAddress.toLowerCase()) {
                console.log(`✅ Found own song: ${song.title}`);
                heldSongs.push({
                  song_id: song.id,
                  title: song.title,
                  artist: song.artist,
                  audio_cid: song.audio_cid,
                  cover_cid: song.cover_cid,
                  play_count: song.play_count,
                  ticker: song.ticker,
                  purchase_date: new Date().toISOString() // Use current date for own songs
                });
              } else if (publicClient) {
                // Check actual token balance on blockchain
                try {
                  console.log(`🔍 Checking blockchain balance for ${song.title} (${song.token_address})`);
                  
                  const balance = await publicClient.readContract({
                    address: song.token_address as Address,
                    abi: [{
                      name: 'balanceOf',
                      type: 'function',
                      stateMutability: 'view',
                      inputs: [{ name: 'account', type: 'address' }],
                      outputs: [{ name: 'balance', type: 'uint256' }]
                    }],
                    functionName: 'balanceOf',
                    args: [fullAddress as Address]
                  } as any);

                  const balanceNum = Number(balance);
                  console.log(`💰 Balance for ${song.title}: ${balanceNum} tokens`);
                  
                  if (balanceNum > 0) {
                    console.log(`✅ Found tokens for ${song.title}: ${balanceNum}`);
                    heldSongs.push({
                      song_id: song.id,
                      title: song.title,
                      artist: song.artist,
                      audio_cid: song.audio_cid,
                      cover_cid: song.cover_cid,
                      play_count: song.play_count,
                      ticker: song.ticker,
                      purchase_date: new Date().toISOString() // Use current date for blockchain-detected songs
                    });
                  }
                } catch (balanceError) {
                  console.warn(`Error checking balance for ${song.title}:`, balanceError);
                }
              }
            }
        } catch (songError) {
          console.warn(`Error checking song ${song.id}:`, songError);
        }
      }

      console.log(`🎵 Found ${heldSongs.length} songs held by wallet`);
      return heldSongs;
    } catch (err: any) {
      console.error('Error fetching held songs:', err);
      return [];
    }
  };

  useEffect(() => {
    if (isConnected && fullAddress) {
      fetchPlaylists();
    } else {
      setPlaylists([]);
      setLoading(false);
    }
  }, [isConnected, fullAddress]);

  return {
    playlists,
    loading,
    error,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    fetchPlaylistSongs,
    fetchPurchasedSongs,
    fetchHeldSongs,
    refreshPlaylists: fetchPlaylists
  };
};
