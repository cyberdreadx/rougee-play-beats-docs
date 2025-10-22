# ⚡ Performance Optimization Guide

Comprehensive guide to optimizing ROUGEE.PLAY for maximum performance, covering caching strategies, bundle optimization, and real-time performance monitoring.

## 🎯 Performance Goals

### Target Metrics
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 2.0s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Real-World Performance
- **Feed Load Time**: < 500ms (cached)
- **Song Playback**: < 200ms
- **Page Navigation**: < 100ms
- **IPFS Image Load**: Instant (cached)

## 🚀 Caching Strategy

### 1. Service Worker Caching

#### Cache Types
```javascript
// public/sw.js
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const IPFS_CACHE = `ipfs-${CACHE_VERSION}`;

// Cache strategies
const cacheStrategies = {
  'ipfs': 'cache-first',           // IPFS content cached forever
  'api': 'stale-while-revalidate', // API responses with background refresh
  'static': 'network-first',       // Static assets with fallback
  'html': 'network-first'         // HTML with offline fallback
};
```

#### IPFS Caching
```javascript
// IPFS content is immutable and cached forever
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('ipfs.io') || 
      event.request.url.includes('gateway.pinata.cloud')) {
    event.respondWith(
      caches.open(IPFS_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            return response; // Return cached version
          }
          return fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

#### API Caching
```javascript
// API responses with stale-while-revalidate
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.match(event.request).then(response => {
          const fetchPromise = fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
          return response || fetchPromise;
        });
      })
    );
  }
});
```

### 2. React Query Caching

#### Configuration
```typescript
// Web3Provider.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000,    // 10 minutes
      cacheTime: 30 * 60 * 1000,    // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});
```

#### Query Optimization
```typescript
// Custom hooks with optimized caching
export const useSongs = (page = 0, limit = 5) => {
  return useQuery({
    queryKey: ['songs', page, limit],
    queryFn: () => fetchSongs(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes for songs
    cacheTime: 15 * 60 * 1000, // 15 minutes
    keepPreviousData: true // Smooth pagination
  });
};

export const useProfile = (walletAddress: string) => {
  return useQuery({
    queryKey: ['profile', walletAddress],
    queryFn: () => fetchProfile(walletAddress),
    staleTime: 10 * 60 * 1000, // 10 minutes for profiles
    enabled: !!walletAddress
  });
};
```

### 3. Browser Caching

#### Static Assets
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['wagmi', 'viem', '@privy-io/react-auth'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts', 'lightweight-charts']
        }
      }
    }
  }
});
```

#### Cache Headers
```toml
# netlify.toml
[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

## 📦 Bundle Optimization

### 1. Code Splitting

#### Route-Based Splitting
```typescript
// Lazy load pages
const Trending = lazy(() => import('./pages/Trending'));
const Artist = lazy(() => import('./pages/Artist'));
const Upload = lazy(() => import('./pages/Upload'));

// Route configuration
<Route path="/trending" element={
  <Suspense fallback={<LoadingSpinner />}>
    <Trending />
  </Suspense>
} />
```

#### Component-Based Splitting
```typescript
// Lazy load heavy components
const SongTradingChart = lazy(() => import('./components/SongTradingChart'));
const AudioPlayer = lazy(() => import('./components/AudioPlayer'));

// Conditional loading
{showChart && (
  <Suspense fallback={<ChartSkeleton />}>
    <SongTradingChart data={chartData} />
  </Suspense>
)}
```

### 2. Tree Shaking

#### Import Optimization
```typescript
// ❌ Bad - imports entire library
import * as Icons from 'react-icons/fa';

// ✅ Good - imports only needed icons
import { FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';

// ❌ Bad - imports entire library
import _ from 'lodash';

// ✅ Good - imports only needed functions
import { debounce, throttle } from 'lodash';
```

#### Bundle Analysis
```bash
# Analyze bundle size
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/assets/*.js

# Or use Vite's built-in analyzer
npm run build -- --analyze
```

### 3. Image Optimization

#### Lazy Loading
```typescript
// Lazy load images
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isInView ? src : undefined}
      alt={alt}
      loading="lazy"
      decoding="async"
      onLoad={() => setIsLoaded(true)}
      style={{ opacity: isLoaded ? 1 : 0 }}
      {...props}
    />
  );
};
```

#### Image Formats
```typescript
// Use modern image formats
const getOptimizedImageUrl = (url: string) => {
  if (url.includes('ipfs.io') || url.includes('gateway.pinata.cloud')) {
    // IPFS images are already optimized
    return url;
  }
  
  // Convert to WebP if supported
  if (supportsWebP()) {
    return url.replace(/\.(jpg|jpeg|png)$/, '.webp');
  }
  
  return url;
};
```

## 🔄 Real-time Optimization

### 1. WebSocket Connections

#### Connection Management
```typescript
// WebSocket connection with reconnection
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect() {
    this.ws = new WebSocket(process.env.VITE_WS_URL);
    
    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('WebSocket connected');
    };

    this.ws.onclose = () => {
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }
}
```

#### Message Batching
```typescript
// Batch WebSocket messages for performance
class MessageBatcher {
  private messages: any[] = [];
  private batchSize = 10;
  private batchDelay = 100;

  addMessage(message: any) {
    this.messages.push(message);
    
    if (this.messages.length >= this.batchSize) {
      this.flush();
    } else {
      setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  private flush() {
    if (this.messages.length > 0) {
      this.processBatch(this.messages);
      this.messages = [];
    }
  }
}
```

### 2. Real-time Updates

#### Optimistic Updates
```typescript
// Optimistic UI updates
const useOptimisticLike = () => {
  const queryClient = useQueryClient();
  
  const likeSong = useMutation({
    mutationFn: likeSongAPI,
    onMutate: async (songId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['song', songId]);
      
      // Snapshot previous value
      const previousSong = queryClient.getQueryData(['song', songId]);
      
      // Optimistically update
      queryClient.setQueryData(['song', songId], (old: any) => ({
        ...old,
        isLiked: true,
        likeCount: old.likeCount + 1
      }));
      
      return { previousSong };
    },
    onError: (err, songId, context) => {
      // Revert on error
      queryClient.setQueryData(['song', songId], context?.previousSong);
    },
    onSettled: (data, error, songId) => {
      // Refetch after mutation
      queryClient.invalidateQueries(['song', songId]);
    }
  });
  
  return likeSong;
};
```

## 📊 Performance Monitoring

### 1. Web Vitals

#### Core Web Vitals Tracking
```typescript
// web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric: any) => {
  // Send to your analytics service
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    event_label: metric.id,
    non_interaction: true
  });
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Custom Performance Metrics
```typescript
// Custom performance tracking
const trackPerformance = (name: string, startTime: number) => {
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Send to analytics
  gtag('event', 'performance', {
    event_category: 'timing',
    event_label: name,
    value: Math.round(duration)
  });
};

// Usage
const startTime = performance.now();
await loadSongs();
trackPerformance('loadSongs', startTime);
```

### 2. Error Tracking

#### Error Boundary
```typescript
// Error boundary with performance tracking
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error performance impact
    const errorTime = performance.now();
    
    // Send to error tracking service
    Sentry.captureException(error, {
      tags: {
        component: errorInfo.componentStack
      },
      extra: {
        errorTime,
        userAgent: navigator.userAgent
      }
    });
  }
}
```

### 3. Performance Budget

#### Bundle Size Monitoring
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['wagmi', 'viem'],
          ui: ['@radix-ui/react-dialog']
        }
      }
    },
    chunkSizeWarningLimit: 5000 // 5MB warning
  }
});
```

#### Performance Budget
```typescript
// performance-budget.ts
const PERFORMANCE_BUDGET = {
  FCP: 1500,    // 1.5s
  LCP: 2500,    // 2.5s
  TTI: 2000,    // 2.0s
  CLS: 0.1,     // 0.1
  FID: 100,     // 100ms
  bundleSize: 5000000 // 5MB
};

const checkPerformanceBudget = (metrics: any) => {
  const violations = [];
  
  Object.entries(PERFORMANCE_BUDGET).forEach(([metric, budget]) => {
    if (metrics[metric] > budget) {
      violations.push({ metric, budget, actual: metrics[metric] });
    }
  });
  
  if (violations.length > 0) {
    console.warn('Performance budget exceeded:', violations);
  }
};
```

## 🎵 Audio Performance

### 1. Audio Preloading

#### Smart Preloading
```typescript
// Preload next song in queue
const useAudioPreloading = () => {
  const [preloadedSongs, setPreloadedSongs] = useState<Set<string>>(new Set());
  
  const preloadSong = useCallback(async (song: Song) => {
    if (preloadedSongs.has(song.id)) return;
    
    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = song.audio_url;
    
    audio.addEventListener('loadedmetadata', () => {
      setPreloadedSongs(prev => new Set([...prev, song.id]));
    });
  }, [preloadedSongs]);
  
  return { preloadSong, preloadedSongs };
};
```

#### Audio Caching
```typescript
// Audio caching strategy
const useAudioCache = () => {
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  const getCachedAudio = (url: string) => {
    if (audioCache.current.has(url)) {
      return audioCache.current.get(url);
    }
    
    const audio = new Audio(url);
    audioCache.current.set(url, audio);
    return audio;
  };
  
  return { getCachedAudio };
};
```

### 2. Audio Optimization

#### Audio Context Management
```typescript
// Audio context optimization
const useAudioContext = () => {
  const audioContext = useRef<AudioContext | null>(null);
  
  const getAudioContext = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Resume context if suspended
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }
    
    return audioContext.current;
  };
  
  return { getAudioContext };
};
```

## 📱 Mobile Performance

### 1. Touch Optimization

#### Touch Event Optimization
```typescript
// Optimized touch events
const useTouchOptimization = () => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    setTouchStart(e.timeStamp);
  }, []);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStart && e.timeStamp - touchStart < 200) {
      // Handle tap
      handleTap(e);
    }
  }, [touchStart]);
  
  return { handleTouchStart, handleTouchEnd };
};
```

#### Gesture Recognition
```typescript
// Gesture recognition for mobile
const useGestureRecognition = () => {
  const [gesture, setGesture] = useState<string | null>(null);
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - (touchStart?.clientX || 0);
    const deltaY = touch.clientY - (touchStart?.clientY || 0);
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setGesture(deltaX > 0 ? 'swipe-right' : 'swipe-left');
    } else {
      setGesture(deltaY > 0 ? 'swipe-down' : 'swipe-up');
    }
  }, [touchStart]);
  
  return { gesture, handleTouchMove };
};
```

### 2. Mobile-Specific Optimizations

#### Viewport Optimization
```html
<!-- Optimized viewport for mobile -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">

<!-- Prevent zoom on input focus -->
<meta name="format-detection" content="telephone=no">
```

#### Mobile Performance Tips
```typescript
// Mobile performance optimizations
const useMobileOptimizations = () => {
  useEffect(() => {
    // Disable context menu on long press
    const preventContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);
    
    // Optimize scroll performance
    document.body.style.webkitOverflowScrolling = 'touch';
    
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);
};
```

## 🔧 Performance Tools

### 1. Development Tools

#### Performance Profiler
```typescript
// Performance profiler for development
const usePerformanceProfiler = () => {
  const [metrics, setMetrics] = useState<any>({});
  
  const startProfiling = (name: string) => {
    performance.mark(`${name}-start`);
  };
  
  const endProfiling = (name: string) => {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name)[0];
    setMetrics(prev => ({ ...prev, [name]: measure.duration }));
  };
  
  return { startProfiling, endProfiling, metrics };
};
```

#### Bundle Analyzer
```bash
# Analyze bundle size
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/assets/*.js

# Or use Vite's built-in analyzer
npm run build -- --analyze
```

### 2. Production Monitoring

#### Real User Monitoring
```typescript
// Real user monitoring
const useRUM = () => {
  useEffect(() => {
    // Track page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      
      // Send to analytics
      gtag('event', 'page_load', {
        event_category: 'performance',
        value: Math.round(loadTime)
      });
    });
  }, []);
};
```

#### Performance Alerts
```typescript
// Performance alert system
const usePerformanceAlerts = () => {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'measure') {
          const duration = entry.duration;
          
          // Alert if performance is poor
          if (duration > 1000) {
            console.warn(`Slow operation: ${entry.name} took ${duration}ms`);
          }
        }
      });
    });
    
    observer.observe({ entryTypes: ['measure'] });
    
    return () => observer.disconnect();
  }, []);
};
```

---

<div align="center">
  <strong>Optimize for Speed! ⚡</strong>
  
  ROUGEE.PLAY delivers Spotify-level performance with advanced optimization techniques.
</div>
