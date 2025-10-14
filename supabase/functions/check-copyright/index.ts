import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const acrHost = Deno.env.get('ACRCLOUD_HOST');
    const accessKey = Deno.env.get('ACRCLOUD_ACCESS_KEY');
    const accessSecret = Deno.env.get('ACRCLOUD_ACCESS_SECRET');

    if (!acrHost || !accessKey || !accessSecret) {
      throw new Error('ACRCloud credentials not configured');
    }

    // Get wallet address from headers for logging (optional, won't fail if missing)
    let walletAddress = 'unknown';
    try {
      const authHeader = req.headers.get('x-wallet-address');
      if (authHeader) {
        walletAddress = authHeader.toLowerCase();
      }
    } catch (error) {
      console.log('Could not extract wallet address, continuing anyway');
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const fileName = formData.get('file_name') as string;

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'Missing audio file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Read audio file as buffer
    const audioBuffer = await audioFile.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);

    // Generate signature for ACRCloud API
    const timestamp = Math.floor(Date.now() / 1000);
    const stringToSign = `POST\n/v1/identify\n${accessKey}\naudio\n1\n${timestamp}`;
    
    const encoder = new TextEncoder();
    const keyData = encoder.encode(accessSecret);
    const messageData = encoder.encode(stringToSign);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));

    // Prepare form data for ACRCloud
    const acrFormData = new FormData();
    acrFormData.append('sample', new Blob([audioBytes]), 'sample.mp3');
    acrFormData.append('sample_bytes', audioBytes.length.toString());
    acrFormData.append('access_key', accessKey);
    acrFormData.append('data_type', 'audio');
    acrFormData.append('signature_version', '1');
    acrFormData.append('signature', signatureBase64);
    acrFormData.append('timestamp', timestamp.toString());

    // Call ACRCloud API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout
    
    let acrResponse;
    try {
      acrResponse = await fetch(`https://${acrHost}/v1/identify`, {
        method: 'POST',
        body: acrFormData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // If ACRCloud fails, block the upload for safety
      console.error('ACRCloud API timeout or error:', fetchError);
      return new Response(
        JSON.stringify({
          error: 'Copyright verification service unavailable. Please try again later.',
          canProceed: false,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const acrResult = await acrResponse.json();
    console.log('ACRCloud response:', JSON.stringify(acrResult));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let isCopyrighted = false;
    let detectedInfo = null;

    // Check if copyrighted content was detected
    if (acrResult.status?.code === 0 && acrResult.metadata?.music?.length > 0) {
      isCopyrighted = true;
      const music = acrResult.metadata.music[0];
      
      detectedInfo = {
        title: music.title || null,
        artist: music.artists?.map((a: any) => a.name).join(', ') || null,
        album: music.album?.name || null,
        label: music.label || null,
      };

      // Log violation to database
      const { error: insertError } = await supabase
        .from('copyright_violations')
        .insert({
          wallet_address: walletAddress,
          song_title: detectedInfo.title,
          artist_name: detectedInfo.artist,
          album: detectedInfo.album,
          label: detectedInfo.label,
          acr_response: acrResult,
          file_name: fileName,
        });

      if (insertError) {
        console.error('Error logging violation:', insertError);
      }
    }

    // Get violation count for this wallet
    const { count: violationCount } = await supabase
      .from('copyright_violations')
      .select('*', { count: 'exact', head: true })
      .eq('wallet_address', walletAddress);

    return new Response(
      JSON.stringify({
        isCopyrighted,
        detectedInfo,
        violationCount: violationCount || 0,
        acrResponse: acrResult,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in check-copyright function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});