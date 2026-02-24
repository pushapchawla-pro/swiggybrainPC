# Phase 5: G11 (ERP Flags) — Complete 5-Whys Deep Dive

**Date**: 2026-02-11 | **Score**: 8/10 → 9/10 | **Ceiling**: 9/10 (ERP audit trail external)

---

## Summary

G11 ERP blocks affect 31,596 unique SKUs (55.6% of all-band OOS, 0.16% of Band 1-3). Phase 5 completed the causal chain from WHY 2 to WHY 5 using 5 queries across `avail_rca_v7`. The key finding: ERP blocks are **bulk, permanent, catalog-level configuration artifacts** — not individual supply chain decisions. 306 SKUs have sellable stock trapped behind blocks, with BLR ECOM2 holding 45.1 avg units per blocked SKU.

---

## Complete 5-Whys Chain

```
WHY 1: 11.1% of BLR OOS sessions have ERP_ISSUE flag (15.5% of OOS, rank #3)
    │
    ▼
WHY 2: 99.8% are opaque "ERP_ISSUE_ONLY" in ambient WHs; sub-flags explain <0.25%
       Cold-chain (COLDSTAR, IM2 COLD) = 100% deliberate ERP_TEMP_DISABLE (clean)
    │
    ▼
WHY 3: Block is catalog-level (100% uniform across all pods per WH)
       FINAL_REASON = "Not in ERP" — no further classification available
    │
    ▼
WHY 4: 97.6% structural (24+ of 30 days). 44,375 SKUs permanently blocked.
       306 SKUs have sellable stock (avg >5 units) trapped behind ERP blocks.
       BLR ECOM2 worst: 45.1 avg units per SKU rotting behind block.
    │
    ▼
WHY 5: Root cause = ERP master catalog hygiene. SKUs either never onboarded,
       delisted without cleanup, or wrong-WH-mapped. No automated reconciliation.
```

---

## Evidence Detail

### G11-A: Sub-Flag Decomposition (WHY 2)

**Query**: Sub-flag breakdown for ERP_ISSUE=1 rows across all 5 BLR WHs

| WH | ERP_ISSUE_ONLY % | ERP_TEMP_DISABLE % | Other Sub-Flags |
|----|------------------:|-------------------:|-----------------|
| BLR COLDSTAR | 0.0% | **100.0%** | All zero |
| BLR DHL | **99.78%** | 0.22% | All zero |
| BLR ECOM2 | **99.81%** | 0.19% | All zero |
| BLR IM1 | **99.76%** | 0.24% | All zero |
| BLR IM2 COLD | 0.0% | **100.0%** | All zero |

- `ERP_BLOCK_LIST`, `VINCULUM_ERROR`, `VENDOR_CODE_NOT_AVAILABLE` = **zero** across all 5 WHs
- Cold-chain WHs = 100% deliberate temp-disable (clean, expected behavior)
- Ambient WHs = 99.8% opaque residual — sub-flags do NOT decompose the root cause
- **Data boundary**: `ERP_ISSUE` is a catch-all in v7 with no granular decomposition for ambient WHs

### G11-B: Adjacent-Pod Contrast (WHY 3a)

**Query**: Are ERP blocks pod-specific or catalog-level?

| Category | SKU-WH Combos | Total Pod-Rows |
|----------|---------------|----------------|
| Uniformly ERP-blocked | 81,542 | 1,929,414 |
| Temp-disable only | 674 | 15,672 |
| Mixed (ERP + temp in different pods) | **0** | **0** |

- **Zero "mixed" SKUs exist.** When a SKU is ERP-blocked at a WH, it is blocked across ALL pods served by that WH.
- ERP_ISSUE operates at the **WH-item level** (or higher), not pod-level
- Block is applied centrally at the ERP/master-catalog layer and propagates uniformly

### G11-F: FINAL_REASON Distribution (WHY 3b)

**Query**: Does FINAL_REASON provide more granularity than flags?

| WH | FINAL_REASON | SKUs | OOS Sessions | % of WH |
|----|-------------|------|-------------|---------|
| BLR DHL | oos_2.Not in ERP | 23,351 | 30.9B | **99.94%** |
| BLR DHL | instock_1.Not in ERP | 245 | 20.0M | 0.06% |
| BLR ECOM2 | oos_2.Not in ERP | 25,759 | 66.9B | **98.78%** |
| BLR ECOM2 | instock_1.Not in ERP | 1,394 | 825.3M | **1.22%** |
| BLR IM1 | oos_2.Not in ERP | 27,775 | 36.2B | **99.17%** |
| BLR IM1 | instock_1.Not in ERP | 1,074 | 302.2M | 0.83% |

- `oos_2.Not in ERP` (98.8-99.9%): SKU not registered in ERP AND no stock at pod
- `instock_1.Not in ERP` (0.06-1.22%): **LOW-HANGING FRUIT** — physical stock exists at pod but ERP listing missing
- BLR ECOM2: **1,394 SKUs** with physical stock behind ERP blocks — largest quick-fix opportunity
- No further granularity (delisted vs never-onboarded vs wrong-WH-mapping) available in RCA framework

### G11-C: Temporal Persistence (WHY 4a)

**Query**: How many days per 30 are SKUs blocked?

| WH | 27-30d (chronic) | 24-26d (structural) | 15-23d (persistent) | 7-14d (recurring) | 1-6d (transient) |
|----|---:|---:|---:|---:|---:|
| BLR DHL | **97.27%** | 0.82% | 0.79% | 0.80% | 0.32% |
| BLR ECOM2 | **97.61%** | 0.56% | 1.10% | 0.35% | 0.39% |
| BLR IM1 | **94.54%** | 1.74% | 2.95% | 0.44% | 0.33% |

**97.6% of ERP-blocked OOS is structural (24+ of 30 days)**

### G11-C+: Stock Trapped Behind Blocks (WHY 4b — Reinforcement)

| WH | Chronic SKUs (>=24d) | OOS Sessions | Avg WH Stock Behind Block | SKUs w/ Sellable Stock (>5) | SKUs w/ High Stock (>50) |
|----|---:|---:|---:|---:|---:|
| BLR DHL | 13,663 | 30.3B | 3.8 | 7 | 0 |
| BLR ECOM2 | 13,969 | 66.5B | **45.1** | **170** | **49** |
| BLR IM1 | 19,871 | 35.2B | 11.5 | 129 | 14 |
| **Total** | **47,503** | **131.9B** | — | **306** | **63** |

- 44,375 SKUs blocked 27-30 days = essentially **permanently blocked**
- 306 SKUs have sellable stock (>5 units avg) trapped behind ERP blocks
- BLR ECOM2 worst: 45.1 avg units trapped behind blocks, 49 SKUs with >50 units
- **Reinforcement loop**: Stock accumulates behind permanent blocks → eventually expires → further disincentivizes re-enablement

---

## Scoring Rubric (Updated)

| Criterion | Weight | Before | After | Justification |
|-----------|--------|--------|-------|---------------|
| Specificity | 20% | 2 | 2 | SKU-level, WH-level, per-pod uniformity proven |
| Quantification | 25% | 2 | 2 | Sessions, SKU counts, stock units all quantified |
| Mechanism | 25% | 1 | **2** | Catalog-level block (G11-B) + permanent persistence (G11-C) + stock-behind-block reinforcement |
| Repeatability | 15% | 2 | 2 | 97.6% structural persistence across 30 days |
| Actionability | 15% | 1 | **1** | Specific actions identified but sub-cause (delisted vs never-onboarded) still unknown |
| **Total** | 100% | **8/10** | **9/10** | +1 from mechanism completion |

**Ceiling at 9/10**: Sub-flag decomposition hit data boundary. ERP audit trail (external to avail_rca_v7) needed to distinguish delisted-but-not-cleaned vs never-onboarded vs wrong-WH-mapping.

---

## Actionable Outputs

| # | Action | Owner | Impact | Priority |
|---|--------|-------|--------|----------|
| 1 | **Fix 1,394 ECOM2 `instock_1.Not in ERP` SKUs** — physical stock exists, only needs ERP listing correction | ERP Team | Quick win: 825.3M sessions recovered | Immediate |
| 2 | **Auto-alert**: ERP_ISSUE=1 AND WH_STOCK > 5 persisting > 7 days | ERP Team + Eng | Prevents future stock-behind-block accumulation | This week |
| 3 | **Audit 306 high-stock blocked SKUs**: 63 with >50 avg units — likely active products incorrectly delisted | ERP Team + Category | Prevents inventory expiry/write-off | This week |
| 4 | **Quarterly ERP reconciliation sweep**: Bulk review of 47,503 chronically blocked SKUs against WH catalog | ERP Team | 55.6% of all-band OOS volume (long-tail) | Monthly |

---

## Queries Run

| ID | Query Description | Source | Rows | Key Result |
|----|------------------|--------|------|------------|
| G11-A | Sub-flag decomposition | avail_rca_v7 | 5 WHs | 99.8% opaque residual in ambient |
| G11-B | Adjacent-pod contrast | avail_rca_v7 | 82,216 SKU-WH | 0 mixed = catalog-level |
| G11-F | FINAL_REASON distribution | avail_rca_v7 | 6 rows | 2 values only; 1,394 instock opportunities |
| G11-C | Temporal persistence | avail_rca_v7 | 15 buckets | 97.6% structural (24+ days) |
| G11-C+ | Stock behind blocks | avail_rca_v7 | 3 WHs | 306 SKUs w/ sellable stock |
