import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Plus, X, Play, Pause, Upload, Image as ImageIcon } from 'lucide-react';
import { getIPFSGatewayUrl } from '@/lib/ipfs';
import { Playlist, PlaylistSong, PurchasedSong } from '@/hooks/usePlaylists';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

interface PlaylistModalProps {
  playlist: Playlist | null;
  songs: PlaylistSong[];
  purchasedSongs: PurchasedSong[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (playlist: Partial<Playlist> & { selectedSongs?: string[] }) => void;
  onAddSong: (songId: string) => void;
  onRemoveSong: (songId: string) => void;
  onPlaySong: (song: any) => void;
  currentSong: any;
  isPlaying: boolean;
}

export const PlaylistModal = ({
  playlist,
  songs,
  purchasedSongs,
  isOpen,
  onClose,
  onSave,
  onAddSong,
  onRemoveSong,
  onPlaySong,
  currentSong,
  isPlaying
}: PlaylistModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ticker, setTicker] = useState('');
  const [coverCid, setCoverCid] = useState('');
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  const handleCoverUpload = async (file: File) => {
    if (!file) {
      console.log('No file provided');
      return;
    }
    
    console.log('Starting cover upload for file:', file.name, 'Size:', file.size);
    setIsUploadingCover(true);
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }
      
      console.log('File validation passed, creating preview...');
      
      // Create preview and store temporary reference
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('File reader completed, setting preview');
        setCoverPreview(reader.result as string);
        // Generate a temporary CID for now - in production this would be the actual IPFS hash
        setCoverCid(`temp-cover-${Date.now()}`);
        console.log('Cover preview set successfully');
      };
      reader.readAsDataURL(file);
      
      // TODO: Implement actual IPFS upload using Supabase functions
      // This would involve calling a Supabase function similar to update-artist-profile
      // that uploads the file to Lighthouse IPFS and returns the CID
      
    } catch (error) {
      console.error('Cover upload error:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload cover image');
    } finally {
      setIsUploadingCover(false);
    }
  };

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setDescription(playlist.description || '');
      setTicker(playlist.ticker || '');
      setCoverCid(playlist.cover_cid || '');
      setCoverPreview(playlist.cover_cid ? getIPFSGatewayUrl(playlist.cover_cid) : null);
      setSelectedSongs([]); // Clear selected songs when editing existing playlist
    } else {
      setName('');
      setDescription('');
      setTicker('');
      setCoverCid('');
      setCoverPreview(null);
      setSelectedSongs([]); // Clear selected songs for new playlist
    }
  }, [playlist]);

  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      // ticker: ticker.trim() || undefined, // Temporarily disabled
      cover_cid: coverCid.trim() || undefined,
      selectedSongs: selectedSongs // Pass selected songs to parent
    });
  };

  const filteredPurchasedSongs = purchasedSongs.filter(song => 
    song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    song.artist.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableSongs = filteredPurchasedSongs.filter(purchasedSong => 
    !songs.some(playlistSong => playlistSong.song_id === purchasedSong.song_id) &&
    !selectedSongs.includes(purchasedSong.song_id) // Also exclude already selected songs for new playlists
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-background border border-border rounded-lg w-full max-w-4xl h-[95vh] md:max-h-[90vh] overflow-hidden">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Panel - Playlist Info */}
          <div className="w-full md:w-1/2 p-4 md:p-6 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-mono font-bold">
                {playlist ? 'Edit Playlist' : 'Create Playlist'}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 md:space-y-4">
              <div>
                <Label htmlFor="name">Playlist Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="font-mono"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your playlist"
                  rows={3}
                  className="font-mono"
                />
              </div>

              {/* Temporarily disabled until database is updated */}
              {/* <div>
                <Label htmlFor="ticker">Ticker Symbol (Optional)</Label>
                <Input
                  id="ticker"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g., MYPL"
                  className="font-mono"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Create a unique ticker for your playlist token
                </p>
              </div> */}

              <div>
                <Label>Cover Image (Optional)</Label>
                <div className="space-y-2">
                  {coverPreview ? (
                    <div className="relative">
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-32 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setCoverPreview(null);
                          setCoverCid('');
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-border rounded-lg p-4 md:p-6 text-center">
                      <ImageIcon className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs md:text-sm text-muted-foreground mb-2">
                        Upload a cover image for your playlist
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('File selected:', file.name);
                            handleCoverUpload(file);
                          }
                        }}
                        className="hidden"
                        id="cover-upload"
                        disabled={isUploadingCover}
                        ref={(input) => {
                          if (input) {
                            // Store reference for programmatic click
                            (window as any).coverUploadInput = input;
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingCover}
                        className="cursor-pointer"
                        onClick={() => {
                          console.log('Choose Image button clicked');
                          const input = document.getElementById('cover-upload') as HTMLInputElement;
                          if (input) {
                            console.log('File input found, triggering click');
                            input.click();
                          } else {
                            console.error('File input not found!');
                          }
                        }}
                      >
                        {isUploadingCover ? (
                          <>
                            <Upload className="h-3 w-3 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3 w-3 mr-2" />
                            Choose Image
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  {playlist ? 'Update Playlist' : 'Create Playlist'}
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Songs */}
          <div className="w-full md:w-1/2 p-4 md:p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-mono font-bold">Songs ({songs.length})</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddSongs(!showAddSongs)}
                className="text-xs md:text-sm"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Add Songs
              </Button>
            </div>

            {/* Selected Songs for New Playlist */}
            {!playlist && selectedSongs.length > 0 && (
              <Card className="p-3 md:p-4 mb-3 md:mb-4 bg-card/50 border-neon-green/20">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono font-semibold text-neon-green text-sm md:text-base">Selected Songs ({selectedSongs.length})</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedSongs.map((songId, index) => {
                      const song = purchasedSongs.find(s => s.song_id === songId);
                      if (!song) return null;
                      return (
                        <div key={songId} className="flex items-center justify-between p-2 bg-background/50 rounded border">
                          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                              {song.cover_cid ? (
                                <img
                                  src={getIPFSGatewayUrl(song.cover_cid)}
                                  alt={song.title}
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <Music className="h-4 w-4 text-neon-green" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-mono text-xs md:text-sm font-semibold truncate">
                                {song.title}
                              </p>
                              <p className="font-mono text-xs text-muted-foreground truncate">
                                {song.artist}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedSongs(prev => prev.filter(id => id !== songId));
                              console.log('🎵 Removed from selected songs:', songId);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            )}

            {/* Add Songs Section */}
            {showAddSongs && (
              <Card className="p-3 md:p-4 mb-3 md:mb-4 bg-card/50">
                <div className="space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono font-semibold text-sm md:text-base">Add Purchased Songs</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddSongs(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Input
                    placeholder="Search your purchased songs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="font-mono text-sm"
                  />

                  <div className="max-h-32 md:max-h-40 overflow-y-auto space-y-1 md:space-y-2">
                    {availableSongs.map((song) => (
                      <div
                        key={song.song_id}
                        className="flex items-center justify-between p-2 bg-background/50 rounded border"
                      >
                        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                          <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                            {song.cover_cid ? (
                              <img
                                src={getIPFSGatewayUrl(song.cover_cid)}
                                alt={song.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Music className="h-4 w-4 text-neon-green" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-mono text-xs md:text-sm font-semibold truncate">
                              {song.title}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground truncate">
                              {song.artist}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log('Plus button clicked for song:', song.title, 'ID:', song.song_id);
                            if (playlist) {
                              // If editing existing playlist, add song immediately
                              onAddSong(song.song_id);
                            } else {
                              // If creating new playlist, check for duplicates before adding
                              if (!selectedSongs.includes(song.song_id)) {
                                setSelectedSongs(prev => [...prev, song.song_id]);
                                console.log('🎵 Added to selected songs:', song.song_id);
                              } else {
                                console.log('🎵 Song already selected:', song.song_id);
                              }
                            }
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Current Songs */}
            <div className="space-y-2">
              {songs.map((playlistSong, index) => (
                <Card key={playlistSong.id} className="p-3 bg-card/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {playlistSong.songs?.cover_cid ? (
                        <img
                          src={getIPFSGatewayUrl(playlistSong.songs.cover_cid)}
                          alt={playlistSong.songs.title}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Music className="h-5 w-5 text-neon-green" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold truncate">
                        {playlistSong.songs?.title}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground truncate">
                        {playlistSong.songs?.artist}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{index + 1}
                      </span>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPlaySong(playlistSong.songs)}
                      >
                        {currentSong?.id === playlistSong.songs?.id && isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveSong(playlistSong.song_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {songs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-mono">No songs in this playlist</p>
                  <p className="font-mono text-sm">Add some purchased songs to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
