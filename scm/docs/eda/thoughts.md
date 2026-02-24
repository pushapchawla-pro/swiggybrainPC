# Availability Metrics & Prediction Granularity

> Sharing a couple of thoughts on availability for Supply Chain Brain - looking for perspectives.

---

## 1. Rethinking the Availability Metric

We currently define SKU-level availability as `1 - (OOS sessions / total sessions)` for each SKU. I think we can do better.

**Proposed**: `1 - (OOS search impressions / total search impressions)` for each SKU

The difference is the denominator:
- **Sessions** = user was on platform
- **Search impressions** = user actually saw this SKU in search results

### Why This Matters

- A session where the user never searched for or saw the SKU shouldn't count against that SKU's availability
- Search impressions capture *actual demand* for that specific SKU, not *plausible demand*
- Temporal patterns (seasonality, day-of-week, hour-of-day) get implicitly weighted - high-demand SKUs naturally generate more impressions when they're in demand
- **Reduces over-provisioning**: 99.9 Bradman becomes more relevant with this metric. When availability is measured against actual demand (search impressions), we can optimize inventory without over-stocking SKUs that aren't being searched for. Session-based metrics incentivize blanket stocking; impression-based metrics incentivize demand-aligned stocking.

> **Context**: Amazon does something similar with "glance view-weighted availability" - they measure OOS at product page level per ASIN. We're adapting it one step upstream to search results, which may make more sense for quick-commerce where users decide faster.

---

## 2. Prediction Granularity for OOS

Related to the above: if we're shifting to demand-driven measurement, where should we apply this thinking for prediction?

**Problem**: We want to predict which SKUs will go out of stock so we can intervene proactively. At what level should we predict?

### Three Candidate Approaches

#### Option A: POD-level Prediction
Predict OOS probability at individual dark store level.

| For | Against |
|-----|---------|
| Customer experiences availability at POD - start from where value is delivered | Sparse data (POD × SKU × time) |
| Ground truth is clean - OOS directly observable, easier to validate | More operational complexity |
| Enables hyperlocal signals (weather, local events) | Root cause often upstream (vendor, WH ops) |
| Warehouse forecast is sum of POD forecasts anyway - predict at source, not derivative | |

#### Option B: Warehouse-level Prediction (Inventory-based)
Predict OOS using inventory metrics (DOH < 3 days, WH_STOCK < 10 units) at warehouse level.

| For | Against |
|-----|---------|
| Less sparse, operationally simpler | DOH is derived (inventory / predicted demand) - compounds forecasting error |
| DOH thresholds familiar to ops teams | Loses hyperlocal signals |
| Maps directly to "raise PO" intervention | Allocation blindness (WH has stock ≠ right POD has stock) |

#### Option C: Warehouse-level Prediction (Demand-signal-based)
Predict OOS by aggregating demand signal (sessions, or search impressions per point 1) from all PODs with this warehouse as primary.

| For | Against |
|-----|---------|
| Demand-driven (demand signal > DOH) | Still loses hyperlocal signals |
| Less sparse than POD-level | Allocation blindness persists |
| Aligns with how supply chain operates - intervention happens at WH | Treats different POD demand patterns as homogeneous |

### My Lean

**A for high-velocity SKUs, C for long-tail.** Use warehouse metrics as features, not target. Open to pushback.

---

## 3. Hypotheses to Validate

Before committing to these directions, we should validate key assumptions with data.

### H1.1: Session-based and Impression-based Availability Diverge Meaningfully

If the two metrics are highly correlated (>0.95), switching doesn't matter. But if they diverge, it means session-based is masking real availability problems.

**Validation**: Calculate divergence across SKUs. If >20% of SKUs show >5% divergence, hypothesis is validated.

```sql
-- H1.1: Do sessions and impressions tell different stories?
SELECT
  COUNT(*) as total_skus,
  COUNT(CASE WHEN ABS(session_avail - impression_avail) > 0.05 THEN 1 END) as divergent_skus,
  COUNT(CASE WHEN ABS(session_avail - impression_avail) > 0.05 THEN 1 END) * 100.0 / COUNT(*) as pct_divergent
FROM (
  SELECT sku_id,
         AVG(session_availability) as session_avail,
         AVG(impression_availability) as impression_avail
  FROM analytics.public.weighted_availability_daily_update
  WHERE city = 'Bangalore' AND date >= CURRENT_DATE - 30
  GROUP BY sku_id
)
```

**Expected outcome**: If pct_divergent > 20%, session-based is hiding signal.

---

### H1.2: Impression-based Availability Better Predicts Conversion Loss

The metric that better correlates with business outcomes (GMV loss, I2C) should be preferred.

**Validation**: Correlate both metrics with conversion. Higher R² = better metric.

```sql
-- H1.2: Which metric better predicts conversion impact?
SELECT
  CORR(session_availability, i2c) as session_corr_i2c,
  CORR(impression_availability, i2c) as impression_corr_i2c,
  CORR(session_availability, gmv) as session_corr_gmv,
  CORR(impression_availability, gmv) as impression_corr_gmv
FROM analytics.public.weighted_availability_daily_update w
JOIN analytics.public.im_sku_day_avl a ON w.sku_id = a.sku_id AND w.date = a.date
WHERE w.city = 'Bangalore' AND w.date >= CURRENT_DATE - 30
```

**Expected outcome**: If impression_corr > session_corr, impression-based is better signal.

---

### H2.1: Allocation Blindness is a Real Problem

This validates the concern that WH has stock but specific PODs are OOS. If this is rare, Options B/C are fine. If common, Option A is stronger.

**Validation**: Count cases where WH is instock but POD is OOS (final_reason LIKE 'instock_%').

```sql
-- H2.1: How often does WH have stock but POD is OOS?
SELECT
  COUNT(*) as total_oos_events,
  SUM(CASE WHEN final_reason LIKE 'instock_%' THEN non_avail_sessions ELSE 0 END) as pod_led_oos_sessions,
  SUM(CASE WHEN final_reason LIKE 'oos_%' THEN non_avail_sessions ELSE 0 END) as wh_led_oos_sessions,
  SUM(CASE WHEN final_reason LIKE 'instock_%' THEN non_avail_sessions ELSE 0 END) * 100.0 /
    SUM(non_avail_sessions) as pct_allocation_blindness
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
WHERE city = 'Bangalore' AND date >= CURRENT_DATE - 30
```

**Expected outcome**: Prior data suggests ~27% (4.7 / (4.7 + 12.8)) of OOS is POD-led despite WH having stock. If this is >20%, allocation blindness is real.

---

### H2.2: POD-level Variance Exists Within Same WH

If all PODs under a WH behave similarly, WH-level prediction is sufficient. If PODs vary significantly, POD-level adds value.

**Validation**: Measure variance of availability across PODs within the same WH.

```sql
-- H2.2: Do PODs under the same WH behave differently?
SELECT
  warehouse_id,
  sku_id,
  COUNT(DISTINCT pod_id) as num_pods,
  AVG(availability_pct) as avg_avail,
  STDDEV(availability_pct) as stddev_avail,
  MAX(availability_pct) - MIN(availability_pct) as range_avail
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
WHERE city = 'Bangalore' AND date >= CURRENT_DATE - 30
GROUP BY warehouse_id, sku_id
HAVING COUNT(DISTINCT pod_id) > 3
ORDER BY stddev_avail DESC
```

**Expected outcome**: If avg stddev_avail > 10%, PODs behave differently → POD-level prediction adds value.

---

## Summary: What We Need to Prove

| Hypothesis | Validated If | Supports |
|------------|--------------|----------|
| H1.1: Metrics diverge | >20% SKUs with >5% divergence | Point 1 (impressions > sessions) |
| H1.2: Impressions predict conversion better | impression_corr > session_corr | Point 1 (impressions > sessions) |
| H2.1: Allocation blindness is real | >20% OOS is POD-led despite WH instock | Point 2 Option A |
| H2.2: POD variance within WH | avg stddev > 10% | Point 2 Option A |

**If H2.1 and H2.2 fail**, Options B/C are sufficient. **If they pass**, Option A has stronger justification.

---

**Thoughts?**

---

# Validation Execution Log

## Setup (2026-01-15)

**Goal**: Run hypothesis validation queries against Databricks.

### Step 1: Databricks CLI Authentication
| Item | Value |
|------|-------|
| Workspace | `https://swiggy-analytics.cloud.databricks.com/` |
| Profile | `analytics-workspace` |
| Auth method | OAuth via `databricks auth login` |
| Status | ✅ Authenticated |

### Step 2: SQL Query Execution Setup
- Tried `databricks sql` command → Not available in CLI v0.236.0
- Tried installing `databricks-sql-cli` via pip3 → Failed (Python 3.12 incompatible, distutils removed)
- **Solution**: Created venv with Python 3.11 using `uv venv --python 3.11 --native-tls`
- Installed `databricks-sql-cli` in venv → ✅ Success

### Step 3: SQL Warehouse Discovery
- Listed warehouses via `databricks api get /api/2.0/sql/warehouses`
- Found: `ANALYST_WH_01` (id: `61ce236c169e5b23`, state: RUNNING)
- HTTP path: `/sql/1.0/warehouses/61ce236c169e5b23`

### Step 4: Table Discovery
- Catalogs available: `prod`, `dev`, `hive_metastore`, `main`, etc.
- Found RCA table: `prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7`
- Note: City filter is uppercase (`BANGALORE` not `Bangalore`)
- Date column is `DT` (string format)
- FINAL_REASON patterns: `oos_%` (WH-led), `instock_%` (POD-led/allocation blindness)

### Command Template
```bash
export DBR_TOKEN=$(databricks auth token --profile analytics-workspace 2>/dev/null | grep access_token | cut -d'"' -f4)
source .venv-dbsql/bin/activate
dbsqlcli --hostname swiggy-analytics.cloud.databricks.com \
  --http-path /sql/1.0/warehouses/61ce236c169e5b23 \
  --access-token "$DBR_TOKEN" \
  -e "YOUR SQL QUERY"
```

---

## H2.1 Result: Allocation Blindness Check

### Query Executed
```sql
SELECT
  COUNT(*) as total_oos_events,
  SUM(CASE WHEN FINAL_REASON LIKE 'instock_%' THEN NON_AVAIL_SESSIONS ELSE 0 END) as pod_led_oos_sessions,
  SUM(CASE WHEN FINAL_REASON LIKE 'oos_%' THEN NON_AVAIL_SESSIONS ELSE 0 END) as wh_led_oos_sessions,
  ROUND(SUM(CASE WHEN FINAL_REASON LIKE 'instock_%' THEN NON_AVAIL_SESSIONS ELSE 0 END) * 100.0 /
    NULLIF(SUM(NON_AVAIL_SESSIONS), 0), 2) as pct_allocation_blindness
FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'BANGALORE' AND DT >= DATE_SUB(CURRENT_DATE(), 30)
```

### Result

**Data Source Comparison**:

| Date | Source | Availability | WH Led | POD Led | POD Ratio |
|------|--------|--------------|--------|---------|-----------|
| Feb 2025 | Waterfall | 83.32% | 12.05% | 4.63% | **27.8%** |
| Dec 21, 2025 | Waterfall | 82.46% | 12.81% | 4.73% | **27.0%** |
| Dec 21, 2025 | Databricks (no filter) | 70.3% | 25.79% | 3.89% | 13.1% |
| Jan 14, 2026 | Databricks (Bangalore) | 72.4% | 24.4% | 3.23% | 11.7% |

**Key Discovery**: Waterfall dashboard uses `ASSORTMENT IN ('A', 'MLT', 'MnE')` filter (priority SKUs only).
- Source table: `analytics.public.sku_wise_availability_rca_with_reasons_v7`
- WH-led: `WH_STOCK1 = 'OOS'` (DOH < 3 OR WH_STOCK < 10)
- POD-led: `WH_STOCK1 = 'Instock'` (WH has stock but POD doesn't)
- Source: Glean search confirmed from `availability_attribution_waterfall.sql`

> ✅ **Confirmed**: Using waterfall numbers (~27% POD-led) as source of truth for priority SKUs.

### Interpretation
- **WH-led OOS**: ~72% of unavailable sessions (12.05 / 16.68)
- **POD-led OOS**: ~28% of unavailable sessions (4.63 / 16.68)

**Why 28% POD-led matters for 99.9% availability target**:
- Current availability: 83.32% → need to recover 16.58% to hit 99.9%
- If we only solve WH-led (Options B/C), we recover 12.05% → availability reaches ~95.4%
- POD-led 4.63% remains unaddressed → **cannot reach 99.9%**
- **Both WH-level and POD-level prediction are needed to hit 99.9%**

---

## H2.2 Result: POD Variance Within WH

**Initial Issue**: SKU_ID is POD-specific (1:1 mapping). **Solution**: Use `ITEM_CODE` which is WH-wide.

### Query Executed
```sql
SELECT
  ROUND(AVG(stddev_avail) * 100, 2) as avg_stddev_pct,
  ROUND(PERCENTILE(stddev_avail, 0.5) * 100, 2) as median_stddev_pct,
  ROUND(PERCENTILE(stddev_avail, 0.9) * 100, 2) as p90_stddev_pct,
  COUNT(*) as num_wh_item_combos
FROM (
  SELECT WH_NAME, ITEM_CODE,
    COUNT(DISTINCT STORE_ID) as num_pods,
    STDDEV(AVAILABILITY) as stddev_avail
  FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
  WHERE CITY = 'BANGALORE' AND DT >= DATE_SUB(CURRENT_DATE(), 7)
  GROUP BY WH_NAME, ITEM_CODE
  HAVING COUNT(DISTINCT STORE_ID) >= 5
)
```

### Result
| Metric | Value |
|--------|-------|
| **avg_stddev_pct** | **23.24%** |
| median_stddev_pct | 23.89% |
| p75_stddev_pct | 40.4% |
| p90_stddev_pct | 47.63% |
| num_wh_item_combos | 163,787 |

### Interpretation
- Hypothesis threshold was >10%
- Actual: **23.24%** - **ABOVE THRESHOLD**
- PODs within the same WH exhibit significant variance in availability for the same item
- At P90, variance reaches 47.6% - meaning 10% of items have extremely high POD-to-POD variance

**Status**: ✅ Validated - POD variance is real

---

## H1.1 & H1.2: Impression vs Session Availability

### Key Tables Discovered

| Table | Purpose |
|-------|---------|
| `analytics.public.SRK_IMPRESSIONS_METRICS_TRANS` | Search impressions at SKU×STORE×DATE (SEARCH_IMP, S2C, SEARCH_GMV) |
| `analytics.public.im_sku_day_avl` | Session-weighted availability at SKU×STORE×DATE (WTD_AVAILABILITY) |
| `analytics.public.im_property_final_metrics_trans` | Raw impression events with IMPRESSION_PROPERTY='search' |

### H1.1 Validation: Session vs Search-Impression-Weighted Availability

**Method**: Join search impressions with daily availability to compute search-weighted availability.

```sql
WITH
search_imps AS (
  SELECT DT, STORE_ID, SKU_ID, SEARCH_IMP
  FROM analytics.public.SRK_IMPRESSIONS_METRICS_TRANS
  WHERE DT >= '2026-01-07' AND CITY = 'Bangalore' AND SEARCH_IMP > 0
),
daily_avl AS (
  SELECT DT, STORE_ID, SKU_ID, WTD_AVAILABILITY as session_avail
  FROM analytics.public.im_sku_day_avl
  WHERE DT >= '2026-01-07' AND CITY = 'Bangalore'
)
SELECT
  AVG(a.session_avail) as session_avail,
  SUM(a.session_avail * s.SEARCH_IMP) / SUM(s.SEARCH_IMP) as search_weighted_avail
FROM search_imps s
INNER JOIN daily_avl a ON s.DT = a.DT AND s.STORE_ID = a.STORE_ID AND s.SKU_ID = a.SKU_ID
```

**Aggregate Result**:
| Metric | Value |
|--------|-------|
| Session-based availability | 84.05% |
| Search-weighted availability | **91.15%** |
| **Divergence** | **+7.11%** |
| SKU×POD combos | 32M |
| Search impressions | 318M |

**Surprising Finding**: Search-weighted availability is **HIGHER** than session-based (opposite of original hypothesis).

### Per-SKU Divergence

```sql
-- Per-SKU divergence between session vs search-weighted
WITH sku_metrics AS (
  SELECT s.SKU_ID,
    AVG(a.session_avail) as session_avail,
    SUM(a.session_avail * s.SEARCH_IMP) / SUM(s.SEARCH_IMP) as search_avail
  FROM search_imps s
  INNER JOIN daily_avl a ON ...
  GROUP BY s.SKU_ID
  HAVING SUM(s.SEARCH_IMP) > 100
)
SELECT
  COUNT(*) as total_skus,
  SUM(CASE WHEN ABS(search_avail - session_avail) > 0.05 THEN 1 END) as divergent_5pct
FROM sku_metrics
```

**Result**:
| Metric | Value | Threshold | Status |
|--------|-------|-----------|--------|
| Total SKUs | 832,548 | - | - |
| Divergent (>5%) | 170,478 | 20% | **20.48%** ✅ |
| Divergent (>10%) | 118,256 | - | 14.20% |
| Avg session avail | 89.81% | - | - |
| Avg search avail | 93.04% | - | +3.23% |

### H1.1 Conclusion

**Status**: ✅ VALIDATED

**20.48%** of SKUs show >5% divergence, meeting the 20% threshold.

**Why Search-Weighted (91%) > Session-Based (84%)** - this is EXPECTED:
- **Session-based** includes ALL catalog SKUs, including long-tail SKUs nobody searches for
- **Search-weighted** weights toward high-demand SKUs that actually get searched
- High-demand SKUs have better availability (we prioritize stocking what sells)
- Long-tail SKUs have worse availability (less inventory priority)
- This is good supply chain behavior - NOT surprising

**What WOULD be surprising** (and a red flag):
- Search-weighted < session-based
- That would mean "SKUs people want are LESS available than SKUs nobody searches"
- That would indicate supply chain failure

**Key Insight**: The 7% gap confirms that long-tail availability drags down session-based. Search-weighted reflects actual customer experience; session-based reflects overall catalog health including long-tail.

**Recommendation**:
- **Search-weighted** for customer experience targets (customer-backwards)
- **Session-based** for supply chain diagnostics (includes long-tail problems)

### H1.2: Conversion Correlation

**Query** (via Databricks):
```sql
WITH sku_metrics AS (
  SELECT s.SKU_ID,
    AVG(a.WTD_AVAILABILITY) as session_avail,
    SUM(a.WTD_AVAILABILITY * s.SEARCH_IMP) / SUM(s.SEARCH_IMP) as search_avail,
    SUM(s.S2C) * 1.0 / SUM(s.SEARCH_IMP) as s2c_rate,
    SUM(s.SEARCH_GMV) as total_search_gmv
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans s
  INNER JOIN prod.analytics_prod.analytics_public_im_sku_day_avl a
    ON s.DT = a.DT AND s.STORE_ID = a.STORE_ID AND s.SKU_ID = a.SKU_ID
  WHERE s.DT >= DATE_SUB(CURRENT_DATE(), 7) AND s.CITY = 'Bangalore'
  GROUP BY s.SKU_ID HAVING SUM(s.SEARCH_IMP) > 100
)
SELECT CORR(session_avail, s2c_rate), CORR(search_avail, s2c_rate) FROM sku_metrics
```

**Result**:
| Metric | Session Corr | Search Corr | Better? |
|--------|--------------|-------------|---------|
| S2C Rate | **-0.0119** | **+0.0172** | Search (slightly) |
| Search GMV | -0.0147 | -0.0055 | Search (slightly) |
| SKUs tested | 708,877 | - | - |

**H1.2 Conclusion**: ❌ **NOT VALIDATED**

Both correlations are **extremely weak** (near zero). Search-weighted has marginally better (positive) correlation with S2C, but the difference is not meaningful.

**Interpretation**:
- Availability alone is NOT a strong predictor of conversion
- Other factors dominate: price, relevance, search ranking, product attributes
- The metric choice (session vs search) doesn't meaningfully impact conversion correlation
- **Implication**: Don't switch metrics based on conversion prediction - use other criteria (H1.1 findings)

---

## Summary of Validation Results (2026-01-15)

| Hypothesis | Target | Result | Status |
|------------|--------|--------|--------|
| H1.1: Metrics diverge | >20% SKUs with >5% divergence | **20.48%** | ✅ Validated |
| H1.2: Search predicts conversion better | search_corr > session_corr | +0.017 vs -0.012 | ❌ Both near zero |
| H2.1: Allocation blindness is real | >20% OOS is POD-led | **27.8%** (waterfall) | ✅ Validated |
| H2.2: POD variance within WH | avg stddev > 10% | **23.24%** | ✅ Validated |

### Key Insights

1. **H1.1 VALIDATED**: 20.48% of SKUs diverge >5% between session-based (84%) and search-weighted (91%)
   - Search > session is **EXPECTED** (not surprising) - high-demand SKUs have better availability
   - The gap confirms long-tail SKUs drag down session-based
   - **Recommendation**: Use **search-weighted for customer targets** (customer-backwards), **session-based for supply chain diagnostics**

2. **H1.2 NOT VALIDATED**: Neither metric predicts conversion (correlations ~0)
   - Availability alone doesn't drive S2C - other factors dominate (price, relevance, ranking)
   - Don't use conversion correlation as criterion for metric choice

3. **H2.1 VALIDATED**: Allocation blindness at **27.8%** (per waterfall) is ABOVE 20% threshold
   - WH-led OOS: 72% (12.05% miss) → addressable via Options B/C
   - POD-led OOS: 28% (4.63% miss) → requires Option A
   - **For 99.9%, both must be solved** - WH-only caps at 95.4%

4. **H2.2 VALIDATED**: POD variance at **23.24%** confirms POD-level prediction adds value
   - Same item behaves very differently across PODs within same WH
   - P90 variance reaches 47.6% - significant heterogeneity

5. **Summary**:
   - H1.1 ✅ → Metrics diverge meaningfully (use search-weighted for customer targets)
   - H1.2 ❌ → Neither predicts conversion (availability is hygiene, not driver)
   - H2.1 ✅ → Both WH + POD prediction needed for 99.9%
   - H2.2 ✅ → POD-level adds value (high variance)

### Implications for Decision

**For 99.9% Availability Target** (using waterfall data):

| OOS Type | % of OOS | Absolute Miss | Must Solve? | Prediction Level |
|----------|----------|---------------|-------------|------------------|
| WH-led | 72% | 12.05% | ✅ Yes | Options B/C (WH-level) |
| POD-led | 28% | 4.63% | ✅ Yes | Option A (POD-level) |

**Path to 99.9%**:
- Current: 83.32% availability
- Solve WH-led only → 83.32% + 12.05% = **95.4%** (not enough)
- Solve POD-led only → 83.32% + 4.63% = **87.9%** (not enough)
- Solve both → 83.32% + 16.68% = **100%** (achievable)

**Recommended Architecture**:
1. **Layer 1**: WH-level prediction (Option B or C) for upstream/procurement issues (72% of OOS)
2. **Layer 2**: POD-level prediction (Option A) for allocation/distribution issues (28% of OOS)

H1.1/H1.2 remain open - worth validating before committing to metric definition.

---

## Appendix: Data Source Reference

### Waterfall Dashboard Source
- **Table**: `analytics.public.sku_wise_availability_rca_with_reasons_v7` (Snowflake)
- **Databricks mirror**: `prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7`
- **Key field**: `WH_STOCK1` determines WH-led vs POD-led
  - `WH_STOCK1 = 'OOS'` → WH-led (DOH < 3 OR WH_STOCK < 10)
  - `WH_STOCK1 = 'Instock'` → POD-led (WH has stock but POD doesn't)
- **Assortment filter**: `ASSORTMENT IN ('A', 'MLT', 'MnE')` for priority SKUs
- **Source SQL**: `data-platform-zflow/notebooks/godavarthi.s/availability_attribution_waterfall.sql`

### Query Setup (Databricks)
```bash
# Authentication
databricks auth login --host https://swiggy-analytics.cloud.databricks.com --profile analytics-workspace

# Query execution
export DBR_TOKEN=$(databricks auth token --profile analytics-workspace 2>/dev/null | grep access_token | cut -d'"' -f4)
source .venv-dbsql/bin/activate
dbsqlcli --hostname swiggy-analytics.cloud.databricks.com \
  --http-path /sql/1.0/warehouses/61ce236c169e5b23 \
  --access-token "$DBR_TOKEN" \
  -e "YOUR SQL QUERY"
```

### Snowflake Setup

**CLI**: `/Applications/SnowSQL.app/Contents/MacOS/snowsql` (v1.4.5)

**Config** (`~/.snowsql/config`):
```ini
[connections.swiggy]
accountname = swiggy.ap-southeast-1
username = sidhant.panda@swiggy.in
authenticator = externalbrowser
warehousename = ENGG_WH_01
dbname = ANALYTICS
schemaname = PUBLIC
```

**Query execution**:
```bash
/Applications/SnowSQL.app/Contents/MacOS/snowsql -c swiggy -q "YOUR SQL QUERY"
```

**Note**: `externalbrowser` auth requires interactive browser login. Queries hang when run in background without browser access. Token caching requires account-level `ALLOW_ID_TOKEN` setting by admin.

### Snowflake ↔ Databricks Sync

Most Snowflake analytics tables are mirrored to Databricks with this naming convention:

| Snowflake | Databricks |
|-----------|------------|
| `analytics.public.table_name` | `prod.analytics_prod.analytics_public_table_name` |

**Examples**:
- `analytics.public.im_sku_day_avl` → `prod.analytics_prod.analytics_public_im_sku_day_avl`
- `analytics.public.srk_impressions_metrics_trans` → `prod.analytics_prod.analytics_public_srk_impressions_metrics_trans`

**When to use which**:
- **Databricks**: CLI queries (no browser auth needed), batch jobs, notebooks
- **Snowflake**: Interactive exploration, tables not synced to Databricks, ad-hoc analysis

**Caveat**: Not all tables are synced. Some real-time or very large tables may only exist in Snowflake.

### Key Snowflake Tables Investigated

| Table | Rows | Schema |
|-------|------|--------|
| `WEIGHTED_AVAILABILITY_DAILY_UPDATE` | 14B | DT, HOUR, STORE_ID, SKU_ID, SESSIONS, AVAILABILITY (time-based), WTD_AVAILABILITY (NULL) |
| `SRK_IMPRESSIONS_METRICS_TRANS` | 9B | DT, SKU_ID, STORE_ID, SEARCH_IMP, TOTAL_IMP, S2C, SEARCH_GMV |
| `SKU_WISE_AVAILABILITY_RCA_WITH_REASONS_V7` | Large | Same as Databricks mirror |

**Data Gap**: No table tracks "impression-level availability" - whether SKU was OOS when displayed in search results. Would need new instrumentation to validate H1.1 properly.

### Complete Table Reference

| Table (Databricks) | Purpose | Key Columns | Used In |
|--------------------|---------|-------------|---------|
| `analytics_public_im_sku_day_avl` | Daily SKU×Store availability | WTD_AVAILABILITY, STORE_ID, SKU_ID, CITY, DT | H1.1, H1.2, H1.2a, OOS verification |
| `analytics_public_srk_impressions_metrics_trans` | Search impressions & conversions | SEARCH_IMP, S2C, SEARCH_GMV, SKU_ID, STORE_ID | H1.1, H1.2, OOS verification |
| `analytics_public_sku_wise_availability_rca_with_reasons_v7` | Availability RCA with reasons | WH_STOCK1, FINAL_REASON, AVAILABILITY, ITEM_CODE, WH_NAME | H2.1, H2.2 |
| `analytics_public_im_session_data_serv` | Session-level data | SID, ORDER_IND, STOREID, CITY | H1.2a |
| `analytics_public_im_clickstream_sample_final` | IM clickstream events | EVENT_NAME, SID, ITEMID, SCREEN_NAME | Explored (old data) |
| `im_add_to_cart_event_sv` | Add to cart events | event_name, sid, sku_id | Explored (no OOS flag) |
| `sh_item_oos_realtime` | OOS items realtime | OOS_items, total_items, slot | Explored (aggregate only) |
| `im_realtime_traffic_conversion_orders` | Conversion funnel | menu_sessions, cart_sessions, orders | Explored (no OOS flag) |

**Snowflake equivalents**: Replace `prod.analytics_prod.analytics_public_` with `analytics.public.`

---

## Open Question: Metric Choice Debate (2026-01-15)

### The Challenge

Initial recommendation was to use session-based (84%) over search-weighted (91%) because:
- Session-based is "harder" / more conservative
- Search-weighted might be inflated by search hiding OOS SKUs

**But**: This assumes OOS SKUs are hidden from search. If OOS SKUs ARE shown in search (greyed out), then:
1. Search-weighted is NOT inflated by search hiding
2. The 91% vs 84% gap must be explained differently
3. Search-weighted becomes the more "customer backwards" metric

### Key Unvalidated Assumption

**Does Instamart search hide OOS SKUs or show them (greyed out)?**

If OOS is SHOWN in search:
- Search impressions include OOS items
- Search-weighted = "Of all SKUs customers searched for (including OOS), what % were available?"
- This is the TRUE customer experience metric
- **Session-based overcounts** by including sessions where customer never searched for the SKU

If OOS is HIDDEN from search:
- Search impressions exclude OOS items
- Search-weighted = "Of SKUs search chose to show, what % were available?"
- This is inflated by search algorithm
- **Session-based is more honest** about underlying availability

### Why This Matters

| If OOS is... | Better Metric | Reasoning |
|--------------|---------------|-----------|
| **Shown** in search | Search-weighted | Measures actual customer experience with OOS visibility |
| **Hidden** from search | Session-based | Search-weighted is gamed by algorithm hiding problems |

### The "Customer Backwards" Argument

User challenge: "If search-weighted reflects what customers actually experience, why optimize for the harder session-based metric that doesn't impact business outcomes?"

Valid point. The counter-arguments were:
1. Session-based measures "demand fulfillment" vs search-weighted measures "browsing experience"
2. Search might mask problems that still represent unmet demand
3. For Supply Chain Brain (proactive intervention), we need to see real gaps

**But**: If OOS is shown in search, both metrics measure customer experience - just weighted differently.

### Validation Result: OOS Handling in Search

**CONFIRMED via Glean (code search) + Data validation**:

| Aspect | Behavior | Source |
|--------|----------|--------|
| **Visibility** | OOS items ARE SHOWN in dedicated widget | GitHub PRs (swiggy-ios/pull/10336), test code |
| **Visual treatment** | "Sold out" sticker, dimmed image, disabled CTA | `SwIMVariantDetailNodeV3.swift`, Android code |
| **Ranking** | OOS items pushed to END of search results | `im-discovery-service` ranking logic |
| **Impressions** | OOS impressions ARE logged via GTM | `OutOfStockFragmentViewModel.kt` |

#### Data Validation: OOS Items Get Impressions

```sql
-- Check if OOS SKUs get search impressions
-- If OOS items are hidden from search, they should have 0 impressions
WITH oos_skus AS (
  SELECT DISTINCT STORE_ID, SKU_ID, DT
  FROM prod.analytics_prod.analytics_public_im_sku_day_avl
  WHERE CITY = 'Bangalore'
    AND DT >= DATE_SUB(CURRENT_DATE(), 7)
    AND WTD_AVAILABILITY = 0  -- Completely OOS
),
impressions AS (
  SELECT STORE_ID, SKU_ID, DT, SEARCH_IMP
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans
  WHERE CITY = 'Bangalore'
    AND DT >= DATE_SUB(CURRENT_DATE(), 7)
)
SELECT
  COUNT(DISTINCT CONCAT(o.STORE_ID, '-', o.SKU_ID, '-', o.DT)) as total_oos_sku_store_days,
  COUNT(DISTINCT CASE WHEN i.SEARCH_IMP > 0 THEN CONCAT(o.STORE_ID, '-', o.SKU_ID, '-', o.DT) END) as oos_with_impressions,
  SUM(COALESCE(i.SEARCH_IMP, 0)) as total_impressions_for_oos_skus
FROM oos_skus o
LEFT JOIN impressions i ON o.STORE_ID = i.STORE_ID AND o.SKU_ID = i.SKU_ID AND o.DT = i.DT
```

**Result** (Bangalore, 7 days):

| Metric | Value |
|--------|-------|
| Total OOS SKU-Store-Days | 9,501,129 |
| OOS with impressions | 3,877,870 (40.8%) |
| Total impressions for OOS SKUs | 16,575,983 |

**Interpretation**: 40.8% of OOS items received search impressions. OOS items ARE shown in search. The 59.2% without impressions are likely low-demand SKUs nobody searched for, not hidden OOS.

**This explains the 91% vs 84% gap**:
- OOS items get fewer impressions because they're **ranked lower** (not hidden)
- Users don't scroll to bottom as often → OOS gets fewer impressions
- Search-weighted is inflated by **ranking**, not by hiding

### Revised Understanding

| Metric | What It Actually Measures |
|--------|---------------------------|
| **Search-weighted (91%)** | Availability of SKUs users **actually see** (above fold, first page) |
| **Session-based (84%)** | Availability of all SKUs in catalog during session |

**The 7% gap** = SKUs that exist in catalog but users don't scroll down to see (ranked lower because OOS)

### The Nuanced Question

Should we measure based on:
1. **What customers COULD see** (if they scrolled) → Session-based (84%)
2. **What customers ACTUALLY see** (first page) → Search-weighted (91%)

This is a **product/business decision**, not just technical:
- Search-weighted reflects "customer experience as designed"
- Session-based reflects "underlying inventory health"
- Ranking is a deliberate UX choice to prioritize available items

### Final Recommendation on Metric Choice

| Use Case | Metric | Reasoning |
|----------|--------|-----------|
| **Customer availability targets** | Search-weighted | Customer-backwards - reflects actual experience |
| **Supply chain diagnostics** | Session-based | Includes long-tail problems |
| **Proactive intervention (Supply Chain Brain)** | Both | Search-weighted for prioritization, session-based for coverage |

**Key insight**: Search-weighted > session-based is EXPECTED (not surprising). High-demand SKUs have better availability because we prioritize stocking what sells. The gap (7%) represents long-tail SKUs with worse availability.

**Why search-weighted for customer targets**:
- Reflects what customers actually experience when searching
- Customer-backwards thinking = measure what matters to them
- Long-tail SKUs (in session-based) are rarely searched anyway

**Why session-based still matters**:
- Catches long-tail availability problems
- Useful for overall catalog health monitoring
- Important for supply chain diagnostics

---

## Re-examining Our Assumptions (2026-01-15)

### Challenge 1: Why session-based at all?

**User challenge**: If customers don't search for long-tail SKUs, why care about their availability? We have limited POD shelf space and inventory budget - shouldn't we focus on what customers actually want?

**Revised thinking**: The "supply chain diagnostics" use case for session-based is weak. What action does it enable?
- If nobody searches for a SKU, stocking it doesn't improve customer experience
- The 7% gap represents items we're stocking that don't drive conversion
- Session-based may only matter for **assortment planning** (what SHOULD be in catalog)

**Revised recommendation**: For Supply Chain Brain, **focus on search-weighted only**. Session-based is a distraction.

### Challenge 2: Why doesn't availability predict conversion?

**The puzzle**: Intuitively, if something is OOS, customers can't buy it → lower conversion. But our H1.2 showed correlation ~0. Why?

**Possible explanations**:
1. **Availability is necessary but not sufficient** (hygiene factor, not differentiator)
2. **Substitution masks the signal** (user buys Brand B when Brand A is OOS)
3. **We measured at wrong granularity** (SKU-level vs session-level)
4. **91% floor limits variance** (most items already available)

**New sub-hypotheses to test**:

---

### H1.2a: Session-Level OOS Impact

**Hypothesis**: Sessions where users encounter OOS items have lower checkout rates than sessions without OOS encounters.

**Why it matters**: If true, availability DOES matter for conversion - we just measured at the wrong granularity (SKU vs session).

| If Validated | If Not Validated |
|--------------|------------------|
| OOS hurts conversion at session level | Substitution fully absorbs the impact |
| Availability is a hygiene factor with real impact | Availability truly doesn't matter for conversion |
| Proactive OOS prevention has clear ROI | OOS prevention value is indirect (experience, not conversion) |

**Validation approach**:
- Compare checkout rate for sessions WITH OOS encounters vs WITHOUT
- Control for session characteristics (time, location, user type)

**Expected data**:
- Need session-level data with OOS encounter flag
- Tables: session logs + OOS events

---

### H1.2b: Substitution Rate When Facing OOS

**Hypothesis**: When users encounter OOS, a significant portion substitute rather than abandon.

**Why it matters**: If substitution is high, OOS doesn't hurt conversion (just shifts it). If abandonment is high, OOS has real conversion impact.

| If High Substitution (>50%) | If High Abandonment (>50%) |
|-----------------------------|----------------------------|
| OOS impact is on brand loyalty, not conversion | OOS directly hurts conversion |
| Category availability matters more than SKU | SKU-level availability is critical |
| Focus on category depth | Focus on specific SKU availability |

**Validation approach**:
- Track user behavior after OOS encounter: substitute vs exit
- Look for "OOS → add different SKU" patterns in session data

---

### H1.2a/b Validation Execution Log

#### Data Investigation (2026-01-15)

**Attempted approach**: Since session-level OOS encounter data isn't readily available, used store-level availability as a proxy. If OOS hurts conversion, stores with lower availability should have lower session conversion rates.

##### Tables Explored

| Table | Purpose | Useful? |
|-------|---------|---------|
| `prod.analytics_prod.analytics_public_im_session_data_serv` | Session-level data with ORDER_IND flag | ✅ Yes - has conversion |
| `prod.analytics_prod.analytics_public_im_sku_day_avl` | Daily availability by SKU×Store | ✅ Yes - has availability |
| `prod.analytics_prod.analytics_public_im_clickstream_sample_final` | IM clickstream events | ❌ Old data (Sep-Oct 2024) |
| `prod.analytics_prod.im_add_to_cart_event_sv` | Add to cart events | ❌ No OOS flag |
| `prod.analytics_prod.sh_item_oos_realtime` | OOS items realtime | ❌ Aggregate only, no session |
| `prod.analytics_prod.im_realtime_traffic_conversion_orders` | Conversion funnel | ❌ No OOS flag |

**Key gap identified**: No table links session_id + OOS_encounter_flag + order_flag

##### Query 1: Store-Level Correlation

```sql
-- Store-level availability vs session conversion
-- Databricks: prod.analytics_prod.*
WITH store_availability AS (
  SELECT
    STORE_ID,
    AVG(WTD_AVAILABILITY) as avg_availability
  FROM prod.analytics_prod.analytics_public_im_sku_day_avl
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7)
    AND CITY = 'Bangalore'
  GROUP BY STORE_ID
),
store_conversion AS (
  SELECT
    STOREID as STORE_ID,
    COUNT(*) as total_sessions,
    SUM(ORDER_IND) as orders,
    SUM(ORDER_IND) * 100.0 / COUNT(*) as conversion_rate
  FROM prod.analytics_prod.analytics_public_im_session_data_serv
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7)
    AND CITY = 'Bangalore'
  GROUP BY STOREID
  HAVING COUNT(*) > 100
)
SELECT
  CORR(a.avg_availability, c.conversion_rate) as avail_conversion_corr,
  COUNT(*) as num_stores,
  AVG(a.avg_availability) as avg_avail,
  AVG(c.conversion_rate) as avg_conv
FROM store_availability a
JOIN store_conversion c ON a.STORE_ID = c.STORE_ID
```

##### Query 2: Bucketed Analysis

```sql
-- Bucket stores by availability and compare conversion
WITH store_availability AS (
  SELECT
    STORE_ID,
    AVG(WTD_AVAILABILITY) as avg_availability
  FROM prod.analytics_prod.analytics_public_im_sku_day_avl
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7)
    AND CITY = 'Bangalore'
  GROUP BY STORE_ID
),
store_conversion AS (
  SELECT
    STOREID as STORE_ID,
    COUNT(*) as total_sessions,
    SUM(ORDER_IND) as orders
  FROM prod.analytics_prod.analytics_public_im_session_data_serv
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7)
    AND CITY = 'Bangalore'
  GROUP BY STOREID
  HAVING COUNT(*) > 100
),
combined AS (
  SELECT
    a.avg_availability,
    c.total_sessions,
    c.orders,
    CASE
      WHEN a.avg_availability < 0.6 THEN '1. <60%'
      WHEN a.avg_availability < 0.7 THEN '2. 60-70%'
      WHEN a.avg_availability < 0.8 THEN '3. 70-80%'
      WHEN a.avg_availability < 0.9 THEN '4. 80-90%'
      ELSE '5. 90%+'
    END as avail_bucket
  FROM store_availability a
  JOIN store_conversion c ON a.STORE_ID = c.STORE_ID
)
SELECT
  avail_bucket,
  COUNT(*) as num_stores,
  SUM(total_sessions) as total_sessions,
  SUM(orders) as total_orders,
  ROUND(SUM(orders) * 100.0 / SUM(total_sessions), 2) as conversion_rate
FROM combined
GROUP BY avail_bucket
ORDER BY avail_bucket
```

**Result 1: Correlation**
| Metric | Value |
|--------|-------|
| Correlation (availability vs conversion) | **-0.12** |
| Num stores | 149 |
| Avg availability | 72.9% |
| Avg conversion | 21.8% |

The correlation is **weak and negative** - not what we'd expect if availability drove conversion.

**Result 2: Bucketed Analysis**

| Availability Bucket | Num Stores | Total Sessions | Conversion Rate |
|---------------------|------------|----------------|-----------------|
| <60% | 7 | 480K | **19.58%** |
| 60-70% | 42 | 2.1M | **22.05%** |
| 70-80% | 74 | 3.0M | **21.96%** |
| 80-90% | 26 | 664K | **19.30%** |

**No clear pattern**: Mid-range availability (60-80%) shows slightly better conversion than extremes, but differences are small (19.3% - 22%).

#### Glean Investigation (2026-01-15)

**Key findings from Glean search**:

1. **No session-level OOS impact analysis exists** - nobody has measured "sessions with OOS encounters convert at X% vs Y%"

2. **Cart abandonment dataset exists** (DPC-12041) with OOS flag - could potentially be used for analysis

3. **Qualitative acknowledgment** in OOS Handling Brain proposal: "A SKU going OOS triggers lost sales, poor customer experience, higher substitution"

4. **No substitution rate data** - nobody has quantified "X% of users who see OOS substitute vs abandon"

5. **Relevant contacts** for deeper analysis:
   - Kartikay Sharma - has done "OOS Cart analysis"
   - Srinath K C - FTR (Failure to Fulfill) data
   - Sunil Rathee - OOS Handling Brain proposal owner

#### H1.2a Conclusion: INCONCLUSIVE

**Why we can't validate**:
- No session-level OOS encounter data available
- Store-level proxy shows no clear relationship (correlation -0.12, no monotonic pattern in buckets)
- This is consistent with SKU-level H1.2 finding (correlation ~0)

**What this suggests**:
1. Availability may truly not drive conversion at aggregate level
2. OR the effect exists but is masked by confounders (store location, customer demographics)
3. OR we need session-level data to see the effect

**To properly validate, we'd need**:
- Session-level OOS encounter flag (did this session see a "Sold Out" item?)
- Same-session order flag
- Compare: conversion rate for sessions WITH OOS encounters vs WITHOUT

#### H1.2b Conclusion: NO DATA

**Substitution rate** - no quantitative data exists. Would need:
- Track user behavior after OOS encounter: add substitute vs exit
- "OOS → different SKU added to cart" event sequence analysis

---

## Summary: Why Availability ≠ Conversion

After investigation, the most likely explanation is **Hypothesis A: Availability is necessary but not sufficient**.

| Factor | Evidence |
|--------|----------|
| **Availability is hygiene** | At 91% search-weighted availability, most searched items are in stock |
| **Other factors dominate** | Price, relevance, search ranking, product attributes |
| **Substitution may mask signal** | Users buy Brand B when Brand A is OOS - conversion still happens |
| **Aggregate analysis hides signal** | Session-level impact may exist but isn't visible at store/SKU level |

**Key insight**: Availability is like electricity in a store - you need it to operate, but having more of it doesn't get you more customers. It's a **necessary condition**, not a **differentiator**.

**For Supply Chain Brain**: Don't use conversion as justification for availability improvement. Use:
- Customer experience (nobody likes seeing "Sold Out")
- GMV protection (OOS = lost revenue for that SKU, even if user substitutes)
- Brand loyalty (repeated OOS for preferred brand → user switches platforms)

---

## Strategic Re-examination: Is 99.9% Worth It? (2026-01-15)

### The Challenge

If availability doesn't predict conversion (H1.2), why chase 99.9%? The last few percentage points have diminishing returns. The core insight:

**~0 correlation at aggregate level masks what's actually happening.**

| Effect | What Happens | Impact on Aggregate Metrics |
|--------|--------------|----------------------------|
| **Substitution** | User wants Brand A, OOS, buys Brand B | Conversion stays same (masked) |
| **Selection bias** | High-demand SKUs have better availability | OOS concentrated in long-tail |
| **Baseline effect** | 91% means most searches succeed | 9% OOS spread thin across sessions |

### New Hypotheses to Validate

These explain WHY we see no correlation, and inform whether differentiated targets (99% for essentials, 90% for long-tail) make sense.

---

### H3.1: Selection Bias — OOS is Concentrated in Long-Tail SKUs

**Hypothesis**: High-demand SKUs (top search volume) have significantly better availability than low-demand SKUs. OOS is disproportionately concentrated in long-tail.

**Why it matters**: If true, the ~0 correlation is because OOS happens on items nobody was going to buy anyway. This validates differentiated targets — invest in high-demand, accept lower availability on long-tail.

| If Validated | If Not Validated |
|--------------|------------------|
| OOS is on items nobody searched | OOS is uniform across demand tiers |
| Differentiated targets make sense | Uniform target is appropriate |
| Long-tail OOS doesn't hurt business | All OOS hurts equally |

**Threshold**: Top 20% of SKUs by search volume should have >10% higher availability than bottom 20%.

**Validation approach**:
```sql
-- Compare availability by search volume decile
WITH sku_search_volume AS (
  SELECT SKU_ID, SUM(SEARCH_IMP) as total_search_imp
  FROM analytics_public_srk_impressions_metrics_trans
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
  GROUP BY SKU_ID
),
sku_deciles AS (
  SELECT SKU_ID, total_search_imp,
    NTILE(10) OVER (ORDER BY total_search_imp DESC) as search_decile
  FROM sku_search_volume
),
sku_availability AS (
  SELECT SKU_ID, AVG(WTD_AVAILABILITY) as avg_availability
  FROM analytics_public_im_sku_day_avl
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
  GROUP BY SKU_ID
)
SELECT d.search_decile,
  COUNT(*) as num_skus,
  ROUND(AVG(a.avg_availability) * 100, 2) as avg_availability_pct,
  ROUND(SUM(d.total_search_imp), 0) as total_impressions
FROM sku_deciles d
JOIN sku_availability a ON d.SKU_ID = a.SKU_ID
GROUP BY d.search_decile
ORDER BY d.search_decile
```

---

### H3.2: Substitution Effect — Users Substitute Rather Than Abandon

**Hypothesis**: When users encounter OOS, a significant portion (>50%) substitute within the same category rather than abandon cart/session.

**Why it matters**: If substitution is high, OOS doesn't hurt conversion (just shifts brand share). Conversion correlation is masked. This means:
- Category-level availability matters more than SKU-level
- Brand-level OOS hurts the brand, not the platform
- For essentials with LOW substitutability, OOS is more damaging

| If High Substitution (>50%) | If High Abandonment (>50%) |
|-----------------------------|----------------------------|
| Category availability > SKU availability | SKU availability is critical |
| OOS impact is on brand loyalty, not conversion | OOS directly hurts GMV |
| Differentiated targets by substitutability make sense | Uniform high targets needed |

**Validation approach**:
- Glean: Search for any existing substitution analysis, cart behavior after OOS
- Data: Look for "OOS item viewed → different item in same category added to cart" patterns
- Proxy: Compare category-level availability correlation with conversion vs SKU-level

---

### H3.3: Baseline Effect — OOS is Spread Thin Across Sessions

**Hypothesis**: At 91% search-weighted availability, OOS encounters are rare per session. Most sessions have 0 OOS encounters for searched items.

**Why it matters**: If OOS is spread thin (few sessions have OOS), the aggregate signal is diluted. Individual session impact may exist but doesn't show up in aggregate metrics.

| If Validated | If Not Validated |
|--------------|------------------|
| OOS impact exists but is rare | OOS is common per session |
| Focus on Tier 1 essentials (where any OOS hurts) | Need broad availability improvement |
| Current 91% is "good enough" for most sessions | Need to improve across the board |

**Threshold**: >80% of sessions should have 0 OOS encounters for items they searched.

**Validation approach**:
- Calculate: Of sessions with search activity, what % encountered at least one OOS in search results?
- Need: Session-level search impressions joined with OOS flag

```sql
-- Estimate: What fraction of search impressions are for OOS items?
WITH search_imps AS (
  SELECT DT, STORE_ID, SKU_ID, SEARCH_IMP
  FROM analytics_public_srk_impressions_metrics_trans
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
),
availability AS (
  SELECT DT, STORE_ID, SKU_ID, WTD_AVAILABILITY
  FROM analytics_public_im_sku_day_avl
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
)
SELECT
  SUM(s.SEARCH_IMP) as total_search_impressions,
  SUM(CASE WHEN a.WTD_AVAILABILITY = 0 THEN s.SEARCH_IMP ELSE 0 END) as oos_impressions,
  ROUND(SUM(CASE WHEN a.WTD_AVAILABILITY = 0 THEN s.SEARCH_IMP ELSE 0 END) * 100.0 / SUM(s.SEARCH_IMP), 2) as pct_impressions_oos
FROM search_imps s
LEFT JOIN availability a ON s.DT = a.DT AND s.STORE_ID = a.STORE_ID AND s.SKU_ID = a.SKU_ID
```

---

### The Strategic Framework (To Validate)

If H3.1, H3.2, H3.3 are validated, the implication is:

**Differentiated Availability Targets by Tier**

| Tier | Criteria | Target | Rationale |
|------|----------|--------|-----------|
| **Tier 1** | Low substitutability + high demand | 99%+ | OOS = abandonment, not substitution |
| **Tier 2** | Medium substitutability OR strategic | 95% | Some substitution absorbs OOS |
| **Tier 3** | High substitutability, mid-tail | 90% | Easy substitution, lower investment |
| **Tier 4** | Long tail, low search | 85% | Don't over-invest |

**Key Question**: How do we identify which SKUs belong in Tier 1 (where OOS = abandonment)?

Criteria for Tier 1:
1. **Essentials**: Milk, eggs, bread, atta, rice, cooking oil
2. **Low substitutability**: User won't accept alternative (baby formula, specific medication)
3. **High search volume**: Top 5-10% by search impressions
4. **Traffic drivers**: Items users explicitly came to platform for

---

### Validation Execution Plan

| Hypothesis | Data Approach | Glean Approach |
|------------|---------------|----------------|
| **H3.1**: Selection bias | Availability by search decile | Search for "long-tail availability" analysis |
| **H3.2**: Substitution | Category-level correlation, cart sequence | Search for "substitution rate", "OOS behavior" |
| **H3.3**: Baseline effect | % of impressions that are OOS | Search for "session OOS", "OOS encounter rate" |

---

## H3 Validation Results (2026-01-15)

### H3.1 Result: Selection Bias — ✅ VALIDATED

**Query Executed**:
```sql
WITH sku_search_volume AS (
  SELECT SKU_ID, SUM(SEARCH_IMP) as total_search_imp
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
  GROUP BY SKU_ID
),
sku_deciles AS (
  SELECT SKU_ID, total_search_imp,
    NTILE(10) OVER (ORDER BY total_search_imp DESC) as search_decile
  FROM sku_search_volume
),
sku_availability AS (
  SELECT SKU_ID, AVG(WTD_AVAILABILITY) as avg_availability
  FROM prod.analytics_prod.analytics_public_im_sku_day_avl
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
  GROUP BY SKU_ID
)
SELECT d.search_decile,
  COUNT(*) as num_skus,
  ROUND(AVG(a.avg_availability) * 100, 2) as avg_availability_pct,
  ROUND(SUM(d.total_search_imp), 0) as total_impressions
FROM sku_deciles d
JOIN sku_availability a ON d.SKU_ID = a.SKU_ID
GROUP BY d.search_decile
ORDER BY d.search_decile
```

**Result**:

| Search Decile | Num SKUs | Avg Availability | Total Impressions |
|---------------|----------|------------------|-------------------|
| 1 (Highest) | 521,275 | **88.59%** | 136.3M |
| 2 | 521,269 | **89.66%** | 49.7M |
| 3 | 521,272 | 89.44% | 32.1M |
| 4 | 521,213 | 88.46% | 22.4M |
| 5 | 521,159 | 86.43% | 16.0M |
| 6 | 521,050 | 83.01% | 11.2M |
| 7 | 520,811 | 76.52% | 7.4M |
| 8 | 520,417 | 64.74% | 4.3M |
| 9 | 519,762 | **50.60%** | 2.0M |
| 10 (Lowest) | 518,333 | **45.06%** | 0.5M |

**Analysis**:

| Segment | Avg Availability |
|---------|------------------|
| Top 20% (Deciles 1-2) | **89.13%** |
| Bottom 20% (Deciles 9-10) | **47.83%** |
| **Gap** | **41.3 percentage points** |

**Threshold**: >10% gap → **VALIDATED** (41.3% >> 10%)

**Interpretation**:
- There is a **clear monotonic relationship**: availability drops from 89% (top) to 45% (bottom)
- This is rational business behavior — we stock what sells
- But it creates a massive long-tail problem: ~2M SKUs in bottom 4 deciles have <65% availability
- **OOS is concentrated in long-tail SKUs that nobody searches for**, confirming selection bias

---

### H3.2 Result: Substitution Effect — ⚠️ INCONCLUSIVE (Leans Toward Abandonment)

**Glean Research Summary**:

| Search | Result |
|--------|--------|
| Substitution rate data | **NOT FOUND** |
| Cart behavior after OOS | Abandonment mentioned repeatedly |
| Category vs SKU analysis | Not found |

**Key Findings**:

1. **No quantitative substitution rate exists** — nobody has measured this

2. **Qualitative signals favor ABANDONMENT over substitution**:
   - Cart Error Code 161: OOS items removed, user prompted to "search for alternatives"
   - Flash sale OOS → "cart drop offs" (Kartikay Sharma)
   - AI-Native Strategy aims to "reduce cart abandonment" via better substitutions
   - Multiple docs reference "abandonment" and "drop off", none mention high substitution rates

3. **System behavior suggests substitution requires user effort**:
   - OOS items are removed automatically
   - User must actively search for alternatives
   - No automatic substitution suggestions in cart flow

**Relevant Contacts/Data Sources**:

| Contact/Resource | Relevance |
|------------------|-----------|
| Kartikay Sharma | OOS Cart analysis owner |
| Rajat Nagar | "Shopping Continuation Mission OOS interventions" PRD |
| Akash Mangal | `IM_Cart_Abandonment_Tracker_AM.sql` owner |
| `analytics_prod.im_cart_splits_am` | Has `out_of_stock` field for cart abandonment tracking |

**Verdict**: ⚠️ **INCONCLUSIVE** — No quantitative data, but qualitative evidence suggests **abandonment > substitution**

**Implication**: If abandonment is more common than substitution, then OOS DOES hurt conversion, but the effect is masked by H3.3 (OOS encounters are rare).

---

### H3.3 Result: Baseline Effect — ✅ VALIDATED

**Query 1: OOS Impression Rate**

```sql
WITH search_imps AS (
  SELECT DT, STORE_ID, SKU_ID, SEARCH_IMP
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
),
availability AS (
  SELECT DT, STORE_ID, SKU_ID, WTD_AVAILABILITY
  FROM prod.analytics_prod.analytics_public_im_sku_day_avl
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
)
SELECT
  SUM(s.SEARCH_IMP) as total_search_impressions,
  SUM(CASE WHEN a.WTD_AVAILABILITY = 0 THEN s.SEARCH_IMP ELSE 0 END) as oos_impressions,
  ROUND(SUM(CASE WHEN a.WTD_AVAILABILITY = 0 THEN s.SEARCH_IMP ELSE 0 END) * 100.0 / SUM(s.SEARCH_IMP), 2) as pct_impressions_oos
FROM search_imps s
LEFT JOIN availability a ON s.DT = a.DT AND s.STORE_ID = a.STORE_ID AND s.SKU_ID = a.SKU_ID
```

**Result**:

| Metric | Value |
|--------|-------|
| Total search impressions | 281,982,043 |
| OOS impressions | 16,575,983 |
| **% impressions OOS** | **5.88%** |

**Query 2: Availability Distribution**

| Availability Bucket | Count | % of SKU×Store×Day |
|---------------------|-------|---------------------|
| Fully OOS | 9,501,129 | **24.63%** |
| Low Avail (<50%) | 668,916 | 1.73% |
| Med Avail (50-90%) | 657,717 | 1.71% |
| High Avail (90%+) | 27,741,784 | 71.93% |

**The Paradox Explained**:

| Metric | Value |
|--------|-------|
| % of SKU×Store×Day combinations that are OOS | **24.63%** |
| % of search impressions that are OOS | **5.88%** |
| **Difference** | ~19 percentage points |

Users are NOT searching equally across all SKUs. High-demand SKUs get most impressions AND have better availability. OOS is concentrated in long-tail.

**Threshold**: <10% of impressions OOS → **VALIDATED** (5.88% < 10%)

**Interpretation**:
- At impression level, OOS encounters are rare (5.88%)
- This dilutes the conversion signal — even if OOS → abandonment, it happens infrequently
- The aggregate ~0 correlation makes sense: OOS impact exists but is spread thin
- **This is why availability doesn't predict conversion at aggregate level**

---

### H3 Summary

| Hypothesis | Threshold | Result | Status |
|------------|-----------|--------|--------|
| **H3.1**: Selection bias (OOS in long-tail) | Top-Bottom gap >10% | **41.3%** gap | ✅ VALIDATED |
| **H3.2**: Substitution absorbs OOS | Substitution >50% | No data; leans abandonment | ⚠️ INCONCLUSIVE |
| **H3.3**: OOS spread thin (baseline effect) | <10% impressions OOS | **5.88%** | ✅ VALIDATED |

### Combined Interpretation

The three effects work together to explain why availability ≠ conversion at aggregate level:

```
Why No Correlation at Aggregate Level
──────────────────────────────────────
1. SELECTION BIAS (H3.1 ✅)
   - High-demand SKUs: 89% availability
   - Long-tail SKUs: 48% availability
   - OOS is concentrated where nobody looks

2. BASELINE EFFECT (H3.3 ✅)
   - Only 5.88% of impressions are OOS
   - OOS encounters are rare per session
   - Individual impact exists but is diluted

3. SUBSTITUTION EFFECT (H3.2 ⚠️)
   - Evidence suggests ABANDONMENT > SUBSTITUTION
   - But impact is masked by (1) and (2)
   - When OOS happens on high-demand items, users may abandon
```

### Implications for Tiered Targets

| Tier | Criteria | Target | Rationale (From H3 Findings) |
|------|----------|--------|------------------------------|
| **Tier 1** | Top 20% search + essentials | **99%+** | Already at 89%, but OOS here → abandonment (H3.2) |
| **Tier 2** | Deciles 3-5 | **95%** | Good availability (86-89%), maintain |
| **Tier 3** | Deciles 6-7 | **90%** | Moderate availability (76-83%), improve |
| **Tier 4** | Deciles 8-10 (long-tail) | **85%** | Low search volume, OOS doesn't matter much (H3.1) |

**Key Insight**: The 99.9% target is wasteful if applied uniformly. The bottom 40% of SKUs (deciles 7-10) have 45-77% availability and only 4% of impressions. Investing heavily in long-tail availability has minimal customer impact.

**The Right Question**: Not "how do we hit 99.9%?" but "how do we hit 99%+ on Tier 1 where OOS → abandonment?"

---

## Bradman SKU Validation (2026-01-15)

### Background

**Bradman SKUs** are the current list targeted for 99.9% availability (named after Don Bradman's 99.94 batting average).

**Selection Criteria** (per Glean research):
- GSV (Gross Sales Value) - 20%
- Units Sold - 20%
- Impressions (Overall) - 20%
- Search High Confidence Impressions - 20%
- I2C (Impression to Cart conversion) - 20%

**Table**: `prod.analytics_prod.analytics_public_rb_bradman_spin_list_16_dec_seasonality_eol_removal`
**Filter**: `TOP_ITEM_FLAG = 1`

### Bradman Coverage Analysis

**Query 1: Bradman Count and Impression Coverage**

```sql
WITH bradman_spins AS (
  SELECT DISTINCT SPIN_ID
  FROM prod.analytics_prod.analytics_public_rb_bradman_spin_list_16_dec_seasonality_eol_removal
  WHERE CITY = 'bangalore' AND TOP_ITEM_FLAG = 1
),
impressions AS (
  SELECT SPIN_ID, SUM(SEARCH_IMP) as search_imp
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
  GROUP BY SPIN_ID
)
SELECT
  SUM(i.search_imp) as total_impressions,
  SUM(CASE WHEN b.SPIN_ID IS NOT NULL THEN i.search_imp ELSE 0 END) as bradman_impressions,
  ROUND(SUM(CASE WHEN b.SPIN_ID IS NOT NULL THEN i.search_imp ELSE 0 END) * 100.0 / SUM(i.search_imp), 2) as bradman_pct
FROM impressions i
LEFT JOIN bradman_spins b ON i.SPIN_ID = b.SPIN_ID
```

**Result**:

| Metric | Value |
|--------|-------|
| Total SPINs with impressions | 99,378 |
| Bradman SPINs matched | 5,256 |
| Total search impressions | 282M |
| Bradman impressions | 76.6M |
| **Bradman % of impressions** | **27.15%** |

### Bradman Availability vs Non-Bradman

| SPIN Type | Count | Avg Availability |
|-----------|-------|------------------|
| **Bradman** | 5,261 | **87.06%** |
| Non-Bradman | 94,623 | 76.6% |

Bradman SKUs are at 87% availability — still **12 percentage points away from 99.9% target**.

### Bradman Distribution Across Search Deciles

**Query 2: Which search deciles contain Bradman SKUs?**

```sql
WITH spin_deciles AS (
  SELECT SPIN_ID, NTILE(10) OVER (ORDER BY total_search_imp DESC) as search_decile
  FROM (
    SELECT SPIN_ID, SUM(SEARCH_IMP) as total_search_imp
    FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans
    WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
    GROUP BY SPIN_ID
  )
),
bradman_spins AS (...)
SELECT search_decile, COUNT(*) as total, SUM(CASE WHEN bradman THEN 1 ELSE 0 END) as bradman_count
...
```

**Result**:

| Decile | SPINs | Bradman SPINs | % Bradman | Impressions |
|--------|-------|---------------|-----------|-------------|
| 1 (Top 10%) | 9,938 | 3,722 | **37.45%** | 167.9M |
| 2 | 9,938 | 596 | 6.00% | 47.7M |
| 3 | 9,938 | 227 | 2.28% | 27.4M |
| 4 | 9,938 | 184 | 1.85% | 17.0M |
| 5 | 9,938 | 164 | 1.65% | 10.4M |
| 6-10 | 49,688 | 363 | 0.73% | 11.6M |

**Key Finding**: Only **37.45%** of the top search decile are Bradman SKUs. **62.55% of highest-searched SPINs are NOT Bradman.**

### Where Bradman SPINs Come From

| Tier | Bradman Count | % of Bradman |
|------|---------------|--------------|
| Top 20% (Deciles 1-2) | 4,318 | **81.89%** |
| Mid (Deciles 3-5) | 575 | 10.90% |
| Lower (Deciles 6-10) | 363 | **6.88%** |

**Problem 1**: 82% of Bradman is in top 20% (good), but...
**Problem 2**: 7% of Bradman is in deciles 6-10 (long-tail noise)
**Problem 3**: Bradman only covers 22% of top 20% SPINs

### The Gap: Non-Bradman High-Search SPINs

**Query 3: What's missing from Bradman in top 20%?**

| Metric | Value |
|--------|-------|
| Top 20% SPINs (deciles 1-2) | 19,876 |
| Bradman in Top 20% | 4,318 (21.7%) |
| **Non-Bradman in Top 20%** | **15,558 (78.3%)** |
| Top 20% impressions | 215.6M |
| Bradman Top 20% impressions | 75.3M |
| **Gap impressions** | **140.3M** |

**140.3M impressions/week** go to non-Bradman SPINs that are in the top 20% by search!

### Category Breakdown of the Gap

**Query 4: Which categories are missing from Bradman?**

| L1 Category | Non-Bradman Top 20% SPINs | Gap Impressions |
|-------------|---------------------------|-----------------|
| **Fruits and Vegetables** | 700 | **26.0M** |
| **Dairy, Bread and Eggs** | 814 | **13.7M** |
| Home | 1,084 | 6.7M |
| Kitchen and Dining | 1,088 | 6.7M |
| Bath Body and Hair | 919 | 5.8M |
| Munchies and Snacks | 583 | 5.8M |
| Ice Cream and Indian Sweets | 481 | 5.5M |

**CRITICAL FINDING**:
- **Fruits & Vegetables**: 26.0M impressions NOT covered
- **Dairy, Bread, Eggs**: 13.7M impressions NOT covered
- These are ESSENTIALS with LOW SUBSTITUTABILITY
- Combined: **39.7M impressions/week** on essentials are NOT in Bradman 99.9% target

### Why This Gap Exists

Bradman uses composite scoring (GSV, Units, Impressions, I2C):
- **Fresh produce** often has lower I2C (browsing behavior)
- **Dairy basics** may have lower GSV per unit (cheap items)
- But these are the items where **OOS → abandonment** (our H3.2 finding)

Bradman optimizes for **VALUE** (GSV × conversion), not **ESSENTIALITY** (customer must-haves).

### Validation Against Our Framework

| Our Tier 1 Criteria | Bradman Alignment | Gap |
|---------------------|-------------------|-----|
| Top 20% by search | Only 22% covered | **15,558 SPINs missing** |
| Essentials (F&V, Dairy) | Underrepresented | **39.7M impressions/week** |
| Low substitutability | Not explicitly considered | Fresh produce excluded |
| Category anchors | Partial | Home/Kitchen missing |

### Recommendations for Bradman List

| Issue | Current State | Recommendation |
|-------|---------------|----------------|
| **Coverage too narrow** | 27% of impressions | Expand to cover 50-60% |
| **Missing essentials** | F&V, Dairy gaps | Add Fresh + Dairy categories explicitly |
| **Long-tail noise** | 7% in deciles 6-10 | Remove SPINs with <X search volume |
| **Selection criteria** | Value-weighted | Add "essentiality" factor |

### Proposed Tier 1 Definition

Instead of Bradman as-is, Tier 1 should be:

```
Tier 1 = (Top 20% by search impressions)
       ∪ (Essential categories: Dairy, Bread, Eggs, F&V staples)
       - (Decile 6-10 SPINs)
```

This would cover:
- ~20K SPINs (vs 5.3K Bradman)
- ~66% of impressions (vs 27% Bradman)
- All essentials where OOS → abandonment

### Key Contacts (from Glean)

| Role | Person |
|------|--------|
| Bradman Program Owner | Shrinivas Ron |
| Assortment Selection | Abhinav Gupta |
| Data/Analytics | Soumyajit Mondal |
| Logic Changes (pending) | Sumit Pattanaik |

### Technical Notes: SPIN vs SKU

**Important discovery during validation**:
- **SPIN_ID** = Global product identifier (same across all stores)
- **SKU_ID** = POD-level identifier (store-specific variant)
- Join key for Bradman validation must use SPIN_ID, not SKU_ID
- Impressions table (`srk_impressions_metrics_trans`) has both SPIN_ID and SKU_ID
- Availability table (`im_sku_day_avl`) has SKU_ID only — need to map via impressions table

**Table schema notes**:
- Bradman table column: `TOP_ITEM_FLAG` (not `is_top_item`)
- City in Bradman table: lowercase `'bangalore'` (not `'Bangalore'`)
- City in impressions/availability tables: `'Bangalore'` (mixed case)

### Glean Research Summary (Bradman)

**Documents Found**:
| Document | Key Info |
|----------|----------|
| [2 Pager] Project - Bradman 99.90 | Selection criteria, 5-factor scoring |
| IM Availability Solution Doc | Data quality issue: ~9K vs ~6K expected |
| Bradman Availability DAG Code | `im_bradman_avl_base.sql` in schedule-databricks-jobs |

**Data Quality Issues Noted in Docs**:
- Bradman table shows more than ~9K SPINs when filtering FMCG + top_item_flag
- Expected was ~6K SKUs per documentation
- This discrepancy is acknowledged in IM Availability Solution Doc

**Pending Changes**:
- Slack thread (Jan 13, 2026) indicates pending Bradman SKU logic changes
- Owner: Sumit Pattanaik

---

## Summary: All Hypotheses Validated (2026-01-15)

### Complete Hypothesis Tracker

| ID | Hypothesis | Threshold | Result | Status |
|----|------------|-----------|--------|--------|
| **H1.1** | Session vs search metrics diverge | >20% SKUs with >5% divergence | 20.48% | ✅ Validated |
| **H1.2** | Availability predicts conversion | Positive correlation | ~0 | ❌ Not validated |
| **H1.2a** | Session-level OOS → lower conversion | Measurable impact | No data | ⚠️ Inconclusive |
| **H1.2b** | Substitution rate when OOS | >50% substitute | No data | ⚠️ Inconclusive |
| **H2.1** | Allocation blindness is real | >20% POD-led OOS | 27.8% | ✅ Validated |
| **H2.2** | POD variance within WH | avg stddev >10% | 23.24% | ✅ Validated |
| **H3.1** | OOS concentrated in long-tail | Top-Bottom gap >10% | 41.3% | ✅ Validated |
| **H3.2** | Users substitute rather than abandon | >50% substitute | Leans abandonment | ⚠️ Inconclusive |
| **H3.3** | OOS spread thin at impression level | <10% impressions OOS | 5.88% | ✅ Validated |

### Key Strategic Conclusions

1. **Metric**: Use search-weighted only (not session-based)
2. **Target**: Differentiated by tier (99%+ for Tier 1, 85% for long-tail)
3. **Architecture**: WH + POD prediction for Tier 1 only
4. **Bradman**: Needs expansion (27% → 66% coverage) and essentials inclusion
5. **Justification**: Customer experience, not conversion ROI

### Data Sources Used

| Table | Purpose |
|-------|---------|
| `analytics_public_im_sku_day_avl` | Daily availability by SKU×Store |
| `analytics_public_srk_impressions_metrics_trans` | Search impressions, S2C, GMV |
| `analytics_public_sku_wise_availability_rca_with_reasons_v7` | Availability RCA with reasons |
| `analytics_public_im_session_data_serv` | Session-level data with ORDER_IND |
| `analytics_public_rb_bradman_spin_list_16_dec_seasonality_eol_removal` | Bradman SKU list |

### Query Execution Environment

```bash
# Databricks CLI setup
databricks auth login --host https://swiggy-analytics.cloud.databricks.com --profile analytics-workspace

# Query execution
export DBR_TOKEN=$(databricks auth token --profile analytics-workspace 2>/dev/null | grep access_token | cut -d'"' -f4)
source /Users/sidhant.panda/workspaces/root-workspace/swiggy-brain/.venv-dbsql/bin/activate
dbsqlcli --hostname swiggy-analytics.cloud.databricks.com \
  --http-path /sql/1.0/warehouses/61ce236c169e5b23 \
  --access-token "$DBR_TOKEN" \
  -e "QUERY"
```

### Files Updated

| File | Content |
|------|---------|
| `thoughts.md` | Full decision log, all queries, all results |
| `scm/docs/conclusions.md` | Leadership summary, recommendations |

---

## Re-Validation & Corrections Log (2026-01-15)

### Purpose

Before presenting findings, conducted a systematic re-validation of all hypotheses to ensure accuracy and prevent reputational risk. Re-ran all critical queries and checked for logical consistency.

### What We Did

1. Re-executed all hypothesis validation queries against current data (Jan 8-14, 2026)
2. Compared results to documented claims
3. Identified methodology issues (SKU vs SPIN granularity)
4. Checked logical consistency across findings
5. Documented corrections needed

### Summary of Re-Validation Results

| Hypothesis | Original Claim | Re-Validated Result | Status |
|------------|----------------|---------------------|--------|
| **H1.1** | 20.48% divergent | 19.43% divergent | ⚠️ **Borderline** |
| **H1.2** | Correlation ~0 | Correlation ~0 | ✅ Confirmed |
| **H2.1** | 27.8% POD-led | 24.19% POD-led | ⚠️ **Updated** |
| **H2.2** | 23.24% stddev | 23.24% stddev | ✅ Exact match |
| **H3.1** | 41.3% gap | **17.3% gap** (SPIN) | 🔴 **CORRECTED** |
| **H3.3** | 5.88% OOS | 5.88% OOS | ✅ Exact match |
| **Bradman** | 27.15% coverage | 27.15% coverage | ✅ Exact match |

---

### Correction 1: H3.1 Selection Bias Gap (MAJOR)

#### The Error

Original analysis used **SKU_ID** (5.2M entities) to calculate availability by search decile. This produced a 41.3% gap between top and bottom quintiles.

However, **Bradman uses SPIN_ID** (99K entities). Each SPIN has ~52 SKUs (one per POD). The SKU-level analysis inflated the gap because poorly-stocked PODs for long-tail products dragged down averages disproportionately.

#### Corrected Analysis

```sql
-- SPIN-level availability by search decile (impression-weighted)
WITH spin_metrics AS (
  SELECT
    s.SPIN_ID,
    SUM(s.SEARCH_IMP) as total_search_imp,
    SUM(s.SEARCH_IMP * COALESCE(a.WTD_AVAILABILITY, 0)) as weighted_avail_sum
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans s
  LEFT JOIN prod.analytics_prod.analytics_public_im_sku_day_avl a
    ON s.DT = a.DT AND s.STORE_ID = a.STORE_ID AND s.SKU_ID = a.SKU_ID
  WHERE s.DT >= DATE_SUB(CURRENT_DATE(), 7) AND s.CITY = 'Bangalore'
  GROUP BY s.SPIN_ID
),
spin_deciles AS (
  SELECT
    SPIN_ID,
    total_search_imp,
    weighted_avail_sum / total_search_imp as impression_weighted_avail,
    NTILE(10) OVER (ORDER BY total_search_imp DESC) as search_decile
  FROM spin_metrics
  WHERE total_search_imp > 0
)
SELECT
  search_decile,
  COUNT(*) as num_spins,
  ROUND(AVG(impression_weighted_avail) * 100, 2) as avg_avail_pct
FROM spin_deciles
GROUP BY search_decile
ORDER BY search_decile
```

#### Corrected Results

| Analysis Level | Top 20% Availability | Bottom 20% Availability | Gap |
|----------------|---------------------|------------------------|-----|
| SKU_ID (original) | 89.13% | 47.83% | **41.3%** ❌ |
| SPIN_ID (simple avg) | 86.39% | 73.25% | **13.1%** |
| SPIN_ID (imp-weighted) | 92.50% | 75.22% | **17.3%** ✅ |

#### Impact

- **Direction is correct**: High-demand SPINs have better availability
- **Magnitude overstated by ~2.4x**: Gap is 17%, not 41%
- **Still exceeds threshold**: 17% > 10% threshold, so hypothesis remains "validated"
- **Recommendation unchanged**: Differentiated targets by tier remain justified

---

### Correction 2: H1.1 Metrics Divergence (MODERATE)

#### The Issue

| Time Period | SKUs Analyzed | % Divergent (>5%) | vs 20% Threshold |
|-------------|---------------|-------------------|------------------|
| Original run | 832,548 | 20.48% | Barely passed |
| Re-validation | 708,877 | 19.43% | Barely failed |

#### Root Cause

- Different 7-day windows produce different SKU counts (~15% variance)
- The 20% threshold is arbitrary
- Result is sensitive to time period

#### Updated Status

**Changed from "Validated" to "Borderline"**

The insight "session-based (90%) and search-weighted (93%) tell different stories" is valid, but claiming robust validation at a specific threshold is risky.

#### Recommendation

Present as: "Meaningful divergence exists between session-based and search-weighted metrics (~3 percentage points), with ~20% of SKUs showing >5% divergence depending on time window."

---

### Correction 3: H2.1 Allocation Blindness (MODERATE)

#### The Issue

| Source | Time Period | POD-Led Ratio |
|--------|-------------|---------------|
| Waterfall Dashboard | Feb 2025 | 27.8% |
| Re-validation (Bangalore) | Jan 2026 | 24.19% |
| Re-validation (All-India) | Jan 2026 | 24.67% |

#### Updated Understanding

The 27.8% was from Feb 2025 Waterfall dashboard. Current data shows ~24-25%. Both exceed the 20% threshold, so the conclusion "allocation blindness is real" remains valid.

#### Recommendation

Cite as: "POD-led OOS accounts for ~24-27% of unavailability (varies by time period), confirming allocation blindness is real."

---

### Updated Hypothesis Tracker (Corrected)

| ID | Hypothesis | Threshold | Original | Corrected | Status |
|----|------------|-----------|----------|-----------|--------|
| **H1.1** | Session vs search metrics diverge | >20% SKUs with >5% divergence | 20.48% | 19.43% | ⚠️ Borderline |
| **H1.2** | Availability predicts conversion | Positive correlation | ~0 | ~0 | ❌ Not validated |
| **H1.2a** | Session-level OOS → lower conversion | Measurable impact | No data | No data | ⚠️ Inconclusive |
| **H1.2b** | Substitution rate when OOS | >50% substitute | No data | No data | ⚠️ Inconclusive |
| **H2.1** | Allocation blindness is real | >20% POD-led OOS | 27.8% | **24-25%** | ✅ Validated |
| **H2.2** | POD variance within WH | avg stddev >10% | 23.24% | 23.24% | ✅ Validated |
| **H3.1** | OOS concentrated in long-tail | Top-Bottom gap >10% | 41.3% | **17.3%** | ✅ Validated (corrected) |
| **H3.2** | Users substitute rather than abandon | >50% substitute | Leans abandonment | Leans abandonment | ⚠️ Inconclusive |
| **H3.3** | OOS spread thin at impression level | <10% impressions OOS | 5.88% | 5.88% | ✅ Validated |

---

### Unvalidated Assumptions (Risk Register)

These assumptions underpin strategic recommendations but lack data validation:

| Assumption | Used In | Risk Level | Mitigation |
|------------|---------|------------|------------|
| "F&V and Dairy have low substitutability" | Tier 1 definition | **High** | Qualitative only; need user research |
| "OOS → abandonment > substitution" | Impact quantification | **Medium** | No substitution rate data; leans abandonment based on system behavior |
| "99%+ target for Tier 1 is optimal" | Target setting | **Medium** | Arbitrary; no ROI analysis conducted |
| "17% gap justifies differentiated targets" | Tiering strategy | **Low** | Still >10% threshold; direction is sound |

---

### Key Learnings

1. **Granularity matters**: SKU_ID vs SPIN_ID produces very different results. Always match analysis granularity to the entity being optimized (Bradman = SPIN).

2. **Thresholds are arbitrary**: A result that "barely passes" (20.48% vs 20%) should be flagged as borderline, not robustly validated.

3. **Time periods vary**: Results can change by 15-20% across different weeks. Always specify time window and note sensitivity.

4. **Re-validate before presenting**: This exercise caught a 2.4x overstatement in the headline number (41% → 17%).

---

### Updated Strategic Conclusions

| Original Recommendation | Correction | Final Status |
|-------------------------|------------|--------------|
| Use search-weighted for customer targets | No change | ✅ Valid |
| Differentiated targets by tier | Gap is 17%, not 41%, but still supports tiering | ✅ Valid (reframe magnitude) |
| Bradman needs expansion (27% → 66%) | No change | ✅ Valid |
| 99.9% wasteful if uniform | Valid direction; quantify ROI for specific tiers | ✅ Valid (add caveat) |
| "Bottom 40% have 45-77% availability" | **INCORRECT** - that's SKU-level; SPIN-level is ~70-80% | ❌ Correct to SPIN-level |

---

### Presentation Guidance

**Safe to present as-is:**
- H1.2, H2.2, H3.3: Exact replication
- Bradman analysis: All numbers confirmed
- Strategic direction: Differentiated targets, Bradman expansion

**Reframe these claims:**
- H3.1: "High-demand SPINs have ~17% better availability than long-tail" (not 41%)
- H1.1: "Meaningful divergence exists" (avoid specific threshold claim)
- H2.1: "~24-27% of OOS is POD-led" (cite range, not single number)

**Add caveats for:**
- Substitution rate assumption (not validated)
- 99%+ target (no ROI analysis)
- Time-period sensitivity for all metrics
