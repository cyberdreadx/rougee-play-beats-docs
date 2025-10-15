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
    // Parse request body first
    const body = await req.json().catch(() => ({}));
    const message = typeof body?.message === 'string' ? body.message : null;
    
    // Validate Privy JWT and extract the caller's wallet
    console.log('🔍 Request headers:', Object.fromEntries(req.headers.entries()));
    const authHeader = req.headers.get('authorization');
    console.log('🔑 Auth header present:', !!authHeader);
    
    let walletAddress: string;
    try {
      walletAddress = await requireWalletAddress(authHeader);
      console.log('✅ Extracted wallet address from JWT:', walletAddress);
    } catch (jwtError) {
      console.warn('⚠️ JWT wallet extraction failed, trying fallback:', jwtError);
      
      // Fallback: try to get wallet from request body or headers
      const fallbackWallet = body.wallet_address || req.headers.get('x-wallet-address');
      
      if (!fallbackWallet) {
        throw new Error('No wallet address found in JWT or request body');
      }
      
      walletAddress = fallbackWallet.toLowerCase();
      console.log('✅ Using fallback wallet address:', walletAddress);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase
      .from('verification_requests')
      .insert({
        wallet_address: walletAddress,
        message,
        status: 'pending',
        requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error inserting verification request:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('request-verification error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});