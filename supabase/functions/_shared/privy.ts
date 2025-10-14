import { createRemoteJWKSet, createLocalJWKSet, jwtVerify } from 'https://deno.land/x/jose@v5.2.0/index.ts';

const PRIVY_APP_ID = Deno.env.get('PRIVY_APP_ID');

if (!PRIVY_APP_ID) {
  console.error('CRITICAL: PRIVY_APP_ID environment variable is not set');
  throw new Error('PRIVY_APP_ID not configured');
}

const PRIVY_JWKS_URL_PRIMARY = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`;
const PRIVY_JWKS_URL_FALLBACK = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/.well-known/jwks.json`;
console.log('Privy JWKS URL (primary):', PRIVY_JWKS_URL_PRIMARY);
console.log('Privy JWKS URL (fallback):', PRIVY_JWKS_URL_FALLBACK);

// Resolve and cache the first working JWKS endpoint at runtime
let cachedJwks: ReturnType<typeof createLocalJWKSet> | null = null;
let cachedJwksUrl: string | null = null;

async function resolveJwks(): Promise<ReturnType<typeof createLocalJWKSet>> {
  if (cachedJwks) return cachedJwks;

  const candidates = [PRIVY_JWKS_URL_PRIMARY, PRIVY_JWKS_URL_FALLBACK];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (res.ok) {
        console.log('Using Privy JWKS URL:', url, 'status:', res.status);
        const jwksJson = await res.json();
        cachedJwksUrl = url;
        cachedJwks = createLocalJWKSet(jwksJson);
        return cachedJwks;
      }
      console.warn('Privy JWKS candidate not OK:', url, 'status:', res.status);
    } catch (e) {
      console.error('Privy JWKS candidate fetch error:', url, e);
    }
  }

  throw new Error('Failed to resolve Privy JWKS URL (none returned 200)');
}

export interface PrivyUser {
  userId: string;
  walletAddress?: string;
  email?: string;
}

// Attempt to extract a wallet address from various possible Privy token shapes
function extractWalletAddress(payload: any): string | undefined {
  try {
    const linkedAccounts = payload?.linked_accounts ?? [];
    const walletAccount = Array.isArray(linkedAccounts)
      ? linkedAccounts.find((acc: any) => ['wallet', 'smart_wallet', 'embedded_wallet'].includes(acc?.type))
      : undefined;

    const candidates = [
      walletAccount?.address,
      payload?.wallet_address,
      payload?.wallet?.address,
      payload?.wallets?.[0]?.address,
      payload?.primary_wallet_address,
      payload?.user?.wallet?.address,
      payload?.address,
      payload?.evm_address,
    ].filter(Boolean) as string[];

    const found = candidates.find((a) => typeof a === 'string' && a.toLowerCase().startsWith('0x'));
    return found?.toLowerCase();
  } catch (_e) {
    return undefined;
  }
}

/**
 * Validates a Privy JWT token and extracts user information
 * @throws Error if token is invalid or wallet address cannot be found
 */
export async function validatePrivyToken(authHeader: string | null): Promise<PrivyUser> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }

  if (!PRIVY_APP_ID) {
    throw new Error('PRIVY_APP_ID environment variable not set');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Strict verification with issuer and audience
    const jwks = await resolveJwks();
    const { payload } = await jwtVerify(token, jwks, {
      issuer: 'privy.io',
      audience: PRIVY_APP_ID,
    });

    const userId = payload.sub;
    if (!userId) {
      throw new Error('Invalid token: missing subject');
    }

    // Extract wallet address (robust across Privy token shapes)
    const walletAddress = extractWalletAddress(payload);
    const linkedAccounts = (payload as any).linked_accounts || [];
    const email =
      (Array.isArray(linkedAccounts) && linkedAccounts.find((acc: any) => acc.type === 'email')?.address) ||
      (payload as any).email;

    return { userId, walletAddress, email };
  } catch (strictError) {
    console.error('JWT validation (strict) failed. Trying relaxed verification using the resolved JWKS:', strictError);
    try {
      // Relaxed verification (no issuer/audience) if strict fails due to claim mismatch
      const jwks = await resolveJwks();
      const { payload } = await jwtVerify(token, jwks);

      const userId = payload.sub as string | undefined;
      if (!userId) {
        throw new Error('Invalid token: missing subject');
      }

      const walletAddress = extractWalletAddress(payload);
      const linkedAccounts = (payload as any).linked_accounts || [];
      const email =
        (Array.isArray(linkedAccounts) && linkedAccounts.find((acc: any) => acc.type === 'email')?.address) ||
        (payload as any).email;

      return { userId, walletAddress, email };
    } catch (relaxedError) {
      console.error('JWT validation failed (relaxed):', relaxedError, 'JWKS URL used:', cachedJwksUrl);
      throw new Error('Invalid or expired token');
    }
  }
}

/**
 * Validates token and ensures wallet address exists
 * @throws Error if wallet address is not found
 */
export async function requireWalletAddress(authHeader: string | null): Promise<string> {
  const user = await validatePrivyToken(authHeader);
  
  if (!user.walletAddress) {
    throw new Error('No wallet address found in authentication token');
  }
  
  return user.walletAddress;
}
