# Swiggy Instamart Supplier Performance & Fill Rate Tracking: Deep-Dive Research

## Executive Summary

This document covers supplier performance measurement, fill rate tracking, and vendor management at Swiggy Instamart. Understanding supplier performance is critical for availability issue tree Branch 3 (Supply-led) - when brands don't deliver to warehouse.

**Key Metrics:**
- OTIF (On-Time In-Full): Primary supplier SLA metric
- Fill Rate Types: UFR, LFR, NZFR
- Fill Rate Variability: 25-30% swings impacting availability
- Lead Time Adherence (LTA): Delivery timing compliance

---

## 1. Fill Rate Metrics Taxonomy

### 1.1 Unit Fill Rate (UFR)

**Definition:** Ratio of total quantity received to total quantity requested

**Formula:**
```
UFR = Total Quantity Received / Total Quantity Requested × 100
```

**Example:**
- PO requested: 500 units across 10 items
- Received: 450 units
- UFR = 450/500 = 90%

### 1.2 Line Fill Rate (LFR)

**Definition:** Ratio of fully filled lines to total lines

**Formula:**
```
LFR = Count of 100% Filled Lines / Total Lines × 100
```

**Example:**
- 10 items in PO
- 8 items fully delivered (100% of requested qty)
- 2 items partially delivered
- LFR = 8/10 = 80%

### 1.3 Non-Zero Fill Rate (NZFR)

**Definition:** Ratio of lines with any delivery to total lines

**Formula:**
```
NZFR = 1 - (Zero Fill Lines / Total Lines) × 100
```

**Example:**
- 10 items in PO
- 9 items have some delivery (even partial)
- 1 item has zero delivery
- NZFR = 9/10 = 90%

### 1.4 OTIF (On-Time In-Full)

**Definition:** PO delivered 100% AND within lead time

**Formula:**
```
OTIF = 1 if (Fill Rate = 100% AND Actual TAT <= Lead Time) else 0
```

**Components:**
- **On-Time**: Delivery within configured lead time
- **In-Full**: 100% of PO quantity delivered

### 1.5 Metric Comparison

| Metric | Measures | Best For |
|--------|----------|----------|
| **UFR** | Quantity accuracy | Volume tracking |
| **LFR** | Line completeness | SKU-level fulfillment |
| **NZFR** | Delivery attempt | Supplier engagement |
| **OTIF** | Complete + timely | Overall SLA |

---

## 2. Lead Time Metrics

### 2.1 Lead Time Adherence (LTA)

**Definition:** Percentage of POs delivered within lead time

**Formula:**
```
LTA = POs with (Actual TAT <= Lead Time) / Total POs × 100
```

### 2.2 Weighted Average Lead Time (WALT)

**Definition:** Lead time weighted by PO quantity

**Formula:**
```
WALT = Σ(Lead Time × PO Quantity) / Σ(PO Quantity)
```

**Usage:** Reflects actual lead time experience across volume

### 2.3 Lead Time Components

| Component | Description |
|-----------|-------------|
| **Configured LT** | Standard lead time per supplier |
| **Actual TAT** | Time from PO creation to GRN |
| **Last PO LT** | Most recent delivery lead time |

---

## 3. Performance Aggregation Levels

### 3.1 Hierarchy

```
Brand Company
    └── Supplier
           └── Supplier × FC (Warehouse)
                  └── Supplier × Category
                         └── Supplier × Item
                                └── Brand Company × Item × FC
```

### 3.2 Aggregation Dimensions

| Level | Use Case |
|-------|----------|
| **Supplier-level** | Overall supplier health |
| **Brand Company-level** | Brand relationship management |
| **Supplier × FC** | Warehouse-specific performance |
| **Supplier × Category** | Category-wise analysis |
| **Supplier × Item** | SKU-level issues |
| **BC × Item × FC** | Most granular (RCA) |

### 3.3 Vendor Portal Views

| View | Metrics Shown |
|------|---------------|
| **GRN Summary** | OTIF, UFR, Avg Lead Time |
| **PO Performance** | Last PO lead time, items fulfilled vs requested |
| **Trend Analysis** | Fill rate over time |

---

## 4. Fill Rate Variability Challenge

### 4.1 Observed Patterns

**Variability:**
- Standard deviation > 20% over 12-day periods
- Fill rates swing between 50% and 90%
- Creates uncertainty in procurement planning

**Impact:**
- Unpredictable inventory levels
- Safety stock inflation
- OOS situations despite PO placement

### 4.2 Root Causes

| Cause | Description |
|-------|-------------|
| **Production constraints** | Supplier capacity fluctuations |
| **Logistics issues** | Vehicle availability, route problems |
| **Demand spikes** | Supplier serving multiple channels |
| **Quality rejections** | GRN rejections reducing fill rate |
| **System issues** | Duplicate PO creation, sync failures |

### 4.3 Vinculum RCA Example

**Issue:** Fill rate discrepancy
- Fill rate excluding duplicates: 0.84% drop
- Fill rate with duplicates: 2.52% drop
- Root cause: Duplicate PO creation during retry failures

---

## 5. Load Constraints

### 5.1 MOQ (Minimum Order Quantity)

**Definition:** Minimum units per SKU per PO

**Impact:**
- Small demand can't be fulfilled
- Forces over-ordering or skipping
- ~7-8% of cases blocked by constraints

### 5.2 MOV (Minimum Order Value)

**Definition:** Minimum PO value to place order

**Impact:**
- Requires clubbing multiple SKUs
- May force ordering unwanted items
- Delays small-quantity replenishment

### 5.3 Case Size Constraints

**Definition:** Order must be in multiples of case size

**Impact:**
- Rounding up increases inventory
- Rounding down risks stockout

### 5.4 Load Constraint Metric

**Definition:** % of assortment blocked by MOQ/MOV/case size

**Formula:**
```
Load Constraint % = Blocked SKUs / Total Assortment × 100
```

---

## 6. Replenishment Frequency

### 6.1 Definition

**Metric:** PO raising days per week per supplier

### 6.2 Optimal Frequency

| Category | Recommended |
|----------|-------------|
| **Fast-moving FMCG** | Daily |
| **Standard items** | 3-4 times/week |
| **Slow-moving** | Weekly |
| **FnV** | Daily (dual dispatch) |

### 6.3 Frequency Impact

| Frequency | Pros | Cons |
|-----------|------|------|
| **High** | Lower safety stock, fresher inventory | Higher logistics cost |
| **Low** | Consolidated shipments | Higher DOI, wastage risk |

---

## 7. Supplier Tiers

### 7.1 Primary vs Secondary Suppliers

| Aspect | Primary | Secondary |
|--------|---------|-----------|
| **Priority** | First preference | Backup |
| **Volume share** | 70-80% | 20-30% |
| **Lead time** | Shorter | May be longer |
| **Pricing** | Negotiated rates | Standard rates |

### 7.2 Supplier Switching Logic

**Triggers:**
- Primary supplier OOS
- Fill rate below threshold (consecutive POs)
- Lead time violations
- Quality issues

**Automation:**
- System can auto-switch for specific SKUs
- Manual override for strategic decisions

---

## 8. Supplier Scoring System

### 8.1 ScoreCard Components

**Composite Score Formula:**
```
Supplier Score = (0.4 × OTIF) + (0.3 × UFR) + (0.2 × LTA) + (0.1 × Quality Score)
```

**Score Ranges:**
| Range | Rating | Action |
|-------|--------|--------|
| 90-100 | Excellent | Premium slot access |
| 75-89 | Good | Standard access |
| 60-74 | Needs Improvement | Warning, review |
| <60 | Poor | Secondary supplier activation |

### 8.2 RankCard

**Purpose:** Relative ranking of suppliers within same category/FC

**Ranking Factors:**
- Fill rate trend (improving/declining)
- Lead time consistency
- Quality rejection rate
- Response to PO changes

### 8.3 Proto Reference

```protobuf
// From api-registry supplier performance proto
message SupplierScoreCard {
  double composite_score = 1;
  double otif_component = 2;
  double ufr_component = 3;
  double lta_component = 4;
  double quality_component = 5;
  string rating = 6; // EXCELLENT, GOOD, NEEDS_IMPROVEMENT, POOR
}

message SupplierRankCard {
  int32 category_rank = 1;
  int32 fc_rank = 2;
  string trend = 3; // IMPROVING, STABLE, DECLINING
}
```

---

## 9. Vendor Portal Capabilities

### 9.1 Self-Service Features

| Feature | Description |
|---------|-------------|
| **PO Visibility** | View active POs, status |
| **Inventory Metrics** | Brand/supplier/FC level |
| **Performance Dashboard** | Fill rate, OTIF, LTA trends |
| **Invoice Submission** | Electronic invoice upload |

### 8.2 Inventory Views

**Aggregation Levels:**
- `AGGREGATION_LEVEL_BRAND`
- `AGGREGATION_LEVEL_CATEGORY`
- `AGGREGATION_LEVEL_CITY`
- `AGGREGATION_LEVEL_WAREHOUSE`
- `AGGREGATION_LEVEL_POD`
- `AGGREGATION_LEVEL_ITEM`

### 8.3 GRN Details

| Field | Description |
|-------|-------------|
| **GRN Date** | Goods receipt date |
| **OTIF Status** | On-time in-full flag |
| **UFR** | Unit fill rate for GRN |
| **Avg Lead Time** | Rolling average |
| **Last PO Lead Time** | Most recent delivery |

---

## 10. Booking Portal Integration

### 9.1 Quality Fill Rate (QFR)

**Definition:** Fill rate calculated from last 70 days of PO data

**Usage:**
- Determines slot opening priority
- Higher QFR suppliers get better slots
- Low QFR may face slot restrictions

### 9.2 Slot Allocation Logic

```
Calculate QFR from last 70 days
       ↓
Rank suppliers by QFR
       ↓
Allocate premium slots to high QFR
       ↓
Remaining slots to lower QFR
```

### 9.3 Capacity Management

**Formula:**
```
Slot Capacity = Total Capacity × Slot Weight × Business Type Weight × Delivery Type Weight
```

### 9.4 Booking Portal Slot Management

**Slot Allocation Logic:**
1. Slots open T-1 day at configured time
2. Higher QFR suppliers see slots first (priority window)
3. Remaining slots open to all suppliers
4. Slot booking confirmed via SMS/email

**Daily Capacity Limits:**
| Warehouse | Typical Daily Slots | Peak Capacity |
|-----------|---------------------|---------------|
| Tier-1 City | 50-80 | 100+ |
| Tier-2 City | 30-50 | 70 |

**Slot Types:**
| Slot | Time | Typical Capacity |
|------|------|------------------|
| Morning | 6 AM - 10 AM | 40% of daily |
| Midday | 10 AM - 2 PM | 30% of daily |
| Afternoon | 2 PM - 6 PM | 30% of daily |

### 9.5 Booking Portal Data Tables

| Table | Purpose |
|-------|---------|
| `analytics_adhoc.booking_portal_slot_master` | Slot configurations |
| `analytics_adhoc.booking_portal_bookings` | Booking records |
| `analytics_adhoc.booking_portal_capacity_log` | Capacity utilization |
| `analytics.public.booking_portal_po_details` | PO-booking linkage |

---

## 11. Data Infrastructure

### 10.1 Data Sources

| Source | Purpose |
|--------|---------|
| **Elasticsearch** | `supplier_performance_metrics` index |
| **Databricks** | `availability_attribution_waterfall.sql` |
| **Vendor Portal** | GRN, PO performance tables |
| **Analytics** | Fill rate tracking, OTIF calculations |

### 10.2 Key Tables

| Table | Content |
|-------|---------|
| `analytics_prod.im_vendor_portal_po_module` | PO metrics |
| `analytics.public.booking_portal_po_details` | Booking data |
| `dash_scm_supplier_master` | Supplier master |

### 10.3 Proto Definition

```protobuf
message SupplierPerformanceMetric {
  string supplier_id = 1;
  string brand_company_id = 2;
  double otif = 3;
  double ufr = 4;
  double lfr = 5;
  double nzfr = 6;
  double lta = 7;
  double walt = 8;
  double replenishment_frequency = 9;
  double load_constraint_percentage = 10;
}
```

---

## 12. Alerting and Monitoring

### 11.1 Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| **OTIF** | <80% | <60% |
| **UFR** | <85% | <70% |
| **LTA** | <90% | <75% |

### 11.2 Monitoring Dashboards

| Dashboard | Platform | Purpose |
|-----------|----------|---------|
| **Supplier Scorecard** | Vendor Portal | Supplier-facing metrics |
| **Fill Rate Tracker** | Databricks | Internal tracking |
| **Availability Waterfall** | Databricks | RCA attribution |

### 11.3 Escalation Paths

| Issue | Escalation |
|-------|------------|
| Chronic low fill rate | Category Manager → Brand Company |
| Lead time violations | Procurement Manager → Supplier |
| Quality issues | QC Team → Supplier Quality |

---

## 13. Impact on Availability Issue Tree

### 12.1 Branch 3: Supply-Led

**Root Causes:**
- Low fill rate from suppliers
- Lead time violations delaying stock
- MOQ/MOV preventing small orders
- Supplier capacity constraints

**Diagnostic Queries:**
- Fill rate by supplier over last 30 days
- OTIF trend analysis
- Load constraint blocking SKUs

### 12.2 Attribution Waterfall

**Availability Attribution:**
```
Total OOS
    └── Forecasting-led (Branch 1)
    └── PO-led (Branch 2)
    └── Supply-led (Branch 3) ← Supplier Performance
           └── Low fill rate
           └── Lead time violations
           └── No delivery
    └── Warehouse ops-led (Branch 4)
    └── Dark store-led (Branch 5)
    └── Config-led (Branch 6)
    └── Other (Branch 7)
```

---

## 14. Improvement Initiatives

### 13.1 Fill Rate Improvement

| Initiative | Impact |
|------------|--------|
| **Supplier scorecards** | Visibility drives improvement |
| **Booking portal** | Better appointment adherence |
| **QFR-based slots** | Incentivizes higher fill rate |
| **Secondary suppliers** | Backup for low-fill primaries |

### 13.2 Lead Time Reduction

| Initiative | Impact |
|------------|--------|
| **DC proximity** | Shorter transit time |
| **Pre-booking slots** | Faster unloading |
| **Express lanes** | Priority processing |

### 13.3 Constraint Optimization

| Initiative | Impact |
|------------|--------|
| **MOQ negotiation** | Lower minimums |
| **Clubbing logic** | Combine PODs to meet MOV |
| **Case size flexibility** | Partial case acceptance |

---

## 15. Key Document References

### Confluence
1. [SCM Procurement Terminology](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4639916695)
2. [Vendor Portal Performance Module](https://swiggy.atlassian.net/wiki/spaces/DASH/)
3. [Fill Rate Tracking](https://swiggy.atlassian.net/wiki/spaces/SPAP/)

### Data Sources
- `availability_attribution_waterfall.sql`
- `supplier_performance_metrics` (ES index)
- Vendor Portal tables

---

## Summary

Supplier performance directly drives availability at Instamart. Key aspects:

**Metrics Framework:**
- UFR, LFR, NZFR for fill rate granularity
- OTIF as primary SLA metric
- LTA and WALT for lead time tracking
- Load constraints for ordering feasibility

**Key Challenges:**
- Fill rate variability (25-30% swings)
- MOQ/MOV blocking ~7-8% of cases
- Duplicate PO issues affecting metrics

**Improvement Levers:**
- Booking portal with QFR-based slots
- Supplier scorecards for accountability
- Secondary supplier activation
- Constraint negotiation

**Relevance to Brain MVP:**
- Direct driver of Branch 3 (Supply-led) issues
- Fill rate data feeds availability RCA
- Supplier performance alerts for intervention

---

*Document compiled from Glean research | December 2025*
*For Swiggy Brain Supply Chain Brain v0.1 MVP*
