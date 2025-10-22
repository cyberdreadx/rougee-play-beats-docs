# 🏗️ Code Structure

Comprehensive guide to ROUGEE's codebase structure, organization, and development patterns.

## 📁 Project Structure

```
rougee-play-beats/
├── src/                          # Source code
│   ├── components/               # React components
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── AudioPlayer.tsx      # Audio player component
│   │   ├── Header.tsx           # Navigation header
│   │   ├── Layout.tsx           # Main layout wrapper
│   │   └── ...                 # Other components
│   ├── pages/                   # Route pages
│   │   ├── Index.tsx           # Home/Discover page
│   │   ├── Trending.tsx        # Trending songs
│   │   ├── Artist.tsx          # Artist profile
│   │   ├── Upload.tsx          # Music upload
│   │   └── ...                 # Other pages
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAudioPlayer.ts   # Audio playback logic
│   │   ├── useWallet.ts        # Wallet connection
│   │   ├── useSongBondingCurve.ts # Trading logic
│   │   └── ...                 # Other hooks
│   ├── contexts/                # React contexts
│   │   └── ThemeContext.tsx    # Theme management
│   ├── lib/                     # Utility functions
│   │   ├── utils.ts            # General utilities
│   │   └── ipfs.ts             # IPFS integration
│   ├── integrations/            # External integrations
│   │   └── supabase/           # Supabase client
│   ├── providers/               # Context providers
│   │   └── Web3Provider.tsx    # Web3 context
│   └── assets/                  # Static assets
├── supabase/                    # Backend configuration
│   ├── functions/              # Edge functions
│   └── migrations/             # Database migrations
├── public/                      # Public static files
├── docs/                        # Documentation
└── ...                         # Configuration files
```

## 🧩 Component Architecture

### Component Hierarchy

```
App
├── Web3Provider
├── ThemeProvider
├── TooltipProvider
├── Layout
│   ├── Header
│   │   ├── Navigation
│   │   ├── WalletButton
│   │   └── UploadSlotsBadge
│   └── Main Content
│       ├── Routes
│       │   ├── Trending
│       │   ├── Artist
│       │   ├── Upload
│       │   └── ...
│       └── AudioPlayer
└── Footer
```

### Component Patterns

#### 1. **Container Components**
```typescript
// Container components handle data fetching and state management
const TrendingContainer = () => {
  const { data: songs, isLoading } = useSongs();
  const { data: profiles } = useProfiles();
  
  return (
    <Trending 
      songs={songs}
      profiles={profiles}
      isLoading={isLoading}
    />
  );
};
```

#### 2. **Presentational Components**
```typescript
// Presentational components focus on UI rendering
interface TrendingProps {
  songs: Song[];
  profiles: Profile[];
  isLoading: boolean;
}

const Trending: React.FC<TrendingProps> = ({ songs, profiles, isLoading }) => {
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div className="trending-page">
      {songs.map(song => (
        <SongCard key={song.id} song={song} profile={profiles[song.artist_id]} />
      ))}
    </div>
  );
};
```

#### 3. **Custom Hooks**
```typescript
// Custom hooks encapsulate business logic
const useAudioPlayer = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const playSong = useCallback((song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  }, []);
  
  const pauseSong = useCallback(() => {
    setIsPlaying(false);
  }, []);
  
  return {
    currentSong,
    isPlaying,
    playSong,
    pauseSong
  };
};
```

## 🎣 Hook Architecture

### Hook Categories

#### 1. **Data Fetching Hooks**
```typescript
// useSongs.ts - Fetch songs data
export const useSongs = (page = 0, limit = 5) => {
  return useQuery({
    queryKey: ['songs', page, limit],
    queryFn: () => fetchSongs(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true
  });
};

// useProfile.ts - Fetch user profile
export const useProfile = (walletAddress: string) => {
  return useQuery({
    queryKey: ['profile', walletAddress],
    queryFn: () => fetchProfile(walletAddress),
    enabled: !!walletAddress
  });
};
```

#### 2. **Web3 Hooks**
```typescript
// useWallet.ts - Wallet connection
export const useWallet = () => {
  const { address, isConnected, connect, disconnect } = useAccount();
  const { switchChain } = useSwitchChain();
  
  return {
    address,
    isConnected,
    connect,
    disconnect,
    switchChain
  };
};

// useSongBondingCurve.ts - Trading logic
export const useSongBondingCurve = (songId: string) => {
  const { data: currentPrice } = useReadContract({
    address: bondingCurveAddress,
    abi: bondingCurveABI,
    functionName: 'getCurrentPrice'
  });
  
  return { currentPrice };
};
```

#### 3. **UI State Hooks**
```typescript
// useAudioPlayer.ts - Audio state management
export const useAudioPlayer = () => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  
  const playSong = useCallback((song: Song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  }, []);
  
  return {
    currentSong,
    isPlaying,
    volume,
    playSong,
    setVolume
  };
};
```

## 🗄️ Data Layer

### Supabase Integration

#### Client Configuration
```typescript
// integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

#### Type Definitions
```typescript
// integrations/supabase/types.ts
export interface Profile {
  id: string;
  wallet_address: string;
  artist_name?: string;
  bio?: string;
  avatar_url?: string;
  total_songs: number;
  total_plays: number;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string;
  artist_id: string;
  title: string;
  description?: string;
  genre: string;
  ipfs_hash: string;
  token_address?: string;
  bonding_curve_address?: string;
  total_supply: number;
  tokens_sold: number;
  xrge_raised: number;
  play_count: number;
  created_at: string;
}
```

### React Query Integration

#### Query Client Setup
```typescript
// providers/Web3Provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,    // 10 minutes
      cacheTime: 30 * 60 * 1000,    // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 3
    }
  }
});

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
```

## 🎨 Styling Architecture

### Tailwind CSS Configuration

#### Custom Theme
```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00FF41',
        secondary: '#00FF9F',
        accent: '#00FF41',
        background: '#000000',
        surface: '#1a1a1a',
        border: '#333333'
      },
      fontFamily: {
        mono: ['Fira Code', 'Monaco', 'Consolas', 'monospace']
      }
    }
  }
};
```

#### Component Styling
```typescript
// Component with Tailwind classes
const SongCard: React.FC<SongCardProps> = ({ song, profile }) => {
  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-primary transition-colors">
      <div className="flex items-center space-x-4">
        <img 
          src={profile.avatar_url} 
          alt={profile.artist_name}
          className="w-12 h-12 rounded-full"
        />
        <div>
          <h3 className="text-white font-semibold">{song.title}</h3>
          <p className="text-gray-400">{profile.artist_name}</p>
        </div>
      </div>
    </div>
  );
};
```

### shadcn/ui Integration

#### Component Library
```typescript
// components/ui/button.tsx
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'default', 
  size = 'md',
  ...props 
}) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        {
          'bg-primary text-black hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-black hover:bg-secondary/90': variant === 'secondary',
          'bg-surface text-white hover:bg-surface/90': variant === 'default'
        },
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg'
        },
        className
      )}
      {...props}
    />
  );
};
```

## 🔄 State Management

### Context Providers

#### Theme Context
```typescript
// contexts/ThemeContext.tsx
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  
  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

#### Web3 Context
```typescript
// providers/Web3Provider.tsx
interface Web3ContextType {
  address: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { address, isConnected, connect, disconnect } = useAccount();
  
  return (
    <Web3Context.Provider value={{ address, isConnected, connect, disconnect }}>
      {children}
    </Web3Context.Provider>
  );
};
```

### Local State Management

#### useState for Simple State
```typescript
// Simple component state
const AudioPlayer: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);
  
  return (
    <div className="audio-player">
      <button onClick={togglePlayPause}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <div className="progress-bar">
        <div 
          className="progress" 
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
      </div>
    </div>
  );
};
```

#### useReducer for Complex State
```typescript
// Complex state management
interface AudioState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  queue: Song[];
  currentIndex: number;
}

type AudioAction = 
  | { type: 'PLAY_SONG'; payload: Song }
  | { type: 'TOGGLE_PLAY_PAUSE' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'NEXT_SONG' }
  | { type: 'PREVIOUS_SONG' };

const audioReducer = (state: AudioState, action: AudioAction): AudioState => {
  switch (action.type) {
    case 'PLAY_SONG':
      return { ...state, currentSong: action.payload, isPlaying: true };
    case 'TOGGLE_PLAY_PAUSE':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'NEXT_SONG':
      const nextIndex = (state.currentIndex + 1) % state.queue.length;
      return { 
        ...state, 
        currentIndex: nextIndex, 
        currentSong: state.queue[nextIndex] 
      };
    default:
      return state;
  }
};
```

## 🧪 Testing Architecture

### Unit Testing

#### Component Testing
```typescript
// __tests__/components/SongCard.test.tsx
import { render, screen } from '@testing-library/react';
import { SongCard } from '@/components/SongCard';

const mockSong = {
  id: '1',
  title: 'Test Song',
  artist_id: 'artist-1',
  genre: 'Electronic'
};

const mockProfile = {
  id: 'artist-1',
  artist_name: 'Test Artist',
  avatar_url: 'https://example.com/avatar.jpg'
};

describe('SongCard', () => {
  it('renders song information', () => {
    render(<SongCard song={mockSong} profile={mockProfile} />);
    
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const onPlay = jest.fn();
    render(<SongCard song={mockSong} profile={mockProfile} onPlay={onPlay} />);
    
    screen.getByRole('button').click();
    expect(onPlay).toHaveBeenCalledWith(mockSong);
  });
});
```

#### Hook Testing
```typescript
// __tests__/hooks/useAudioPlayer.test.ts
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';

describe('useAudioPlayer', () => {
  it('initializes with no current song', () => {
    const { result } = renderHook(() => useAudioPlayer());
    
    expect(result.current.currentSong).toBeNull();
    expect(result.current.isPlaying).toBe(false);
  });
  
  it('plays a song when playSong is called', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const mockSong = { id: '1', title: 'Test Song' };
    
    act(() => {
      result.current.playSong(mockSong);
    });
    
    expect(result.current.currentSong).toBe(mockSong);
    expect(result.current.isPlaying).toBe(true);
  });
});
```

### Integration Testing

#### API Integration
```typescript
// __tests__/integration/api.test.ts
import { fetchSongs } from '@/lib/api';

describe('API Integration', () => {
  it('fetches songs successfully', async () => {
    const songs = await fetchSongs(0, 5);
    
    expect(songs).toHaveLength(5);
    expect(songs[0]).toHaveProperty('id');
    expect(songs[0]).toHaveProperty('title');
  });
  
  it('handles API errors gracefully', async () => {
    // Mock API error
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('API Error'));
    
    await expect(fetchSongs(0, 5)).rejects.toThrow('API Error');
  });
});
```

## 🚀 Build Configuration

### Vite Configuration

#### Build Setup
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['wagmi', 'viem'],
          ui: ['@radix-ui/react-dialog']
        }
      }
    }
  },
  server: {
    port: 8080,
    host: true
  }
});
```

#### Environment Variables
```typescript
// vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
  readonly VITE_SUPABASE_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## 📦 Package Management

### Dependencies

#### Core Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.30.1",
    "@tanstack/react-query": "^5.83.0",
    "wagmi": "^2.17.5",
    "viem": "^2.37.9",
    "@supabase/supabase-js": "^2.58.0"
  }
}
```

#### Development Dependencies
```json
{
  "devDependencies": {
    "@vitejs/plugin-react-swc": "^3.11.0",
    "typescript": "^5.8.3",
    "tailwindcss": "^3.4.17",
    "eslint": "^9.32.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}
```

## 🔧 Development Tools

### Code Quality

#### ESLint Configuration
```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  }
];
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Git Hooks

#### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

---

<div align="center">
  <strong>Clean, Scalable, Maintainable! 🏗️</strong>
  
  ROUGEE's codebase is organized for long-term success and developer productivity.
</div>
