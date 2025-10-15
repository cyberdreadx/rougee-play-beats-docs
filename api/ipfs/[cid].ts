// IPFS Proxy API Route
// This proxies IPFS content through your domain to avoid browser blocks
import { NextRequest, NextResponse } from 'next/server';

const IPFS_GATEWAYS = [
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.io/ipfs',
  'https://gateway.pinata.cloud/ipfs',
  'https://dweb.link/ipfs',
  'https://nftstorage.link/ipfs',
];

export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  const { cid } = params;
  
  if (!cid) {
    return NextResponse.json({ error: 'CID is required' }, { status: 400 });
  }

  // Try each gateway until one works
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}/${cid}`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; IPFS-Proxy/1.0)',
        },
        // 30 second timeout
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const data = await response.arrayBuffer();
        
        return new NextResponse(data, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }
    } catch (error) {
      console.warn(`Gateway ${gateway} failed for CID ${cid}:`, error);
      continue;
    }
  }

  return NextResponse.json(
    { error: 'Failed to fetch from all IPFS gateways' },
    { status: 503 }
  );
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}




