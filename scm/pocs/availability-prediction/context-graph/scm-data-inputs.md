# Instamart Inventory System - Data Inputs Reference

> **Scope:** This document covers the data inputs required for both scheduled inventory processes: Pod Replenishment (Movement Planning) and Warehouse Procurement (OTB).

---

## Overview: Two Scheduled Processes

```
┌─────────┐         ┌─────────────┐         ┌─────────┐
│  BRAND  │ ──OTB─► │  WAREHOUSE  │ ──MP──► │   POD   │ ──────► Customer
└─────────┘         └─────────────┘         └─────────┘
              │                        │
              │                        │
        Process 2:                Process 1:
        Warehouse                 Pod Replenishment
        Procurement               (Movement Planning)
        (OTB)
```

| Process | Schedule | Goal |
|---------|----------|------|
| **Movement Planning (MP)** | Multiple times daily (DD, BAU, Cold) | Move SKUs from Warehouse → Pod |
| **Open to Buy (OTB)** | Periodic | Order SKUs from Brand → Warehouse |

---

## Process 1: Pod Replenishment (Movement Planning)

**Goal:** Decide how much of each SKU to move from Warehouse → Pod

### 1.1 Inventory State (Where are we now?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INVENTORY STATE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Pod Level:                                                             │
│  • Current pod inventory (units per SKU per pod)                        │
│  • In-transit inventory (POs raised but not yet received)               │
│                                                                         │
│  Warehouse Level:                                                       │
│  • Current WH inventory (units per SKU per warehouse)                   │
│  • Free inventory (put away, available to ship)                         │
│  • Staged inventory (inwarded but not put away)                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Demand Signals (How fast is it selling?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEMAND SIGNALS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Historical:                                                            │
│  • Last 7 days sales per SKU per pod                                    │
│  • Last 7 days availability per SKU per pod (for correction)            │
│                                                                         │
│  Forecast:                                                              │
│  • OPD forecast for next 3 days (from DS model)                         │
│  • Current average OPD (for bump factor calculation)                    │
│                                                                         │
│  Derived:                                                               │
│  • Movement Run Rate (RR) per SKU per pod                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Configuration & Rules (What are the thresholds?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONFIGURATION & RULES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Item Classification:                                                   │
│  • Item class mapping (Top 50, Top 100, MSKU, Long-tail)                │
│  • MinDOH / MaxDOH per item class                                       │
│  • DOH cutoff settings per item class                                   │
│                                                                         │
│  Case Size:                                                             │
│  • Case size per SKU (units per case)                                   │
│                                                                         │
│  Lead Time:                                                             │
│  • WH → Pod lead time (default ~1.5 days)                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Capacity Constraints (What are the limits?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CAPACITY CONSTRAINTS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Pod Constraints:                                                       │
│  • Pod storage capacity (total units / sq ft)                           │
│  • Freezer/chiller capacity (for cold items)                            │
│  • Current utilization                                                  │
│                                                                         │
│  Warehouse Constraints:                                                 │
│  • WH outbound capacity (picks per day)                                 │
│  • Vehicle capacity                                                     │
│  • Picker availability                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.5 Network Mapping (Who serves whom?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NETWORK MAPPING                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  • Pod → Primary Warehouse mapping                                      │
│  • Pod → Secondary Warehouse mapping (fallback)                         │
│  • Pod active/inactive status                                           │
│  • Pod enable/disable in movement planning                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.6 Blocking/Eligibility Flags (What's allowed to move?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BLOCKING/ELIGIBILITY FLAGS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  • ERP enabled flag per SKU per city                                    │
│  • Temp disable flag                                                    │
│  • Movement block list (RR = 0.001)                                     │
│  • Fresh/non-fresh flag                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.7 Manual Overrides (Human inputs)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       MANUAL OVERRIDES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  • Manual override table (ops team adjustments)                         │
│  • Ad-hoc order requests                                                │
│  • Pod-specific constraints (temporary closures, etc.)                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Process 2: Warehouse Procurement (OTB - Open to Buy)

**Goal:** Decide how much of each SKU to order from Brand → Warehouse

### 2.1 Inventory State (Where are we now?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INVENTORY STATE                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Warehouse Level:                                                       │
│  • Current WH inventory (units per SKU per warehouse)                   │
│  • In-transit inventory (POs raised to brands, not yet received)        │
│  • Free vs staged inventory                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Demand Signals (What do Pods need?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DEMAND SIGNALS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Aggregated from Movement Planning:                                     │
│  • Sum of all Pod Run Rates (where WH is primary)                       │
│  • Aggregate demand per SKU per warehouse                               │
│                                                                         │
│  OR independently forecasted:                                           │
│  • WH-level demand forecast (from DS model)                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Supplier Master Data (Who do we buy from?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SUPPLIER MASTER DATA                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Vendor Information:                                                    │
│  • Vendor code per SKU                                                  │
│  • Vendor → Warehouse mapping                                           │
│  • Vendor contact / ordering details                                    │
│                                                                         │
│  Lead Time:                                                             │
│  • Supplier lead time per vendor (typically 7-8 days)                   │
│  • Historical lead time performance                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.4 Contract & Pricing Data (What are the terms?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CONTRACT & PRICING DATA                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  • Active contracts per SKU-vendor                                      │
│  • Contract validity dates                                              │
│  • Pricing terms (cost per unit)                                        │
│  • Payment terms                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.5 Ordering Constraints (What are the rules?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ORDERING CONSTRAINTS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Quantity Constraints:                                                  │
│  • MOQ (Minimum Order Quantity) per SKU-vendor                          │
│  • MOV (Minimum Order Value) per vendor                                 │
│  • Case size per SKU                                                    │
│  • Tonnage/weight limits                                                │
│                                                                         │
│  Budget Constraints:                                                    │
│  • OTB budget limits per category/vendor                                │
│  • Open PO value (already committed spend)                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.6 Configuration & Rules (What are the thresholds?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONFIGURATION & RULES                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  • WH MinDOH / MaxDOH settings                                          │
│  • Safety stock settings per item class                                 │
│  • Reorder point thresholds                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.7 Historical Supplier Performance (Can we trust them?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 HISTORICAL SUPPLIER PERFORMANCE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Fill Rate History:                                                     │
│  • Historical fill rate per vendor (GRN qty vs PO qty)                  │
│  • Last PO fill rate                                                    │
│                                                                         │
│  OTIF History:                                                          │
│  • On-time delivery rate                                                │
│  • Average delay (days)                                                 │
│                                                                         │
│  GRN Data:                                                              │
│  • Past GRN records (what was actually received)                        │
│  • Expected vs received quantities                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.8 Blocking/Eligibility Flags (What's allowed to order?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BLOCKING/ELIGIBILITY FLAGS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  • ERP enabled flag per SKU per city                                    │
│  • Temp disable flag                                                    │
│  • OTB block flag                                                       │
│  • Movement RR block (if blocked, no need to order)                     │
│  • Fresh/non-fresh flag                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.9 Warehouse Capacity (Can we receive it?)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      WAREHOUSE CAPACITY                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  • WH storage capacity                                                  │
│  • Current utilization                                                  │
│  • Inward appointment slots available                                   │
│  • Dock capacity                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Side-by-Side Comparison

| Data Category | Pod Replenishment (MP) | Warehouse Procurement (OTB) |
|---------------|------------------------|----------------------------|
| **Inventory State** | Pod inventory, WH inventory, in-transit | WH inventory, in-transit from brands |
| **Demand Signal** | 7-day sales, availability, OPD forecast | Aggregated Pod demand OR WH-level forecast |
| **Network Mapping** | Pod → WH mapping | WH → Vendor mapping |
| **Supplier Data** | N/A (internal) | Vendor master, lead times, contacts |
| **Contracts** | N/A | Contract validity, pricing, terms |
| **Quantity Rules** | Case size | MOQ, MOV, case size, tonnage |
| **Budget** | N/A | OTB budget limits |
| **Capacity** | Pod capacity, WH outbound capacity | WH inbound capacity, appointment slots |
| **Thresholds** | MinDOH/MaxDOH per item class | WH MinDOH/MaxDOH, safety stock |
| **Blocking Flags** | ERP, temp disable, movement block | ERP, temp disable, OTB block, movement block |
| **Performance History** | N/A | Fill rate, OTIF, GRN history |
| **Manual Overrides** | Ops override table | Category manager inputs |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                              DATA FLOW                                          │
│                                                                                 │
│  ┌──────────────┐                                    ┌──────────────┐           │
│  │   BRANDS     │                                    │  CUSTOMERS   │           │
│  └──────┬───────┘                                    └──────▲───────┘           │
│         │                                                   │                   │
│         │ PO                                          Sales │                   │
│         ▼                                                   │                   │
│  ┌──────────────────────────────────────────────────────────────────────┐       │
│  │                                                                      │       │
│  │    ┌─────────────┐         ┌─────────────┐         ┌─────────────┐   │       │
│  │    │  WAREHOUSE  │ ──MP──► │    POD      │ ──────► │   SALES     │   │       │
│  │    └─────────────┘         └─────────────┘         └─────────────┘   │       │
│  │          ▲                       ▲                       │           │       │
│  │          │                       │                       │           │       │
│  │          │                       └───────────────────────┘           │       │
│  │          │                         Sales data feeds                  │       │
│  │          │                         demand forecast                   │       │
│  │          │                                                           │       │
│  └──────────┼───────────────────────────────────────────────────────────┘       │
│             │                                                                   │
│             │                                                                   │
│  ┌──────────┴───────────────────────────────────────────────────────────┐       │
│  │                          DATA SOURCES                                │       │
│  │                                                                      │       │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │       │
│  │  │  ERP / Catalog │  │  DS Forecasts  │  │  Vendor Master │          │       │
│  │  │  • SKU master  │  │  • OPD forecast│  │  • Lead times  │          │       │
│  │  │  • Item class  │  │  • Demand fcst │  │  • Contracts   │          │       │
│  │  │  • Flags       │  │                │  │  • MOQ/MOV     │          │       │
│  │  └────────────────┘  └────────────────┘  └────────────────┘          │       │
│  │                                                                      │       │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │       │
│  │  │  Inventory     │  │  Network       │  │  Capacity      │          │       │
│  │  │  • WH stock    │  │  • Pod→WH map  │  │  • Pod space   │          │       │
│  │  │  • Pod stock   │  │  • WH→Vendor   │  │  • WH capacity │          │       │
│  │  │  • In-transit  │  │                │  │  • Appointments│          │       │
│  │  └────────────────┘  └────────────────┘  └────────────────┘          │       │
│  │                                                                      │       │
│  │  ┌────────────────┐  ┌────────────────┐                              │       │
│  │  │  Historical    │  │  Manual        │                              │       │
│  │  │  • GRN data    │  │  • Overrides   │                              │       │
│  │  │  • Fill rates  │  │  • Block lists │                              │       │
│  │  │  • OTIF        │  │  • Ad-hoc      │                              │       │
│  │  └────────────────┘  └────────────────┘                              │       │
│  │                                                                      │       │
│  └──────────────────────────────────────────────────────────────────────┘       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Minimum Required Inputs

### Pod Replenishment (Movement Planning)

| # | Input | Source | Granularity | Used For |
|---|-------|--------|-------------|----------|
| 1 | Pod inventory | Inventory system | SKU × Pod | DOH calculation |
| 2 | WH inventory | Inventory system | SKU × WH | Stock sufficiency check |
| 3 | In-transit qty | PO system | SKU × Pod | Effective inventory |
| 4 | Last 7-day sales | Sales data | SKU × Pod × Day | Run rate calculation |
| 5 | Last 7-day availability | Availability data | SKU × Pod × Day | Availability correction |
| 6 | OPD forecast | DS model | Pod × Day | Demand bump factor |
| 7 | Item class | ERP/Catalog | SKU × City | MinDOH/MaxDOH lookup |
| 8 | MinDOH/MaxDOH | Config | Item class | Reorder trigger |
| 9 | Case size | ERP/Catalog | SKU | Order rounding |
| 10 | Pod → WH mapping | Network config | Pod | Source warehouse |
| 11 | Pod capacity | Store master | Pod | Degradation logic |
| 12 | ERP/block flags | ERP/Catalog | SKU × City | Eligibility check |
| 13 | Manual overrides | Ops input | SKU × Pod | Adjustments |

### Warehouse Procurement (OTB)

| # | Input | Source | Granularity | Used For |
|---|-------|--------|-------------|----------|
| 1 | WH inventory | Inventory system | SKU × WH | DOH calculation |
| 2 | In-transit from brands | PO system | SKU × WH | Effective inventory |
| 3 | Aggregate Pod demand | MP output | SKU × WH | Demand signal |
| 4 | Vendor code | Vendor master | SKU | PO creation |
| 5 | Vendor lead time | Vendor master | Vendor | MinDOH calculation |
| 6 | Contract status | Contract system | SKU × Vendor | Eligibility check |
| 7 | MOQ/MOV | Vendor master | SKU × Vendor | Order rounding |
| 8 | Case size | ERP/Catalog | SKU | Order rounding |
| 9 | OTB budget | Finance | Category × WH | Budget constraint |
| 10 | WH MinDOH/MaxDOH | Config | Item class | Reorder trigger |
| 11 | Historical fill rate | GRN data | Vendor | Safety stock adjustment |
| 12 | ERP/block flags | ERP/Catalog | SKU × City | Eligibility check |
| 13 | WH inward capacity | WH ops | WH × Day | Appointment constraint |

---

## Data Dependency Chain

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│                         DATA DEPENDENCY CHAIN                                   │
│                                                                                 │
│  SALES DATA                                                                     │
│      │                                                                          │
│      ▼                                                                          │
│  ┌─────────────────┐                                                            │
│  │ Run Rate (RR)   │◄─── Availability Correction + OPD Bump                     │
│  └────────┬────────┘                                                            │
│           │                                                                     │
│           ▼                                                                     │
│  ┌─────────────────┐                                                            │
│  │ Pod Demand      │                                                            │
│  └────────┬────────┘                                                            │
│           │                                                                     │
│           ├─────────────────────────────────────┐                               │
│           │                                     │                               │
│           ▼                                     ▼                               │
│  ┌─────────────────┐                   ┌─────────────────┐                      │
│  │ Movement Plan   │                   │ WH Aggregate    │                      │
│  │ (Pod Order Qty) │                   │ Demand          │                      │
│  └────────┬────────┘                   └────────┬────────┘                      │
│           │                                     │                               │
│           │                                     ▼                               │
│           │                            ┌─────────────────┐                      │
│           │                            │ OTB Order       │                      │
│           │                            │ (Brand PO Qty)  │                      │
│           │                            └────────┬────────┘                      │
│           │                                     │                               │
│           ▼                                     ▼                               │
│  ┌─────────────────┐                   ┌─────────────────┐                      │
│  │ WH → Pod PO     │                   │ Brand → WH PO   │                      │
│  └─────────────────┘                   └─────────────────┘                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Key Insight:** OTB depends on Movement Planning output (aggregate Pod demand), so MP should run before OTB, or OTB should use independent WH-level forecasts.

---

## Data Quality Requirements

| Data Input | Freshness | Completeness | Accuracy Impact |
|------------|-----------|--------------|-----------------|
| **Pod inventory** | Real-time / Near real-time | Must have all SKU-Pod | Direct DOH error |
| **Sales data** | Daily | 7-day window required | RR calculation error |
| **OPD forecast** | Daily refresh | Next 3 days | Bump factor error |
| **Item class** | Weekly refresh OK | All SKUs classified | Wrong thresholds |
| **Contracts** | Real-time validity check | All SKU-Vendor pairs | PO rejection |
| **Fill rate history** | Weekly refresh OK | Per vendor | Safety stock miscalc |

---

*Reference document for Instamart Inventory System Data Architecture*
*Based on IM Availability Reasons meeting (Jan 14, 2026)*
