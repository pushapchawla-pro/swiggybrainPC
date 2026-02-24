# POC-0.1: Simple OOS Prediction Model

---

# Layer 1: TL;DR

## Goal & Scope

Build a **multi-horizon OOS prediction model** to answer: "Will this SKU be OOS at this POD in the next 1-3 days?"

| Aspect | Choice |
|--------|--------|
| Scope | Single POD × Top 20% Bradman FMCG SKUs |
| Horizons | **T+1, T+2, T+3** |
| Execution | **Agentic**: Claude Code orchestrates and executes autonomously, pauses at cycle boundaries for human review |
| Orchestrator | **Claude Code** (this plan is machine-executable) |
| Data Source | Databricks RCA table (14/14 tables verified) |

## Execution Model

**Claude Code is the orchestrator and executor of this plan.** This document is designed to be machine-readable and executed by Claude Code with the following characteristics:

1. **Autonomous Execution**: Claude Code runs iterations, writes code, queries Databricks, trains models, and logs results without human intervention within an inner loop
2. **Structured Checkpoints**: Human review occurs only at inner loop boundaries (every 4 iterations)
3. **Self-Documenting**: Claude Code commits after every iteration and maintains machine-parseable JSON logs
4. **Guardrailed Autonomy**: Hard constraints prevent scope creep, data leakage, and unauthorized strategy changes

The human's role is to review checkpoints, answer questions in `decisions.md`, and approve strategy changes for subsequent inner loops.

## Claude Code Prerequisites

| Tool | Purpose | Setup | Verify |
|------|---------|-------|--------|
| **Databricks** | SQL queries (13/14 tables) | `python scripts/dbr.py login` | `python scripts/dbr.py status` |
| **Snowflake** | Secondary queries (1 table) | `snow sql -c swiggy --client-store-temporary-credential -q "SELECT 1"` | Same command |
| **Glean MCP** | Internal docs, Confluence, Slack | Pre-configured | — |
| **Web Search** | External docs, troubleshooting | Pre-configured | — |

**Pre-flight**: Run all verify commands before Step 1

**If any connector fails**: Document in `errors/error_log.md` and pause for human resolution.

## Success Criteria

| Metric | Target | Notes |
|--------|--------|-------|
| F1 Score T+1 | > 0.60 | Primary metric |
| F1 Score T+2 | > 0.55 | Harder |
| F1 Score T+3 | > 0.50 | Hardest |
| vs. Baseline | > 20% improvement | vs. naive DOH rule |

## Fallback Strategy

**If targets not met after 20 iterations**:
1. Document learnings in `OUTER_LOOP_LEARNINGS.md`
2. Capture what worked, what didn't, and why
3. Archive as exploratory POC - close without proceeding to production
4. Learnings inform future POC design (e.g., more signals, different scope)

This POC is exploratory. Negative results with documented learnings are a valid outcome.

## Key Constraints

- **Temporal Contract**: Features from EOD T → Predict OOS on T+1/T+2/T+3
- **No Leakage**: Cannot use T's AVAILABILITY to predict T+1 (it's the target)
- **OOS Definition**: AVAILABILITY < 95%

## Checkpoint Schedule

| Checkpoint | After Iterations | Claude Delivers | Human Reviews |
|------------|------------------|-----------------|---------------|
| L1 | 1-4 | Baseline metrics, top errors | Signal validation |
| L2 | 5-8 | History feature impact | Category effects |
| L3 | 9-12 | Non-linear threshold analysis | DOH cutoffs |
| L4 | 13-16 | Model comparison | Best approach |
| L5 | 17-20 | Final model, learnings | Production readiness |

---

## Agentic Execution Protocol

### Decision Authority Matrix

| Decision Type | Claude Autonomy | Human Approval Required |
|---------------|-----------------|------------------------|
| Feature selection within approved set | ✅ Autonomous | No |
| Hyperparameter tuning | ✅ Autonomous | No |
| Model choice within inner loop focus | ✅ Autonomous | No |
| Threshold optimization | ✅ Autonomous | No |
| New composite features | ❌ Propose only | Yes (at checkpoint) |
| Adding new data sources/tables | ❌ Propose only | Yes (at checkpoint) |
| Changing model family mid-inner-loop | ❌ Propose only | Yes (at checkpoint) |
| Expensive operations (>10 min query) | ⚠️ Document first | Proceed if <3 per inner loop |

### Error Handling Protocol

When encountering errors (auth failures, timeouts, data issues):

1. **Attempt 1**: Retry with same approach (may be transient)
2. **Attempt 2**: Try reasonable workaround (e.g., smaller date range, different query path)
3. **Attempt 3**: Document in `errors/error_log.md` with:
   - Error message
   - What was attempted
   - Hypothesized cause
   - Suggested fix
4. **Pause**: Stop iteration, commit progress, wait for human review

**Error Log Format**:
```markdown
## Error: [Short Description]
- **Timestamp**: 2026-01-16T14:30:00
- **Iteration**: 5
- **Error**: [Full error message]
- **Attempts**:
  1. [What was tried] → [Result]
  2. [What was tried] → [Result]
- **Hypothesis**: [Why this might be happening]
- **Suggested Fix**: [What human should do]
- **Status**: BLOCKED / RESOLVED
```

### Hard Constraints (Never Violate)

1. **Temporal integrity**: Never use future data as features (strict T → T+N contract)
2. **Target leakage**: Never use AVAILABILITY column as a feature
3. **Scope creep**: Stay within single POD + Bradman SKUs (ASSORTMENT IN ('A', 'MLT', 'MnE'))
4. **Iteration discipline**: Complete all 4 iterations per inner loop, even if metrics plateau
5. **Git hygiene**: Commit after every iteration with standardized message format
6. **Checkpoint pause**: Always stop at inner loop boundaries and wait for human review

### Checkpoint Pause Behavior

At inner loop boundaries, Claude Code must:

1. Write all artifacts to `inner_loop_N/` folder (see Appendix D)
2. Commit with message: `L{N}-checkpoint: Inner loop {N} complete`
3. Create git tag: `git tag -a "L{N}-checkpoint" -m "Inner loop {N} complete. Best F1: X.XX"`
4. Output to console:
   ```
   ═══════════════════════════════════════════════════════════════
   CHECKPOINT L{N}: Awaiting human review

   Review artifacts in: outer_loops/outer_loop_1/inner_loops/inner_loop_{N}/
   Key files:
   - INNER_LOOP_LEARNINGS.md (synthesis)
   - decisions.md (questions for you)
   - metrics_summary.json (performance comparison)

   Reply with: "continue" to proceed, or provide specific guidance
   ═══════════════════════════════════════════════════════════════
   ```
5. **STOP** - Do not proceed to next inner loop until human responds

### Cost Escalation Protocol

For strategy changes requiring additional compute (ensemble methods, hyperparameter sweeps, additional data sources):

1. Propose in `decisions.md` with:
   - What: Description of the change
   - Why: Expected benefit based on current learnings
   - Cost: Estimated additional compute/time
   - Risk: What could go wrong
2. Wait for human approval at checkpoint
3. Only implement in subsequent inner loop (never mid-loop)

### Async Communication

Human review is expected within a few hours of checkpoint. Claude Code should:
- Commit all work before pausing
- Provide clear summary of state in checkpoint message
- Not assume immediate response - checkpoint message must be self-contained

---

# Layer 2: Execution

## Step 1: Setup & Verify Access

- Verify Databricks: `python scripts/dbr.py status`
- Verify Snowflake: `snow sql -c swiggy -q "SELECT 1"`
- Create output directory: `scm/pocs/oos-prediction-poc-0.1/`
- **Data freshness check**:
  ```sql
  SELECT MAX(DT) as latest_date FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
  WHERE CITY = 'Bangalore'
  ```
  **Fail if**: `latest_date < CURRENT_DATE - 2` (data more than 2 days stale)

## Step 1.5: Verify All Tables (Pre-flight Check)

Before proceeding, verify **data coverage**, **join key compatibility**, and **freshness** for all tables used in signal generation.

### 1.5.1 Historical Coverage Check (60+ days required)

Run for each table and verify `days_available >= 60`:

```sql
-- RCA Table (primary)
SELECT MIN(DT) as earliest, MAX(DT) as latest, DATEDIFF(MAX(DT), MIN(DT)) as days_available
FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'Bangalore';

-- POD Constraint
SELECT MIN(date) as earliest, MAX(date) as latest, DATEDIFF(MAX(date), MIN(date)) as days_available
FROM prod.analytics_prod.im_mp_pod_constraint;

-- FEFO Adherence
SELECT MIN(TASK_DATE) as earliest, MAX(TASK_DATE) as latest, DATEDIFF(MAX(TASK_DATE), MIN(TASK_DATE)) as days_available
FROM prod.analytics_prod.fefo;

-- Movement Plan (Ambient)
SELECT MIN(DATE) as earliest, MAX(DATE) as latest, DATEDIFF(MAX(DATE), MIN(DATE)) as days_available
FROM prod.analytics_prod.im_mp_ambient_plan_30min;

-- Movement Plan (Cold)
SELECT MIN(date) as earliest, MAX(date) as latest, DATEDIFF(MAX(date), MIN(date)) as days_available
FROM prod.analytics_prod.im_mp_cold_plan_30min;

-- Contract Master (static - just verify it exists)
SELECT COUNT(DISTINCT item_code) as unique_skus FROM prod.analytics_prod.im_contract_master_realtime
WHERE city = 'Bangalore';

-- Movement Plan 30min (NEW - for stock sufficiency signals)
SELECT MIN(DATE) as earliest, MAX(DATE) as latest, DATEDIFF(MAX(DATE), MIN(DATE)) as days_available
FROM prod.analytics_prod.im_mp_ambient_plan_30min
WHERE PLAN = 'BAU_DAY_1';

-- Item Class Priority (NEW - static lookup)
SELECT COUNT(DISTINCT item_class) as class_count FROM prod.scmmp.item_class_priority;
```

**Fail if**: Any table has `days_available < 60` (except Contract Master and Item Class Priority which are static).

### 1.5.2 Join Key Compatibility Check

Verify join keys match between tables:

```sql
-- Check FEFO POD_ID matches RCA STORE_ID
SELECT
  COUNT(DISTINCT f.POD_ID) as fefo_pods,
  COUNT(DISTINCT r.STORE_ID) as rca_pods,
  COUNT(DISTINCT CASE WHEN f.POD_ID = r.STORE_ID THEN f.POD_ID END) as matching_pods
FROM (SELECT DISTINCT CAST(POD_ID AS STRING) as POD_ID FROM prod.analytics_prod.fefo) f
FULL OUTER JOIN (SELECT DISTINCT STORE_ID FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7 WHERE CITY = 'Bangalore') r
ON f.POD_ID = r.STORE_ID;

-- Check POD Constraint store_id matches RCA STORE_ID
SELECT
  COUNT(DISTINCT c.store_id) as constraint_pods,
  COUNT(DISTINCT r.STORE_ID) as rca_pods,
  COUNT(DISTINCT CASE WHEN c.store_id = r.STORE_ID THEN c.store_id END) as matching_pods
FROM (SELECT DISTINCT store_id FROM prod.analytics_prod.im_mp_pod_constraint) c
FULL OUTER JOIN (SELECT DISTINCT STORE_ID FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7 WHERE CITY = 'Bangalore') r
ON c.store_id = r.STORE_ID;

-- Check Contract Master item_code matches RCA ITEM_CODE
SELECT
  COUNT(DISTINCT cm.item_code) as contract_skus,
  COUNT(DISTINCT r.ITEM_CODE) as rca_skus,
  COUNT(DISTINCT CASE WHEN cm.item_code = r.ITEM_CODE THEN cm.item_code END) as matching_skus
FROM (SELECT DISTINCT item_code FROM prod.analytics_prod.im_contract_master_realtime WHERE city = 'Bangalore') cm
FULL OUTER JOIN (SELECT DISTINCT ITEM_CODE FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7 WHERE CITY = 'Bangalore') r
ON cm.item_code = r.ITEM_CODE;

-- Check Movement Plan 30min joins to RCA (NEW)
SELECT
  COUNT(DISTINCT CONCAT(mp.DATE, mp.STORE_ID, mp.ITEM_CODE)) as mp_records,
  COUNT(DISTINCT CONCAT(r.DT, r.STORE_ID, r.ITEM_CODE)) as rca_records,
  COUNT(DISTINCT CASE WHEN mp.DATE = r.DT AND mp.STORE_ID = r.STORE_ID AND mp.ITEM_CODE = r.ITEM_CODE
        THEN CONCAT(mp.DATE, mp.STORE_ID, mp.ITEM_CODE) END) as matching_records
FROM (SELECT DISTINCT DATE, CAST(STORE_ID AS STRING) as STORE_ID, ITEM_CODE
      FROM prod.analytics_prod.im_mp_ambient_plan_30min
      WHERE PLAN = 'BAU_DAY_1' AND DATE >= DATE_ADD(CURRENT_DATE(), -7)) mp
FULL OUTER JOIN (SELECT DISTINCT DT, STORE_ID, ITEM_CODE
                 FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
                 WHERE CITY = 'Bangalore' AND DT >= DATE_ADD(CURRENT_DATE(), -7)) r
ON mp.DATE = r.DT AND mp.STORE_ID = r.STORE_ID AND mp.ITEM_CODE = r.ITEM_CODE;

-- Check Item Class Priority joins to RCA (NEW)
SELECT
  COUNT(DISTINCT icp.item_class) as priority_classes,
  COUNT(DISTINCT r.ITEM_CLASS) as rca_classes,
  COUNT(DISTINCT CASE WHEN icp.item_class = r.ITEM_CLASS THEN icp.item_class END) as matching_classes
FROM (SELECT DISTINCT item_class FROM prod.scmmp.item_class_priority) icp
FULL OUTER JOIN (SELECT DISTINCT ITEM_CLASS FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7 WHERE CITY = 'Bangalore') r
ON icp.item_class = r.ITEM_CLASS;
```

**Fail if**: `matching_pods / rca_pods < 0.8` (less than 80% join rate).
**Fail if**: `matching_records / rca_records < 0.8` for Movement Plan join.
**Warn if**: `matching_classes / rca_classes < 0.9` for Item Class Priority (some classes may be unmapped).

### 1.5.3 Data Freshness Check (All Tables)

```sql
-- All tables should have data within last 3 days
SELECT 'RCA' as table_name, MAX(DT) as latest FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7 WHERE CITY = 'Bangalore'
UNION ALL
SELECT 'POD_Constraint', MAX(date) FROM prod.analytics_prod.im_mp_pod_constraint
UNION ALL
SELECT 'FEFO', MAX(TASK_DATE) FROM prod.analytics_prod.fefo
UNION ALL
SELECT 'Movement_Ambient', MAX(DATE) FROM prod.analytics_prod.im_mp_ambient_plan_30min
UNION ALL
SELECT 'Movement_Cold', MAX(date) FROM prod.analytics_prod.im_mp_cold_plan_30min
UNION ALL
SELECT 'Contract_Master', MAX(update_date) FROM prod.analytics_prod.im_contract_master_realtime WHERE city = 'Bangalore';
```

**Fail if**: Any table (except Contract Master) has `latest < CURRENT_DATE - 3`.

### 1.5.4 Output

Create `preflight_check.json` with results:

```json
{
  "timestamp": "2026-01-16T10:00:00",
  "status": "PASS|FAIL",
  "tables": {
    "rca": {"days_available": 90, "latest": "2026-01-15", "status": "PASS"},
    "pod_constraint": {"days_available": 60, "latest": "2026-01-15", "join_rate": 0.95, "status": "PASS"},
    "fefo": {"days_available": 45, "latest": "2026-01-13", "join_rate": 0.82, "status": "WARN"},
    "movement_plan_30min": {"days_available": 60, "latest": "2026-01-15", "join_rate": 0.92, "status": "PASS"},
    "item_class_priority": {"class_count": 18, "status": "PASS"},
    "pod_settings": {"pod_count": 500, "status": "PASS", "note": "For future cross-POD expansion"}
  },
  "blockers": ["FEFO table has only 45 days history"]
}
```

**If any blocker exists**: Document in `errors/error_log.md` and pause for human review.

## Step 2: Document Table Schemas

**For each of 22 tables**, create `schemas/tables/<table_name>.md`:
- Query `DESCRIBE TABLE` for column metadata
- Document types, nullability, sample values
- See [Appendix C](#appendix-c-verified-table-access) for table list

**Output**: 22 schema files (19 original + 3 stock sufficiency tables)

## Step 3: Select Target POD

```sql
SELECT STORE_ID,
       COUNT(*) as total_records,
       SUM(CASE WHEN AVAILABILITY < 95 THEN 1 ELSE 0 END) as oos_events,
       AVG(AVAILABILITY) as avg_avail
FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'Bangalore'
  AND DT >= DATE_ADD(CURRENT_DATE(), -60)
  AND ASSORTMENT IN ('A', 'MLT', 'MnE')
GROUP BY STORE_ID
HAVING oos_events > 100
ORDER BY (total_records * 0.5 + oos_events * 0.5) DESC
LIMIT 10;
```

## Step 3.5: Estimate Dataset Size

After selecting POD, estimate row count:

```sql
SELECT COUNT(*) as total_rows,
       COUNT(DISTINCT ITEM_CODE) as unique_skus,
       COUNT(DISTINCT DT) as days
FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE STORE_ID = '<selected_pod>'
  AND CITY = 'Bangalore'
  AND DT >= DATE_ADD(CURRENT_DATE(), -60)
  AND ASSORTMENT IN ('A', 'MLT', 'MnE')
```

**Expected**: ~30K rows (500 SKUs × 60 days). **If >100K rows**: Consider sampling or longer query timeouts.

## Step 4: Extract Features from RCA Table

- Pull data for selected POD + Bradman SKUs (60 days)
- Add temporal features (day_of_week, is_weekend, is_month_end)
- Calculate rolling features (oos_count_7d, avg_availability_7d)
- **Join movement planning tables for stock sufficiency signals (NEW)**
- Construct multi-horizon targets (IS_OOS_T1, IS_OOS_T2, IS_OOS_T3)
- Save to `data/raw_features.parquet`

See [Appendix A](#appendix-a-signal-catalog) for full signal list (50+ signals).

### 4.1 Stock Sufficiency Signal Joins (NEW)

Join movement planning tables to get allocation signals. These joins add 4 signals critical for single-POD prediction.

```sql
-- Base RCA query with stock sufficiency joins
SELECT
    rca.*,

    -- Stock Sufficiency Signals (Tier 0.5)
    mp.DOH_RANK as doh_rank,
    CASE WHEN mp.SUFFICENCY = 'Yes' THEN 1 ELSE 0 END as sufficiency_flag,
    mp.PLAN as plan_type,
    icp.priority as item_class_priority

FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7 rca

-- Join 1: Movement Plan for sufficiency signals
-- Use BAU_DAY_1 as the primary daily plan
LEFT JOIN (
    SELECT DATE, STORE_ID, ITEM_CODE,
           DOH_RANK, SUFFICENCY, PLAN
    FROM prod.analytics_prod.im_mp_ambient_plan_30min
    WHERE PLAN = 'BAU_DAY_1'
) mp ON rca.DT = mp.DATE
    AND rca.STORE_ID = mp.STORE_ID
    AND rca.ITEM_CODE = mp.ITEM_CODE

-- Join 2: Item Class Priority
LEFT JOIN (
    SELECT item_class, priority
    FROM prod.scmmp.item_class_priority
) icp ON rca.ITEM_CLASS = icp.item_class

WHERE rca.CITY = 'Bangalore'
  AND rca.STORE_ID = '<selected_pod>'
  AND rca.DT >= DATE_ADD(CURRENT_DATE(), -60)
  AND rca.ASSORTMENT IN ('A', 'MLT', 'MnE')
```

**Join Notes:**
- `im_mp_ambient_plan_30min` is partitioned by DATE and PLAN — filter to `BAU_DAY_1` for main daily plan
- Movement plan DATE should match RCA DT (same day's plan for same day's features)
- `item_class_priority` is a small lookup table (~18 rows)
- Expected join rate: >95% for movement plan (active SKUs), 100% for item class priority

**Temporal Integrity:** Use the movement plan created on date T (not T+1) to maintain point-in-time correctness. The `PLAN` partition indicates when the plan was generated.

## Step 5: EDA & Feature Selection

**Objective**: Identify top 15-20 features via correlation + mutual information, and create composite features.

**5.1 Target Analysis**
- OOS rate distribution (expect 5-15%)
- OOS by day_of_week, category, item_class
- Target correlation across horizons (T+1 vs T+2 vs T+3)
- **Multi-horizon model decision**: Based on target correlation:
  - If T+1/T+2/T+3 highly correlated (r > 0.7): Consider single multi-output model
  - If correlation is moderate/low: Use 3 separate models
  - Claude decides based on EDA findings and documents rationale

**5.2 Feature Distributions**
- DOH, inventory, fill rates
- Nulls/zeros per column
- Outlier detection and handling strategy
- **Categorical encoding**: Claude decides per feature based on cardinality:
  - Low cardinality (<10 unique): One-hot encoding
  - Medium cardinality (10-50): Target encoding with CV to prevent leakage
  - High cardinality (>50): Consider dropping or grouping
  - Document choice in `feature_config.json`

**5.3 Correlation Analysis**
- Pearson/Spearman with IS_OOS (for each horizon)
- Multicollinearity check (drop features with r > 0.9)
- Feature clustering to identify redundant groups

**5.4 Binary Flag Analysis**
- OOS lift per flag (see [Appendix B](#appendix-b-pre-computed-binary-flags))
- Redundant flag identification
- Flag combinations that amplify OOS risk

**5.5 Baseline Models**
- Persistence model F1 (predict yesterday's OOS)
- DOH < 1.0 rule F1
- Majority class F1
- Simple decision stump on best single feature

**5.6 Calibration Baseline**
- Compute Brier score for baseline models (lower is better, 0 = perfect)
- Generate reliability diagram (predicted probability vs actual OOS rate)
- Establish calibration benchmark for evaluating later models
- **Why calibration matters**: For operational use, a 0.7 predicted probability should mean ~70% actual OOS rate. Discrimination (F1) alone is insufficient.

**5.7 Composite Feature Engineering**

Claude explores and creates composite features based on EDA findings:

**Ratio Features** (normalized comparisons):
```python
# Examples - Claude decides which to create based on correlation analysis
doh_vs_cutoff = DOH / CUTOFF_DOH           # How close to reorder trigger?
po_fillrate = RECEIVED_QTY / EXPECTED_QTY  # Recent supplier reliability
stock_velocity = SALES / POD_INVENTORY     # Depletion rate
wh_to_pod_ratio = WH_STOCK1 / POD_INVENTORY # Upstream buffer
```

**Interaction Features** (condition combinations):
```python
# Examples - Claude decides based on flag co-occurrence analysis
critical_low_stock = (DOH < 1.0) & (WH_STOCK1 == 0)      # No buffer anywhere
weekend_risk = is_weekend & (DOH < 2.0)                   # Weekend + low stock
blocked_replenishment = MOVEMENT_RR_BLOCKED | ERP_ISSUE   # Can't reorder
```

**Aggregation Features** (summarized signals):
```python
# Examples - Claude decides based on redundancy analysis
total_issue_flags = sum([STOCK_ISSUE, WH_FILLRATE_ISSUE, ...])  # Issue severity
supply_chain_health = weighted_avg([wh_doh, supplier_fillrate, ...])
```

**Trend Features** (temporal patterns):
```python
# Examples - Claude decides based on lagged correlation
stock_trend = POD_INVENTORY - POD_STOCK_T2  # 2-day stock change
doh_declining = (DOH < lag(DOH, 1)) & (lag(DOH, 1) < lag(DOH, 2))
```

**Stock Sufficiency Composites** (NEW - from Tier 0.5 signals):
```python
# Single-POD scope composites - these vary per SKU
low_priority_sku = (item_class_priority > 5)           # TORSO/DEFAULT classes
high_rank_risk = (doh_rank > 5) & (sufficiency_flag == 0)  # Late in queue + won't get stock
dd_protected = (plan_type.str.startswith('DD')) & (item_class_priority <= 2)  # Top items with DD coverage
bau_only_risk = (plan_type == 'BAU_DAY_1') & (DOH < 1.5)  # Only 1x/day replenishment + low DOH

# Allocation decision combo
allocation_at_risk = (sufficiency_flag == 0) | (doh_rank > 10)  # Either no allocation or very late in queue
priority_protected = (item_class_priority == 1) & (doh_rank <= 3)  # TOP 50 + early in queue

# FUTURE (Cross-POD only) - uncomment when expanding scope:
# wh_constrained = (wh_sufficiency_ratio < 1.0)        # WH can't serve all pods
# low_priority_pod_risk = (pod_priority > 5) & wh_constrained  # Low-priority pod + constrained WH
```

**5.8 EDA Outputs** (machine-consumable):
```
eda/
├── feature_config.json       # Selected features, bins, transforms
├── composite_features.json   # Composite feature definitions
│   {
│     "ratios": {"doh_vs_cutoff": "DOH / CUTOFF_DOH", ...},
│     "interactions": {"critical_low_stock": "(DOH < 1.0) & (WH_STOCK1 == 0)", ...},
│     "aggregations": {"total_issue_flags": ["STOCK_ISSUE", "WH_FILLRATE_ISSUE", ...]}
│   }
├── null_handling.json        # Per-column null strategy
├── class_weights.json        # Computed class weights
├── baseline_metrics.json     # Naive model benchmarks (including Brier scores)
├── calibration/              # Calibration analysis
│   ├── reliability_diagram.png   # Predicted prob vs actual rate
│   └── calibration_metrics.json  # Brier scores per model
├── correlations.parquet      # Correlation matrix (including composites)
├── feature_importance.csv    # Ranked features (including composites)
└── oos_analysis.md           # Human summary + composite feature rationale
```

## Step 6: Create Initial Model Script

Build `oos_predictor.py`:
- Databricks query helpers (using dbr.py)
- Feature engineering from EDA config
- Logistic regression baseline
- **Time-series cross-validation** (see below)

### Validation Strategy: Time-Series Cross-Validation

Use `TimeSeriesSplit` to respect temporal ordering:

```python
from sklearn.model_selection import TimeSeriesSplit

# 5 splits, each with expanding training window
tscv = TimeSeriesSplit(n_splits=5, test_size=7)  # 7-day test windows

# Example with 60 days of data:
# Split 1: Train days 1-32, Test days 33-39
# Split 2: Train days 1-39, Test days 40-46
# Split 3: Train days 1-46, Test days 47-53
# Split 4: Train days 1-53, Test days 54-60
# (Final hold-out: last 7 days never seen during CV)
```

**Metrics reported**: Mean ± std across folds for F1, Precision, Recall, AUC

## Step 7: Run 20 Iterations

### Terminology

| Level | Definition | Count | Learnings |
|-------|------------|-------|-----------|
| **Iteration** | 1 experiment | 20 total | `iteration_N.json` |
| **Inner Loop** | 4 iterations | 5 total | `INNER_LOOP_LEARNINGS.md` |
| **Outer Loop** | All 20 iterations | 1 total | `OUTER_LOOP_LEARNINGS.md` |

### Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│  OUTER LOOP (1 total = all 20 iterations)                          │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  INNER LOOP 1 (iterations 1-4)                                │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  ITERATION 1  │  ITERATION 2  │  ITERATION 3  │  ITER 4 │  │  │
│  │  │  - Train      │  - Train      │  - Train      │  - Train│  │  │
│  │  │  - Evaluate   │  - Evaluate   │  - Evaluate   │  - Eval │  │  │
│  │  │  - Log .json  │  - Log .json  │  - Log .json  │  - Log  │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │  ↓                                                            │  │
│  │  Write INNER_LOOP_LEARNINGS.md (synthesis of 4 iterations)    │  │
│  │  CHECKPOINT: Claude pauses, awaits human review               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  INNER LOOP 2 (iterations 5-8)  ...                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ... INNER LOOPS 3, 4, 5 ...                                        │
│                                                                     │
│  ↓                                                                  │
│  Write OUTER_LOOP_LEARNINGS.md (final synthesis of all 20)          │
└─────────────────────────────────────────────────────────────────────┘
```

### Inner Loop Schedule

| Inner Loop | Iterations | Model | Focus | Checkpoint |
|------------|------------|-------|-------|------------|
| **1** | 1-4 | Logistic Regression | Baseline, validate EDA | L1 |
| **2** | 5-8 | Logistic Regression | Add history, category | L2 |
| **3** | 9-12 | Decision Tree / RF | Non-linear thresholds | L3 |
| **4** | 13-16 | XGBoost | Class imbalance, tuning | L4 |
| **5** | 17-20 | Best model | Final tuning | L5 |

**Iteration Completion Rule**: Always complete all 4 iterations per inner loop, even if metrics plateau. This ensures inner loops are comparable and prevents premature convergence assumptions.

### Feature & Data Source Evolution Rules

Features and data sources can evolve **only at inner loop boundaries** (not mid-loop):

| When | What's Allowed | Approval |
|------|----------------|----------|
| **Within inner loop** | Use existing features/tables only | No changes |
| **At L1 checkpoint** | Add composite features from EDA insights | Human approval |
| **At L2 checkpoint** | Add Vendor Portal table (wh_doh, supplier_fillrate) | Human approval |
| **At L3/L4 checkpoint** | Add other secondary tables if needed | Human approval |

**Data Source Progression**:
```
Inner Loop 1: RCA table only (baseline)
Inner Loop 2+: RCA + Vendor Portal (if L1 learnings suggest upstream signals needed)
Inner Loop 3+: RCA + Vendor Portal + Search Impressions (if demand signals needed)
```

**Process**:
1. Claude proposes new features/tables in `decisions.md`
2. Human approves/rejects at checkpoint
3. Approved features added to `composite_features.json`
4. Approved tables added to data extraction query
5. Next inner loop uses updated feature set

This ensures experiments within an inner loop are comparable (same feature set and data sources).

### Folder Structure (Nested)

```
outer_loops/
└── outer_loop_1/
    ├── OUTER_LOOP_LEARNINGS.md       # Final synthesis after all 20 iterations
    └── inner_loops/
        ├── inner_loop_1/
        │   ├── INNER_LOOP_LEARNINGS.md   # Synthesis after iterations 1-4
        │   ├── metrics_summary.json      # Comparison of iterations 1-4
        │   ├── errors_analysis.csv       # FP/FN samples
        │   ├── feature_importance.csv    # Feature rankings
        │   ├── decisions.md              # Questions for human review
        │   ├── best_model.pkl            # Best model from this inner loop
        │   └── iterations/
        │       ├── iteration_1.json      # Config + metrics + notes
        │       ├── iteration_2.json
        │       ├── iteration_3.json
        │       └── iteration_4.json
        ├── inner_loop_2/
        │   ├── INNER_LOOP_LEARNINGS.md
        │   └── iterations/
        │       ├── iteration_5.json
        │       ├── iteration_6.json
        │       ├── iteration_7.json
        │       └── iteration_8.json
        ├── inner_loop_3/
        │   └── ... (iterations 9-12)
        ├── inner_loop_4/
        │   └── ... (iterations 13-16)
        └── inner_loop_5/
            └── ... (iterations 17-20)
```

Future outer loops (e.g., `outer_loop_2/`) can be added for additional experimentation rounds.

### Git Protocol

**After every iteration**, Claude commits:

```bash
git add outer_loops/outer_loop_1/inner_loops/inner_loop_*/iterations/iteration_*.json
git add eda/  # If updated
git commit -m "iter-N: <brief description of change>

F1: T1=0.XX, T2=0.XX, T3=0.XX
Change: <what was tried>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

**Commit message format**:
- `iter-1: baseline logistic regression`
- `iter-5: add oos_count_7d feature`
- `iter-12: switch to random forest`

This enables `git log --oneline` to show experiment progression and `git diff iter-N..iter-M` to compare changes.

**At inner loop boundaries**, also create a tag:
```bash
git tag -a "L1-checkpoint" -m "Inner loop 1 complete. Best F1: 0.XX"
```

### Learnings at Each Level

#### 1. Iteration Level (`iteration_N.json`)

After each experiment, log:

```json
{
  "iteration": 1,
  "inner_loop": 1,
  "timestamp": "2026-01-16T10:30:00",
  "config": {
    "model": "LogisticRegression",
    "features": ["doh", "wh_stock", ...],
    "params": {"C": 1.0, "class_weight": "balanced"},
    "composite_features": ["doh_vs_cutoff"]
  },
  "metrics": {
    "T1": {"f1": 0.52, "precision": 0.61, "recall": 0.45, "auc": 0.78, "brier": 0.12},
    "T2": {"f1": 0.48, "precision": 0.55, "recall": 0.42, "auc": 0.74, "brier": 0.14},
    "T3": {"f1": 0.41, "precision": 0.50, "recall": 0.35, "auc": 0.70, "brier": 0.16}
  },
  "notes": {
    "change_from_prev": "Added class_weight='balanced'",
    "observation": "Recall improved but precision dropped",
    "next_idea": "Try threshold tuning instead"
  }
}
```

#### 2. Inner Loop Level (`INNER_LOOP_LEARNINGS.md`)

After 4 iterations, synthesize:

```markdown
# Inner Loop N Learnings (Iterations X-Y)

## Summary
- Best iteration: N (F1 = X.XX for T+1)
- Improvement over first iteration: +X%

## What Worked
- ...

## What Didn't Work
- ...

## Key Discoveries
- Feature X has stronger signal than expected
- Composite feature Y improved recall by Z%

## Hypothesis Evolution
- Before: "DOH < 1.0 is the best threshold"
- After: "DOH < 0.8 works better for non-dairy"

## Strategy for Next Inner Loop
- ...

## Questions for Human Review
1. ...
2. ...
```

#### 3. Outer Loop Level (`OUTER_LOOP_LEARNINGS.md`)

After all 20 iterations, final synthesis:

```markdown
# Outer Loop Learnings (All 20 Iterations)

## Executive Summary
- Final best model: XGBoost from Inner Loop 4, Iteration 15
- F1 scores: T+1=0.65, T+2=0.58, T+3=0.52
- Improvement over baseline: +35%

## Journey Through Inner Loops
| Inner Loop | Best F1 (T+1) | Key Learning |
|------------|---------------|--------------|
| 1 | 0.52 | DOH is strongest signal |
| 2 | 0.55 | History features help +6% |
| 3 | 0.60 | Non-linear thresholds matter |
| 4 | 0.65 | XGBoost handles interactions |
| 5 | 0.65 | Diminishing returns on tuning |

## Top Predictive Features (Final)
1. `doh` - 35% importance
2. `wh_stock` - 22% importance
3. `doh_vs_cutoff` (composite) - 15% importance
...

## Composite Features That Worked
- `doh_vs_cutoff`: +8% F1 improvement
- `critical_low_stock`: +5% recall improvement

## Composite Features That Didn't Work
- `weekend_risk`: No signal, removed

## Production Recommendations
1. ...
2. ...

## Future Work
1. ...
2. ...
```

See [Appendix D](#appendix-d-checkpoint-protocol) for checkpoint artifact details.

## Step 8: Document & Commit

- Write `learnings.md` with findings
- Update `eda/oos_analysis.md` with model insights
- Commit to git

---

# Layer 3: Reference

## Temporal Contract

**Critical**: Prevent information leakage.

```
EOD Day T (prediction time)
    │
    ├─── Features: All data up to and including Day T
    │
    └─── Targets:
         ├── IS_OOS_T1: AVAILABILITY < 95% on Day T+1
         ├── IS_OOS_T2: AVAILABILITY < 95% on Day T+2
         └── IS_OOS_T3: AVAILABILITY < 95% on Day T+3
```

### Feature Availability Matrix

| Feature | Safe at T? | Notes |
|---------|------------|-------|
| `DOH`, `WH_STOCK1`, `POD_OPENING_STOCK_T_DAY` | ✅ Yes | EOD T values |
| `AVAILABILITY` (same day) | ❌ **LEAKY** | This IS the target derivation basis |
| `TRANSFER_QTY`, `INTRANSIT_QTY` | ✅ Yes | In-transit as of EOD T |
| `SALES` | ✅ Yes | T's sales known at EOD T |
| Rolling features (`oos_count_7d`) | ✅ Yes | **T-7 to T-1 only** (exclude T) |
| Binary flags | ✅ Yes | T's flag values |

**Why rolling features exclude T**: The target `IS_OOS_T1` is derived from T+1's `AVAILABILITY`. However, T's `AVAILABILITY` is correlated with T+1's (autocorrelation). Including T's OOS status in rolling features would leak information about the target. Rolling windows use T-7 to T-1 to maintain temporal separation.

### Target Construction SQL

```sql
SELECT
    a.DT, a.ITEM_CODE, a.STORE_ID,
    a.DOH, a.WH_STOCK1, ...  -- Features from T

    -- Targets (look-ahead)
    CASE WHEN b1.AVAILABILITY < 95 THEN 1 ELSE 0 END as IS_OOS_T1,
    CASE WHEN b2.AVAILABILITY < 95 THEN 1 ELSE 0 END as IS_OOS_T2,
    CASE WHEN b3.AVAILABILITY < 95 THEN 1 ELSE 0 END as IS_OOS_T3
FROM rca_table a
LEFT JOIN rca_table b1 ON a.ITEM_CODE = b1.ITEM_CODE
    AND a.STORE_ID = b1.STORE_ID AND b1.DT = DATE_ADD(a.DT, 1)
LEFT JOIN rca_table b2 ON a.ITEM_CODE = b2.ITEM_CODE
    AND a.STORE_ID = b2.STORE_ID AND b2.DT = DATE_ADD(a.DT, 2)
LEFT JOIN rca_table b3 ON a.ITEM_CODE = b3.ITEM_CODE
    AND a.STORE_ID = b3.STORE_ID AND b3.DT = DATE_ADD(a.DT, 3)
WHERE b1.AVAILABILITY IS NOT NULL  -- Drop rows with NULL targets
  AND b2.AVAILABILITY IS NOT NULL
  AND b3.AVAILABILITY IS NOT NULL
```

**Note**: Last 3 days of data will have NULL targets and are dropped. This is expected (~5% data loss for 60-day window).

---

## Data Strategy

### Primary Query (RCA Table)

```sql
SELECT
    -- Identifiers
    DT, ITEM_CODE, SKU_ID, STORE_ID, CITY, PRODUCT_NAME, WH_NAME,

    -- Ground Truth (DO NOT use as feature)
    AVAILABILITY,
    FINAL_REASON, OOS_REASONS,

    -- Session Metrics
    AVAIL_SESSIONS, NON_AVAIL_SESSIONS, TOTAL_SESSIONS,

    -- Inventory Signals
    WH_STOCK1 as wh_inventory,
    POD_OPENING_STOCK_T_DAY as pod_inventory,
    POD_STOCK_T2, TOTAL_STOCK, INTRANSIT_QTY, TRANSFER_QTY,

    -- DOH Signals
    DOH as effective_doh, FREE_DOH, STAGING_DOH, CUTOFF_DOH,

    -- Replenishment Signals
    BASE_RR, MOVEMENT_RR, EXPECTED_QTY, RECEIVED_QTY,
    LAST_PO_EXPECTED_QTY, LAST_PO_RECEIVED_QTY, ORDEREDUNITS,
    LATEST_INWARD_DT, LATEST_MP_DT,

    -- Fillrate Signals
    POD_FILLRATES as wh_outbound_fillrate, CUTOFF_ACTUAL, CUTOFF_LIMIT,

    -- Classification
    ASSORTMENT, ITEM_CLASS, GMV_BAND, NEW_L1 as category, L2 as subcategory,
    BRAND, COMPANY, BUSINESS_CATEGORY, FRESH_FLAG, AMBIENT_COLD,

    -- Config Flags
    POD_ENABLE, POD_ACTIVE_FLAG, QPL_FLAG,

    -- Pre-computed Issue Flags (see Appendix B)
    STOCK_ISSUE, STOCK_SUFFI_ISSUE, SPACE_ISSUE,
    POD_CAPACITY_ISSUE2, POD_CAP_MISSED, WH_CAPACITY_ISSUE2, WH_CAP_MISSED,
    PUTAWAY_DELAY, OTIF_ISSUE, WH_FILLRATE_ISSUE, WH_LAST_PO_FILLRATE_ISSUE,
    POD_FILLRATES_ISSUE, WH_LONG_TERM_SUPPLY_ISSUE,
    MOVEMENT_BLOCKED_LIST, MOVEMENT_RR_BLOCKED, MOVEMENT_RR_NOT_GENERATED,
    MOVEMENT_SETTING_ISSUE, ERP_TEMP_DISABLE, ERP_BLOCK_LIST, ERP_ISSUE,
    PLANNING_ISSUE, VENDOR_CODE_NOT_AVAILABLE, CONTRACT_NOT_AVAILABLE,
    OTB_BLOCK, VINCULUM_ERROR, MOV_MOQ_TONNAGE_CONSTRAINT, CASE_SIZE_CONSTRAINT,

    -- Sales
    SALES as yesterday_sales

FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'Bangalore'
  AND DT >= DATE_ADD(CURRENT_DATE(), -60)
  AND ASSORTMENT IN ('A', 'MLT', 'MnE')
```

### Secondary Queries (As Needed)

**Vendor Portal** - Aggregated fill rates:
```sql
SELECT ItemCode, PodCityId, WhDoh, FillRate, WhAvl, PodAvl
FROM prod.analytics_prod.im_vendor_portal_availability_module_daily
WHERE PodCityName = 'Bangalore' AND dt >= DATEADD(day, -7, CURRENT_DATE())
```

**Procurement PO** - Pending PO detection:
```sql
SELECT poNumber, poState, createdAt, expectedDelivery, storeId
FROM prod.dash_erp_engg.scm_procurement_po
WHERE poState IN ('PO_STATE_CONFIRMED', 'PO_STATE_PARTIALLY_DELIVERED')
```

---

## Key Formulas

### OOS Definition
```
IS_OOS = 1 if AVAILABILITY < 95% else 0
```

### Item Class Thresholds

| Item Class | MinDOH | MaxDOH | Target |
|------------|--------|--------|--------|
| Top 50 | 3.0 | 3.5 | 98%+ |
| Top 100 | 2.5 | 3.0 | 95%+ |
| MSKU | 2.0 | 2.5 | ~90% |
| Long-tail | 1.0 | 1.5 | Best effort |
| Dairy | 1.5 | 2.0 | Special |

### Pattern Rules (Derived Features)

| Pattern | Condition | Source |
|---------|-----------|--------|
| `LOW_DOH_CRITICAL` | `DOH < 1.0` | RCA.DOH |
| `WH_OOS_UPSTREAM` | `WH_STOCK1 = 0 OR WH_FILLRATE_ISSUE = 1` | RCA |
| `MOVEMENT_BLOCKED` | `MOVEMENT_RR_BLOCKED = 1 OR MOVEMENT_RR IS NULL` | RCA |
| `ERP_DISABLED` | `ERP_TEMP_DISABLE = 1 OR ERP_BLOCK_LIST = 1` | RCA |

---

## Deliverables

### Output Directory Structure

```
scm/pocs/oos-prediction-poc-0.1/
├── PLAN.md                       # This document (machine-executable by Claude Code)
├── oos_predictor.py              # Main prediction script
│
├── data/
│   ├── raw_features.parquet
│   └── processed_features.parquet
│
├── errors/                       # Error log for blocked issues
│   └── error_log.md              # Documented failures and workarounds
│
├── eda/
│   ├── feature_config.json       # Selected features, bins, transforms
│   ├── composite_features.json   # Composite feature definitions
│   ├── null_handling.json        # Per-column null strategy
│   ├── class_weights.json        # Computed class weights
│   ├── baseline_metrics.json     # Naive model benchmarks (including Brier scores)
│   ├── calibration/              # Calibration analysis
│   │   ├── reliability_diagram.png
│   │   └── calibration_metrics.json
│   ├── correlations.parquet      # Correlation matrix
│   ├── feature_importance.csv    # Ranked features
│   └── oos_analysis.md           # Human summary
│
├── outer_loops/                  # Nested: outer_loop → inner_loop → iterations
│   └── outer_loop_1/
│       ├── OUTER_LOOP_LEARNINGS.md   # Final synthesis after 20 iterations
│       └── inner_loops/
│           ├── inner_loop_1/
│           │   ├── INNER_LOOP_LEARNINGS.md
│           │   ├── metrics_summary.json
│           │   ├── errors_analysis.csv
│           │   ├── feature_importance.csv
│           │   ├── decisions.md
│           │   ├── best_model.pkl
│           │   └── iterations/
│           │       ├── iteration_1.json
│           │       ├── iteration_2.json
│           │       ├── iteration_3.json
│           │       └── iteration_4.json
│           ├── inner_loop_2/
│           │   └── ... (iterations 5-8)
│           ├── inner_loop_3/
│           │   └── ... (iterations 9-12)
│           ├── inner_loop_4/
│           │   └── ... (iterations 13-16)
│           └── inner_loop_5/
│               └── ... (iterations 17-20)
│
├── schemas/
│   ├── README.md
│   └── tables/ (22 files)
│
└── queries/
    ├── extract_features.sql
    └── select_pod.sql
```

---

## Key Insights

1. **RCA table is primary** - Contains ~80% of signals pre-computed
2. **72% of OOS is WH-led** - Focus on `WH_STOCK1`, `WH_FILLRATE_ISSUE`
3. **DOH < 1.0 = ~85% OOS risk** - Strongest single predictor
4. **Bradman filter**: `ASSORTMENT IN ('A', 'MLT', 'MnE')`
5. **Movement blocking**: `MOVEMENT_RR IS NULL OR MOVEMENT_RR = 0.001`
6. **Stock Sufficiency (NEW)**: Movement plan signals (`doh_rank`, `sufficiency_flag`, `item_class_priority`) capture allocation decisions that pure inventory metrics miss. When WH is constrained, some pods get stock and others don't — these signals predict which SKUs at YOUR pod get served.

### Single-POD vs Cross-POD Signal Scope (NEW)

| Signal Scope | Signals | Use Case |
|--------------|---------|----------|
| **Single-POD (current)** | `doh_rank`, `sufficiency_flag`, `item_class_priority`, `plan_type` | Varies per SKU — predicts which SKUs at this pod will go OOS |
| **Cross-POD (future)** | `wh_sufficiency_ratio`, `pod_priority` | Constant for single pod — only useful when comparing across multiple pods |

For single-POD POC, focus on signals that **vary per SKU**. Signals that are constant across all SKUs at a pod (like `pod_priority`) don't help discriminate and should be saved for cross-POD expansion.

---

# Appendices

## Appendix A: Signal Catalog

**68 signals across 5 tiers** (including 6 new stock sufficiency signals). ~85% extractable from RCA table; remaining 15% require joins to movement planning tables.

| Tier | Signal Count | Source |
|------|--------------|--------|
| Tier 0: Core Prediction | 12 | RCA + External |
| **Tier 0.5: Stock Sufficiency (NEW)** | **6** | **Movement Plan + Item Class** |
| Tier 1: Must-Have | 18 | RCA + Vendor Portal |
| Tier 2: Historical/Classification | 15 | RCA + Vendor Portal |
| Tier 3: Advanced/Constraints | 17 | RCA |

### TIER 0: Core Prediction Signals (12 signals)

Signals derived from OOS Handling Brain document - directly implement the shortfall prediction formula.

| # | Signal | Type | Source | Column(s) | Description |
|---|--------|------|--------|-----------|-------------|
| 0.1 | `demand_forecast_next_day` | FLOAT | TFT Model | `data_science.ds_storefront.im_pod_hr_demand_forecasting` | TFT model's predicted demand for T+1. **Core demand signal** - Replaces `SALES` (yesterday) proxy with actual forecast. Captures day-of-week, promotions, seasonality effects. |
| 0.2 | `run_out_time_hours` | FLOAT | Derived | `(POD_INVENTORY / BASE_RR) * 24` | Hours until stock hits zero at current consumption rate. **OOS timing** - DOH in hours, not days. Critical for determining if inbound arrives in time. |
| 0.3 | `next_inbound_eta_hours` | FLOAT | Movement Plan | `im_mp_ambient_plan_30min`, `im_mp_cold_plan_30min` | Hours until next planned movement arrives at POD. **Replenishment timing** - Enables "will inbound arrive before stockout?" calculation. Requires union of ambient + cold tables. |
| 0.4 | `supply_demand_ratio` | FLOAT | Derived | `(POD_INVENTORY + TRANSFER_QTY + INTRANSIT_QTY) / demand_forecast_next_day` | Total available supply ÷ Expected demand. **Normalized shortfall** - Ratio < 1.0 = guaranteed OOS. Core formula from OOS Handling Brain document. |
| 0.5 | `days_to_festival` | INT | External CSV | `data/indian_festivals.csv` | Days until nearest major festival (-1 to 7 range). **Demand timing** - Demand builds 3-7 days before festival. 0 = festival day, -1 = day after. NULL if no festival within 7 days. |
| 0.6 | `festival_demand_multiplier` | FLOAT | External CSV | `data/indian_festivals.csv` | Expected demand multiplier based on festival intensity × category match. **Demand magnitude** - Diwali+sweets = 10x, minor festival = 2x. 1.0 if no festival impact. |
| 0.7 | `pod_capacity_utilization_pct` | FLOAT | POD Constraint | `im_mp_pod_constraint` | POD storage utilization = pod_stock / inventory_capacity. **Capacity constraint** - High utilization (>90%) blocks new inbound, increasing OOS risk. |
| 0.8 | `fefo_adherence_pct` | FLOAT | FEFO Table | `fefo` | FEFO_FOLLOWED / TOTAL_FEFO_TASK. **Operational quality** - Low FEFO adherence (<90%) indicates operational issues that may correlate with OOS (expired stock blocking shelf space). |
| 0.9 | `availability_trend_3d` | FLOAT | Derived | RCA (rolling) | Slope of availability over past 3 days. **Trend direction** - Negative slope = declining availability = increasing OOS risk. Captures momentum. |
| 0.10 | `stock_velocity` | FLOAT | Derived | `(POD_STOCK_T2 - POD_INVENTORY) / 2` | Daily stock depletion rate at POD. **Depletion speed** - High negative velocity = fast stock drain. Complements DOH with direction info. |
| 0.11 | `wh_oos_days_7d` | INT | Derived | RCA (rolling) | Count of days WH was OOS (WH_STOCK1=0) in past 7 days. **Upstream reliability** - Frequent WH OOS = unreliable supply source. |
| 0.12 | `contract_expiring_soon` | BOOL | Contract Master | `im_contract_master_realtime` | nlc_base_about_to_expire = 1. **Procurement risk** - Expiring contract may block future POs. SKU×City level. |

---

### TIER 0.5: Stock Sufficiency Signals (4 signals) — **NEW**

Signals derived from movement planning tables that capture allocation decisions and priority rankings.

| # | Signal | Type | Source | Column(s) | Scope | Description |
|---|--------|------|--------|-----------|-------|-------------|
| 0.13 | `doh_rank` | INT | Movement Plan | `im_mp_ambient_plan_30min.DOH_RANK` | **Single POD** | Pod's position in the allocation queue for this SKU (1 = highest priority, served first). Lower rank = higher priority = lower OOS risk. **Critical for single POD** — tells you "where am I in the queue for this SKU?" |
| 0.14 | `sufficiency_flag` | BOOL | Movement Plan | `im_mp_ambient_plan_30min.SUFFICENCY` | **Single POD** | Direct Yes/No from movement planning on whether this pod-SKU will receive stock allocation. **Critical for single POD** — this is the system's own allocation decision. |
| 0.15 | `item_class_priority` | INT | Item Class Config | `scmmp.item_class_priority.priority` | **Single POD** | Item class priority ranking (1=TOP 50, 2=MSKU, ..., 14=TORSO, 18=DEFAULT). TOP 50 gets allocated even when capacity exceeded; TORSO gets cut first. **Critical for single POD** — varies per SKU. |
| 0.16 | `plan_type` | CAT | Movement Plan | `im_mp_ambient_plan_30min.PLAN` | **Single POD** | Which movement plan covered this SKU (DD_DAY_1, BAU_DAY_1, BAU_NIGHT_1, etc.). DD plans run 3x/day for top items; BAU runs 1x/day. **Useful for single POD** — affects replenishment timing. |

**Future Scope (Cross-POD) Signals:**

| # | Signal | Type | Source | Column(s) | Scope | Description |
|---|--------|------|--------|-----------|-------|-------------|
| 0.17 | `wh_sufficiency_ratio` | FLOAT | Movement Plan | Derived: `wh_stock / SUM(rank_demand)` | **Cross-POD only** | Ratio of WH stock to total pod demand. When < 1.0, some pods WILL go OOS. For single POD, this is context only — need `doh_rank` to know if YOUR pod is affected. **Save for cross-POD expansion.** |
| 0.18 | `pod_priority` | INT | Pod Settings | `im_mp_pod_settings.POD_PRIORITY` | **Cross-POD only** | Pod's overall importance ranking within warehouse (1-10). **Constant for single POD** — doesn't vary across SKUs. Only useful when comparing across pods. **Save for cross-POD expansion.** |

**Why Single-POD vs Cross-POD Distinction Matters:**

For a single POD (e.g., Koramangala with pod_priority=3):
- `pod_priority` is always 3 — doesn't help distinguish which SKUs go OOS
- `wh_sufficiency_ratio` tells you "WH is constrained" but not "will MY pod get stock"
- `doh_rank` and `item_class_priority` vary per SKU and directly predict allocation outcomes

**Derivation Notes:**

```python
# 0.1: Aggregate hourly forecast to daily
demand_forecast_next_day = SUM(forecasted_demand) WHERE forecast_date = T+1

# 0.2: Convert DOH to hours
run_out_time_hours = (POD_INVENTORY / BASE_RR) * 24  # BASE_RR is daily

# 0.3: From movement plan tables (union ambient + cold)
next_inbound_eta_hours = DATEDIFF(hour, CURRENT_TIMESTAMP, delivery_date)

# 0.4: Core shortfall ratio
supply_demand_ratio = (POD_INVENTORY + TRANSFER_QTY + INTRANSIT_QTY) / demand_forecast_next_day

# 0.5: Days to nearest festival (negative = days after)
days_to_festival = MIN(festival_date - current_date) WHERE festival_date BETWEEN current_date-1 AND current_date+7

# 0.6: Festival demand multiplier (category-specific)
festival_demand_multiplier = festival_intensity IF sku_category IN affected_categories ELSE 1.0

# 0.7: POD capacity utilization (from im_mp_pod_constraint)
pod_capacity_utilization_pct = pod_stock / inventory_capacity

# 0.8: FEFO adherence (from fefo table, join on POD_ID = STORE_ID)
fefo_adherence_pct = FEFO_FOLLOWED / TOTAL_FEFO_TASK

# 0.9: Availability trend (slope over 3 days)
availability_trend_3d = (AVAILABILITY_T - AVAILABILITY_T2) / 2  # Simple 2-point slope

# 0.10: Stock velocity (depletion rate)
stock_velocity = (POD_STOCK_T2 - POD_INVENTORY) / 2  # Negative = depleting

# 0.11: WH OOS days in past 7 days (rolling count)
wh_oos_days_7d = COUNT(*) WHERE WH_STOCK1 = 0 AND DT BETWEEN T-7 AND T-1

# 0.12: Contract expiring soon (join on ITEM_CODE + CITY)
contract_expiring_soon = (nlc_base_about_to_expire = 1) FROM im_contract_master_realtime

# 0.13: DOH Rank (from movement plan - join on DATE, STORE_ID, ITEM_CODE)
doh_rank = DOH_RANK FROM im_mp_ambient_plan_30min WHERE PLAN = 'BAU_DAY_1'

# 0.14: Sufficiency flag (from movement plan)
sufficiency_flag = (SUFFICENCY = 'Yes') FROM im_mp_ambient_plan_30min

# 0.15: Item class priority (join on ITEM_CLASS)
item_class_priority = priority FROM scmmp.item_class_priority

# 0.16: Plan type (categorical)
plan_type = PLAN FROM im_mp_ambient_plan_30min  # Values: DD_DAY_1, BAU_DAY_1, BAU_NIGHT_1, etc.

# FUTURE (Cross-POD only):
# 0.17: WH sufficiency ratio (aggregate calculation)
# wh_sufficiency_ratio = wh_stock / SUM(rank_demand) OVER (PARTITION BY item_code, wh_name)

# 0.18: Pod priority (constant per pod - only useful for cross-pod comparison)
# pod_priority = POD_PRIORITY FROM im_mp_pod_settings
```

**Festival Calendar CSV:** Pre-populated file (`data/indian_festivals.csv`) covering training data period (2025-2026).

| Column | Type | Description |
|--------|------|-------------|
| `date` | DATE | Festival date |
| `festival_name` | STRING | e.g., "Diwali", "Holi", "Eid" |
| `intensity` | FLOAT | Base demand multiplier (2.0 - 10.0) |
| `affected_categories` | STRING | Pipe-separated L1 categories: "sweets\|dry_fruits\|gifting" |
| `pre_festival_days` | INT | Days before when demand starts building (3-7) |

**Festival Impact Reference:**

| Festival | Intensity | Affected Categories | Pre-Festival Days |
|----------|-----------|---------------------|-------------------|
| Diwali | 10.0 | sweets, dry_fruits, gifting, cleaning, snacks | 7 |
| Holi | 5.0 | colors, snacks, beverages, dairy | 3 |
| Eid | 4.0 | meat, spices, dairy, rice | 3 |
| Christmas/NYE | 4.0 | cakes, chocolates, beverages, party_supplies | 5 |
| Ganesh Chaturthi | 4.0 | modak_ingredients, fruits, dairy | 3 |
| Raksha Bandhan | 3.0 | sweets, gifting | 2 |
| Onam | 3.0 | banana, rice, vegetables, dairy | 3 |
| Durga Puja | 4.0 | sweets, fruits, fish | 5 |

---

### TIER 1: Must-Have Signals (18 signals)

Core inventory, supply chain, and temporal signals that directly indicate OOS risk.

| # | Signal | Type | Source | Column(s) | Description |
|---|--------|------|--------|-----------|-------------|
| 1 | `pod_inventory` | INT | RCA | `POD_OPENING_STOCK_T_DAY` | Current stock at the dark store (POD) at start of day. **Primary OOS indicator** - Zero or near-zero stock means imminent OOS. |
| 2 | `wh_inventory` | INT | RCA | `WH_STOCK1` | Stock available at the mother warehouse. **Upstream supply signal** - If WH is also OOS, replenishment is impossible. 72% of OOS is WH-led. |
| 3 | `run_rate` | FLOAT | RCA | `BASE_RR`, `MOVEMENT_RR` | Daily consumption rate (units/day) at the POD. **Depletion velocity** - High run rate + low stock = fast OOS. Used to calculate DOH. |
| 4 | `effective_doh` | FLOAT | RCA | `DOH` | Days of inventory on hand (stock ÷ run rate). **Strongest single predictor** - DOH < 1.0 correlates with ~85% OOS risk. |
| 5 | `free_doh` | FLOAT | RCA | `FREE_DOH` | DOH of freely available (non-reserved) stock. **True availability** - Accounts for stock already committed to orders. |
| 6 | `cutoff_doh` | FLOAT | RCA | `CUTOFF_DOH` | System-defined minimum DOH threshold for reorder trigger. **Reorder benchmark** - Comparing actual DOH to cutoff reveals if replenishment should have been triggered. |
| 7 | `transfer_qty` | INT | RCA | `TRANSFER_QTY` | Quantity currently in-transit from WH to POD. **Incoming supply** - Non-zero transfer means OOS may resolve soon. Reduces false positives. |
| 8 | `wh_doh` | FLOAT | Vendor Portal | `WhDoh` | Days of inventory at warehouse level. **Upstream health** - Low WH DOH signals supply chain stress affecting multiple PODs. |
| 9 | `supplier_fillrate` | FLOAT | Vendor Portal | `FillRate` | % of ordered qty actually delivered by supplier. **Supplier reliability** - Low fillrate (<80%) indicates chronic supply issues. |
| 10 | `open_po_qty` | INT | Vendor Portal | `open_po_qty` | Quantity on pending purchase orders not yet received. **Pipeline supply** - High open PO qty suggests supply is coming. Zero means no relief expected. |
| 11 | `otif_issue` | BOOL | RCA | `OTIF_ISSUE` | On-Time-In-Full delivery failure flag. **Supplier failure signal** - Recent OTIF miss indicates unreliable supplier. OOS likely to persist. |
| 12 | `planning_issue` | BOOL | RCA | `PLANNING_ISSUE` | Demand planning/forecasting failure flag. **System failure** - Indicates SKU wasn't ordered because forecast was wrong. |
| 13 | `otb_blocked` | BOOL | RCA | `OTB_BLOCK` | Open-To-Buy budget blocked flag. **Procurement blocker** - Even if stock is needed, POs cannot be raised. Guaranteed OOS continuation. |
| 14 | `pod_active` | BOOL | RCA | `POD_ACTIVE_FLAG` | Whether SKU is active/enabled at this POD. **Config check** - Inactive SKUs show as OOS but aren't actionable. Filter out false signals. |
| 15 | `day_of_week` | INT | Derived | `DAYOFWEEK(DT)` | Day of week (1=Sunday, 7=Saturday). **Demand pattern** - Weekend vs weekday demand differs. Certain days have higher OOS risk. |
| 16 | `is_weekend` | BOOL | Derived | `DAYOFWEEK(DT) IN (1,7)` | Saturday or Sunday flag. **Demand surge** - Weekends typically have higher demand and fewer replenishment runs. |
| 17 | `is_month_end` | BOOL | Derived | `DAY(DT) >= 28` | Last 3 days of month flag. **Budget cycles** - Month-end often sees budget constraints, delayed POs, and supplier pushes. |
| 18 | `days_since_inward` | INT | RCA | `DATEDIFF(DT, LATEST_INWARD_DT)` | Days since last stock receipt at POD. **Replenishment recency** - Long gap (>7 days) suggests supply chain disruption or low priority. |

---

### TIER 2: Historical, Classification & Trend Signals (15 signals)

Historical patterns, SKU attributes, and trend indicators that provide context.

| # | Signal | Type | Source | Column(s) | Description |
|---|--------|------|--------|-----------|-------------|
| 19 | `oos_count_7d` | INT | RCA | `AVAILABILITY` (rolling) | Number of OOS days in past 7 days. **Recent OOS pattern** - SKUs with recent OOS history are more likely to go OOS again. |
| 20 | `oos_count_30d` | INT | RCA | `AVAILABILITY` (rolling) | Number of OOS days in past 30 days. **Chronic OOS indicator** - High count suggests structural supply issues, not one-off events. |
| 21 | `avg_availability_7d` | FLOAT | RCA | `AVAILABILITY` (rolling) | Average availability % over past 7 days. **Stability indicator** - Low average despite current stock suggests volatile SKU. |
| 22 | `wh_avl_delta_l30` | FLOAT | Vendor Portal | `WhAvl_L30_Delta` | Change in WH availability over past 30 days. **Trend direction** - Declining WH availability signals worsening upstream supply. |
| 23 | `fillrate_l30` | FLOAT | Vendor Portal | `FillRate_L30` | 30-day rolling supplier fill rate. **Supplier trend** - More stable than point-in-time. Captures consistent underperformance. |
| 24 | `category` | STR | RCA | `NEW_L1`, `L2` | Product category (L1/L2 hierarchy). **Category behavior** - Different categories have different OOS patterns (e.g., dairy vs snacks). |
| 25 | `item_class` | STR | RCA | `ITEM_CLASS`, `GMV_BAND` | SKU importance tier (Top 50, Top 100, MSKU, etc.). **Priority segmentation** - Top SKUs get tighter DOH thresholds. |
| 26 | `is_bradman` | BOOL | RCA | `ASSORTMENT IN ('A','MLT','MnE')` | Whether SKU is in top 20% assortment. **Scope filter** - Bradman SKUs are focus of this POC. Also indicates business criticality. |
| 27 | `movement_rr` | FLOAT | RCA | `MOVEMENT_RR` | Movement replenishment rate (system-calculated). **Replenishment signal** - NULL or 0.001 means movement is blocked. No auto-replenishment. |
| 28 | `erp_enabled` | BOOL | RCA | `ERP_ISSUE` | Whether ERP ordering is enabled for this SKU. **System integration** - Disabled ERP means manual ordering only. Higher OOS risk. |
| 29 | `fresh_flag` | BOOL | RCA | `FRESH_FLAG` | Whether item is fresh/perishable. **Shelf life constraint** - Fresh items have shorter windows. OOS recovery is harder. |
| 30 | `ambient_cold` | STR | RCA | `AMBIENT_COLD` | Storage type (Ambient/Cold chain). **Operational constraint** - Cold chain has capacity limits. Different OOS dynamics. |
| 31 | `expected_qty` | INT | RCA | `EXPECTED_QTY` | Quantity expected from most recent PO. **Order size** - Large expected qty suggests bulk replenishment expected. |
| 32 | `received_qty` | INT | RCA | `RECEIVED_QTY` | Quantity actually received from most recent PO. **Delivery reality** - Comparing to expected shows recent supplier performance. |
| 33 | `sku_po_fillrate` | FLOAT | RCA | `RECEIVED_QTY/EXPECTED_QTY` | Received ÷ Expected for this specific SKU. **SKU-level reliability** - Some SKUs have chronic short-shipment issues. |

---

### TIER 3: Advanced & Constraint Signals (17 signals)

Demand signals, operational constraints, and system-level blockers.

| # | Signal | Type | Source | Column(s) | Description |
|---|--------|------|--------|-----------|-------------|
| 34 | `yesterday_sales` | INT | RCA | `SALES` | Units sold yesterday at this POD. **Recent demand proxy** - High sales yesterday means faster depletion. Adjust DOH expectations. |
| 35 | `avail_sessions` | INT | RCA | `AVAIL_SESSIONS` | Customer sessions where SKU was available. **Demand exposure** - High sessions = high visibility SKU. OOS impact is larger. |
| 36 | `non_avail_sessions` | INT | RCA | `NON_AVAIL_SESSIONS` | Customer sessions where SKU was unavailable. **Lost demand** - Direct measure of customer impact from OOS. |
| 37 | `search_impressions` | INT | Search Impr (SF) | `TOTAL_IMP` | Times SKU appeared in customer searches. **Demand signal** - High impressions = customers actively looking. OOS loses conversions. |
| 38 | `potential_sales_loss` | FLOAT | Vendor Portal | `PotentialSalesLossInAmount` | Estimated revenue lost due to OOS (₹). **Business impact** - Monetizes OOS. Useful for prioritization and model weighting. |
| 39 | `in_transit_qty` | INT | RCA | `INTRANSIT_QTY` | Quantity in-transit from supplier to WH. **Pipeline visibility** - Non-zero means WH replenishment coming. Affects WH DOH forecast. |
| 40 | `wh_outbound_fillrate` | FLOAT | RCA | `POD_FILLRATES` | % of POD orders fulfilled by WH. **WH→POD reliability** - Low fillrate means WH can't meet POD requests. |
| 41 | `putaway_delay` | BOOL | RCA | `PUTAWAY_DELAY` | Stock received at WH but not yet putaway. **Operational bottleneck** - Stock exists but isn't available for dispatch. |
| 42 | `wh_long_term_supply` | BOOL | RCA | `WH_LONG_TERM_SUPPLY_ISSUE` | Chronic supply issue at WH level. **Structural problem** - Long-term issue won't resolve quickly. OOS likely to persist. |
| 43 | `wh_fillrate_issue` | BOOL | RCA | `WH_FILLRATE_ISSUE` | WH unable to fulfill POD orders. **Immediate blocker** - WH can't ship even if POD requests. |
| 44 | `wh_last_po_fillrate_issue` | BOOL | RCA | `WH_LAST_PO_FILLRATE_ISSUE` | Most recent PO had fillrate problems. **Recent failure** - Supplier failed recently. Next PO may also fail. |
| 45 | `vendor_code_missing` | BOOL | RCA | `VENDOR_CODE_NOT_AVAILABLE` | Vendor not set up in system. **Setup blocker** - Can't raise PO without vendor code. Requires manual intervention. |
| 46 | `contract_missing` | BOOL | RCA | `CONTRACT_NOT_AVAILABLE` | No active contract for this SKU. **Commercial blocker** - Can't order without contract. Procurement team must resolve. |
| 47 | `mov_moq_constraint` | BOOL | RCA | `MOV_MOQ_TONNAGE_CONSTRAINT` | MOQ/MOV preventing order. **Quantity blocker** - Order needed is below minimum. Can't replenish until threshold met. |
| 48 | `case_size_constraint` | BOOL | RCA | `CASE_SIZE_CONSTRAINT` | Case size mismatch blocking order. **Packaging blocker** - System can't create valid order due to case size requirements. |
| 49 | `vinculum_error` | BOOL | RCA | `VINCULUM_ERROR` | WMS system error in Vinculum. **System failure** - Technical issue blocking WH operations. Usually resolves within 24h. |
| 50 | `pod_stock_t2` | INT | RCA | `POD_STOCK_T2` | POD stock from 2 days ago. **Trend detection** - Compare T-2 → T-1 → T-0 to see depletion velocity and direction. |

---

**Total: 50 signals** (21 new signals identified from schema analysis)

---

## Appendix B: Pre-Computed Binary Flags

**25 flags in RCA table** ready to use:

**Stock & Capacity:**
`STOCK_ISSUE`, `STOCK_SUFFI_ISSUE`, `SPACE_ISSUE`, `SPACE_ISSUE1`, `POD_CAPACITY_ISSUE2`, `POD_CAP_MISSED`, `WH_CAPACITY_ISSUE2`, `WH_CAP_MISSED`

**Supplier & Fillrate:**
`WH_FILLRATE_ISSUE`, `WH_LAST_PO_FILLRATE_ISSUE`, `POD_FILLRATES_ISSUE`, `OTIF_ISSUE`, `WH_LONG_TERM_SUPPLY_ISSUE`

**Movement & ERP:**
`MOVEMENT_BLOCKED_LIST`, `MOVEMENT_RR_BLOCKED`, `MOVEMENT_RR_NOT_GENERATED`, `MOVEMENT_SETTING_ISSUE`, `MOVEMENT_DESIGN_ISSUE`, `ERP_TEMP_DISABLE`, `ERP_BLOCK_LIST`, `ERP_ISSUE`

**Procurement & System:**
`PLANNING_ISSUE`, `PUTAWAY_DELAY`, `VENDOR_CODE_NOT_AVAILABLE`, `CONTRACT_NOT_AVAILABLE`, `OTB_BLOCK`, `VINCULUM_ERROR`, `MOV_MOQ_TONNAGE_CONSTRAINT`, `CASE_SIZE_CONSTRAINT`

---

## Appendix C: Verified Table Access

*Verified: 2026-01-16* | **22/22 tables confirmed** (19 original + 3 stock sufficiency tables)

### Primary Tables

| # | Table | Platform | Full Path |
|---|-------|----------|-----------|
| 1 | **RCA Table** | Databricks | `prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7` |
| 2 | **Contract Master** | Databricks | `prod.analytics_prod.im_contract_master_realtime` |
| 3 | **Reason Mapping** | Databricks | `prod.analytics_adhoc.final_reason_mapping_avail_rca` |
| 4 | **Vendor Portal** | Databricks | `prod.analytics_prod.im_vendor_portal_availability_module_daily` |
| 5 | **Procurement PO** | Databricks | `prod.dash_erp_engg.scm_procurement_po` |
| 6 | **Inventory Availability** | Databricks | `prod.dash_erp_engg.dash_scm_inventory_availability` |
| 7 | **Weighted Availability** | Snowflake | `ANALYTICS.PUBLIC.WEIGHTED_AVAILABILITY_DAILY_UPDATE` |

**Table Descriptions:**

1. **RCA Table** - Daily SKU×POD availability with pre-computed RCA. **Primary data source**. Granularity: Daily, SKU×POD.

2. **Contract Master** - SKU contracts, brand/supplier mappings. Granularity: SKU level (static).

3. **Reason Mapping** - RCA reason codes → categories. Reference table.

4. **Vendor Portal** - Vendor-level availability, fill rates. Granularity: Daily, SKU×City.

5. **Procurement PO** - PO headers, states, delivery dates. Granularity: PO level.

6. **Inventory Availability** - Real-time stock positions. Granularity: Near real-time, SKU×Store.

7. **Weighted Availability** - Impression-weighted availability. Granularity: Daily, SKU×POD.

### Secondary Tables

| # | Table | Platform | Full Path |
|---|-------|----------|-----------|
| 8 | **Parent Orders** | Databricks | `prod.transformer.instamart_parent_orders` |
| 9 | **Hourly Availability** | Snowflake | `ANALYTICS.PUBLIC.PR_HR_LEVEL_AVL` |
| 10 | **Search Impressions** | Snowflake | `ANALYTICS.PUBLIC.SRK_IMPRESSIONS_METRICS_TRANS` |
| 11 | **PO Details** | Databricks | `prod.dash_erp_engg.scm_procurement_po_details` |

### Warehouse Tables

| # | Table | Platform | Full Path |
|---|-------|----------|-----------|
| 12 | **Vinculum Invbal** | Databricks | `prod.vinculum_swiggy_gamma.invbal` |
| 13 | **Vinculum Inbound** | Databricks | `prod.vinculum_swiggy_gamma.inbound` |
| 14 | **Vinculum Dispatch** | Databricks | `prod.vinculum_swiggy_gamma.dispatch` |

### Movement Planning Tables

| # | Table | Platform | Full Path |
|---|-------|----------|-----------|
| 15 | **Ambient Movement Plan** | Databricks | `prod.analytics_prod.im_mp_ambient_plan_30min` |
| 16 | **Cold Movement Plan** | Databricks | `prod.analytics_prod.im_mp_cold_plan_30min` |
| 17 | **Demand Forecast (TFT)** | **Snowflake** | `data_science.ds_storefront.im_pod_hr_demand_forecasting` |

> ⚠️ **Note**: Table 17 (TFT Demand Forecast) is in **Snowflake**, not Databricks. Access via `snow sql` connector, not `dbr.py`. Requires Snowflake access grants.

### POD Operational Tables

| # | Table | Platform | Full Path |
|---|-------|----------|-----------|
| 18 | **POD Constraint** | Databricks | `prod.analytics_prod.im_mp_pod_constraint` |
| 19 | **FEFO Adherence** | Databricks | `prod.analytics_prod.fefo` |

### Stock Sufficiency Tables (NEW)

| # | Table | Platform | Full Path |
|---|-------|----------|-----------|
| 20 | **Movement Plan 30min** | Databricks | `prod.analytics_prod.im_mp_ambient_plan_30min` |
| 21 | **Item Class Priority** | Databricks | `prod.scmmp.item_class_priority` |
| 22 | **Pod Settings** | Databricks | `prod.analytics_prod.im_mp_pod_settings` |

**New Table Descriptions:**

20. **Movement Plan 30min** - Snapshot of movement planning output partitioned by DATE and PLAN. Key columns for POC: `DOH_RANK` (allocation priority), `SUFFICENCY` (Yes/No allocation decision), `PLAN` (plan type like BAU_DAY_1, DD_DAY_1). **Critical for single-POD prediction.** Granularity: Daily, SKU×POD.

21. **Item Class Priority** - Static lookup table with item class priority rankings. 18 classes from priority=1 (TOP 50) to priority=18 (DEFAULT). **Critical for single-POD prediction.** Granularity: Item class level.

22. **Pod Settings** - Pod configuration with `POD_PRIORITY` (1-10 ranking within WH). **For future cross-POD expansion only** — constant for single POD. Granularity: POD level.

**Table Descriptions:**

15. **Ambient Movement Plan** - Forward-looking movement plan for ambient (room-temp) FMCG SKUs. Contains `DATE` (delivery date at POD), `STORE_ID`, `ITEM_CODE`, `TRANSFER_QTY` (planned movement quantity), `DOH`, `PROJECTION` (run rate). Updated multiple times daily (DD_DAY, BAU_DAY, etc.). Granularity: Daily, SKU×POD.

16. **Cold Movement Plan** - Forward-looking movement plan for cold chain SKUs (dairy, meat, eggs, ice cream). Same structure as ambient table with key columns: `date`, `STORE_ID`, `ITEM_CODE`, `TRANSFER_QTY`, `DOH`, `PROJECTION`. Note: `STORE_ID` is decimal type (needs casting). Granularity: Daily, SKU×POD.

17. **Demand Forecast (TFT)** - Temporal Fusion Transformer model output for demand forecasting. Contains hourly demand predictions per SKU×POD. Used to derive `demand_forecast_next_day` signal. Granularity: Hourly, SKU×POD.

18. **POD Constraint** - Daily POD capacity and utilization data. Key columns: `date`, `store_id`, `inventory_capacity` (total capacity), `pod_stock` (current stock), `pod_cap_unutilised` (remaining capacity). Used to derive `pod_capacity_utilization_pct`. Granularity: Daily, POD level.

19. **FEFO Adherence** - Daily FEFO (First Expiry First Out) compliance tracking per POD. Key columns: `TASK_DATE`, `POD_ID`, `FEFO_FOLLOWED` (compliant tasks), `TOTAL_FEFO_TASK` (total tasks). Used to derive `fefo_adherence_pct`. Join on POD_ID = STORE_ID. Granularity: Daily, POD level.

**Union Query for Movement Planning (Ambient + Cold):**

```sql
SELECT DATE AS delivery_date, CAST(STORE_ID AS STRING) AS store_id,
       ITEM_CODE, CAST(TRANSFER_QTY AS DOUBLE) AS transfer_qty, 'AMBIENT' AS storage_type
FROM prod.analytics_prod.im_mp_ambient_plan_30min
WHERE DATE >= CURRENT_DATE() AND CAST(TRANSFER_QTY AS DOUBLE) > 0
UNION ALL
SELECT date AS delivery_date, CAST(STORE_ID AS STRING) AS store_id,
       ITEM_CODE, TRANSFER_QTY, 'COLD' AS storage_type
FROM prod.analytics_prod.im_mp_cold_plan_30min
WHERE date >= CURRENT_DATE() AND TRANSFER_QTY > 0
```

---

## Appendix D: Checkpoint Protocol

At each **inner loop boundary** (after 4 iterations), Claude produces artifacts in `outer_loops/outer_loop_1/inner_loops/inner_loop_N/`:

### Inner Loop Folder Contents

```
outer_loops/outer_loop_1/inner_loops/inner_loop_N/
├── INNER_LOOP_LEARNINGS.md   # Synthesis of 4 iterations (required)
├── metrics_summary.json      # Comparison of 4 iterations
├── errors_analysis.csv       # FP/FN samples with context
├── feature_importance.csv    # Feature rankings
├── decisions.md              # Questions for human review
├── best_model.pkl            # Best model from this inner loop
└── iterations/
    ├── iteration_X.json      # Config + metrics + notes
    ├── iteration_X+1.json
    ├── iteration_X+2.json
    └── iteration_X+3.json
```

### 1. Iteration JSON (`iterations/iteration_N.json`)

```json
{
  "iteration": 5,
  "inner_loop": 2,
  "timestamp": "2026-01-16T14:30:00",
  "reproducibility": {
    "random_seed": 42,
    "python_version": "3.10.12",
    "sklearn_version": "1.3.0",
    "pandas_version": "2.0.3"
  },
  "config": {
    "model": "LogisticRegression",
    "features": ["doh", "wh_stock", "transfer_qty", ...],
    "params": {"C": 1.0, "class_weight": "balanced", "random_state": 42},
    "composite_features": ["doh_vs_cutoff", "critical_low_stock"]
  },
  "metrics": {
    "T1": {"f1": 0.52, "precision": 0.61, "recall": 0.45, "auc": 0.78},
    "T2": {"f1": 0.48, "precision": 0.55, "recall": 0.42, "auc": 0.74},
    "T3": {"f1": 0.41, "precision": 0.50, "recall": 0.35, "auc": 0.70}
  },
  "vs_baseline": {
    "doh_rule_f1": 0.42,
    "improvement_pct": 23.8
  },
  "notes": {
    "change_from_prev": "Added oos_count_7d feature",
    "observation": "Recall improved 5% but precision unchanged",
    "next_idea": "Try adding category features"
  }
}
```

### 2. Metrics Summary (`metrics_summary.json`)

```json
{
  "inner_loop": 2,
  "iterations": [5, 6, 7, 8],
  "best_iteration": 7,
  "iterations_summary": [
    {"iter": 5, "T1_f1": 0.52, "change": null},
    {"iter": 6, "T1_f1": 0.54, "change": "+3.8%"},
    {"iter": 7, "T1_f1": 0.57, "change": "+5.6%"},
    {"iter": 8, "T1_f1": 0.55, "change": "-3.5%"}
  ],
  "inner_loop_improvement": "+9.6% from iter 5 to best",
  "vs_previous_inner_loop": "+5.2% vs inner_loop_1 best"
}
```

### 3. Errors Analysis (`errors_analysis.csv`)

| item_code | store_id | dt | prediction | actual | doh | wh_stock | transfer_qty | confidence | error_type | likely_reason |
|-----------|----------|-----|------------|--------|-----|----------|--------------|------------|------------|---------------|
| SKU001 | POD123 | 2026-01-10 | 1 | 0 | 0.8 | 500 | 100 | 0.92 | FP | Transfer resolved OOS |
| SKU002 | POD123 | 2026-01-11 | 0 | 1 | 2.1 | 0 | 0 | 0.15 | FN | WH OOS not captured |

**Sample Selection Method** (50 total = 25 FP + 25 FN):
1. **Worst confidence errors** (15 per type): Errors where model was most confident but wrong
2. **Stratified by feature** (10 per type): Sample across DOH buckets (<0.5, 0.5-1, 1-2, 2+) and categories

- `confidence` is model's predicted probability
- `likely_reason` is Claude's hypothesis for why the error occurred

### 4. Feature Importance (`feature_importance.csv`)

| rank | feature | importance | correlation | trend_vs_prev | recommendation |
|------|---------|------------|-------------|---------------|----------------|
| 1 | doh | 0.35 | -0.72 | stable | keep |
| 2 | wh_stock | 0.22 | -0.58 | +15% | keep |
| 3 | doh_vs_cutoff | 0.18 | -0.65 | new | keep (composite) |
| 15 | is_weekend | 0.01 | 0.02 | -50% | consider dropping |

### 5. Decisions (`decisions.md`)

```markdown
## Decisions for Human Review - Inner Loop N

### 1. Class Imbalance Strategy
**Context**: Tried class_weight='balanced', F1 improved 8%.
**Question**: Should I also try SMOTE or threshold optimization?
**My recommendation**: Try threshold optimization first (cheaper).

### 2. DOH Threshold
**Context**: DOH < 0.8 performs better than DOH < 1.0 for T+1.
**Question**: Should I update the derived feature?
**My recommendation**: Yes, also try DOH < 1.5 for T+3.

### 3. Category-Specific Models
**Context**: Dairy has 2x OOS rate but different feature importance.
**Question**: Should I train separate model for dairy?
**My recommendation**: Try in inner loop 3 after validating on more categories.
```

### Human Review Actions

At each inner loop checkpoint, human reviews `outer_loops/outer_loop_1/inner_loops/inner_loop_N/` folder and provides:
- Approval to continue (or halt for deeper investigation)
- Answers to decision questions in `decisions.md`
- Strategy adjustments for next inner loop
- Domain insights on error patterns from `errors_analysis.csv`

**Review Protocol**: Claude **waits** for human review before starting next inner loop. No auto-continue. Human is expected to be available and responsive during POC execution.

### Outer Loop Completion

After all 5 inner loops (20 iterations), Claude writes `outer_loops/outer_loop_1/OUTER_LOOP_LEARNINGS.md` with final synthesis.
