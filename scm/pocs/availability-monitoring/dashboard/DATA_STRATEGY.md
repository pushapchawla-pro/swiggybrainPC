# Alert Pipeline Data Strategy

## Objective

Implement the **Root-Cause-First** alert pipeline: Route by owner → Aggregate at owner's level → Generate RCA → Output alerts.

---

## Core Principle: Root-Cause-First (Not Scope-First)

**Why?** Same scope can have DIFFERENT root causes requiring DIFFERENT owners.

```
Example: "Coca-Cola @ HSR Pod"
├── Coca-Cola 500ml → "pod_space_full"     → Pod Ops
├── Coca-Cola 1L    → "vendor_fillrate_low" → Category
└── Coca-Cola 2L    → "po_not_raised"       → Procurement

One scope, THREE owners. Who acts? → Route by owner FIRST.
```

---

## Computation DAG

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ROOT-CAUSE-FIRST ALERT PIPELINE                          │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: FETCH CHRONIC DATA
══════════════════════════
    ┌─────────────────────────────────────────────────────────────────┐
    │  Base Table Query                                               │
    │  ─────────────────                                              │
    │  FROM: analytics.public.sku_wise_availability_rca_with_reasons_v7│
    │  JOIN: reason_mapping (final_reason → bin → ai_owner)           │
    │  FILTER: Bradman SKUs, Bangalore, FMCG                          │
    │  FILTER: is_chronic (≥15 of 30 days < 60% avail)                │
    │  FILTER: yesterday < 60% (still active issue)                   │
    │                                                                 │
    │  Grain: SKU × POD (one record per chronic combination)          │
    │  Fields: sku_id, brand, l1_category, city, pod, warehouse,      │
    │          availability_pct, gmv_loss, chronic_days,              │
    │          l1_reason, l2_reason, ai_owner                         │
    └─────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
STEP 2: ROUTE BY AI_OWNER
═════════════════════════
    ┌─────────────────────────────────────────────────────────────────┐
    │  Parse ai_owner → Create Owner Buckets                          │
    │  ─────────────────────────────────────                          │
    │                                                                 │
    │  For each record:                                               │
    │    "Pod Ops"           → primary: Pod Ops                       │
    │    "Pod Ops / Planning" → primary: Pod Ops, secondary: Planning │
    │    "Category / ERP"    → primary: Category, secondary: ERP      │
    │                                                                 │
    │  Output: 7 Primary Buckets + Secondary Buckets                  │
    │  ┌──────────┬──────────┬──────────┬──────────┬───────────────┐  │
    │  │ Planning │Procurement│ Category │Warehouse │ Pod Ops       │  │
    │  │ (20 rec) │ (25 rec)  │ (20 rec) │ (10 rec) │ (15 rec)      │  │
    │  └──────────┴──────────┴──────────┴──────────┴───────────────┘  │
    │  ┌──────────┬──────────┐                                        │
    │  │ ERP Team │Prod Supp │                                        │
    │  │ (5 rec)  │ (5 rec)  │                                        │
    │  └──────────┴──────────┘                                        │
    └─────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
STEP 3: AGGREGATE AT PERSONA'S OPERATING LEVEL
══════════════════════════════════════════════
    ┌─────────────────────────────────────────────────────────────────┐
    │  Each persona operates at a DIFFERENT level                     │
    │  ───────────────────────────────────────                        │
    │                                                                 │
    │  ┌─────────────────┬─────────────────┬────────────────────────┐ │
    │  │ Persona         │ Operating Level │ Aggregate By           │ │
    │  ├─────────────────┼─────────────────┼────────────────────────┤ │
    │  │ Planning        │ City / WH       │ city, warehouse        │ │
    │  │ Procurement     │ City / WH       │ city, warehouse        │ │
    │  │ Category        │ Brand / Category│ brand, l1_category     │ │
    │  │ Warehouse       │ Warehouse       │ warehouse              │ │
    │  │ Pod Ops         │ Pod             │ pod                    │ │
    │  │ ERP Team        │ City            │ city                   │ │
    │  │ Product Support │ SKU             │ sku_id (no aggregation)│ │
    │  └─────────────────┴─────────────────┴────────────────────────┘ │
    │                                                                 │
    │  For each owner bucket:                                         │
    │  1. Group records by persona's aggregation key                  │
    │  2. For each group, compute:                                    │
    │     - total_gmv_loss = SUM(gmv_loss)                           │
    │     - affected_sku_count = COUNT(DISTINCT sku_id)              │
    │     - chronic_days_avg = AVG(chronic_days)                     │
    │     - l1_reason_distribution = {reason: pct, ...}              │
    │  3. Sort groups by total_gmv_loss DESC                         │
    │  4. Take TOP 5 groups → These become ALERTS                    │
    └─────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
STEP 4: CREATE ALERT OBJECTS
════════════════════════════
    ┌─────────────────────────────────────────────────────────────────┐
    │  Alert Schema (per persona's top 5)                             │
    │  ──────────────────────────────────                             │
    │                                                                 │
    │  {                                                              │
    │    alert_id: "CAT-001",                                        │
    │    owner: "Category Management",                                │
    │    scope: "BRAND",               // From persona's level        │
    │    entity: "Coca-Cola",          // The grouped key             │
    │    gmv_loss: 1250000,            // ₹12.5L                      │
    │    rank: 1,                      // 1-5 within persona          │
    │    priority: "P0",               // ≥₹5L=P0, ≥₹1L=P1, else P2   │
    │    affected_sku_count: 8,                                       │
    │    affected_skus: ["SKU-123", "SKU-456", ...],                  │
    │    chronic_days_avg: 20,                                        │
    │    l1_reason_distribution: {"vendor_fillrate": 65%, ...},      │
    │    is_primary: true,                                            │
    │    shared_with: null             // or "Procurement" if split   │
    │  }                                                              │
    │                                                                 │
    │  Priority thresholds:                                           │
    │  ┌──────────┬──────────┬───────┐                                │
    │  │ GMV Loss │ Priority │ Emoji │                                │
    │  ├──────────┼──────────┼───────┤                                │
    │  │ ≥ ₹5L    │ P0       │ 🔥    │                                │
    │  │ ₹1L - ₹5L│ P1       │ 🟠    │                                │
    │  │ < ₹1L    │ P2       │ 🟡    │                                │
    │  └──────────┴──────────┴───────┘                                │
    └─────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
STEP 5: GENERATE RCA (Claude Code)
══════════════════════════════════
    ┌─────────────────────────────────────────────────────────────────┐
    │  For each alert, Claude Code generates:                         │
    │  ──────────────────────────────────────                         │
    │                                                                 │
    │  INPUT:                                                         │
    │  - Alert data (gmv_loss, affected_skus, l1_reason_distribution) │
    │  - Persona context (personas/{owner}.md)                        │
    │    ├── RCA Branch Mapping (understand reason codes)             │
    │    ├── Diagnosis SOP (analysis steps)                           │
    │    └── Action Verbs (vocabulary for actions)                    │
    │                                                                 │
    │  OUTPUT:                                                        │
    │  - l3_narrative: "Vendor fill rates at 45% vs 80% target..."   │
    │    (2-3 sentences, grounded in data, explains WHY)              │
    │                                                                 │
    │  - action_plan: "Escalate to Brand POC. Activate secondary..."  │
    │    (Max 2 actions, uses persona's action verbs)                 │
    │                                                                 │
    │  - key_signals: ["Fill Rate: 45%", "Chronic Days: 20", ...]    │
    │                                                                 │
    │  Action Verbs by Persona:                                       │
    │  ┌─────────────────┬───────────────────────────────────────────┐│
    │  │ Planning        │ Review, Adjust, Increase, Modify, Align  ││
    │  │ Procurement     │ Raise, Club, Negotiate, Escalate, Reissue││
    │  │ Category        │ Escalate, Review, Align, Enable, Validate││
    │  │ Warehouse       │ Check, Review, Confirm, Identify, Adjust ││
    │  │ Pod Ops         │ Clear, Escalate, Adjust, Coordinate      ││
    │  │ ERP Team        │ Review, Fix, Validate, Sync, Enable      ││
    │  │ Product Support │ Check, Validate, Update, Disable, Debug  ││
    │  └─────────────────┴───────────────────────────────────────────┘│
    └─────────────────────────────────┬───────────────────────────────┘
                                      │
                                      ▼
STEP 6: OUTPUT (Dashboard / Slack)
══════════════════════════════════
    ┌─────────────────────────────────────────────────────────────────┐
    │  Final alert structure:                                         │
    │  ──────────────────────                                         │
    │                                                                 │
    │  alerts_with_rca.json:                                          │
    │  {                                                              │
    │    alert_id, owner, scope, entity,                              │
    │    gmv_loss, rank, priority,                                    │
    │    affected_sku_count, affected_skus,                           │
    │    chronic_days_avg, l1_reason_distribution,                    │
    │    l3_narrative,      // ← Claude Code generated                │
    │    action_plan,       // ← Claude Code generated                │
    │    key_signals        // ← Claude Code generated                │
    │  }                                                              │
    │                                                                 │
    │  Routes to:                                                     │
    │  ├── Slack Report (grouped by owner, sorted by GMV)            │
    │  ├── Executive Dashboard (aggregate KPIs, accountability table)│
    │  └── Persona Dashboards (filtered by owner)                    │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Data Sources & Pre-Computation

### Source Tables (from notebook reference)

| Table | Schema | Purpose |
|-------|--------|---------|
| `sku_wise_availability_rca_with_reasons_v7` | analytics.public | Daily SKU×POD availability with RCA reasons |
| `rb_bradman_spin_list_16_dec_seasonality_eol_removal` | analytics.public | Bradman SKU filter (TOP_ITEM_FLAG = 1) |
| `final_reason_mapping_avail_rca` | analytics.public | Maps final_reason → bin → ai_owner |
| `STORE_SPIN_SKU_DET` | ANALYTICS.PUBLIC | SKU details (l1/l2/l3 category, sku_name) |

### Pre-Computed Base Table (Step 0)

**Query** (adapted from notebook):

```sql
WITH bradman_sku AS (
    SELECT DISTINCT item_code, spin_id
    FROM analytics.public.rb_bradman_spin_list_16_dec_seasonality_eol_removal
    WHERE TOP_ITEM_FLAG = 1
      AND CATEGORY_LABEL = 'FMCG'
      AND LOWER(city) = 'bangalore'
),

sku_mapper AS (
    SELECT sku_id, l1_category, l2_category, l3_category, spin_id, product_name AS sku_name
    FROM ANALYTICS.PUBLIC.STORE_SPIN_SKU_DET
    WHERE item_code IN (SELECT item_code FROM bradman_sku)
),

base_data AS (
    SELECT
        a.dt,
        a.sku_id,
        a.item_code,
        s.spin_id,
        s.sku_name,
        a.brand,
        a.business_category,
        s.l1_category,
        s.l2_category,
        s.l3_category,
        a.city,
        a.store_id AS pod_id,
        a.wh_name AS warehouse_name,
        -- L1 Reason: POD Led vs WH Led
        CASE WHEN a.wh_stock1 = 'Instock' THEN 'POD Led'
             WHEN a.wh_stock1 = 'OOS' THEN 'WH Led'
             ELSE 'Error' END AS l1_reason,
        c.bin AS l2_reason,           -- Mapped reason code
        c.ai_owner,                   -- PRIMARY ROUTING KEY
        a.avail_sessions,
        a.non_avail_sessions,
        a.total_sessions,
        a.sales                       -- GMV loss (NOT revenue!)
    FROM analytics.public.sku_wise_availability_rca_with_reasons_v7 a
    JOIN bradman_sku b ON a.item_code = b.item_code
    LEFT JOIN analytics.public.final_reason_mapping_avail_rca c
        ON a.final_reason = c.final_reason
    LEFT JOIN sku_mapper s ON s.sku_id = a.sku_id
    WHERE a.dt >= CURRENT_DATE() - 15
      AND a.assortment = 'A'
      AND LOWER(a.city) = 'bangalore'
)

SELECT
    CURRENT_DATE() AS analysis_period,
    sku_id, item_code, spin_id, sku_name, brand,
    business_category, l1_category, l2_category, l3_category,
    city, pod_id, warehouse_name,
    l1_reason, l2_reason, ai_owner,
    SUM(avail_sessions) AS overall_avail_sess,
    SUM(non_avail_sessions) AS overall_unavail_sess,
    SUM(total_sessions) AS overall_total_sess,
    IFNULL(SUM(CASE WHEN dt = CURRENT_DATE() - 1 THEN avail_sessions END), 0) AS last_day_avail_sess,
    IFNULL(SUM(CASE WHEN dt = CURRENT_DATE() - 1 THEN non_avail_sessions END), 0) AS last_day_unavail_sess,
    IFNULL(SUM(CASE WHEN dt = CURRENT_DATE() - 1 THEN total_sessions END), 0) AS last_day_total_sess,
    SUM(sales) AS gmv_loss
FROM base_data
GROUP BY ALL
```

**Output Schema** (`raw_data` - one row per SKU × POD × L1_Reason × L2_Reason):

| Field | Type | Description |
|-------|------|-------------|
| `sku_id`, `item_code`, `spin_id`, `sku_name`, `brand` | STRING | SKU identity |
| `l1_category`, `l2_category`, `l3_category` | STRING | Category hierarchy |
| `city`, `pod_id`, `warehouse_name` | STRING | Location hierarchy |
| `l1_reason` | STRING | 'POD Led' or 'WH Led' (from wh_stock1) |
| `l2_reason` | STRING | Mapped reason code (Fill Rate, Movement, etc.) |
| `ai_owner` | STRING | **Primary routing key** |
| `overall_avail_sess`, `overall_unavail_sess`, `overall_total_sess` | INT | 15-day session totals |
| `last_day_avail_sess`, `last_day_unavail_sess`, `last_day_total_sess` | INT | Yesterday's sessions |
| `gmv_loss` | FLOAT | GMV at risk (₹) |

### Key Metrics Derived (per aggregation level)

```python
# Availability %
OVERALL_AVAILABILITY_PCT = overall_avail_sess / overall_total_sess * 100
LAST_DAY_AVAILABILITY_PCT = last_day_avail_sess / last_day_total_sess * 100

# Chronic threshold
AVAIL_THRESHOLD = 60  # %
is_chronic = (OVERALL_AVAILABILITY_PCT < 60) AND (LAST_DAY_AVAILABILITY_PCT < 60)

# Contribution to total unavailability
UNAVAILABILITY_CONTRIBUTION_PCT = entity_unavail_sess / TOTAL_UNAVAIL_SESS * 100
```

---

## Persona Operating Levels

**Critical**: Each persona aggregates at THEIR natural level.

| Persona | Operating Level | Aggregation Key | Example Entity |
|---------|-----------------|-----------------|----------------|
| **Planning** | City / WH | `city`, `warehouse` | "Bangalore × Central WH" |
| **Procurement** | City / WH | `city`, `warehouse` | "Central WH" |
| **Category** | Brand / Category | `brand`, `l1_category` | "Coca-Cola" |
| **Warehouse** | Warehouse | `warehouse` | "Central WH" |
| **Pod Ops** | Pod | `pod` | "HSR Layout" |
| **ERP Team** | City | `city` | "Bangalore" |
| **Product Support** | SKU | `sku_id` | "SKU-12345" |

---

## Alert Schema

```javascript
{
  // ═══════════════════════════════════════════════════════════════════════════
  // CORE FIELDS (from pipeline computation)
  // ═══════════════════════════════════════════════════════════════════════════

  // Identity
  alert_id: "CAT-001",           // Unique identifier: {PERSONA_PREFIX}-{NUM}
  owner: "Category Management",  // Primary owner for this alert
  scope: "BRAND",                // From persona's operating level
  entity: "Coca-Cola",           // The aggregated key value

  // Impact (for ranking & prioritization)
  gmv_loss: 1250000,             // ₹12.5L - SUM(sales) from chronic records
  rank: 1,                       // 1-5 within this persona (sorted by gmv_loss)
  priority: "P0",                // ≥₹5L=P0, ≥₹1L=P1, <₹1L=P2

  // Scope details
  affected_sku_count: 8,         // COUNT(DISTINCT sku_id) in this alert
  affected_skus: [               // Top contributing SKUs with chronic_days
    { sku_id: "SKU-123", sku_name: "Coca-Cola 500ml", chronic_days: 22 },
    { sku_id: "SKU-456", sku_name: "Coca-Cola 1L", chronic_days: 20 },
    // ... up to 10 SKUs
  ],
  chronic_days_avg: 20,          // AVG(chronic_days) across affected SKUs

  // Attribution (from l1_reason distribution)
  l1_reason_distribution: {      // Percentage breakdown by reason code
    "Fill Rate issue": 0.65,
    "OTIF": 0.20,
    "Long Term Supply issue": 0.15
  },

  // Shared ownership (for "Pod Ops / Planning" type assignments)
  is_primary: true,              // true if this owner is primary
  shared_with: null,             // Secondary owner name, or null

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM-GENERATED FIELDS (from Claude Code RCA step)
  // ═══════════════════════════════════════════════════════════════════════════

  l3_narrative: "Vendor fill rates at 45% vs 80% target. Primary supplier HCCB facing production constraints at Bidadi plant. 3-week declining trend with no recovery signal.",

  key_signals: [                 // Highlighted metrics for quick scanning
    "Fill Rate: 45% (target 80%)",
    "Chronic Days: 22",
    "PODs Affected: 15 (75%)"
  ],

  actions: [                     // Actionable items with tracking
    {
      action_id: "CAT-001-A1",
      text: "Escalate to HCCB Brand POC",
      gmv_at_risk: 750000,       // GMV recoverable if this action succeeds
      owner: "Category",
      status: "pending"          // pending | in_progress | completed
    },
    {
      action_id: "CAT-001-A2",
      text: "Activate secondary supplier Reliance",
      gmv_at_risk: 500000,
      owner: "Procurement",
      status: "pending"
    }
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD VISUALIZATION FIELDS (computed alongside core fields)
  // ═══════════════════════════════════════════════════════════════════════════

  // Primary metric visualization (derived from dominant l1_reason)
  key_metric: {
    label: "Fill Rate",          // Metric name based on dominant reason
    value: 45,                   // Current value
    target: 80,                  // Target/threshold value
    unit: "%"                    // Unit of measurement
  },

  // 7-day trend for sparkline visualization
  trend: [65, 58, 52, 48, 45, 44, 45],  // Last 7 days of key_metric value

  // Impact scope summary
  impact_scope: {
    count: 15,                   // Number of entities affected (pods, SKUs, etc.)
    unit: "pods",                // Type of entity
    percentage: 75               // % of total entities in scope
  }
}
```

### Field Derivation Rules

| Field | Source | Computation |
|-------|--------|-------------|
| `alert_id` | Generated | `{PERSONA_PREFIX}-{SEQ_NUM}` (CAT, PROC, POD, PLAN, WH, ERP, PS) |
| `owner` | `ai_owner` from base data | Primary owner from parsed ai_owner |
| `scope` | Persona config | From persona operating level mapping |
| `entity` | Aggregation key | The grouped value (brand, warehouse, pod, etc.) |
| `gmv_loss` | `SUM(sales)` | Sum of GMV loss from all records in group |
| `rank` | Sorted position | 1-5 within persona, ordered by gmv_loss DESC |
| `priority` | `gmv_loss` thresholds | P0: ≥₹5L, P1: ₹1L-5L, P2: <₹1L |
| `affected_sku_count` | `COUNT(DISTINCT sku_id)` | Distinct SKUs in the alert |
| `affected_skus` | Top 10 by GMV | SKUs with highest gmv_loss contribution |
| `chronic_days_avg` | `AVG(chronic_days)` | Average chronic days across SKUs |
| `l1_reason_distribution` | Pivot on l2_reason | Percentage breakdown of reason codes |
| `is_primary` / `shared_with` | Parsed from ai_owner | "A / B" → primary=A, shared_with=B |
| `key_metric` | Dominant reason | Metric associated with highest l1_reason |
| `trend` | 7-day history | Daily key_metric values from T-6 to T-0 |
| `impact_scope` | Aggregation stats | Count of affected entities within scope |

---

## Priority Thresholds

| GMV Loss | Priority | Emoji |
|----------|----------|-------|
| ≥ ₹5L (₹500,000) | P0 | 🔥 |
| ₹1L - ₹5L (₹100,000 - ₹500,000) | P1 | 🟠 |
| < ₹1L (< ₹100,000) | P2 | 🟡 |

---

## Implementation Steps

### Step 1: Modify Notebook Query

Change the existing `IM Availability.py` to:

1. **Route by ai_owner FIRST** (not by scope)
2. **Aggregate at persona's level** (not fixed Brand×City)
3. **Keep GMV** (`sales` column through to output)
4. **Handle shared ownership** (parse "Pod Ops / Planning")

```python
# Pseudocode for root-cause-first approach
def generate_alerts(chronic_records):

    # STEP 1: Route by ai_owner
    buckets = defaultdict(list)
    for record in chronic_records:
        owners = parse_ai_owner(record['ai_owner'])  # "Pod Ops / Planning" → ["Pod Ops", "Planning"]
        buckets[owners[0]].append(record)            # Primary owner
        if len(owners) > 1:
            secondary_buckets[owners[1]].append(record)

    # STEP 2: Aggregate at persona's level
    alerts = []
    for owner, records in buckets.items():
        agg_key = PERSONA_LEVELS[owner]              # e.g., "pod" for Pod Ops
        groups = group_by(records, agg_key)

        for group in groups:
            group['gmv_loss'] = sum(r['sales'] for r in group.records)

        # STEP 3: Sort by GMV, take top 5
        top_5 = sorted(groups, key=lambda g: g['gmv_loss'], reverse=True)[:5]

        for rank, group in enumerate(top_5, 1):
            alerts.append(create_alert(owner, group, rank))

    return alerts
```

### Step 2: Generate RCA with Claude Code

For each alert, Claude Code reads:
1. Alert data (gmv_loss, affected_skus, l1_reason_distribution)
2. Persona context (`personas/{owner}.md`)
   - RCA Branch Mapping
   - Diagnosis SOP
   - Action Verbs

Generates:
- **l3_narrative**: 2-3 sentences explaining WHY (grounded in data)
- **action_plan**: Max 2 actions using persona's verbs
- **key_signals**: Metrics to highlight

### Step 3: Output to Dashboard / Slack

Final `alerts_with_rca.json` feeds:
- **Slack Report**: Grouped by owner, sorted by GMV
- **Executive Dashboard**: Aggregate KPIs, accountability table
- **Persona Dashboards**: Filtered by owner

---

## Key Differences: Notebook (Scope-Cascading) vs Required (Root-Cause-First)

### Notebook's Current Approach: Scope-Cascading

```
Rule 1: Brand × City → chronic? → OUTPUT, else ↓
Rule 2: Brand × L1_Category × City → chronic? → OUTPUT, else ↓
Rule 3: Brand × L1_Category × City × Spin → chronic? → OUTPUT
```

**Problem**: Same scope can have MULTIPLE root causes → MULTIPLE owners → WHO acts?

### Required Approach: Root-Cause-First

```
Step 1: Route ALL records by ai_owner → 7 buckets
Step 2: Each bucket aggregates at THAT persona's level
Step 3: Top 5 per persona → 35 alerts max (7 personas × 5)
```

**Benefit**: Each alert has CLEAR SINGLE OWNER who knows exactly what to do.

### Side-by-Side Comparison

| Aspect | Notebook (Scope-Cascading) | Required (Root-Cause-First) |
|--------|---------------------------|----------------------------|
| **First grouping** | Brand × City | ai_owner |
| **Alert scope** | Fixed per rule | Per-persona operating level |
| **Ownership** | Mixed (same alert, multiple owners) | Clear (one owner per alert) |
| **GMV** | Dropped | Kept for ranking |
| **Shared ownership** | Not handled | Parse "A / B" → both get alerts |
| **Output** | 3 cascading DataFrames | 7 persona buckets, top 5 each |

### What We Keep from Notebook

1. **Base Query** - Same joins, filters, field mappings
2. **Metrics** - OVERALL_AVAILABILITY_PCT, LAST_DAY_AVAILABILITY_PCT, UNAVAILABILITY_CONTRIBUTION_PCT
3. **L1/L2 Attribution** - POD Led vs WH Led, reason code pivots
4. **Top Items JSON** - Top contributing SKUs per alert entity
5. **Chronic Threshold** - AVAIL_THRESHOLD = 60%, both overall AND last_day

### What We Change

1. **Routing** - Group by `ai_owner` FIRST, not by Brand×City
2. **Aggregation** - Each persona aggregates at THEIR level (see Persona Operating Levels)
3. **Output** - Top 5 per persona, not cascading rules

---

## Executive Dashboard Schema

The executive dashboard aggregates data from all persona alerts to provide a high-level overview.

### Dashboard Config

All UI text (titles, labels, section names) is centralized in `dashboardConfig` to enable localization and data-driven rendering.

```javascript
{
  // Executive Dashboard Config
  executive: {
    name: "Executive Dashboard",
    icon: "📊",
    description: "Cross-team availability overview with accountability tracking",

    // Header pill labels
    headerLabels: {
      date: "Date",
      city: "City",
      category: "Category",
      tracking: "Tracking"
    },

    // Chart section titles
    charts: {
      gmvByOwner: "GMV at Risk by Owner",
      chronicDuration: "Chronic Duration Distribution"
    },

    // Completion widget labels
    completionWidget: {
      title: "Today's Actions",
      overallLabel: "Overall Completion",
      byTeamLabel: "By Team",
      byPriorityLabel: "By Priority"
    },

    // Table titles
    tables: {
      accountability: "Accountability by Owner",
      topAlerts: "Top 5 P0 Alerts"
    }
  },

  // KPI Tree Config
  kpiTree: {
    title: "KPI Dependency Tree - Root Cause Analysis"
  },

  // Persona Dashboard Config
  persona: {
    // Section titles
    sections: {
      alerts: "Active Alerts",
      actionables: "Top Actionables"
    },

    // Header pill labels
    labels: {
      level: "Level",
      aggregateBy: "Aggregates By",
      focus: "Focus"
    },

    // Filter dropdown labels
    filters: {
      priority: {
        placeholder: "All Priorities",
        options: ["All Priorities", "P0 Only", "P1 Only", "P2 Only"]
      },
      sort: {
        placeholder: "Sort by GMV",
        options: ["Sort by GMV", "Sort by Days", "Sort by Priority"]
      }
    }
  }
}
```

### Summary Schema

```javascript
{
  // Context
  date: "2026-01-14",              // Report date (YYYY-MM-DD)
  city: "Bangalore",               // City scope
  category: "FMCG",                // Category filter
  trackedSkus: 6000,               // Total SKUs being monitored

  // Key Metrics
  availability: 98.2,              // Current availability % (derived from base data)
  target: 99.9,                    // Target availability %
  chronicIssues: 127,              // COUNT of chronic SKU×POD combinations
  totalGmvAtRisk: 5230000,         // SUM(gmv_loss) across all alerts
  totalAlerts: 28,                 // COUNT of active alerts (all personas)
  alertsByPriority: {              // Alert count breakdown
    P0: 5,
    P1: 12,
    P2: 11
  },
  resolutionRate: 73,              // % of actions completed

  // Week-over-week comparison
  sdlwComparison: {                // Same Day Last Week delta
    chronicSkus: +12,              // Change in chronic count
    gmvAtRisk: -13,                // % change in GMV
    alerts: -3,                    // Change in alert count
    resolutionRate: +5             // Change in resolution %
  },

  // Trend history for KPI sparklines
  trendHistory: {
    availability: {
      '7d': { labels: [...], data: [...] },
      '30d': { labels: [...], data: [...] },
      '180d': { labels: [...], data: [...] }
    },
    chronicIssues: { /* same structure */ },
    gmvAtRisk: { /* same structure */ },
    totalAlerts: { /* same structure */ },
    resolutionRate: { /* same structure */ }
  }
}
```

### GMV by Owner Schema

```javascript
// Derived: GROUP BY owner, SUM(gmv_loss) from all alerts
[
  {
    owner: "Category Management",  // Persona name
    gmv: 1820000,                  // Total GMV at risk for this owner
    icon: "📦",                    // Persona icon
    alerts: 5,                     // Alert count for this owner
    dashboardLink: "#/category"    // Link to persona dashboard
  },
  // ... one entry per persona
]
```

### Alerts by Branch Schema

```javascript
// Derived: GROUP BY l1_reason, COUNT(*) from all alerts
[
  {
    branch: "Branch 3: Supply-led",  // Issue branch name
    percentage: 35,                   // % of total alerts
    color: "#dc2626"                  // Chart color
  },
  // ... one entry per branch
]
```

### Chronic Duration Schema

```javascript
// Derived: Histogram of chronic_days_avg across all alerts
[
  {
    range: "15-18 days",           // Duration bucket
    count: 57,                     // Number of alerts in bucket
    percentage: 45,                // % of total
    color: "#fbbf24"               // Severity color (yellow → red)
  },
  // ... buckets: 15-18, 19-22, 23-26, 27-30
]
```

### Accountability Table Schema

```javascript
// Derived: One row per persona with top-level metrics
[
  {
    owner: "Category Management",  // Persona name
    icon: "📦",                    // Persona icon
    alertCount: 5,                 // Active alerts for this owner
    gmvAtRisk: 1820000,            // Total GMV at risk
    topIssue: "Coca-Cola fill rate 45%",  // Highest GMV alert summary
    status: "critical",            // critical | warning | good
    dashboardLink: "#/category"    // Link to persona dashboard
  },
  // ... one entry per persona
]
```

### Top P0 Alerts Schema

```javascript
// Derived: Top 5 alerts by GMV where priority = "P0"
[
  {
    rank: 1,                       // Position by GMV
    scope: "BRAND",                // From alert.scope
    entity: "Coca-Cola",           // From alert.entity
    owner: "Category Management",  // From alert.owner
    gmv_loss: 1250000,             // From alert.gmv_loss
    chronic_days_avg: 22,          // From alert.chronic_days_avg
    l3_narrative: "Supplier fill rate at 45%..."  // From alert.l3_narrative
  },
  // ... up to 5 entries
]
```

### Actionable Completion Schema

```javascript
{
  overall: 62,                     // Overall completion %

  byTeam: [                        // Completion by persona
    {
      name: "Category",
      icon: "📦",
      completed: 8,                // Actions completed
      total: 12,                   // Total actions assigned
      percentage: 67               // Completion %
    },
    // ... one per persona
  ],

  byImpact: [                      // Completion by priority
    {
      name: "P0 (Critical)",
      completed: 3,
      total: 5,
      percentage: 60,
      gmvImpact: 2100000           // GMV at stake
    },
    // ... P0, P1, P2
  ],

  todayStats: {                    // Daily stats
    assigned: 52,
    completed: 33,
    inProgress: 12,
    pending: 7
  }
}
```

### 30-Day Trend Data Schema

```javascript
// For line charts showing historical trends
[
  {
    day: 1,                        // Day number (1-30)
    date: "Dec 15",                // Display date
    count: 140,                    // Chronic count on this day
    availability: 97.8             // Availability % on this day
  },
  // ... 30 entries
]
```

---

## Persona Dashboard Config Schema

```javascript
{
  persona: {
    name: "Category Management",   // Display name
    icon: "📦",                    // Emoji icon
    level: "Brand / Category",     // Operating level display
    aggregateBy: ["brand", "l1_category"],  // Aggregation keys
    description: "Brand POC escalations, selection gaps, fill rate issues"
  },
  kpis: {
    // Persona-specific KPIs with trendHistory
    avgFillRate: {
      value: 68,
      target: 80,
      unit: "%",
      status: "critical",          // critical | warning | good
      trend: -5,                   // Change from previous period
      trendHistory: { /* 7d, 30d, 180d */ }
    },
    // ... additional KPIs vary by persona
  },
  alerts: [/* Alert objects per Alert Schema */]
}
```

---

## Verification Checklist

- [ ] Base query returns chronic SKU×POD records with ai_owner
- [ ] Records correctly routed to 7 owner buckets
- [ ] Each persona's alerts aggregated at correct level
- [ ] Top 5 alerts per persona sorted by GMV
- [ ] Claude Code generates grounded RCA narratives
- [ ] Slack report groups alerts by owner
- [ ] Executive dashboard schemas populated from alert aggregations
- [ ] All dashboard data derived from documented schemas
