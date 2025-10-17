import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Plus, Trash2, Music, ArrowLeft, Pause } from "lucide-react";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import { useToast } from "@/hooks/use-toast";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  wallet_address: string;
  audio_cid: string;
  cover_cid: string | null;
  ticker?: string | null;
  position?: number;
  play_count?: number;
  created_at?: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_cid: string | null;
  wallet_address: string;
}

interface PlaylistDetailProps {
  playSong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
}

const PlaylistDetail = ({ playSong, currentSong, isPlaying }: PlaylistDetailProps) => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { fullAddress } = useWallet();
  const { toast } = useToast();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (playlistId) {
      fetchPlaylist();
    }
  }, [playlistId]);

  const fetchPlaylist = async () => {
    if (!playlistId) return;

    setLoading(true);
    try {
      // Fetch playlist details
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("id", playlistId)
        .single();

      if (playlistError) throw playlistError;
      setPlaylist(playlistData);

      // Fetch playlist songs
      const { data: playlistSongs, error: songsError } = await supabase
        .from("playlist_songs")
        .select(`
          position,
          song_id,
          songs (
            id,
            title,
            artist,
            wallet_address,
            audio_cid,
            cover_cid,
            ticker
          )
        `)
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      if (songsError) throw songsError;

      const formattedSongs = (playlistSongs || [])
        .filter((ps: any) => ps.songs)
        .map((ps: any) => ({
          ...ps.songs,
          position: ps.position,
        }));

      setSongs(formattedSongs);
    } catch (error) {
      console.error("Error fetching playlist:", error);
      toast({
        title: "Error loading playlist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!confirm("Remove this song from the playlist?")) return;

    try {
      const { error } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("song_id", songId);

      if (error) throw error;

      toast({
        title: "Song removed",
      });

      fetchPlaylist();
    } catch (error) {
      console.error("Error removing song:", error);
      toast({
        title: "Error removing song",
        variant: "destructive",
      });
    }
  };

  const isOwner = fullAddress && playlist?.wallet_address?.toLowerCase() === fullAddress.toLowerCase();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-mono">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card p-8 text-center max-w-md">
          <Music className="h-16 w-16 mx-auto mb-4 text-neon-green/50" />
          <h2 className="text-2xl font-bold mb-2">Playlist not found</h2>
          <Button onClick={() => navigate("/playlists")} variant="neon" className="mt-4">
            Back to Playlists
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/playlists")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Playlists
        </Button>

        {/* Playlist Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="w-full md:w-64 aspect-square bg-gradient-to-br from-neon-green/10 to-purple-500/10 rounded-lg overflow-hidden">
            {playlist.cover_cid ? (
              <img
                src={getIPFSGatewayUrl(playlist.cover_cid, undefined, true)}
                alt={playlist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-24 w-24 text-neon-green/30" />
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <p className="text-sm text-muted-foreground font-mono mb-2">PLAYLIST</p>
            <h1 className="text-4xl md:text-6xl font-bold font-mono mb-4 text-neon-green">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-muted-foreground mb-4">{playlist.description}</p>
            )}
            <p className="text-sm text-muted-foreground font-mono">
              {songs.length} {songs.length === 1 ? "song" : "songs"}
            </p>
            {isOwner && (
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="gap-2"
                  variant="neon"
                >
                  <Plus className="h-4 w-4" />
                  Add Songs
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Songs List */}
        {songs.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-neon-green/50" />
            <h3 className="text-xl font-bold mb-2">No songs yet</h3>
            <p className="text-muted-foreground mb-6">
              {isOwner
                ? "Add songs you own to this playlist"
                : "This playlist is empty"}
            </p>
            {isOwner && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="gap-2"
                variant="neon"
              >
                <Plus className="h-4 w-4" />
                Add Songs
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {songs.map((song, index) => {
              const isCurrentSong = currentSong?.id === song.id;
              return (
                <Card
                  key={song.id}
                  className="glass-card p-4 flex items-center gap-4 hover:border-neon-green/50 transition-all group"
                >
                  <div className="text-muted-foreground font-mono text-sm w-8 text-center">
                    {index + 1}
                  </div>
                  <div
                    className="w-12 h-12 rounded bg-gradient-to-br from-neon-green/10 to-purple-500/10 overflow-hidden flex-shrink-0 cursor-pointer group-hover:scale-105 transition-transform"
                    onClick={() => playSong(song)}
                  >
                    {song.cover_cid ? (
                      <img
                        src={getIPFSGatewayUrl(song.cover_cid, undefined, true)}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-6 w-6 text-neon-green/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold font-mono truncate">{song.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.artist || "Unknown Artist"}
                      {song.ticker && (
                        <span className="ml-2 text-neon-green">${song.ticker}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => playSong(song)}
                      className="h-10 w-10"
                    >
                      {isCurrentSong && isPlaying ? (
                        <Pause className="h-5 w-5 text-neon-green" />
                      ) : (
                        <Play className="h-5 w-5 text-neon-green" />
                      )}
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSong(song.id)}
                        className="h-10 w-10 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {playlistId && (
        <AddToPlaylistModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          playlistId={playlistId}
          onSuccess={fetchPlaylist}
        />
      )}
    </div>
  );
};

export default PlaylistDetail;
