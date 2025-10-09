import { useEffect } from "react";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import { Dialog, DialogContent } from "./ui/dialog";

interface Ad {
  id: string;
  title: string;
  audio_cid: string;
  image_cid: string | null;
  duration: number;
}

interface AdDisplayProps {
  ad: Ad;
  isOpen: boolean;
  onClose: () => void;
}

export const AdDisplay = ({ ad, isOpen, onClose }: AdDisplayProps) => {
  useEffect(() => {
    if (isOpen && ad) {
      const timer = setTimeout(() => {
        onClose();
      }, ad.duration * 1000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, ad, onClose]);

  if (!ad) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-xl font-bold text-foreground">{ad.title}</h3>
          
          {ad.image_cid && (
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <img 
                src={getIPFSGatewayUrl(ad.image_cid)}
                alt={ad.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Advertisement • {ad.duration}s
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
