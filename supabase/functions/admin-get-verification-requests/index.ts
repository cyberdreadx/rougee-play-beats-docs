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
    console.log('🔍 Admin verification requests - Starting request');
    
    // Validate Privy JWT and get wallet address
    const walletAddress = await requireWalletAddress(req.headers.get('authorization'), req);
    console.log('✅ Wallet address extracted:', walletAddress);

    // Create service role client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if user is admin using server-side validation
    console.log('🔍 Checking admin status for wallet:', walletAddress);
    const { data: isAdmin, error: adminError } = await supabase
      .rpc('is_admin', { check_wallet: walletAddress });

    if (adminError) {
      console.error('❌ Error checking admin status:', adminError);
      throw new Error(`Admin check failed: ${adminError.message}`);
    }

    console.log('🔍 Admin check result:', isAdmin);

    if (!isAdmin) {
      console.log(`❌ Unauthorized admin access attempt from ${walletAddress}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch verification requests with profile data
    console.log('🔍 Fetching verification requests...');
    
    // First, let's try without the foreign key relationship to see if that's the issue
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching verification requests:', error);
      throw new Error(`Database query failed: ${error.message}`);
    }

    console.log('✅ Successfully fetched verification requests:', requests?.length || 0);
    console.log('📋 Requests data:', JSON.stringify(requests, null, 2));

    // Now try to get profile data separately for each request
    const requestsWithProfiles = await Promise.all(
      (requests || []).map(async (request) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('artist_name, artist_ticker, avatar_cid, total_songs, total_plays, verified')
          .eq('wallet_address', request.wallet_address)
          .single();
        
        return {
          ...request,
          profiles: profile
        };
      })
    );

    console.log('✅ Requests with profiles:', requestsWithProfiles?.length || 0);

    console.log(`Admin ${walletAddress} fetched ${requestsWithProfiles?.length || 0} verification requests`);

    return new Response(
      JSON.stringify({ data: requestsWithProfiles }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin verification requests error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
