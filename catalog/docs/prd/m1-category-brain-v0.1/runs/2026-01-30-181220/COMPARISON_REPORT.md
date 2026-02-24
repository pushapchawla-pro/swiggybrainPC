# Category Brain v0.4 → v0.5 Comparison Report

**Previous Run**: `2026-01-30-105504` (v0.4)
**Current Run**: `2026-01-30-181220` (v0.5)

---

## Executive Summary

Both runs used **Month-over-Month** analysis. The key differences are in **data source**, **ranking logic**, and **trend validation**.

| Aspect | v0.4 (Previous) | v0.5 (Current) | Impact |
|--------|-----------------|----------------|--------|
| Source Table | `IM_SEARCH_FACT` | `IM_SEARCH_DB_SS` | Different volume numbers |
| Volume Metric | `COUNT(*)` raw searches | `SUM(IMPRESSIONS)` | Larger absolute values |
| Time Periods | 2 months (Jan vs Dec) | 3 months (M0, M-1, M-2) | Trend stability possible |
| Result Sorting | By `mom_growth_pct` DESC | By `m0_volume` DESC | High-volume terms first |
| Trend Validation | None | `trend_stability_score` | Filters one-time spikes |
| Term Deduplication | None | Trigram Jaccard Clustering | Avoids duplicate insights |

---

## Part 1: Data Source Changes

### Different Source Table

**Previous (v0.4)**:
```sql
FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT s
LEFT JOIN ANALYTICS.PUBLIC.IM_SEARCH_DB_STRING_TO_CATEGORY c
    ON LOWER(s.SEARCH_STRING) = LOWER(c.SEARCH_STRING)
```
- Used raw `IM_SEARCH_FACT` table
- Required JOIN with category mapping table
- Volume = `COUNT(*)` of search events

**Current (v0.5)**:
```sql
FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
```
- Uses pre-aggregated `IM_SEARCH_DB_SS` table
- Categories already included in table
- Volume = `SUM(IMPRESSIONS)`

**Impact on Volumes**:
| Term | v0.4 Volume | v0.5 Volume |
|------|-------------|-------------|
| condom | Not in top 200 | 551,578 (#1) |
| shampoo | Not in top 200 | 524,644 (#2) |
| pantyliners | 8,453 | Not found (different spelling) |
| panty liner | Not found | 18,458 |

The volume differences are significant because `IMPRESSIONS` in `IM_SEARCH_DB_SS` includes all search result page views, not just unique search events.

---

## Part 2: Ranking Logic Change

### Previous: Sorted by Growth Percentage

**v0.4 SQL**:
```sql
ORDER BY mom_growth_pct DESC NULLS LAST
LIMIT 200;
```

This prioritized terms with **highest growth %**, regardless of volume. Result: low-base terms with extreme growth dominated:

| Rank | Term | Volume | Growth |
|------|------|--------|--------|
| 1 | spray bottles | 12,837 | +4404% |
| 2 | pantyliners | 8,453 | +3215% |
| 3 | vicks lozenges | 5,021 | +1885% |
| 4 | l'oreal paris moisture | 4,917 | +789% |

**Problem**: A term going from 285 → 12,837 (spray bottles) ranked higher than stable high-volume terms.

### Current: Sorted by Volume First

**v0.5 SQL**:
```sql
ORDER BY m0.volume DESC
LIMIT 200;
```

This prioritizes terms with **highest current volume**, then applies growth filters in signal fusion:

| Rank | Term | Volume | Growth | Trend |
|------|------|--------|--------|-------|
| 1 | condom | 551,578 | +14% | stable_up |
| 2 | shampoo | 524,644 | +12% | accelerating |
| 3 | toothbrush | 512,669 | +2% | accelerating |
| 4 | toothpaste | 510,868 | +1% | accelerating |

**Benefit**: High-volume terms are captured first, then growth/stability filtering surfaces actionable insights.

---

## Part 3: New Capabilities in v0.5

### 1. Three-Month Trend Analysis (vs Two-Month)

**v0.4**: Compared January 2026 vs December 2025 only
```sql
WHERE s.DT BETWEEN '2026-01-01' AND '2026-01-28'  -- Current
WHERE s.DT BETWEEN '2025-12-01' AND '2025-12-28'  -- Previous
```

**v0.5**: Compares M0 vs M-1 vs M-2
```sql
WHERE DT BETWEEN DATEADD('day', -28, CURRENT_DATE) AND CURRENT_DATE - 1   -- M0
WHERE DT BETWEEN DATEADD('day', -56, CURRENT_DATE) AND DATEADD('day', -29, CURRENT_DATE)  -- M-1
WHERE DT BETWEEN DATEADD('day', -84, CURRENT_DATE) AND DATEADD('day', -57, CURRENT_DATE)  -- M-2
```

### 2. Trend Stability Scoring

**New columns in v0.5**:
- `trend_direction`: `stable_up`, `accelerating`, `decelerating`, `stable_down`, `volatile`
- `trend_stability_score`: 0-100 based on consistency

| Direction | Criteria | Score |
|-----------|----------|-------|
| stable_up | M0 > M-1 > M-2 | 100 |
| accelerating | M0 > M-1, M-1 ≤ M-2 | 75 |
| decelerating | M0 ≤ M-1, M-1 > M-2 | 50 |
| volatile | Mixed signals | 25 |
| stable_down | M0 < M-1 < M-2 | 0 |

**Impact**: Terms must show growth in 2+ of 3 months to pass qualification gates.

### 3. Term Clustering

**New in v0.5**: `scripts/term_clustering.py`
- Uses trigram Jaccard similarity
- Threshold: 0.75
- Merges variants like "perfumes" + "perfume"

**Result**: 200 terms → 193 clusters (7 multi-term clusters merged)

### 4. New Qualification Gate

**v0.5 Added**:
```
trend_stability_score >= 50 (growth in 2+ of 3 months)
```

This filters out one-time spikes that don't sustain.

---

## Part 4: Data Quality Fixes

### Issue 1: S2C Misrepresented as Rate

**Previous (v0.4)**: Evidence showed percentages like "91% S2C"
- S2C is an **event count**, not a conversion rate
- Values can exceed 100

**Current (v0.5)**:
- Config renamed: `search_to_cart` → `s2c_events`
- SQL comments: `-- NOTE: This is avg daily EVENT COUNT, not a rate`
- InsightCard DON'T list: `**CRITICAL: Present S2C or A2C as percentages**`

### Issue 2: GROSS_MARGIN Interpretation

**Previous (v0.4)**:
```sql
ROUND(cm.gross_margin * 100, 2) as gross_margin_pct
```
- GROSS_MARGIN is absolute INR (MRP - COGS), not a fraction
- Multiplying by 100 produced nonsensical values

**Current (v0.5)**:
```sql
-- GROSS_MARGIN is absolute INR (MRP - COGS), NOT a fraction
AVG(GROSS_MARGIN) AS avg_gross_margin_inr  -- Informational only, do NOT present
```

### Issue 3: Placeholder Brand Names

**Previous (v0.4)**: Could include brands named "unknown", "other", "na"

**Current (v0.5)**:
```sql
AND LOWER(BRAND_NAME) NOT IN ('unknown', 'other', 'na', 'n/a', 'none')
```

---

## Part 5: Insight Comparison

### Why Top Insights Changed Completely

| Rank | v0.4 (Growth-sorted) | v0.5 (Volume-sorted + stability) |
|------|----------------------|----------------------------------|
| 1 | Pantyliners (+3215%) | Mysore Soap (+1645%, stable_up) |
| 2 | Spray Bottles (+4404%) | Body Scrubber (+107%, supply-constrained) |
| 3 | V-Wash (+228%) | Durex (+968%, accelerating) |
| 4 | L'Oreal Moisture (+789%) | Panty Liner (+24%, stable_up) |
| 5 | Close Up (+281%) | Loofah (+23%, supply-constrained) |

**Key Reasons**:

1. **Different data source**: `IM_SEARCH_DB_SS` has different term coverage than `IM_SEARCH_FACT`

2. **Volume-first ranking**: High-volume terms (condom 551K, shampoo 524K) now in dataset, then signal fusion ranks by emerging score

3. **Trend stability filter**: Terms need consistent growth, not one-time spikes

4. **Supply constraint boost**: v0.5 applies 1.15x boost for availability < 50%, elevating body scrubber and loofah (14% availability)

### Example: Pantyliners vs Panty Liner

| Metric | v0.4 "pantyliners" | v0.5 "panty liner" |
|--------|-------------------|-------------------|
| Volume | 8,453 | 18,458 |
| Growth | +3215% | +24% |
| Trend | N/A | stable_up (100) |
| Availability | 62% | 63% |

The v0.4 growth of +3215% (from 255 to 8,453) was likely a **data artifact** from the different source table, not a genuine 32x demand surge. The v0.5 figure of +24% MoM is more realistic.

---

## Part 6: Uncommitted File Changes

### Modified Files (8)

| File | Change |
|------|--------|
| `SKILL.md` | Version bump v0.4→v0.5, new task graph, updated formula |
| `default-config.yaml` | New weights (trend_stability 0.15), clustering config, seasonality config |
| `search_mom.sql.j2` | 3-month rolling with trend stability scoring |
| `sales_mom.sql.j2` | 3-month rolling, S2C/margin data quality comments |
| `task-definitions.md` | CB-0 (clustering), CB-1c (YoY) specs, data quality warnings |
| `worker-templates.md` | CB-0, CB-1c worker prompts |
| `insightcard-template.md` | New tags, DON'T list for data quality |
| `signal_fusion.py` | Weight validation, zero variance warning |

### New Files (2)

| File | Purpose |
|------|---------|
| `scripts/term_clustering.py` | Trigram Jaccard term clustering algorithm |
| `sql/search_yoy.sql.j2` | YoY seasonality comparison query |

---

## Part 7: Data Quality Observations in Current Run

### Limitations Encountered

1. **Sales Data Gap**: 66-day hole (Nov 14 - Jan 17, 2026)
   - M-1 = 0 for sales, causing all trends to show "accelerating"
   - Sales trend stability unreliable

2. **YoY Data Unavailable**: `IM_SEARCH_DB_SS` has only ~3 months history
   - All terms defaulted to `SEASONAL_NORMAL`
   - Seasonality boost not applied

3. **Search Type Low Typed %**: Average typed_pct = 12.51%
   - All terms classified as "navigation" (autosuggest-driven)
   - May indicate data join issue

4. **A2C/S2C/Gross Margin NULL**: Columns returned NULL in source table

---

## Recommendations

### For Future Runs

1. **Verify data source choice**: `IM_SEARCH_DB_SS` vs `IM_SEARCH_FACT` produce very different results
2. **Investigate sales data gap**: 66-day hole affects MoM comparisons
3. **Confirm YoY data retention**: Need 365+ days for seasonality detection
4. **Add data quality checks**: Flag when source tables have gaps

### Configuration Improvements

1. Consider hybrid sorting: Volume threshold first, then by emerging_score
2. Add minimum volume gate to SQL (currently only in signal fusion)
3. Document source table differences in skill documentation

---

*Comparison Report (Corrected) | Category Brain v0.5 | Run: 2026-01-30-181220*
