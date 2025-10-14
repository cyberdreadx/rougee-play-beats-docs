import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { requireWalletAddress } from '../_shared/privy.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const deleteSongSchema = z.object({
  songId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Privy JWT and get wallet address
    const walletAddress = await requireWalletAddress(req.headers.get('authorization'));

    // Create service role client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if user is admin
    const { data: isAdmin } = await supabase
      .rpc('is_admin', { check_wallet: walletAddress });

    if (!isAdmin) {
      console.log(`Unauthorized song deletion attempt from ${walletAddress}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    const body = await req.json();
    const { songId, reason } = deleteSongSchema.parse(body);

    // Get song details before deletion for logging
    const { data: song } = await supabase
      .from('songs')
      .select('title, artist, wallet_address')
      .eq('id', songId)
      .single();

    // Delete the song
    const { error: deleteError } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId);

    if (deleteError) throw deleteError;

    console.log(`Admin ${walletAddress} deleted song ${songId} (${song?.title}) - Reason: ${reason || 'None provided'}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin song deletion error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
