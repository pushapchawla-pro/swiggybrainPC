# Phase 3 Validation: C4 — Vendor-Wide Low Fillrate

## Validation Question: Is fillrate an issue beyond BLR ECOM2?

**Answer: YES — systemic across 4 WHs. BLR IM1 is the dominant warehouse.**

```sql
SELECT WH_NAME, BRAND, COUNT(DISTINCT ITEM_CODE) AS total_skus,
       SUM(CASE WHEN WH_FILLRATE_ISSUE = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) AS fillrate_oos, ...
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'BANGALORE' AND NON_AVAIL_SESSIONS > 0
GROUP BY WH_NAME, BRAND HAVING fillrate_oos_sessions > 0 AND total_skus >= 5
```

### Top 15 Brand-WH Combos by Fillrate OOS

| WH | Brand | SKUs | Fillrate OOS | % OOS from Fillrate | Brand Avail % |
|----|-------|------|-------------|-------------------|--------------|
| BLR IM1 | Kuber Industries | 552 | 634.5M | 69.5% | 3.6% |
| BLR COLDSTAR | Amul | 166 | 279.4M | 66.7% | 13.8% |
| BLR IM2 COLD | Amul | 168 | 202.4M | 56.7% | 16.1% |
| BLR IM1 | Mars | 196 | 182.0M | **87.7%** | 4.6% |
| BLR IM1 | Pepe Jeans | 358 | 176.3M | 68.9% | 3.1% |
| BLR ECOM2 | Dabur | 88 | 156.9M | 70.1% | 6.9% |
| BLR IM1 | Hot Wheels | 197 | 150.6M | **91.0%** | 5.2% |
| BLR ECOM2 | Real | 38 | 149.9M | 78.5% | 2.8% |
| BLR IM1 | Jockey | 392 | 144.0M | 35.3% | 4.8% |
| BLR IM1 | Urban Platter | 122 | 140.0M | 78.7% | 3.9% |
| BLR IM1 | Paragon | 225 | 135.8M | 63.6% | 4.1% |
| BLR IM1 | Amul | 136 | 121.0M | 69.3% | 10.2% |
| BLR IM1 | Lifelong | 334 | 120.9M | 38.8% | 5.9% |
| BLR IM1 | Nestasia | 203 | 120.3M | 68.6% | 4.1% |
| BLR ECOM2 | 4700BC | 46 | 117.2M | 73.3% | 9.6% |

### Key Findings

1. **BLR IM1 dominates**: 20 of top 30 brand-WH combos
2. **Highest fillrate-concentration**: Hot Wheels (91%), Mars (88%), Urban Platter (79%), Real (78%)
3. **Amul across 4 WHs**: COLDSTAR, IM2 COLD, IM1, ECOM2 — vendor-level systemic
4. **Critically low availability (<5%)**: Swiss Beauty 2.9%, Real 2.8%, Pepe Jeans 3.1%, Kuber Industries 3.6%, Urban Platter 3.9%, Nestasia 4.1%, Mars 4.6%, Jockey 4.8%

---

## 5 Whys

```
WHY 1: Real? YES — Cross-validated in avail_rca_v7 (not just RCA_FILE_WH).
WHY 2: Immediate cause? Vendors delivering less than ordered.
WHY 3: Why persist? Sub-causes not decomposed (credit, capacity, logistics).
WHY 4: Reinforcement? Low fillrate → lower stock → lower sales → lower forecast → smaller POs.
WHY 5: Fix? Segment vendors by root cause; fast-track credit; identify backup vendors.
```

## Quality Score: 7/10

| Criterion | Score | Evidence |
|-----------|-------|----------|
| Specificity | 2 | Named brands + WHs with specific counts |
| Quantification | 2 | Full breakdown with sessions, percentages |
| Mechanism | 1 | Fillrate is low but WHY not decomposed |
| Repeatability | 1 | Pattern exists but generalizable rule not articulated |
| Actionability | 1 | "Segment vendors" is correct but needs more specificity |
