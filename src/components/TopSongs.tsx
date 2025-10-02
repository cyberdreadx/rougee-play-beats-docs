import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Play, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  wallet_address: string;
  audio_cid: string;
  cover_cid: string | null;
  play_count: number;
  created_at: string;
}

interface TopSongsProps {
  onPlaySong: (song: Song) => void;
  currentSong: Song | null;
  isPlaying: boolean;
  onPlayCountUpdate?: () => void;
}

export interface TopSongsRef {
  refreshSongs: () => void;
}

const TopSongs = forwardRef<TopSongsRef, TopSongsProps>(({ onPlaySong, currentSong, isPlaying, onPlayCountUpdate }, ref) => {
  const navigate = useNavigate();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSongs();
    checkAdminStatus();
  }, []);

  useImperativeHandle(ref, () => ({
    refreshSongs: fetchSongs,
  }));

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('id, title, artist, wallet_address, audio_cid, cover_cid, play_count, created_at')
        .order('play_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSongs(data || []);
    } catch (error) {
      console.error('Error fetching songs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayClick = (song: Song) => {
    onPlaySong(song);
    // Refresh play counts after a short delay to allow the update to process
    setTimeout(() => {
      onPlayCountUpdate?.();
    }, 1000);
  };

  const isCurrentSong = (song: Song) => currentSong?.id === song.id;

  const deleteSong = async (songId: string, songTitle: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (error) throw error;

      // Remove from local state
      setSongs(songs.filter(song => song.id !== songId));
      
      toast({
        title: "Song deleted",
        description: `"${songTitle}" has been removed`,
      });
    } catch (error) {
      console.error('Error deleting song:', error);
      toast({
        title: "Error",
        description: "Failed to delete song",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="w-full px-6 py-6">
      <h2 className="text-xl font-bold font-mono mb-4 neon-text">
        TOP 10 SONGS
      </h2>
      
      <div className="console-bg tech-border rounded p-4 space-y-2">
        {loading ? (
          <div className="text-muted-foreground font-mono">Loading songs...</div>
        ) : songs.length === 0 ? (
          <div className="flex items-center justify-between p-2">
            <span className="font-mono text-muted-foreground">
              No songs uploaded yet. Be the first to launch!
            </span>
          </div>
        ) : (
          songs.map((song, index) => (
            <div 
              key={song.id} 
              onClick={() => navigate(`/song/${song.id}`)}
              className="flex items-center justify-between p-2 hover:bg-accent/5 rounded cursor-pointer"
            >
              <div className="flex items-center space-x-4 flex-1">
                <span className="text-neon-green font-mono font-bold text-lg w-8">
                  #{index + 1}
                </span>
                {song.cover_cid && (
                  <img 
                    src={`https://gateway.lighthouse.storage/ipfs/${song.cover_cid}`}
                    alt={song.title}
                    className="w-12 h-12 object-cover rounded border border-neon-green/20"
                  />
                )}
                <div className="flex-1">
                  <div className="font-mono text-foreground font-semibold">
                    {song.title}
                  </div>
                  {song.artist && (
                    <div 
                      className="font-mono text-sm text-muted-foreground hover:text-neon-green cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/artist/${song.wallet_address}`}
                    >
                      {song.artist}
                    </div>
                  )}
                </div>
                <div className="font-mono text-sm text-muted-foreground">
                  {song.play_count} plays
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="neon" 
                  size="sm"
                  onClick={() => handlePlayClick(song)}
                  className={isCurrentSong(song) && isPlaying ? 'animate-pulse' : ''}
                >
                  <Play className="w-4 h-4 mr-1" />
                  {isCurrentSong(song) && isPlaying ? '[PLAYING]' : '[PLAY]'}
                </Button>
                {isAdmin && (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteSong(song.id, song.title)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
});

TopSongs.displayName = "TopSongs";

export default TopSongs;