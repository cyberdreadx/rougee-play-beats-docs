import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lighthouseApiKey = Deno.env.get('LIGHTHOUSE_API_KEY');
    if (!lighthouseApiKey) {
      throw new Error('LIGHTHOUSE_API_KEY not configured');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string;
    const metadata = formData.get('metadata') as string;
    const coverFile = formData.get('coverFile') as File;

    console.log('Form data received:', {
      file: file?.name,
      walletAddress,
      coverFile: coverFile?.name || 'No cover file',
      metadataKeys: metadata ? Object.keys(JSON.parse(metadata)) : 'No metadata'
    });

    if (!file || !walletAddress) {
      throw new Error('File and wallet address are required');
    }

    console.log('Uploading file to Lighthouse:', file.name, '- Processing...');
    const parsedMetadata = metadata ? JSON.parse(metadata) : {};

    // Helper function to upload to Lighthouse
    const uploadToLighthouse = async (fileToUpload: File, fileName?: string) => {
      const lighthouseFormData = new FormData();
      lighthouseFormData.append('file', fileToUpload, fileName);

      const uploadResponse = await fetch('https://upload.lighthouse.storage/api/v0/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lighthouseApiKey}`,
        },
        body: lighthouseFormData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Lighthouse upload error:', errorText);
        throw new Error(`Lighthouse upload failed: ${errorText}`);
      }

      return await uploadResponse.json();
    };

    let coverCid = null;
    let audioCid = null;
    let metadataCid = null;

    // 1. Upload cover art if provided
    if (coverFile && coverFile.size > 0) {
      console.log('Uploading cover art to Lighthouse:', coverFile.name, 'Size:', coverFile.size);
      try {
        const coverData = await uploadToLighthouse(coverFile);
        coverCid = coverData.Hash;
        console.log('Cover art uploaded successfully:', coverCid);
      } catch (error) {
        console.error('Cover art upload failed:', error);
        // Continue without cover art
      }
    } else {
      console.log('No cover file provided or file is empty');
    }

    // 2. Upload main audio file
    console.log('Uploading audio file to Lighthouse');
    const audioData = await uploadToLighthouse(file);
    audioCid = audioData.Hash;
    console.log('Audio file uploaded:', audioCid);

    // 3. Create and upload metadata JSON
    const metadataJson = {
      title: parsedMetadata.title || file.name,
      artist: parsedMetadata.artist || 'Unknown Artist',
      genre: parsedMetadata.genre || 'Unknown',
      description: parsedMetadata.description || null,
      ticker: parsedMetadata.ticker || null,
      duration: parsedMetadata.duration,
      audioCid: audioCid,
      coverCid: coverCid,
      walletAddress: walletAddress,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      fileType: file.type
    };

    console.log('Creating metadata JSON and uploading to Lighthouse');
    const metadataBlob = new Blob([JSON.stringify(metadataJson, null, 2)], { 
      type: 'application/json' 
    });
    const metadataFile = new File([metadataBlob], `${audioCid}_metadata.json`, { 
      type: 'application/json' 
    });
    
    const metadataUploadData = await uploadToLighthouse(metadataFile);
    metadataCid = metadataUploadData.Hash;
    console.log('Metadata JSON uploaded:', metadataCid);

    // 4. Save minimal data to Supabase for fast querying
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase
      .from('songs')
      .insert({
        wallet_address: walletAddress,
        title: metadataJson.title,
        artist: metadataJson.artist,
        audio_cid: audioCid,
        cover_cid: coverCid,
        duration: parsedMetadata.duration,
        genre: metadataJson.genre,
        description: metadataJson.description,
        ticker: metadataJson.ticker,
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('Song metadata saved to database:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioCid: audioCid,
        coverCid: coverCid,
        metadataCid: metadataCid,
        song: data,
        lighthouse: {
          audio: `https://gateway.lighthouse.storage/ipfs/${audioCid}`,
          cover: coverCid ? `https://gateway.lighthouse.storage/ipfs/${coverCid}` : null,
          metadata: `https://gateway.lighthouse.storage/ipfs/${metadataCid}`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in upload-to-lighthouse function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
