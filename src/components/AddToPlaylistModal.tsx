import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Music, Search } from "lucide-react";
import { getIPFSGatewayUrl } from "@/lib/ipfs";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  cover_cid: string | null;
  ticker?: string | null;
}

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  onSuccess: () => void;
}

const AddToPlaylistModal = ({ isOpen, onClose, playlistId, onSuccess }: AddToPlaylistModalProps) => {
  const { fullAddress } = useWallet();
  const { toast } = useToast();
  const [ownedSongs, setOwnedSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen && fullAddress) {
      fetchOwnedSongs();
    }
  }, [isOpen, fullAddress]);

  const fetchOwnedSongs = async () => {
    if (!fullAddress) return;

    setLoading(true);
    try {
      // Get songs the user has purchased
      const { data: purchases, error: purchasesError } = await supabase
        .from("song_purchases")
        .select("song_id")
        .eq("buyer_wallet_address", fullAddress.toLowerCase());

      if (purchasesError) throw purchasesError;

      if (!purchases || purchases.length === 0) {
        setOwnedSongs([]);
        return;
      }

      const songIds = purchases.map((p) => p.song_id);

      // Get song details
      const { data: songs, error: songsError } = await supabase
        .from("songs")
        .select("id, title, artist, cover_cid, ticker")
        .in("id", songIds);

      if (songsError) throw songsError;

      // Filter out songs already in playlist
      const { data: playlistSongs, error: playlistError } = await supabase
        .from("playlist_songs")
        .select("song_id")
        .eq("playlist_id", playlistId);

      if (playlistError) throw playlistError;

      const playlistSongIds = new Set((playlistSongs || []).map((ps) => ps.song_id));
      const availableSongs = (songs || []).filter((s) => !playlistSongIds.has(s.id));

      setOwnedSongs(availableSongs);
    } catch (error) {
      console.error("Error fetching owned songs:", error);
      toast({
        title: "Error loading songs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSongs = async () => {
    if (selectedSongs.size === 0) return;

    setAdding(true);
    try {
      // Get current max position
      const { data: existingSongs } = await supabase
        .from("playlist_songs")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);

      const startPosition = existingSongs && existingSongs.length > 0
        ? existingSongs[0].position + 1
        : 0;

      // Add songs with sequential positions
      const songsToAdd = Array.from(selectedSongs).map((songId, index) => ({
        playlist_id: playlistId,
        song_id: songId,
        position: startPosition + index,
      }));

      const { error } = await supabase
        .from("playlist_songs")
        .insert(songsToAdd);

      if (error) throw error;

      toast({
        title: `Added ${selectedSongs.size} ${selectedSongs.size === 1 ? "song" : "songs"}`,
      });

      setSelectedSongs(new Set());
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error adding songs:", error);
      
      if (error.message?.includes("row-level security")) {
        toast({
          title: "Can't add song",
          description: "You can only add songs you own",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error adding songs",
          variant: "destructive",
        });
      }
    } finally {
      setAdding(false);
    }
  };

  const toggleSong = (songId: string) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const filteredSongs = ownedSongs.filter((song) =>
    song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-neon-green/30 max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-mono text-neon-green">
            ADD SONGS TO PLAYLIST
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your owned songs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
          </div>
        ) : ownedSongs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Music className="h-16 w-16 text-neon-green/30 mb-4" />
            <p className="text-muted-foreground text-center">
              No songs available to add.
              <br />
              Purchase songs to add them to your playlists.
            </p>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Music className="h-16 w-16 text-neon-green/30 mb-4" />
            <p className="text-muted-foreground text-center">
              No songs match your search
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => toggleSong(song.id)}
                >
                  <Checkbox
                    checked={selectedSongs.has(song.id)}
                    onCheckedChange={() => toggleSong(song.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-neon-green/10 to-purple-500/10 overflow-hidden flex-shrink-0">
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
                    <p className="font-bold font-mono truncate">{song.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.artist || "Unknown Artist"}
                      {song.ticker && (
                        <span className="ml-2 text-neon-green">${song.ticker}</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button variant="outline" onClick={onClose} disabled={adding} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="neon"
                onClick={handleAddSongs}
                disabled={adding || selectedSongs.size === 0}
                className="flex-1"
              >
                {adding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  `Add ${selectedSongs.size} ${selectedSongs.size === 1 ? "Song" : "Songs"}`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToPlaylistModal;
