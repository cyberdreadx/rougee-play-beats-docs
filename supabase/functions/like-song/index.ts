import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BodySchema = z.object({
  songId: z.string().uuid(),
  action: z.enum(['like', 'unlike']),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { songId, action, walletAddress } = BodySchema.parse(body);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    if (action === 'like') {
      const { error } = await supabase.from('song_likes').insert({
        wallet_address: walletAddress.toLowerCase(),
        song_id: songId
      });
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('song_likes')
        .delete()
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('song_id', songId);
      if (error) throw error;
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
