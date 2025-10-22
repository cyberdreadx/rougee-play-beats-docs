# � API Reference

Complete API reference for ROUGEE development, including Supabase functions, hooks, and external integrations.

## 📚 Table of Contents

- [Supabase Edge Functions](#supabase-edge-functions)
- [React Hooks](#react-hooks)
- [Web3 Integration](#web3-integration)
- [External APIs](#external-apis)
- [Database Schema](#database-schema)
- [Authentication](#authentication)

## 🔧 Supabase Edge Functions

### Authentication Functions

#### `upload-story`
Upload a 24-hour ephemeral story.

```typescript
// Request
POST /functions/v1/upload-story
Headers: {
  "Authorization": "Bearer <privy_jwt_token>",
  "Content-Type": "application/json"
}
Body: {
  content: string;
  media_url?: string;
  expires_at: string; // ISO timestamp
}

// Response
{
  success: boolean;
  story_id?: string;
  error?: string;
}
```

#### `update-artist-profile`
Update artist profile information.

```typescript
// Request
POST /functions/v1/update-artist-profile
Headers: {
  "Authorization": "Bearer <privy_jwt_token>",
  "Content-Type": "application/json"
}
Body: {
  artist_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  social_links?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };
}

// Response
{
  success: boolean;
  profile?: Profile;
  error?: string;
}
```

### Music Upload Functions

#### `upload-to-lighthouse`
Upload music files to IPFS via Lighthouse.

```typescript
// Request
POST /functions/v1/upload-to-lighthouse
Headers: {
  "Authorization": "Bearer <privy_jwt_token>",
  "Content-Type": "application/json"
}
Body: {
  file_data: string; // Base64 encoded file
  file_name: string;
  file_type: string;
  metadata: {
    title: string;
    description: string;
    genre: string;
    tags?: string[];
  };
}

// Response
{
  success: boolean;
  ipfs_hash?: string;
  lighthouse_url?: string;
  error?: string;
}
```

#### `create-feed-post`
Create a social media post.

```typescript
// Request
POST /functions/v1/create-feed-post
Headers: {
  "Authorization": "Bearer <privy_jwt_token>",
  "Content-Type": "application/json"
}
Body: {
  content: string;
  media_url?: string;
  song_id?: string;
  post_type: "text" | "image" | "video" | "song";
}

// Response
{
  success: boolean;
  post_id?: string;
  error?: string;
}
```

### Utility Functions

#### `check-copyright`
Check for copyright issues in uploaded content.

```typescript
// Request
POST /functions/v1/check-copyright
Headers: {
  "Authorization": "Bearer <privy_jwt_token>",
  "Content-Type": "application/json"
}
Body: {
  content_hash: string;
  content_type: "audio" | "image" | "video";
}

// Response
{
  success: boolean;
  is_original: boolean;
  confidence_score: number;
  error?: string;
}
```

#### `log-ip`
Log user IP address for analytics.

```typescript
// Request
POST /functions/v1/log-ip
Headers: {
  "Authorization": "Bearer <privy_jwt_token>",
  "Content-Type": "application/json"
}
Body: {
  action: string;
  metadata?: Record<string, any>;
}

// Response
{
  success: boolean;
  error?: string;
}
```

## 🎣 React Hooks

### Authentication Hooks

#### `usePrivyToken`
Get Privy JWT token for authenticated requests.

```typescript
import { usePrivyToken } from '@/hooks/usePrivyToken';

const { token, isLoading, error } = usePrivyToken();

// Usage
const response = await fetch('/functions/v1/upload-story', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

#### `useCurrentUserProfile`
Get current user's profile data.

```typescript
import { useCurrentUserProfile } from '@/hooks/useCurrentUserProfile';

const { 
  profile, 
  isLoading, 
  error, 
  updateProfile,
  isArtist 
} = useCurrentUserProfile();

// Usage
const handleUpdateProfile = async (data) => {
  await updateProfile({
    artist_name: "New Artist Name",
    bio: "Updated bio"
  });
};
```

### Music Hooks

#### `useAudioPlayer`
Manage audio playback state.

```typescript
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

const {
  currentSong,
  isPlaying,
  playSong,
  pauseSong,
  playNext,
  playPrevious,
  togglePlayPause
} = useAudioPlayer();

// Usage
const handlePlaySong = (song) => {
  playSong(song);
};
```

#### `useRadioPlayer`
Manage radio mode playback.

```typescript
import { useRadioPlayer } from '@/hooks/useRadioPlayer';

const {
  isRadioMode,
  currentSong,
  isPlaying,
  startRadio,
  stopRadio,
  togglePlayPause
} = useRadioPlayer();

// Usage
const handleToggleRadio = () => {
  if (isRadioMode) {
    stopRadio();
  } else {
    startRadio();
  }
};
```

### Trading Hooks

#### `useSongBondingCurve`
Get song trading data and prices.

```typescript
import { useSongBondingCurve } from '@/hooks/useSongBondingCurve';

const {
  currentPrice,
  totalSupply,
  tokensSold,
  xrgeRaised,
  isLoading,
  error
} = useSongBondingCurve(songId);

// Usage
const handleBuyTokens = async (amount) => {
  const price = currentPrice * amount;
  // Execute buy transaction
};
```

#### `useTokenPrices`
Get current token prices.

```typescript
import { useTokenPrices } from '@/hooks/useTokenPrices';

const {
  xrge,
  usdc,
  eth,
  isLoading,
  error
} = useTokenPrices();

// Usage
const xrgeUsdPrice = xrge?.usd || 0;
```

### Social Hooks

#### `usePlaylists`
Manage user playlists.

```typescript
import { usePlaylists } from '@/hooks/usePlaylists';

const {
  playlists,
  isLoading,
  error,
  createPlaylist,
  addToPlaylist,
  removeFromPlaylist
} = usePlaylists();

// Usage
const handleCreatePlaylist = async (name) => {
  await createPlaylist({
    name: "My New Playlist",
    description: "A collection of my favorite songs"
  });
};
```

## 🌐 Web3 Integration

### Wallet Connection

#### `useWallet`
Manage wallet connection state.

```typescript
import { useWallet } from '@/hooks/useWallet';

const {
  address,
  isConnected,
  connect,
  disconnect,
  switchChain
} = useWallet();

// Usage
const handleConnect = async () => {
  await connect();
};
```

#### `usePrivyWagmi`
Privy + wagmi integration.

```typescript
import { usePrivyWagmi } from '@/hooks/usePrivyWagmi';

const {
  walletClient,
  publicClient,
  chain,
  chains
} = usePrivyWagmi();

// Usage
const handleTransaction = async () => {
  const hash = await walletClient.writeContract({
    address: contractAddress,
    abi: contractABI,
    functionName: 'buyTokens',
    args: [amount]
  });
};
```

### Smart Contract Interactions

#### `useXRGESwap`
Swap tokens using the platform's swap feature.

```typescript
import { useXRGESwap } from '@/hooks/useXRGESwap';

const {
  swapTokens,
  getQuote,
  isLoading,
  error
} = useXRGESwap();

// Usage
const handleSwap = async (fromToken, toToken, amount) => {
  const quote = await getQuote(fromToken, toToken, amount);
  await swapTokens(fromToken, toToken, amount);
};
```

#### `useXRGETier`
Check XRGE token tier status.

```typescript
import { useXRGETier } from '@/hooks/useXRGETier';

const {
  tier,
  xrgeBalance,
  isPremium,
  isLoading,
  error
} = useXRGETier(address);

// Usage
const isWhale = tier === 'diamond' || tier === 'platinum';
```

## 🔗 External APIs

### DEX Screener API
Get real-time token prices.

```typescript
// Base URL
const DEX_SCREENER_API = 'https://api.dexscreener.com/latest';

// Get XRGE price
const getXRGEPrice = async () => {
  const response = await fetch(
    `${DEX_SCREENER_API}/dex/tokens/0x147120faEC9277ec02d957584CFCD92B56A24317`
  );
  const data = await response.json();
  return data.pairs[0].priceUsd;
};
```

### IPFS Integration
Interact with IPFS for file storage.

```typescript
import { uploadToIPFS, getIPFSURL } from '@/lib/ipfs';

// Upload file to IPFS
const uploadFile = async (file) => {
  const hash = await uploadToIPFS(file);
  return hash;
};

// Get IPFS URL
const getFileURL = (hash) => {
  return getIPFSURL(hash);
};
```

## 🗄️ Database Schema

### Core Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  artist_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  social_links JSONB,
  total_songs INTEGER DEFAULT 0,
  total_plays BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `songs`
```sql
CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  genre TEXT,
  ipfs_hash TEXT NOT NULL,
  token_address TEXT,
  bonding_curve_address TEXT,
  total_supply BIGINT DEFAULT 1000000,
  tokens_sold BIGINT DEFAULT 0,
  xrge_raised NUMERIC DEFAULT 0,
  play_count BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `stories`
```sql
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES profiles(id),
  content TEXT,
  media_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `comments`
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID REFERENCES songs(id),
  user_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row-Level Security (RLS)

#### Profiles RLS
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = wallet_address);
```

#### Songs RLS
```sql
-- Enable RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public songs are viewable by everyone" ON songs
  FOR SELECT USING (true);

-- Artists can insert their own songs
CREATE POLICY "Artists can insert own songs" ON songs
  FOR INSERT WITH CHECK (
    artist_id IN (
      SELECT id FROM profiles 
      WHERE wallet_address = auth.jwt() ->> 'wallet_address'
    )
  );
```

## 🔐 Authentication

### Privy JWT Validation
All edge functions validate Privy JWT tokens:

```typescript
// Edge function authentication
import { createClient } from '@supabase/supabase-js';
import { verifyPrivyJWT } from '../_shared/privy';

export default async function handler(req: Request) {
  // Validate JWT token
  const walletAddress = await verifyPrivyJWT(req);
  if (!walletAddress) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401
    });
  }
  
  // Process request with wallet address
  // ...
}
```

### Frontend Authentication
```typescript
// Get JWT token for requests
import { usePrivyToken } from '@/hooks/usePrivyToken';

const MyComponent = () => {
  const { token } = usePrivyToken();
  
  const makeAuthenticatedRequest = async (data) => {
    const response = await fetch('/functions/v1/endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    return response.json();
  };
};
```

## 📊 Real-time Subscriptions

### Song Updates
```typescript
import { supabase } from '@/integrations/supabase/client';

// Subscribe to song updates
const subscribeToSong = (songId) => {
  return supabase
    .channel(`song-${songId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'songs',
      filter: `id=eq.${songId}`
    }, (payload) => {
      console.log('Song updated:', payload.new);
    })
    .subscribe();
};
```

### Profile Updates
```typescript
// Subscribe to profile updates
const subscribeToProfile = (profileId) => {
  return supabase
    .channel(`profile-${profileId}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'profiles',
      filter: `id=eq.${profileId}`
    }, (payload) => {
      console.log('Profile updated:', payload.new);
    })
    .subscribe();
};
```

## 🧪 Testing

### Unit Tests
```typescript
import { renderHook } from '@testing-library/react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

describe('useAudioPlayer', () => {
  it('should initialize with no current song', () => {
    const { result } = renderHook(() => useAudioPlayer());
    expect(result.current.currentSong).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });
});
```

### Integration Tests
```typescript
import { render, screen } from '@testing-library/react';
import { SongCard } from '@/components/SongCard';

describe('SongCard', () => {
  it('should display song information', () => {
    const mockSong = {
      id: '1',
      title: 'Test Song',
      artist: 'Test Artist'
    };
    
    render(<SongCard song={mockSong} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
  });
});
```

---

<div align="center">
  <strong>Build Amazing Music Apps! 🎵</strong>
  
  Use our comprehensive API to create the next generation of music platforms.
</div>
