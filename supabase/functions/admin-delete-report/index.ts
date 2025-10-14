import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { requireWalletAddress } from '../_shared/privy.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const deleteReportSchema = z.object({
  reportId: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const walletAddress = await requireWalletAddress(req.headers.get('authorization'));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: isAdmin } = await supabase
      .rpc('is_admin', { check_wallet: walletAddress });

    if (!isAdmin) {
      console.log(`Unauthorized report deletion attempt from ${walletAddress}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { reportId } = deleteReportSchema.parse(body);

    const { error: deleteError } = await supabase
      .from('song_reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) throw deleteError;

    console.log(`Admin ${walletAddress} deleted report ${reportId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin delete report error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
