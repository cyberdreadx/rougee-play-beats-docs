import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wallet-address',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tokenName, tokenSymbol, totalSupply, walletAddress } = await req.json();
    
    console.log('Deploying token:', { tokenName, tokenSymbol, totalSupply, walletAddress });

    // Validate inputs
    if (!tokenName || !tokenSymbol || !totalSupply || !walletAddress) {
      throw new Error('Missing required fields');
    }

    // Get thirdweb secret key
    const thirdwebSecretKey = Deno.env.get('THIRDWEB_SECRET_KEY');
    if (!thirdwebSecretKey) {
      throw new Error('THIRDWEB_SECRET_KEY not configured');
    }

    // Deploy token contract via thirdweb
    const deployResponse = await fetch('https://api.thirdweb.com/v1/deploy', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${thirdwebSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractType: 'token',
        chain: 'base',
        params: {
          name: tokenName,
          symbol: tokenSymbol,
          initialSupply: totalSupply,
          primarySaleRecipient: walletAddress,
        },
      }),
    });

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      console.error('Thirdweb deployment error:', deployResponse.status, errorText);
      throw new Error(`Failed to deploy token: ${errorText}`);
    }

    const deployData = await deployResponse.json();
    const contractAddress = deployData.contractAddress || deployData.address;

    console.log('Token deployed:', contractAddress);

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('artist_tokens')
      .insert({
        wallet_address: walletAddress,
        token_name: tokenName,
        token_symbol: tokenSymbol,
        total_supply: totalSupply,
        contract_address: contractAddress,
        chain_id: 8453, // Base mainnet
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to save token: ${error.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        contractAddress,
        token: data,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in deploy-artist-token:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});