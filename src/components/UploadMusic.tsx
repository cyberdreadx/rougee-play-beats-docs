import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "wagmi";
import { useNavigate } from "react-router-dom";
import { Upload, Music } from "lucide-react";
export default function UploadMusic() {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [ticker, setTicker] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const {
    toast
  } = useToast();
  const {
    address
  } = useAccount();
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
        variant: "destructive"
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
        ticker
      }));
      const {
        data,
        error
      } = await supabase.functions.invoke('upload-to-lighthouse', {
        body: formData
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: `Music uploaded! Audio: ${data.audioCid}${data.coverCid ? `, Cover: ${data.coverCid}` : ''}, Metadata: ${data.metadataCid}`
      });

      // Reset form
      setTitle("");
      setArtist("");
      setGenre("");
      setTicker("");
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview(null);

      // Auto-redirect to home after successful upload
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };
  return <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-6">
          <Music className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Launch Music on ROUGEE</h2>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cover-art">Cover Art (Optional)</Label>
            <div className="relative">
              <input
                id="cover-art"
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-48 h-48 border-2 border-dashed border-tech-border rounded-lg flex flex-col items-center justify-center bg-console-bg/20 hover:bg-console-bg/40 transition-all duration-300 hover:border-neon-green">
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <>
                    <Music className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground text-center px-4">
                      Drop your CD cover here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG up to 10MB
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="audio-file">Audio File *</Label>
            <Input id="audio-file" type="file" accept="audio/*" onChange={e => setAudioFile(e.target.files?.[0] || null)} disabled={uploading} />
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Song title" disabled={uploading} />
          </div>

          <div>
            <Label htmlFor="artist">Artist</Label>
            <Input id="artist" value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist name" disabled={uploading} />
          </div>

          <div>
            <Label htmlFor="genre">Genre</Label>
            <Input id="genre" value={genre} onChange={e => setGenre(e.target.value)} placeholder="e.g., Hip Hop, Electronic" disabled={uploading} />
          </div>

          <div>
            <Label htmlFor="ticker">Ticker Symbol</Label>
            <Input id="ticker" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="e.g., BEAT, MUSIC" maxLength={10} disabled={uploading} />
          </div>

          <Button onClick={handleUpload} disabled={uploading || !audioFile || !address} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? "Uploading to IPFS..." : "Upload to Lighthouse"}
          </Button>

          {!address && <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to upload music
            </p>}
        </div>
      </div>
    </div>;
}