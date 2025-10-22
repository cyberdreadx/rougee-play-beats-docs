# 🛠️ Troubleshooting Guide

Comprehensive troubleshooting guide for ROUGEE, covering common issues, debugging techniques, and solutions.

## 🚨 Common Issues

### Wallet Connection Problems

#### Issue: Wallet Not Connecting
**Symptoms:**
- "Connect Wallet" button not working
- Wallet popup not appearing
- Connection fails silently

**Solutions:**
```typescript
// Check wallet connection status
const { address, isConnected, connect, disconnect } = useWallet();

// Debug connection
console.log('Wallet status:', { address, isConnected });

// Force reconnection
const handleReconnect = async () => {
  await disconnect();
  await new Promise(resolve => setTimeout(resolve, 1000));
  await connect();
};
```

**Troubleshooting Steps:**
1. **Clear Browser Cache**: Clear cache and cookies
2. **Check Wallet Extension**: Ensure MetaMask/WalletConnect is installed
3. **Network Issues**: Check internet connection
4. **Browser Compatibility**: Try different browser
5. **Extension Conflicts**: Disable other extensions temporarily

#### Issue: Wrong Network
**Symptoms:**
- "Wrong network" error message
- Transactions failing
- Can't see XRGE tokens

**Solutions:**
```typescript
// Check current network
const { chain, chains, switchChain } = useWallet();

// Switch to correct network
const handleSwitchNetwork = async () => {
  try {
    await switchChain({ chainId: 8453 }); // Base network
  } catch (error) {
    console.error('Network switch failed:', error);
  }
};
```

**Troubleshooting Steps:**
1. **Check Network**: Ensure you're on Base network
2. **Add Network**: Add Base network to wallet
3. **Switch Network**: Use the network switcher
4. **Refresh Page**: Reload after network change

### Audio Playback Issues

#### Issue: Audio Not Playing
**Symptoms:**
- Play button not working
- Audio player shows error
- No sound from speakers

**Solutions:**
```typescript
// Check audio context
const useAudioDebug = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  
  const initAudioContext = async () => {
    try {
      const context = new AudioContext();
      if (context.state === 'suspended') {
        await context.resume();
      }
      setAudioContext(context);
    } catch (error) {
      console.error('Audio context failed:', error);
    }
  };
  
  return { audioContext, initAudioContext };
};
```

**Troubleshooting Steps:**
1. **Check Audio Permissions**: Allow audio in browser
2. **User Gesture**: Click play button (required for autoplay)
3. **Audio Format**: Try different audio format
4. **Browser Audio**: Test with other audio sources
5. **PWA Mode**: Check if in PWA mode (different audio handling)

#### Issue: PWA Audio Problems
**Symptoms:**
- Audio works in browser but not in PWA
- Audio context suspended
- No audio in mobile PWA

**Solutions:**
```typescript
// PWA audio handling
const usePWAAudio = () => {
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    // Detect PWA mode
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWA(isPWAMode);
    
    // Handle PWA audio context
    if (isPWAMode) {
      const handleUserGesture = async () => {
        const audioContext = new AudioContext();
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
      };
      
      document.addEventListener('click', handleUserGesture, { once: true });
    }
  }, []);
  
  return { isPWA };
};
```

**Troubleshooting Steps:**
1. **User Gesture**: Tap play button in PWA
2. **Audio Context**: Resume suspended audio context
3. **Service Worker**: Check service worker cache
4. **Mobile Settings**: Check mobile audio settings

### Trading Issues

#### Issue: Transaction Failing
**Symptoms:**
- Transaction rejected
- Gas estimation failed
- Transaction stuck pending

**Solutions:**
```typescript
// Transaction debugging
const useTransactionDebug = () => {
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  
  const debugTransaction = async (hash: string) => {
    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      setTransactionStatus(receipt.status);
    } catch (error) {
      console.error('Transaction failed:', error);
      setTransactionStatus('failed');
    }
  };
  
  return { transactionStatus, debugTransaction };
};
```

**Troubleshooting Steps:**
1. **Check Gas Fees**: Ensure sufficient gas
2. **Network Congestion**: Wait for network to clear
3. **Token Balance**: Check XRGE balance
4. **Slippage**: Adjust slippage tolerance
5. **Transaction History**: Check transaction on explorer

#### Issue: Price Not Updating
**Symptoms:**
- Price shows old value
- Trading interface not updating
- Real-time data not working

**Solutions:**
```typescript
// Price update debugging
const usePriceDebug = () => {
  const [priceUpdateCount, setPriceUpdateCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPriceUpdateCount(prev => prev + 1);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return { priceUpdateCount };
};
```

**Troubleshooting Steps:**
1. **Refresh Page**: Reload to get fresh data
2. **Check Network**: Ensure stable internet
3. **Clear Cache**: Clear browser cache
4. **RPC Issues**: Check RPC endpoint status
5. **Real-time**: Check WebSocket connection

### Upload Issues

#### Issue: File Upload Failing
**Symptoms:**
- Upload progress stuck
- File not uploading to IPFS
- Upload error messages

**Solutions:**
```typescript
// Upload debugging
const useUploadDebug = () => {
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  const debugUpload = async (file: File) => {
    try {
      setUploadStatus('uploading');
      setUploadProgress(0);
      
      // Check file size
      if (file.size > 100 * 1024 * 1024) {
        throw new Error('File too large');
      }
      
      // Check file type
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type');
      }
      
      // Upload to IPFS
      const hash = await uploadToIPFS(file);
      setUploadStatus('success');
      setUploadProgress(100);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('failed');
    }
  };
  
  return { uploadStatus, uploadProgress, debugUpload };
};
```

**Troubleshooting Steps:**
1. **File Size**: Check file size (max 100MB)
2. **File Type**: Ensure supported format (MP3, WAV, FLAC)
3. **Network**: Check internet connection
4. **IPFS Status**: Check IPFS gateway status
5. **Retry Upload**: Try uploading again

#### Issue: Upload Slots Exceeded
**Symptoms:**
- "Upload slots exceeded" error
- Can't upload more songs
- Tier status not updating

**Solutions:**
```typescript
// Upload slots debugging
const useUploadSlotsDebug = () => {
  const { slotsRemaining, isPremium, xrgeBalance } = useUploadSlots();
  
  const debugSlots = () => {
    console.log('Upload slots debug:', {
      slotsRemaining,
      isPremium,
      xrgeBalance,
      totalSongs: 20 + (isPremium ? 980 : 0)
    });
  };
  
  return { debugSlots };
};
```

**Troubleshooting Steps:**
1. **Check Balance**: Verify XRGE balance
2. **Tier Status**: Check premium tier status
3. **Song Count**: Count uploaded songs
4. **Refresh Data**: Reload to get fresh data
5. **Buy XRGE**: Purchase more XRGE for premium tier

## 🔍 Debugging Techniques

### Browser Developer Tools

#### Console Debugging
```typescript
// Console debugging helpers
const debugHelpers = {
  logWallet: () => {
    console.log('Wallet info:', {
      address: window.ethereum?.selectedAddress,
      network: window.ethereum?.chainId,
      connected: !!window.ethereum?.selectedAddress
    });
  },
  
  logAudio: () => {
    console.log('Audio info:', {
      context: new AudioContext().state,
      canPlay: document.createElement('audio').canPlayType('audio/mpeg'),
      userAgent: navigator.userAgent
    });
  },
  
  logNetwork: () => {
    console.log('Network info:', {
      online: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType,
      downlink: (navigator as any).connection?.downlink
    });
  }
};
```

#### Network Tab Analysis
```typescript
// Network request debugging
const debugNetworkRequests = () => {
  // Check API responses
  fetch('/api/songs')
    .then(response => {
      console.log('Songs API:', {
        status: response.status,
        headers: response.headers,
        ok: response.ok
      });
      return response.json();
    })
    .then(data => console.log('Songs data:', data))
    .catch(error => console.error('Songs API error:', error));
};
```

### React DevTools

#### Component Debugging
```typescript
// Component debugging
const useComponentDebug = (componentName: string) => {
  const [renderCount, setRenderCount] = useState(0);
  
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    console.log(`${componentName} rendered ${renderCount + 1} times`);
  });
  
  return { renderCount };
};
```

#### State Debugging
```typescript
// State debugging
const useStateDebug = (state: any, stateName: string) => {
  useEffect(() => {
    console.log(`${stateName} changed:`, state);
  }, [state, stateName]);
};
```

### Performance Debugging

#### Performance Monitoring
```typescript
// Performance monitoring
const usePerformanceDebug = () => {
  const [metrics, setMetrics] = useState<any>({});
  
  const measurePerformance = (name: string, fn: () => void) => {
    const start = performance.now();
    fn();
    const end = performance.now();
    const duration = end - start;
    
    setMetrics(prev => ({
      ...prev,
      [name]: duration
    }));
    
    console.log(`${name} took ${duration}ms`);
  };
  
  return { metrics, measurePerformance };
};
```

#### Memory Usage
```typescript
// Memory usage debugging
const useMemoryDebug = () => {
  const [memoryInfo, setMemoryInfo] = useState<any>(null);
  
  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryInfo({
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      });
    }
  }, []);
  
  return { memoryInfo };
};
```

## 🐛 Error Handling

### Error Boundaries

#### Global Error Boundary
```typescript
// Global error boundary
class GlobalErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global error:', error, errorInfo);
    
    // Send to error tracking service
    if (window.gtag) {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>Please refresh the page and try again</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

#### Component Error Boundary
```typescript
// Component-specific error boundary
const ComponentErrorBoundary = ({ children, fallback }: any) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Component error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return fallback || <div>Something went wrong</div>;
  }
  
  return children;
};
```

### Error Recovery

#### Automatic Retry
```typescript
// Automatic retry mechanism
const useRetry = (fn: () => Promise<any>, maxRetries = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const retry = async () => {
    if (retryCount >= maxRetries) {
      throw new Error('Max retries exceeded');
    }
    
    setIsRetrying(true);
    try {
      const result = await fn();
      setRetryCount(0);
      setIsRetrying(false);
      return result;
    } catch (error) {
      setRetryCount(prev => prev + 1);
      setIsRetrying(false);
      throw error;
    }
  };
  
  return { retry, retryCount, isRetrying };
};
```

#### Fallback Strategies
```typescript
// Fallback strategies
const useFallback = () => {
  const [fallbackActive, setFallbackActive] = useState(false);
  
  const activateFallback = () => {
    setFallbackActive(true);
    console.log('Fallback mode activated');
  };
  
  const deactivateFallback = () => {
    setFallbackActive(false);
    console.log('Fallback mode deactivated');
  };
  
  return { fallbackActive, activateFallback, deactivateFallback };
};
```

## 📱 Mobile-Specific Issues

### Touch Events

#### Touch Event Debugging
```typescript
// Touch event debugging
const useTouchDebug = () => {
  const [touchEvents, setTouchEvents] = useState<any[]>([]);
  
  const handleTouchStart = (e: TouchEvent) => {
    setTouchEvents(prev => [...prev, {
      type: 'touchstart',
      timestamp: Date.now(),
      touches: e.touches.length
    }]);
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    setTouchEvents(prev => [...prev, {
      type: 'touchend',
      timestamp: Date.now(),
      touches: e.touches.length
    }]);
  };
  
  return { touchEvents, handleTouchStart, handleTouchEnd };
};
```

#### Gesture Recognition
```typescript
// Gesture recognition debugging
const useGestureDebug = () => {
  const [gestures, setGestures] = useState<string[]>([]);
  
  const detectGesture = (startX: number, startY: number, endX: number, endY: number) => {
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'swipe-right' : 'swipe-left';
    } else {
      return deltaY > 0 ? 'swipe-down' : 'swipe-up';
    }
  };
  
  return { gestures, detectGesture };
};
```

### PWA Issues

#### PWA Detection
```typescript
// PWA detection and debugging
const usePWADebug = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [pwaFeatures, setPwaFeatures] = useState<any>({});
  
  useEffect(() => {
    // Detect PWA mode
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWA(isPWAMode);
    
    // Check PWA features
    setPwaFeatures({
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      offlineStorage: 'indexedDB' in window
    });
  }, []);
  
  return { isPWA, pwaFeatures };
};
```

#### Service Worker Debugging
```typescript
// Service worker debugging
const useServiceWorkerDebug = () => {
  const [swStatus, setSwStatus] = useState<string>('');
  
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        setSwStatus('ready');
        console.log('Service worker ready:', registration);
      });
      
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('Service worker message:', event.data);
      });
    }
  }, []);
  
  return { swStatus };
};
```

## 🔧 Development Tools

### Debugging Scripts

#### Debug Console
```typescript
// Debug console for development
const debugConsole = {
  wallet: () => {
    console.log('Wallet debug:', {
      ethereum: !!window.ethereum,
      selectedAddress: window.ethereum?.selectedAddress,
      chainId: window.ethereum?.chainId,
      isConnected: !!window.ethereum?.selectedAddress
    });
  },
  
  audio: () => {
    console.log('Audio debug:', {
      context: new AudioContext().state,
      canPlay: document.createElement('audio').canPlayType('audio/mpeg'),
      userAgent: navigator.userAgent
    });
  },
  
  network: () => {
    console.log('Network debug:', {
      online: navigator.onLine,
      connection: (navigator as any).connection?.effectiveType,
      downlink: (navigator as any).connection?.downlink
    });
  },
  
  performance: () => {
    console.log('Performance debug:', {
      memory: (performance as any).memory,
      timing: performance.timing,
      navigation: performance.getEntriesByType('navigation')[0]
    });
  }
};

// Make available globally in development
if (process.env.NODE_ENV === 'development') {
  (window as any).debug = debugConsole;
}
```

#### Error Reporting
```typescript
// Error reporting for debugging
const useErrorReporting = () => {
  const reportError = (error: Error, context: any) => {
    console.error('Error reported:', error, context);
    
    // Send to error tracking service
    if (window.gtag) {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: context
      });
    }
  };
  
  return { reportError };
};
```

## 📞 Getting Help

### Support Channels

#### Community Support
- **GitHub Issues**: Report bugs and request features
- **Discord**: Real-time community support
- **Telegram**: Quick questions and updates
- **Reddit**: Community discussions

#### Professional Support
- **Email Support**: Direct support for complex issues
- **Video Calls**: Screen sharing for complex problems
- **Documentation**: Comprehensive help articles
- **Video Tutorials**: Step-by-step guides

### Reporting Issues

#### Bug Report Template
```markdown
## Bug Report

### Description
Brief description of the issue

### Steps to Reproduce
1. Go to...
2. Click on...
3. See error

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- Browser: Chrome 120.0
- OS: Windows 11
- Wallet: MetaMask 10.25.0
- Network: Base

### Screenshots
If applicable, add screenshots

### Console Logs
```
Error: Cannot read property 'x' of undefined
    at Component.render (Component.tsx:25)
```

### Additional Context
Any other relevant information
```

#### Feature Request Template
```markdown
## Feature Request

### Description
Brief description of the feature

### Use Case
Why this feature would be useful

### Proposed Solution
How you think it should work

### Alternatives
Other ways to achieve the same goal

### Additional Context
Any other relevant information
```

---

<div align="center">
  <strong>We're Here to Help! 🛠️</strong>
  
  Use this guide to resolve issues and get the most out of ROUGEE.
</div>
