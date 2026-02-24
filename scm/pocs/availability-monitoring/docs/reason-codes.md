# Availability Reason Codes - Source of Truth

This document establishes the canonical mapping between availability reason codes and their responsible AI owners for the Swiggy Brain Instamart Availability Agent.

## Data Sources

| Table | Purpose | Location |
|-------|---------|----------|
| `analytics.public.sku_wise_availability_rca_with_reasons_v7` | Primary RCA table with `final_reason` | Snowflake |
| `analytics.public.final_reason_mapping_avail_rca` | Maps `final_reason` → `bin` → `ai_owner` | Snowflake |
| Databricks equivalent | `analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7` | Databricks |

**Filter for Bradman SKUs**: `assortment IN ('A', 'MLT', 'MnE')`

**Key Insight**: Each SKU-POD-day combination has exactly ONE `final_reason` assigned via waterfall priority logic.

---

## Waterfall Attribution Model

The RCA follows a **waterfall attribution** model with two main branches:

```
STORE AVAILABILITY MISS
├── A. WH-led Availability Miss (~12.8% of miss)
│   ├── A1. Supplier & Inbound Constraints
│   ├── A2. WH-side Planning & Forecasting
│   ├── A3. Warehouse Throughput & Capacity
│   └── A4. Inventory Hygiene & Systems (WH)
│
└── B. POD-led Availability Miss (~4.7% of miss)
    ├── B1. POD Ops Throughput & Capacity
    ├── B2. POD-level Planning & Demand Dynamics
    ├── B3. Replenishment Logic & Movement Design
    └── B4. Inventory Hygiene & Freshness (POD)
```

---

## Complete Reason Code Reference

### When Warehouse Stock = OOS (Upstream Supply Problem)

These codes indicate the warehouse itself doesn't have stock.

| Code | `final_reason` | Description | AI Owner | RCA Branch |
|------|----------------|-------------|----------|------------|
| `oos_0` | `pod_inactive` | POD is disabled in system | Config | B4 |
| `oos_1` | `disabled_pod` | Movement to this POD is blocked | Config | B4 |
| `oos_2` | `Not in ERP` | SKU missing from ERP master | ERP Team | A4 |
| `oos_3` | `temp_disable` | SKU temporarily disabled (quality hold, recall) | ERP Team | A4 |
| `oos_4` | `Order Blocking List` | SKU blocked from ordering | ERP Team | A4 |
| `oos_5` | `Fresh_Items` | FnV/perishables special handling | Category Management | A4 |
| `oos_6` | `movement_rr_not_generated` | No run-rate calculated → no movement planned | Planning | B3 |
| `oos_7` | `movement_rr_blocked` | Run-rate set to 0.001 (explicitly blocked) | Planning | B3 |
| `oos_8` | `Long Term Supply Issue` | Supplier hasn't delivered for extended period | Procurement | A1 |
| `oos_9` | `fillrate Issue` | Supplier fill rate <80% of PO qty | Procurement | A1 |
| `oos_10` | `Planning Ordering Issue` | Default catch-all for PO/planning gaps | Planning | A2 |

### When Warehouse Stock = Instock (Movement/POD Problem)

These codes indicate the warehouse has stock but POD doesn't.

| Code | `final_reason` | Description | AI Owner | RCA Branch |
|------|----------------|-------------|----------|------------|
| `instock_0` | `pod_inactive` | POD is disabled | Config | B4 |
| `instock_1` | `Not in ERP` | SKU missing from ERP at POD level | ERP Team | B4 |
| `instock_2` | `movement_blocked_list` | Movement explicitly blocked for this POD | Config | B4 |
| `instock_3` | `temp_disable` | Temporarily disabled at POD | ERP Team | B4 |
| `instock_4` | `Order Blocking List` | Blocked from ordering at POD | ERP Team | B4 |
| `instock_5` | `Fresh_Items` | FnV handling | Category Management | B4 |
| `instock_6` | `movement_rr_not_generated` | No run-rate at POD level | Planning | B3 |
| `instock_7` | `movement_rr_blocked` | Run-rate blocked at POD | Planning | B3 |
| `instock_8` | `POD Cap Missed` | POD capacity full, couldn't receive | Pod Ops | B1 |
| `instock_9` | `WH Cap Missed` | Warehouse dispatch capacity exceeded | Warehouse | A3 |
| `instock_10` | `WH_Cap_Movement_Reduced` | Movement reduced due to WH constraints | Warehouse | A3 |
| `instock_11` | `pod_Space Issue_cold` | Cold storage at POD full | Pod Ops | B1 |
| `instock_12` | `wh_ob_Fillrate Issue` | Warehouse outbound fill rate <80% | Warehouse | A3 |
| `instock_13` | `Forecasting_error` | Actual sales >3x forecast run-rate | Planning | B2 |
| `instock_14` | `Putaway_delay` | Inwarding to shelf delayed at POD | Pod Ops | B1 |
| `instock_15` | `wh_putaway_delay` | Free DOH <3 days (stock stuck in staging) | Warehouse | A3 |
| `instock_16` | `Movement Design issue` | Movement plan design gap | Planning | B3 |
| `instock_17` | `Others` | Catch-all for unexplained gaps | Unassigned | A4 |

---

## AI Owner Mapping Summary

### By Owner

| AI Owner | Reason Codes | Primary Focus |
|----------|--------------|---------------|
| **Planning** | `movement_rr_not_generated`, `movement_rr_blocked`, `Planning Ordering Issue`, `Forecasting_error`, `Movement Design issue` | Demand forecasting, run-rate generation, movement planning |
| **Procurement** | `Long Term Supply Issue`, `fillrate Issue` | Vendor relationships, PO creation, fill rate tracking |
| **Category Management** | `Fresh_Items` (both oos/instock) | Assortment decisions, supplier performance, tiering |
| **Warehouse** | `WH Cap Missed`, `WH_Cap_Movement_Reduced`, `wh_ob_Fillrate Issue`, `wh_putaway_delay` | WH capacity, outbound fill rate, putaway |
| **Pod Ops** | `POD Cap Missed`, `pod_Space Issue_cold`, `Putaway_delay` | Pod capacity, space, inwarding |
| **ERP Team** | `Not in ERP`, `temp_disable`, `Order Blocking List` | SKU enablement, catalog config |
| **Config/Product Support** | `pod_inactive`, `disabled_pod`, `movement_blocked_list` | Control Room rules, system config |

### By RCA Branch

| Branch | Code | Description | Owner |
|--------|------|-------------|-------|
| **A1** | Supplier & Inbound | `oos_8`, `oos_9` | Procurement |
| **A2** | WH Planning | `oos_10` | Planning |
| **A3** | WH Throughput | `instock_9`, `instock_10`, `instock_12`, `instock_15` | Warehouse |
| **A4** | WH Hygiene | `oos_2`, `oos_3`, `oos_4`, `oos_5`, `instock_17` | ERP Team / Category Mgmt / Unassigned |
| **B1** | POD Ops | `instock_8`, `instock_11`, `instock_14` | Pod Ops |
| **B2** | POD Planning | `instock_13` | Planning |
| **B3** | Movement Design | `oos_6`, `oos_7`, `instock_6`, `instock_7`, `instock_16` | Planning |
| **B4** | POD Hygiene | `oos_0`, `oos_1`, `instock_0-5` | Config / ERP Team / Category Mgmt |

---

## Detailed Reason Code Definitions

### Planning-Owned Codes

#### `movement_rr_not_generated` (oos_6, instock_6)
**Definition**: No run-rate was calculated for this SKU-POD combination, so no movement was planned.

**Root Cause**:
- New SKU not yet in forecast model
- SKU-POD mapping not established
- Algorithm gap in run-rate generation

**Diagnosis Steps**:
1. Check if SKU is in `KS_GD_FINAL_RUNRATE` table
2. Verify SKU-POD mapping exists in movement planning
3. Check if SKU is marked as "new" (< 30 days history)

**Action**: Review SKU-POD mapping, manually seed initial run-rate if needed.

---

#### `movement_rr_blocked` (oos_7, instock_7)
**Definition**: Run-rate explicitly set to 0.001 (blocked), preventing movement.

**Root Cause**:
- Business decision to block movement
- Quality/compliance hold
- Overstock situation at POD

**Diagnosis Steps**:
1. Check run-rate value in planning system
2. Verify if block was intentional
3. Check for quality/compliance flags

**Action**: Review block reason, remove if no longer applicable.

---

#### `Planning Ordering Issue` (oos_10)
**Definition**: Default catch-all when warehouse is OOS and no other reason applies. Indicates a gap in PO creation or planning.

**Root Cause**:
- PO not raised despite demand
- Forecast underestimation
- OTB constraints

**Diagnosis Steps**:
1. Check if PO exists for the SKU
2. Compare forecast vs actual demand
3. Verify OTB allocation

**Action**: Review PO generation logic, adjust forecast if needed.

---

#### `Forecasting_error` (instock_13)
**Definition**: Actual sales exceeded forecast by >3x, causing stockout despite warehouse having stock.

**Root Cause**:
- Demand spike (promotion, event, viral moment)
- Forecast model miss
- Cannibalization not accounted for

**Diagnosis Steps**:
1. Compare actual vs forecasted demand
2. Check for promotions/events on that date
3. Review forecast model inputs

**Action**: Update forecast model, add event-driven adjustments.

---

#### `Movement Design issue` (instock_16)
**Definition**: Movement plan design gap - caps, min/max settings, or allocation logic caused insufficient movement.

**Root Cause**:
- Movement caps too restrictive
- Min/max settings incorrect
- Capacity allocation suboptimal

**Diagnosis Steps**:
1. Check movement plan settings
2. Verify min/max thresholds
3. Review capacity allocation logic

**Action**: Adjust movement design parameters.

---

### Procurement-Owned Codes

#### `Long Term Supply Issue` (oos_8)
**Definition**: Supplier hasn't delivered for an extended period (typically >7 days).

**Root Cause**:
- Supplier production issues
- Contract dispute
- Supply chain disruption
- Seasonal unavailability

**Diagnosis Steps**:
1. Check last PO fulfillment date
2. Review supplier communication logs
3. Verify contract status

**Action**: Escalate to supplier, activate secondary supplier, consider market buying.

---

#### `fillrate Issue` (oos_9)
**Definition**: Supplier delivered <80% of PO quantity (fill rate below threshold).

**Root Cause**:
- Partial shipment
- Supplier capacity constraints
- Quality rejections at source

**Diagnosis Steps**:
1. Check UFR (Unit Fill Rate) for recent POs
2. Review GRN vs PO quantity
3. Check quality rejection logs

**Action**: Escalate to supplier, track fill rate improvement.

---

### Warehouse-Owned Codes

#### `WH Cap Missed` (instock_9)
**Definition**: Warehouse dispatch capacity exceeded, couldn't fulfill all movement requests.

**Root Cause**:
- Peak demand period
- Manpower shortage
- Equipment issues

**Diagnosis Steps**:
1. Check WH dispatch capacity vs demand
2. Review capacity utilization metrics
3. Check staffing levels

**Action**: Increase dispatch capacity, prioritize critical SKUs.

---

#### `WH_Cap_Movement_Reduced` (instock_10)
**Definition**: Movement quantity reduced due to warehouse capacity constraints.

**Root Cause**:
- Similar to WH Cap Missed but partial fulfillment
- Prioritization of other SKUs

**Diagnosis Steps**:
1. Check movement reduction percentage
2. Review prioritization logic

**Action**: Adjust prioritization, increase capacity.

---

#### `wh_ob_Fillrate Issue` (instock_12)
**Definition**: Warehouse outbound fill rate <80% - couldn't dispatch planned quantity.

**Root Cause**:
- Picking delays
- Staging bottlenecks
- Vehicle capacity issues

**Diagnosis Steps**:
1. Check outbound fill rate metrics
2. Review picking TAT
3. Check vehicle dispatch logs

**Action**: Improve outbound operations, increase picking capacity.

---

#### `wh_putaway_delay` (instock_15)
**Definition**: Free DOH <3 days indicating stock stuck in staging area (not putaway yet).

**Root Cause**:
- GRN backlog
- Putaway manpower shortage
- Storage location issues

**Diagnosis Steps**:
1. Check staging DOH vs free DOH
2. Review putaway TAT
3. Check GRN backlog

**Action**: Clear putaway backlog, increase putaway manpower.

---

### Pod Ops-Owned Codes

#### `POD Cap Missed` (instock_8)
**Definition**: POD capacity full, couldn't receive incoming inventory.

**Root Cause**:
- Storage space exhausted
- Slow putaway
- Overstock of slow movers

**Diagnosis Steps**:
1. Check POD capacity utilization
2. Review inwarding backlog
3. Check slow mover inventory

**Action**: Clear space, expedite putaway, return slow movers.

---

#### `pod_Space Issue_cold` (instock_11)
**Definition**: Cold storage (freezer/chiller) at POD is full.

**Root Cause**:
- Limited cold chain capacity
- Slow turnover of frozen items
- Equipment issues

**Diagnosis Steps**:
1. Check cold storage utilization
2. Review frozen item DOI
3. Check equipment status

**Action**: Optimize cold chain allocation, expedite frozen item sales.

---

#### `Putaway_delay` (instock_14)
**Definition**: Delay between inwarding and shelf placement at POD.

**Root Cause**:
- Manpower shortage
- Training gaps
- Location assignment issues

**Diagnosis Steps**:
1. Check inwarding-to-putaway TAT
2. Review staffing levels
3. Check location assignment logic

**Action**: Increase putaway manpower, improve training.

---

### ERP/Config-Owned Codes

#### `Not in ERP` (oos_2, instock_1)
**Definition**: SKU missing from ERP master at city/POD level.

**Root Cause**:
- SKU not onboarded
- ERP sync failure
- Incorrect region mapping

**Diagnosis Steps**:
1. Check ERP enablement status
2. Verify region mapping
3. Check onboarding status

**Action**: Enable SKU in ERP, fix region mapping.

---

#### `temp_disable` (oos_3, instock_3)
**Definition**: SKU temporarily disabled due to quality hold, recall, or compliance issue.

**Root Cause**:
- Quality issue detected
- FSSAI compliance
- Brand recall

**Diagnosis Steps**:
1. Check quality hold status
2. Review compliance flags
3. Verify recall status

**Action**: Resolve quality issue, re-enable when cleared.

---

#### `Order Blocking List` (oos_4, instock_4)
**Definition**: SKU explicitly blocked from ordering.

**Root Cause**:
- Business decision
- Margin issues
- Supplier dispute

**Diagnosis Steps**:
1. Check blocking reason
2. Review business decision logs

**Action**: Remove from blocking list if no longer applicable.

---

#### `pod_inactive` / `disabled_pod` (oos_0, oos_1, instock_0)
**Definition**: POD is disabled in system or movement to POD is blocked.

**Root Cause**:
- POD closure (temporary/permanent)
- Maintenance
- Config error

**Diagnosis Steps**:
1. Check POD active status
2. Review closure logs
3. Verify config

**Action**: Re-enable POD if closure resolved.

---

## Reason Mapping Query

```sql
-- Get reason code to owner mapping
SELECT
    final_reason,
    bin,
    ai_owner,
    notes,
    rnk as priority_rank
FROM analytics.public.final_reason_mapping_avail_rca
ORDER BY rnk;

-- Get availability with reasons for a specific date/city
SELECT
    dt,
    item_code,
    product_name,
    store_id,
    city,
    availability,
    final_reason,
    a.bin,
    a.ai_owner
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7 r
LEFT JOIN analytics.public.final_reason_mapping_avail_rca a
    ON r.final_reason = a.final_reason
WHERE dt = '2026-01-13'
    AND city = 'Bangalore'
    AND assortment IN ('A', 'MLT', 'MnE')
    AND availability < 99.9;
```

---

## Version History

| Date | Change | Author |
|------|--------|--------|
| 2026-01-14 | Initial documentation | Claude Code |

**Note**: The analytics team (Godavarthi Sai Durga Prasad) may update the attribution to "v2" with additional reason bifurcation. Table structure remains the same but new values may be added to `final_reason`.

---

## References

1. **Primary SQL Pipeline**: [availability_attribution_waterfall.sql](https://github.com/swiggy-private/data-platform-zflow/blob/master/notebooks/godavarthi.s/availability_attribution_waterfall.sql)
2. **POC Spec**: [Instamart Availability Monitoring POC](https://docs.google.com/document/d/17M4eK_GLPvT8hvMikGLJnUTizZW9_Vnwnq-SDLpqbHs)
3. **LLM Prompts Doc**: [Prompts for LLM - Swiggy Brain](https://docs.google.com/document/d/1UusNpq7I8bQj1F_03wevNhmzdF27qw-NlAImuIawbyY)
4. **Power BI Dashboard**: Availability Attribution Waterfall Dashboard (internal)
