import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wallet-address',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lighthouseApiKey = Deno.env.get('LIGHTHOUSE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const formData = await req.formData();
    const walletAddress = formData.get('wallet_address') as string;
    const contentText = formData.get('content_text') as string;
    const mediaFile = formData.get('media') as File | null;

    console.log('Creating feed post for wallet:', walletAddress);

    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }

    let mediaCid: string | null = null;
    let mediaType: string | null = null;

    // Upload media to Lighthouse if provided
    if (mediaFile) {
      console.log('Uploading media to Lighthouse:', mediaFile.name);
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', mediaFile);

      const uploadResponse = await fetch(
        'https://node.lighthouse.storage/api/v0/add',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lighthouseApiKey}`,
          },
          body: uploadFormData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Lighthouse upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      mediaCid = uploadData.Hash;
      mediaType = mediaFile.type.startsWith('image/') ? 'image' : 
                  mediaFile.type.startsWith('video/') ? 'video' : 'other';
      
      console.log('Media uploaded to IPFS:', mediaCid);
    }

    // Insert post into database
    const { data: post, error: insertError } = await supabase
      .from('feed_posts')
      .insert({
        wallet_address: walletAddress,
        content_text: contentText || null,
        media_cid: mediaCid,
        media_type: mediaType,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Feed post created:', post.id);

    return new Response(
      JSON.stringify({
        success: true,
        post,
        mediaUrl: mediaCid ? `https://gateway.lighthouse.storage/ipfs/${mediaCid}` : null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error creating feed post:', error);
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
