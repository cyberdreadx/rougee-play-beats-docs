import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import NetworkInfo from "@/components/NetworkInfo";
import Navigation from "@/components/Navigation";
import AudioPlayer from "@/components/AudioPlayer";
import { useArtistProfile } from "@/hooks/useArtistProfile";
import { useWallet } from "@/hooks/useWallet";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, ExternalLink, Edit, Music, Play, Calendar, Twitter, Instagram, Globe } from "lucide-react";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Song {
  id: string;
  title: string;
  artist: string;
  wallet_address: string;
  audio_cid: string;
  cover_cid: string | null;
  play_count: number;
  created_at: string;
}

const Artist = () => {
  const { walletAddress } = useParams<{ walletAddress: string }>();
  const navigate = useNavigate();
  const { fullAddress } = useWallet();
  const { profile, loading, error } = useArtistProfile(walletAddress || null);
  const { currentSong, isPlaying, playSong, togglePlayPause, onSongEnd } = useAudioPlayer();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  const isOwnProfile = fullAddress?.toLowerCase() === walletAddress?.toLowerCase();

  useEffect(() => {
    const fetchArtistSongs = async () => {
      if (!walletAddress) return;

      try {
        setLoadingSongs(true);
        const { data, error } = await supabase
          .from("songs")
          .select("id, title, artist, wallet_address, audio_cid, cover_cid, play_count, created_at")
          .eq("wallet_address", walletAddress)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setSongs(data || []);
      } catch (err) {
        console.error("Error fetching artist songs:", err);
        toast({
          title: "Error loading songs",
          description: "Failed to load artist's music",
          variant: "destructive",
        });
      } finally {
        setLoadingSongs(false);
      }
    };

    fetchArtistSongs();
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="font-mono text-muted-foreground">Artist profile not found</p>
          <Button variant="neon" onClick={() => navigate("/")}>
            GO HOME
          </Button>
        </div>
      </div>
    );
  }

  const coverUrl = profile.cover_cid ? getIPFSGatewayUrl(profile.cover_cid) : null;
  const avatarUrl = profile.avatar_cid ? getIPFSGatewayUrl(profile.avatar_cid) : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <NetworkInfo />

      {/* Cover Photo Hero */}
      <div 
        className="relative h-64 w-full"
        style={coverUrl ? {
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : undefined}
      >
        {!coverUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-background to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Avatar Overlapping Cover */}
        <div className="absolute bottom-0 left-8 transform translate-y-1/2">
          <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
            <AvatarImage src={avatarUrl || undefined} alt={profile.artist_name} />
            <AvatarFallback className="bg-primary/20 text-neon-green font-mono text-4xl">
              {profile.artist_name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-6xl mx-auto px-6 py-8 pt-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-mono font-bold neon-text">
                {profile.artist_name}
              </h1>
              {profile.verified && (
                <Badge className="bg-neon-green/20 text-neon-green border-neon-green">
                  VERIFIED
                </Badge>
              )}
            </div>
            {profile.artist_ticker && (
              <p className="text-2xl font-mono text-neon-green mb-2">
                ${profile.artist_ticker}
              </p>
            )}
            <p className="text-sm font-mono text-muted-foreground">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </p>
          </div>

          {isOwnProfile && (
            <Button variant="neon" onClick={() => navigate("/profile/edit")}>
              <Edit className="h-4 w-4 mr-2" />
              EDIT PROFILE
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="console-bg tech-border p-4 text-center">
            <Music className="h-6 w-6 mx-auto mb-2 text-neon-green" />
            <p className="text-2xl font-mono font-bold">{profile.total_songs || 0}</p>
            <p className="text-xs font-mono text-muted-foreground">SONGS</p>
          </Card>
          <Card className="console-bg tech-border p-4 text-center">
            <Play className="h-6 w-6 mx-auto mb-2 text-neon-green" />
            <p className="text-2xl font-mono font-bold">{profile.total_plays || 0}</p>
            <p className="text-xs font-mono text-muted-foreground">PLAYS</p>
          </Card>
          <Card className="console-bg tech-border p-4 text-center">
            <Calendar className="h-6 w-6 mx-auto mb-2 text-neon-green" />
            <p className="text-xs font-mono font-bold">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
            <p className="text-xs font-mono text-muted-foreground">MEMBER SINCE</p>
          </Card>
          {profile.profile_metadata_cid && (
            <Card className="console-bg tech-border p-4 text-center">
              <a
                href={getIPFSGatewayUrl(profile.profile_metadata_cid)}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-neon-green transition-colors"
              >
                <ExternalLink className="h-6 w-6 mx-auto mb-2" />
                <p className="text-xs font-mono font-bold">VIEW ON</p>
                <p className="text-xs font-mono text-muted-foreground">IPFS</p>
              </a>
            </Card>
          )}
        </div>

        {/* Bio & Social Links */}
        {(profile.bio || profile.social_links) && (
          <Card className="console-bg tech-border p-6 mb-8">
            {profile.bio && (
              <p className="font-mono text-sm mb-4 whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
            {profile.social_links && (
              <div className="flex gap-4">
                {profile.social_links.twitter && (
                  <a
                    href={profile.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-neon-green transition-colors"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
                {profile.social_links.instagram && (
                  <a
                    href={profile.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-neon-green transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {profile.social_links.website && (
                  <a
                    href={profile.social_links.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-neon-green transition-colors"
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Artist's Songs */}
        <div>
          <h2 className="text-2xl font-mono font-bold neon-text mb-4">
            MUSIC
          </h2>
          
          {loadingSongs ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
            </div>
          ) : songs.length === 0 ? (
            <Card className="console-bg tech-border p-6 text-center">
              <p className="font-mono text-muted-foreground">No songs uploaded yet</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {songs.map((song) => (
                <Card
                  key={song.id}
                  className="console-bg tech-border p-4 cursor-pointer hover:border-neon-green transition-colors"
                  onClick={() => playSong(song)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded tech-border bg-primary/20 flex items-center justify-center">
                      {currentSong?.id === song.id && isPlaying ? (
                        <Loader2 className="h-6 w-6 text-neon-green animate-spin" />
                      ) : (
                        <Play className="h-6 w-6 text-neon-green" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono font-bold truncate">{song.title}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {song.play_count} plays
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <AudioPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onSongEnd={onSongEnd}
      />
    </div>
  );
};

export default Artist;
