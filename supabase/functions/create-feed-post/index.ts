import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireWalletAddress } from '../_shared/privy.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    
    console.log('Validating Privy token...');
    console.log('Authorization header present:', !!req.headers.get('authorization'));
    
    // Validate JWT and extract wallet address
    const walletAddress = await requireWalletAddress(req.headers.get('authorization'));
    console.log('Wallet address validated:', walletAddress);
    
    const formData = await req.formData();
    const contentText = formData.get('content_text') as string;
    const mediaFile = formData.get('media') as File | null;

    // Validate input
    const PostSchema = z.object({
      content_text: z.string().max(5000).optional()
    });

    const validation = PostSchema.safeParse({ content_text: contentText || '' });
    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: validation.error.issues }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
    }

    // Validate media
    if (mediaFile && mediaFile.size > 0) {
      if (mediaFile.size > 20 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'Media too large (max 20MB)' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(mediaFile.type)) {
        return new Response(JSON.stringify({ error: 'Invalid media type' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
    }

    console.log('Creating feed post for wallet:', walletAddress);

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
