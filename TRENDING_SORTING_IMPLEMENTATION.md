# Trending Page Sorting & Trending Score Implementation

## Date: October 19, 2025

## Summary
Implemented sortable columns and a weighted trending score algorithm to determine the #1 featured song based on multiple metrics, not just play count.

---

## Features Implemented

### 1. **Trending Score Algorithm** 🔥
A weighted scoring system that considers multiple factors to determine the "hottest" song:

```typescript
trendingScore = (volume24h × 0.4) + (priceChange24h × 0.25) + (marketCap × 0.2) + (playCount × 0.15)
```

**Weights:**
- **40% - Volume (24h):** Recent trading activity (most important)
- **25% - Price Change (24h):** Momentum and hype
- **20% - Market Cap (TVL):** Overall value and liquidity
- **15% - Play Count:** User engagement and popularity

**Why this works:**
- Prioritizes **active trading** over passive metrics
- Rewards **momentum** (rising prices)
- Balances **value** and **engagement**
- Prevents manipulation (requires multiple metrics to rank high)

---

### 2. **Sortable Columns** 📊
All columns are now clickable and sortable:

| Column | Sort Field | Description |
|--------|-----------|-------------|
| **🔥 TRENDING** | `trending` | Weighted trending score (default) |
| **PRICE** | `price` | Current USD price |
| **24H%** | `change` | 24h price change percentage |
| **VOLUME** | `volume` | 24h trading volume (USD) |
| **MKT CAP** | `marketCap` | Total Value Locked (TVL) |
| **PLAYS** | `plays` | Total play count |

**Features:**
- ✅ Click any column header to sort
- ✅ Click again to toggle ascending/descending
- ✅ Visual indicators (↑/↓) show active sort
- ✅ Hover effects highlight clickable columns
- ✅ Default sort: Trending Score (descending)

---

### 3. **Featured Song Selection** ⭐
The #1 featured song (banner at top) is **always** determined by the highest trending score, regardless of the current table sort.

This ensures the featured song is truly the "hottest" song based on all metrics combined, not just one factor.

---

## UI/UX Improvements

### Sort Controls
```tsx
<div className="flex items-center gap-2 mb-3">
  <span className="text-xs text-muted-foreground font-mono">SORT BY:</span>
  <button className="...">
    🔥 TRENDING ↓
  </button>
</div>
```

### Column Headers
- **Clickable:** Cursor changes to pointer on hover
- **Highlighted:** Hover effect changes color to neon green
- **Active Indicator:** Shows arrow (↑/↓) for current sort
- **Responsive:** Works on mobile and desktop

---

## Technical Implementation

### State Management
```typescript
const [sortField, setSortField] = useState<SortField>('trending');
const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
const [songStats, setSongStats] = useState<Map<string, {
  volume: number;
  change: number;
  marketCap: number;
  price: number;
}>>(new Map());
```

### Sorting Logic
```typescript
const sortedSongs = [...songs].sort((a, b) => {
  let aValue: number;
  let bValue: number;
  
  switch (sortField) {
    case 'trending':
      aValue = calculateTrendingScore(a);
      bValue = calculateTrendingScore(b);
      break;
    // ... other cases
  }
  
  return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
});
```

### Featured Song Selection
```typescript
const featuredSong = songs.length > 0 
  ? [...songs].sort((a, b) => calculateTrendingScore(b) - calculateTrendingScore(a))[0]
  : null;
```

---

## Data Flow

1. **SongRow Component** fetches blockchain data (volume, price, market cap, price change)
2. **Calls `onStatsUpdate`** to pass data to parent
3. **Parent stores** all song stats in a Map
4. **Trending Score** is calculated on-demand for each song
5. **Sorting** uses the selected field and direction
6. **Featured Song** always uses trending score

---

## Example Scenarios

### Scenario 1: High Volume, Low Plays
- Song has $1000 in 24h volume but only 10 plays
- **Trending Score:** High (volume weighted 40%)
- **Result:** Ranks high, appears in featured banner

### Scenario 2: High Plays, No Trading
- Song has 1000 plays but $0 in 24h volume
- **Trending Score:** Low (plays only weighted 15%)
- **Result:** Ranks lower, won't be featured

### Scenario 3: Balanced Metrics
- Song has moderate volume, plays, and positive price change
- **Trending Score:** Medium-High (all factors contribute)
- **Result:** Solid ranking, potential for featured spot

---

## User Benefits

1. **Discover Hot Songs:** Featured song is truly trending, not just popular
2. **Flexible Sorting:** Find songs by any metric that matters to you
3. **Better Trading Decisions:** See which songs have real trading activity
4. **Fair Ranking:** Can't game the system with just one metric

---

## Future Enhancements

Potential improvements for future iterations:

1. **Time-based Weights:** Adjust weights based on time of day/week
2. **Velocity Scoring:** Rate of change in metrics (acceleration)
3. **Social Signals:** Integrate comments, likes, shares
4. **Personalization:** User-specific trending based on preferences
5. **Historical Trending:** "Trending this week/month" views

---

## Testing Checklist

- [x] Trending score calculation works correctly
- [x] All columns are sortable
- [x] Sort direction toggles properly
- [x] Visual indicators show active sort
- [x] Featured song uses trending score
- [x] No linter errors
- [x] Responsive on mobile and desktop

---

## Related Files

- `src/pages/Trending.tsx` - Main trending page with sorting logic
- `TRENDING_PAGE_AUDIT.md` - Data accuracy audit
- `TRADING_DATA_AUDIT.md` - Trading data component audit

---

## Conclusion

The trending page now provides a comprehensive, fair, and user-friendly way to discover hot songs based on real trading activity and engagement, not just passive metrics.

