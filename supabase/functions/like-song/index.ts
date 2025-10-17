import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { requireWalletAddress } from '../_shared/privy.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-privy-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { songId, action, walletAddress: providedWalletAddress } = await req.json();
    
    // Accept wallet address from request body (no JWT required - same as upload-story)
    let walletAddress: string | undefined = undefined;
    if (providedWalletAddress && typeof providedWalletAddress === 'string' && providedWalletAddress.toLowerCase().startsWith('0x')) {
      walletAddress = providedWalletAddress.toLowerCase();
      console.log('✅ Using wallet from request:', walletAddress);
    }

    if (!walletAddress) {
      throw new Error('No wallet address provided');
    }
    
    if (!songId || !action) {
      throw new Error('Missing required fields: songId and action');
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'like') {
      // Check if already liked
      const { data: existing } = await supabase
        .from('song_likes')
        .select('id')
        .eq('wallet_address', walletAddress)
        .eq('song_id', songId)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Already liked', alreadyLiked: true }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase.from('song_likes').insert({
        wallet_address: walletAddress,
        song_id: songId
      });
      if (error) throw error;
    } else if (action === 'unlike') {
      const { error } = await supabase
        .from('song_likes')
        .delete()
        .eq('wallet_address', walletAddress)
        .eq('song_id', songId);
      if (error) throw error;
    } else {
      throw new Error('Invalid action. Must be "like" or "unlike"');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Like song error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
