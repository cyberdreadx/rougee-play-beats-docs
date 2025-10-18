import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { getIPFSGatewayUrl } from '@/lib/ipfs';
import { Playlist } from '@/hooks/usePlaylists';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PlaylistCardProps {
  playlist: Playlist;
  onEdit?: (playlist: Playlist) => void;
  onDelete?: (playlistId: string) => void;
  onPlay?: (playlist: Playlist) => void;
  showActions?: boolean;
}

export const PlaylistCard = ({ 
  playlist, 
  onEdit, 
  onDelete, 
  onPlay,
  showActions = true 
}: PlaylistCardProps) => {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const coverUrl = playlist.cover_cid ? getIPFSGatewayUrl(playlist.cover_cid) : null;

  const handleCardClick = () => {
    navigate(`/playlist/${playlist.id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlay) {
      onPlay(playlist);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(playlist);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(playlist.id);
    }
  };

  return (
    <Card 
      className="group cursor-pointer hover:border-neon-green transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:shadow-lg hover:shadow-neon-green/20"
      onClick={handleCardClick}
    >
      <div className="relative">
        {/* Cover Image */}
        <div className="aspect-square w-full overflow-hidden rounded-t-lg bg-primary/10">
          {coverUrl && !imageError ? (
            <img
              src={coverUrl}
              alt={playlist.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-12 w-12 text-neon-green" />
            </div>
          )}
        </div>

        {/* Play Button Overlay */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handlePlayClick}
        >
          <Play className="h-4 w-4" />
        </Button>

        {/* Actions Menu */}
        {showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleCardClick}>
                <Eye className="h-4 w-4 mr-2" />
                View Playlist
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={handleDeleteClick}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-mono font-bold text-lg truncate group-hover:text-neon-green transition-colors">
              {playlist.name}
            </h3>
            {playlist.ticker && (
              <p className="font-mono text-sm text-neon-green mt-1">
                ${playlist.ticker}
              </p>
            )}
          </div>
          {playlist.token_address && (
            <Badge variant="secondary" className="text-xs">
              Tokenized
            </Badge>
          )}
        </div>
        
        {playlist.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {playlist.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-mono">
            {playlist.song_count || 0} songs
          </span>
          <span className="font-mono">
            {new Date(playlist.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Card>
  );
};
