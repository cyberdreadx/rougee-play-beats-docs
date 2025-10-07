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
    
    console.log('🚀 Deploy token request:', { tokenName, tokenSymbol, totalSupply, walletAddress });

    // Validate inputs
    if (!tokenName || !tokenSymbol || !totalSupply || !walletAddress) {
      throw new Error('Missing required fields');
    }

    // Get Thirdweb secret key
    const thirdwebSecretKey = Deno.env.get('THIRDWEB_SECRET_KEY');
    if (!thirdwebSecretKey) {
      console.error('❌ THIRDWEB_SECRET_KEY not configured');
      throw new Error('Deployment service not configured. Please contact support.');
    }

    console.log('📝 Deploying ERC-20 token via Thirdweb API...');

    // Deploy token using Thirdweb's contract deployment API
    const deployResponse = await fetch('https://api.thirdweb.com/v1/deploy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${thirdwebSecretKey}`,
      },
      body: JSON.stringify({
        contractType: 'token',
        params: {
          name: tokenName,
          symbol: tokenSymbol,
          initialSupply: totalSupply,
          primarySaleRecipient: walletAddress,
        },
        chain: 'base', // Base mainnet
        version: 'latest',
      }),
    });

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      console.error('❌ Thirdweb deployment failed:', errorText);
      throw new Error(`Token deployment failed: ${errorText}`);
    }

    const deployResult = await deployResponse.json();
    const contractAddress = deployResult.contractAddress || deployResult.address;

    if (!contractAddress) {
      console.error('❌ No contract address in response:', deployResult);
      throw new Error('Contract deployment failed - no address returned');
    }

    console.log('✅ Contract deployed at:', contractAddress);

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
      console.error('❌ Database error:', error);
      throw new Error(`Failed to save token: ${error.message}`);
    }

    console.log('💾 Token saved to database');

    return new Response(
      JSON.stringify({ 
        success: true, 
        contractAddress,
        transactionHash: deployResult.transactionHash,
        explorerUrl: `https://basescan.org/address/${contractAddress}`,
        token: data,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Error in deploy-artist-token:', error);
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
