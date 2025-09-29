import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "wagmi";
import { Upload, Music } from "lucide-react";

export default function UploadMusic() {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const { address } = useAccount();

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!audioFile || !address) {
      toast({
        title: "Error",
        description: "Please connect wallet and select an audio file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let coverCid = null;

      // Upload everything in one call
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('walletAddress', address);
      if (coverFile) {
        formData.append('coverFile', coverFile);
      }
      formData.append('metadata', JSON.stringify({
        title: title || audioFile.name,
        artist,
        genre,
      }));

      const { data, error } = await supabase.functions.invoke('upload-to-lighthouse', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Music uploaded! Audio: ${data.audioCid}${data.coverCid ? `, Cover: ${data.coverCid}` : ''}, Metadata: ${data.metadataCid}`,
      });

      // Reset form
      setTitle("");
      setArtist("");
      setGenre("");
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <Music className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Upload Music to IPFS</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cover-art">Cover Art (Optional)</Label>
            <Input
              id="cover-art"
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              disabled={uploading}
            />
            {coverPreview && (
              <div className="mt-2">
                <img 
                  src={coverPreview} 
                  alt="Cover preview" 
                  className="w-32 h-32 object-cover rounded border border-border"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="audio-file">Audio File *</Label>
            <Input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              disabled={uploading}
            />
          </div>

          <div>
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g., Hip Hop, Electronic"
              disabled={uploading}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || !audioFile || !address}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading to IPFS..." : "Upload to Lighthouse"}
          </Button>

          {!address && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to upload music
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
