# Phase 0 Supplementary: GMV Band 1-3 Filtered Census — Bangalore (30 days)

**Query Date**: 2026-02-11 | **Tier**: 2.6

## Context

The original analysis declared "Bands 1-3" scope but ran all queries without a GMV band filter. This supplementary census applies the filter via JOIN to `analytics.public.im_gmv_category_bands` (Bands 1, 2, 3 only).

**Note**: City case mismatch was encountered — GMV table uses `'Bangalore'` (title case) while RCA table uses `'BANGALORE'` (uppercase). Resolved via `UPPER()` in JOIN condition.

---

## WH-Level Census (Bands 1-3 Only)

| Warehouse | SKUs | PODs | OOS Sessions | Total Sessions | Avail % | ERP Days | Fillrate Days | MOV/MOQ Days |
|-----------|------|------|-------------|----------------|---------|----------|---------------|-------------|
| BLR ECOM2 | 12,416 | 90 | 11.9B | 82.6B | 85.62% | 16,874 | 4,502,132 | 840,436 |
| BLR IM1 | 12,617 | 50 | 10.5B | 56.1B | 81.38% | 9,817 | 3,195,408 | 364,991 |
| BLR DHL | 12,282 | 50 | 5.1B | 39.5B | 87.00% | 9,233 | 2,168,196 | 326,213 |
| BLR COLDSTAR | 472 | 89 | 790M | 5.2B | 84.80% | 0 | 312,617 | 41,572 |
| BLR IM2 COLD | 473 | 63 | 721M | 4.1B | 82.60% | 0 | 159,221 | 16,192 |
| **Total** | **~15K unique** | **150** | **29.0B** | **187.6B** | **84.54%** | **35,924** | **10.3M** | **1.6M** |

### Comparison: Unfiltered vs Band 1-3

| Metric | All Bands | Band 1-3 Only | Band 1-3 % of Total |
|--------|-----------|---------------|---------------------|
| SKUs (per largest WH) | 100,106 | 12,617 | 12.6% |
| Total OOS Sessions | 242.9B | 29.0B | 11.9% |
| Average Availability | ~70% | ~84.5% | +14.5pp better |
| ERP Issue Days | 53.3M | 35.9K | 0.07% |
| Fillrate Issue Days | 28.8M | 10.3M | 35.8% |

**Key Observation**: Band 1-3 SKUs represent ~13% of the SKU universe but only ~12% of OOS sessions, and have **14.5pp higher availability** than the full universe. High-GMV SKUs are significantly better served. ERP blocks almost exclusively affect low-GMV long-tail items.

---

## Reason Distribution (Bands 1-3 Only)

| BIN | AI_OWNER | OOS Sessions | % of Band 1-3 OOS | SKUs | PODs |
|-----|----------|-------------|-------------------|------|------|
| Fill Rate issue | Procurement | 8.13B | **28.1%** | 5,362 | 150 |
| Ordering / OTIF / Contract issue | Planning / Cat M / Procurement | 7.53B | **26.0%** | 8,794 | 150 |
| Unallocated Bin | (unassigned) | 4.05B | 14.0% | 9,743 | 150 |
| Forecast Error | Planning | 1.91B | 6.6% | 9,354 | 150 |
| Pod Missed Qty | Pod Ops / Planning | 1.80B | 6.2% | 7,853 | 130 |
| Long Term Supply issue | Cat M / Procurement | 1.23B | 4.3% | 2,440 | 150 |
| OTIF | Procurement | 868M | 3.0% | 2,460 | 150 |
| Last PO Fill Rate issue | Procurement | 784M | 2.7% | 2,073 | 150 |
| Fresh | (unassigned) | 721M | 2.5% | 194 | 150 |
| Movement_Blocking | Planning | 493M | **1.7%** | 7,608 | 150 |
| Pod Inward Delay Impact | Pod Ops | 363M | 1.3% | 7,760 | 145 |
| Warehouse Outbound Fillrate Impact | Warehouse | 250M | 0.9% | 6,691 | 150 |
| MOV/MOQ/Tonnage Constraint | Procurement | 235M | 0.8% | 975 | 150 |
| Warehouse Missed Qty | Warehouse / Planning | 180M | 0.6% | 5,308 | 139 |
| Case Size Constraint | Cat M | 155M | 0.5% | 1,269 | 150 |
| Pod_Space Issue_freezer | Pod Ops | 120M | 0.4% | 272 | 120 |
| Temp Disable | ERP Team | 53.7M | 0.19% | 357 | 150 |
| **ERP Disabled** | **ERP Team** | **45.9M** | **0.16%** | **113** | **150** |
| POD Closure | Pod Ops | 22.1M | 0.08% | 5,460 | 8 |
| WH Capacity | Warehouse / Planning | 20.1M | 0.07% | 1,283 | 5 |
| Stock Transfer Delay Issue | Warehouse | 15.9M | 0.05% | 1,831 | 131 |
| WH Putaway Delay | Warehouse | 12.1M | 0.04% | 229 | 147 |

### Priority Shift: All Bands vs Band 1-3

```
┌──────────────────────────────────────────────────────────────────┐
│                ALL BANDS              →    BAND 1-3 ONLY         │
│                                                                   │
│  #1  G11 (ERP Disabled)    55.6%     →    0.16%  (rank: #18)    │
│  #2  C4  (Fill Rate)       10.0%     →   28.1%  (rank: #1) ▲   │
│  #3  B3  (Ordering/OTIF)    8.9%     →   26.0%  (rank: #2) ▲   │
│  #4  E8  (Movement)         7.9%     →    1.7%  (rank: #10)    │
│                                                                   │
│  ⚠ For Band 1-3 SKUs, the ENTIRE priority order reverses.       │
│  G11 is almost irrelevant; C4+B3 together = 54.1% of OOS.       │
└──────────────────────────────────────────────────────────────────┘
```

### Implication for Prioritized Actions

For **business-critical (Band 1-3) SKUs**:
1. **C4 (Vendor Fill Rate)** becomes the #1 priority — 28.1% of high-GMV OOS
2. **B3 (PO Scheduling/OTIF)** is #2 — 26.0% of high-GMV OOS
3. **G11 (ERP Flags)** can be deprioritized for immediate business impact — only 113 Band 1-3 SKUs affected
4. **E8 (Movement)** is minor at 1.7%

The combined C4 + B3 (54.1%) represents the dominant lever for improving Band 1-3 availability.
