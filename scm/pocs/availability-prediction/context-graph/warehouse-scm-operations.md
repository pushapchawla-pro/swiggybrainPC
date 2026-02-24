# Instamart Warehouse Procurement (OTB) - From First Principles

> **Scope:** This document covers Warehouse-level procurement from Brands (Open to Buy / OTB). For Pod-level replenishment from Warehouse, see the Pod Inventory Replenishment doc.

---

## The Core Idea

Warehouses need to stock inventory so they can fulfill Pod requests. But warehouses don't manufacture goods - they procure from **Brands/Suppliers**. This upstream procurement is called **Open to Buy (OTB)**.

```
┌─────────┐         ┌─────────────┐         ┌─────────┐
│  BRAND  │ ──────► │  WAREHOUSE  │ ──────► │   POD   │ ──────► Customer
└─────────┘   OTB   └─────────────┘   MP    └─────────┘
              (this doc)            (Pod doc)
```

---

## Why Warehouse Procurement is Different from Pod Replenishment

| Dimension | Pod ← Warehouse | Warehouse ← Brand |
|-----------|-----------------|-------------------|
| **Lead Time** | 1.5 days (18-36 hrs) | **7-8 days** |
| **Control** | High (internal ops) | Lower (external suppliers) |
| **Constraints** | Space, stock sufficiency | **MOQ, case size, contracts, fill rate** |
| **Flexibility** | Ad-hoc orders possible | Harder to expedite |
| **System** | Movement Planning (internal) | Fountain (3rd party) + internal build |

The longer lead time fundamentally changes the math.

---

## Step 1: The Same DOH Concept, But Scaled Up

```
                         Warehouse Inventory (units)
Warehouse DOH  =   ─────────────────────────────────────
                    Aggregate Pod Demand (units/day)
```

**Key difference:** Warehouse demand = Sum of all Pod demands it serves.

```
Example:
─────────────────────────────────────────────────────────────
Warehouse IM1 serves 15 Pods

Pod A Run Rate:    20 units/day (Coke)
Pod B Run Rate:    15 units/day (Coke)
Pod C Run Rate:    25 units/day (Coke)
... (12 more pods)
─────────────────────────────────────────────────────────────
Total WH Demand:   300 units/day (Coke)

WH Inventory:      2,100 units
WH DOH:            2,100 ÷ 300 = 7 days
```

---

## Step 2: The Protection Window is Much Larger

For Pods, we had:
```
Pod MinDOH = L(1.5) + F(1) + SS(0.5) = 3 days
```

For Warehouses:
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     LEAD        │     │     REVIEW      │     │     SAFETY      │
│     TIME        │  +  │    FREQUENCY    │  +  │     STOCK       │  =  WH MinDOH
│    (7-8 days)   │     │    (~daily)     │     │   (higher)      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
    Brand takes              OTB process             Buffer for:
    7-8 days to              reviews needs           - Fill rate issues
    deliver                  periodically            - Late deliveries
                                                     - Demand spikes
```

**Estimated Warehouse Parameters:**
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **L** (Lead Time) | 7-8 days | Brand delivery time |
| **F** (Review Frequency) | ~1 day | OTB runs periodically |
| **SS** (Safety Stock) | 3+ days | Higher variability, less control |
| **WH MinDOH** | ~11-12 days | L + F + SS |

> From meeting: "safety stock... around 7 to 8 days... on top of that we put extra three"

---

## Step 3: Constraints That Don't Exist at Pod Level

### 3a. Minimum Order Quantity (MOQ)

Brands don't accept tiny orders. They have minimum thresholds.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MINIMUM ORDER QUANTITY (MOQ)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Brand says: "Either order ₹10 lakh worth, or don't order at all"      │
│                                                                         │
│   Scenarios:                                                            │
│   ─────────────────────────────────────────────────────────────         │
│   Your calculated need: ₹8 lakh                                         │
│                                                                         │
│   Option A: Wait until need grows to ₹10 lakh (risk stockout)           │
│   Option B: Round up to ₹10 lakh (overstock, but safe)                  │
│                                                                         │
│   Usually: We round UP to meet MOQ                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3b. Case Size Constraints

Same as Pod level, but stricter enforcement.

```
Example: Coke comes in cases of 12

Your Need    │ Case Logic           │ Actual Order
─────────────┼──────────────────────┼─────────────
    9        │ < 12, round up       │    12
   13        │ > 12, round to 12    │    12
   18        │ > 12, round to 24    │    24
   25        │ > 24, round to 24    │    24

Rule: 
- Below 1 case → Round UP to 1 case
- Above 1 case → Round to NEAREST case
```

### 3c. Valid Contracts

**Problem:** You can't order from a brand without a valid contract.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONTRACT REQUIREMENTS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Before placing OTB order, system checks:                              │
│                                                                         │
│   ✓ Is there a valid contract with this brand?                          │
│   ✓ Is the contract active (not expired)?                               │
│   ✓ Does contract cover this SKU?                                       │
│   ✓ Are pricing terms current?                                          │
│                                                                         │
│   If any check fails → Cannot place PO → Ordering Issue                 │
│                                                                         │
│   Owner: Category Manager / Procurement Team                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step 4: Supplier Fill Rate (The Uncontrollable Variable)

At Pod level, if warehouse has stock, you get it. At Warehouse level, brands might not deliver.

### Fill Rate Issues

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FILL RATE PROBLEMS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   You ordered 100 units. What actually happens?                         │
│                                                                         │
│   Scenario 1: Full delivery                                             │
│   ───────────────────────────────────────                               │
│   Ordered: 100 │ Received: 100 │ Fill Rate: 100% ✓                      │
│                                                                         │
│   Scenario 2: Partial delivery (In-Full issue)                          │
│   ───────────────────────────────────────                               │
│   Ordered: 100 │ Received: 79  │ Fill Rate: 79% ✗                       │
│   → Triggers "Not In Full" attribution (<80% threshold)                 │
│                                                                         │
│   Scenario 3: Late delivery (On-Time issue)                             │
│   ───────────────────────────────────────                               │
│   Lead time: 7 days │ Actual: 10 days │ On-Time: No ✗                   │
│   → Triggers "Not On Time" attribution                                  │
│                                                                         │
│   Scenario 4: Last PO severely under-delivered                          │
│   ───────────────────────────────────────                               │
│   Last PO: 100 ordered │ 40 received │ Fill Rate: 40% ✗                 │
│   → Triggers "Last PO Fill Rate <50%" attribution                       │
│                                                                         │
│   Scenario 5: No delivery at all                                        │
│   ───────────────────────────────────────                               │
│   POs raised │ received_qty = 0 over lookback window                    │
│   → Triggers "Long Term Supply Issue" attribution                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### OTIF (On-Time In-Full)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              OTIF METRIC                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   OTIF = On-Time AND In-Full delivery                                   │
│                                                                         │
│   Threshold for OTIF Issue:                                             │
│   ─────────────────────────────────────                                 │
│   PO in Released/Partially Received state                               │
│   AND delivery incomplete after: lead_time_in_days + 3 days             │
│                                                                         │
│   Example:                                                              │
│   Lead time = 7 days                                                    │
│   PO raised on Day 0                                                    │
│   Expected complete by Day 7                                            │
│   Grace period: +3 days                                                 │
│   If still incomplete on Day 10 → OTIF Issue                            │
│                                                                         │
│   Owner: Procurement                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step 5: Why PO Was Not Raised (Ordering Constraints)

Sometimes the system doesn't even place a PO. Here's why:

### 5a. Vendor/Catalog Issues

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     VENDOR/CATALOG CONSTRAINTS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Vendor Code Not Available:                                            │
│   ─────────────────────────────────────                                 │
│   Vendor code not configured in system                                  │
│   → Cannot raise PO                                                     │
│   → Owner: Catalog                                                      │
│                                                                         │
│   Vinculum Error:                                                       │
│   ─────────────────────────────────────                                 │
│   System error in PO creation (Vinculum is the PO system)               │
│   → PO failed to create                                                 │
│   → Owner: Catalog / Tech                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5b. Contract Issues

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONTRACT CONSTRAINTS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Contract Not Available:                                               │
│   ─────────────────────────────────────                                 │
│   Missing or expired contract for this SKU-vendor                       │
│   → Cannot raise PO without valid contract                              │
│   → Owner: Category Manager                                             │
│                                                                         │
│   OTB Block:                                                            │
│   ─────────────────────────────────────                                 │
│   SKU-WH blocked by OTB (Open-to-Buy) budget limits                     │
│   → Ordering suppressed even though demand exists                       │
│   → Owner: Category Manager                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5c. Quantity Constraints

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       QUANTITY CONSTRAINTS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   MOV/MOQ/Tonnage Constraint:                                           │
│   ─────────────────────────────────────                                 │
│   • MOV = Minimum Order Value (₹)                                       │
│   • MOQ = Minimum Order Quantity (units)                                │
│   • Tonnage = Weight limit                                              │
│                                                                         │
│   If order too small or weight cap exceeded → Cannot raise PO           │
│   → Owner: Procurement                                                  │
│                                                                         │
│   Case Size Constraint:                                                 │
│   ─────────────────────────────────────                                 │
│   Required case-size multiple not met                                   │
│   → Order quantity not justifiable                                      │
│   → Owner: Category Manager                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5d. Movement/Planning Issues

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MOVEMENT/PLANNING CONSTRAINTS                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Movement RR Not Generated:                                            │
│   ─────────────────────────────────────                                 │
│   movement_rr = NULL for this SKU-WH                                    │
│   → Planning never generated a run-rate                                 │
│   → Item never flowed even before going OOS                             │
│   → Owner: Planning                                                     │
│                                                                         │
│   Movement RR Blocked:                                                  │
│   ─────────────────────────────────────                                 │
│   movement_rr = 0.001 (sentinel value)                                  │
│   → SKU explicitly in movement block list                               │
│   → Owner: Planning                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```
│                                                                         │
---

## Step 6: Warehouse Unavailability Attribution

When a Pod can't get stock from Warehouse, we need to know WHY.

```
┌─────────────────────────────────────────────────────────────────────────┐
│              WAREHOUSE UNAVAILABILITY ATTRIBUTION FLOW                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Pod requests SKU from Warehouse                                       │
│              │                                                          │
│              ▼                                                          │
│   ┌─────────────────────────────┐                                       │
│   │ Is WH Stock Available?      │                                       │
│   │ (DOH ≥ 3 AND Qty ≥ 10)      │                                       │
│   └──────────────┬──────────────┘                                       │
│                  │                                                      │
│        ┌─────────┴─────────┐                                            │
│        │                   │                                            │
│        ▼                   ▼                                            │
│   ┌─────────┐        ┌──────────────────────────────────────────┐       │
│   │   YES   │        │   NO → Why is Warehouse out of stock?    │       │
│   │         │        │                                          │       │
│   │ Pod-level│       │   ┌─────────────────────────────────┐    │       │
│   │ issue    │       │   │ Did we place an order (PO)?     │    │       │
│   │         │        │   └───────────────┬─────────────────┘    │       │
│   └─────────┘        │           ┌───────┴───────┐              │       │
│                      │           │               │              │       │
│                      │           ▼               ▼              │       │
│                      │     ┌──────────┐   ┌────────────────┐    │       │
│                      │     │    NO    │   │      YES       │    │       │
│                      │     │          │   │                │    │       │
│                      │     │ ORDERING │   │ Did supplier   │    │       │
│                      │     │  ISSUE   │   │ deliver?       │    │       │
│                      │     └──────────┘   └───────┬────────┘    │       │
│                      │                           │              │       │
│                      │                   ┌───────┴───────┐      │       │
│                      │                   │               │      │       │
│                      │                   ▼               ▼      │       │
│                      │             ┌──────────┐   ┌──────────┐  │       │
│                      │             │    NO    │   │   YES    │  │       │
│                      │             │          │   │          │  │       │
│                      │             │FILL RATE │   │On time & │  │       │
│                      │             │  ISSUE   │   │in full?  │  │       │
│                      │             └──────────┘   └────┬─────┘  │       │
│                      │                                 │        │       │
│                      │                         ┌───────┴──────┐ │       │
│                      │                         │              │ │       │
│                      │                         ▼              ▼ │       │
│                      │                   ┌─────────┐  ┌────────┐│       │
│                      │                   │ Late OR │  │Forecast││       │
│                      │                   │ Partial │  │ Error  ││       │
│                      │                   └─────────┘  └────────┘│       │
│                      └──────────────────────────────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Attribution Buckets

| Bucket | Meaning | Owner |
|--------|---------|-------|
| **Ordering Issue** | PO was never placed | Procurement / ARS system |
| **Contract Issue** | No valid contract to order | Category Manager |
| **Fill Rate - Not In Full** | Brand delivered partial | Supplier / Brand |
| **Fill Rate - Not On Time** | Brand delivered late | Supplier / Brand |
| **Appointment Issue** | We didn't give delivery slot | Warehouse Ops |
| **Forecast Error** | We ordered wrong quantity | Planning / DS |

---

## Step 7: The OTB Process Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                        OTB (OPEN TO BUY) PROCESS                                │
│                                                                                 │
│   ┌─────────────────────────────────────────┐                                   │
│   │  Step 1: Calculate Warehouse Demand     │                                   │
│   │  • Aggregate all Pod demands            │                                   │
│   │  • Sum up for each SKU                  │                                   │
│   └──────────────────┬──────────────────────┘                                   │
│                      │                                                          │
│                      ▼                                                          │
│   ┌─────────────────────────────────────────┐                                   │
│   │  Step 2: Calculate Warehouse DOH        │                                   │
│   │  • WH DOH = WH Inventory ÷ Agg Demand   │                                   │
│   └──────────────────┬──────────────────────┘                                   │
│                      │                                                          │
│                      ▼                                                          │
│   ┌─────────────────────────────────────────┐                                   │
│   │  Step 3: Check Against WH MinDOH        │                                   │
│   │  • Is WH DOH < WH MinDOH (~11-12 days)? │                                   │
│   └──────────────────┬──────────────────────┘                                   │
│                      │                                                          │
│          ┌───────────┴───────────┐                                              │
│          │                       │                                              │
│          ▼                       ▼                                              │
│   ┌─────────────┐    ┌───────────────────────────────────────────────────────┐  │
│   │     NO      │    │  YES → Calculate Order                                │  │
│   │             │    │                                                       │  │
│   │  Do nothing │    │  Raw Qty = (WH MaxDOH - WH DOH) × Agg Demand          │  │
│   │             │    │         ↓                                             │  │
│   │             │    │  Check valid contract exists                          │  │
│   │             │    │         ↓                                             │  │
│   │             │    │  Apply case size rounding                             │  │
│   │             │    │         ↓                                             │  │
│   │             │    │  Apply MOQ (round up if below minimum)                │  │
│   │             │    │         ↓                                             │  │
│   │             │    │  Raise PO to Brand via Viniculum                      │  │
│   └─────────────┘    └───────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│          Currently managed by Fountain (3rd party), building internally         │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Step 8: Multi-Warehouse Considerations

### Primary vs Secondary Warehouses

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WAREHOUSE NETWORK STRUCTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Each Pod is mapped to:                                                │
│   • 1 Primary Warehouse (default source)                                │
│   • N Secondary Warehouses (fallback)                                   │
│                                                                         │
│   Example: Bangalore has 4 warehouses (IM1, IM2, IM3, IM4)              │
│                                                                         │
│   Pod Koramangala:                                                      │
│   • Primary: IM1                                                        │
│   • Secondary: IM2, IM3                                                 │
│                                                                         │
│   Movement Planning tries Primary first.                                │
│   If Primary doesn't have stock → Check Secondary.                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Demand Aggregation for OTB

```
When calculating OTB for Warehouse IM1:

Sum demand from all Pods where IM1 is PRIMARY
─────────────────────────────────────────────────────────────
Pod A (Primary: IM1):    20 units/day
Pod B (Primary: IM1):    15 units/day
Pod C (Primary: IM2):    -- (not counted for IM1)
Pod D (Primary: IM1):    25 units/day
─────────────────────────────────────────────────────────────
IM1 Aggregate Demand:    60 units/day

Note: Secondary assignments add complexity (not covered here)
```

---

## Step 9: Current System Ownership

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SYSTEM OWNERSHIP                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   OTB Logic & Execution:                                                │
│   ─────────────────────────────────────                                 │
│   Current: Fountain (3rd party)                                         │
│   Future: Building internally                                           │
│   Internal Owner: Procurement team (Rohit Shah)                         │
│                                                                         │
│   OTB System/UI:                                                        │
│   ─────────────────────────────────────                                 │
│   PO Upload: Viniculum (UI for raising POs to brands)                   │
│                                                                         │
│   Internal Jobs:                                                        │
│   ─────────────────────────────────────                                 │
│   • Vendor-to-Warehouse forecasting                                     │
│   • Warehouse-to-Vendor forecasting ("MI")                              │
│   • Run in Databricks, orchestrated by Airflow                          │
│                                                                         │
│   People to Contact:                                                    │
│   ─────────────────────────────────────                                 │
│   • Fountain logic: Minal (Fresh), Sumata (FMCG)                        │
│   • Internal build: Testing in progress                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Card

### Core Formulas

| Formula | Expression |
|---------|------------|
| **WH Demand** | Sum of all Pod Run Rates (for Pods where WH is primary) |
| **WH DOH** | WH Inventory ÷ Aggregate Demand |
| **WH MinDOH** | L + F + SS ≈ 11-12 days |
| **Raw Order Qty** | (WH MaxDOH - WH DOH) × Aggregate Demand |

### Key Parameters

| Parameter | Pod Level | Warehouse Level |
|-----------|-----------|-----------------|
| Lead Time | 1.5 days | 7-8 days |
| Safety Stock | 0.5 days | 3+ days |
| MinDOH | 3 days | ~11-12 days |
| Managed By | Movement Planning (internal) | Fountain → Internal |

### Constraints Unique to Warehouse

| Constraint | Description |
|------------|-------------|
| **MOQ** | Minimum order value/quantity required by brand |
| **Case Size** | Items come in fixed case sizes |
| **Contracts** | Valid contract required to place PO |
| **Fill Rate** | Supplier may not deliver in full or on time |
| **Appointments** | Delivery slot availability |

### Attribution Owners

| Issue Type | Owner |
|------------|-------|
| Ordering (no PO placed) | Procurement / ARS |
| Contract issues | Category Manager |
| Fill Rate (supplier) | Brand / Supplier |
| Appointment (no slot) | Warehouse Ops |
| Forecast Error | Planning / DS |

---

## What This Document Does NOT Cover

| Topic | Notes |
|-------|-------|
| Fountain internal logic | 3rd party, limited visibility |
| Detailed ARS (Auto-Replenishment) | Being built internally |
| Warehouse-to-Warehouse transfers | Different process |
| Cold warehouse specifics | Volumetric constraints |
| Appointment scheduling system | Recently added |

---

## Summary

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  1. WH Demand = Sum of all Pod demands (where WH is primary)           │
│                                                                        │
│  2. WH DOH = WH Inventory ÷ Aggregate Demand                           │
│                                                                        │
│  3. WH MinDOH ≈ 11-12 days (vs 3 days for Pods)                        │
│     Because Lead Time = 7-8 days (vs 1.5 days for Pods)                │
│                                                                        │
│  4. IF WH DOH < WH MinDOH:                                             │
│         Order (WH MaxDOH - WH DOH) × Aggregate Demand                  │
│         → Check contract exists                                        │
│         → Round to case size                                           │
│         → Round up to MOQ if needed                                    │
│         → Raise PO to Brand via Viniculum                              │
│                                                                        │
│  5. Key risks: Fill rate (supplier doesn't deliver),                   │
│                Contract issues, Forecast errors                        │
│                                                                        │
│  Same (R,S) policy as Pod level, but with:                             │
│  • Longer lead times                                                   │
│  • External supplier dependency                                        │
│  • Additional constraints (MOQ, contracts, fill rate)                  │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

*Based on IM Availability Reasons meeting (Jan 14, 2026)*
*System currently managed by Fountain; internal build in progress*

---

## Appendix: Warehouse OOS RCA Reason Codes

When Warehouse is Out of Stock (DOH < 3 OR WH_STOCK < 10), these are the attribution codes:

| Code | Bin | Owner | Logic | Description |
|------|-----|-------|-------|-------------|
| `0.pod_inactive` | POD Inactive | Business | `wh_stock1='OOS' AND pod_active_flag=0` | WH is OOS and Pod is also inactive |
| `oos_2.Not in ERP` | ERP Disabled | Catalog | `erp_issue=1` | Item missing/disabled in ERP for city |
| `oos_3.temp_disable` | Temp Disable | Catalog | `erp_temp_disable=1` | Item temporarily disabled in ERP |
| `oos_5.Fresh_Items` | Fresh | NA | `fresh_non_fresh=1` | Fresh SKUs (separate treatment) |
| `oos_6.movement_rr_not_generated` | Movement_Blocking | Planning | `movement_rr=NULL` | No run-rate generated |
| `oos_7.movement_rr_blocked` | Movement_Blocking | Planning | `movement_rr=0.001` | RR explicitly blocked |
| `oos_8.Long Term Supply Issue` | Long Term Supply | Cat M | `expected_qty>0 AND received_qty=0` | POs raised but vendor delivered nothing |
| `oos_9.fillrate Issue` | Fill Rate | Procurement | `wh_fillrate_issue=1` | Vendor fill rate <80% over period |
| `oos_9a.last po fillrate Issue` | Last PO Fill Rate | Procurement | `wh_last_po_fillrate_issue=1` | Last PO fill rate <50% |
| `oos_9b.OTIF Issue` | OTIF | Procurement | `otif_issue=1` | Incomplete delivery beyond lead_time + 3 days |
| `oos_9c.VENDOR_CODE_NOT_AVAILABLE` | Vendor Code Not Available | Catalog | `VENDOR_CODE_NOT_AVAILABLE=1` | Vendor code not configured |
| `oos_9d.CONTRACT_NOT_AVAILABLE` | Contract Not Available | Cat M | `CONTRACT_NOT_AVAILABLE=1` | Missing/expired contract |
| `oos_9e.OTB_BLOCK` | OTB Block | Cat M | `OTB_BLOCK=1` | Blocked by OTB budget limits |
| `oos_9f.VINCULUM_ERROR` | Vinculum Error | Catalog | `VINCULUM_ERROR=1` | System error in PO creation |
| `oos_9g.MOVMOQTonnageConstraint` | MOV/MOQ/Tonnage | Procurement | `MOV_MOQ_Tonnage_Constraint=1` | Order too small or weight cap |
| `oos_9h.Case_Size_Constraint` | Case Size | Cat M | `Case_Size_Constraint=1` | Case size minimum not met |
| `oos_10.Planning Ordering Issue` | Ordering/OTIF/Contract | Planning/Cat M/Procurement | `all_other_oos_flags=0` | Catch-all for unattributed OOS |

### Owner Summary (Warehouse OOS Issues)

| Owner | Codes | Responsibility |
|-------|-------|----------------|
| **Procurement** | 4 | Fill rate, OTIF, MOQ constraints |
| **Category Manager (Cat M)** | 4 | Contracts, OTB block, case size, long-term supply |
| **Catalog** | 4 | ERP, temp disable, vendor code, Vinculum errors |
| **Planning** | 3 | Movement blocking, ordering issues |
| **Business** | 1 | Pod inactive |
| **NA** | 1 | Fresh items |

### Key Thresholds

| Metric | Threshold | Meaning |
|--------|-----------|---------|
| **WH Stock Check** | DOH ≥ 3 AND Qty ≥ 10 | WH considered "In Stock" |
| **Fill Rate Issue** | < 80% | Vendor under-delivering |
| **Last PO Fill Rate** | < 50% | Severe under-delivery on last PO |
| **OTIF Grace Period** | Lead Time + 3 days | Beyond this = OTIF issue |
| **Long Term Supply** | received_qty = 0 | Vendor delivered nothing over lookback |
