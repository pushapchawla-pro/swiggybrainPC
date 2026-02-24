# Audit & Revision Log — Bangalore Structural Analysis

**Audit Date**: 2026-02-11 | **Original Analysis Date**: 2026-02-11

Three parallel audit agents reviewed the analysis against the SOP, data consistency, and rubric scoring accuracy. This document records what the original report stated, what the audit found, and what was corrected.

---

## Audit Results Summary

```
SOP Compliance:  ~48%  (Phase 2 weakest at ~25%)
Data Issues:     7 critical, 2 moderate
Rubric Scores:   Math correct, 2 of 4 patterns misaligned with golden rubric
```

---

## Revision Log

### R1. Session Denominator Discrepancy — CRITICAL

| | Detail |
|---|---|
| **Original claim** | Pattern percentages presented as "% of city OOS" (e.g., G11 = 55.7%, C4 = 10.1%) |
| **What audit found** | Phase 0 Q1 total OOS = ~232.9B; Q2 reason-mapped total = ~23.3B. The percentages use Q2's smaller denominator. If 232.9B is the true city total, all percentages are ~10x inflated (G11 ≈ 5.6%, not 55.7%). |
| **Revision** | Added prominent caveat in executive summary and Data Caveats section. Added detailed reconciliation note in `phase0-scope-census.md`. Flagged as Tier 2.1 follow-up query. |
| **Impact on conclusions** | Relative ordering (G11 > C4 > B3 > E8) preserved. Absolute magnitudes unreliable until reconciliation query is run. |

---

### R2. E8 Reclassification — HIGH

| | Detail |
|---|---|
| **Original claim** | Pattern #4 labeled "E8: Pod Allocation Bias" — hypothesized unfair allocation logic distributing stock unevenly across pods. |
| **What audit found** | The Phase 3 validation itself disproved the allocation bias hypothesis. Lotus Biscoff trace showed WH had 741 avg stock but bottom pods got <20% avail with "fillrate Issue" as reason on 100% of days. Zero movement_design_issue days. The mechanism is WH→Pod distribution/fillrate, not allocation logic. |
| **Revision** | Renamed to "WH→Pod Distribution Bottleneck" across all files. Added golden pattern misalignment note. Added overlap caveat with C4. |
| **Impact on conclusions** | Effectively reduces distinct patterns from 4 to ~3 (E8 overlaps with C4). Action item changed from "review allocation fairness" to "investigate dispatch logistics." |

---

### R3. E8 Factual Error — HIGH

| | Detail |
|---|---|
| **Original claim** | "Store 1381969 appears across 3 different WHs — consistently in the bottom tier." |
| **What audit found** | Store 1381969 appears in exactly 1 row in the worst-pods table (BLR IM1 only). The claim of 3 WHs was fabricated. |
| **Revision** | Removed false claim. Added correction note. Replaced with accurate observation about Pod 1403746 (BLR IM2 COLD) as the clear outlier. |
| **Impact on conclusions** | None on pattern validity; the starvation finding is real. But a factual error in evidence undermines credibility. |

---

### R4. C4 Column Mislabel — HIGH

| | Detail |
|---|---|
| **Original claim** | Column labeled "SKUs <50% QFR" with values like 188,275 for HUL (which has 1,323 total SKUs). |
| **What audit found** | The values are SKU × pod × day observations, not distinct SKU counts. HUL's 188,275 = 1,323 SKUs counted across multiple pods and days. |
| **Revision** | Column renamed to "SKU-Pod-Day Obs <50% QFR". Added clarification note explaining the aggregation level. |
| **Impact on conclusions** | No change to pattern validity (fillrate issue is real). Prevents misinterpretation of scale. |

---

### R5. De-Duplication Gap — HIGH

| | Detail |
|---|---|
| **Original claim** | "Four structural patterns explain 82.7% of Bangalore's OOS sessions." |
| **What audit found** | Phase 2.4 (de-duplication) was never executed. C4 (fillrate) and E8 (also fillrate-driven) have unknown SKU overlap. The 82.7% sum likely double-counts. |
| **Revision** | Added de-duplication caveat in executive summary and Data Caveats. Changed "explain 82.7%" to "were detected" with caveat. Flagged as Tier 2.4 follow-up. |
| **Impact on conclusions** | True deduplicated coverage is unknown but likely lower than 82.7%. |

---

### R6. GMV Band Filter Gap — HIGH

| | Detail |
|---|---|
| **Original claim** | Report header stated "Scope: City-wide, Bands 1-3, 30-day window". |
| **What audit found** | No query applied a GMV band filter. All results include all bands (1-5+). |
| **Revision** | Added Scope section with declared vs. actually-applied filters. Removed "Bands 1-3" from header. Added caveat. Flagged as Tier 2.6 follow-up. |
| **Impact on conclusions** | Numbers include low-GMV long-tail SKUs that may not be business-critical. Re-running with band filter could significantly change counts. |

---

### R7. B3 SKU Count Clarification — MEDIUM

| | Detail |
|---|---|
| **Original claim** | "35K+ SKUs" implied as city-wide count. |
| **What audit found** | 35,679 at BLR DHL, 35,731 at BLR ECOM2 — these are per-WH counts. Many SKUs appear in multiple WHs. City-wide deduplicated count unknown. |
| **Revision** | Changed to "35K+ SKUs per WH (deduplicated city count unknown)". Added to Data Caveats. |
| **Impact on conclusions** | Directional — the count is still large. But presenting per-WH as city-wide overstates unique impact. |

---

### R8. G11 SKU Count Discrepancy — MEDIUM (Unresolved)

| | Detail |
|---|---|
| **Original claim** | Phase 0 shows 30,277 ERP-affected SKUs. Phase 3 shows 81,398. Both cited without reconciliation. |
| **What audit found** | 2.7x gap likely because Phase 0 counted distinct SKUs at city level while Phase 3 summed per-WH counts (same SKU in multiple WHs counted multiple times). |
| **Revision** | Added note in Section B.1 explaining the likely cause. Flagged as Tier 2.2 follow-up query. |
| **Impact on conclusions** | G11 is still the largest pattern regardless. But the actual number of unique affected SKUs is unclear. |

---

### R9. Missing SOP Phases — MEDIUM

| | Detail |
|---|---|
| **Original claim** | Methodology table stated all 5 phases were followed. Phase 4 row said "Scored all 4 patterns." |
| **What audit found** | Phase 2 was ~25% complete: owner clustering (2.2) and de-duplication (2.4) never executed. Phase 4 was scored informally but anti-pattern screen and golden pattern alignment were not documented. C5 query was never run despite Category C being active. |
| **Revision** | Created `phase4-quality-check.md` with formal anti-pattern screen, quality scoring, golden pattern alignment, and procedural gaps documentation. Updated methodology table to reference it. |
| **Impact on conclusions** | Missing C5 means the Category C investigation is incomplete. Missing de-duplication inflates the coverage claim. |

---

### R10. Missing Report Sections — MEDIUM

| | Detail |
|---|---|
| **Original state** | Report had: Executive Summary, Methodology, Key Finding, Prioritized Actions, Data Caveats, Evidence Index. |
| **What SOP requires** | Section A (exec summary), Section B (per-pattern findings), Section C (reinforcing loop), Section D (prioritized actions), Section E (monitoring recommendations). |
| **Revision** | Added Section B with structured per-pattern findings (scope, mechanism, representative examples, key lever) for all 4 patterns. Added Section E with 7 monitoring metrics including frequency, thresholds, and owners. Added Tier 2 follow-up query table. |
| **Impact on conclusions** | No change to findings. Improves operationalizability — stakeholders now have monitoring playbook. |

---

## What Changed vs. What Didn't

```
┌─ UNCHANGED (Directionally Correct) ────────────────────────────────┐
│                                                                     │
│  • Pattern ranking: G11 > C4 > B3 > E8                            │
│  • G11 is ERP flags blocking stock — real and largest              │
│  • C4 vendor fillrate is real and systemic                         │
│  • B3 MOQ/MOV trap is the best-validated finding (10/10)           │
│  • Pod-level starvation is real (though mechanism differs)         │
│  • Reinforcing loop between B3 → C4 → E8                          │
│  • All 4 prioritized actions remain correct                        │
│                                                                     │
├─ CHANGED (Quantitative Reliability) ───────────────────────────────┤
│                                                                     │
│  • Absolute percentages: unreliable until session reconciliation   │
│  • 82.7% coverage: inflated by double-counting                     │
│  • E8 mechanism: allocation bias → distribution bottleneck         │
│  • Distinct pattern count: 4 → effectively ~3 (E8 ≈ C4 variant)  │
│  • Scope: unfiltered, not Bands 1-3 as declared                   │
│  • Several per-WH counts were presented as city-wide              │
│                                                                     │
├─ ADDED (Previously Missing) ───────────────────────────────────────┤
│                                                                     │
│  • Explicit scope section with declared vs applied filters         │
│  • Phase 4 quality check (anti-pattern + golden alignment)         │
│  • Section B: per-pattern structured findings                      │
│  • Section E: monitoring recommendations with thresholds           │
│  • 6 Tier 2 follow-up queries documented                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tier 2 Revisions (SQL Query Resolution)

### R11. Session Denominator Reconciled (Tier 2.1) — RESOLVED

| | Detail |
|---|---|
| **Original caveat** | "~10x gap between Q1 (232.9B) and Q2 (23.3B). Percentages may be ~10x inflated." |
| **Query result** | JOIN drops zero sessions. Re-running Q2 with same JOIN produces ~242.9B (matching Q1). Unmatched rows = 0. The original Q2 values (~23.3B) were from stale/partial data at time of run. |
| **Revision** | Removed "~10x inflated" caveat from executive summary and Data Caveats. Updated Phase 0 evidence with reconciliation results. Confirmed all pattern percentages are correct as originally calculated. |
| **Impact** | Major — removes the biggest credibility concern. Percentages (G11 55.6%, C4 10.0%, B3 8.9%, E8 7.9%) are now confirmed. |

---

### R12. G11 SKU Count Reconciled (Tier 2.2) — RESOLVED

| | Detail |
|---|---|
| **Original caveat** | "Phase 0 shows 30,277; Phase 3 shows 81,398. 2.7x gap unexplained." |
| **Query result** | City-level dedup = 31,596 SKUs. Per-WH sum = 81,661 (2.6x ratio). Hypothesis confirmed: same SKUs appear across multiple WHs. |
| **Revision** | Updated Section B.1 with correct unique count (31,596). Removed "deduplicated city count unknown" caveat. |
| **Impact** | Medium — clarifies the correct unique SKU count for G11. |

---

### R13. C5 PO-Size Bias Screened (Tier 2.3) — RESOLVED

| | Detail |
|---|---|
| **Original gap** | "C5 query was never run despite Category C being active." |
| **Query result** | Only 2 vendors with ≥30pp cross-WH fillrate spread: Bhawar Sales (50pp: 93% ECOM2, 43% IM1) and Mars Cosmetics (40pp: 98% ECOM2, 58% IM1). |
| **Revision** | Added C5 section to Phase 1 detection results. Added to Section E monitoring. Noted as "not structural at city level." |
| **Impact** | Low — confirms C5 is not a pattern. SOP compliance improved. |

---

### R14. C4/E8 De-duplication Completed (Tier 2.4) — RESOLVED

| | Detail |
|---|---|
| **Original caveat** | "82.7% sum likely double-counts. C4/E8 overlap unknown." |
| **Query result** | BINs are mutually exclusive per row (each row has one FINAL_REASON). BIN-level sum (82.5%) is valid. Flag-level deduplicated coverage = 73.7% (179.0B of 242.9B). C4/E8 flag overlap = 38 SKUs, 240K sessions (negligible). MOVEMENT_DESIGN_ISSUE flag is essentially unused (99 SKUs). |
| **Revision** | Replaced "82.7% likely double-counts" with confirmed BIN-level (82.5%) and flag-level (73.7%) figures. Created `phase2-dedup-results.md` evidence file with full overlap matrix. |
| **Impact** | High — resolves the second biggest credibility concern. Both BIN and flag perspectives now documented. |

---

### R15. Owner Clustering Completed (Tier 2.5) — RESOLVED

| | Detail |
|---|---|
| **Original gap** | "Phase 2.2 owner clustering was implicit but not formally produced." |
| **Query result** | 23 BIN/AI_OWNER groups with per-pattern flag distributions. Top owners by OOS: ERP Team (135.1B), Procurement (24.4B + 3.0B + 2.2B + 1.4B), Planning/Cat M/Procurement (21.6B), Planning (19.3B + 4.9B). |
| **Revision** | Results available in Q6 raw data. Key insight: ERP Team owns 55.6% of all-band OOS but only 0.35% of Band 1-3. Procurement dominates Band 1-3 (C4 + OTIF + Last PO = ~35%). |
| **Impact** | Medium — confirms stakeholder routing for interventions. |

---

### R16. GMV Band 1-3 Analysis Completed (Tier 2.6) — RESOLVED

| | Detail |
|---|---|
| **Original gap** | "Report declared Bands 1-3 scope but no query applied a band filter." |
| **Query result** | Band 1-3: ~13K SKUs/WH, ~84.5% avail (+14.5pp vs all-bands). ERP Disabled drops from 55.6% to 0.16%. Fill Rate rises to 28.1% (#1). Ordering/OTIF rises to 26.0% (#2). |
| **Revision** | Created `phase0-gmv-filtered.md` with full census + reason distribution. Added GMV Priority Shift section to report. Re-ordered Prioritized Actions: C4 (#1) > B3 (#2) > G11 (#3) for business impact. Updated scope section. |
| **Impact** | **Critical** — fundamentally changes the priority order for business-critical SKUs. C4+B3 = 54.1% of Band 1-3 OOS. G11 is almost irrelevant for high-GMV items. |

---

## What Changed in Tier 2 vs Tier 1

```
┌─ TIER 2 KEY CHANGES ─────────────────────────────────────────────────┐
│                                                                       │
│  • Session denominator: CONFIRMED correct (was flagged as unreliable)│
│  • 82.5% BIN coverage: CONFIRMED valid (was flagged as inflated)     │
│  • Flag-level dedup: 73.7% (new metric, complements BIN-level)       │
│  • C4/E8 overlap: negligible (38 SKUs) — resolved                   │
│  • G11 unique SKUs: 31,596 (was ambiguous between 30K and 81K)      │
│  • C5 PO-Size Bias: not structural (2 vendors only)                 │
│  • Owner clustering: 23 groups formally documented                   │
│                                                                       │
│  ⚠ MOST IMPACTFUL FINDING:                                          │
│  Band 1-3 COMPLETELY reverses priority order.                        │
│  C4 (28.1%) + B3 (26.0%) = 54.1% of high-GMV OOS                  │
│  G11 drops from 55.6% → 0.16% for business-critical SKUs.           │
│  Action priorities re-ordered: C4 > B3 > G11 > E8                  │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Meta-Learning

1. **Don't skip the accounting phases.** Phase 2.4 (de-duplication) and Phase 0 reconciliation exist to catch silent inflation. They feel tedious but are where credibility is made or lost.

2. **Label aggregation levels explicitly.** A count of 188K that's actually SKU × pod × day observations looks like a data quality issue when the column says "SKUs." Always state the grain.

3. **Reconcile cross-phase numbers before reporting.** When Phase 0 says 30K and Phase 3 says 81K for the same metric, the report must explain why — not cite both without comment.

4. **Hypotheses can be disproved — that's a finding too.** E8's allocation bias was disproved, which is valuable. But the report should have been clearer about relabeling rather than keeping the E8 name with a footnote.

5. **Declared scope must match executed scope.** Stating "Bands 1-3" when no query filters by band is a credibility risk. Either apply the filter or state the actual scope.

6. **Always filter by business priority early.** The all-bands view makes G11 look like 56% of the problem. The Band 1-3 view shows it's 0.16%. This kind of priority inversion is invisible until you apply the business lens. Run filtered queries alongside unfiltered from the start.

7. **Stale data windows produce correct ratios but wrong absolutes.** The original Q2 was internally consistent (~10x uniformly lower) — percentages were correct but absolute values were wrong. When two queries disagree on totals, re-run both on the same date before assuming one is wrong.

8. **BIN classification vs binary flags measure different things.** A row's BIN (via FINAL_REASON) is mutually exclusive. Binary flags (WH_FILLRATE_ISSUE, etc.) are non-exclusive. Both are useful; report both perspectives.
