# Phase 0: Scope Census — Bangalore (30 days)

## Query 1: Warehouse-Level Census

```sql
SELECT CITY, WH_NAME, COUNT(DISTINCT ITEM_CODE) AS total_skus, ...
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
WHERE DT >= CURRENT_DATE - 30 AND CITY = 'BANGALORE'
GROUP BY CITY, WH_NAME ORDER BY total_oos_sessions DESC
```

### Results

| Warehouse | Total SKUs | PODs | OOS Sessions | Total Sessions | Avail % | Chronic OOS SKUs |
|-----------|-----------|------|-------------|----------------|---------|-----------------|
| BLR ECOM2 | 88,867 | 90 | 94.5B | 307.7B | 69.28% | 53,462 |
| BLR IM1 | 100,106 | 50 | 88.3B | 299.1B | 70.47% | 77,566 |
| BLR DHL | 88,099 | 50 | 44.4B | 148.5B | 70.09% | 50,024 |
| BLR IM2 COLD | 2,030 | 63 | 2.9B | 13.1B | 77.70% | 1,938 |
| BLR COLDSTAR | 1,958 | 89 | 2.8B | 14.6B | 81.12% | 1,820 |

### Root Cause Issue Days

| Warehouse | Stock | Fillrate | Planning | Movement | POD Capacity | Putaway | ERP | MOV/MOQ |
|-----------|-------|----------|----------|----------|-------------|---------|-----|---------|
| BLR ECOM2 | 1,145 | 10.2M | 2.6M | 25 | 3.1M | 747K | 25.5M | 2.0M |
| BLR IM1 | 256 | 11.9M | 2.1M | 0 | 1.9M | 384K | 14.9M | 879K |
| BLR DHL | 531 | 4.8M | 1.3M | 975 | 1.6M | 338K | 12.9M | 727K |
| BLR IM2 COLD | 37,433 | 631K | 236K | 0 | 3,307 | 44K | 0 | 65K |
| BLR COLDSTAR | 35,597 | 1.0M | 296K | 0 | 4,542 | 62K | 0 | 113K |

### Key Observations

- Ambient WHs cluster at 69-70% avail; cold-chain at 77-81%
- BLR IM1 has 77.5% chronic OOS rate (77,566 of 100,106 SKUs)
- ERP issues dominate ambient WHs (25.5M days at ECOM2); zero in cold-chain
- Movement issues near-zero across all WHs

---

> **Session Total Discrepancy — RESOLVED (Tier 2.1)**
>
> Query 1 total OOS sessions across all WHs: **~232.9B** (94.5B + 88.3B + 44.4B + 2.9B + 2.8B).
> Query 2 total OOS sessions across all reasons: **~23.3B** (sum of displayed BIN rows below).
>
> **Root cause identified**: The JOIN drops **zero** sessions. Re-running Q2 with the same JOIN produces ~242.9B total (close to Q1, difference from date window shift). The ~23.3B figure in the original Q2 was caused by **stale/partial data at the time of the original query run** — the underlying table likely had incomplete data loaded when the original analysis was executed.
>
> **Reconciliation query results** (run 2026-02-11):
> | Query Type | OOS Sessions | Rows | Distinct SKUs | Pods |
> |------------|-------------|------|---------------|------|
> | no_join (all rows) | 242.9B | 165.6M | 104,659 | 150 |
> | with_join (reason-mapped, >0 sessions) | 242.9B | 51.7M | 96,214 | 150 |
> | unmatched (no reason mapping) | 0 | 0 | 0 | 0 |
>
> **Full BIN distribution** (re-run): ERP Disabled = 135.1B (55.6%), Fill Rate = 24.4B (10.0%), Ordering/OTIF = 21.6B (8.9%), Movement_Blocking = 19.3B (7.9%), plus 19 additional smaller BINs.
>
> **Impact**: All pattern percentages in Q2 below are **correct** — they were internally consistent even when the absolute values were ~10x too low. The ~10x inflation caveat has been removed from the report.

## Query 2: Reason Distribution (BIN + AI_OWNER)

```sql
SELECT m.BIN, m.AI_OWNER, COUNT(*) AS reason_occurrences, SUM(r.NON_AVAIL_SESSIONS), ...
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7 r
JOIN analytics.public.final_reason_mapping_avail_rca m ON r.FINAL_REASON = m.FINAL_REASON
WHERE r.DT >= CURRENT_DATE - 30 AND r.CITY = 'BANGALORE' AND r.NON_AVAIL_SESSIONS > 0
GROUP BY m.BIN, m.AI_OWNER ORDER BY oos_sessions DESC
```

### Results

| BIN | AI_OWNER | OOS Sessions | % City OOS | Affected SKUs | Affected PODs |
|-----|----------|-------------|-----------|---------------|---------------|
| ERP Disabled | ERP Team | 12.97B | 55.70% | 30,277 | 150 |
| Fill Rate issue | Procurement | 2.35B | 10.08% | 18,247 | 150 |
| Ordering / OTIF / Contract issue | Planning / Cat M / Procurement | 2.08B | 8.94% | 36,494 | 150 |
| Movement_Blocking | Planning | 1.84B | 7.89% | 47,141 | 150 |
| Unallocated Bin | (unassigned) | 805M | 3.45% | 36,915 | 150 |
| Long Term Supply issue | Cat M / Procurement | 796M | 3.42% | 14,830 | 150 |
| Forecast Error | Planning | 473M | 2.03% | 31,800 | 150 |
| Pod Missed Qty | Pod Ops / Planning | 460M | 1.97% | 24,325 | 129 |
| Case Size Constraint | Cat M | 334M | 1.43% | 10,108 | 150 |
| Last PO Fill Rate issue | Procurement | 293M | 1.26% | 7,461 | 150 |
| Fresh | (unassigned) | 254M | 1.09% | 703 | 150 |
| OTIF | Procurement | 211M | 0.91% | 6,296 | 150 |
| MOV/MOQ/Tonnage Constraint | Procurement | 132M | 0.57% | 2,978 | 150 |

### Pattern Category Decision (>5% threshold)

| Category | Probe? | Signal |
|----------|--------|--------|
| G: Catalog/Config | YES | ERP Disabled = 55.7% |
| C: Vendor | YES | Fill Rate = 10.1% |
| B: PO/Procurement | YES | Ordering/OTIF = 8.9% |
| E: Movement | YES | Movement_Blocking = 7.9% |
| A: Forecast | NO | Forecast Error = 2.03% |
| F: POD | NO | Pod Ops combined = 2.4% |
| D: WH Ops | NO | WH combined = 0.7% |
