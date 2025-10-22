# 🔐 Security Guide

Comprehensive security guide for ROUGEE, covering authentication, data protection, smart contract security, and best practices.

## 🛡️ Security Overview

### Security Principles
- **Zero Trust**: Never trust, always verify
- **Defense in Depth**: Multiple layers of security
- **Least Privilege**: Minimum necessary permissions
- **Security by Design**: Built-in from the start

### Threat Model
- **External Attacks**: Malicious users, bots, hackers
- **Internal Threats**: Compromised accounts, insider threats
- **Smart Contract Risks**: DeFi exploits, flash loan attacks
- **Infrastructure**: DDoS, data breaches, service outages

## 🔐 Authentication Security

### Privy JWT Validation

#### Token Validation
```typescript
// supabase/functions/_shared/privy.ts
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: 'https://auth.privy.io/api/v1/jwks',
  cache: true,
  cacheMaxAge: 600000, // 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

export async function verifyPrivyJWT(request: Request): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded?.header?.kid) {
      return null;
    }

    const key = await client.getSigningKey(decoded.header.kid);
    const publicKey = key.getPublicKey();

    const verified = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://auth.privy.io',
      audience: process.env.PRIVY_APP_ID
    });

    return verified.sub; // Wallet address
  } catch (error) {
    console.error('JWT validation failed:', error);
    return null;
  }
}
```

#### Edge Function Security
```typescript
// All edge functions use this pattern
export default async function handler(req: Request) {
  // Validate JWT token
  const walletAddress = await verifyPrivyJWT(req);
  if (!walletAddress) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Process request with verified wallet address
  // ...
}
```

### Wallet Security

#### Connection Validation
```typescript
// Wallet connection security
const useWalletSecurity = () => {
  const [isValidConnection, setIsValidConnection] = useState(false);
  
  const validateConnection = useCallback(async (address: string) => {
    try {
      // Verify address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        throw new Error('Invalid address format');
      }
      
      // Check if address is on allowlist (optional)
      const isAllowed = await checkAddressAllowlist(address);
      if (!isAllowed) {
        throw new Error('Address not allowed');
      }
      
      setIsValidConnection(true);
    } catch (error) {
      console.error('Wallet validation failed:', error);
      setIsValidConnection(false);
    }
  }, []);
  
  return { isValidConnection, validateConnection };
};
```

#### Signature Verification
```typescript
// Message signature verification
const verifySignature = async (message: string, signature: string, address: string) => {
  try {
    const recoveredAddress = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`
    });
    
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
};
```

## 🗄️ Database Security

### Row-Level Security (RLS)

#### Profile Security
```sql
-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read access for discovery
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (
    auth.jwt() ->> 'wallet_address' = wallet_address
  );

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'wallet_address' = wallet_address
  );
```

#### Song Security
```sql
-- Enable RLS on songs table
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Public read access for streaming
CREATE POLICY "Public songs are viewable by everyone" ON songs
  FOR SELECT USING (true);

-- Artists can only insert their own songs
CREATE POLICY "Artists can insert own songs" ON songs
  FOR INSERT WITH CHECK (
    artist_id IN (
      SELECT id FROM profiles 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );

-- Artists can only update their own songs
CREATE POLICY "Artists can update own songs" ON songs
  FOR UPDATE USING (
    artist_id IN (
      SELECT id FROM profiles 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );
```

#### Comment Security
```sql
-- Enable RLS on comments table
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

-- Users can only insert their own comments
CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM profiles 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );

-- Users can only update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (
    user_id IN (
      SELECT id FROM profiles 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );
```

### Data Encryption

#### Sensitive Data Encryption
```typescript
// Encrypt sensitive data before storage
import crypto from 'crypto';

const encryptData = (data: string, key: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', key);
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
};

const decryptData = (encryptedData: string, key: string): string => {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipher('aes-256-gcm', key);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

#### API Key Management
```typescript
// Secure API key storage
const getApiKey = (service: string): string => {
  const key = process.env[`${service.toUpperCase()}_API_KEY`];
  if (!key) {
    throw new Error(`API key for ${service} not found`);
  }
  return key;
};

// Usage in edge functions
const lighthouseKey = getApiKey('lighthouse');
const supabaseKey = getApiKey('supabase');
```

## 🔒 Smart Contract Security

### Contract Auditing

#### Security Checklist
- [ ] **Access Control**: Proper role-based permissions
- [ ] **Reentrancy**: Protection against reentrancy attacks
- [ ] **Integer Overflow**: Safe math operations
- [ ] **External Calls**: Secure external contract interactions
- [ ] **State Variables**: Proper state management
- [ ] **Events**: Comprehensive event logging

#### Bonding Curve Security
```solidity
// Bonding curve security measures
contract SongBondingCurve {
    // Reentrancy guard
    bool private locked;
    
    modifier nonReentrant() {
        require(!locked, "ReentrancyGuard: reentrant call");
        locked = true;
        _;
        locked = false;
    }
    
    // Access control
    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not the owner");
        _;
    }
    
    // Safe math operations
    function buyTokens(uint256 xrgeAmount) external nonReentrant {
        require(xrgeAmount > 0, "Amount must be greater than 0");
        require(xrgeAmount <= maxBuyAmount, "Amount exceeds maximum");
        
        uint256 tokensToReceive = calculateTokensForXRGE(xrgeAmount);
        require(tokensToReceive > 0, "No tokens to receive");
        
        // Transfer XRGE tokens
        xrgeToken.transferFrom(msg.sender, address(this), xrgeAmount);
        
        // Mint song tokens
        songToken.mint(msg.sender, tokensToReceive);
        
        // Update state
        totalXRGERaised += xrgeAmount;
        tokensSold += tokensToReceive;
        
        emit TokensBought(msg.sender, xrgeAmount, tokensToReceive);
    }
}
```

### DeFi Security

#### Flash Loan Protection
```solidity
// Protection against flash loan attacks
contract FlashLoanProtection {
    mapping(address => uint256) private lastBlock;
    
    modifier noFlashLoan() {
        require(block.number != lastBlock[msg.sender], "Flash loan detected");
        lastBlock[msg.sender] = block.number;
        _;
    }
}
```

#### Price Manipulation Protection
```solidity
// Price manipulation protection
contract PriceProtection {
    uint256 private constant PRICE_IMPACT_LIMIT = 10; // 10%
    
    function calculatePriceImpact(uint256 amount) internal view returns (uint256) {
        uint256 currentPrice = getCurrentPrice();
        uint256 newPrice = calculateNewPrice(amount);
        
        uint256 priceImpact = ((newPrice - currentPrice) * 100) / currentPrice;
        require(priceImpact <= PRICE_IMPACT_LIMIT, "Price impact too high");
        
        return priceImpact;
    }
}
```

## 🌐 Network Security

### CORS Configuration

#### Supabase CORS
```typescript
// Supabase CORS configuration
const corsOptions = {
  origin: [
    'https://your-domain.netlify.app',
    'https://your-custom-domain.com',
    'http://localhost:8080' // Development only
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-wallet-address']
};
```

#### Netlify Headers
```toml
# netlify.toml security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://*.netlify.app; media-src 'self' https:;"
```

### Rate Limiting

#### API Rate Limiting
```typescript
// Rate limiting for edge functions
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const rateLimit = (identifier: string, limit: number, window: number): boolean => {
  const now = Date.now();
  const key = identifier;
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + window });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
};

// Usage in edge functions
export default async function handler(req: Request) {
  const walletAddress = await verifyPrivyJWT(req);
  if (!walletAddress) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  
  // Rate limit: 10 requests per minute
  if (!rateLimit(walletAddress, 10, 60000)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429 });
  }
  
  // Process request
}
```

#### IP Rate Limiting
```typescript
// IP-based rate limiting
const ipRateLimit = (ip: string, limit: number, window: number): boolean => {
  const key = `ip:${ip}`;
  return rateLimit(key, limit, window);
};

// Usage
const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
if (!ipRateLimit(clientIP, 100, 60000)) {
  return new Response(JSON.stringify({ error: 'IP rate limit exceeded' }), { status: 429 });
}
```

## 🔍 Input Validation

### Data Sanitization

#### Content Validation
```typescript
// Content validation and sanitization
const validateContent = (content: string): { isValid: boolean; sanitized: string } => {
  // Remove HTML tags
  const sanitized = content.replace(/<[^>]*>/g, '');
  
  // Check length
  if (sanitized.length > 1000) {
    return { isValid: false, sanitized: '' };
  }
  
  // Check for malicious patterns
  const maliciousPatterns = [
    /javascript:/i,
    /data:text\/html/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i
  ];
  
  const hasMaliciousContent = maliciousPatterns.some(pattern => pattern.test(sanitized));
  
  return {
    isValid: !hasMaliciousContent,
    sanitized: sanitized.trim()
  };
};
```

#### File Upload Validation
```typescript
// File upload security
const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac'];
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type' };
  }
  
  // Check file size (100MB limit)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large' };
  }
  
  // Check file name
  const allowedExtensions = ['.mp3', '.wav', '.flac'];
  const hasValidExtension = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidExtension) {
    return { isValid: false, error: 'Invalid file extension' };
  }
  
  return { isValid: true };
};
```

### SQL Injection Prevention

#### Parameterized Queries
```typescript
// Safe database queries
const getSongsByGenre = async (genre: string) => {
  // Use parameterized queries
  const { data, error } = await supabase
    .from('songs')
    .select('*')
    .eq('genre', genre) // Safe parameterized query
    .limit(10);
  
  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }
  
  return data;
};

// ❌ Never do this (SQL injection risk)
const getSongsUnsafe = async (genre: string) => {
  const query = `SELECT * FROM songs WHERE genre = '${genre}'`;
  // This is vulnerable to SQL injection
};
```

## 🚨 Security Monitoring

### Threat Detection

#### Anomaly Detection
```typescript
// Anomaly detection for suspicious activity
const detectAnomalies = (walletAddress: string, activity: any) => {
  const anomalies = [];
  
  // Check for unusual trading patterns
  if (activity.tradeCount > 100) {
    anomalies.push('High trading frequency');
  }
  
  // Check for unusual upload patterns
  if (activity.uploadCount > 10) {
    anomalies.push('High upload frequency');
  }
  
  // Check for unusual IP addresses
  if (activity.ipAddress && !isValidIP(activity.ipAddress)) {
    anomalies.push('Suspicious IP address');
  }
  
  return anomalies;
};
```

#### Security Logging
```typescript
// Security event logging
const logSecurityEvent = (event: string, details: any) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity: getSeverityLevel(event),
    source: 'rougee-play'
  };
  
  // Send to security monitoring service
  sendToSecurityService(logEntry);
  
  // Store in database for audit
  supabase.from('security_logs').insert(logEntry);
};
```

### Incident Response

#### Security Incident Response
```typescript
// Security incident response
const handleSecurityIncident = async (incident: SecurityIncident) => {
  // 1. Immediate response
  if (incident.severity === 'critical') {
    await blockSuspiciousAddress(incident.walletAddress);
    await notifySecurityTeam(incident);
  }
  
  // 2. Log incident
  await logSecurityEvent('security_incident', incident);
  
  // 3. Notify users if necessary
  if (incident.affectsUsers) {
    await notifyAffectedUsers(incident);
  }
  
  // 4. Update security measures
  await updateSecurityPolicies(incident);
};
```

## 🔧 Security Tools

### Development Security

#### Security Linting
```bash
# Install security linting tools
npm install --save-dev eslint-plugin-security
npm install --save-dev eslint-plugin-react-security

# Configure ESLint for security
# .eslintrc.js
module.exports = {
  extends: [
    'plugin:security/recommended',
    'plugin:react-security/recommended'
  ],
  rules: {
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error'
  }
};
```

#### Dependency Scanning
```bash
# Install dependency scanning
npm install --save-dev audit-ci

# Run security audit
npm audit

# Check for vulnerabilities
npx audit-ci --config audit-ci.json
```

### Production Security

#### Security Headers
```typescript
// Security headers middleware
const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};
```

#### Security Monitoring
```typescript
// Security monitoring service
const securityMonitor = {
  trackLoginAttempt: (walletAddress: string, success: boolean) => {
    // Track login attempts
  },
  
  trackSuspiciousActivity: (walletAddress: string, activity: string) => {
    // Track suspicious activity
  },
  
  trackSecurityEvent: (event: string, details: any) => {
    // Track security events
  }
};
```

## 📋 Security Checklist

### Pre-Deployment
- [ ] All environment variables secured
- [ ] Database RLS policies enabled
- [ ] Edge functions have JWT validation
- [ ] Smart contracts audited
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] Error handling secure

### Post-Deployment
- [ ] Security monitoring active
- [ ] Incident response plan ready
- [ ] Regular security audits scheduled
- [ ] User education materials available
- [ ] Security contact information public
- [ ] Bug bounty program active

### Ongoing Security
- [ ] Regular dependency updates
- [ ] Security patch management
- [ ] Threat intelligence monitoring
- [ ] User security education
- [ ] Security training for team
- [ ] Regular penetration testing

---

<div align="center">
  <strong>Secure by Design! 🔐</strong>
  
  ROUGEE implements comprehensive security measures to protect users and data.
</div>
