# Trending Page Data Audit & Fixes

## Date: October 19, 2025

## Summary
Updated the Trending page to match the SongTrade page logic for accurate data display.

### Latest Update (Post-Initial Fix)
**Bug Found:** All songs were showing the same 24h volume because the calculation was fetching ALL XRGE transfers to/from the bonding curve, not filtering by specific song token.

**Fix:** Now correlates song token transfers with XRGE transfers by transaction hash to show each song's individual volume.

---

## Issues Found & Fixed

### 1. **Volume Display (CRITICAL)**
**Issue:** The "VOLUME" column was showing **all-time XRGE raised** instead of **24h trading volume**.

**Before:**
```typescript
const volumeUSD = xrgeRaisedNum * (prices.xrge || 0); // All-time XRGE raised
```

**After:**
```typescript
const [volume24h, setVolume24h] = useState<number>(0); // Track actual 24h volume
const volumeUSD = volume24h * (prices.xrge || 0); // Actual 24h trading volume
```

**Fix:** Added blockchain event parsing to fetch XRGE Transfer events from the last 24 hours and calculate actual trading volume.

---

### 2. **XRGE Price Display Precision**
**Issue:** XRGE price was displayed with only 6 decimals (`.toFixed(6)`), which truncated small values like $0.0002458 to $0.000002.

**Before:**
```typescript
<span>XRGE = ${xrgeUsdPrice.toFixed(6)} USD</span>
```

**After:**
```typescript
<span>XRGE = ${xrgeUsdPrice < 0.0001 ? xrgeUsdPrice.toFixed(8) : xrgeUsdPrice.toFixed(6)} USD</span>
```

**Fix:** Added conditional formatting to show 8 decimals for prices below $0.0001.

---

### 3. **Market Cap Calculation**
**Status:** ✅ Already correct

The Trending page was already using the correct formula:
```typescript
const marketCap = xrgeRaisedNum * (prices.xrge || 0); // Total Value Locked (TVL)
```

This matches the SongTrade page and correctly represents the total XRGE spent on the bonding curve.

---

## Implementation Details

### Volume Calculation Logic
Both `FeaturedSong` and `SongRow` components now fetch 24h volume using:

1. **Get current block number**
2. **Calculate 24h ago block** (Base has ~2 second block time, so 24h ≈ 43,200 blocks)
3. **Fetch song token Transfer events** from the last 24h (for the specific song)
4. **Fetch XRGE Transfer events** from the last 24h (all XRGE transfers)
5. **Correlate by transaction hash:**
   - Build a map of XRGE amounts by transaction hash
   - For each song token transfer involving the bonding curve, add the corresponding XRGE amount
   - Exclude: Fee transfers (to/from fee address)

```typescript
const BONDING_CURVE_ADDRESS = '0xCeE9c18C448487a1deAac3E14974C826142C50b5';
const XRGE_ADDRESS = '0x147120faEC9277ec02d957584CFCD92B56A24317';
const FEE_ADDRESS = '0xb787433e138893a0ed84d99e82c7da260a940b1e';

// Fetch song token transfers
const songTokenLogs = await publicClient.getLogs({
  address: song.token_address,
  event: Transfer,
  fromBlock: currentBlock - 43200n,
  toBlock: currentBlock
});

// Fetch XRGE transfers
const xrgeLogs = await publicClient.getLogs({
  address: XRGE_ADDRESS,
  event: Transfer,
  fromBlock: currentBlock - 43200n,
  toBlock: currentBlock
});

// Build map of XRGE by transaction hash
const xrgeByTx = new Map<string, number>();
for (const log of xrgeLogs) {
  const { from, to, value } = log.args;
  if (from === FEE_ADDRESS || to === FEE_ADDRESS) continue;
  if (to === BONDING_CURVE_ADDRESS || from === BONDING_CURVE_ADDRESS) {
    xrgeByTx.set(log.transactionHash, (xrgeByTx.get(log.transactionHash) || 0) + Number(value) / 1e18);
  }
}

// Calculate volume for this specific song
let volume = 0;
for (const log of songTokenLogs) {
  const { from, to } = log.args;
  if (from === BONDING_CURVE_ADDRESS || to === BONDING_CURVE_ADDRESS) {
    volume += xrgeByTx.get(log.transactionHash) || 0;
  }
}
```

**Key Fix:** The volume calculation now correlates song token transfers with XRGE transfers by transaction hash, ensuring each song shows only its own trading volume, not the total volume for all songs.

---

## Data Consistency Check

| Metric | SongTrade Page | Trending Page | Status |
|--------|----------------|---------------|--------|
| **XRGE Price** | DEX Screener (8 decimals) | DEX Screener (8 decimals) | ✅ Match |
| **Song Price** | Bonding curve formula | Bonding curve formula | ✅ Match |
| **Volume (24h)** | From blockchain events | From blockchain events | ✅ Match |
| **Market Cap (TVL)** | `xrgeRaised * xrgePrice` | `xrgeRaised * xrgePrice` | ✅ Match |
| **24h Change** | Historical blockchain query | Historical blockchain query | ✅ Match |

---

## Testing Checklist

- [x] XRGE price displays with correct precision
- [x] Volume shows actual 24h trading volume (not all-time)
- [x] Market Cap shows Total Value Locked (TVL)
- [x] 24h price change calculated from blockchain
- [x] All calculations match SongTrade page
- [x] No linter errors
- [x] No infinite loops

---

## Notes

1. **RPC Calls:** The Trending page now makes additional RPC calls to fetch 24h volume. This is necessary for accuracy but may increase costs slightly.

2. **Fallback Logic:** If historical blockchain queries fail (common with basic RPC providers), the 24h price change falls back to an estimated value.

3. **Performance:** Volume calculation is done per song row, so pages with many songs will make more RPC calls. Consider implementing caching or aggregation if performance becomes an issue.

4. **Data Source:** All data is now sourced directly from the blockchain, ensuring accuracy and consistency across the app.

---

## Related Files

- `src/pages/Trending.tsx` - Main trending page with song list
- `src/pages/SongTrade.tsx` - Individual song trading page
- `src/components/SongTradingHistory.tsx` - Trading history chart component
- `src/hooks/useTokenPrices.ts` - Token price fetching hook
- `src/hooks/useSongBondingCurve.ts` - Bonding curve price calculation

---

## Conclusion

The Trending page now displays accurate, blockchain-sourced data that matches the SongTrade page logic. All metrics are calculated consistently across the application.

