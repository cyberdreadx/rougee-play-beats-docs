import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { requireWalletAddress } from '../_shared/privy.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wallet-address, x-privy-token',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔐 Validating Privy token...');
    const authHeader = req.headers.get('x-privy-token') || req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Missing authentication token');
    }

    // Parse form data early to allow wallet fallback
    const formData = await req.formData();
    const providedWalletAddress = (formData.get('walletAddress') as string | null) || req.headers.get('x-wallet-address');

    const { validatePrivyToken } = await import('../_shared/privy.ts');
    const user = await validatePrivyToken(authHeader);

    let walletAddress: string;
    if (providedWalletAddress && typeof providedWalletAddress === 'string' && providedWalletAddress.toLowerCase().startsWith('0x')) {
      walletAddress = providedWalletAddress.toLowerCase();
      console.log('✅ Using wallet from request:', walletAddress);
    } else if (user.walletAddress) {
      walletAddress = user.walletAddress;
      console.log('✅ Using wallet from JWT:', walletAddress);
    } else {
      throw new Error('No wallet address provided');
    }
    console.log('✅ Token validated, wallet:', walletAddress);
    const LIGHTHOUSE_API_KEY = Deno.env.get('LIGHTHOUSE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LIGHTHOUSE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // formData already parsed above
    
    // Define validation schema
    const ProfileSchema = z.object({
      display_name: z.string().min(1).max(100).trim(),
      artist_name: z.string().max(100).trim(),
      bio: z.string().max(500).trim(),
      email: z.string().email().max(255).or(z.literal('')),
      artist_ticker: z.string().max(10).regex(/^[A-Z0-9]*$/),
      social_links: z.string()
    });

    const rawData = {
      display_name: formData.get('display_name') as string,
      artist_name: formData.get('artist_name') as string || '',
      bio: formData.get('bio') as string || '',
      email: formData.get('email') as string || '',
      artist_ticker: formData.get('artist_ticker') as string || '',
      social_links: formData.get('social_links') as string || '{}'
    };

    // Validate
    const validation = ProfileSchema.safeParse(rawData);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { display_name: displayName, artist_name: artistName,
            bio, email, artist_ticker: artistTicker, social_links: socialLinks } = validation.data;
    const emailNotifications = formData.get('email_notifications') === 'true';
    const avatarFile = formData.get('avatar') as File | null;
    const coverFile = formData.get('cover') as File | null;

    // Validate files
    if (avatarFile && avatarFile.size > 0) {
      if (avatarFile.size > 5 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'Avatar too large (max 5MB)' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(avatarFile.type)) {
        return new Response(JSON.stringify({ error: 'Invalid avatar type' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
    }

    if (coverFile && coverFile.size > 0) {
      if (coverFile.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: 'Cover too large (max 10MB)' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(coverFile.type)) {
        return new Response(JSON.stringify({ error: 'Invalid cover type' }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
      }
    }

    console.log('Processing profile update for:', walletAddress);

    // Fetch existing profile to preserve image CIDs if not uploading new ones
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('avatar_cid, cover_cid')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    // Validate ticker if provided
    if (artistTicker) {
      const tickerRegex = /^[A-Z0-9]{3,10}$/;
      if (!tickerRegex.test(artistTicker.toUpperCase())) {
        throw new Error('Ticker must be 3-10 characters (A-Z, 0-9 only)');
      }

      // Check ticker availability
      const { data: existingTicker } = await supabase
        .from('profiles')
        .select('artist_ticker')
        .eq('artist_ticker', artistTicker.toUpperCase())
        .neq('wallet_address', walletAddress)
        .maybeSingle();

      if (existingTicker) {
        throw new Error('Ticker already taken');
      }
    }

    // Helper function to upload file to Lighthouse
    const uploadToLighthouse = async (file: File, name: string) => {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file, name);

      const uploadResponse = await fetch('https://node.lighthouse.storage/api/v0/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LIGHTHOUSE_API_KEY}`,
        },
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Lighthouse upload failed: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('Uploaded to Lighthouse:', uploadResult.Hash);
      return uploadResult.Hash;
    };

    // Helper function to upload buffer to Lighthouse
    const uploadBufferToLighthouse = async (jsonString: string, fileName: string) => {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const formData = new FormData();
      formData.append('file', blob, fileName);

      const uploadResponse = await fetch('https://node.lighthouse.storage/api/v0/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LIGHTHOUSE_API_KEY}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(`Lighthouse buffer upload failed: ${errorText}`);
      }

      const uploadResult = await uploadResponse.json();
      console.log('Uploaded JSON to Lighthouse:', uploadResult.Hash);
      return uploadResult.Hash;
    };

    // Start with existing CIDs or null
    let avatarCid = existingProfile?.avatar_cid || null;
    let coverCid = existingProfile?.cover_cid || null;

    // Upload avatar if provided
    if (avatarFile) {
      console.log('Uploading avatar...');
      avatarCid = await uploadToLighthouse(avatarFile, `avatar-${walletAddress}.${avatarFile.name.split('.').pop()}`);
    }

    // Upload cover if provided
    if (coverFile) {
      console.log('Uploading cover photo...');
      coverCid = await uploadToLighthouse(coverFile, `cover-${walletAddress}.${coverFile.name.split('.').pop()}`);
    }

    // Create metadata JSON (no verification status - that's managed in Supabase only)
    const metadata = {
      wallet_address: walletAddress,
      display_name: displayName,
      artist_name: artistName || undefined,
      bio,
      artist_ticker: artistTicker ? artistTicker.toUpperCase() : undefined,
      avatar_cid: avatarCid,
      cover_cid: coverCid,
      social_links: JSON.parse(socialLinks),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upload metadata JSON to IPFS
    console.log('Uploading metadata JSON...');
    const metadataCid = await uploadBufferToLighthouse(JSON.stringify(metadata), `profile-${walletAddress}.json`);

    // Update Supabase profiles table
    const profileData: any = {
      wallet_address: walletAddress,
      display_name: displayName,
      bio,
      email: email || null,
      email_notifications: emailNotifications,
      social_links: JSON.parse(socialLinks),
      profile_metadata_cid: metadataCid,
      updated_at: new Date().toISOString(),
    };

    if (artistName) profileData.artist_name = artistName;
    if (avatarCid) profileData.avatar_cid = avatarCid;
    if (coverCid) profileData.cover_cid = coverCid;
    if (artistTicker) {
      profileData.artist_ticker = artistTicker.toUpperCase();
      profileData.ticker_created_at = new Date().toISOString();
    }

    const { data: profile, error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'wallet_address' })
      .select()
      .single();

    if (upsertError) {
      console.error('Supabase upsert error:', upsertError);
      throw new Error(`Failed to update profile: ${upsertError.message}`);
    }

    console.log('Profile updated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        profile,
        cids: {
          metadata: metadataCid,
          avatar: avatarCid,
          cover: coverCid,
        },
        gatewayUrls: {
          metadata: `https://ipfs.io/ipfs/${metadataCid}`,
          avatar: avatarCid ? `https://ipfs.io/ipfs/${avatarCid}` : null,
          cover: coverCid ? `https://ipfs.io/ipfs/${coverCid}` : null,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
