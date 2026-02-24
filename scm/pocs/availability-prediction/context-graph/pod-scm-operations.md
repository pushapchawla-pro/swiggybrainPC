# Instamart Pod Inventory Replenishment - V2

> **Scope:** This document covers Pod-level inventory management only. Warehouse-to-Brand (OTB) procurement is covered separately.

---

## The Core Idea

You have inventory at a Pod. Customers buy it. You need to reorder from the Warehouse before it runs out.  
But orders take time to arrive. So you must order **EARLY** enough.

---

## Step 1: Measure Inventory in DAYS, Not Units

Instead of asking *"How many units do I have?"*  
Ask *"How many DAYS will this last?"*

```
                      Current Inventory (units)
Days of Holding  =   ─────────────────────────────
                         Run Rate (units/day)
```

**Example:**
| Metric | Value |
|--------|-------|
| Current Inventory | 60 units |
| Run Rate | 20 units/day |
| **DOH** | 60 ÷ 20 = **3 days** |

---

## Step 2: Calculate Run Rate (The Tricky Part)

Run Rate is NOT simply "average sales last 7 days". Two adjustments are made:

### 2a. Availability-Corrected Sales

**Problem:** If you were out of stock, you lost sales. Raw sales undercount true demand.

```
                                    Raw Sales
Availability-Corrected Sales  =  ────────────────────
                                 Availability Factor
```

**How it works:**
- Each L1 category (e.g., Beverages, Snacks) has a correction factor
- If availability was 80% and factor says "10% uplift at 80%", then:

```
Example:
─────────────────────────────────────────────────────────────
Day    │ Raw Sales │ Availability │ Correction │ Adjusted
─────────────────────────────────────────────────────────────
Day 1  │    10     │    100%      │    1.00    │    10
Day 2  │     9     │     90%      │    1.05    │    9.5
Day 3  │     8     │     80%      │    1.10    │    8.8
Day 4  │    12     │    100%      │    1.00    │    12
Day 5  │    11     │    100%      │    1.00    │    11
Day 6  │     7     │     70%      │    1.15    │    8.1
Day 7  │    13     │    100%      │    1.00    │    13
─────────────────────────────────────────────────────────────
                          7-Day Adjusted Average  │   10.3
```

> **Philosophy:** We'd rather over-forecast than under-forecast.

---

### 2b. OPD Bump Factor

**Problem:** Tomorrow might be a festival, weekend, or marketing push day.

**Solution:** DS team provides OPD (Orders Per Day) forecast for next 3 days.

```
If predicted OPD > current average OPD:
    Bump up the base forecast proportionally

Example:
─────────────────────────────────────────────────────
Current 7-day avg OPD     │  10,000 orders/day
Predicted OPD (next 3d)   │  11,000 orders/day
Bump Factor               │  11,000 / 10,000 = 1.1x
─────────────────────────────────────────────────────
Base RR for Coke          │  10.3 units/day
Final RR for Coke         │  10.3 × 1.1 = 11.3 units/day
```

> **What OPD captures:** Day of week, festivals, marketing spend, seasonality.

---

### 2c. New SKU Handling

**Problem:** No sales history for new items.

**Solution:** 
1. Look at nearby clusters - how is this SKU selling there?
2. Look at similar SKUs in same category - what's their run rate?
3. Use the higher of the two as initial estimate

---

### Final Run Rate Formula

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   RR = Availability-Corrected 7-Day Avg × OPD Bump Factor               │
│                                                                         │
│   For new SKUs: RR = max(cluster average, similar SKU average)          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step 3: The Protection Window (Why You Can't Wait Till Zero)

Three delays stack up:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     LEAD        │     │     REVIEW      │     │     SAFETY      │
│     TIME        │  +  │    FREQUENCY    │  +  │     STOCK       │  =  MinDOH
│      (L)        │     │      (F)        │     │     (SS)        │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
    Warehouse takes         You check              Buffer for:
    L days to               inventory every        - Demand spikes
    deliver                 F days                 - Delivery delays
    (18-36 hrs)             (daily)                - Forecast errors
```

**Base Parameters:**
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **L** (Lead Time) | 1.5 days | 18-36 hours from PO to delivery |
| **F** (Review Frequency) | 1 day | Movement plan runs multiple times daily (see below) |
| **SS** (Safety Stock) | 0.5 days | Conservative buffer |
| **Base MinDOH** | 3 days | L + F + SS |

### Movement Plan Schedule (Not All Runs Are Equal)

```
┌──────────────────────────────────────────────────────────────────┐
│  Plan Type     │  When          │  Purpose                       │
├────────────────┼────────────────┼────────────────────────────────┤
│  DD_Day_1      │  Morning       │  Urgent top-item replenishment │
│  BAU_Day_1     │  ~2 PM         │  Main planning run (full SKUs) │
│  BAU_Day_2     │  Afternoon     │  Next-day planning             │
│  DD_Night_1    │  Evening       │  Fast-moving item catch-up     │
│  BAU_Night_1   │  Night         │  Final reconciliation          │
├────────────────┼────────────────┼────────────────────────────────┤
│  Cold Plans    │  1 PM & 7 PM   │  Freezer/chiller items         │
│                │                │  (volumetric constraints)      │
├────────────────┼────────────────┼────────────────────────────────┤
│  Ad-Hoc        │  Anytime       │  Manual trigger for spikes     │
└──────────────────────────────────────────────────────────────────┘

DD = Direct Delivery (top items, aggressive)
BAU = Business As Usual (regular replenishment)
```

---

## Step 4: Item Class Stratification (NOT All SKUs Are Equal)

Different SKUs get different treatment based on their importance:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ITEM CLASS THRESHOLDS                            │
├─────────────────┬─────────┬─────────┬───────────────────────────────────┤
│  Item Class     │ MinDOH  │ MaxDOH  │  Notes                            │
├─────────────────┼─────────┼─────────┼───────────────────────────────────┤
│  Top 50         │  3.0    │  3.5    │  Aggressive replenishment         │
│                 │         │         │  Target: 98%+ availability        │
├─────────────────┼─────────┼─────────┼───────────────────────────────────┤
│  Top 100        │  2.5    │  3.0    │  High priority                    │
│                 │         │         │  Target: 95%+ availability        │
├─────────────────┼─────────┼─────────┼───────────────────────────────────┤
│  MSKU           │  2.0    │  2.5    │  Medium priority                  │
│  (Medium SKU)   │         │         │                                   │
├─────────────────┼─────────┼─────────┼───────────────────────────────────┤
│  Long-tail      │  1.0    │  1.5    │  Lower priority                   │
│                 │         │         │  Forecast error too high anyway   │
└─────────────────┴─────────┴─────────┴───────────────────────────────────┘
```

**Why different thresholds?**

```
Top 50 Item (e.g., Coke):
─────────────────────────────────────
- High volume, predictable demand
- Forecast error: Low
- Cost of stockout: Very high (customers leave)
- Strategy: Keep more buffer

Long-tail Item (e.g., Korean Noodles):
─────────────────────────────────────
- Low volume, sporadic demand  
- Forecast error: Very high
- Cost of stockout: Lower (fewer customers affected)
- Strategy: Accept some stockouts, don't overstock
```

> **Classification is done at city level** based on GMV, order penetration, revenue share over last 45-50 days.

---

## Step 5: Effective Inventory (Don't Forget In-Transit Stock)

**Problem:** You might have already ordered stock that's on the way.

```
Effective Inventory = On-Hand Inventory + In-Transit Inventory
                                          (POs raised but not yet received)
```

**Example:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   On-Hand Inventory        │  40 units                                  │
│   In-Transit (from WH)     │  20 units (arriving in 6 hrs)              │
│   ─────────────────────────┼────────────────────────────────            │
│   Effective Inventory      │  60 units                                  │
│                                                                         │
│   Run Rate                 │  20 units/day                              │
│   ─────────────────────────┼────────────────────────────────            │
│   Effective DOH            │  60 ÷ 20 = 3 days                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Why this matters:** Without this, you might double-order.

---

## Step 6: The Reorder Decision

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   IF  Effective DOH  <  MinDOH  (for that item class)                   │
│                                                                         │
│   THEN  Trigger reorder                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Visual:**

```
INVENTORY
(Days of Holding)
     │
MaxDOH ─ ─ ─ ─ ─ ─ ─ ─ ─┬─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┬─ ─ ─ ─ ─ ─ ─  TARGET
(3.5) │                 │                           │
      │ ╲               │ ╲                         │ ╲
      │  ╲  Customers   │  ╲                        │  ╲
      │   ╲ buying      │   ╲                       │   ╲
MinDOH│─ ─ ●─ ─ ─ ─ ─ ─ │─ ─ ●─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│─ ─ ●─ ─ ─ ─ ─  TRIGGER
 (3)  │    │░░░░░░░░░░░░│    │░░░░░░░░░░░░░░░░░░░░░│    │░░░░░░░░░
      │    │░░ RISK ░░░░│    │░░░░░░ RISK ░░░░░░░░░│    │░░░░░░░░░
      │    │░░ ZONE ░░░░│    │░░░░░░ ZONE ░░░░░░░░░│    │░░░░░░░░░
 0    │────┴────────────┴────┴─────────────────────┴────┴──────────  OOS
      │
      └───────────────────────────────────────────────────────────► TIME
           │            │    │                     │
          PO         Stock  PO                   Stock
        RAISED      ARRIVES RAISED              ARRIVES
```

---

## Step 7: Order Quantity Adjustments (Reality is Messy)

### 7a. Raw Order Calculation

```
Raw Order Qty = (MaxDOH - Effective DOH) × Run Rate
```

**Example (Top 50 item):**
```
MaxDOH           = 3.5 days
Effective DOH    = 3.0 days
Run Rate         = 20 units/day

Raw Order Qty    = (3.5 - 3.0) × 20 = 10 units
```

---

### 7b. Case Size Rounding

**Problem:** Items come in fixed case sizes (e.g., Coke in dozens).

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CASE SIZE ROUNDING RULES                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   IF Raw Order < 1 case:                                                │
│       Round UP to 1 case                                                │
│                                                                         │
│   IF Raw Order > 1 case:                                                │
│       Round to nearest case                                             │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│   Example: Coke case size = 12 units                                    │
│                                                                         │
│   Raw Order │ Logic                        │ Actual Order               │
│   ──────────┼──────────────────────────────┼─────────────               │
│      5      │ < 12, round up               │    12                      │
│      9      │ < 12, round up               │    12                      │
│     14      │ > 12, round to nearest       │    12                      │
│     18      │ > 12, round to nearest       │    24                      │
│     25      │ > 24, round to nearest       │    24                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 7c. Degradation Logic (Space Constraints)

**Problem:** Pod has limited physical space. Can't always fit MaxDOH worth of stock.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEGRADATION LOGIC                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   1. Try to order up to MaxDOH (e.g., 3.5 days)                         │
│                                                                         │
│   2. IF pod doesn't have space:                                         │
│        Degrade target: 3.5 → 3.4 → 3.3 → ... → MinDOH                   │
│                                                                         │
│   3. For low-priority items:                                            │
│        May degrade MinDOH upward: 1.0 → 1.5 (skip them entirely)        │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│   Example:                                                              │
│                                                                         │
│   Pod capacity: 5,000 items                                             │
│   Current stock: 4,800 items                                            │
│   Space available: 200 items                                            │
│                                                                         │
│   Coke needs 50 units to hit MaxDOH                                     │
│   Korean Noodles needs 30 units to hit MaxDOH                           │
│   ... (many more SKUs)                                                  │
│                                                                         │
│   Total needed: 500 units > 200 available                               │
│                                                                         │
│   → Prioritize Top 50/100 items                                         │
│   → Degrade targets for long-tail items                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 7d. Final Order Quantity Formula

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   1. Raw Order = (MaxDOH - Effective DOH) × RR                          │
│                                                                         │
│   2. Subtract in-transit: Raw Order - In-Transit Qty                    │
│                                                                         │
│   3. Apply case size rounding                                           │
│                                                                         │
│   4. Apply degradation if space constrained                             │
│                                                                         │
│   5. Final Order Qty = max(0, result)                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step 8: Pod-Level Constraints (Why Stock Doesn't Reach Pod)

Even when Warehouse has stock, several constraints can prevent it from reaching the Pod:

### 8a. Movement Blocking

**Problem:** SKU is explicitly blocked from movement planning.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MOVEMENT BLOCKING                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Scenario 1: No Run Rate Generated                                     │
│   ─────────────────────────────────────                                 │
│   movement_rr = NULL for this store-item                                │
│   → Movement plan never created                                         │
│   → Owner: Planning                                                     │
│                                                                         │
│   Scenario 2: Run Rate Explicitly Blocked                               │
│   ─────────────────────────────────────                                 │
│   movement_rr = 0.001 (sentinel value)                                  │
│   → SKU is in movement block list                                       │
│   → Owner: Planning                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8b. ERP/Catalog Issues

**Problem:** Item is disabled or not configured in systems.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ERP/CATALOG CONSTRAINTS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ERP Disabled:                                                         │
│   Item not present/enabled in ERP region sheet for city                 │
│   → Cannot order/sell even if WH has stock                              │
│   → Owner: Catalog                                                      │
│                                                                         │
│   Temp Disable:                                                         │
│   ERP temp flag = 'Temp Disable'                                        │
│   → Deliberately blocked from sale                                      │
│   → Owner: Catalog                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8c. Pod Capacity Constraints

**Problem:** Pod doesn't have physical space for more inventory.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        POD CAPACITY CONSTRAINTS                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Pod Capacity Capping:                                                 │
│   Movement plan suggests X units, but pod can only fit Y < X            │
│   → Remaining demand not served                                         │
│   → Owner: Pod Ops                                                      │
│                                                                         │
│   Freezer Space Issue (Cold items):                                     │
│   Cold chain pods have limited freezer/chiller space                    │
│   → Cold items get capped more aggressively                             │
│   → Owner: Pod Ops                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8d. Warehouse Capacity Constraints

**Problem:** Warehouse can't ship full suggested quantity.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     WAREHOUSE CAPACITY CONSTRAINTS                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   WH Capacity Capping:                                                  │
│   Movement plan limited by WH capacity settings                         │
│   → WH can't ship full suggested quantity                               │
│   → Owner: Warehouse                                                    │
│                                                                         │
│   WH Movement Settings Reduced:                                         │
│   Configured DOH cutoff < observed cutoff                               │
│   → Settings tightened to stay within WH capacity                       │
│   → Owner: Warehouse                                                    │
│                                                                         │
│   Movement Design Issue:                                                │
│   DOH cutoff = rule cutoff but actual < allowed limit                   │
│   → Movement too conservative BY DESIGN                                 │
│   → Owner: Planning                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8e. WH → Pod Fulfillment Issues

**Problem:** Warehouse has stock but doesn't deliver fully to Pod.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WH → POD FULFILLMENT ISSUES                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Outbound Fill Rate Issue:                                             │
│   Pod-level order fill rate < 80%                                       │
│   → WH didn't serve pod demand fully                                    │
│   → Owner: Warehouse                                                    │
│                                                                         │
│   Stock Transfer Delay:                                                 │
│   Movement plan date > WH inward date                                   │
│   → Lag between WH receiving stock and sending to Pod                   │
│   → Owner: Warehouse                                                    │
│                                                                         │
│   QPL (Picker Efficiency) Issue:                                        │
│   transfer_qty > ordered_units                                          │
│   → Quantities dropped to maintain picker efficiency                    │
│   → Owner: Warehouse                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8f. Pod Inward Delays

**Problem:** Stock reached Pod but isn't available for sale.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        POD INWARD DELAYS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Putaway Delay at Pod:                                                 │
│   Invoice-to-putaway time > city median/70th percentile                 │
│   → Stock slow to become sellable                                       │
│   → Owner: Pod Ops                                                      │
│                                                                         │
│   WH Putaway Delay:                                                     │
│   Stock inwarded at WH but not put away (low free_doh)                  │
│   → Material in staging, can't flow to pods                             │
│   → Owner: Warehouse                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8g. Forecasting Errors

**Problem:** Demand spiked faster than predicted.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FORECASTING ERRORS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Trigger: Sales in last 2 days > 3× movement run rate                  │
│                                                                         │
│   Example:                                                              │
│   Movement RR: 20 units/day                                             │
│   Actual sales: 70 units in last 2 days (35/day = 1.75x... wait)        │
│   If > 60 units in 2 days (3× threshold) → Forecast Error               │
│                                                                         │
│   Owner: Planning                                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step 9: Edge Cases & Exceptions

### 9a. Stock Sufficiency (Warehouse Can't Fulfill All Pods)

**Problem:** Warehouse has 100 units, but all pods combined need 500 units.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STOCK SUFFICIENCY LOGIC                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   When warehouse stock < total pod demand:                              │
│                                                                         │
│   1. Rank pods by IMPORTANCE for that specific SKU                      │
│      (based on sales velocity, order penetration)                       │
│                                                                         │
│   2. Fulfill high-importance pods first                                 │
│                                                                         │
│   3. Low-importance pods may get partial or zero fulfillment            │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│   Example:                                                              │
│                                                                         │
│   Warehouse has: 100 units of Coke                                      │
│                                                                         │
│   Pod A needs: 80 units (high importance for Coke) → Gets 80            │
│   Pod B needs: 60 units (medium importance)        → Gets 20            │
│   Pod C needs: 40 units (low importance)           → Gets 0             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Impact:** Your pod might raise a valid PO but still go OOS because warehouse prioritized other pods.

---

### 9b. Ad-Hoc Orders (Emergency Mechanism)

**Problem:** Unexpected sales spike mid-cycle. Can't wait for next scheduled replenishment.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AD-HOC ORDERS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   When: Sales spike detected, stock depleting faster than expected      │
│                                                                         │
│   What: Small emergency order pushed to warehouse                       │
│                                                                         │
│   Lead time: 12-15 hours (vs normal 18-36 hours)                        │
│                                                                         │
│   How: Tagged along with next scheduled shipment                        │
│                                                                         │
│   Constraint: Small quantities only (not 10,000 units)                  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│   Example:                                                              │
│                                                                         │
│   Normal RR: 20 units/day                                               │
│   Today's actual: 35 units by 2 PM (spike!)                             │
│                                                                         │
│   → Ops team triggers ad-hoc order for 30 extra units                   │
│   → Arrives with evening shipment (12 hrs later)                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

> **Note:** This is a manual override by ops team, not automated.

---

### 9c. Unpredictable Demand Spikes (Grapes Problem)

**Problem:** Some spikes are fundamentally unpredictable.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    UNPREDICTABLE SPIKE EXAMPLES                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   • Grapes on New Year's Eve (Mexican tradition went viral)             │
│   • Coconut oil price spike (external market doubled, our MRP fixed)    │
│   • Social media trends (unpredictable by nature)                       │
│   • Sudden discounting decisions (internal, last-minute)                │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Current state: NOT modeled. Accepted as unavoidable.                  │
│                                                                         │
│   Mitigation:                                                           │
│   • Ad-hoc orders (reactive)                                            │
│   • Learn for next year (grapes now planned for NYE)                    │
│   • Accept some stockouts for truly random events                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Flowchart

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   FOR EACH SKU IN POD (runs multiple times daily per plan type):                │
│                                                                                 │
│   ┌─────────────────────────────────────────┐                                   │
│   │  Step 1: Calculate Run Rate (RR)        │                                   │
│   │  • 7-day avg with availability correction│                                   │
│   │  • Apply OPD bump factor                │                                   │
│   └──────────────────┬──────────────────────┘                                   │
│                      │                                                          │
│                      ▼                                                          │
│   ┌─────────────────────────────────────────┐                                   │
│   │  Step 2: Calculate Effective DOH        │                                   │
│   │  • DOH = (On-Hand + In-Transit) ÷ RR    │                                   │
│   └──────────────────┬──────────────────────┘                                   │
│                      │                                                          │
│                      ▼                                                          │
│   ┌─────────────────────────────────────────┐                                   │
│   │  Step 3: Get MinDOH/MaxDOH              │                                   │
│   │  • Look up item class (Top 50/100/etc)  │                                   │
│   └──────────────────┬──────────────────────┘                                   │
│                      │                                                          │
│                      ▼                                                          │
│   ┌─────────────────────────────────────────┐                                   │
│   │  Step 4: Check Trigger                  │                                   │
│   │  Is Effective DOH < MinDOH?             │                                   │
│   └──────────────────┬──────────────────────┘                                   │
│                      │                                                          │
│          ┌───────────┴───────────┐                                              │
│          │                       │                                              │
│          ▼                       ▼                                              │
│   ┌─────────────┐    ┌───────────────────────────────────────────────────────┐  │
│   │     NO      │    │  YES → Calculate Order                                │  │
│   │             │    │                                                       │  │
│   │  Do nothing │    │  Raw Qty = (MaxDOH - Eff DOH) × RR                    │  │
│   │             │    │         ↓                                             │  │
│   │             │    │  Apply case size rounding                             │  │
│   │             │    │         ↓                                             │  │
│   │             │    │  Apply degradation (if space constrained)             │  │
│   │             │    │         ↓                                             │  │
│   │             │    │  Raise PO to Warehouse                                │  │
│   └─────────────┘    └───────────────────────────────────────────────────────┘  │
│                                                                                 │
│   ═══════════════════════════════════════════════════════════════════════════   │
│              REPEATS PER PLAN TYPE (DD morning/night, BAU day/night)            │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                 │
│   EXCEPTIONS (handled outside normal flow):                                     │
│   • Stock sufficiency → WH may not fulfill full PO                              │
│   • Ad-hoc orders → Manual trigger for spikes (anytime)                         │
│   • Unpredictable spikes → Accepted as unavoidable                              │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Card

### Core Formulas

| Formula | Expression |
|---------|------------|
| **Run Rate** | Availability-Corrected 7-Day Avg × OPD Bump |
| **Effective DOH** | (On-Hand + In-Transit) ÷ Run Rate |
| **MinDOH** | L + F + SS (varies by item class) |
| **Raw Order Qty** | (MaxDOH - Effective DOH) × Run Rate |

### Item Class Thresholds

| Item Class | MinDOH | MaxDOH | Availability Target |
|------------|--------|--------|---------------------|
| Top 50 | 3.0 | 3.5 | 98%+ |
| Top 100 | 2.5 | 3.0 | 95%+ |
| MSKU | 2.0 | 2.5 | ~90% |
| Long-tail | 1.0 | 1.5 | Best effort |

### Base Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Lead Time (L) | 1.5 days | 18-36 hours WH → Pod |
| Review Frequency (F) | 1 day | Multiple plan types run daily |
| Safety Stock (SS) | 0.5 days | Conservative buffer |

### Plan Types

| Type | Schedule | Focus |
|------|----------|-------|
| DD (Direct Delivery) | Morning + Night | Top items, aggressive |
| BAU (Business As Usual) | ~2 PM + Night | Full SKU coverage |
| Cold | 1 PM + 7 PM | Freezer/chiller items |
| Ad-Hoc | Anytime | Manual spike response |

### Decision Rule

```
IF    Effective DOH < MinDOH    →    Order (MaxDOH - Eff DOH) × RR
                                     then apply case rounding + degradation
ELSE                            →    Do nothing
```

---

## What This Document Does NOT Cover

| Topic | Covered In |
|-------|------------|
| Warehouse → Brand (OTB) procurement | Separate doc |
| Warehouse stock sufficiency logic | Separate doc |
| Movement planning job architecture | Tech doc |
| Pod-to-Pod transfers | Separate doc (pilot) |
| Hyper-local assortment optimization | DS doc |

---

## Summary

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  1. RR = Availability-Corrected Sales × OPD Bump                       │
│                                                                        │
│  2. Effective DOH = (On-Hand + In-Transit) ÷ RR                        │
│                                                                        │
│  3. MinDOH/MaxDOH vary by item class (Top 50 vs Long-tail)             │
│                                                                        │
│  4. IF Effective DOH < MinDOH:                                         │
│         Order (MaxDOH - DOH) × RR                                      │
│         → Round to case size                                           │
│         → Apply degradation if space constrained                       │
│                                                                        │
│  5. Edge cases: Stock sufficiency, Ad-hoc orders, Unpredictable spikes │
│                                                                        │
│  This is: Periodic Review, Order-Up-To-Level (R,S) Policy              │
│           with item-class stratification and real-world constraints    │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

---

*V2 - Updated based on IM Availability Reasons meeting (Jan 14, 2026)*

---

## Appendix: Pod-Level RCA Reason Codes

When Warehouse has stock (INSTOCK) but Pod can't sell, these are the attribution codes:

| Code | Bin | Owner | Logic | Description |
|------|-----|-------|-------|-------------|
| `instock_0.pod_inactive` | POD Inactive | Business | `pod_active_flag=0` | Pod is inactive/closed in store master |
| `instock_1.Not in ERP` | ERP Disabled | Catalog | `erp_item_code=null` | Item not present/enabled in ERP for city |
| `instock_2.movement_pod_closure` | POD Closure | Pod Ops | `pod_enable=0` | Pod disabled in movement planning |
| `instock_3.temp_disable` | Temp Disable | Catalog | `erp_temp_flag='Temp Disable'` | Item deliberately blocked from sale |
| `instock_5.Fresh_Items` | Fresh | NA | `fresh_non_fresh=1` | Fresh items (separate treatment) |
| `instock_6.movement_rr_not_generated` | Movement_Blocking | Planning | `movement_rr=NULL` | No run-rate generated for store-item |
| `instock_7.movement_rr_blocked` | Movement_Blocking | Planning | `movement_rr=0.001` | RR explicitly blocked (sentinel value) |
| `instock_8.POD Cap Missed` | Pod Missed Qty | Pod Ops | `pod_capacity_issue2>0` | Pod capacity capping |
| `instock_9.WH Cap Missed` | WH Missed Qty | Warehouse | `wh_capacity_issue2>0` | WH capacity capping |
| `instock_10.WH_Cap_Movement_Reduced` | WH Capacity | Warehouse | `cutoff_actual<cutoff` | Movement settings tightened for WH capacity |
| `instock_11.pod_Space Issue_cold` | Pod_Space Issue_freezer | Pod Ops | `space_issue1=1` | Freezer space constraints |
| `instock_12.wh_ob_Fillrate Issue` | WH Outbound Fillrate | Warehouse | `pod_fillrates_issue=1 OR stock_issue=1` | WH→Pod fill rate <80% |
| `instock_12a.wh_ob_mp_delay_issue` | Stock Transfer Delay | Warehouse | `mp_delay_issue=1` | WH→Pod transfer delay |
| `instock_13.Forecasting_error` | Forecast Error | Planning | `sales > movement_rr × 3` | Sales spike >3x in 2 days |
| `instock_14.Putaway_delay` | Pod Inward Delay | Pod Ops | `putaway_delay>0` | Slow GRN at Pod |
| `instock_15.wh_putaway_delay` | WH Putaway Delay | Warehouse | `free_doh<3` | Stock not put away at WH |
| `instock_16.Movement Design issue` | Movement Setting Design | Planning | `cutoff_doh=cutoff AND cutoff_actual<cutoff_limit` | Conservative settings by design |
| `instock_17.Others` | Unallocated Bin | NA | `all_other_instock_flags=0` | Catch-all for unattributed cases |
| `instock_18.qpl_issue` | WH Outbound Fillrate | Warehouse | `transfer_qty>orderedunits AND non_avail_sessions>0` | Qty dropped for picker efficiency |

### Owner Summary (Pod-Level INSTOCK Issues)

| Owner | Codes | Responsibility |
|-------|-------|----------------|
| **Planning** | 5 | Movement blocking, forecast errors, design issues |
| **Warehouse** | 5 | Capacity, putaway, outbound fill rate, transfer delays |
| **Pod Ops** | 4 | Capacity, space, inward delays, pod closure |
| **Catalog** | 3 | ERP disabled, temp disable |
| **Business** | 1 | Pod inactive |
| **NA** | 2 | Fresh items, unallocated |
