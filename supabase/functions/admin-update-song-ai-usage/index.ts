import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wallet-address',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const walletAddress = req.headers.get('x-wallet-address')?.toLowerCase();
    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Wallet address required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user is admin
    const { data: isAdminData, error: adminError } = await supabase
      .rpc('is_admin', { check_wallet: walletAddress });

    if (adminError || !isAdminData) {
      console.error('Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { songId, aiUsage } = await req.json();
    
    if (!songId || !aiUsage) {
      return new Response(
        JSON.stringify({ error: 'songId and aiUsage are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate aiUsage value
    if (!['none', 'partial', 'full'].includes(aiUsage)) {
      return new Response(
        JSON.stringify({ error: 'Invalid aiUsage value. Must be: none, partial, or full' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the song's AI usage
    const { data, error } = await supabase
      .from('songs')
      .update({ ai_usage: aiUsage })
      .eq('id', songId)
      .select()
      .single();

    if (error) {
      console.error('Error updating song AI usage:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to update song' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${walletAddress} updated song ${songId} AI usage to ${aiUsage}`);

    return new Response(
      JSON.stringify({ success: true, song: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in admin-update-song-ai-usage:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});