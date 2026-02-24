# Phase 2: De-duplication Results — Bangalore (30 days)

**Query Date**: 2026-02-11 | **Tier**: 2.4

## Methodology

Two de-duplication approaches were applied:

1. **BIN-level**: Each row in `sku_wise_availability_rca_with_reasons_v7` has exactly one `FINAL_REASON` → one BIN. BIN totals are mutually exclusive by row, so summing BIN percentages is valid.
2. **Flag-level**: Binary flags (`ERP_ISSUE`, `WH_FILLRATE_ISSUE`, `MOV_MOQ_TONNAGE_CONSTRAINT`, `MOVEMENT_DESIGN_ISSUE`) are non-exclusive — a single row can have multiple flags set. Flag-level de-duplication shows the true unique coverage of the 4 structural patterns.

## BIN-Level Analysis (Mutually Exclusive)

The 4 detected patterns map to these BINs (based on FINAL_REASON → BIN mapping):

| Pattern | BIN | OOS Sessions | % of City OOS |
|---------|-----|-------------|---------------|
| G11 | ERP Disabled | 135.1B | 55.6% |
| C4 | Fill Rate issue | 24.4B | 10.0% |
| B3 | Ordering / OTIF / Contract issue | 21.6B | 8.9% |
| E8 | Movement_Blocking | 19.3B | 7.9% |
| **Sum** | | **200.4B** | **82.5%** |

**Conclusion**: The 82.5% sum is NOT double-counted at the BIN level because each row has exactly one FINAL_REASON. The original "82.7% likely double-counts" caveat was incorrect for BIN-level analysis.

## Flag-Level Analysis (Non-Exclusive, Deduplicated)

```sql
-- Flags checked per row (a row can have multiple flags = 1)
-- ERP_ISSUE | ERP_TEMP_DISABLE → G11
-- WH_FILLRATE_ISSUE → C4
-- MOV_MOQ_TONNAGE_CONSTRAINT → B3
-- MOVEMENT_DESIGN_ISSUE → E8
```

### C4/E8 Overlap

| Metric | C4 Only | E8 Only | C4 ∩ E8 | Total |
|--------|---------|---------|---------|-------|
| Rows | 8,286,467 | 89 | 49 | 8,286,605 |
| SKUs | 32,398 | 99 | 38 | 32,459 |
| Sessions | 41.0B | 449K | 240K | 41.0B |

**Key finding**: C4/E8 overlap via flags is **negligible** — only 38 SKUs and 240K sessions. The `MOVEMENT_DESIGN_ISSUE` flag is essentially unused (99 total SKUs, 688K sessions city-wide). The "E8" pattern detected in Phase 1 was actually identified via the "Movement_Blocking" BIN, not the flag.

### All-Pattern Deduplicated Coverage

| Metric | Value |
|--------|-------|
| Any structural flag = 1 (deduplicated sessions) | **179.0B** |
| City total OOS sessions | **242.9B** |
| **Deduplicated coverage** | **73.7%** |
| Deduplicated unique SKUs | 64,435 |

### Per-Flag Breakdown

| Flag | SKUs | Sessions | % of City |
|------|------|----------|-----------|
| G11 (ERP_ISSUE \| ERP_TEMP_DISABLE) | 31,596 | ~135.4B | 55.7% |
| C4 (WH_FILLRATE_ISSUE) | 32,398 | 41.0B | 16.9% |
| B3 (MOV_MOQ_TONNAGE_CONSTRAINT) | 6,647 | ~2.7B | 1.1% |
| E8 (MOVEMENT_DESIGN_ISSUE) | 99 | 688K | ~0% |

### BIN vs Flag Discrepancy

The C4 **flag** (WH_FILLRATE_ISSUE) covers 41.0B sessions — significantly MORE than the C4 **BIN** (Fill Rate issue = 24.4B). This is because the WH_FILLRATE_ISSUE flag is set to 1 in rows that belong to OTHER BINs (e.g., Movement_Blocking, Long Term Supply issue, etc.). The flag indicates fillrate was a contributing factor, even when the FINAL_REASON was attributed to a different root cause.

Similarly, the B3 flag (1.1%) is much smaller than the B3 BIN (8.9%) because many rows in the "Ordering / OTIF / Contract issue" BIN don't have the MOV_MOQ_TONNAGE_CONSTRAINT flag set — they have other ordering-related final reasons.

### Interpretation

Two valid perspectives:

1. **BIN-level (82.5%)**: "These 4 reason categories account for 82.5% of all reason-mapped OOS sessions." Each session is counted exactly once under its primary reason.
2. **Flag-level (73.7%)**: "At least one of the 4 structural flags is raised for 73.7% of OOS sessions." This measures how many sessions have a structural root cause flag, regardless of which BIN they're assigned to.

Both are valid; they measure different things. The report uses BIN-level percentages for pattern sizing and flag-level for deduplicated coverage.
