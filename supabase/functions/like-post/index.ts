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
    const { postId, action, walletAddress: providedWalletAddress } = await req.json();
    
    // Validate JWT token (this throws if invalid/expired)
    const { validatePrivyToken } = await import('../_shared/privy.ts');
    const user = await validatePrivyToken(req.headers.get('x-privy-token') || req.headers.get('authorization'));
    
    // Use wallet from request body if provided, otherwise try to extract from JWT
    let walletAddress: string;
    if (providedWalletAddress && typeof providedWalletAddress === 'string' && providedWalletAddress.toLowerCase().startsWith('0x')) {
      walletAddress = providedWalletAddress.toLowerCase();
    } else if (user.walletAddress) {
      walletAddress = user.walletAddress;
    } else {
      throw new Error('No wallet address provided');
    }
    
    if (!postId || !action) {
      throw new Error('Missing required fields: postId and action');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'like') {
      const { error } = await supabase.from('feed_likes').insert({
        wallet_address: walletAddress,
        post_id: postId
      });
      if (error) throw error;
    } else if (action === 'unlike') {
      const { error } = await supabase
        .from('feed_likes')
        .delete()
        .eq('wallet_address', walletAddress)
        .eq('post_id', postId);
      if (error) throw error;
    } else {
      throw new Error('Invalid action. Must be "like" or "unlike"');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Like post error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
