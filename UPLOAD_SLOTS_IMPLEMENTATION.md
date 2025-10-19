# Upload Slots System - Implementation Summary

## 🎯 Overview

Artists now have a **20-song upload limit by default**. To upload more, they must pay **10 XRGE** for an additional **20 upload slots**.

---

## 📊 Database Changes

### New Migration: `20251020000000_add_upload_slots.sql`

**Added to `profiles` table:**
- `upload_slots_used` (INTEGER) - Tracks how many uploads the artist has used
- `upload_slots_purchased` (INTEGER) - Tracks how many slot packs purchased (each pack = 20 slots)

**New table: `upload_slot_purchases`**
- Records every XRGE payment for slot purchases
- Tracks: wallet_address, slots_purchased, xrge_amount, transaction_hash, chain_id

**New Functions:**
1. `get_remaining_upload_slots(wallet)` - Returns remaining slots
   - Formula: `(20 + purchased*20) - used`
2. `increment_upload_slots(wallet)` - Increments used count after upload
3. `process_slot_purchase(wallet, xrge, tx_hash, chain)` - Processes payment

---

## 🔧 Backend Changes

### New Edge Function: `purchase-upload-slots`

**Purpose:** Verify XRGE payment on-chain and credit slots

**Process:**
1. Receives transaction hash and wallet address
2. Fetches transaction receipt from Base blockchain
3. Verifies XRGE Transfer event (from user → treasury, amount ≥ 10 XRGE)
4. Calls `process_slot_purchase()` to credit 20 slots
5. Returns success with new slot count

**Security:**
- Checks for duplicate transactions (prevents replay attacks)
- Verifies transaction status (must be successful)
- Validates transfer amount and recipients
- Uses service role key for database access

---

## 💻 Frontend Changes

### New Hook: `src/hooks/useUploadSlots.ts`

**Exports:**
1. `useUploadSlots()` - Manages slot state
   - `slotsRemaining` - How many slots left
   - `slotsUsed` - How many used
   - `slotsPurchased` - How many packs purchased
   - `totalSlots` - Total available
   - `incrementSlots()` - Call after successful upload

2. `usePurchaseSlots()` - Handles purchasing
   - `purchaseSlots()` - Initiates XRGE transfer
   - `processPurchase(txHash)` - Verifies and credits slots
   - `isPending` - Transaction in progress
   - `isSuccess` - Transaction confirmed

### New Component: `src/components/UploadSlotsCard.tsx`

**Features:**
- Displays slots used/remaining with progress bar
- Color-coded warnings (red = 0 slots, yellow = ≤5 slots)
- Purchase button (sends 10 XRGE to treasury)
- Auto-processes purchase after transaction confirms
- Shows success message with updated slot count

### Updated Component: `src/components/UploadMusic.tsx`

**Changes:**
- Shows `UploadSlotsCard` at top of upload page
- Checks `slotsRemaining` before upload
- Disables upload button if no slots available
- Button shows remaining slots: "Upload to IPFS (15 slots left)"
- Calls `incrementSlots()` after successful upload

---

## 🔐 Configuration Required

### 1. Set Treasury Address

**In `supabase/functions/purchase-upload-slots/index.ts`:**
```typescript
const TREASURY_ADDRESS = '0xYourActualTreasuryAddress'; // Line 12
```

**In `src/hooks/useUploadSlots.ts`:**
```typescript
const TREASURY_ADDRESS = "0xYourActualTreasuryAddress" as Address; // Line 10
```

### 2. Deploy Edge Function

```bash
cd supabase
npx supabase functions deploy purchase-upload-slots
```

### 3. Run Migration

```bash
npx supabase migration up
```

---

## 💰 Payment Flow

1. **User clicks "Buy 20 More Slots"**
2. **Frontend initiates XRGE transfer** (10 XRGE → Treasury)
3. **User confirms in wallet**
4. **Transaction mines on Base blockchain**
5. **Frontend calls `purchase-upload-slots` Edge Function**
6. **Edge Function verifies payment on-chain**
7. **Database updated:** `upload_slots_purchased++`
8. **User gets 20 more slots** (total available increases)

---

## 📍 Where Artists See Their Slots

### 1. **Header Badge** (Always Visible)
- Small badge in the header: "15/20" 
- Click to navigate to upload page
- Color coded: green = plenty, yellow = low, red = none
- Only shown for artists (not listeners)

### 2. **Upload Page** (Full Details)
- Large `UploadSlotsCard` at the top
- Shows progress bar, used/remaining, purchase button
- Blocks uploads when slots = 0

### 3. **Profile Edit Page** (For Artists)
- Shows `UploadSlotsCard` above profile form
- Artists can manage slots while editing profile

### 4. **Upload Button** (Dynamic Text)
- Button shows: "Upload to IPFS (15 slots left)"
- Disabled when slots = 0: "No Slots Available"

---

## 🎨 User Experience

### First Time Artist (0 uploads)
- Header badge: "20/20" (green)
- Upload page: "Used: 0 / 20, 20 remaining"
- Green progress bar
- Can upload 20 songs for free

### After 15 Uploads
- Header badge: "5/20" (yellow - warning color)
- Upload page: "Used: 15 / 20, 5 remaining"
- Yellow progress bar + warning
- Button text: "Upload to IPFS (5 slots left)"

### After 20 Uploads (Out of Slots)
- Header badge: "0/20" (red - destructive)
- Upload page: "Used: 20 / 20, 0 remaining"
- Red progress bar + error alert
- Button disabled: "No Slots Available"
- Must purchase more slots to continue

### After Purchasing (40 total slots)
- Header badge: "20/40" (green - back to normal)
- Upload page: "Used: 20 / 40, 20 remaining"
- Green progress bar
- Can upload 20 more songs
- Badge shows purchased slots are permanent

---

## 📝 Database Schema Reference

```sql
-- profiles table additions
ALTER TABLE profiles ADD COLUMN upload_slots_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN upload_slots_purchased INTEGER DEFAULT 0;

-- New table
CREATE TABLE upload_slot_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  slots_purchased INTEGER DEFAULT 20,
  xrge_amount TEXT NOT NULL,
  transaction_hash TEXT UNIQUE NOT NULL,
  chain_id INTEGER DEFAULT 8453,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🧪 Testing Checklist

- [ ] Set treasury address in both files
- [ ] Deploy Edge Function
- [ ] Run migration
- [ ] Test: View slots on upload page
- [ ] Test: Upload song (slots decrement)
- [ ] Test: Upload button disabled when out of slots
- [ ] Test: Purchase 20 more slots with XRGE
- [ ] Test: Verify slots increase after purchase
- [ ] Test: Upload with purchased slots
- [ ] Test: Verify transaction recorded in `upload_slot_purchases`

---

## 🚀 Deployment Steps

1. **Update Treasury Address** (2 files)
2. **Run Database Migration:**
   ```bash
   npx supabase db push
   ```
3. **Deploy Edge Function:**
   ```bash
   npx supabase functions deploy purchase-upload-slots
   ```
4. **Build and Deploy Frontend:**
   ```bash
   npm run build
   git add .
   git commit -m "feat: Add upload slots system with XRGE payment"
   git push
   ```

---

## 🎉 Summary

✅ **20 free slots** for every artist
✅ **$10 in XRGE** per additional 20 slots
✅ **Payment verification** on-chain
✅ **Automatic slot tracking** per upload
✅ **Visual progress bar** and warnings
✅ **No expiration** - slots last forever
✅ **Anti-spam** - prevents unlimited uploads
✅ **Revenue generation** - XRGE to treasury

The system is now ready for deployment! 🚀

