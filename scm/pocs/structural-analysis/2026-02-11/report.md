# Bangalore Instamart: Structural OOS — 7 Systemic Issues

**Date**: 2026-02-11 | **Window**: Rolling 30 days | **City**: Bangalore | **Warehouses**: 5 | **SKUs Scanned**: 104,659

> **v2 — Feedback Incorporated (Feb 11 Leadership Review)**
>
> - **Broke 4 abstract patterns into 7 concrete systemic issues** — each with a named owner, so someone can act on it without reading evidence files
> - **Added concrete SKU/vendor examples** with item codes, warehouse names, and observable symptoms (was: pattern-level aggregates only)
> - **Added denominators and scope context** — screening coverage (5/11 patterns, with skip justifications), total SKUs scanned, Band 1-3 sub-splits
> - **Added structured 5-Whys chains** per issue (was: informal root cause paragraphs)
> - **Added per-issue lever tables** with owner, timeline, and expected impact (was: consolidated action table at bottom)
> - **Added per-issue verify sections** with SQL table/filter pointers for self-service validation
> - **Flagged ERP metric hygiene** as a known issue inflating OOS denominators — needs pipeline fix
> - **Plain-language "What's Happening"** section per issue for non-technical stakeholders

---

## Executive Summary

This report decomposes Bangalore Instamart's structural out-of-stock problem into **7 actionable systemic issues**, each with named owners, concrete SKU/vendor examples, root-cause chains, and specific fix levers.

**Scope**: 104,659 SKUs across 5 warehouses (BLR ECOM2, IM1, DHL, COLDSTAR, IM2 COLD), 150 pods, 242.9B total OOS sessions. Band 1-3 (high-GMV) subset: ~15K unique SKUs, 29.0B OOS sessions, 84.5% average availability (vs 70% all-band).

### Screening Coverage

5 structural pattern categories screened out of the 11 SOP golden patterns. Categories below 5% of city OOS were deprioritized:

| Category | Screened | Signal (% of All-Band OOS) | Skip Reason |
|----------|:--------:|----------------------------|-------------|
| G: Config/ERP flags (G11) | Yes | 55.6% | — |
| C: Vendor fillrate (C4) | Yes | 10.0% | — |
| B: PO/MOQ/MOV (B3) | Yes | 8.9% | — |
| E: Movement/distribution (E8) | Yes | 7.9% | — |
| C5: Cross-WH PO-size bias | Yes | Only 2 vendors found | Confirmed not structural |
| A: Forecast error | No | 2.0% | Below 5% threshold |
| F: POD operations | No | 2.4% combined | Below 5% threshold |
| D: Warehouse operations | No | 0.7% combined | Below 5% threshold |

### Impact Summary

| # | Systemic Issue | Source | Band 1-3 OOS | All-Band OOS | Owner | Quick Win? |
|---|----------------|--------|:------------:|:------------:|-------|:----------:|
| 1 | Missing ERP Listings | G11 | 0.16% (45.9M sessions) | 55.6% | ERP Team | Yes |
| 2 | Case Size Blocks | B3 sub | 0.5% (155M sessions) | — | Procurement / Cat M | Partial |
| 3 | PO Calendar Gaps | B3 sub | } 26.0% aggregate | } 8.9% aggregate | Planning | Yes |
| 4 | MOQ/MOV Death Spiral | B3 sub | 0.8% (235M sessions) | — | Planning + Procurement | Moderate |
| 5 | Vendor Cherry-Picking | C4 sub | } 28.1% aggregate | } 10.0% aggregate | Category | Negotiate |
| 6 | Dead Vendor Relationships | C4 sub | } | } | Procurement | Yes |
| 7 | WH→Pod Movement Starvation | E8 | 1.7% (493M sessions) | 7.9% | Planning + Eng | Yes |

*Issues 2-4 decompose B3 ("Ordering/OTIF/Contract" BIN = 26.0% of Band 1-3). Issues 5-6 decompose C4 ("Fill Rate" BIN = 28.1% of Band 1-3). Sub-issue Band 1-3 splits shown where the data supports clean separation.*

### Priority Reversal: What You Fix Depends on Which SKUs You Prioritize

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   ALL SKUs (~100K/WH, 70% avail)       HIGH-GMV ONLY (Band 1-3, 84.5%)    │
│                                                                             │
│   #1  ERP Flags       55.6%  ─────►    0.16%  (irrelevant)                │
│   #2  Vendor Fillrate 10.0%  ─────►   28.1%  (#1 priority)  ▲▲           │
│   #3  PO Scheduling    8.9%  ─────►   26.0%  (#2 priority)  ▲            │
│   #4  WH→Pod Movement  7.9%  ─────►    1.7%  (minor)                      │
│                                                                             │
│   For business-critical SKUs, vendor fillrate + PO scheduling              │
│   together cause 54% of all OOS. ERP flags are long-tail noise.            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Bottom line**: Fix vendor fill rates (Issues 5-6) and PO scheduling (Issues 3-4) to move the needle on revenue. The ERP flag problem (Issue 1) is large in volume but affects almost no high-GMV SKUs.

---

## Issue 1: Missing ERP Listings (Stock Trapped, Can't Sell)

> **Disclaimer**: This is a known metric hygiene issue. ERP-disabled SKUs (31,596 unique, 55.6% of all-band OOS) inflate the city's OOS denominator with items that were never intended to be available — predominantly delisted, seasonal, or never-onboarded long-tail SKUs. The availability metrics pipeline needs to exclude `ERP_ISSUE=1` rows from OOS session counts so that the remaining Issues 2-7 are measured against a clean denominator. Until this exclusion is applied, city-level availability figures (~70%) are artificially depressed and the relative share of actionable issues (fillrate, PO scheduling, movement) is understated.

| Metric | Value |
|--------|-------|
| SKUs affected (unique) | 31,596 |
| Band 1-3 SKUs affected | 113 |
| OOS sessions (all-band) | 135.1B (55.6% of city OOS) |
| OOS sessions (Band 1-3) | 45.9M (0.16%) |
| WHs affected | BLR ECOM2, BLR IM1, BLR DHL (all 3 ambient) |
| Duration | 97.6% blocked 24+ of 30 days |

### What's Happening

The `ERP_ISSUE` flag is set to 1, which blocks sellability even when the warehouse physically has stock. This is a **catalog-level configuration artifact** — when a SKU is blocked at a warehouse, it is blocked uniformly across all pods served by that warehouse (zero mixed-status SKUs exist). The blocks are permanent: 44,375 SKUs have been blocked for 27-30 days straight, with no automated reconciliation to detect or resolve them.

The low-hanging fruit: **1,394 SKUs at BLR ECOM2** have physical stock sitting at pods but are missing their ERP listing — fixing these requires only a catalog correction, recovering 825.3M sessions.

### Concrete Examples

| SKU / Brand | Item Code | Warehouse | What We See | Root Cause |
|-------------|-----------|-----------|-------------|------------|
| Diacraft Shubh Labh Chakri Door Sticker | 459082 | BLR ECOM2 | 0% avail, 90 pods, 29 days, 17.2 avg WH stock | ERP flag blocks sellability |
| Oye Happy Best-Tea Mug | 196263 | BLR ECOM2 | 0% avail, 90 pods, 29 days, 10.0 avg WH stock | ERP flag blocks sellability |
| Archies "Love Board" Photoframe | 71966 | BLR ECOM2 | 0% avail, 89 pods, 29 days, 42.3 avg WH stock | ERP flag blocks sellability |
| Meme Flip Phone | 668578 | BLR ECOM2 | 0% avail, 89 pods, 29 days, 88.3 avg WH stock | ERP flag blocks sellability |
| Dabur (5 SKUs blocked) | — | BLR ECOM2 | 81.2 avg stock trapped behind block | FMCG brand incorrectly delisted |
| Naturo (3 SKUs blocked) | — | BLR ECOM2 | 245.4 avg stock trapped behind block | FMCG brand incorrectly delisted |
| Cheetos, Pedigree (209 high-demand) | — | Multiple | >1M sessions each, mainstream FMCG blocked | Accidental catalog blocks |

*Source: [phase1-detection-results.md](evidence/phase1-detection-results.md), [phase3-g11-validation.md](evidence/phase3-g11-validation.md), [phase5-g11-deep-dive.md](evidence/phase5-g11-deep-dive.md)*

### Root Cause (5-Whys)

```
WHY 1: 55.6% of BLR OOS sessions have ERP_ISSUE flag set
  ↓
WHY 2: 99.8% are opaque "ERP_ISSUE_ONLY" in ambient WHs — sub-flags explain <0.25%
       Cold-chain WHs are 100% deliberate ERP_TEMP_DISABLE (clean, expected behavior)
  ↓
WHY 3: Block operates at catalog level — 100% uniform across all pods per WH.
       FINAL_REASON = "Not in ERP" — no further classification available in v7.
  ↓
WHY 4: 97.6% of blocks are structural (24+ of 30 days). 306 SKUs have sellable stock
       (avg >5 units) trapped behind blocks. BLR ECOM2 worst: 45.1 avg units rotting.
       Reinforcement: stock accumulates → expires → disincentivizes re-enablement.
  ↓
WHY 5: Root cause = ERP master catalog hygiene. SKUs either never onboarded, delisted
       without cleanup, or wrong-WH-mapped. No automated reconciliation exists.
```

### Fix

| # | Action | Owner | Timeline | Expected Impact |
|---|--------|-------|----------|-----------------|
| 1 | Fix 1,394 ECOM2 `instock_1.Not in ERP` SKUs — physical stock exists, only needs catalog correction | ERP Team | This week | 825.3M sessions recovered |
| 2 | Audit 306 high-stock blocked SKUs (63 with >50 avg units) — likely active products incorrectly delisted | ERP Team + Category | This week | Prevents inventory expiry/write-off |
| 3 | Auto-alert: `ERP_ISSUE=1 AND WH_STOCK > 5` persisting > 7 days → trigger ERP review | ERP Team + Eng | 2 weeks | Prevents future stock-behind-block buildup |
| 4 | Quarterly ERP reconciliation sweep: bulk review of 47,503 chronically blocked SKUs | ERP Team | Monthly | 55.6% of all-band OOS volume (long-tail) |

### Verify

- **Table**: `sku_wise_availability_rca_with_reasons_v7`, **Filter**: `ERP_ISSUE = 1 AND CITY = 'BANGALORE'`
- **Quick win check**: `FINAL_REASON = 'instock_1.Not in ERP' AND WH_NAME = 'BLR ECOM2'` → should return 1,394 distinct ITEM_CODEs with 825.3M total sessions
- **Stock behind blocks**: Filter `ERP_ISSUE = 1` rows, compute `AVG(WH_STOCK)` grouped by WH_NAME → ECOM2 should show 45.1 avg
- *Evidence: [phase5-g11-deep-dive.md](evidence/phase5-g11-deep-dive.md) tables G11-F, G11-C+*

---

## Issue 2: Case Size Blocks

| Metric | Value |
|--------|-------|
| SKU-days blocked (all-band) | 388,448 (alone) + 289,961 (combo w/ PO calendar) = 678,409 |
| Zero-stock SKU-days | 227,502+ (IM1: 130,484 + ECOM2: 97,018 standalone; combo adds 95,500+ at IM1) |
| Band 1-3 OOS sessions | 155M (0.5% — "Case Size Constraint" BIN) |
| Band 1-3 SKUs affected | 1,269 |
| WHs affected | BLR IM1 (worst), BLR ECOM2, BLR DHL |
| Daily demand lost | 478K units (alone) + 334K (combo) = 812K units |

### What's Happening

When a SKU's replenishment quantity falls below the vendor's minimum case size, the PO system cannot raise a purchase order. The SKU remains at zero stock until enough demand accumulates to justify a full case — but since it's OOS, no new demand accrues. BLR IM1 is the worst affected warehouse, with 171,792 case-size-blocked SKU-days (standalone) and 130,833 combo-blocked SKU-days.

Case size constraints account for **~40% of all PO blocks** when including the combo with PO calendar gaps (standalone 23.0% + combo 17.2%).

### Concrete Examples

| SKU / Brand | Item Code | Warehouse | What We See | Root Cause |
|-------------|-----------|-----------|-------------|------------|
| Madhur Sugar | — | BLR IM1 | RR=44, blocked by case size | Case qty exceeds daily demand × PO window |
| Lay's Red Chilli | — | BLR IM1 | RR=37, blocked by case size | Same |
| Snapin Chilli Flakes | — | BLR IM1 | Blocked by case size | Same |
| nlam Chocolate *(from review meeting)* | TBD | — | 336-unit case size | Case size vastly exceeds dark-store velocity |
| Whole Truth Cranberry *(from review meeting)* | TBD | — | Blocked by case size | Same — premium brand with lower velocity |
| Graves Chocolate *(from review meeting)* | TBD | — | Blocked by case size | Same |

*Source: [phase3-b3-validation.md](evidence/phase3-b3-validation.md) (Case_Size_Constraint rows), review meeting notes*

### Root Cause (5-Whys)

```
WHY 1: 678K SKU-days blocked by case size constraints across 3 ambient WHs
  ↓
WHY 2: Vendor case sizes set for general trade / modern trade volume, not dark-store velocity.
       A 336-unit case (nlam) is 8-10x what a single dark store sells in a PO window.
  ↓
WHY 3: No case-break or split-case mechanism exists in the procurement system.
       PO system treats case size as a hard constraint, not a negotiable parameter.
  ↓
WHY 4: Problem persists because case sizes are vendor-wide defaults — not adjusted per
       channel (dark store vs modern trade) or per-SKU economics.
  ↓
WHY 5: Root cause = procurement channel mismatch. Dark stores need smaller case sizes
       or a case-break facility at the warehouse level.
       Fix = negotiate dark-store-specific case sizes or enable case breaks at WH.
```

### Fix

| # | Action | Owner | Timeline | Expected Impact |
|---|--------|-------|----------|-----------------|
| 1 | Negotiate reduced case sizes for top 100 Band 1-3 SKUs blocked by case size | Procurement + Cat M | This month | Unblocks highest-value blocked SKUs |
| 2 | Enable case-break / split-case at WH level for high-velocity dark-store SKUs | Procurement + WH Ops | This quarter | Systemic fix for case size mismatch |
| 3 | Flag case-size-blocked SKUs with DOH=0 for manual override | Planning | This week | Emergency unblock for critical SKUs |

### Verify

- **Table**: `ars_uploaded_archives4`, **Filter**: `"PO Constraint Flag" = 'Case_Size_Constraint' AND CITY = 'BANGALORE'`
- **Expected**: 388,448 SKU-days (standalone); zero-stock: BLR IM1 = 130,484, BLR ECOM2 = 97,018
- **Per-WH check**: BLR IM1 should show 171,792 SKU-days standalone + 130,833 combo (highest)
- *Evidence: [phase3-b3-validation.md](evidence/phase3-b3-validation.md) aggregate summary table*

---

## Issue 3: PO Calendar Gaps

| Metric | Value |
|--------|-------|
| SKU-days blocked (all-band) | 667,292 (standalone "Not a PO Raising Day") |
| Zero-stock SKU-days | 361,853 |
| Band 1-3 OOS | Part of 26.0% "Ordering/OTIF/Contract" BIN (7.53B sessions, 8,794 SKUs) |
| WHs affected | All 3 ambient — BLR DHL worst (75.2% zero-stock ratio) |
| Daily demand lost | 3.76M units |

### What's Happening

High-velocity SKUs run out of stock between PO windows because the vendor's PO calendar has too few raising days. "Not a PO Raising Day" is the **single largest PO constraint**, accounting for 56.7% of all PO blocks (standalone + combo with case size). BLR DHL is the worst: 75.2% of its "Not a PO Day" SKU-days have zero warehouse stock — these are real stockouts, not scheduling artifacts.

The PO calendar is set per vendor (not per SKU urgency), so a vendor like ITC that has only 3 PO days per week will leave high-RR SKUs stranded on the other 4 days.

### Concrete Examples

| SKU / Brand | Item Code | Warehouse | What We See | Root Cause |
|-------------|-----------|-----------|-------------|------------|
| Supreme Harvest Salt | — | Multiple | RR=280 units/day, blocked all 19 days | No PO raising day despite high demand |
| NOICE Coconut Water | — | Multiple | RR=230 units/day, blocked all 19 days | Same |
| Tide | — | Multiple | RR=67 units/day, blocked 19 days | Same |
| NOICE Bhakarwadi | — | Multiple | Case_Size + Not PO Day combo | Dual constraint |
| ITC (vendor-level) *(from review meeting)* | — | BLR DHL | Only 3 PO days/week | High-velocity portfolio starved 4 days/week |

*Source: [phase1-detection-results.md](evidence/phase1-detection-results.md) (B3 constraint distribution), [phase3-b3-validation.md](evidence/phase3-b3-validation.md), review meeting notes*

### Root Cause (5-Whys)

```
WHY 1: 667K SKU-days blocked because "Not a PO Raising Day" — largest single PO constraint
  ↓
WHY 2: PO calendar set per vendor, not per SKU urgency. High-velocity SKUs (RR=280)
       treated identically to low-velocity (RR=2) within the same vendor.
  ↓
WHY 3: Calendar frequency was likely set for general trade fulfillment cadence,
       not for dark-store replenishment which needs daily-or-more-frequent cycles.
  ↓
WHY 4: BLR DHL 75.2% zero-stock ratio confirms these are real stockouts, not just
       scheduling noise. SKUs actually go empty between PO windows.
  ↓
WHY 5: Root cause = PO calendar frequency doesn't match dark-store replenishment velocity.
       Fix = increase PO frequency for high-RR vendors (ITC, top FMCG), or implement
       emergency PO override when DOH=0 for Band 1-3 SKUs.
```

### Fix

| # | Action | Owner | Timeline | Expected Impact |
|---|--------|-------|----------|-----------------|
| 1 | Emergency PO override: when DOH=0 for Band 1-3 SKUs, bypass PO calendar restrictions | Planning + Eng | 2 weeks | Immediately unblocks zero-stock high-GMV SKUs |
| 2 | Increase PO frequency for top 20 high-velocity vendors (ITC, etc.) to daily | Planning | This month | Reduces 667K SKU-days by estimated 40-50% |
| 3 | SKU-level urgency scoring: PO priority based on DOH and band, not just vendor calendar | Planning + Eng | This quarter | Systemic fix for calendar mismatch |

### Verify

- **Table**: `ars_uploaded_archives4`, **Filter**: `"PO Constraint Flag" = 'Not a PO Raising Day' AND CITY = 'BANGALORE'`
- **Expected**: 667,292 total SKU-days, BLR DHL = 247,295 SKU-days with 186,034 zero-stock
- **Zero-stock ratio check**: BLR DHL "Not a PO Day" rows with `WH_STOCK = 0` / total → should be ~75.2%
- *Evidence: [phase3-b3-validation.md](evidence/phase3-b3-validation.md) aggregate summary table*

---

## Issue 4: MOQ/MOV Death Spiral

| Metric | Value |
|--------|-------|
| SKU-days blocked (all-band) | MOQ: 9,698 + MOV: 32,007 + Tonnage: 11,083 = 52,788 |
| Band 1-3 OOS sessions | 235M (0.8% — "MOV/MOQ/Tonnage Constraint" BIN, 975 SKUs) |
| Representative SKU | Cadbury Chocobakes (Item 4053) — 18/19 days zero stock |
| Reinforcing loop | Confirmed: 0 stock → no sales → lower forecast → below MOQ → no PO → still 0 |
| Phantom DOH | Confirmed: system shows 39-55 DOH when physical stock = 0 |

### What's Happening

A vicious cycle traps SKUs at zero stock permanently:

```
┌──────────────────────────────────────────────────────────────────┐
│  SKU has 0 stock → no sales → forecast drops →                   │
│  PO quantity falls below MOQ → PO not raised → still 0 stock    │
│                                                                   │
│  Phantom DOH masks severity: system counts in-transit            │
│  as physical stock, so the DOH trigger shows 39-55 days          │
│  of inventory when physical stock is actually ZERO.              │
└──────────────────────────────────────────────────────────────────┘
```

While MOQ/MOV accounts for fewer SKU-days than PO calendar or case size, it is the most **self-reinforcing** pattern — once a SKU falls into this trap, it cannot escape without manual intervention because the feedback loop actively prevents recovery.

### Concrete Examples

| SKU / Brand | Item Code | Warehouse | What We See | Root Cause |
|-------------|-----------|-----------|-------------|------------|
| Cadbury Chocobakes | 4053 | BLR COLDSTAR | 0 stock 18/19 days, RR=37-49/day, MOQ all 19 days, last PO fill rate 47% | MOQ trap — one GRN (264 units Jan 22) consumed by Jan 28, then stuck at zero |
| Cadbury Chocobakes | 4053 | BLR IM2 COLD | 0 stock all 20 days, zero GRNs in 30-day window, phantom DOH 39-55 | Same SKU, worse — vendor never delivered to this WH |
| Munch Max Brownie | — | Multiple | MOQ constraint all observed days | MOQ trap |
| Red Rock Deli | — | Multiple | MOQ constraint all observed days | MOQ trap |
| D-Klog Drain Cleaner | — | Multiple | MOV constraint 19/19 days | MOV trap |
| Cadbury Chocobakes *(from review meeting)* | 4053 | — | 350-unit MOQ *(meeting figure)*, suggested cross-WH PO pooling | MOQ exceeds single-WH demand; pooling could clear threshold |

*Source: [phase3-b3-validation.md](evidence/phase3-b3-validation.md) (Cadbury Chocobakes full timeline), [phase1-detection-results.md](evidence/phase1-detection-results.md), review meeting notes*

### Root Cause (5-Whys)

```
WHY 1: SKUs stuck at zero stock with MOQ/MOV constraint active 100% of observed days
  ↓
WHY 2: Single-WH demand too low to clear vendor's MOQ/MOV threshold.
       Cadbury Chocobakes: RR=37-49 units/day but MOQ requires ~350 units per PO.
  ↓
WHY 3: MOQ thresholds are vendor-wide, not adjusted for individual SKU economics or
       dark-store channel velocity. Vendor sets MOQ for bulk distribution.
  ↓
WHY 4: Reinforcing loop makes recovery impossible without intervention:
       0 stock → no sales → RR drops → PO qty drops further below MOQ → still blocked.
       Phantom DOH (in-transit counted as physical) masks the severity from planners.
  ↓
WHY 5: Root cause = MOQ/MOV thresholds don't account for channel-specific demand.
       Fix = cross-WH PO pooling (aggregate demand across WHs to clear MOQ) +
       fix phantom DOH calculation (exclude in-transit when physical stock = 0).
```

### Fix

| # | Action | Owner | Timeline | Expected Impact |
|---|--------|-------|----------|-----------------|
| 1 | Emergency PO override when DOH=0 for Band 1-3 SKUs — bypass MOQ threshold | Planning + Eng | 2 weeks | Breaks the death spiral for high-GMV SKUs |
| 2 | Cross-WH PO pooling: aggregate demand across 3 ambient WHs to clear MOQ | Planning + Procurement | This month | Clears MOQ threshold for long-tail SKUs |
| 3 | Fix phantom DOH: exclude in-transit when physical WH stock = 0 | Eng | This month | Planners see real severity, enables faster response |
| 4 | Negotiate lower MOQ for top 50 trapped Band 1-3 SKUs | Procurement | This month | Direct unblock |

### Verify

- **Table**: `ars_uploaded_archives4`, **Filter**: `"PO Constraint Flag" IN ('MOQ Constraint', 'MOV Constraint') AND CITY = 'BANGALORE'`
- **Cadbury Chocobakes trace**: `Item_Code = '4053' AND WH_NAME = 'BLR COLDSTAR'` → 19 rows, 18 with WH_STOCK=0, MOQ constraint on all
- **Phantom DOH check**: Same filter + `WH_DOH > 10 AND WH_STOCK = 0` → confirms phantom
- *Evidence: [phase3-b3-validation.md](evidence/phase3-b3-validation.md) Cadbury Chocobakes timeline*

---

## Issue 5: Vendor Cherry-Picking (Selective SKU Abandonment)

| Metric | Value |
|--------|-------|
| Vendor-WH combos (PRODUCT_SPECIFIC) | 3,031 (49.0% of all failing combos) |
| SKUs affected | 173,138 |
| Avg fillrate | 0.248 (24.8%) |
| Band 1-3 OOS | Part of 28.1% "Fill Rate" BIN (8.13B sessions, 5,362 SKUs) |
| Also: SELECTIVE_DROPOUT combos | 1,258 (20.3%), 55,395 SKUs, avg FR 0.647 |
| WHs affected | All 5 — BLR IM1 dominates |

### What's Happening

Vendors deliver their top 1-5% best-selling SKUs and abandon the rest. HUL is the starkest example: 4,373 SKUs across 3 warehouses, with **99% at zero delivery**. They cherry-pick profitable items and ignore the long tail. Hot Wheels has 91% of its OOS driven by fillrate alone. Mars at 88%. This isn't occasional under-delivery — it's a systematic business decision by vendors to optimize their own portfolio at the expense of assortment completeness.

Separately, 1,258 SELECTIVE_DROPOUT combos (20.3%) represent good vendors (65% avg fillrate) with targeted gaps on specific items — these are easier to fix than the full cherry-picking cases.

### Concrete Examples

| SKU / Brand | Item Code | Warehouse | What We See | Root Cause |
|-------------|-----------|-----------|-------------|------------|
| HUL (4,373 SKUs) | — | ECOM2, IM1, DHL | 99% of SKUs at zero delivery, 0.44 avg QFR | Cherry-picks top sellers, abandons rest |
| Hot Wheels (197 SKUs) | — | BLR IM1 | 91.0% of OOS from fillrate, 5.2% brand avail | Vendor delivers selectively |
| Mars (196 SKUs) | — | BLR IM1 | 87.7% of OOS from fillrate, 4.6% brand avail | Same — plus 41-53% appointment cancellation |
| Real (38 SKUs) | — | BLR ECOM2 | 78.5% of OOS from fillrate, 2.8% brand avail | Vendor not delivering to this WH |
| Urban Platter (122 SKUs) | — | BLR IM1 | 78.7% of OOS from fillrate, 3.9% brand avail | Selective delivery |
| Amul | — | 4 WHs (COLDSTAR, IM2 COLD, IM1, ECOM2) | 56-69% fillrate OOS, systemic across all 4 | Vendor-level systemic failure |
| Kuber Industries (552 SKUs) | — | BLR IM1 | 69.5% of OOS from fillrate, 3.6% brand avail | Cherry-picking |

*Source: [phase3-c4-validation.md](evidence/phase3-c4-validation.md) (Top 15 brand-WH table), [phase5-c4-deep-dive.md](evidence/phase5-c4-deep-dive.md) (C4-C classification)*

### Root Cause (5-Whys)

```
WHY 1: 28.1% of Band 1-3 OOS sessions flagged for fillrate — #1 priority for high-GMV
  ↓
WHY 2: 86.9% of fillrate-flagged sessions have NO sub-flag explanation in v7.
       Sub-flags (WH_LONG_TERM_SUPPLY 10.5%, CASE_SIZE 8.1%, OTIF 3.0%) explain only 13.1%.
  ↓
WHY 3: The "unexplained" 86.9% decomposes via cross-table evidence:
       49% of vendor-WH combos are PRODUCT_SPECIFIC — vendors cherry-pick top SKUs.
       HUL delivers only top 1-5%, zeroes rest. Hot Wheels, Mars same pattern.
  ↓
WHY 4: Persists because Swiggy has no full-assortment delivery SLA with vendors.
       Vendors optimize for their own margin, not for Swiggy's assortment completeness.
       No penalty for abandoning long-tail SKUs.
  ↓
WHY 5: Root cause = vendor portfolio mismanagement — no assortment completeness metric
       in vendor contracts. Fix = negotiate full-assortment SLAs + assign backup vendors
       for dropout SKUs.
```

### Fix

| # | Action | Owner | Timeline | Expected Impact |
|---|--------|-------|----------|-----------------|
| 1 | Negotiate HUL full-assortment delivery (4,373 SKUs, 99% at zero) | Category Manager | This week | Largest single-vendor impact |
| 2 | Enforce assortment-completeness SLA in vendor contracts (minimum 80% SKU delivery rate) | Category + Procurement | This quarter | Systemic fix for cherry-picking |
| 3 | Assign backup vendors for 1,258 SELECTIVE_DROPOUT combos (targeted SKU gaps) | Procurement | This month | 55,395 SKUs with specific fill gaps |
| 4 | Weekly vendor scorecard: QFR by SKU tier, flag vendors with >50% zero-delivery SKUs | Category | This week | Visibility + accountability |

### Verify

- **Table**: `TEMP.PUBLIC.RCA_FILE_WH`, **Filter**: Compute `QFR_60DAYS` per vendor-WH, classify by thresholds (0% = SYSTEMIC_CAPACITY, <50% = PRODUCT_SPECIFIC, etc.)
- **HUL check**: Filter vendor = HUL → should show ~4,373 SKUs with 99% at zero QFR
- **Top brand-WH fillrate**: JOIN `sku_wise_availability_rca_with_reasons_v7` on `BRAND` and `WH_NAME`, filter `WH_FILLRATE_ISSUE = 1` → Hot Wheels @IM1 should show 91% fillrate-driven OOS
- *Evidence: [phase5-c4-deep-dive.md](evidence/phase5-c4-deep-dive.md) table C4-C, [phase3-c4-validation.md](evidence/phase3-c4-validation.md) top 15 table*

---

## Issue 6: Dead Vendor Relationships

| Metric | Value |
|--------|-------|
| Vendor-WH combos (SYSTEMIC_CAPACITY) | 1,806 (29.2% of all failing combos) |
| SKUs affected | 138,858 |
| Avg fillrate | 0.003 (essentially zero) |
| Orphaned "None" vendor SKUs | 31,479 (no active vendor-WH mapping) |
| Appointment cancellation rate (city-wide) | 32.4% (12,517 of 38,675 cancelled) |
| Band 1-3 OOS | Part of 28.1% "Fill Rate" BIN |
| WHs affected | All — ECOM2 worst (fashion/lifestyle brands never activated) |

### What's Happening

1,806 vendor-WH combinations have **0% fillrate over 60 days** — the vendor is listed in the system but has never delivered (or has stopped entirely). These are dead relationships inflating the catalog without providing stock. On top of this, 31,479 SKUs are mapped to vendor = "None" — orphaned items with no active supplier.

The appointment data confirms the supply-side failure: **32.4% of all Bangalore vendor appointments are cancelled** (vendor-initiated, zero no-shows). Among the worst: Mars at 35-53% cancellation, KMF/Nandini at 100%. 46.7% of vendor-WH pairs exceed the 30% failure threshold.

### Concrete Examples

| Vendor | WH | Appts (60d) | Cancelled | Cancel Rate | What We See |
|--------|-----|:-----------:|:---------:|:-----------:|-------------|
| Mars Cosmetics | BLR IM1 | 34 | 18 | **52.9%** | Vendor cancels over half of scheduled deliveries |
| Mars International (Pet) | BLR ECOM2 | 46 | 19 | **41.3%** | Same vendor group, different WH |
| Amul (GCMMF) | BLR ECOM2 | 24 | 8 | **33.3%** | Better at cold-chain (6-10%) than ambient (25-33%) |
| KMF / Nandini | BLR ECOM2 | 4 | 4 | **100%** | Zero deliveries completed |
| "None" vendor (31,479 SKUs) | ECOM2, IM1, DHL | — | — | — | SKUs with no active vendor mapping at all |
| Fashion/lifestyle brands | BLR ECOM2 | — | — | — | Listed but never activated for BLR delivery |

*Source: [phase5-c4-deep-dive.md](evidence/phase5-c4-deep-dive.md) (C4-B appointment table, C4-C classification)*

### Root Cause (5-Whys)

```
WHY 1: 1,806 vendor-WH combos at 0% fillrate + 31,479 orphaned "None" vendor SKUs
  ↓
WHY 2: 32.4% appointment cancellation rate confirms vendors are not fulfilling commitments.
       All failures are vendor-initiated cancellations (zero no-shows).
  ↓
WHY 3: Dead relationships persist because there is no automated health check.
       System keeps vendor-WH mappings active indefinitely even at 0% delivery.
  ↓
WHY 4: No vendor deactivation SLA. Vendor listed → SKU appears available in catalog →
       system tries to order → vendor doesn't deliver → repeat. Meanwhile, no backup
       vendor is assigned because the primary appears "active."
  ↓
WHY 5: Root cause = vendor lifecycle management gap. No automated deactivation for
       zero-delivery vendors. No orphan SKU detection. No appointment compliance SLA.
       Fix = deactivate dead combos + enforce <20% cancellation threshold + audit orphans.
```

### Fix

| # | Action | Owner | Timeline | Expected Impact |
|---|--------|-------|----------|-----------------|
| 1 | Deactivate 1,806 SYSTEMIC_CAPACITY vendor-WH combos (0% fillrate for 60 days) | Procurement | This week | 138,858 SKUs freed for backup vendor assignment |
| 2 | Enforce appointment compliance SLA: <20% cancellation rate (current: 32.4%) | Procurement | This month | Reduces fillrate leakage at source |
| 3 | Audit 31,479 "None" vendor orphaned SKUs — assign vendor or delist | Category + Procurement | This month | Reduces phantom catalog bloat |
| 4 | Automated health check: flag vendor-WH combos with 0% QFR for >30 days for review | Procurement + Eng | 2 weeks | Prevents future dead relationship accumulation |

### Verify

- **Table**: `TEMP.PUBLIC.RCA_FILE_WH`, **Filter**: `QFR_60DAYS = 0` grouped by VENDOR, WH → should return 1,806 combos
- **Orphan check**: Filter `VENDOR_NAME IS NULL` or `VENDOR_NAME = 'None'` → 31,479 SKUs
- **Appointment data**: `CDC.CDC_DDB.scm_fc_inbound_appointment` for BLR WHs, 60-day window → 38,675 total, 12,517 cancelled (32.4%)
- **Mars validation**: Filter Mars vendor, BLR IM1 → 34 appts, 18 cancelled (52.9%)
- *Evidence: [phase5-c4-deep-dive.md](evidence/phase5-c4-deep-dive.md) tables C4-B, C4-C*

---

## Issue 7: WH→Pod Movement Starvation

| Metric | Value |
|--------|-------|
| Dominant sub-flag | MOVEMENT_RR_BLOCKED = 94.4% (1,639,698 rows) |
| Pod-SKU combos starved (<50% allocation) | 93.3% of all movement OOS |
| Avg movement_rr / base_rr ratio | 0.06 (pods get ~6% of demand-warranted replenishment) |
| Band 1-3 OOS sessions | 493M (1.7%, 7,608 SKUs) |
| OOS sessions (all-band) | 19.3B (7.9%) |
| WHs affected | All 5 — COLDSTAR 95.4%, IM2 COLD 93.5%, ECOM2 92.9%, DHL 89.7%, IM1 86.4% |

### What's Happening

Warehouses have stock, but pods don't receive it. The replenishment system is **structurally miscalibrated**: it allocates ~6% of what demand warrants as a system-wide default. This isn't a sporadic failure — 94.4% of movement OOS is driven by `MOVEMENT_RR_BLOCKED`, and there is zero day-of-week variation (starvation is permanent and continuous across all 7 days). The top-30 worst pod-SKU combinations show avg_pod_stock = 0.0 despite the warehouse holding 11-510 units.

### Concrete Examples

| SKU / Pod | Item Code / Store ID | Warehouse | What We See | Root Cause |
|-----------|---------------------|-----------|-------------|------------|
| Lotus Biscoff Original Cookie | 406819 | BLR ECOM2 | 90 pods, 35.2% mean avail (9.6%→100% spread), WH has 741 avg stock | Bottom pods get <10% avail despite WH holding 741 units — movement starvation |
| Amul Greek Feta Cheese | 224247 | BLR ECOM2 | 89 pods, 19.7% mean avail, 0→100% spread | 0% avail at worst pods despite WH stock |
| Pod 1403746 (worst pod) | Store 1403746 | BLR IM2 COLD | 950 SKUs, 11.1% avg avail, 88.6% of SKUs <30% avail | Chronic pod-level starvation |
| 12 BLR IM1 pods | — | BLR IM1 | <0.15 units avg opening stock despite WH 120-195 units | RR blocked at pod level |

*Source: [phase3-e8-validation.md](evidence/phase3-e8-validation.md) (pod ranking, Lotus Biscoff trace), [phase5-e8-deep-dive.md](evidence/phase5-e8-deep-dive.md) (E8-A, E8-B)*

### Root Cause (5-Whys)

```
WHY 1: 7.9% of BLR OOS sessions from pod-level movement starvation (1.7% for Band 1-3)
  ↓
WHY 2: MOVEMENT_RR_BLOCKED = 94.4% of all movement OOS rows — clear dominant sub-flag.
       54,328 additional rows have RR_NOT_GENERATED (RR wasn't even created).
  ↓
WHY 3: 93.3% of ALL movement OOS from pods with <50% movement allocation ratio.
       90.0% from pods with <25% allocation. Average ratio = 0.06 (6% of demand).
       ALL 5 BLR WHs affected (86-95% of pod-SKU combos are starved).
  ↓
WHY 4: No day-of-week pattern — starvation is constant, not schedule-driven.
       Movement RRs are set at ~6% of demand as a system default, not a dynamic failure.
       Reinforcement: low allocation → low stock → low sales → lower forecast → even less allocation.
  ↓
WHY 5: Root cause = movement RR allocation rule is structurally miscalibrated.
       Fix = raise RR floor to ≥25% of base_rr (currently ~6%).
```

### Fix

| # | Action | Owner | Timeline | Expected Impact |
|---|--------|-------|----------|-----------------|
| 1 | Raise movement RR floor: set minimum movement_rr/base_rr ratio to ≥25% (currently ~6%) | Planning + Eng | This week (config) | 90% of movement OOS from <25% ratio |
| 2 | Investigate MOVEMENT_RR_BLOCKED: determine if rule misconfiguration vs physical capacity cap | Planning | This week | 1.64M blocked RR rows |
| 3 | Fix RR_NOT_GENERATED: 54,328 rows where RR wasn't created — verify planning algorithm coverage | Planning | 2 weeks | 3.1% of movement OOS |
| 4 | WH capacity audit: 42,411 WH_CAPACITY_ISSUE2 rows — check if WH outbound is physically constrained | WH Ops | This month | 2.4% of movement OOS |

### Verify

- **Table**: `sku_wise_availability_rca_with_reasons_v7`, **Filter**: `MOVEMENT_DESIGN_ISSUE = 1 AND CITY = 'BANGALORE'`
- **Sub-flag check**: Count rows by `MOVEMENT_RR_BLOCKED` → should be 1,639,698 (94.4%)
- **Ratio check**: Compute `AVG(MOVEMENT_RR / NULLIF(BASE_RR, 0))` where `MOVEMENT_DESIGN_ISSUE = 1` → should be ~0.06
- **Lotus Biscoff trace**: `ITEM_CODE = '406819' AND WH_NAME = 'BLR ECOM2'` → 90 pods, bottom 10 should show 9.6-17% avail with WH stock 741
- *Evidence: [phase5-e8-deep-dive.md](evidence/phase5-e8-deep-dive.md) tables E8-A, E8-B, [phase3-e8-validation.md](evidence/phase3-e8-validation.md)*

---

## 8. Cross-Issue Interactions

```
                    ┌──────────────────────────┐
                    │  Issue 3: PO Calendar     │
                    │  Issue 4: MOQ/MOV Spiral  │
                    └─────────┬────────────────┘
                              │ No WH stock
                              ▼
┌─────────────────────┐     ┌──────────────────────────────┐
│ Issue 5: Cherry-Pick │◄────│  Lower forecast (from zero   │
│ Issue 6: Dead Vendor │     │  sales) → smaller POs →      │
└─────────┬───────────┘     │  can't clear MOQ → stuck      │
          │                  └──────────────────────────────┘
          │ Vendor doesn't deliver
          ▼
┌─────────────────────────┐
│ Issue 7: Pod Starvation  │◄── Even when WH has stock,
│ (Movement RR blocked)    │    pods are under-allocated
└─────────────────────────┘

Issue 1 (ERP) operates INDEPENDENTLY — pure config flag, no supply chain link.
```

**Key interaction**: Issues 3-4 (PO blocks) and Issues 5-6 (vendor fillrate) form a **vicious cycle**. PO blocks reduce stock → reduces sales → lowers forecast → makes next PO smaller (below MOQ) → PO blocked again. Breaking Issue 3 (PO calendar override for DOH=0 SKUs) is expected to also improve Issues 5-6 outcomes downstream.

**C4/E8 overlap is negligible**: Only 38 SKUs have both `WH_FILLRATE_ISSUE=1` AND `MOVEMENT_DESIGN_ISSUE=1` — the two pattern populations are largely independent. *(Source: [phase2-dedup-results.md](evidence/phase2-dedup-results.md))*

---

## 9. Monitoring

Organized by owner for accountability:

### Procurement

| What | Metric | Freq | Alert Threshold |
|------|--------|:----:|-----------------|
| Vendor fillrate (Band 1-3) | QFR_60DAYS by brand-WH for Band 1-3 SKUs | Weekly | Brand avg < 50% across ≥ 5 SKUs |
| Appointment cancellation | Cancellation % from `scm_fc_inbound_appointment` | Weekly | > 30% for vendor with > 10 appts |
| Dead vendor combos | Count of vendor-WH combos with QFR_60DAYS = 0 | Monthly | Count increasing month-over-month |
| MOQ trap recurrence | SKUs at PO=0 for ≥ 10 consecutive days | Weekly | > 100 per WH |

### Planning

| What | Metric | Freq | Alert Threshold |
|------|--------|:----:|-----------------|
| PO blocks for zero-stock | % of DOH=0 Band 1-3 SKUs with PO_RAISE_FLAG=0 | Daily | > 20% |
| Movement RR ratio | Avg movement_rr / base_rr across pod-SKU combos | Daily | Avg ratio < 0.25 for any WH |
| MOVEMENT_RR_BLOCKED count | Rows with MOVEMENT_RR_BLOCKED=1 per WH | Daily | > 50K rows for any WH |
| Pod distribution gap | Stddev of pod-level avail within same WH, top-demand SKUs | Weekly | Stddev > 20pp |

### ERP Team

| What | Metric | Freq | Alert Threshold |
|------|--------|:----:|-----------------|
| ERP flag reconciliation | SKUs with ERP_ISSUE=1 AND WH_STOCK > 5 for > 7 days | Daily | > 50 per WH |
| Instock-but-blocked count | `instock_1.Not in ERP` SKUs per WH | Daily | > 100 per WH |

### Category

| What | Metric | Freq | Alert Threshold |
|------|--------|:----:|-----------------|
| Vendor health ratio | % of vendor-WH combos classified as MONITOR (healthy) | Monthly | Healthy < 5% of total combos |
| Assortment completeness | % of listed SKUs with >0 delivery in 60 days per vendor | Monthly | < 50% for any top-20 vendor |

---

## 10. Scope, Methodology & Evidence

### Scope

**City**: Bangalore | **WHs**: 5 (BLR ECOM2, IM1, DHL, COLDSTAR, IM2 COLD) | **Window**: Rolling 30 days | **Total SKUs**: 104,659 | **Total OOS Sessions**: 242.9B

Primary analysis covers all GMV bands. A supplementary Band 1-3 filtered analysis provides the revenue-weighted prioritization shown in the Impact Summary.

### Methodology

6-phase structural analysis + reconciliation, totaling ~35 Snowflake queries:

| Phase | What | Quality Score |
|-------|------|:------------:|
| 0: Scope | WH census + reason distribution + GMV filter | — |
| 1: Detect | Screening across G, C, B, E categories + C5 | — |
| 2: Quantify | BIN-level + flag-level de-duplication | — |
| 3: Validate | 5-Whys + representative SKU traces (4 patterns) | B3: 10/10 |
| 4: Quality | Anti-pattern screen + golden pattern alignment | — |
| 5: Deep-Dive | Complete 5-Whys for G11, C4, E8 (~13 queries) | G11: 9/10, C4: 9/10, E8: 9.5/10 |

**Weighted average quality score**: 9.4/10.

### Key Data Sources

| Table | Database | Used For |
|-------|----------|----------|
| `sku_wise_availability_rca_with_reasons_v7` | `ANALYTICS.PUBLIC` | All OOS session analysis, pattern detection, reason mapping |
| `final_reason_mapping_avail_rca` | `ANALYTICS.PUBLIC` | Maps FINAL_REASON → BIN/AI_OWNER |
| `im_gmv_category_bands` | `ANALYTICS.PUBLIC` | GMV band classification (city = title-case `'Bangalore'`) |
| `ars_uploaded_archives4` | `TEMP.PUBLIC` | PO constraint details, vendor fillrate (mixed-case column names) |
| `scm_fc_inbound_appointment` | `CDC.CDC_DDB` | Appointment cancellation data |
| `RCA_FILE_WH` | `TEMP.PUBLIC` | Vendor QFR classification |

**Key query parameters**: `DT >= CURRENT_DATE - 30`, `CITY = 'BANGALORE'`, `NON_AVAIL_SESSIONS > 0`.

### Verification Checklist

| Claim | How to Verify |
|-------|--------------|
| G11 = 55.6% of city OOS | Sum `NON_AVAIL_SESSIONS` where BIN = 'ERP Disabled' / city total |
| G11 unique SKUs = 31,596 | `COUNT(DISTINCT ITEM_CODE)` where `ERP_ISSUE = 1 OR ERP_TEMP_DISABLE = 1` |
| Band 1-3 G11 = 0.16% | Same query with `im_gmv_category_bands` JOIN (`UPPER(b.CITY)` for case match) |
| C4 Band 1-3 = 28.1% | BIN = 'Fill Rate issue' sessions / Band 1-3 total |
| B3 Band 1-3 = 26.0% | BIN = 'Ordering / OTIF / Contract issue' sessions / Band 1-3 total |
| E8 Band 1-3 = 1.7% | BIN = 'Movement_Blocking' sessions / Band 1-3 total |
| C4/E8 overlap = 38 SKUs | Count `ITEM_CODE` where `WH_FILLRATE_ISSUE = 1 AND MOVEMENT_DESIGN_ISSUE = 1` |
| BIN coverage = 82.5% | Sum top 4 BIN sessions / city total (BINs are mutually exclusive) |
| Flag-level dedup = 73.7% | Sessions where any of {ERP_ISSUE, WH_FILLRATE_ISSUE, MOV_MOQ_TONNAGE_CONSTRAINT, MOVEMENT_DESIGN_ISSUE} = 1 |

### Evidence Index

| File | Contents |
|------|----------|
| [phase0-scope-census.md](evidence/phase0-scope-census.md) | WH census, reason distribution, session reconciliation |
| [phase0-gmv-filtered.md](evidence/phase0-gmv-filtered.md) | Band 1-3 filtered census + priority reversal analysis |
| [phase1-detection-results.md](evidence/phase1-detection-results.md) | Detection query results for G11, C4, B3, C5, E8 |
| [phase2-dedup-results.md](evidence/phase2-dedup-results.md) | BIN vs flag dedup, C4/E8 overlap matrix |
| [phase3-g11-validation.md](evidence/phase3-g11-validation.md) | G11 per-WH breakdown + 209 high-demand FMCG SKU list |
| [phase3-c4-validation.md](evidence/phase3-c4-validation.md) | C4 cross-WH fillrate, top vendor breakdown |
| [phase3-b3-validation.md](evidence/phase3-b3-validation.md) | B3 PO constraint distribution + Cadbury Chocobakes trace |
| [phase3-e8-validation.md](evidence/phase3-e8-validation.md) | E8 disproval + Lotus Biscoff re-validation |
| [phase4-quality-check.md](evidence/phase4-quality-check.md) | Anti-pattern screen, quality scoring |
| [phase5-g11-deep-dive.md](evidence/phase5-g11-deep-dive.md) | G11 5-Whys: sub-flags, pod uniformity, persistence, stock-behind-blocks |
| [phase5-c4-deep-dive.md](evidence/phase5-c4-deep-dive.md) | C4 5-Whys: appointments, vendor QFR classification, portfolio hygiene |
| [phase5-e8-deep-dive.md](evidence/phase5-e8-deep-dive.md) | E8 5-Whys: RR decomp, allocation ratio, day-of-week |
| [phase5-execution-log.md](evidence/phase5-execution-log.md) | Phase 5 execution log with all query results |
| [audit-revision-log.md](evidence/audit-revision-log.md) | Full audit trail: 16 revisions with before/after diffs |
| [analysis-log.md](../analysis-log.md) | Original iterative report with all correction layers |
