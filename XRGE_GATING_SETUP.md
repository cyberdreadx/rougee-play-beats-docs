# XRGE Balance Gating System - Setup Complete ✅

## 🎯 How It Works

Artists are gated by their **XRGE token holdings**:
- **Free Tier**: Hold < 1M XRGE → 20 song uploads max
- **Premium Tier**: Hold ≥ 1M XRGE → 1000 song uploads (effectively unlimited)

The system checks **on-chain** via `balanceOf()` on the XRGE contract every 30 seconds.

---

## ✅ Step 1: Clean Your Database (REQUIRED)

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Drop old tables/columns/functions (if they exist)
DROP TABLE IF EXISTS public.upload_slot_purchases CASCADE;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS upload_slots_purchased;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS upload_slots_used;
DROP FUNCTION IF EXISTS public.get_remaining_upload_slots;
DROP FUNCTION IF EXISTS public.increment_upload_slots;
DROP FUNCTION IF EXISTS public.process_slot_purchase;
```

**Why?** This removes any leftover schema from the old "purchase slots" system.

---

## ✅ Step 2: Files Updated (ALREADY DONE)

### New Hook: `src/hooks/useUploadSlots.ts`
- ✅ Checks XRGE balance on-chain using `useReadContract`
- ✅ Reads `total_songs` from profiles table
- ✅ Calculates slots: `20 + (isPremium ? 980 : 0) - songsUploaded`
- ✅ Returns: `slotsRemaining`, `isPremium`, `xrgeBalance`, etc.

### Updated Components:
- ✅ `src/components/UploadSlotsCard.tsx` - Shows balance, tier, upgrade CTA
- ✅ `src/components/UploadSlotsBadge.tsx` - Badge with crown icon for premium
- ✅ `src/components/UploadMusic.tsx` - Checks slots before upload

### Deleted:
- ❌ `supabase/migrations/20251020000000_add_upload_slots.sql` (not needed)
- ❌ Purchase functions removed from hook
- ❌ No Edge Functions needed

---

## ✅ Step 3: Test It

1. **Run database cleanup SQL** (Step 1 above)
2. **Refresh your app**
3. **Connect wallet** with < 1M XRGE
   - Should see: "Free Tier - 20 slots"
   - Should see: "X/20" badge
4. **Try uploading a song**
   - Should work if under 20 songs
   - Should block at 20 songs
5. **Test with 1M+ XRGE wallet** (if you have one)
   - Should see: "Premium Tier" with crown icon
   - Should see: "X/1000" badge
   - Should upload past 20 songs

---

## 🎨 UI Features

### UploadSlotsCard
- Shows XRGE balance in real-time
- Progress bar (red when full, yellow when premium)
- Crown icon for premium users
- "Buy XRGE to Upgrade" button (goes to /swap page)
- Shows how much more XRGE needed for premium

### UploadSlotsBadge (Header)
- Small compact badge: "15/20"
- Premium shows: "15/1000 PRO" with crown
- Color coded: yellow for premium, white for free

### Upload Button
- Disabled when out of slots
- Shows remaining: "Upload (5 slots left)"
- Premium users see: "Upload (985 slots left)"

---

## 📊 Database Requirements

**Only uses existing schema:**
- `profiles.total_songs` - Already exists, tracks upload count
- `profiles.wallet_address` - Already exists, used to query

**No new tables needed!** Everything else is checked on-chain.

---

## 🔧 Configuration

### XRGE Token Address (Base Chain)
```typescript
const XRGE_TOKEN_ADDRESS = "0x147120faEC9277ec02d957584CFCD92B56A24317";
```

### Thresholds
```typescript
const MINIMUM_XRGE_REQUIRED = 1_000_000; // 1M XRGE
const FREE_TIER_SLOTS = 20;
const PREMIUM_TIER_SLOTS = 1000;
```

Change these in `src/hooks/useUploadSlots.ts` if needed.

---

## 🚀 Deployment Checklist

- [x] Delete old migration file
- [x] Update useUploadSlots hook
- [x] Update UploadSlotsCard component
- [x] Update UploadSlotsBadge component  
- [x] Update UploadMusic.tsx to use new API
- [ ] **Run database cleanup SQL** (You need to do this)
- [ ] Test with free tier wallet
- [ ] Test with premium wallet (if available)
- [ ] Deploy to production

---

## 💡 How It Works Technically

```
User visits /upload
    ↓
useUploadSlots hook runs
    ↓
Checks XRGE balance on-chain: balanceOf(userAddress)
    ↓
Checks total_songs from database
    ↓
Calculates: remaining = (balance >= 1M ? 1000 : 20) - total_songs
    ↓
If remaining > 0: Allow upload
If remaining = 0: Block upload + show "Buy XRGE" CTA
```

**No backend needed!** Pure on-chain + database read.

---

## 🎉 Done!

Once you run the database cleanup SQL, everything is ready!

Your users will now need to hold 1M XRGE to upload more than 20 songs.

