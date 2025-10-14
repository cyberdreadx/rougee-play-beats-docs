import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { requireWalletAddress } from '../_shared/privy.ts';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const verificationSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  adminNotes: z.string().max(500).optional(),
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
      console.log(`Unauthorized verification attempt from ${walletAddress}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate request body
    const body = await req.json();
    const { requestId, action, adminNotes } = verificationSchema.parse(body);

    // Get the verification request to find the artist wallet
    const { data: verificationRequest, error: fetchError } = await supabase
      .from('verification_requests')
      .select('wallet_address')
      .eq('id', requestId)
      .single();

    if (fetchError || !verificationRequest) {
      throw new Error('Verification request not found');
    }

    // Update verification request status
    const { error: updateError } = await supabase
      .from('verification_requests')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_by: walletAddress,
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    // If approved, update the profile verified status
    if (action === 'approve') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ verified: true })
        .eq('wallet_address', verificationRequest.wallet_address);

      if (profileError) {
        console.error('Error updating profile verified status:', profileError);
        throw profileError;
      }
    }

    console.log(`Admin ${walletAddress} ${action}d verification request ${requestId}`);

    return new Response(
      JSON.stringify({ success: true, action }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin verification processing error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
