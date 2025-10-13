import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Upload, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { usePrivyToken } from "@/hooks/usePrivyToken";
import { useCreateSong } from "@/hooks/useSongBondingCurve";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UploadMusic() {
  const navigate = useNavigate();
  const { fullAddress: address } = useWallet();
  const { getAuthHeaders } = usePrivyToken();
  const { createSong, isPending: isCreatingSong } = useCreateSong();
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [genre, setGenre] = useState("");
  const [description, setDescription] = useState("");
  const [ticker, setTicker] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [copyrightWarning, setCopyrightWarning] = useState<{
    show: boolean;
    detectedInfo: any;
    violationCount: number;
  }>({ show: false, detectedInfo: null, violationCount: 0 });

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

  const scanForCopyright = async (file: File) => {
    if (!address) return;
    
    setScanning(true);
    try {
      const headers = await getAuthHeaders();
      
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('file_name', file.name);

      const { data, error } = await supabase.functions.invoke('check-copyright', {
        headers,
        body: formData,
      });

      if (error) throw error;

      if (data.isCopyrighted) {
        setCopyrightWarning({
          show: true,
          detectedInfo: data.detectedInfo,
          violationCount: data.violationCount,
        });
      }
    } catch (error) {
      console.error('Error scanning for copyright:', error);
      toast.error('Failed to scan audio file');
    } finally {
      setScanning(false);
    }
  };

  const handleAudioChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);

    // Scan for copyright
    if (address) {
      await scanForCopyright(file);
    }
  };

  const proceedWithUpload = async () => {
    setCopyrightWarning({ show: false, detectedInfo: null, violationCount: 0 });
    await performUpload();
  };

  const handleUpload = async () => {
    if (!audioFile || !address) {
      toast.error("Please connect wallet and select an audio file");
      return;
    }

    // If copyright detected, show warning dialog
    if (copyrightWarning.show) {
      return;
    }

    await performUpload();
  };

  const performUpload = async () => {
    if (!audioFile || !address) return;

    setUploading(true);
    try {
      const headers = await getAuthHeaders();
      
      const formData = new FormData();
      formData.append('file', audioFile);
      if (coverFile) {
        formData.append('coverFile', coverFile);
      }
      formData.append('metadata', JSON.stringify({
        title: title || audioFile.name,
        artist,
        genre,
        description,
        ticker
      }));

      // Step 1: Upload to IPFS
      toast.success('Uploading to IPFS...');
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-lighthouse', {
        headers,
        body: formData
      });

      if (uploadError) throw uploadError;

      // Step 2: Deploy song token on-chain
      toast.success('Creating song token on Base...');
      const tokenAddress = await createSong({
        name: title || audioFile.name,
        symbol: ticker || 'SONG',
        ipfsHash: uploadData.metadataCid,
      });

      if (!tokenAddress) {
        throw new Error("Failed to deploy song token");
      }

      // Step 3: Update database with token address
      const { error: updateError } = await supabase
        .from('songs')
        .update({ token_address: tokenAddress })
        .eq('id', uploadData.songId);

      if (updateError) throw updateError;

      toast.success(`Song launched! Token: ${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`);

      // Reset form
      setTitle("");
      setArtist("");
      setGenre("");
      setDescription("");
      setTicker("");
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview(null);
      setCopyrightWarning({ show: false, detectedInfo: null, violationCount: 0 });

      // Auto-redirect to home after successful upload
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
                disabled={uploading || scanning}
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
            <Input
              id="audio-file"
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              disabled={uploading || scanning}
            />
            {scanning && (
              <p className="text-sm text-muted-foreground mt-1">
                Scanning for copyright...
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Song title"
              disabled={uploading || scanning}
            />
          </div>

          <div>
            <Label htmlFor="artist">Artist</Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              disabled={uploading || scanning}
            />
          </div>

          <div>
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g., Hip Hop, Electronic"
              disabled={uploading || scanning}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your track..."
              disabled={uploading || scanning}
            />
          </div>

          <div>
            <Label htmlFor="ticker">Ticker Symbol</Label>
            <Input
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g., BEAT, MUSIC"
              maxLength={10}
              disabled={uploading || scanning}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || scanning || isCreatingSong || !audioFile || !address}
            className="w-full"
          >
            <Upload className="w-4 h-4 mr-2" />
            {scanning ? "Scanning for copyright..." : uploading || isCreatingSong ? "Launching on ROUGEE..." : "Launch Song"}
          </Button>

          {!address && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to upload music
            </p>
          )}
        </div>
      </div>

      <AlertDialog open={copyrightWarning.show} onOpenChange={(open) => !open && setCopyrightWarning({ show: false, detectedInfo: null, violationCount: 0 })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Copyright Content Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="text-foreground">
                <p className="font-semibold mb-2">This audio appears to be copyrighted material:</p>
                {copyrightWarning.detectedInfo && (
                  <div className="bg-muted p-3 rounded-md space-y-1">
                    {copyrightWarning.detectedInfo.title && (
                      <p><span className="font-medium">Title:</span> {copyrightWarning.detectedInfo.title}</p>
                    )}
                    {copyrightWarning.detectedInfo.artist && (
                      <p><span className="font-medium">Artist:</span> {copyrightWarning.detectedInfo.artist}</p>
                    )}
                    {copyrightWarning.detectedInfo.album && (
                      <p><span className="font-medium">Album:</span> {copyrightWarning.detectedInfo.album}</p>
                    )}
                    {copyrightWarning.detectedInfo.label && (
                      <p><span className="font-medium">Label:</span> {copyrightWarning.detectedInfo.label}</p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20">
                <p className="text-sm font-medium text-destructive">⚠️ Platform Rules Violation</p>
                <p className="text-sm mt-1">Uploading copyrighted content without permission violates our platform rules.</p>
                {copyrightWarning.violationCount > 0 && (
                  <p className="text-sm mt-2 font-semibold">
                    Previous violations: {copyrightWarning.violationCount}
                  </p>
                )}
                {copyrightWarning.violationCount >= 2 && (
                  <p className="text-sm mt-2 text-destructive font-bold">
                    ⚠️ Warning: Multiple copyright violations may result in permanent ban!
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setAudioFile(null);
              setCopyrightWarning({ show: false, detectedInfo: null, violationCount: 0 });
            }}>
              Cancel Upload
            </AlertDialogCancel>
            <AlertDialogAction onClick={proceedWithUpload} className="bg-destructive hover:bg-destructive/90">
              I Understand - Upload Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}