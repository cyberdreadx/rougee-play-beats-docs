# 💎 XRGE Tier Badge System

## 🎯 Overview

Artists and users are rewarded with tier badges based on their XRGE token holdings. These badges appear on profiles and show status in the community.

---

## 🏆 Tier Breakdown

### 💎 **Diamond Whale** (10M+ XRGE)
- **Color:** Cyan (`text-cyan-400`)
- **Icon:** 💎
- **Benefits:**
  - ✓ Unlimited uploads (1000 slots)
  - ✓ Premium badge
  - ✓ VIP status
  - ✓ Early access to features
- **Rarity:** Ultra Rare (Top 0.1%)

### 🐋 **Platinum Whale** (5M - 9.9M XRGE)
- **Color:** Purple (`text-purple-400`)
- **Icon:** 🐋
- **Benefits:**
  - ✓ Unlimited uploads (1000 slots)
  - ✓ Premium badge
  - ✓ Whale status
- **Rarity:** Very Rare (Top 1%)

### 🌟 **Gold Whale** (1M - 4.9M XRGE)
- **Color:** Yellow/Gold (`text-yellow-400`)
- **Icon:** 🌟
- **Benefits:**
  - ✓ Unlimited uploads (1000 slots)
  - ✓ Premium badge
- **Rarity:** Rare (Top 5%)

### 🦍 **Degen** (100K - 999K XRGE)
- **Color:** Green (`text-green-400`)
- **Icon:** 🦍
- **Benefits:**
  - ✓ 20 uploads
  - ✓ Strong holder recognition
- **Rarity:** Uncommon (Top 20%)

### 🦧 **Ape** (10K - 99K XRGE)
- **Color:** Orange (`text-orange-400`)
- **Icon:** 🦧
- **Benefits:**
  - ✓ 20 uploads
  - ✓ Holder badge
- **Rarity:** Common (Top 50%)

### 🎵 **Holder** (1K - 9.9K XRGE)
- **Color:** Blue (`text-blue-400`)
- **Icon:** 🎵
- **Benefits:**
  - ✓ 20 uploads
  - ✓ Community member
- **Rarity:** Common (Everyone)

### No Badge (< 1K XRGE)
- No special badge displayed
- Still get 20 free upload slots

---

## 📍 Where Badges Appear

### 1. **Profile Edit Page**
- Large badge in top right corner
- Shows balance: "Gold Whale (1.5M)"
- Hover tooltip shows tier details and benefits

### 2. **Artist Profile Page** (Public View)
- Badge appears next to artist name
- Next to "VERIFIED" badge (if verified)
- Visible to all visitors

### 3. **Coming Soon:**
- Song cards (small badge on artist name)
- Leaderboards (tier filtering)
- Comments (tier icon next to username)
- Search results

---

## 🎨 Visual Design

### Badge Styling
```tsx
- Semi-transparent colored background
- Colored border matching tier
- Colored text
- Emoji icon
- Hover tooltip with details
```

### Sizes
- **Small (`sm`)**: 0.75rem text, 0.5rem padding
- **Medium (`md`)**: 0.875rem text, 0.75rem padding  
- **Large (`lg`)**: 1rem text, 1rem padding

### Interactive Features
- **Hover:** Shows tooltip with:
  - Tier name and icon
  - Exact XRGE balance
  - List of benefits
- **Click:** No action (tooltip only)

---

## 💻 Technical Implementation

### Hook: `useXRGETier(walletAddress)`
Returns:
```typescript
{
  tier: XRGETier | null,
  xrgeBalance: number,
  isPremium: boolean,
  isLoading: boolean,
  isWhale: boolean, // >= 1M
  isDegen: boolean  // >= 100K
}
```

### Component: `<XRGETierBadge />`
Props:
```typescript
{
  walletAddress: string | null;
  showBalance?: boolean; // Show "(1.5M)" text
  size?: "sm" | "md" | "lg";
  className?: string;
}
```

### On-Chain Verification
- Reads XRGE balance directly from blockchain
- Updates every 2 minutes automatically
- No database storage needed
- Cannot be faked

---

## 🚀 Future Enhancements

### Potential Additions:
1. **Dynamic Tiers** - Admin can update tier thresholds
2. **Tier History** - Show highest tier ever achieved
3. **Tier Achievements** - NFT badges for reaching tiers
4. **Exclusive Features:**
   - 💎 Diamond: Custom profile themes
   - 🐋 Platinum: Featured artist placement
   - 🌟 Gold: Priority support
5. **Tier Leaderboards** - Rank by XRGE holdings
6. **Tier Chat Channels** - Discord roles based on tier

---

## 📊 Expected Distribution

Based on typical token distributions:
- **Diamond Whale**: < 5 users (0.01%)
- **Platinum Whale**: ~10-20 users (0.1%)
- **Gold Whale**: ~50-100 users (1%)
- **Degen**: ~500 users (5%)
- **Ape**: ~2,000 users (20%)
- **Holder**: ~8,000 users (75%)
- **No Badge**: Remaining users

---

## 🎯 User Motivations

### Why Hold XRGE for Tiers?

1. **Status Symbol** - Flex your whale status
2. **Unlimited Uploads** - For serious artists (1M+ XRGE)
3. **Community Recognition** - Stand out in comments/profiles
4. **Future Benefits** - Early access, exclusive features
5. **Investment** - XRGE appreciation + utility

---

## ✅ Deployment Checklist

- [x] Create `useXRGETier` hook
- [x] Create `XRGETierBadge` component
- [x] Add to Profile Edit page
- [x] Add to Artist Profile page
- [ ] Add to song cards (optional)
- [ ] Add to comments (optional)
- [ ] Add tier filtering to explore page
- [ ] Create tier leaderboard page
- [ ] Update documentation
- [ ] Announce new tier system

---

**Status:** ✅ Ready to deploy!

Your XRGE holdings now give you visible status and benefits across the platform! 🚀

