import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Music, Play, Trash2 } from "lucide-react";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import { useToast } from "@/hooks/use-toast";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  cover_cid: string | null;
  wallet_address: string;
  created_at: string;
  song_count?: number;
}

const Playlists = () => {
  const navigate = useNavigate();
  const { fullAddress } = useWallet();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (fullAddress) {
      fetchPlaylists();
    }
  }, [fullAddress]);

  const fetchPlaylists = async () => {
    if (!fullAddress) return;

    setLoading(true);
    try {
      const { data: playlistsData, error } = await supabase
        .from("playlists")
        .select(`
          id,
          name,
          description,
          cover_cid,
          wallet_address,
          created_at
        `)
        .eq("wallet_address", fullAddress.toLowerCase())
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get song counts for each playlist
      const playlistsWithCounts = await Promise.all(
        (playlistsData || []).map(async (playlist) => {
          const { count } = await supabase
            .from("playlist_songs")
            .select("*", { count: "exact", head: true })
            .eq("playlist_id", playlist.id);

          return { ...playlist, song_count: count || 0 };
        })
      );

      setPlaylists(playlistsWithCounts);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      toast({
        title: "Error loading playlists",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Delete this playlist?")) return;

    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);

      if (error) throw error;

      toast({
        title: "Playlist deleted",
      });

      fetchPlaylists();
    } catch (error) {
      console.error("Error deleting playlist:", error);
      toast({
        title: "Error deleting playlist",
        variant: "destructive",
      });
    }
  };

  if (!fullAddress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="glass-card p-8 text-center max-w-md">
          <Music className="h-16 w-16 mx-auto mb-4 text-neon-green" />
          <h2 className="text-2xl font-bold mb-2">Connect Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to view and create playlists
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold font-mono mb-2 text-neon-green">
              MY PLAYLISTS
            </h1>
            <p className="text-muted-foreground font-mono text-sm">
              Curate your owned music collection
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="gap-2"
            variant="neon"
          >
            <Plus className="h-4 w-4" />
            Create Playlist
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass-card p-6 animate-pulse">
                <div className="aspect-square bg-white/10 rounded-lg mb-4" />
                <div className="h-6 bg-white/10 rounded mb-2" />
                <div className="h-4 bg-white/10 rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : playlists.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Music className="h-16 w-16 mx-auto mb-4 text-neon-green/50" />
            <h3 className="text-xl font-bold mb-2">No playlists yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first playlist to organize your purchased songs
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
              variant="neon"
            >
              <Plus className="h-4 w-4" />
              Create Playlist
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <Card
                key={playlist.id}
                className="glass-card overflow-hidden group cursor-pointer hover:border-neon-green/50 transition-all"
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              >
                <div className="aspect-square bg-gradient-to-br from-neon-green/10 to-purple-500/10 relative overflow-hidden">
                  {playlist.cover_cid ? (
                    <img
                      src={getIPFSGatewayUrl(playlist.cover_cid, undefined, true)}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-16 w-16 text-neon-green/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-12 w-12 text-neon-green" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold font-mono text-lg mb-1 truncate">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground font-mono">
                      {playlist.song_count} {playlist.song_count === 1 ? "song" : "songs"}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(playlist.id, e)}
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchPlaylists}
      />
    </div>
  );
};

export default Playlists;
