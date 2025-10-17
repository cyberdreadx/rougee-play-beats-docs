import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { CheckCircle, Loader2 } from "lucide-react";
import { getIPFSGatewayUrl } from "@/lib/ipfs";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Holder {
  wallet_address: string;
  artist_name?: string | null;
  avatar_cid?: string | null;
  verified?: boolean | null;
}

interface HoldersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddresses: string[];
  title: string;
}

export function HoldersModal({ open, onOpenChange, walletAddresses, title }: HoldersModalProps) {
  const navigate = useNavigate();
  const [holders, setHolders] = useState<Holder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHolders = async () => {
      if (!open || walletAddresses.length === 0) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('wallet_address, artist_name, avatar_cid, verified')
          .in('wallet_address', walletAddresses);

        if (error) throw error;

        // Create map of fetched profiles
        const profileMap = new Map(
          data?.map(p => [p.wallet_address?.toLowerCase(), p]) || []
        );

        // Ensure all wallet addresses are represented
        const holdersData = walletAddresses.map(address => ({
          wallet_address: address,
          ...(profileMap.get(address.toLowerCase()) || {})
        }));

        setHolders(holdersData);
      } catch (error) {
        console.error('Error fetching holders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHolders();
  }, [open, walletAddresses]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="console-bg tech-border max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-mono text-neon-green">{title}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-neon-green" />
          </div>
        ) : holders.length === 0 ? (
          <p className="font-mono text-muted-foreground text-center py-8">No {title.toLowerCase()} found</p>
        ) : (
          <div className="space-y-3">
            {holders.map((holder) => (
              <div
                key={holder.wallet_address}
                className="flex items-center gap-3 p-3 rounded tech-border hover:border-neon-green transition-colors cursor-pointer"
                onClick={() => {
                  navigate(`/artist/${holder.wallet_address}`);
                  onOpenChange(false);
                }}
              >
                {holder.avatar_cid ? (
                  <img
                    src={getIPFSGatewayUrl(holder.avatar_cid)}
                    alt={holder.artist_name || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-sm font-mono">
                      {holder.artist_name?.[0] || holder.wallet_address.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-mono font-semibold flex items-center gap-1">
                    {holder.artist_name || `${holder.wallet_address.slice(0, 6)}...${holder.wallet_address.slice(-4)}`}
                    {holder.verified && (
                      <CheckCircle className="h-3 w-3 text-neon-green flex-shrink-0" aria-label="Verified" />
                    )}
                  </p>
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {holder.wallet_address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
