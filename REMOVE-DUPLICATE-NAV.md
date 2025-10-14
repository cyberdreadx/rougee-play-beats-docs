# Navigation Persistence Fix

## ✅ What I Fixed

Created a persistent Layout component that wraps all routes in App.tsx, so Header and Navigation only mount once and persist across page changes.

## Files Modified

### ✅ Created
- `src/components/Layout.tsx` - Persistent layout wrapper
- Updated `src/App.tsx` - Wrapped Routes with Layout
- Updated `src/pages/Index.tsx` - Removed Header/Navigation

### ⚠️ Still Need to Update

Remove `<Header />` and `<Navigation />` from these files:

1. **src/pages/Swap.tsx**
   - Remove: `import Header from "@/components/Header";`
   - Remove: `import Navigation from "@/components/Navigation";`
   - Remove: `<Header />` from JSX
   - Remove: `<Navigation />` from JSX

2. **src/pages/Trending.tsx**
   - Same removals as above

3. **src/pages/Wallet.tsx**
   - Same removals as above

4. **src/pages/Artist.tsx**
   - Same removals as above

5. **src/pages/SongTrade.tsx**
   - Same removals as above

6. **src/pages/Feed.tsx**
   - Same removals as above

7. **src/pages/Upload.tsx**
   - Same removals as above

8. **src/pages/BecomeArtist.tsx**
   - Same removals as above

9. **src/pages/ProfileEdit.tsx**
   - Same removals as above

10. **src/pages/Admin.tsx**
    - Same removals as above

11. **src/pages/HowItWorks.tsx**
    - Same removals as above

12. **src/pages/TermsOfService.tsx**
    - Same removals as above

## Pattern to Remove

In each file, remove these lines:

```typescript
// REMOVE from imports:
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";

// REMOVE from JSX:
<Header />
<Navigation />
```

## Keep These

**DO NOT remove:**
- NetworkInfo (if present)
- Any other components specific to that page

## Result

After removing duplicates:
- ✅ Navigation persists across routes (no refresh/remount)
- ✅ Smooth mobile experience
- ✅ Better performance
- ✅ Cleaner code

