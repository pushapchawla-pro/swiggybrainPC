# Swiggy Instamart SCM Metrics, KPIs, and Dashboards: Deep-Dive Research

## Executive Summary

This document provides comprehensive documentation on Swiggy Instamart's Supply Chain Management metrics, KPIs, dashboard ecosystem, and alerting systems. The metrics taxonomy spans availability, inventory health, speed, fill rate, and serviceability.

---

## 1. Availability Metrics Taxonomy

### 1.1 Out-of-Stock (OOS) Metrics

| Metric | Description |
|--------|-------------|
| **OOS Rate** | % of time items unavailable for customer orders |
| **Search OOS** | Items unavailable during search/discovery (searched but not displayed due to stock=0) |
| **Availability OOS** | Item displayed in catalog but not orderable (stock depleted after display) |
| **Chronic OOS** | Persistent out-of-stock for specific SKUs (high search demand but consistently poor availability) |

> **Note on OOS Types:** Search OOS measures items that customers search for but cannot find due to zero stock. Availability OOS measures items visible in catalog but unavailable when customer attempts to order. Chronic OOS tracks SKUs with persistent unavailability patterns despite demand signals.

### 1.2 Warehouse Availability

**Definition**: % of quantity present in warehouse to serve next 'x' days of pod orders

**Components:**
- **WH_AVL**: Current warehouse stock vs projected demand
- **Risky Warehouses %**: Warehouses below configured thresholds

**Metric Type**: `METRIC_TYPE_WH_AVAILABILITY`

### 1.3 POD Availability

**Definition**: % of time items available in the POD

**Calculation**: `Sessions item is available / Total sessions`

**Metric Type**: `METRIC_TYPE_POD_AVAILABILITY`

**Granularity:**
- SKU x Pod level tracking
- Hourly session-based monitoring
- Category and city aggregations

---

## 2. Inventory Health Metrics

### 2.1 Days on Hand (DOH) / Days of Inventory (DOI)

**Definition**: Number of days warehouse/pod can operate without new stock

**Calculation:**
```
DOH = Warehouse Quantity Available / Final Run Rate
If run rate = 0, then DOH = 365
```

**Critical Thresholds:**

| Level | DOH Value |
|-------|-----------|
| **Critically Low** | <= 1 day |
| **Low** | > 1 and <= 5 days |
| **Alternate Low** | <= 7 days |

**Metric Type**: `METRIC_TYPE_WH_DOH`

**Key Fields:**
- `item_count_with_critically_low_doh`: SKUs with DOH <= 1
- `item_count_with_low_doh`: SKUs with 1 < DOH <= 5
- `warehouse_count_with_critically_low_doh`
- `warehouse_count_with_low_doh`

### 2.2 Wastage and Shrinkage Tracking

**Wastage Categories:**

| Category | Description |
|----------|-------------|
| **Expired Wastage** | Items past CX Cutoff with no RTV/Liquidation |
| **Damage** | Spoiled, mishandled, defective items |
| **Pilferage** | Physical count < system inventory |

**Data Sources:**
- `analytics.public.im_wastage_damage_sub_disp`
- `analytics.public.im_wastage_report_sub_disp`
- `analytics.public.MIM_WASTAGE_v1`

**Tracking Dimensions:**
- Marked date, store ID, SKU ID, expiry date
- Disposition type (Pilferage, Damage, Expired)
- Sub-disposition categories
- L1/L2 category breakdowns
- Cold/Ambient classification

**Key Metrics:**
- **Wastage CPO**: `wastage_value / orders`
- **Wastage % of GMV**: `(wastage_value / GMV) * 100`

### 2.3 Inventory Units

| Metric Type | Description |
|-------------|-------------|
| `METRIC_TYPE_INVENTORY_UNITS_SOLD` | Total units sold |
| `METRIC_TYPE_INVENTORY_UNITS_AVAILABLE` | Total units available (POD_UNITS) |

### 2.4 Potential Sales Loss Metrics

**Calculation Logic:**
```
Potential GMV Loss (7 days) =
  CASE WHEN DOH <= 5
  THEN GREATEST(final_rr * 7 - wh_qty_available, 0) * MRP
  ELSE 0 END

Percentage = (potential_gmv_loss / total_gmv) * 100
```

---

## 3. Speed and Fulfillment Metrics

### 3.1 Order-to-Accept (O2A)

**Definition**: Time from order placement to order acceptance by pod

**Usage:**
- Critical for PSLA models
- Component of delivery time prediction
- Monitored via EagleEye dashboards (migrated from Grafana to Retool, completed January 2025)

### 3.2 Fulfillment Funnel

| Metric | Description |
|--------|-------------|
| **O2A** | Order to Accept |
| **O2MFR** | Order to Market Fulfillment Ready |
| **MFR2P** | Market Fulfillment Ready to Pickup |
| **P2R** | Pickup to Return |

### 3.3 Pod-Led Metrics

| Metric | Description |
|--------|-------------|
| **O2C** | Order to Confirm |
| **C2P** | Confirm to Pick |
| **P2B** | Pick to Bill |
| **O2B** | Order to Bill |

---

## 4. Fill Rate and Procurement Metrics

### 4.1 Fill Rate

**Definition**: PO fill quantity / PO raised quantity

**Metric Type**: `METRIC_TYPE_FILL_RATE`

**Structure (PercentageValue):**
- `current_value`: Actual fill quantity
- `total_value`: Total requested quantity
- `percentage`: Fill rate percentage

### 4.2 Quality Fill Rate (QFR)

- Calculated from last 70 days of PO data
- Used for booking portal slot opening logic

### 4.3 Fill Rate Variance Challenge

- Standard deviation > 20% over 12-day periods
- Example: Fillrates varying between 50% and 90%
- Creates uncertainty in procurement planning

### 4.4 Open PO Metrics

| Field | Description |
|-------|-------------|
| `open_pos` | Count of open POs |
| `open_po_qty` | Quantity in open POs |
| `open_po_count_with_low_doh` | Open POs with low DOH |

---

## 5. Serviceability Metrics

### 5.1 Polygon-Based Serviceability

**Evolution**: Distance-based → polygon-based geographic serviceability

**Components:**
1. **Primary Polygon** (`ISOLINES_IM_PRIMARY`)
2. **Secondary Polygon** (`ISOLINES_IM_SECONDARY`)

**Serviceability Logic:**
- If customer outside polygon → `NON_SERVICEABLE` with reason `LAST_MILE`

### 5.2 Coverage Metrics

| Metric Type | Description |
|-------------|-------------|
| `METRIC_TYPE_RISKY_PODS_PERCENTAGE` | PODs with availability < threshold |
| `METRIC_TYPE_RISKY_ITEMS_PERCENTAGE` | Items with availability < threshold |
| `METRIC_TYPE_RISKY_CATEGORIES_PERCENTAGE` | Categories with availability < threshold |

### 5.3 Serviceability Performance Metrics

| Metric | Description |
|--------|-------------|
| `polygon_fetch_success_rate` | Success rate by business_line, city_id |
| `serviceability_fallback_count` | Fallback events |
| `polygon.fetch.latency` | P50, P95, P99 latencies |
| `serviceability_polygon_impact` | Decisions influenced by polygon |

**Alert Thresholds:**
- Region service error rate > 1%
- Region service P99 latency > 20ms

---

## 6. Dashboard Landscape

### 6.1 Mission Control Dashboards

**Purpose**: Central command center for SCM operations

**Key Features:**
- Real-time operational metrics
- Alert aggregation and triaging
- Cross-functional visibility

### 6.2 Retool SCM Dashboards

| Dashboard | Purpose |
|-----------|---------|
| **Vendor Portal Inventory** | Brand/supplier/FC level metrics |
| **RTV/Liquidation** | Return to vendor tracking |
| **Mark Unsellable** | Category filters, storage type filters |
| **Outward Unsellable** | Wastage tracking and marking |
| **Wastage Marking** | Disposition categorization |
| **MIM Dashboard** | SKU-level inventory details |
| **Booking Portal** | PO slot opening, capacity timeline |

### 6.3 EagleEye Monitoring Dashboards

**Note:** All SCM dashboards migrated from Grafana to EagleEye/Retool (completed January 2025)

**Key Dashboards:**

| Dashboard | URL |
|-----------|-----|
| **IM-SCM Folder** | `https://eagleeye.swiggyops.de/dashboards/f/b499e60f-0abf-49c5-b0fa-97cdcec41d67/im-scm` |
| **MTO-Inventory** | `https://eagleeye.swiggyops.de/d/cb301a77-9299-401f-bc0f-c4fd28d88fc6/mto-inventory` |
| **IM Discovery Service** | Service-specific |
| **Service-Level** | Per-service dashboards |

**Metrics Tracked:**
- Request rates (RPS)
- P99 latencies
- 5xx error rates
- Success rates
- CPU/Memory utilization

**Example Service Metrics:**
- Gandalf: ~2,144 RPS, P99 1,626ms
- Checkout Service: ~2,181 RPS, P99 935ms

### 6.4 Vendor Portal Dashboards

**Availability Metrics View:**
- Brand-level aggregation
- Category-level breakdown
- City and warehouse-level details
- Item-level granularity

**Aggregation Levels:**
- `AGGREGATION_LEVEL_CATEGORY`
- `AGGREGATION_LEVEL_CITY`
- `AGGREGATION_LEVEL_WAREHOUSE`
- `AGGREGATION_LEVEL_POD`
- `AGGREGATION_LEVEL_ITEM`
- `AGGREGATION_LEVEL_BRAND`

---

## 7. Alert and Escalation Systems

### 7.1 Opsgenie Integration

**Alert Categories:**

| Category | Description |
|----------|-------------|
| **SCM Task Manager** | Inwarding failures, partially complete tasks |
| **Serviceability** | Polygon fetch failures, degradation |
| **Inventory Location Service** | Reservation mismatches |

### 7.2 TriageAssist Bot

**Capabilities:**
- Alert triage and analysis (auto-analyzes alerts)
- War room insights (#tech-warroom integration)
- RCA retrieval and conversations
- Service metrics queries
- Live logs fetching
- AWS infrastructure queries
- TRM report generation

**Command Examples:**
```
@triageassist give me metrics of shuttle in the last 1 hour
@triageassist give me logs of shuttle in the last 15 minutes
@triageassist give me metrics of ads_account_details_prod dynamo db table
/generate-report 2024-01-15 2024-01-08 alert-channel-1,alert-channel-2 shuttle SHUT
```

### 7.3 Graylog Alerting

**Alert Types:**
- Panic alerts
- 500 error code monitoring
- Kafka message processing failures
- Cash tracker failures
- UPI payment failures

### 7.4 Threshold-Based Alerts

**Business Metrics Alerts:**
- Entity count threshold breaches
- Collection-specific thresholds (restaurants: 2200, items: 600-1500, stores: 350)

---

## 8. Key Metric Definitions and Calculations

### 8.1 Proto Definition

```protobuf
message InventoryAvailabilityMetric {
  enum MetricType {
    METRIC_TYPE_WH_AVAILABILITY = 1;
    METRIC_TYPE_WH_DOH = 2;
    METRIC_TYPE_POD_AVAILABILITY = 3;
    METRIC_TYPE_FILL_RATE = 4;
    METRIC_TYPE_INVENTORY_UNITS_SOLD = 5;
    METRIC_TYPE_POTENTIAL_SALES_LOSS_AMOUNT = 6;
    METRIC_TYPE_POTENTIAL_SALES_LOSS_PERCENTAGE = 7;
    METRIC_TYPE_RISKY_CATEGORIES_PERCENTAGE = 8;
    METRIC_TYPE_RISKY_PODS_PERCENTAGE = 9;
    METRIC_TYPE_RISKY_WAREHOUSES_PERCENTAGE = 10;
    METRIC_TYPE_RISKY_ITEMS_PERCENTAGE = 11;
    METRIC_TYPE_INVENTORY_UNITS_AVAILABLE = 12;
    METRIC_TYPE_SALES_VALUE = 13;
  }
}
```

### 8.2 MoM (Month-over-Month) Change

**Calculation:**
```
MoM Inventory Count Change % =
  ((mom_total_inventory_count - total_inventory_count) / mom_total_inventory_count) * 100
```

### 8.3 WACC Integration

**Purpose**: Calculate inventory value at cost price

**Table**: `analytics.public.im_sku_wacc`

**Usage:**
```sql
total_inventory_value = SUM(wh_qty_available * wacc.price)
potential_gmv_loss = SUM(CASE WHEN doh <= 5
  THEN GREATEST(final_rr * 7 - wh_qty_available, 0) * mrp
  ELSE 0 END)
```

---

## 9. Data Platform and Infrastructure

### 9.1 Databricks Jobs

| Job | Purpose | Frequency |
|-----|---------|-----------|
| **Vendor Portal Inventory** | Brand/supplier/FC metrics | Daily |
| **Pod Inventory Loss** | Wastage tracking | Daily |
| **Booking Portal PO Slot** | Slot opening schedule | Every 30 min |
| **Vendor Portal Ingestion** | Kafka publishing | Hourly |

### 9.2 Snowflake Analytics Schema

**Inventory Module:**
- `analytics_prod.im_vendor_portal_inventory_module`
- `analytics_prod.im_vendor_portal_inventory_module_base_data`
- `analytics_prod.im_vendor_portal_inventory_module_brand_company`
- `analytics_prod.im_vendor_portal_inventory_module_summary`

**Wastage Tracking:**
- `analytics.public.im_wastage_damage_sub_disp`
- `analytics.public.im_wastage_report_sub_disp`
- `analytics.public.im_wastage_report_ct_view_daily`

**PO and Procurement:**
- `analytics_prod.im_vendor_portal_po_module`
- `analytics.public.booking_portal_po_details`

### 9.3 Service APIs

**Inventory Location Service:**
- `FetchMultipleInventoryDetailsWithSkuAndExpiry`
- Returns: Inventory count, rack locations, batch information

**SCM Reporting Service:**
- `GetInventoryMetrics`: Low inventory and stocks on hand
- `SearchFTRReportRecord`: FTR report search

---

## 10. Advanced Use Cases and AI Integration

### 10.1 Movement Planning Efficacy Metrics

**Core Forecasting Metrics:**
- MAE (Mean Absolute Error)
- MAPE (Mean Absolute Percentage Error)
- Forecast Bias
- Forecast Horizon Accuracy Degradation

**Business Metrics:**
- Pod Fill Rate: % demand fulfilled from pod stock
- Overstock Rate: % stock moved but not sold
- Understock/Stockouts: % OOO items due to stockouts
- On-Time Movement Adherence: % movements at planned time

### 10.2 Liquidation and RTV Optimization

**Storefront Liquidation:**
- FnV liquidation: 25% wastage reduction achieved
- Profitability improvements through automated discounting

### 10.3 Weekly Insights and GenAI

**Dashworks AI Integration:**
- Automated insights from IM B2B Product Metric sheet
- Multiple prompt-based analysis
- Weekly observations

**Insight Categories:**
1. Warehouse Operations
2. Availability Inwarding at POD
3. Inventory Management at POD
4. Delivery Experience
5. Item Experience
6. POD Financials
7. Vendor Portal

---

## 11. Key Document References

### Confluence Pages
1. [SCM Inventory Availability](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4881186901)
2. [IM Consistent Serviceability - Isolines](https://swiggy.atlassian.net/wiki/spaces/SP/pages/4862869629)
3. [RTV, Liquidation & Wastage Management v2](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3786022404)
4. [StoreFront Liquidation](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5236654082)
5. [TriageAssist SOP](https://swiggy.atlassian.net/wiki/spaces/SHUT/pages/4572382122)

### GitHub Repositories
6. [api-registry](https://github.com/swiggy-private/api-registry) (Proto definitions)
7. [schedule-databricks-jobs](https://github.com/swiggy-private/schedule-databricks-jobs)

### Key Files
8. `inventory_availability_metrics.proto`
9. `im_vendor_portal_inventory_module.sql`
10. `instamart_pod_inventory_loss.sql`
11. `Booking_portal_po_slot_opening_logic.sql`

---

## 12. Recommendations

### 12.1 Metric Standardization

**Current State:** Multiple definitions for similar metrics

**Recommended Actions:**
1. Create Metrics Catalog with canonical definitions
2. Standardize threshold values across dashboards
3. Document calculation formulas with examples

### 12.2 Dashboard Consolidation

**Opportunity:** Metrics spread across Retool, EagleEye, Databricks

**Recommended Actions:**
1. Create unified SCM Control Tower dashboard
2. Embed EagleEye panels in Retool
3. Implement role-based access

### 12.3 Alert Optimization

**Challenges:** Rate limiting, multiple channels

**Recommended Actions:**
1. Alert deduplication and correlation
2. Extend TriageAssist usage
3. Define SLAs by severity
4. Create runbooks per alert type

---

*Document compiled from Glean research across 50+ documents | December 2025*
