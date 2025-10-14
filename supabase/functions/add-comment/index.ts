import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { requireWalletAddress } from '../_shared/privy.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-privy-token',
};

const commentSchema = z.object({
  postId: z.string().uuid(),
  commentText: z.string().min(1).max(1000),
  walletAddress: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { postId, commentText, walletAddress: providedWalletAddress } = commentSchema.parse(body);
    
    // Accept wallet address from request body (no JWT required - same as upload-story)
    let walletAddress: string | undefined = undefined;
    if (providedWalletAddress && typeof providedWalletAddress === 'string' && providedWalletAddress.toLowerCase().startsWith('0x')) {
      walletAddress = providedWalletAddress.toLowerCase();
      console.log('✅ Using wallet from request:', walletAddress);
    }

    if (!walletAddress) {
      throw new Error('No wallet address provided');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase.from('feed_comments').insert({
      post_id: postId,
      wallet_address: walletAddress,
      comment_text: commentText
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Add comment error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
