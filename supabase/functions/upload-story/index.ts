import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LIGHTHOUSE_API_KEY = Deno.env.get('LIGHTHOUSE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LIGHTHOUSE_API_KEY) {
      throw new Error('LIGHTHOUSE_API_KEY not configured');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase credentials not configured');
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const walletAddress = formData.get('walletAddress') as string;
    const caption = formData.get('caption') as string | null;
    const mediaType = formData.get('mediaType') as string;

    if (!file || !walletAddress || !mediaType) {
      throw new Error('Missing required fields: file, walletAddress, or mediaType');
    }

    // File size limit: 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit');
    }

    // Upload to Lighthouse
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const uploadResponse = await fetch('https://node.lighthouse.storage/api/v0/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIGHTHOUSE_API_KEY}`,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Lighthouse upload failed: ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    const mediaCid = uploadData.Hash;

    console.log('Media uploaded to Lighthouse:', mediaCid);

    // Save story to database
    const { data: story, error: dbError } = await supabaseAdmin
      .from('stories')
      .insert({
        wallet_address: walletAddress,
        media_cid: mediaCid,
        media_type: mediaType,
        caption: caption || null,
        file_size: file.size,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Failed to save story: ${dbError.message}`);
    }

    console.log('Story saved to database:', story.id);

    return new Response(
      JSON.stringify({
        success: true,
        story,
        mediaUrl: `https://gateway.lighthouse.storage/ipfs/${mediaCid}`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in upload-story function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});