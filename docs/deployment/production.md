# 🚀 Production Deployment Guide

Complete guide for deploying ROUGEE to production, including Netlify configuration, environment setup, and monitoring.

## 📋 Prerequisites

Before deploying to production, ensure you have:

- **Netlify Account**: For hosting and CDN
- **Supabase Project**: Backend services configured
- **Domain Name**: Custom domain (optional)
- **SSL Certificate**: Automatic with Netlify
- **Environment Variables**: All required keys

## 🌐 Netlify Deployment

### 1. Build Configuration

The project is pre-configured for Netlify deployment with `netlify.toml`:

```toml
[build]
  command = "bun run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

### 2. Deployment Steps

#### Option A: Git Integration (Recommended)
1. **Connect Repository**: Link your GitHub repository to Netlify
2. **Auto-Deploy**: Netlify will build and deploy on every push
3. **Branch Settings**: Configure which branch to deploy from
4. **Build Settings**: Netlify will use the `netlify.toml` configuration

#### Option B: Manual Deployment
```bash
# Build the project
bun run build

# Deploy to Netlify
npx netlify deploy --prod --dir=dist
```

### 3. Environment Variables

Configure these environment variables in Netlify:

#### Required Variables
```bash
# Supabase Configuration (Public - Safe to commit)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

#### Optional Variables
```bash
# Analytics (Optional)
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
VITE_HOTJAR_ID=1234567

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false
```

### 4. Custom Domain Setup

1. **Add Domain**: Go to Site Settings → Domain Management
2. **DNS Configuration**: Update your DNS records
3. **SSL Certificate**: Netlify automatically provisions SSL
4. **HTTPS Redirect**: Ensure all traffic uses HTTPS

## 🔧 Environment Configuration

### Development Environment
```bash
# .env.local (for local development)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your-local-key
VITE_ENABLE_DEBUG=true
```

### Production Environment
```bash
# Netlify Environment Variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-key
VITE_ENABLE_DEBUG=false
```

### Environment-Specific Builds
```bash
# Development build
bun run build:dev

# Production build
bun run build

# Preview build
bun run preview
```

## 🗄️ Database Configuration

### Supabase Production Setup

#### 1. Database Migrations
```bash
# Run all migrations
supabase db push

# Verify migration status
supabase migration list
```

#### 2. Row-Level Security
Ensure all tables have proper RLS policies:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read access" ON songs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON stories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON comments FOR SELECT USING (true);
```

#### 3. Edge Functions
Deploy all edge functions to production:

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy upload-story
```

### Database Optimization

#### 1. Indexes
```sql
-- Create indexes for performance
CREATE INDEX idx_songs_artist_id ON songs(artist_id);
CREATE INDEX idx_songs_created_at ON songs(created_at);
CREATE INDEX idx_songs_genre ON songs(genre);
CREATE INDEX idx_stories_artist_id ON stories(artist_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_comments_song_id ON comments(song_id);
```

#### 2. Connection Pooling
Configure connection pooling in Supabase:
- **Pool Size**: 20-50 connections
- **Timeout**: 30 seconds
- **Retry Logic**: 3 attempts

## 🔐 Security Configuration

### 1. CORS Settings
```typescript
// Supabase CORS configuration
const corsOptions = {
  origin: [
    'https://your-domain.netlify.app',
    'https://your-custom-domain.com',
    'http://localhost:8080' // Development only
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 2. Content Security Policy
```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co https://*.netlify.app;
  media-src 'self' https:;
">
```

### 3. Security Headers
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
```

## 📊 Performance Optimization

### 1. Build Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          web3: ['wagmi', 'viem'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
});
```

### 2. Service Worker Configuration
```javascript
// public/sw.js
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Cache strategies
const cacheStrategies = {
  'ipfs': 'cache-first',
  'api': 'stale-while-revalidate',
  'static': 'network-first'
};
```

### 3. CDN Configuration
- **Netlify CDN**: Automatic global distribution
- **Edge Functions**: Serverless compute at edge
- **Image Optimization**: Automatic image optimization
- **Gzip Compression**: Automatic compression

## 📱 PWA Configuration

### 1. Manifest File
```json
{
  "name": "ROUGEE",
  "short_name": "ROUGEE",
  "description": "Decentralized Music Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#00FF41",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Service Worker Features
- **Offline Support**: Full offline functionality
- **Background Sync**: Sync when online
- **Push Notifications**: Real-time updates
- **Cache Management**: Intelligent caching

## 🔍 Monitoring & Analytics

### 1. Application Monitoring
```typescript
// Error tracking
import { init } from '@sentry/react';

init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: 'production',
  tracesSampleRate: 0.1
});
```

### 2. Performance Monitoring
```typescript
// Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 3. Analytics Integration
```typescript
// Google Analytics
import { gtag } from 'ga-gtag';

gtag('config', 'GA_TRACKING_ID', {
  page_title: 'ROUGEE',
  page_location: window.location.href
});
```

## 🧪 Testing in Production

### 1. Health Checks
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  });
});
```

### 2. Smoke Tests
```bash
# Test critical functionality
curl -f https://your-domain.com/health || exit 1
curl -f https://your-domain.com/api/songs || exit 1
curl -f https://your-domain.com/api/profiles || exit 1
```

### 3. Load Testing
```bash
# Use tools like Artillery or k6
artillery run load-test.yml
```

## 🚨 Error Handling

### 1. Global Error Boundary
```typescript
// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 2. API Error Handling
```typescript
// Centralized error handling
const handleApiError = (error: any) => {
  if (error.status === 401) {
    // Redirect to login
    window.location.href = '/login';
  } else if (error.status === 500) {
    // Show server error message
    toast.error('Server error. Please try again.');
  }
};
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Netlify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - uses: nwtgck/actions-netlify@v2.0
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
```

### 2. Automated Testing
```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test
      - run: npm run lint
      - run: npm run build
```

## 📈 Scaling Considerations

### 1. Database Scaling
- **Read Replicas**: For read-heavy workloads
- **Connection Pooling**: Optimize database connections
- **Query Optimization**: Monitor slow queries

### 2. CDN Optimization
- **Edge Caching**: Cache static assets globally
- **Image Optimization**: Automatic image optimization
- **Compression**: Gzip/Brotli compression

### 3. Monitoring Scaling
- **Metrics**: Track key performance indicators
- **Alerts**: Set up automated alerts
- **Logging**: Centralized logging system

## 🎯 Production Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] SSL certificate valid
- [ ] Domain DNS configured

### Post-Deployment
- [ ] Health checks passing
- [ ] Performance metrics normal
- [ ] Error rates within acceptable limits
- [ ] User experience working
- [ ] Monitoring alerts configured

### Ongoing Maintenance
- [ ] Regular security updates
- [ ] Performance monitoring
- [ ] Backup verification
- [ ] Log analysis
- [ ] User feedback review

---

<div align="center">
  <strong>Deploy with Confidence! 🚀</strong>
  
  Your ROUGEE production environment is ready to scale.
</div>
