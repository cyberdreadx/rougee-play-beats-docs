import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Play, CheckCircle } from "lucide-react";
import { getIPFSGatewayUrl, getIPFSGatewayUrls } from "@/lib/ipfs";

interface ArtistCardProps {
  walletAddress: string;
  artistName: string;
  artistTicker?: string;
  avatarCid?: string;
  coverCid?: string;
  totalSongs: number;
  totalPlays: number;
  verified?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ArtistCard = ({
  walletAddress,
  artistName,
  artistTicker,
  avatarCid,
  coverCid,
  totalSongs,
  totalPlays,
  verified,
  size = 'medium'
}: ArtistCardProps) => {
  const navigate = useNavigate();
  const [avatarError, setAvatarError] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const avatarSources = avatarCid ? getIPFSGatewayUrls(avatarCid, 4, true) : [];
  const coverSources = coverCid ? getIPFSGatewayUrls(coverCid, 4, true) : [];
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [coverIndex, setCoverIndex] = useState(0);

  const avatarUrl = !avatarError && avatarSources[avatarIndex] ? avatarSources[avatarIndex] : null;
  const coverUrl = !coverError && coverSources[coverIndex] ? coverSources[coverIndex] : null;

  const sizeClasses = {
    small: 'h-32 w-48',
    medium: 'h-40 w-56',
    large: 'h-48 w-64'
  };

  return (
    <Card 
      className={`${sizeClasses[size]} relative overflow-hidden cursor-pointer group tech-border hover:border-neon-green transition-all duration-300`}
      onClick={() => navigate(`/artist/${walletAddress}`)}
    >
      {/* Cover Photo Background */}
      <div className="absolute inset-0">
        {coverUrl && (
          <img
            src={coverUrl}
            alt={`${artistName || 'Artist'} cover`}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => {
              console.warn(`Failed to load cover for ${artistName}:`, coverCid, 'source:', coverUrl);
              if (coverIndex < coverSources.length - 1) {
                setCoverIndex(coverIndex + 1);
              } else {
                setCoverError(true);
              }
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full p-4 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <Avatar className="h-12 w-12 border-2 border-neon-green">
            <AvatarImage 
              key={avatarUrl || 'avatar-fallback'}
              src={avatarUrl || undefined} 
              alt={artistName || 'Artist'}
              referrerPolicy="no-referrer"
              decoding="async"
              loading="lazy"
              onError={() => {
                console.warn(`Failed to load avatar for ${artistName}:`, avatarCid, 'source:', avatarUrl);
                setAvatarIndex((i) => (i < avatarSources.length - 1 ? i + 1 : i));
                if (avatarIndex >= avatarSources.length - 1) {
                  setAvatarError(true);
                }
              }}
            />
            <AvatarFallback className="bg-primary/20 text-neon-green font-mono">
              {(artistName || '??').substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {verified && (
            <Badge className="bg-neon-green/20 text-neon-green border-neon-green flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              VERIFIED
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <h3 className="font-mono font-bold text-lg truncate neon-text">
              {artistName}
            </h3>
            {verified && (
              <CheckCircle className="h-4 w-4 text-neon-green" aria-label="Verified artist" />
            )}
          </div>
          {artistTicker && (
            <p className="text-sm font-mono text-neon-green">
              ${artistTicker}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
            <span className="flex items-center gap-1">
              <Music className="h-3 w-3" />
              {totalSongs}
            </span>
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {totalPlays}
            </span>
          </div>
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-neon-green/0 group-hover:bg-neon-green/5 transition-colors duration-300" />
    </Card>
  );
};

export default ArtistCard;
