import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireWalletAddress } from '../_shared/privy.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  songId: z.string().uuid(),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }

    // Authenticate user via Privy Bearer token and get wallet
    const authHeader = req.headers.get('authorization') ?? null;
    const walletAddress = await requireWalletAddress(authHeader);
    const walletLower = walletAddress.toLowerCase();

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { songId, tokenAddress } = BodySchema.parse(body);

    // Verify ownership: the song must belong to the caller's wallet
    const { data: song, error: fetchError } = await supabase
      .from('songs')
      .select('id, wallet_address')
      .eq('id', songId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!song) {
      return new Response(
        JSON.stringify({ error: 'Song not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!song.wallet_address || song.wallet_address.toLowerCase() !== walletLower) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to update this song' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update token address
    const { data: updated, error: updateError } = await supabase
      .from('songs')
      .update({ token_address: tokenAddress })
      .eq('id', songId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, song: updated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('update-song-token error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
