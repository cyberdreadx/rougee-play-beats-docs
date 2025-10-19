import { Badge } from "@/components/ui/badge";
import { Music, Loader2, Crown } from "lucide-react";
import { useUploadSlots } from "@/hooks/useUploadSlots";
import { useWallet } from "@/hooks/useWallet";

interface UploadSlotsBadgeProps {
  className?: string;
}

export const UploadSlotsBadge = ({ className }: UploadSlotsBadgeProps) => {
  const { slotsRemaining, songsUploaded, totalSlots, isPremium, isLoading } = useUploadSlots();
  const { fullAddress } = useWallet();

  if (!fullAddress) return null; // Only show if wallet is connected

  const displaySlots = isLoading ? '...' : `${songsUploaded}/${totalSlots}`;

  return (
    <Badge
      variant="outline"
      className={`
        ${isPremium ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50' : 'bg-card text-primary border-border'}
        flex items-center gap-1 px-3 py-1 text-xs font-mono
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : isPremium ? (
        <Crown className="h-3 w-3" />
      ) : (
        <Music className="h-3 w-3" />
      )}
      {displaySlots}
      {isPremium && <span className="text-[10px]">PRO</span>}
    </Badge>
  );
};
