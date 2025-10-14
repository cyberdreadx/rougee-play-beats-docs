import { createRemoteJWKSet, jwtVerify } from 'https://deno.land/x/jose@v5.2.0/index.ts';

const PRIVY_APP_ID = Deno.env.get('PRIVY_APP_ID');

if (!PRIVY_APP_ID) {
  console.error('CRITICAL: PRIVY_APP_ID environment variable is not set');
  throw new Error('PRIVY_APP_ID not configured');
}

const PRIVY_JWKS_URL = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/.well-known/jwks.json`;
console.log('Privy JWKS URL:', PRIVY_JWKS_URL);

// Cache the JWKS for performance
const jwks = createRemoteJWKSet(new URL(PRIVY_JWKS_URL));

export interface PrivyUser {
  userId: string;
  walletAddress?: string;
  email?: string;
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
    // Verify JWT signature and claims
    const { payload } = await jwtVerify(token, jwks, {
      issuer: 'privy.io',
      audience: PRIVY_APP_ID,
    });

    const userId = payload.sub;
    if (!userId) {
      throw new Error('Invalid token: missing subject');
    }

    // Extract wallet address from linked accounts
    const linkedAccounts = (payload as any).linked_accounts || [];
    const walletAccount = linkedAccounts.find((account: any) =>
      ['wallet', 'smart_wallet', 'embedded_wallet'].includes(account.type)
    );

    const walletAddress = walletAccount?.address?.toLowerCase();
    const email = linkedAccounts.find((acc: any) => acc.type === 'email')?.address;

    return {
      userId,
      walletAddress,
      email,
    };
  } catch (error) {
    console.error('JWT validation failed:', error);
    throw new Error('Invalid or expired token');
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
