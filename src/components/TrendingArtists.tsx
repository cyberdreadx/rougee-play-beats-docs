import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ArtistCard from "./ArtistCard";
import { Loader2 } from "lucide-react";

interface Artist {
  wallet_address: string;
  artist_name: string;
  artist_ticker: string | null;
  avatar_cid: string | null;
  cover_cid: string | null;
  total_songs: number;
  total_plays: number;
  verified: boolean;
}

const TrendingArtists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingArtists = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("wallet_address, artist_name, artist_ticker, avatar_cid, cover_cid, total_songs, total_plays, verified")
          .not("artist_name", "is", null)
          .gt("total_songs", 0)
          .order("total_plays", { ascending: false })
          .limit(10);

        if (error) throw error;
        setArtists(data || []);
      } catch (error) {
        console.error("Error fetching trending artists:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingArtists();
  }, []);

  if (loading) {
    return (
      <section className="w-full px-6 py-6">
        <h2 className="text-xl font-bold font-mono mb-4 neon-text">
          TRENDING ARTISTS
        </h2>
        <div className="glass-card p-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
        </div>
      </section>
    );
  }

  if (artists.length === 0) {
    return (
      <section className="w-full px-6 py-6">
        <h2 className="text-xl font-bold font-mono mb-4 neon-text">
          TRENDING ARTISTS
        </h2>
        
        <div className="glass-card p-6">
          <div className="text-center">
            <h3 className="text-lg font-mono text-muted-foreground mb-2">
              NO ARTISTS YET
            </h3>
            <p className="text-sm font-mono text-muted-foreground italic">
              Be the first to launch music!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full px-6 py-6">
      <h2 className="text-xl font-bold font-mono mb-4 neon-text">
        TRENDING ARTISTS
      </h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {artists.map((artist) => (
          <ArtistCard
            key={artist.wallet_address}
            walletAddress={artist.wallet_address}
            artistName={artist.artist_name}
            artistTicker={artist.artist_ticker || undefined}
            avatarCid={artist.avatar_cid || undefined}
            coverCid={artist.cover_cid || undefined}
            totalSongs={artist.total_songs}
            totalPlays={artist.total_plays}
            verified={artist.verified}
            size="medium"
          />
        ))}
      </div>
    </section>
  );
};

export default TrendingArtists;