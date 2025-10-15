import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-privy-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { wallet_address } = await req.json();
    
    if (!wallet_address) {
      return new Response(
        JSON.stringify({ error: 'wallet_address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Add admin role for the wallet
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        wallet_address: wallet_address.toLowerCase(),
        role: 'admin'
      }, {
        onConflict: 'wallet_address,role'
      });

    if (error) {
      console.error('Error setting up admin:', error);
      throw error;
    }

    console.log(`✅ Admin role added for wallet: ${wallet_address}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Admin role added for wallet: ${wallet_address}`,
        data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Setup admin error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
