# Planning Team Persona

## Overview

**Mission**: Own demand forecasting and movement planning to ensure the right inventory reaches the right pods at the right time, maximizing availability while minimizing wastage.

**Operating Level**: City level, Warehouse level, Brand/Category level (global movement and forecast settings)

**Key Leaders**:
- Sunil Rathee (AVP Data Science) - DS-led forecasting and movement planning
- Daniel Belteshazzar (Danny) - Product lead for movement planning
- Vidyadhar Mudium - DS lead for movement planning models
- Shubhankar Mishra - DS engineer for FnV movement planning

---

## Key Responsibilities

### A. Demand Forecasting

| Level | Model | Granularity | Use Case |
|-------|-------|-------------|----------|
| OPD Forecasting | TFT (Temporal Fusion Transformer) | Pod × Hour × Day | Raider/DE planning, capacity planning |
| SKU Forecasting | GBT/ML models | SKU × POD × Day (T+1 to T+10) | Movement planning, stock ordering |
| FnV Forecasting | Runrate models with dual dispatch | Item × Store × Slot | Fresh category movement |
| WH Forecasting | Unconstrained demand forecast | WH × SKU | PO raising, procurement |

### B. Movement Planning

- **Daily Movement Plans**: Generate WH → POD movement plans based on forecasted demand, current inventory, DOH settings, and capacity constraints
- **Dual/Triple Dispatch**: Multiple daily dispatches for FnV to manage freshness
- **QPL (Quantity Per Line) Management**: Handle constraints on what can be picked/shipped
- **Slot-wise Planning**: Slot 1, Slot 2, Slot 3 aligned with WH outbound and POD inwarding capacity

### C. Run-Rate & DOH Configuration

- Set run-rate cutoffs per item class
- Configure Days of Holding (DOH) thresholds by category
- Tune safety stock parameters
- Design item-class-specific replenishment logic

---

## Systems & Tools

### Forecasting Systems

| System | Description | Output |
|--------|-------------|--------|
| **TFT Pipeline** | 10-stage ML pipeline for OPD demand forecasting | `data_science.ds_storefront.im_pod_hr_demand_forecasting` |
| **SKU Demand Forecast** | GBT model predicting T+1 to T+10 demand | Consumed by movement planning |
| **TimeGEN-1** | Next-gen forecasting model | POC stage |

### Movement Planning Systems

| System | Description |
|--------|-------------|
| **Movement Planning Portal** | Dashboard for uploading/viewing movement files (im-ops-hub / MIM Dashboard) |
| **PuLP Optimization** | Mathematical optimization for FnV dual dispatch |
| **DS Movement Planning Jobs** | Automated daily jobs generating movement plans |

### Input Sources

- **Google Sheets**: Forecast inputs (marketing spend, growth targets, surplus distribution, operational hours)
- **Snowflake Tables**: Historical orders, availability, PSLA, store master, sales data
- **Vinculum**: Warehouse management sync

### Alerts & Monitoring

- **Slack Channel**: `#im-pod-hr-demand-forecasting-alerts`
- **Incident Response**: P1 alerts for Demand Planning Job Failed, Movement Planning Failed

---

## Key Metrics

### Forecasting Accuracy

| Metric | Definition | Current Performance |
|--------|------------|---------------------|
| **wMAPE** | Weighted Mean Absolute Percentage Error | ~17.5-18.6% for OPD (pod-hour) |
| **Forecast Bias** | Over/under forecasting tendency | Tracked by SKU class |
| **MAPE by Horizon** | Accuracy degradation as forecast horizon increases | Current week better than next week |

### Movement Planning Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **Missed Qty** | Items in plan but not shipped due to constraints | Minimize |
| **Triggered Qty** | Quantity actually moved vs planned | 100% |
| **Pod Capacity Utilization** | % of pod capacity filled | Optimal fill |
| **WH Outbound Fill Rate** | % of plan fulfilled from WH | 100% |

### Business Impact

| Metric | Target |
|--------|--------|
| **Availability** | 99.9% (Bradman SKUs) |
| **DOH (Days of Inventory)** | Category-specific targets |
| **Wastage %** | Minimize |

---

## Common Issues Handled

### Forecasting-Led Issues

| Issue | Description | Signal |
|-------|-------------|--------|
| **Demand underestimation** | Actual sales > forecast runrate | Sales >3x forecast indicates spike |
| **Conservative forecast settings** | DOH too low, safety stock insufficient | Repeated stockouts despite WH inventory |
| **Missing campaign/promotion signals** | Model doesn't incorporate future discounts | OOS during promo periods |
| **New SKU cold-start** | No history for new items | New launches with no forecast |
| **Rolling average lag** | Model requires consistent trends | Slow response to demand changes |

### Movement Planning Issues

| Issue | Description |
|-------|-------------|
| **Run-rate not generated** | No movement planned for SKU-POD combination |
| **Movement capped/blocked** | QPL constraints, capacity limits |
| **WH inventory mismatch** | Assuming infinite WH inventory when actual is constrained |
| **Pod over-supply** | Items exceeding rack capacity |
| **Slot timing issues** | Movement delayed, missing delivery windows |

### Availability Attribution (from Bradman 99.90)

| Source | Contribution to Miss |
|--------|---------------------|
| WH Forecasting + Ordering | 6.2% |
| POD Forecasting Error | 1.0% |
| Movement Planning | 1.4% |

---

## RCA Branch Mapping

### Planning-Owned Waterfall Codes

These are the actual `final_reason` values from `analytics.public.sku_wise_availability_rca_with_reasons_v7`:

| Waterfall Code | `final_reason` | Description | Planning Action |
|----------------|----------------|-------------|-----------------|
| `oos_6` | `movement_rr_not_generated` | No run-rate calculated → no movement planned | Check SKU-POD mapping, seed initial run-rate |
| `oos_7` | `movement_rr_blocked` | Run-rate explicitly set to 0.001 (blocked) | Review block reason, remove if not applicable |
| `oos_10` | `Planning Ordering Issue` | Default catch-all for PO/planning gaps | Review PO generation, adjust forecast |
| `instock_6` | `movement_rr_not_generated` | No run-rate at POD level | Check POD-level forecast setup |
| `instock_7` | `movement_rr_blocked` | Run-rate blocked at POD | Review POD-level block reason |
| `instock_13` | `Forecasting_error` | Actual sales >3x forecast run-rate | Demand spike - update forecast model |
| `instock_16` | `Movement Design issue` | Movement caps/min-max settings gap | Adjust movement design parameters |

### RCA Branches Owned by Planning

| Branch | Code | Description |
|--------|------|-------------|
| **A2** | WH-side Planning & Forecasting | `Planning Ordering Issue` |
| **B2** | POD-level Planning & Demand | `Forecasting_error` |
| **B3** | Replenishment Logic & Movement Design | `movement_rr_not_generated`, `movement_rr_blocked`, `Movement Design issue` |

---

## Stakeholder Interactions

| Stakeholder | Touchpoint |
|-------------|------------|
| **Warehouse Ops** | Movement plan feasibility, outbound capacity |
| **Pod Ops** | Plan execution, pod capacity, inwarding windows |
| **Procurement** | WH demand forecasts for PO raising |
| **Category Teams** | Sell plans, event plans, growth inputs |
| **Analytics** | Build movement planning files, track metrics |
| **DS Platform** | Model serving, job orchestration |

---

## SOPs & Playbooks

### Diagnosis SOP for Planning Issues

1. **Check** demand vs forecast for affected SKUs/pods during breach window
2. **Verify** movement plans were generated - look for run-rate generation flags
3. **Compare** forecast vs actual sales - identify under/over prediction
4. **Check** DOH and safety stock settings for the item class
5. **Review** WH vs POD capacity constraints that may have blocked movement
6. **Examine** slot-wise movement - identify if timing caused miss
7. **Confirm** forecast inputs (marketing spend, events) were updated
8. **Decide** planning changes: Increase forecast, adjust DOH cutoffs, modify movement design

### Common Playbooks

| Playbook | Action |
|----------|--------|
| **Demand Spike Response** | Manual forecast override via Google Sheets input |
| **New POD Launch** | Apply city-level patterns until store-specific history builds |
| **Campaign Planning** | Incorporate planned marketing spend as known future variable |
| **Dual Dispatch for FnV** | Multiple daily runs with slot-specific forecasts |

---

## Key Data Tables

| Purpose | Table | Granularity |
|---------|-------|-------------|
| OPD Forecast | `data_science.ds_storefront.im_pod_hr_demand_forecasting` | Pod × Hour × Day |
| SKU Demand | `data_science.im_b2b_demand_forecast_*` | SKU × POD × Day |
| Run-rate Output | `analytics.public.KS_GD_FINAL_RUNRATE` | Store × Item |
| Historical Orders | `analytics.public.im_parent_order_fact` | Order level |
| Availability | `analytics.public.pr_hr_level_avl` | Pod × Hour |

---

## Agent Integration

**When to route to Planning Team**:
- RCA points to "forecast too low", "movement not generated", "DOH/run-rate settings", "movement blocked/capped"
- Pattern is city-wide or warehouse-wide (not isolated pod issues)
- Demand vs forecast gap is significant

**Key Signals to Surface**:
- Forecast vs actual gap
- Run-rate generation status
- DOH settings for item class
- Movement plan triggered vs missed quantity
- Slot-wise movement execution

**Action Verbs**: Review, Adjust, Increase, Modify, Align
