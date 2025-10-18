import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, Music, Play } from 'lucide-react';
import { PlaylistCard } from '@/components/PlaylistCard';
import { PlaylistModal } from '@/components/PlaylistModal';
import { usePlaylists, Playlist, PlaylistSong, PurchasedSong } from '@/hooks/usePlaylists';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import NetworkInfo from '@/components/NetworkInfo';
import { useWallet } from '@/hooks/useWallet';

const Playlists = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const { playSong, currentSong, isPlaying } = useAudioPlayer();
  const {
    playlists,
    loading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    fetchPlaylistSongs,
    fetchPurchasedSongs,
    fetchHeldSongs
  } = usePlaylists();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<PlaylistSong[]>([]);
  const [purchasedSongs, setPurchasedSongs] = useState<PurchasedSong[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingSongs, setLoadingSongs] = useState(false);

  const filteredPlaylists = playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (playlist.description && playlist.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreatePlaylist = () => {
    setSelectedPlaylist(null);
    setPlaylistSongs([]);
    setShowModal(true);
    loadPurchasedSongs();
  };

  const handleEditPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setLoadingSongs(true);
    setShowModal(true);
    
    const songs = await fetchPlaylistSongs(playlist.id);
    setPlaylistSongs(songs);
    await loadPurchasedSongs();
    setLoadingSongs(false);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (window.confirm('Are you sure you want to delete this playlist?')) {
      await deletePlaylist(playlistId);
    }
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    // TODO: Implement playlist playback
    console.log('Play playlist:', playlist.name);
  };

  const handleSavePlaylist = async (playlistData: Partial<Playlist> & { selectedSongs?: string[] }) => {
    if (selectedPlaylist) {
      await updatePlaylist(selectedPlaylist.id, playlistData);
    } else {
      const newPlaylist = await createPlaylist(
        playlistData.name!,
        playlistData.description,
        playlistData.cover_cid
        // playlistData.ticker // Temporarily disabled
      );
      if (newPlaylist) {
        setSelectedPlaylist(newPlaylist);
        
        // If there are selected songs, add them to the playlist
        if (playlistData.selectedSongs && playlistData.selectedSongs.length > 0) {
          console.log('🎵 Adding selected songs to new playlist:', playlistData.selectedSongs);
          for (const songId of playlistData.selectedSongs) {
            await addSongToPlaylist(newPlaylist.id, songId);
          }
          // Refresh playlist songs to show the added songs
          const songs = await fetchPlaylistSongs(newPlaylist.id);
          setPlaylistSongs(songs);
          console.log('🎵 Added', playlistData.selectedSongs.length, 'songs to new playlist');
        }
      }
    }
  };

  const handleAddSong = async (songId: string) => {
    console.log('🎵 handleAddSong called with songId:', songId);
    console.log('🎵 selectedPlaylist:', selectedPlaylist);
    
    if (selectedPlaylist) {
      console.log('🎵 Adding song to playlist:', selectedPlaylist.id);
      const success = await addSongToPlaylist(selectedPlaylist.id, songId);
      console.log('🎵 Add song result:', success);
      
      if (success) {
        // Refresh playlist songs
        console.log('🎵 Refreshing playlist songs...');
        const songs = await fetchPlaylistSongs(selectedPlaylist.id);
        console.log('🎵 Updated playlist songs:', songs.length);
        setPlaylistSongs(songs);
      }
    } else {
      console.error('🎵 No selected playlist!');
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (selectedPlaylist) {
      await removeSongFromPlaylist(selectedPlaylist.id, songId);
      // Refresh playlist songs
      const songs = await fetchPlaylistSongs(selectedPlaylist.id);
      setPlaylistSongs(songs);
    }
  };

  const loadPurchasedSongs = async () => {
    console.log('🔄 Loading purchased songs...');
    
    // Try both methods to get songs
    const [purchasedSongsData, heldSongsData] = await Promise.all([
      fetchPurchasedSongs(),
      fetchHeldSongs()
    ]);
    
    console.log('📊 Purchased songs from DB:', purchasedSongsData.length);
    console.log('🎵 Held songs from wallet:', heldSongsData.length);
    
    // Combine both sources and remove duplicates
    const allSongs = [...purchasedSongsData, ...heldSongsData];
    const uniqueSongs = allSongs.filter((song, index, self) => 
      index === self.findIndex(s => s.song_id === song.song_id)
    );
    
    console.log('🎶 Total unique songs available:', uniqueSongs.length);
    setPurchasedSongs(uniqueSongs);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <NetworkInfo />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-mono font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-4">
              Connect your wallet to view and manage your playlists
            </p>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-20">
      <NetworkInfo />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-mono font-bold neon-text mb-2">
              My Playlists
            </h1>
            <p className="text-muted-foreground font-mono">
              Create and manage playlists with your purchased songs
            </p>
          </div>
          
          <Button onClick={handleCreatePlaylist} className="font-mono">
            <Plus className="h-4 w-4 mr-2" />
            Create Playlist
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search playlists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-mono"
            />
          </div>
          
          {/* Debug button to check songs */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadPurchasedSongs}
            className="font-mono"
          >
            🔍 Check My Songs
          </Button>
        </div>

        {/* Playlists Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
          </div>
        ) : filteredPlaylists.length === 0 ? (
          <Card className="p-12 text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-mono font-bold mb-2">
              {searchTerm ? 'No playlists found' : 'No playlists yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Create your first playlist with your purchased songs'
              }
            </p>
            {!searchTerm && (
              <Button onClick={handleCreatePlaylist}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Playlist
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onEdit={handleEditPlaylist}
                onDelete={handleDeletePlaylist}
                onPlay={handlePlayPlaylist}
              />
            ))}
          </div>
        )}

        {/* Playlist Modal */}
        <PlaylistModal
          playlist={selectedPlaylist}
          songs={playlistSongs}
          purchasedSongs={purchasedSongs}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSavePlaylist}
          onAddSong={handleAddSong}
          onRemoveSong={handleRemoveSong}
          onPlaySong={playSong}
          currentSong={currentSong}
          isPlaying={isPlaying}
        />
      </div>
    </div>
  );
};

export default Playlists;
