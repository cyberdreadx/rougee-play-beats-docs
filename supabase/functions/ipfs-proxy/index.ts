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

    // Forward useful headers for media playback (Range) and content negotiation
    const incomingHeaders = req.headers;
    const range = incomingHeaders.get('range') ?? undefined;
    const accept = incomingHeaders.get('accept') ?? '*/*';
    const method = req.method === 'HEAD' ? 'HEAD' : 'GET';

    // Try multiple gateways with fallback
    for (const gateway of IPFS_GATEWAYS) {
      try {
        const gatewayUrl = `${gateway}/${cid}`;
        console.log(`Trying gateway: ${gatewayUrl}`);

        const response = await fetch(gatewayUrl, {
          method,
          headers: {
            'Accept': accept,
            ...(range ? { 'Range': range } : {}),
            // Some gateways behave better with a UA
            'User-Agent': 'Mozilla/5.0 (compatible; IPFS-Proxy/1.0)'
          },
          redirect: 'follow',
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        if (response.ok || response.status === 206) {
          console.log(`Success with gateway: ${gateway} (status ${response.status})`);

          const contentType = response.headers.get('content-type') || 'application/octet-stream';
          const contentLength = response.headers.get('content-length') || undefined;
          const acceptRanges = response.headers.get('accept-ranges') || 'bytes';
          const contentRange = response.headers.get('content-range') || undefined;

          const headers = new Headers({
            ...corsHeaders,
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'X-IPFS-Gateway': gateway, // For debugging
            'Accept-Ranges': acceptRanges,
          });

          if (contentLength) headers.set('Content-Length', contentLength);
          if (contentRange) headers.set('Content-Range', contentRange);
          headers.set('Vary', 'Origin, Range');

          // Stream the upstream body (do not buffer) so Range works and playback starts fast
          return new Response(method === 'HEAD' ? null : response.body, {
            status: response.status,
            headers,
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


