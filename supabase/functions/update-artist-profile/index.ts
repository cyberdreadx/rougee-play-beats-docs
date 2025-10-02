import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LIGHTHOUSE_API_KEY = Deno.env.get('LIGHTHOUSE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LIGHTHOUSE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const formData = await req.formData();
    const walletAddress = formData.get('wallet_address') as string;
    const artistName = formData.get('artist_name') as string;
    const bio = formData.get('bio') as string || '';
    const artistTicker = formData.get('artist_ticker') as string || '';
    const socialLinks = formData.get('social_links') as string || '{}';
    const avatarFile = formData.get('avatar') as File | null;
    const coverFile = formData.get('cover') as File | null;

    if (!walletAddress || !artistName) {
      throw new Error('Wallet address and artist name are required');
    }

    console.log('Processing profile update for:', walletAddress);

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

    let avatarCid = null;
    let coverCid = null;

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

    // Create metadata JSON
    const metadata = {
      wallet_address: walletAddress,
      artist_name: artistName,
      bio,
      artist_ticker: artistTicker.toUpperCase(),
      avatar_cid: avatarCid,
      cover_cid: coverCid,
      social_links: JSON.parse(socialLinks),
      verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upload metadata JSON to IPFS
    console.log('Uploading metadata JSON...');
    const metadataCid = await uploadBufferToLighthouse(JSON.stringify(metadata), `profile-${walletAddress}.json`);

    // Update Supabase profiles table
    const profileData: any = {
      wallet_address: walletAddress,
      artist_name: artistName,
      bio,
      social_links: JSON.parse(socialLinks),
      profile_metadata_cid: metadataCid,
      updated_at: new Date().toISOString(),
      role: 'artist',
    };

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
          metadata: `https://gateway.lighthouse.storage/ipfs/${metadataCid}`,
          avatar: avatarCid ? `https://gateway.lighthouse.storage/ipfs/${avatarCid}` : null,
          cover: coverCid ? `https://gateway.lighthouse.storage/ipfs/${coverCid}` : null,
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
