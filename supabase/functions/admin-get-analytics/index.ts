import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { requireWalletAddress } from '../_shared/privy.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      console.log(`Unauthorized analytics access attempt from ${walletAddress}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch analytics data in parallel
    const [
      totalUsersResult,
      totalSongsResult,
      totalPlaysResult,
      pendingVerificationsResult,
      recentReportsResult,
    ] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('songs').select('id', { count: 'exact', head: true }),
      supabase.from('songs').select('play_count'),
      supabase.from('verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('song_reports').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Calculate total plays
    const totalPlays = totalPlaysResult.data?.reduce((sum, song) => sum + (song.play_count || 0), 0) || 0;

    const analytics = {
      totalUsers: totalUsersResult.count || 0,
      totalSongs: totalSongsResult.count || 0,
      totalPlays,
      pendingVerifications: pendingVerificationsResult.count || 0,
      recentReports: recentReportsResult.count || 0,
    };

    console.log(`Admin ${walletAddress} fetched analytics`);

    return new Response(
      JSON.stringify({ data: analytics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin analytics error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
