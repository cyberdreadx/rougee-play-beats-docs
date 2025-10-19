# Upload Slots System - File Summary

## 📁 New Files Created

### Database
- `supabase/migrations/20251020000000_add_upload_slots.sql`
  - Adds `upload_slots_used` and `upload_slots_purchased` to profiles table
  - Creates `upload_slot_purchases` table
  - Adds SQL functions for slot management

### Backend
- `supabase/functions/purchase-upload-slots/index.ts`
  - Edge Function to verify XRGE payment on-chain
  - Credits 20 slots after payment verification
  - Prevents duplicate transactions

### Frontend - Hooks
- `src/hooks/useUploadSlots.ts`
  - `useUploadSlots()` - Fetch and manage slot state
  - `usePurchaseSlots()` - Handle XRGE payment and slot purchase

### Frontend - Components
- `src/components/UploadSlotsCard.tsx`
  - Full card with progress bar, stats, purchase button
  - Shows warnings when low/out of slots
  - Used on Upload page and Profile Edit page

- `src/components/UploadSlotsBadge.tsx`
  - Compact badge showing "15/20"
  - Color-coded: green/yellow/red
  - Click to navigate to upload page
  - Used in Header (always visible for artists)

## 📝 Modified Files

### Frontend - Pages
- `src/pages/Upload.tsx`
  - No changes needed (uses UploadMusic component)

- `src/pages/ProfileEdit.tsx`
  - Added `UploadSlotsCard` at top (for artists only)
  - Imported hooks and components

### Frontend - Components  
- `src/components/UploadMusic.tsx`
  - Added slot checking before upload
  - Shows slots remaining on upload button
  - Disables button when out of slots
  - Increments slots after successful upload
  - Shows `UploadSlotsCard` at top of page

- `src/components/Header.tsx`
  - Added `UploadSlotsBadge` in header (artists only)
  - Always visible so artists know their slot count

## 🎨 Visual Hierarchy

```
Header (Always Visible)
└── UploadSlotsBadge: "15/20" → Click → /upload
    └── Compact, color-coded, quick glance

Upload Page
└── UploadSlotsCard: Full details
    ├── Progress bar
    ├── Stats (used/remaining)
    ├── Purchase button
    └── Info text

Profile Edit Page (Artists Only)
└── UploadSlotsCard: Same as upload page
    └── Manage slots while editing profile

Upload Button
└── Dynamic text: "Upload (X slots left)"
    └── Disabled when X = 0
```

## 🔄 User Flow

```
Artist uploads 18 songs
    ↓
Header badge: "2/20" (yellow warning)
    ↓
Artist clicks badge → /upload
    ↓
Sees UploadSlotsCard: "Used: 18/20, 2 remaining"
    ↓
Uploads 2 more songs
    ↓
Header badge: "0/20" (red - out of slots)
    ↓
Upload button disabled: "No Slots Available"
    ↓
Clicks "Buy 20 More Slots (10 XRGE)"
    ↓
Confirms transaction → Sends 10 XRGE to treasury
    ↓
Edge Function verifies payment
    ↓
Database updated: slots_purchased++
    ↓
Header badge: "20/40" (green - back to normal)
    ↓
Can upload 20 more songs!
```

## ⚙️ Configuration

Before deployment, set treasury address in:
1. `supabase/functions/purchase-upload-slots/index.ts` (line 12)
2. `src/hooks/useUploadSlots.ts` (line 10)

## 🚀 Quick Deploy

```bash
# 1. Run migration
npx supabase db push

# 2. Deploy edge function
npx supabase functions deploy purchase-upload-slots

# 3. Build frontend
npm run build

# 4. Deploy (Netlify auto-deploys on push)
git add .
git commit -m "feat: Add upload slots system"
git push
```

---

**Summary:** Artists can now see their upload slots in 4 places: header badge (always), upload page (full details), profile page (management), and upload button (real-time count). System is fully integrated and ready to deploy! ✅

