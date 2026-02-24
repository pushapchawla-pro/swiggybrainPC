# WHY 3 Data Gap Analysis — Unblocking Incomplete 5-Whys

**Date**: 2026-02-11 | **Applies to**: C4 (Vendor Fillrate), G11 (ERP Flags), E8 (Pod Distribution)

The structural analysis completed all 5 Whys for B3 (10/10) but stopped at WHY 2-3 for three patterns. This document identifies what data exists to unblock each, what's genuinely missing, and provides ready-to-run queries.

---

## Summary

```
┌──────────┬──────────┬─────────────────────────────────────────────────────────────┐
│ Pattern  │ Score    │ WHY 3 Status                                                │
├──────────┼──────────┼─────────────────────────────────────────────────────────────┤
│ C4       │ 7/10     │ "Why do vendors under-deliver?" — 3 sub-causes listed       │
│ Fillrate │          │ (credit, capacity, logistics) but NONE investigated.        │
│          │          │ Sub-flags + appointment data exist. Partially unblockable.   │
├──────────┼──────────┼─────────────────────────────────────────────────────────────┤
│ G11      │ 8/10     │ "Why is ERP_ISSUE=1 set?" — deliberate vs accidental        │
│ ERP      │          │ unknown. Sub-flags (ERP_TEMP_DISABLE, ERP_BLOCK_LIST,       │
│          │          │ VINCULUM_ERROR) exist in same table. Fully unblockable.      │
├──────────┼──────────┼─────────────────────────────────────────────────────────────┤
│ E8       │ 7/10     │ "Why is WH→Pod dispatch unequal?" — hypothesis disproved,   │
│ Pod Dist │          │ new mechanism not decomposed. Movement sub-flags + quantity  │
│          │          │ columns exist. Mostly unblockable.                           │
└──────────┴──────────┴─────────────────────────────────────────────────────────────┘
```

---

## C4: Vendor Fillrate — WHY 3 Decomposition

### What Stopped the Analysis

The Phase 3 validation identified WHICH vendors have low fillrate (Amul across 4 WHs, Hot Wheels 91%, Mars 88%, Real 78%) but stated: *"Sub-causes not decomposed (credit, capacity, logistics)."* This was flagged as anti-pattern #9 in the quality check.

The analysis used only `WH_FILLRATE_ISSUE` from `avail_rca_v7`. It did not query the co-occurring sub-flags in the **same table**, nor did it join to appointment or PO tables.

### Data AVAILABLE — Same Table (`avail_rca_v7`)

These flags co-exist with `WH_FILLRATE_ISSUE` and can decompose vendor sub-causes:

| Flag | What It Indicates | Sub-Cause Bucket | FINAL_REASON | BIN |
|------|-------------------|------------------|--------------|-----|
| `OTB_BLOCK` | Order-to-Bill process blocked (finance/business layer) | Credit / Commercial | — | — |
| `CONTRACT_NOT_AVAILABLE` | No active vendor contract; PO cannot be raised | Commercial Block | `oos_10.contract_issue` | `Contract Issue` |
| `OTIF_ISSUE` | On-Time In-Full failure (timing or quantity miss) | Logistics / Delivery | — | — |
| `WH_LONG_TERM_SUPPLY_ISSUE` | Vendor not providing item for extended period | Capacity (sustained) | — | — |
| `CASE_SIZE_CONSTRAINT` | Ordering blocked by case-size constraint | PO Constraint (overlaps B3) | — | — |
| `WH_LAST_PO_FILLRATE_ISSUE` | Last PO specifically had low fillrate | Recent delivery failure | — | — |

**Key question to answer**: For SKUs where `WH_FILLRATE_ISSUE = 1`, which of these sub-flags ALSO = 1?

### Data AVAILABLE — Other Tables

| Data Point | Table | Column / Method | Sub-Cause |
|-----------|-------|-----------------|-----------|
| Appointment no-shows | `CDC.CDC_DDB.scm_fc_inbound_appointment` | `APPT_STATE = 'NO_SHOW'` | **Logistics** (direct evidence) |
| Appointment cancellations | `CDC.CDC_DDB.scm_fc_inbound_appointment` | `APPT_STATE = 'CANCELLED'` | **Logistics** |
| PO cancellation patterns | `VINCULUM.SWIGGY_GAMMA.PO` | `STATUS = 'CANCELLED'` + `POCANCELDATE` | **Commercial / Vendor refusal** |
| Partial delivery at PO-line level | `VINCULUM.SWIGGY_GAMMA.INBOUNDDETAIL` | `RCVDQTY` vs `EXPECTEDQTY` | **Capacity** (systematic short-ship) |
| 60-day fillrate per vendor | `TEMP.PUBLIC.RCA_FILE_WH` | `QFR_60DAYS` grouped by `VINCULUM_VENDOR_CODE` | **Capacity** (all-SKU vs specific-SKU) |
| Last PO fillrate + lead time | `TEMP.PUBLIC.ars_uploaded_archives4` | `"FR of Last PO"`, `"LT of Last PO"` | **Capacity + Logistics** |

### Data Genuinely NOT Available

| What's Missing | Why It Matters | Workaround |
|---------------|---------------|------------|
| Explicit credit hold / payment block flag | Can't definitively prove "vendor didn't deliver because Swiggy owes them money" | Infer from `OTB_BLOCK` + PO cancellation patterns |
| Vendor production capacity / schedule | Can't prove "vendor can't make enough" | Infer from all-SKU vs specific-SKU QFR pattern |
| Payment terms, AR balance, debit notes | Finance-layer data not in warehouse tables | Flag for manual investigation by Finance team |
| Vendor's own inventory levels | No visibility into supplier's stockouts | Not recoverable from Swiggy data |

### Unblocking Queries

**Query C4-A: Sub-Flag Co-occurrence with Fillrate Issue (avail_rca_v7)**

For the top 10 low-fillrate brands identified in Phase 3, decompose which sub-flags co-occur:

```sql
SELECT
    BRAND,
    WH_NAME,
    COUNT(DISTINCT ITEM_CODE) AS skus,
    SUM(NON_AVAIL_SESSIONS) AS total_oos,
    -- Sub-cause decomposition
    SUM(CASE WHEN OTB_BLOCK = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) AS otb_block_sessions,
    SUM(CASE WHEN CONTRACT_NOT_AVAILABLE = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) AS contract_na_sessions,
    SUM(CASE WHEN OTIF_ISSUE = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) AS otif_sessions,
    SUM(CASE WHEN WH_LONG_TERM_SUPPLY_ISSUE = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) AS long_term_supply_sessions,
    SUM(CASE WHEN CASE_SIZE_CONSTRAINT = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) AS case_size_sessions,
    -- Residual: fillrate issue with NO sub-flag
    SUM(CASE WHEN WH_FILLRATE_ISSUE = 1
              AND OTB_BLOCK = 0
              AND COALESCE(CONTRACT_NOT_AVAILABLE, 0) = 0
              AND COALESCE(OTIF_ISSUE, 0) = 0
              AND COALESCE(WH_LONG_TERM_SUPPLY_ISSUE, 0) = 0
         THEN NON_AVAIL_SESSIONS ELSE 0 END) AS unexplained_fillrate_sessions
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'BANGALORE'
    AND DT >= CURRENT_DATE - 30
    AND WH_FILLRATE_ISSUE = 1
    AND NON_AVAIL_SESSIONS > 0
GROUP BY BRAND, WH_NAME
ORDER BY total_oos DESC
LIMIT 30
```

**Query C4-B: Appointment No-Show / Cancellation Rate by Vendor**

For vendors with low fillrate, check if logistics failure is the root cause:

```sql
SELECT
    PARSE_JSON(a.supplier):supplier_name::STRING AS vendor_name,
    PARSE_JSON(a.third_party_attributes):vinc_attr:vendor_code::STRING AS vendor_code,
    UPPER(loc.LOCNAME) AS warehouse,
    COUNT(*) AS total_appointments,
    SUM(CASE WHEN a.appt_state = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN a.appt_state = 'NO_SHOW' THEN 1 ELSE 0 END) AS no_shows,
    SUM(CASE WHEN a.appt_state = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
    ROUND(100.0 * SUM(CASE WHEN a.appt_state IN ('NO_SHOW', 'CANCELLED') THEN 1 ELSE 0 END)
        / NULLIF(COUNT(*), 0), 1) AS failure_rate_pct
FROM CDC.CDC_DDB.scm_fc_inbound_appointment a
LEFT JOIN VINCULUM.SWIGGY_GAMMA.PO p
    ON PARSE_JSON(a.third_party_attributes):vinc_attr:po_number::STRING = p.POCODE
LEFT JOIN VINCULUM.SWIGGY_GAMMA.LOCATION loc
    ON UPPER(p.DELLOCATIONCODE) = UPPER(loc.SOURCEWH)
WHERE a.sk != 'fc_inbound_appointment'
    AND TRY_CAST(a.date AS DATE) >= CURRENT_DATE - 60
    AND UPPER(loc.LOCNAME) LIKE 'BLR%'
GROUP BY vendor_name, vendor_code, warehouse
HAVING total_appointments >= 3
ORDER BY failure_rate_pct DESC
LIMIT 30
```

**Query C4-C: Systemic vs Product-Specific Capacity (RCA_FILE_WH)**

If a vendor has low QFR across ALL SKUs → likely capacity constraint. If only specific SKUs → product-specific issue.

```sql
SELECT
    SUPPLIER_NAME,
    VINCULUM_VENDOR_CODE,
    WHNAME,
    COUNT(DISTINCT SKU) AS total_skus,
    SUM(CASE WHEN QFR_60DAYS < 0.5 THEN 1 ELSE 0 END) AS skus_below_50pct,
    SUM(CASE WHEN QFR_60DAYS = 0 THEN 1 ELSE 0 END) AS skus_zero_delivery,
    ROUND(AVG(QFR_60DAYS), 2) AS avg_fillrate,
    ROUND(STDDEV(QFR_60DAYS), 2) AS fillrate_stddev,
    -- Classification
    CASE
        WHEN AVG(QFR_60DAYS) < 0.5 AND STDDEV(QFR_60DAYS) < 0.15
            THEN 'SYSTEMIC_CAPACITY'         -- All SKUs uniformly low
        WHEN AVG(QFR_60DAYS) < 0.5 AND STDDEV(QFR_60DAYS) >= 0.15
            THEN 'PRODUCT_SPECIFIC'           -- Some SKUs fine, some not
        WHEN AVG(QFR_60DAYS) >= 0.5 AND SUM(CASE WHEN QFR_60DAYS = 0 THEN 1 ELSE 0 END) > 5
            THEN 'SELECTIVE_DROPOUT'          -- Avg OK but some zero delivery
        ELSE 'MONITOR'
    END AS vendor_pattern
FROM TEMP.PUBLIC.RCA_FILE_WH
WHERE CITY LIKE 'BANGALORE%'
    AND QFR_60DAYS IS NOT NULL
GROUP BY SUPPLIER_NAME, VINCULUM_VENDOR_CODE, WHNAME
HAVING COUNT(DISTINCT SKU) >= 5
ORDER BY avg_fillrate ASC
LIMIT 30
```

### Confidence Assessment

| Sub-Cause | Provable? | Confidence | Method |
|-----------|-----------|------------|--------|
| **Logistics failures** | Yes | **High** | Direct: APPT_STATE = NO_SHOW/CANCELLED |
| **Capacity constraints** | Partial | **Medium** | Inferred: All-SKU low QFR + low stddev = systemic |
| **Credit / commercial blocks** | Partial | **Medium** | Inferred: OTB_BLOCK flag + PO cancellations |
| **Contract issues** | Yes | **High** | Direct: CONTRACT_NOT_AVAILABLE flag + `oos_10.contract_issue` reason |
| **Vendor production data** | No | **None** | External: Vendor's own systems, not in Swiggy data |

---

## G11: ERP Flags — WHY 3 Decomposition

### What Stopped the Analysis

The Phase 3 validation identified 31,596 unique SKUs with `ERP_ISSUE = 1` across all 3 ambient warehouses, running for 29/29 days. It found 209 high-demand FMCG SKUs as candidates for urgent audit. But it never answered: **Why was the flag set?** Deliberate seasonal exit? Accidental? System bug?

The analysis used only `ERP_ISSUE` as a single aggregate flag. It did not query the more granular sub-flags in the **same table** that distinguish deliberate from accidental disablement.

### Sub-Flags Available — Same Table (`avail_rca_v7`)

| Flag | What It Indicates | Likely Cause | Relationship to ERP_ISSUE |
|------|-------------------|-------------|--------------------------|
| `ERP_ISSUE` | General ERP system issue — stock exists but item not sellable | Catch-all | Aggregate flag |
| `ERP_TEMP_DISABLE` | Item **deliberately** temporarily disabled in ERP | Seasonal exit, testing, planned hold | Mutually exclusive with `ERP_ISSUE` on most rows |
| `ERP_BLOCK_LIST` | Item on procurement block list — blocked for ordering | Deliberate procurement block (delisting, QC hold) | Can co-occur with `ERP_ISSUE` |
| `VINCULUM_ERROR` | WMS integration error (Vinculum → ERP sync failure) | System bug / data sync issue | Upstream cause — can cascade to ERP flags |
| `VENDOR_CODE_NOT_AVAILABLE` | No vendor mapped to this SKU in catalog | Catalog configuration gap | Implicit disable — can't order without vendor |

**Key insight**: These sub-flags are largely **mutually exclusive per row**, meaning a simple decomposition query will cleanly separate the 31,596 SKUs into buckets.

### Data Genuinely NOT Available

| What's Missing | Why It Matters | Workaround |
|---------------|---------------|------------|
| ERP audit trail (who set flag, when, reason) | Can't trace "user X disabled SKU Y on date Z" | Classify by sub-flag pattern instead |
| Control Room config change history | Can't check if flag was set by automated rule vs manual action | Not recoverable; flag for ERP team |
| IAS sellability state per SKU-POD | Can't confirm catalog-level vs pod-level disable | Use adjacent-pod contrast query |

### Unblocking Queries

**Query G11-A: Sub-Flag Decomposition (avail_rca_v7)**

Break the 31,596 ERP-blocked SKUs into sub-cause buckets:

```sql
SELECT
    WH_NAME,
    -- Sub-cause decomposition
    COUNT(DISTINCT CASE WHEN ERP_ISSUE = 1 AND COALESCE(ERP_TEMP_DISABLE, 0) = 0
                         AND COALESCE(ERP_BLOCK_LIST, 0) = 0
                         AND COALESCE(VINCULUM_ERROR, 0) = 0
                         AND COALESCE(VENDOR_CODE_NOT_AVAILABLE, 0) = 0
        THEN ITEM_CODE END) AS erp_issue_only_skus,
    COUNT(DISTINCT CASE WHEN ERP_TEMP_DISABLE = 1
        THEN ITEM_CODE END) AS deliberate_temp_disable_skus,
    COUNT(DISTINCT CASE WHEN ERP_BLOCK_LIST = 1
        THEN ITEM_CODE END) AS procurement_blocked_skus,
    COUNT(DISTINCT CASE WHEN VINCULUM_ERROR = 1
        THEN ITEM_CODE END) AS system_error_skus,
    COUNT(DISTINCT CASE WHEN VENDOR_CODE_NOT_AVAILABLE = 1
        THEN ITEM_CODE END) AS no_vendor_skus,
    -- Session impact per bucket
    SUM(CASE WHEN ERP_ISSUE = 1 AND COALESCE(ERP_TEMP_DISABLE, 0) = 0
              AND COALESCE(ERP_BLOCK_LIST, 0) = 0
              AND COALESCE(VINCULUM_ERROR, 0) = 0
              AND COALESCE(VENDOR_CODE_NOT_AVAILABLE, 0) = 0
         THEN NON_AVAIL_SESSIONS ELSE 0 END) AS erp_issue_only_sessions,
    SUM(CASE WHEN ERP_TEMP_DISABLE = 1
         THEN NON_AVAIL_SESSIONS ELSE 0 END) AS temp_disable_sessions,
    SUM(CASE WHEN ERP_BLOCK_LIST = 1
         THEN NON_AVAIL_SESSIONS ELSE 0 END) AS block_list_sessions,
    SUM(CASE WHEN VINCULUM_ERROR = 1
         THEN NON_AVAIL_SESSIONS ELSE 0 END) AS vinculum_error_sessions,
    SUM(CASE WHEN VENDOR_CODE_NOT_AVAILABLE = 1
         THEN NON_AVAIL_SESSIONS ELSE 0 END) AS no_vendor_sessions
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'BANGALORE'
    AND DT >= CURRENT_DATE - 30
    AND (ERP_ISSUE = 1 OR ERP_TEMP_DISABLE = 1 OR ERP_BLOCK_LIST = 1
         OR VINCULUM_ERROR = 1 OR VENDOR_CODE_NOT_AVAILABLE = 1)
    AND NON_AVAIL_SESSIONS > 0
GROUP BY WH_NAME
ORDER BY WH_NAME
```

**Query G11-B: Adjacent-Pod Contrast (Same SKU, Same WH — Some Sellable, Some Not)**

Confirms whether the block is per-SKU or per-SKU-per-POD:

```sql
WITH sku_pod_status AS (
    SELECT
        ITEM_CODE,
        PRODUCT_NAME,
        WH_NAME,
        STORE_ID,
        MAX(ERP_ISSUE) AS has_erp_issue,
        MAX(WH_STOCK) AS max_wh_stock,
        SUM(AVAIL_SESSIONS) * 100.0 / NULLIF(SUM(TOTAL_SESSIONS), 0) AS avail_pct
    FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
    WHERE CITY = 'BANGALORE'
        AND DT >= CURRENT_DATE - 7
        AND (ERP_ISSUE = 1 OR ERP_TEMP_DISABLE = 1)
    GROUP BY ITEM_CODE, PRODUCT_NAME, WH_NAME, STORE_ID
)
SELECT
    ITEM_CODE,
    PRODUCT_NAME,
    WH_NAME,
    COUNT(DISTINCT STORE_ID) AS total_pods,
    SUM(CASE WHEN has_erp_issue = 1 THEN 1 ELSE 0 END) AS pods_with_erp_block,
    SUM(CASE WHEN has_erp_issue = 0 THEN 1 ELSE 0 END) AS pods_without_erp_block,
    MAX(max_wh_stock) AS wh_stock,
    ROUND(AVG(avail_pct), 1) AS avg_avail_pct
FROM sku_pod_status
GROUP BY ITEM_CODE, PRODUCT_NAME, WH_NAME
HAVING pods_with_erp_block > 0 AND pods_without_erp_block > 0  -- Mixed: some pods blocked, some not
ORDER BY total_pods DESC
LIMIT 20
```

### Confidence Assessment

| Sub-Cause | Provable? | Confidence | Method |
|-----------|-----------|------------|--------|
| **Deliberate temporary disable** | Yes | **High** | Direct: `ERP_TEMP_DISABLE = 1` flag |
| **Procurement block / delisting** | Yes | **High** | Direct: `ERP_BLOCK_LIST = 1` flag |
| **System integration error** | Yes | **High** | Direct: `VINCULUM_ERROR = 1` flag |
| **Missing vendor mapping** | Yes | **High** | Direct: `VENDOR_CODE_NOT_AVAILABLE = 1` flag |
| **Residual ERP_ISSUE (no sub-flag)** | Partial | **Medium** | After excluding all sub-flags — remaining are "unexplained ERP blocks" needing manual ERP audit |
| **Per-pod vs per-SKU block distinction** | Yes | **High** | Adjacent-pod contrast query (G11-B) |

---

## E8: Pod Distribution — WHY 3 Decomposition

### What Stopped the Analysis

The original E8 hypothesis (Pod Allocation Bias — unfair algorithm distributes stock unevenly) was **disproved**. The Lotus Biscoff trace showed WH had 741 units avg stock, but bottom 30 pods had <20% availability. The reason on 100% of OOS days was `fillrate Issue`, not `movement_design_issue`. The `MOVEMENT_DESIGN_ISSUE` flag was triggered for only 99 SKUs city-wide.

The analysis correctly reclassified this as "WH→Pod Distribution Bottleneck" but did not decompose WHY dispatch is unequal. It used `FINAL_REASON` and `MOVEMENT_DESIGN_ISSUE` but did not query the other 4 movement sub-flags or the quantity columns in the **same table**.

### Movement Sub-Flags Available — Same Table (`avail_rca_v7`)

| Flag | What It Indicates | Sub-Cause | Status in Current Analysis |
|------|-------------------|-----------|---------------------------|
| `MOVEMENT_DESIGN_ISSUE` | Allocation logic problem | Algorithm error | Checked — essentially unused (99 SKUs) |
| `MOVEMENT_SETTING_ISSUE` | Movement settings misconfigured | Config error | **NOT CHECKED** |
| `MOVEMENT_RR_NOT_GENERATED` | No run rate generated for movement | Forecast gap | **NOT CHECKED** |
| `MOVEMENT_RR_BLOCKED` | Movement run rate exists but is blocked/capped | Movement cap | **NOT CHECKED** |
| `WH_CAPACITY_ISSUE2` | WH outbound capacity constraint | Throughput limit | **NOT CHECKED** |
| `PLANNING_ISSUE` | General planning quantity insufficient | Demand-supply mismatch | **NOT CHECKED for E8 specifically** |

### Quantity Columns Available — Same Table (`avail_rca_v7`)

| Column | What It Tracks | Diagnostic Use |
|--------|---------------|---------------|
| `TRANSFER_QTY` | Qty raised for WH→Pod transfer | If high but pod still OOS → transfer raised but not fulfilled |
| `INTRANSIT_QTY` | Qty in transit from WH to Pod | If >0 but pod OOS → dispatch delay, not allocation |
| `POD_OPENING_STOCK_T_DAY` | Pod stock at start of day | Compare across pods for same SKU → distribution inequality |
| `BASE_RR` | Daily sales velocity | If `MOVEMENT_RR < BASE_RR`, pod will structurally starve |
| `MOVEMENT_RR` | Planned movement run rate | Compare to `BASE_RR` — gap = planning under-allocation |
| `POD_STOCK_T2` | Projected pod stock at T+2 | Forecast vs actual — gap = movement didn't arrive |

### Data Genuinely NOT Available

| What's Missing | Why It Matters | Workaround |
|---------------|---------------|------------|
| Dispatch route optimization data | Can't prove "pod X is on a less-frequent route" | Use pod-level transfer frequency as proxy |
| Pod-level inbound scheduling | Can't trace "pod X receives shipments on Tues/Fri only" | Analyze `INTRANSIT_QTY` patterns by day-of-week |
| WMS dispatch system telemetry | Can't see individual vehicle assignments | Not recoverable from analytics tables |
| Pod tier/cluster in avail_rca_v7 | Can't test "small pods get less stock" without joining | Join to `swiggykms.swiggy_kms.stores` for locality/area |

### Unblocking Queries

**Query E8-A: Movement Sub-Flag Decomposition for Starved Pods**

For pods with high WH stock but low pod availability, which movement sub-flag is active?

```sql
SELECT
    STORE_ID,
    WH_NAME,
    COUNT(DISTINCT ITEM_CODE) AS skus,
    SUM(NON_AVAIL_SESSIONS) AS total_oos,
    AVG(WH_STOCK) AS avg_wh_stock,
    -- Movement sub-flags
    SUM(CASE WHEN MOVEMENT_DESIGN_ISSUE = 1 THEN 1 ELSE 0 END) AS movement_design_rows,
    SUM(CASE WHEN MOVEMENT_SETTING_ISSUE = 1 THEN 1 ELSE 0 END) AS movement_setting_rows,
    SUM(CASE WHEN MOVEMENT_RR_NOT_GENERATED = 1 THEN 1 ELSE 0 END) AS movement_rr_missing_rows,
    SUM(CASE WHEN MOVEMENT_RR_BLOCKED = 1 THEN 1 ELSE 0 END) AS movement_rr_blocked_rows,
    SUM(CASE WHEN WH_CAPACITY_ISSUE2 = 1 THEN 1 ELSE 0 END) AS wh_capacity_rows,
    SUM(CASE WHEN PLANNING_ISSUE = 1 THEN 1 ELSE 0 END) AS planning_issue_rows,
    -- Transfer analysis
    AVG(TRANSFER_QTY) AS avg_transfer_qty,
    AVG(INTRANSIT_QTY) AS avg_intransit_qty,
    AVG(POD_OPENING_STOCK_T_DAY) AS avg_pod_opening_stock
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'BANGALORE'
    AND DT >= CURRENT_DATE - 30
    AND WH_STOCK > 10                  -- WH has stock
    AND NON_AVAIL_SESSIONS > 0         -- But pod is OOS
GROUP BY STORE_ID, WH_NAME
HAVING AVG(WH_STOCK) > 10
ORDER BY total_oos DESC
LIMIT 30
```

**Query E8-B: Movement RR vs Base RR (Under-Allocation Detection)**

Confirms whether pods are structurally under-allocated relative to demand:

```sql
SELECT
    STORE_ID,
    WH_NAME,
    ITEM_CODE,
    PRODUCT_NAME,
    AVG(BASE_RR) AS avg_demand_rr,
    AVG(MOVEMENT_RR) AS avg_movement_rr,
    ROUND(AVG(MOVEMENT_RR) / NULLIF(AVG(BASE_RR), 0), 2) AS movement_to_demand_ratio,
    AVG(WH_STOCK) AS avg_wh_stock,
    AVG(POD_OPENING_STOCK_T_DAY) AS avg_pod_stock,
    SUM(NON_AVAIL_SESSIONS) AS total_oos
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'BANGALORE'
    AND DT >= CURRENT_DATE - 14
    AND WH_STOCK > 10
    AND NON_AVAIL_SESSIONS > 0
    AND BASE_RR > 0
GROUP BY STORE_ID, WH_NAME, ITEM_CODE, PRODUCT_NAME
HAVING AVG(MOVEMENT_RR) / NULLIF(AVG(BASE_RR), 0) < 0.5  -- Movement < 50% of demand
ORDER BY total_oos DESC
LIMIT 30
```

### Confidence Assessment

| Sub-Cause | Provable? | Confidence | Method |
|-----------|-----------|------------|--------|
| **Movement RR not generated** | Yes | **High** | Direct: `MOVEMENT_RR_NOT_GENERATED = 1` flag |
| **Movement RR blocked/capped** | Yes | **High** | Direct: `MOVEMENT_RR_BLOCKED = 1` flag |
| **Movement settings misconfigured** | Yes | **High** | Direct: `MOVEMENT_SETTING_ISSUE = 1` flag |
| **WH outbound capacity** | Yes | **High** | Direct: `WH_CAPACITY_ISSUE2 = 1` flag |
| **Under-allocation vs demand** | Yes | **High** | Computed: `MOVEMENT_RR / BASE_RR` ratio |
| **Dispatch route inequality** | No | **None** | External: WMS dispatch system data |
| **Pod tier / cluster bias** | Partial | **Medium** | Join to `swiggykms.swiggy_kms.stores` for area/locality |

---

## Root Cause: Why the Analysis Stopped

The failure was not a data boundary problem. It was a **query granularity problem** in the SOP.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  B3 succeeded because its SOP detection queries use SUB-FLAGS:          │
│    "PO Constraint Flag", "MOQ DOC Flag", "Value MOV DOC Flag"           │
│    from ars_uploaded_archives4 — decomposition is built into Phase 1.   │
│                                                                          │
│  C4, G11, E8 failed because their SOP detection queries use only        │
│  AGGREGATE FLAGS:                                                        │
│    WH_FILLRATE_ISSUE, ERP_ISSUE, MOVEMENT_DESIGN_ISSUE                  │
│    No Phase 1 query template drills into the sub-flags.                 │
│                                                                          │
│  The sub-flags exist in the SAME TABLE (avail_rca_v7) but the SOP      │
│  never instructs the analyst to query them.                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Why B3 Passed and C4/G11/E8 Didn't

| Pattern | SOP Phase 1 Query Checks | Sub-Flags Used? | Result |
|---------|-------------------------|----------------|--------|
| **B3** | `"PO Constraint Flag"` values: 'Not a PO Raising Day', 'MOQ', 'Value MOV', 'Tonnage MOV' | **Yes** — sub-flags queried in Phase 1 | 10/10 — Full mechanism traced |
| **C4** | `WH_FILLRATE_ISSUE = 1` only | **No** — OTB_BLOCK, CONTRACT_NOT_AVAILABLE, OTIF_ISSUE not queried | 7/10 — Stopped at "fillrate is low" |
| **G11** | `ERP_ISSUE = 1` only | **No** — ERP_TEMP_DISABLE, ERP_BLOCK_LIST, VINCULUM_ERROR not queried | 8/10 — Stopped at "flag is set" |
| **E8** | Pod-level availability stddev | **No** — MOVEMENT_SETTING_ISSUE, MOVEMENT_RR_NOT_GENERATED, MOVEMENT_RR_BLOCKED not queried | 7/10 — Hypothesis disproved, new mechanism not decomposed |

### Recommended SOP Fix

Add to `structural-availability-analysis.md`, Phase 3, after WHY 2:

```
⚠ SUB-FLAG DECOMPOSITION CHECK (mandatory before WHY 3):

   After identifying the aggregate flag (WH_FILLRATE_ISSUE, ERP_ISSUE, etc.):

   1. Query ALL related sub-flags in avail_rca_v7 for the same SKU set
   2. Compute session-weighted share per sub-flag
   3. If >20% of sessions have NO sub-flag active → flag as "unexplained residual"
   4. Only then proceed to WHY 3 with the sub-flag distribution as evidence

   Sub-flag reference:
   ┌────────────────────┬──────────────────────────────────────────────┐
   │ Aggregate Flag     │ Sub-Flags to Check                           │
   ├────────────────────┼──────────────────────────────────────────────┤
   │ WH_FILLRATE_ISSUE  │ OTB_BLOCK, CONTRACT_NOT_AVAILABLE,          │
   │                    │ OTIF_ISSUE, WH_LONG_TERM_SUPPLY_ISSUE,      │
   │                    │ CASE_SIZE_CONSTRAINT                         │
   │                    │ + appointment APPT_STATE (NO_SHOW/CANCELLED) │
   ├────────────────────┼──────────────────────────────────────────────┤
   │ ERP_ISSUE          │ ERP_TEMP_DISABLE, ERP_BLOCK_LIST,           │
   │                    │ VINCULUM_ERROR, VENDOR_CODE_NOT_AVAILABLE    │
   ├────────────────────┼──────────────────────────────────────────────┤
   │ MOVEMENT_DESIGN_   │ MOVEMENT_SETTING_ISSUE,                     │
   │ ISSUE              │ MOVEMENT_RR_NOT_GENERATED,                   │
   │                    │ MOVEMENT_RR_BLOCKED, WH_CAPACITY_ISSUE2      │
   │                    │ + TRANSFER_QTY vs INTRANSIT_QTY analysis     │
   └────────────────────┴──────────────────────────────────────────────┘
```

---

## Next Steps

| Priority | Action | Queries to Run | Expected Outcome |
|----------|--------|---------------|-----------------|
| **1** | G11 sub-flag decomposition | G11-A | Split 31,596 SKUs into deliberate vs accidental vs system error. Likely unblocks ~80% of WHY 3. |
| **2** | C4 sub-flag co-occurrence | C4-A | Identify which sub-cause dominates for top 10 failing vendors. |
| **3** | C4 appointment analysis | C4-B | Quantify logistics failure rate per vendor — direct evidence. |
| **4** | E8 movement sub-flags | E8-A | Identify which movement sub-cause drives pod starvation. |
| **5** | E8 under-allocation check | E8-B | Confirm if MOVEMENT_RR << BASE_RR for starved pods. |
| **6** | C4 capacity classification | C4-C | Classify vendors as systemic capacity vs product-specific. |
