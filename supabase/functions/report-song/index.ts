import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { requireWalletAddress } from '../_shared/privy.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-privy-token',
};

const reportSchema = z.object({
  songId: z.string().uuid(),
  reportType: z.enum(['copyright', 'hate_speech', 'other']),
  description: z.string().max(500).optional(),
  walletAddress: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { songId, reportType, description, walletAddress: providedWalletAddress } = reportSchema.parse(body);
    
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase.from('song_reports').insert({
      song_id: songId,
      wallet_address: walletAddress,
      report_type: reportType,
      description: description || null
    });

    if (error) throw error;

    console.log(`Song report submitted: ${reportType} for song ${songId} by ${walletAddress}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Report song error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
