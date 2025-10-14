import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
};

const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.io/ipfs',
  'https://gateway.pinata.cloud/ipfs',
  'https://dweb.link/ipfs',
  'https://nftstorage.link/ipfs',
  'https://ipfs.fleek.co/ipfs',
  'https://gateway.ipfs.io/ipfs',
  'https://ipfs.infura.io/ipfs',
  'https://gateway.lighthouse.storage/ipfs',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    
    // Extract CID from path: /ipfs-proxy/{cid}
    const cid = pathParts[pathParts.length - 1];
    
    if (!cid || cid === 'ipfs-proxy') {
      return new Response('CID is required', { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
      });
    }

    console.log(`Proxying request for CID: ${cid}`);

    // Try multiple gateways with fallback
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const gatewayUrl = `${gateway}/${cid}`;
        console.log(`Trying gateway: ${gatewayUrl}`);
        
        const response = await fetch(gatewayUrl, {
          method: req.method,
          headers: {
            'Accept': '*/*',
            'User-Agent': 'Mozilla/5.0 (compatible; IPFS-Proxy/1.0)',
          },
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok) {
          console.log(`Success with gateway: ${gateway}`);
          
          // Get the content type and body
          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          const body = await response.arrayBuffer();
          
          return new Response(body, {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
              'X-IPFS-Gateway': gateway, // For debugging
            },
          });
        }
        
        console.log(`Gateway ${gateway} failed with status: ${response.status}`);
      } catch (error) {
        console.log(`Gateway ${gateway} failed:`, error);
      }
    }

    return new Response('All IPFS gateways failed', { 
      status: 503, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });

  } catch (error) {
    console.error('IPFS Proxy error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });
  }
});


