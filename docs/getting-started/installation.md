# 🛠️ Installation Guide

Complete setup guide for ROUGEE.PLAY development environment.

## 📋 System Requirements

### Minimum Requirements
- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher (or bun 1.0.0+)
- **Git**: 2.30.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space

### Recommended Setup
- **Node.js**: 20.x LTS
- **Package Manager**: Bun (faster than npm)
- **Code Editor**: VS Code with extensions
- **RAM**: 16GB for optimal performance
- **Storage**: SSD with 10GB+ free space

## 🔧 Development Environment Setup

### 1. Install Node.js

#### Option A: Direct Download
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version (20.x recommended)
3. Run the installer
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

#### Option B: Using Node Version Manager (Recommended)

**For macOS/Linux:**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.bashrc

# Install and use Node.js 20
nvm install 20
nvm use 20
nvm alias default 20
```

**For Windows:**
```bash
# Install nvm-windows
# Download from: https://github.com/coreybutler/nvm-windows/releases
# Install and use Node.js 20
nvm install 20.10.0
nvm use 20.10.0
```

### 2. Install Package Manager

#### Option A: npm (Included with Node.js)
```bash
# Verify npm version
npm --version
```

#### Option B: Bun (Recommended - Faster)
```bash
# Install bun
curl -fsSL https://bun.sh/install | bash

# Restart terminal or run:
source ~/.bashrc

# Verify installation
bun --version
```

### 3. Install Git

#### macOS
```bash
# Using Homebrew
brew install git

# Or download from git-scm.com
```

#### Windows
1. Download from [git-scm.com](https://git-scm.com/download/win)
2. Run the installer
3. Use Git Bash or Windows Terminal

#### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install git

# CentOS/RHEL
sudo yum install git
```

## 📦 Project Setup

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/cyberdreadx/rougee-play-beats.git

# Navigate to project directory
cd rougee-play-beats

# Check current branch
git branch
```

### 2. Install Dependencies

#### Using npm:
```bash
# Install all dependencies
npm install

# Verify installation
npm list --depth=0
```

#### Using bun (Recommended):
```bash
# Install all dependencies
bun install

# Verify installation
bun pm ls
```

### 3. Environment Configuration

The project uses public environment variables that are safe to commit:

```bash
# Check if .env file exists
ls -la | grep .env

# If no .env file, create one (optional for development)
touch .env.local
```

**Note**: The app works without local environment variables as it uses public Supabase configuration.

### 4. Verify Installation

```bash
# Start development server
npm run dev
# or
bun dev

# Should output:
# ➜  Local:   http://localhost:8080/
# ➜  Network: http://192.168.x.x:8080/
```

## 🔧 Code Editor Setup

### VS Code (Recommended)

#### Install Extensions
```bash
# Essential extensions
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-eslint
code --install-extension ms-vscode.vscode-json
```

#### Recommended Extensions
- **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
- **TypeScript Importer** - Auto-import TypeScript modules
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **GitLens** - Git integration
- **Thunder Client** - API testing
- **REST Client** - HTTP requests

#### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  }
}
```

## 🌐 Browser Setup

### Recommended Browsers
- **Chrome/Chromium**: Best Web3 support
- **Firefox**: Good alternative
- **Safari**: iOS development
- **Edge**: Windows development

### Required Extensions
- **MetaMask**: Web3 wallet
- **WalletConnect**: Multi-wallet support
- **React Developer Tools**: Component debugging
- **Web3 Developer Tools**: Blockchain debugging

### Browser Configuration
```bash
# Enable experimental features (Chrome)
# chrome://flags/#enable-experimental-web-platform-features

# Disable CORS for development (if needed)
# chrome --disable-web-security --user-data-dir=/tmp/chrome_dev
```

## 🔐 Wallet Setup

### 1. Install MetaMask
1. Visit [metamask.io](https://metamask.io/)
2. Install browser extension
3. Create new wallet or import existing
4. **Important**: Save your seed phrase securely

### 2. Configure Networks

#### Base Network (Primary)
- **Network Name**: Base
- **RPC URL**: https://mainnet.base.org
- **Chain ID**: 8453
- **Currency Symbol**: ETH
- **Block Explorer**: https://basescan.org

#### Ethereum Network (For XRGE)
- **Network Name**: Ethereum Mainnet
- **RPC URL**: https://eth.llamarpc.com
- **Chain ID**: 1
- **Currency Symbol**: ETH
- **Block Explorer**: https://etherscan.io

### 3. Get Test Tokens
```bash
# Base testnet faucet
# https://bridge.base.org/deposit

# Ethereum testnet faucet
# https://faucet.quicknode.com/ethereum/sepolia
```

## 🗄️ Database Setup

### Supabase Configuration
The project uses Supabase for backend services. No local database setup required.

#### Public Configuration (Safe to Commit)
```typescript
// These are public and protected by RLS
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=your-project-id
```

#### Private Configuration (Supabase Secrets)
- Service role keys
- API keys (Lighthouse, etc.)
- Database passwords

## 🚀 Development Commands

### Essential Commands
```bash
# Start development server
npm run dev
bun dev

# Build for production
npm run build
bun run build

# Preview production build
npm run preview
bun run preview

# Run linting
npm run lint
bun run lint

# Type checking
npx tsc --noEmit
```

### Development Workflow
```bash
# 1. Start development server
npm run dev

# 2. Open browser to http://localhost:8080

# 3. Connect wallet

# 4. Start coding!

# 5. Hot reload will update automatically
```

## 🧪 Testing Setup

### Unit Testing
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

### E2E Testing
```bash
# Install Playwright
npm install --save-dev @playwright/test

# Run E2E tests
npx playwright test
```

## 📱 Mobile Development

### iOS Simulator (macOS)
```bash
# Install Xcode from App Store
# Install iOS Simulator
# Test PWA features
```

### Android Emulator
```bash
# Install Android Studio
# Create virtual device
# Test mobile experience
```

## 🔧 Troubleshooting

### Common Issues

#### Node.js Version Issues
```bash
# Check Node version
node --version

# If wrong version, use nvm
nvm use 20
nvm alias default 20
```

#### Package Installation Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### Port Already in Use
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

#### Wallet Connection Issues
```bash
# Clear browser cache
# Disconnect and reconnect wallet
# Check network configuration
```

### Performance Optimization

#### For Slow Machines
```bash
# Use bun instead of npm
bun install
bun dev

# Disable source maps
# vite.config.ts: sourcemap: false
```

#### For Large Projects
```bash
# Use incremental builds
# Enable TypeScript incremental compilation
# Use SWC instead of Babel
```

## ✅ Verification Checklist

- [ ] Node.js 18+ installed
- [ ] Package manager (npm/bun) working
- [ ] Git configured
- [ ] Code editor with extensions
- [ ] Browser with Web3 extensions
- [ ] Wallet configured
- [ ] Development server running
- [ ] App loads in browser
- [ ] Wallet connects successfully
- [ ] No console errors

## 🎉 You're Ready!

Your development environment is now set up! Next steps:

1. **[Quick Start Guide](./quick-start.md)** - Get familiar with the app
2. **[Code Structure](../development/code-structure.md)** - Understand the codebase
3. **[API Reference](../development/api-reference.md)** - Learn the APIs
4. **[Contributing Guide](../guides/developer-guide.md)** - Start contributing

---

<div align="center">
  <strong>Happy Coding! 🚀</strong>
  
  Your ROUGEE.PLAY development environment is ready.
</div>
