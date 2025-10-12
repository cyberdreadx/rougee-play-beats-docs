import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { requireWalletAddress } from '../_shared/privy.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT and extract wallet address
    const walletAddress = await requireWalletAddress(req.headers.get('authorization'));
    
    const { action } = await req.json();

    if (!action) {
      throw new Error('Missing action');
    }

    // Get IP address from request headers
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Get user agent
    const userAgent = req.headers.get('user-agent') || null;

    console.log('Logging IP:', { walletAddress, ipAddress, action });

    // Optional: Get geolocation data (using ipapi.co - free tier)
    let geoData = { country: null, city: null };
    if (ipAddress !== 'unknown' && !ipAddress.includes('127.0.0.1') && !ipAddress.includes('localhost')) {
      try {
        const geoResponse = await fetch(`https://ipapi.co/${ipAddress}/json/`);
        if (geoResponse.ok) {
          const geo = await geoResponse.json();
          geoData = {
            country: geo.country_name || null,
            city: geo.city || null,
          };
        }
      } catch (geoError) {
        console.error('Geolocation lookup failed:', geoError);
        // Continue without geo data
      }
    }

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('wallet_ip_logs')
      .insert({
        wallet_address: walletAddress,
        ip_address: ipAddress,
        user_agent: userAgent,
        country: geoData.country,
        city: geoData.city,
        action: action,
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in log-ip:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
