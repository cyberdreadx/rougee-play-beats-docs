# 🚀 Quick Start Guide

Get up and running with ROUGEE.PLAY in just a few minutes!

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** ([Download here](https://nodejs.org/))
- **Git** ([Download here](https://git-scm.com/))
- **Web3 Wallet** (MetaMask, WalletConnect, etc.)
- **Code Editor** (VS Code recommended)

## ⚡ Quick Setup

### 1. Clone the Repository

```bash
git clone https://github.com/cyberdreadx/rougee-play-beats.git
cd rougee-play-beats
```

### 2. Install Dependencies

```bash
# Using npm
npm install

# Or using bun (faster)
bun install
```

### 3. Start Development Server

```bash
# Using npm
npm run dev

# Or using bun
bun dev
```

The app will be available at `http://localhost:8080`

## 🎯 First Steps

### 1. Connect Your Wallet

1. Click the **"Connect Wallet"** button in the top right
2. Choose your preferred wallet (MetaMask, WalletConnect, etc.)
3. Approve the connection in your wallet

### 2. Explore the Platform

- **Home**: Discover trending music
- **Feed**: Social content from artists
- **Search**: Find specific songs or artists
- **Profile**: Manage your account

### 3. Try Key Features

#### For Listeners:
- 🎵 **Stream Music**: Click play on any song
- 🔍 **Discover**: Browse trending and new releases
- 💬 **Engage**: Comment on songs you like
- 📱 **Mobile**: Works great on mobile devices

#### For Artists:
- 🎤 **Upload Music**: Go to Upload page
- 👤 **Create Profile**: Set up your artist profile
- 📊 **Track Stats**: Monitor your song performance
- 💰 **Earn Revenue**: From trading activity

## 🎵 Understanding the Platform

### Music Streaming
- **Free Streaming**: All music is free to stream
- **High Quality**: Professional audio quality
- **Offline Support**: Works without internet (PWA)
- **Cross-Platform**: Desktop and mobile

### Trading System
- **Buy Shares**: Purchase shares of songs you like
- **Sell Shares**: Trade your shares for profit
- **Price Discovery**: Fair prices through bonding curves
- **Real-time Updates**: Live price changes

### Social Features
- **Artist Profiles**: Learn about creators
- **Comments**: Share your thoughts
- **Stories**: 24-hour ephemeral content
- **Feed**: Discover new content

## 🔧 Development Mode

### Hot Reload
The development server includes hot reload:
- Changes to code automatically refresh the browser
- State is preserved during updates
- Fast iteration cycle

### Debug Tools
- **React DevTools**: Component inspection
- **Web3 DevTools**: Blockchain debugging
- **Console Logs**: Detailed error messages

### Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## 🌐 Environment Setup

### Public Configuration
The app uses these public environment variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

**Note**: These are safe to be public and are protected by Row-Level Security.

### Wallet Configuration
The app automatically detects your network:
- **Base Chain**: Primary network for trading
- **Ethereum**: For XRGE token operations
- **Auto-switching**: Seamless network transitions

## 📱 Mobile Experience

### PWA Features
- **Install App**: Add to home screen
- **Offline Mode**: Works without internet
- **Push Notifications**: Stay updated
- **Native Feel**: App-like experience

### Mobile Navigation
- **Bottom Navigation**: Easy thumb access
- **Swipe Gestures**: Intuitive interactions
- **Touch Optimized**: Designed for mobile

## 🎨 Customization

### Themes
- **Dark Mode**: Default cyberpunk theme
- **Light Mode**: Alternative theme
- **Auto-switching**: Follows system preference

### Personalization
- **Profile Customization**: Avatar, bio, links
- **Playlist Creation**: Organize your music
- **Preferences**: Customize your experience

## 🚨 Troubleshooting

### Common Issues

#### Wallet Connection Issues
```bash
# Clear browser cache
# Disconnect and reconnect wallet
# Try different wallet provider
```

#### Audio Playback Issues
```bash
# Check browser audio permissions
# Try different audio format
# Clear browser cache
```

#### Network Issues
```bash
# Check internet connection
# Try different RPC endpoint
# Clear browser cache
```

### Getting Help

1. **Check Console**: Look for error messages
2. **GitHub Issues**: Report bugs and feature requests
3. **Community**: Join our Discord/Telegram
4. **Documentation**: Read the full docs

## 🎉 You're Ready!

You now have ROUGEE.PLAY running locally! Here's what to do next:

### Immediate Next Steps
1. **Connect your wallet**
2. **Explore the interface**
3. **Try streaming music**
4. **Check out artist profiles**

### Learning Path
1. **[User Guide](../guides/user-guide.md)** - Learn all features
2. **[Artist Guide](../guides/artist-guide.md)** - Start creating
3. **[Trading Guide](../features/trading-system.md)** - Understand trading
4. **[Developer Guide](../guides/developer-guide.md)** - Contribute code

### Advanced Usage
1. **Upload your first song**
2. **Create an artist profile**
3. **Try trading music shares**
4. **Engage with the community**

---

<div align="center">
  <strong>Welcome to the Future of Music! 🎵</strong>
  
  Start your journey with ROUGEE.PLAY today.
</div>
