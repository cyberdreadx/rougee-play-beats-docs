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

    if (!file || !walletAddress) {
      throw new Error('File and wallet address are required');
    }

    console.log('Uploading file to Lighthouse:', file.name);

    // Upload to Lighthouse
    const lighthouseFormData = new FormData();
    lighthouseFormData.append('file', file);

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

    const uploadData = await uploadResponse.json();
    console.log('Lighthouse upload successful:', uploadData);

    // Save metadata to Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const parsedMetadata = metadata ? JSON.parse(metadata) : {};
    
    const { data, error } = await supabase
      .from('songs')
      .insert({
        wallet_address: walletAddress,
        title: parsedMetadata.title || file.name,
        artist: parsedMetadata.artist,
        audio_cid: uploadData.Hash,
        cover_cid: parsedMetadata.coverCid,
        duration: parsedMetadata.duration,
        genre: parsedMetadata.genre,
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
        cid: uploadData.Hash,
        song: data 
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
