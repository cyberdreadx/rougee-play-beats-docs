import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePlaylistModal = ({ isOpen, onClose, onSuccess }: CreatePlaylistModalProps) => {
  const { fullAddress } = useWallet();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!fullAddress || !name.trim()) {
      toast({
        title: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from("playlists")
        .insert({
          wallet_address: fullAddress.toLowerCase(),
          name: name.trim(),
          description: description.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "Playlist created!",
      });

      setName("");
      setDescription("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating playlist:", error);
      toast({
        title: "Error creating playlist",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-neon-green/30">
        <DialogHeader>
          <DialogTitle className="font-mono text-neon-green">
            CREATE NEW PLAYLIST
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name" className="font-mono">
              Playlist Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Favorites"
              maxLength={100}
              className="mt-2"
              disabled={creating}
            />
          </div>
          <div>
            <Label htmlFor="description" className="font-mono">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A collection of my favorite tracks"
              maxLength={500}
              className="mt-2"
              rows={3}
              disabled={creating}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={creating}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="neon"
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="flex-1"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Playlist"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlaylistModal;
