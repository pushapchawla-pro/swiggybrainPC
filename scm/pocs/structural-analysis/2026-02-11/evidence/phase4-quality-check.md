# Phase 4: Quality Check — Bangalore Structural Analysis

## 4.1 Anti-Pattern Screen

All 4 findings were checked against the 5 anti-pattern categories defined in the SOP.

| Finding | TOO GENERIC | TOO LOCAL | VAGUE CHRONIC | METRIC RESTATEMENT | ACTIONLESS | Verdict |
|---------|:-----------:|:---------:|:-------------:|:------------------:|:----------:|---------|
| **G11** (ERP Flags) | PASS | PASS | PASS | PASS | PASS | Clean |
| **C4** (Vendor Fillrate) | PASS | PASS | PASS | **PARTIAL** | PASS | Flagged |
| **B3** (PO/MOQ) | PASS | PASS | PASS | PASS | PASS | Clean |
| **E8** (Pod Distribution) | PASS | PASS | PASS | PASS | PASS | Clean |

### C4 Anti-Pattern Flag Detail

C4 partially matches **Anti-Pattern #9** ("Fill-rate is low for multiple vendors" without decomposing root causes). The finding identifies WHICH brands have low fillrate but not WHY (credit hold, capacity constraint, logistics failure, or deliberate delisting). The Phase 3 validation acknowledged this gap but did not decompose further. Per the SOP, this should have triggered a sub-investigation or explicit caveat before proceeding to Phase 5.

**Mitigation**: C4 is not rejected — the pattern is real and quantified — but the finding should carry a caveat that vendor sub-cause decomposition is needed before actionable interventions can be prioritized.

---

## 4.2 Quality Scoring Summary

### Original Scores (Pre-Phase 5)

| Criterion | Weight | G11 | C4 | B3 | E8 |
|-----------|--------|-----|----|----|-----|
| Specificity | 20% | 2 | 2 | 2 | 2 |
| Quantification | 25% | 2 | 2 | 2 | 2 |
| Mechanism | 25% | 1 | 1 | 2 | 1 |
| Repeatability | 15% | 2 | 1 | 2 | 1 |
| Actionability | 15% | 1 | 1 | 2 | 1 |
| **Total** | 100% | **8/10** | **7/10** | **10/10** | **7/10** |

### Updated Scores (Post-Phase 5)

| Criterion | Weight | G11 | C4 | B3 | E8 |
|-----------|--------|-----|----|----|-----|
| Specificity | 20% | 2 | 2 | 2 | 2 |
| Quantification | 25% | 2 | 2 | 2 | 2 |
| Mechanism | 25% | **2** (+1) | **2** (+1) | 2 | **2** (+1) |
| Repeatability | 15% | 2 | **2** (+1) | 2 | **2** (+1) |
| Actionability | 15% | 1 | 1 | 2 | **1.5** (+0.5) |
| **Total** | 100% | **9/10** | **9/10** | **10/10** | **9.5/10** |

**Weighted average**: 9.4/10 (was 8.0/10)

**Phase 5 improvements**:
- **G11**: +1 Mechanism — catalog-level block proven (G11-B), temporal persistence 97.6% (G11-C), stock-behind-blocks (G11-C+)
- **C4**: +1 Mechanism (appointment cancellations + vendor classification), +1 Repeatability (98.6% failure structural)
- **E8**: +1 Mechanism (94.4% RR_BLOCKED + 93.3% under-allocated), +1 Repeatability (all 5 WHs, no day-of-week), +0.5 Actionability (specific RR floor lever)

**Ceilings**: G11 at 9/10 (ERP audit trail external), C4 at 9/10 (credit/AR data external), E8 at 9.5/10 (WMS dispatch telemetry external)

See: [phase5-g11-deep-dive.md](phase5-g11-deep-dive.md), [phase5-c4-deep-dive.md](phase5-c4-deep-dive.md), [phase5-e8-deep-dive.md](phase5-e8-deep-dive.md)

---

## 4.3 Golden Pattern Alignment

| Finding | Golden Pattern | Alignment | Notes |
|---------|---------------|:---------:|-------|
| **G11** | G11: Config Flags Blocking Sellable Stock | **Aligned** | Matches definition — ERP_ISSUE flag blocking stock. Mechanism (WHY flag is set) needs deeper investigation per SOP but pattern is correctly identified. |
| **C4** | C4: Vendor-Wide Low Fillrate | **Misaligned** | Pattern C4 in the golden rubric requires investigating credit/reconciliation issues as a sub-cause. This analysis identified low fillrate but did NOT decompose into credit, capacity, or logistics causes. The finding is real but incomplete per golden C4 definition. |
| **B3** | B3: MOQ/MOV Starving Long-Tail SKUs | **Strongly Aligned** | Best match of all 4 findings. Full causal chain traced (PO calendar + MOQ trap + phantom DOH). Representative SKU (Cadbury Chocobakes) perfectly illustrates the mechanism. 4 specific levers identified. |
| **E8** | E8: Pod Allocation Bias | **Misaligned (Disproved)** | The golden E8 pattern hypothesizes unfair allocation logic distributing stock unevenly across pods. This analysis **disproved** the allocation bias hypothesis — the actual mechanism is a WH→Pod distribution/fillrate bottleneck (WH has stock but pods don't receive it). Pod-level starvation is real, but the root cause is different from E8's definition. Should be reclassified as a distribution logistics issue overlapping with C4. |

### Summary

- **2 of 4 patterns** are well-aligned with golden patterns (G11, B3)
- **1 pattern** is partially aligned but incomplete (C4 — missing sub-cause decomposition) → **Phase 5 RESOLVED**: vendor QFR classification + appointment evidence now decompose the gap
- **1 pattern** actively disproves its golden hypothesis (E8 — allocation bias not confirmed, actual cause is distribution bottleneck) → **Phase 5 RESOLVED**: E8 root cause is movement RR miscalibration (94.4% MOVEMENT_RR_BLOCKED), not fillrate/distribution as initially reclassified

---

## 4.4 Procedural Gaps — Resolution Status

All procedural gaps identified during the original analysis have been resolved via Tier 2 queries:

| SOP Step | Original Status | Resolution | Evidence |
|----------|----------------|------------|----------|
| Phase 2.2: Owner Clustering (Tier 2.5) | Not executed | **✓ Resolved** — 23 BIN/AI_OWNER groups mapped with per-pattern flag distributions | Q6 results in audit log R16 |
| Phase 2.4: De-duplication (Tier 2.4) | Not executed | **✓ Resolved** — BINs confirmed mutually exclusive (82.5% valid). Flag dedup = 73.7%. C4/E8 overlap = 38 SKUs. | [phase2-dedup-results.md](phase2-dedup-results.md) |
| Phase 1: C5 query (Tier 2.3) | Not executed | **✓ Resolved** — Only 2 vendors with ≥30pp spread. C5 is not structural. | [phase1-detection-results.md](phase1-detection-results.md) |
| GMV Band 1-3 filter (Tier 2.6) | Not applied | **✓ Resolved** — Supplementary analysis reveals priority reversal: C4 28.1%, B3 26.0%, G11 0.16% for Band 1-3. | [phase0-gmv-filtered.md](phase0-gmv-filtered.md) |
| Session reconciliation (Tier 2.1) | Discrepancy noted | **✓ Resolved** — JOIN drops zero rows. Percentages confirmed correct. | [phase0-scope-census.md](phase0-scope-census.md) |
| G11 SKU count (Tier 2.2) | Discrepancy noted | **✓ Resolved** — City dedup = 31,596. Per-WH sum = 81,661 (2.6x multi-WH overlap). | Report Section B.1 |
