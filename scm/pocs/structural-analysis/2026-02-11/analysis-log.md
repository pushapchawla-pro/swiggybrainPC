# Structural Availability Analysis — Bangalore

**Date**: 2026-02-11 | **Warehouses**: 5 | **Window**: 30 days

---

## Scope

| Parameter | Declared | Actually Applied |
|-----------|----------|-----------------|
| City | Bangalore | Bangalore |
| GMV Bands | 1-3 | **Primary analysis ran unfiltered** (all bands). GMV-filtered supplementary analysis now available. |
| Time Window | 30 days | 30 days (CURRENT_DATE - 30) |
| Warehouses | All Bangalore | All 5 (BLR ECOM2, BLR IM1, BLR DHL, BLR IM2 COLD, BLR COLDSTAR) |
| Data Source | sku_wise_availability_rca_with_reasons_v7 | Confirmed |
| PO Data Source | ars_uploaded_archives4 | Used for B3 + C5 |

> **GMV Band 1-3 Supplementary Analysis (Tier 2.6 — Resolved)**
>
> The primary analysis below covers **all bands** (~100K SKUs/WH, ~70% avail). A supplementary GMV Band 1-3 analysis is available at [evidence/phase0-gmv-filtered.md](evidence/phase0-gmv-filtered.md). Key finding: **Band 1-3 SKUs (~13K/WH) have ~84.5% availability (+14.5pp better)**, and the priority order completely reverses — C4 (28.1%) and B3 (26.0%) dominate, while G11 drops to 0.16%. See [GMV-Filtered Priority Shift](#gmv-band-1-3-priority-shift) below.

---

## Executive Summary

Four structural patterns were detected across Bangalore's OOS landscape. City-wide availability ranges from 69–81%. Three patterns are validated with high confidence; one was downgraded after deep-dive validation.

> **Data Notes**
>
> 1. **Session denominator reconciled (Tier 2.1 — Resolved)**: The ~10x gap between Phase 0 Q1 (~232.9B) and Q2 (~23.3B) was caused by **stale data at time of original run**, not by the JOIN dropping rows. Re-running Q2 with the same JOIN produces the same ~242.9B total. The percentages below are correct as originally calculated. See [Phase 0 evidence](evidence/phase0-scope-census.md).
>
> 2. **De-duplication completed (Tier 2.4 — Resolved)**: BINs are mutually exclusive per row (each row has one FINAL_REASON → one BIN), so the 82.5% sum is valid at the BIN level. Flag-level deduplicated coverage (any structural flag raised) is 73.7% (179.0B of 242.9B). C4/E8 flag overlap is negligible (38 SKUs). See [Phase 2 evidence](evidence/phase2-dedup-results.md).
>
> 3. **GMV Band 1-3 analysis completed (Tier 2.6 — Resolved)**: See [Scope](#scope) and [GMV-Filtered Priority Shift](#gmv-band-1-3-priority-shift).

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ALL-BANDS VIEW (100K+ SKUs/WH, ~70% avail)                           │
├─────────────────────────────────────────────────────────────────────────┤
│  #1  G11: ERP Flags Blocking Stock         55.6% of city OOS          │
│       31,596 unique SKUs (81,661 across WHs), 3 ambient WHs           │
│       29 days continuous. 209 high-demand FMCG SKUs confirmed.        │
│       Owner: ERP Team + Category                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  #2  C4: Vendor-Wide Low Fillrate         10.0% of city OOS           │
│       18K+ SKUs, 4 WHs (BLR IM1 dominant)                             │
│       Worst: Hot Wheels 91%, Mars 88%, Real 78% OOS from fillrate     │
│       Owner: Procurement                                               │
├─────────────────────────────────────────────────────────────────────────┤
│  #3  B3: PO Scheduling + MOQ/MOV          8.9% of city OOS            │
│       35K+ SKUs per WH, all 5 WHs, 957K blocked SKU-days             │
│       "Not a PO Raising Day" = 56.7% of all PO blocks                 │
│       Cadbury Chocobakes: 0 stock 19/19 days, MOQ trap confirmed      │
│       Owner: Procurement + Planning                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  #4  WH→Pod Distribution Bottleneck      7.9% of city OOS            │
│       (Originally E8: Pod Allocation Bias — DISPROVED)                │
│       47K SKUs, ~150 pods. C4/E8 flag overlap: only 38 SKUs.         │
│       Owner: Procurement (upstream) + Planning (distribution)          │
├─────────────────────────────────────────────────────────────────────────┤
│  BIN-level coverage: 82.5% │ Flag-level deduplicated: 73.7%          │
╞═════════════════════════════════════════════════════════════════════════╡
│  BAND 1-3 VIEW (13K SKUs/WH, ~84.5% avail) — PRIORITY REVERSES      │
├─────────────────────────────────────────────────────────────────────────┤
│  #1  C4: Fill Rate           28.1%  ▲ (was #2 at 10%)               │
│  #2  B3: Ordering/OTIF       26.0%  ▲ (was #3 at 8.9%)             │
│  #3  G11: ERP Disabled        0.16%  ▼ (was #1 at 55.6%)           │
│  #4  E8: Movement             1.7%  ▼ (was #4 at 7.9%)             │
├─────────────────────────────────────────────────────────────────────────┤
│  ⚠ For business-critical SKUs, C4+B3 = 54.1% of OOS.                │
│  G11 almost exclusively affects long-tail/low-GMV items.              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Methodology

Followed the [Structural Availability Analysis Workflow](../../../.claude/skills/im-availability-data-analytics/tasks/structural-availability-analysis.md) through all 5 phases:

| Phase | What | Queries Run |
|-------|------|-------------|
| **0: Scope** | Census + reason distribution | 2 queries — [evidence](evidence/phase0-scope-census.md) |
| **1: Detect** | 11 screening queries across 4 categories (G, C, B, E) | 4 queries — [evidence](evidence/phase1-detection-results.md) |
| **2: Quantify** | Impact + owner clustering | Inline with Phase 1 |
| **3: Validate** | 5 Whys + representative SKU traces | 8 queries — [G11](evidence/phase3-g11-validation.md), [C4](evidence/phase3-c4-validation.md), [B3](evidence/phase3-b3-validation.md), [E8](evidence/phase3-e8-validation.md) |
| **4: Quality** | Rubric scoring + anti-pattern screen | All 4 patterns — [evidence](evidence/phase4-quality-check.md) |

**Quality Scores**: B3 (10/10), G11 (9/10 — Phase 5 completed), C4 (9/10 — Phase 5 resolved anti-pattern #9), E8 (9.5/10 — Phase 5 identified RR miscalibration). Weighted average: 9.4/10.

---

## Key Finding: Reinforcing Loop

```
B3 (PO blocked) ──► No WH stock ──► C4 (fillrate issues amplified)
        ▲                                      │
        │                                      ▼
Lower forecast ◄── Low pod sales ◄── E8 (pods starved)

G11 operates independently — pure config flag, no supply chain link.
```

B3 and C4 reinforce each other: PO blocks reduce stock, which reduces sales, which lowers forecast, which makes POs even smaller (below MOQ). Breaking B3 (emergency PO override for DOH=0 SKUs) likely improves C4 and E8 downstream.

---

## Prioritized Actions

| # | Action | Pattern | Owner | Timeline | Impact (All Bands) | Impact (Band 1-3) |
|---|--------|---------|-------|----------|-------------------|--------------------|
| 1 | **Vendor fillrate segmentation**: Decompose top 10 failing vendors by cause (credit, capacity, logistics). Fast-track credit reconciliation | C4 | Procurement + Finance | This week | 10.0% of city OOS | **28.1% — #1 priority for high-GMV** |
| 2 | **Emergency PO override**: Bypass PO calendar + MOQ when DOH=0 for Band 1-3 SKUs. Fix phantom DOH (shows in-transit as physical stock) | B3 | Planning + Eng | 2 weeks | 8.9% of city OOS | **26.0% — #2 priority for high-GMV** |
| 3 | **ERP audit**: Review 209 high-demand blocked SKUs. Create auto-alert for ERP_ISSUE=1 + stock>0 > 7 days | G11 | ERP Team | This month | 55.6% of city OOS | 0.16% (mostly long-tail) |
| 4 | **WH→Pod distribution review**: Investigate why BLR ECOM2 has stock (741 avg) but pods get <20% avail. Focus on dispatch logistics | WH→Pod (ex-E8) | Procurement + Planning | This month | 7.9% of city OOS | 1.7% |

> **Priority re-ordering rationale**: For Band 1-3 (business-critical) SKUs, C4 + B3 = **54.1%** of OOS. G11 predominantly affects long-tail/low-GMV items. Actions 1-2 target the highest ROI for revenue impact.

---

## Data Caveats

1. **Session denominator (Resolved)**: Tier 2.1 reconciliation confirms the JOIN drops zero sessions. True city total = ~242.9B. Original Q2 showed ~23.3B due to stale data at time of run, but percentages were internally consistent. All pattern percentages are correct.
2. **De-duplication (Resolved)**: BINs are mutually exclusive (82.5% sum is valid). Flag-level deduplicated coverage = 73.7%. C4/E8 flag overlap = 38 SKUs (negligible). See [Phase 2 evidence](evidence/phase2-dedup-results.md).
3. **GMV Band filter (Resolved)**: Supplementary Band 1-3 analysis completed. Priority order reverses for high-GMV SKUs: C4 (28.1%) > B3 (26.0%) >> G11 (0.16%). See [GMV evidence](evidence/phase0-gmv-filtered.md).
4. **G11 includes correctly disabled items**: The 209 high-demand FMCG SKUs are confirmed actionable, but the remaining ~31K need manual ERP audit to separate deliberate from accidental. G11 almost exclusively affects low-GMV items (only 113 Band 1-3 SKUs).
5. **G11 SKU count (Resolved)**: City-wide deduplicated = 31,596. Per-WH sum = 81,661 (2.6x from multi-WH overlap).
6. **E8 → WH→Pod Distribution Bottleneck**: Originally hypothesized as pod allocation bias (golden E8); disproved via Lotus Biscoff trace. Actual mechanism is fillrate/distribution bottleneck. The MOVEMENT_DESIGN_ISSUE flag is essentially unused (99 SKUs); the "Movement_Blocking" BIN classification captures the actual sessions.
7. **C4 vendor sub-causes (Resolved via Phase 5)**: Originally identified WHICH brands have low fillrate but not WHY. Phase 5 resolved this: 32.4% appointment cancellation rate + vendor QFR classification (49% product-specific, 29% systemic dead, 20% selective dropout). Anti-pattern #9 no longer applies.
8. **C5 PO-Size Bias (Tier 2.3)**: Only 2 vendors detected (Bhawar Sales 50pp spread, Mars Cosmetics 40pp spread). Not a structural pattern at city level.

---

## Section B: Per-Pattern Findings

### B.1 — G11: ERP Flags Blocking Sellable Stock

| Field | Value |
|-------|-------|
| **Pattern** | G11: Config Flags Blocking Sellable Stock |
| **Category** | G: Catalog/Config |
| **Affected Entities** | 31,596 unique SKUs (81,661 across 3 ambient WHs), 150 pods |
| **OOS Sessions** | 135.1B (55.6% of city OOS) |
| **Time Pattern** | Chronic — 29 of 29 days continuous |
| **Quality Score** | 9/10 (Phase 5 updated from 8/10) |

**Mechanism**: ERP_ISSUE flag = 1 blocks sellability even when WH stock > 0. All 3 ambient WHs affected; cold-chain negligible. 209 high-demand FMCG SKUs confirmed (Cheetos, Pedigree, etc.). No automated reconciliation alert exists.

**Phase 5 Deep-Dive**: 99.8% are opaque "ERP_ISSUE_ONLY" (sub-flags explain <0.25%). Blocks are 100% catalog-level (zero cross-pod variance). 97.6% structural (24+ of 30 days). 306 SKUs with sellable stock trapped behind blocks. 1,394 ECOM2 SKUs with physical stock at pod but missing ERP listing (quick fix). See [phase5-g11-deep-dive.md](evidence/phase5-g11-deep-dive.md).

**SKU count reconciled (Tier 2.2)**: City-wide deduplicated count = 31,596. Per-WH sum = 81,661 (2.6x ratio from same SKU appearing in multiple WHs). The 31,596 is the correct unique count.

**GMV Band note**: Only 113 Band 1-3 SKUs are ERP-blocked (0.16% of Band 1-3 OOS). G11 overwhelmingly affects long-tail/low-GMV items.

**Key lever**: Auto-alert for ERP_ISSUE=1 + WH_STOCK > threshold for > 7 days.

*See [evidence](evidence/phase3-g11-validation.md)*

---

### B.2 — C4: Vendor-Wide Low Fillrate

| Field | Value |
|-------|-------|
| **Pattern** | C4: Vendor-Wide Low Fillrate |
| **Category** | C: Vendor |
| **Affected Entities** | 18,434 SKUs, 30+ vendors, 4 WHs (BLR IM1 dominant) |
| **OOS Sessions** | 24.4B (10.0% of city OOS; **28.1% of Band 1-3 OOS — #1 priority**) |
| **Time Pattern** | Chronic — systemic across 30-day window |
| **Quality Score** | 9/10 (Phase 5 updated from 7/10) |

**Mechanism**: Vendors delivering less than ordered. Worst: Hot Wheels 91%, Mars 88%, Real 78% OOS from fillrate. Amul systemic across all 4 WHs.

**Phase 5 Deep-Dive**: v7 sub-flags explain only 13.1% (86.9% unexplained). Cross-table evidence resolves the gap: 32.4% appointment cancellation rate (Mars 35-53%, 46.7% of vendor-WH pairs >30%). 98.6% of vendor-WH combos failing: 49% PRODUCT_SPECIFIC (cherry-pick SKUs), 29% SYSTEMIC_CAPACITY (dead, 0% fillrate), 20% SELECTIVE_DROPOUT (targeted gaps). Only 1.4% healthy. Root cause = vendor portfolio hygiene. See [phase5-c4-deep-dive.md](evidence/phase5-c4-deep-dive.md).

**Key lever**: Deactivate 1,806 dead vendor-WH combos. Enforce <20% appointment cancellation SLA. Assign backup vendors for selective-dropout combos.

*See [evidence](evidence/phase3-c4-validation.md)*

---

### B.3 — B3: PO Scheduling + MOQ/MOV

| Field | Value |
|-------|-------|
| **Pattern** | B3: MOQ/MOV Starving Long-Tail SKUs |
| **Category** | B: PO/Procurement |
| **Affected Entities** | 36,754 SKUs, all 5 WHs |
| **OOS Sessions** | 21.6B (8.9% of city OOS; **26.0% of Band 1-3 OOS — #2 priority**) |
| **Time Pattern** | Chronic — 957K blocked SKU-days, 56.7% from "Not a PO Raising Day" |
| **Quality Score** | 10/10 |

**Mechanism**: Two sub-patterns: (a) PO calendar has too few raising days for high-velocity SKUs; (b) low-velocity SKUs can't clear MOQ/MOV thresholds. Reinforcing loop: 0 stock → no sales → lower RR → smaller PO qty → below MOQ again. Phantom DOH masks severity (in-transit counted as physical stock).

**Representative**: Cadbury Chocobakes — 0 stock 18/19 days at BLR COLDSTAR, MOQ trap confirmed, last PO fillrate only 47%.

**Key lever**: Emergency PO override when DOH=0 for high-band SKUs; pooled POs across WHs.

*See [evidence](evidence/phase3-b3-validation.md)*

---

### B.4 — WH→Pod Distribution Bottleneck (Originally E8)

| Field | Value |
|-------|-------|
| **Pattern** | WH→Pod Distribution Bottleneck (E8 hypothesis disproved) |
| **Category** | E: Movement (reclassified) |
| **Affected Entities** | 47,553 SKUs, ~150 pods |
| **OOS Sessions** | 19.3B (7.9% of city OOS; 1.7% of Band 1-3 OOS) |
| **Time Pattern** | Chronic — binary 0/100% pod distribution |
| **Quality Score** | 9.5/10 (Phase 5 updated from 7/10) |

**Mechanism**: WH has stock but pods don't receive it. Movement replenishment system is structurally miscalibrated, allocating ~6% of demand-warranted replenishment.

**Phase 5 Deep-Dive**: MOVEMENT_RR_BLOCKED = 94.4% of movement OOS (clear dominant). 93.3% of OOS from pods with <50% movement allocation; 90.0% from <25%. Avg ratio = 0.06. All 5 WHs affected (86-95% of combos starved). No day-of-week pattern — starvation is permanent and continuous. Root cause = movement RR allocation rule structurally miscalibrated. See [phase5-e8-deep-dive.md](evidence/phase5-e8-deep-dive.md).

**De-duplication completed (Tier 2.4)**: C4/E8 flag overlap is negligible — only 38 SKUs, 240K sessions. The MOVEMENT_DESIGN_ISSUE flag is essentially unused (99 total SKUs city-wide). The "E8" sessions in this report come from the "Movement_Blocking" BIN classification, not the flag. BIN-level overlap with C4 is zero (BINs are mutually exclusive).

**Key lever**: Raise movement RR floor to ≥25% of base RR. Unblock 1.64M MOVEMENT_RR_BLOCKED rows. Fix 54K RR_NOT_GENERATED rows.

*See [evidence](evidence/phase3-e8-validation.md)*

---

*All percentages use the full city OOS denominator (~242.9B). BIN-level percentages are mutually exclusive; no double-counting.*

---

## GMV Band 1-3 Priority Shift

The Band 1-3 filtered analysis reveals that **business-critical SKUs have fundamentally different OOS drivers**:

| Pattern | All Bands (% city OOS) | Band 1-3 (% Band OOS) | Shift |
|---------|----------------------|----------------------|-------|
| G11 (ERP Disabled) | 55.6% (#1) | 0.16% (#18) | ▼ Drops entirely |
| C4 (Fill Rate) | 10.0% (#2) | 28.1% (#1) | ▲ Becomes #1 |
| B3 (Ordering/OTIF) | 8.9% (#3) | 26.0% (#2) | ▲ Becomes #2 |
| E8 (Movement) | 7.9% (#4) | 1.7% (#10) | ▼ Minor |

Band 1-3 availability is ~84.5% (vs ~70% unfiltered), with ~13K SKUs per WH (vs ~100K). Full details: [evidence/phase0-gmv-filtered.md](evidence/phase0-gmv-filtered.md).

---

## Section E: Monitoring Recommendations

| What to Monitor | Metric | Frequency | Alert Threshold | Owner |
|----------------|--------|-----------|----------------|-------|
| ERP flag + stock reconciliation | Count of SKUs with ERP_ISSUE=1 AND WH_STOCK > 5 for > 7 days | Daily | > 50 SKUs at any WH | ERP Team |
| G11 high-demand blocked SKUs | 209-SKU watchlist availability % | Daily | Any SKU < 10% avail with stock > 0 | ERP Team + Category |
| Vendor fillrate by brand (Band 1-3) | QFR_60DAYS by brand-WH, filtered to Band 1-3 SKUs | Weekly | Brand avg QFR < 50% across >= 5 SKUs | Procurement |
| PO block rate for DOH=0 SKUs | % of DOH=0 SKUs with PO_RAISE_FLAG=0 | Daily | > 20% of Band 1-3 DOH=0 SKUs blocked | Planning |
| MOQ trap recurrence | Count of SKUs stuck at PO=0 for >= 10 consecutive days | Weekly | > 100 SKUs per WH | Procurement |
| WH→Pod distribution gap | Stddev of pod-level availability within same WH for top-demand SKUs | Weekly | Stddev > 20pp for any SKU across > 10 pods | Planning |
| C5: Cross-WH fillrate spread | Vendor fillrate best-WH vs worst-WH spread | Monthly | Spread >= 30pp for vendor with >= 3 SKUs | Procurement |

### C5: PO-Size Bias — Screening Result (Tier 2.3)

Only 2 vendors detected with ≥30pp cross-WH fillrate spread:

| Vendor | WHs | Best WH | Worst WH | Spread | Breakdown |
|--------|-----|---------|----------|--------|-----------|
| Bhawar Sales Corp | 2 | 93% (BLR ECOM2, 14 SKUs) | 43% (BLR IM1, 15 SKUs) | 50pp | Possible WH-specific supply chain issue |
| Mars Cosmetics | 2 | 98% (BLR ECOM2, 20 SKUs) | 58% (BLR IM1, 91 SKUs) | 40pp | Scale-dependent — lower fill at higher SKU count |

**Conclusion**: C5 is not a structural city-level pattern. Only 2 vendors qualify. Individual vendor follow-up may be warranted but not as a systemic intervention.

### Tier 2 Follow-up Queries — Status

| Query | Status | Result |
|-------|--------|--------|
| Session total reconciliation (Tier 2.1) | **✓ Resolved** | JOIN drops zero rows. Percentages confirmed correct. |
| G11 SKU count reconciliation (Tier 2.2) | **✓ Resolved** | City dedup = 31,596. Per-WH sum = 81,661 (2.6x). |
| C5: PO-Size Bias (Tier 2.3) | **✓ Resolved** | Weak signal — only 2 vendors ≥30pp spread. |
| C4/E8 de-duplication (Tier 2.4) | **✓ Resolved** | BIN-level valid (82.5%). Flag dedup = 73.7%. Overlap = 38 SKUs. |
| Owner clustering (Tier 2.5) | **✓ Resolved** | 23 BIN/AI_OWNER groups mapped. Top: ERP Team, Procurement, Planning. |
| GMV Band 1-3 rerun (Tier 2.6) | **✓ Resolved** | Priority reverses: C4 28.1%, B3 26.0%, G11 0.16%. |

---

## Appendix: Audit & Revision Log

This report was reviewed by three parallel audit agents checking SOP compliance (~48%), data consistency (7 critical issues), and rubric alignment (2 of 4 patterns misaligned). All Tier 1 corrections have been applied in-place. The full revision log — documenting what each section originally stated, what the audit found, and what was changed — is available at:

**[audit-revision-log.md](evidence/audit-revision-log.md)**

Key takeaway: Tier 1 corrections fixed text/evidence issues. **Tier 2 queries (6 total) resolved all data gaps**. **Phase 5 (13 queries) completed full 5-Whys for C4, G11, E8** — raising weighted quality from 8.0 to 9.4/10. See [phase5-execution-log.md](evidence/phase5-execution-log.md).

---

## Evidence Index

| File | Contents |
|------|----------|
| [phase0-scope-census.md](evidence/phase0-scope-census.md) | WH-level census + reason distribution (Phase 0) |
| [phase1-detection-results.md](evidence/phase1-detection-results.md) | Detection query results for G11, C4, B3, E8 (Phase 1) |
| [phase3-g11-validation.md](evidence/phase3-g11-validation.md) | G11 WH breakdown + FMCG decomposition (Phase 3) |
| [phase3-c4-validation.md](evidence/phase3-c4-validation.md) | C4 cross-WH fillrate validation (Phase 3) |
| [phase3-b3-validation.md](evidence/phase3-b3-validation.md) | B3 PO constraint distribution + Cadbury Chocobakes trace (Phase 3) |
| [phase3-e8-validation.md](evidence/phase3-e8-validation.md) | WH→Pod distribution bottleneck + Lotus Biscoff re-validation (Phase 3) |
| [phase4-quality-check.md](evidence/phase4-quality-check.md) | Anti-pattern screen, quality scoring, golden pattern alignment (Phase 4) |
| [phase2-dedup-results.md](evidence/phase2-dedup-results.md) | De-duplication analysis: BIN vs flag overlap, C4/E8 matrix (Tier 2.4) |
| [phase0-gmv-filtered.md](evidence/phase0-gmv-filtered.md) | GMV Band 1-3 filtered census + priority shift analysis (Tier 2.6) |
| [phase5-g11-deep-dive.md](evidence/phase5-g11-deep-dive.md) | G11 complete 5-Whys: sub-flag, pod uniformity, temporal, stock-behind-blocks (Phase 5) |
| [phase5-c4-deep-dive.md](evidence/phase5-c4-deep-dive.md) | C4 complete 5-Whys: appointment cancellations, vendor QFR classification (Phase 5) |
| [phase5-e8-deep-dive.md](evidence/phase5-e8-deep-dive.md) | E8 complete 5-Whys: movement RR decomp, allocation ratio, day-of-week (Phase 5) |
| [phase5-execution-log.md](evidence/phase5-execution-log.md) | Phase 5 execution log with all query results and decision trees (Phase 5) |
| [audit-revision-log.md](evidence/audit-revision-log.md) | Full audit trail: 16 revisions with before/after + meta-learnings |
