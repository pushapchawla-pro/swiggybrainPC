# OOS Prediction POC - Execution Plan

**Reference**: [PLAN.md](./PLAN.md) for full details, signal catalog, and appendices.

---

## Quick Reference

```
Goal: Predict OOS at T+1/T+2/T+3 for single POD × Bradman SKUs
Target: F1 > 0.60 (T+1), > 0.55 (T+2), > 0.50 (T+3)
Structure: 5 inner loops × 4 iterations = 20 experiments
```

---

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 0: PREREQUISITES                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Databricks  │  │  Snowflake   │  │  Python ML   │  │  Festival    │     │
│  │  Connector   │  │  Connector   │  │  Libraries   │  │  CSV         │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────────────────────┬─────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PHASE 1: SETUP (Steps 1-6)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐       │
│  │ Step 1  │──▶│Step 1.5 │──▶│ Step 2  │──▶│ Step 3  │──▶│Step 3.5 │       │
│  │ Verify  │   │Preflight│   │ Schema  │   │ Select  │   │ Size    │       │
│  │ Access  │   │ Tables  │   │  Docs   │   │  POD    │   │Estimate │       │
│  └─────────┘   └────┬────┘   └─────────┘   └─────────┘   └────┬────┘       │
│                     │ FAIL?                                    │            │
│                     └──────▶ STOP & FIX                        │            │
│                                                                ▼            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Step 4: Extract Features ──▶ Step 5: EDA ──▶ Step 6: Model Script  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Outputs: raw_features.parquet, eda/*.json, oos_predictor.py               │
└───────────────────────────────────────────┬─────────────────────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 2: ITERATIONS (Step 7)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ INNER LOOP 1 (LogReg)           iter 1 ─▶ 2 ─▶ 3 ─▶ 4               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                            │                                │
│                          ══════════════════╪══════════════════              │
│                          ║ 🛑 CHECKPOINT L1 ║                               │
│                          ══════════════════╪══════════════════              │
│                                            ▼                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ INNER LOOP 2 (+ history)        iter 5 ─▶ 6 ─▶ 7 ─▶ 8               │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                            │                                │
│                          ══════════════════╪══════════════════              │
│                          ║ 🛑 CHECKPOINT L2 ║                               │
│                          ══════════════════╪══════════════════              │
│                                            ▼                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ INNER LOOP 3 (Tree/RF)          iter 9 ─▶ 10 ─▶ 11 ─▶ 12            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                            │                                │
│                          ══════════════════╪══════════════════              │
│                          ║ 🛑 CHECKPOINT L3 ║                               │
│                          ══════════════════╪══════════════════              │
│                                            ▼                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ INNER LOOP 4 (XGBoost)          iter 13 ─▶ 14 ─▶ 15 ─▶ 16           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                            │                                │
│                          ══════════════════╪══════════════════              │
│                          ║ 🛑 CHECKPOINT L4 ║                               │
│                          ══════════════════╪══════════════════              │
│                                            ▼                                │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ INNER LOOP 5 (Best tuning)      iter 17 ─▶ 18 ─▶ 19 ─▶ 20           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                            │                                │
│                          ══════════════════╪══════════════════              │
│                          ║ 🛑 CHECKPOINT L5 ║                               │
│                          ══════════════════╪══════════════════              │
│                                            │                                │
└────────────────────────────────────────────┼────────────────────────────────┘
                                             │
                                             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PHASE 3: COMPLETION                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│         ┌──────────────────────┐         ┌──────────────────────┐          │
│         │  Targets met?        │   YES   │  Production ready    │          │
│         │  T+1 > 0.60         │────────▶│  Document & ship     │          │
│         └──────────┬───────────┘         └──────────────────────┘          │
│                    │ NO                                                     │
│                    ▼                                                        │
│         ┌──────────────────────┐                                            │
│         │  Archive as POC      │                                            │
│         │  Document learnings  │                                            │
│         └──────────────────────┘                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Prerequisites

```
┌─────────────────────────────────────────────────────────────┐
│  VERIFY BEFORE STARTING                                     │
├─────────────────────────────────────────────────────────────┤
│  □ python scripts/dbr.py status          # Databricks auth  │
│  □ snow sql -c swiggy -q "SELECT 1"      # Snowflake auth   │
│  □ python -c "import pandas, sklearn, xgboost"  # ML libs   │
│  □ data/indian_festivals.csv exists      # Festival data    │
└─────────────────────────────────────────────────────────────┘
```

**If any fails**: Fix before proceeding. See [PLAN.md#claude-code-prerequisites](./PLAN.md#claude-code-prerequisites).

---

## Phase 1: Setup (Steps 1-6)

### Step 1: Verify Access & Data Freshness
```sql
-- Must return date within last 2 days
SELECT MAX(DT) FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'Bangalore'
```
**Output**: Console confirmation | **Fail**: Stop, log to `errors/error_log.md`

---

### Step 1.5: Preflight All Tables
Run queries from [PLAN.md#step-15](./PLAN.md#step-15-verify-all-tables-pre-flight-check):
- Historical coverage (60+ days)
- Join key compatibility (>80% match)
- Data freshness (<3 days stale)

**Output**: `preflight_check.json` | **Fail**: Stop, document blockers

---

### Step 2: Document Schemas
```bash
# For each of 22 tables in Appendix C
python scripts/dbr.py execute -q "DESCRIBE TABLE <table_name>" > schemas/tables/<table_name>.md
```
**Output**: `schemas/tables/*.md` (22 files)

---

### Step 3: Select Target POD
```sql
-- Run query from PLAN.md Step 3
-- Pick POD with best balance of volume + OOS events
```
**Output**: `SELECTED_POD_ID` stored in `config/pod_selection.json`

---

### Step 3.5: Estimate Dataset Size
```sql
SELECT COUNT(*) as rows, COUNT(DISTINCT ITEM_CODE) as skus
FROM rca_table WHERE STORE_ID = '<SELECTED_POD>'...
```
**Expected**: ~30K rows | **If >100K**: Adjust timeout or sample

---

### Step 4: Extract Features
1. Run main extraction query ([PLAN.md#step-4](./PLAN.md#step-4-extract-features-from-rca-table))
2. Join stock sufficiency signals ([PLAN.md#step-41](./PLAN.md#41-stock-sufficiency-signal-joins-new))
3. Add temporal features (day_of_week, is_weekend, is_month_end)
4. Add festival signals from `data/indian_festivals.csv`
5. Construct targets (IS_OOS_T1, IS_OOS_T2, IS_OOS_T3)

**Output**: `data/raw_features.parquet`

---

### Step 5: EDA & Feature Selection
Run analysis per [PLAN.md#step-5](./PLAN.md#step-5-eda--feature-selection):

| Task | Output |
|------|--------|
| 5.1 Target analysis | `eda/target_distribution.json` |
| 5.2 Feature distributions | `eda/feature_stats.json` |
| 5.3 Correlation analysis | `eda/correlations.parquet` |
| 5.4 Binary flag analysis | `eda/flag_lift.json` |
| 5.5 Baseline models | `eda/baseline_metrics.json` |
| 5.6 Calibration baseline | `eda/calibration/` |
| 5.7 Composite features | `eda/composite_features.json` |

**Final outputs**: `eda/feature_config.json`, `eda/oos_analysis.md`

---

### Step 6: Create Model Script
Build `oos_predictor.py` with:
- Databricks query helpers
- Feature engineering from `eda/feature_config.json`
- TimeSeriesSplit cross-validation
- Metric logging to JSON

**Output**: `oos_predictor.py` ready for iterations

---

## Phase 2: Iteration Loops (Step 7)

```
┌────────────────────────────────────────────────────────────────────────┐
│  ITERATION LOOP STRUCTURE                                              │
│                                                                        │
│  Inner Loop 1 (iter 1-4)  → LogReg baseline      → CHECKPOINT L1      │
│  Inner Loop 2 (iter 5-8)  → + history features   → CHECKPOINT L2      │
│  Inner Loop 3 (iter 9-12) → Decision Tree / RF   → CHECKPOINT L3      │
│  Inner Loop 4 (iter 13-16)→ XGBoost              → CHECKPOINT L4      │
│  Inner Loop 5 (iter 17-20)→ Best model tuning    → CHECKPOINT L5      │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Per-Iteration Protocol

```
FOR each iteration N:
  1. Load config from previous iteration (or eda/feature_config.json if N=1)
  2. Apply planned change (feature add/remove, hyperparam, model switch)
  3. Train with TimeSeriesSplit (5 folds)
  4. Evaluate: F1, Precision, Recall, AUC, Brier for T+1/T+2/T+3
  5. Analyze errors (25 FP + 25 FN samples)
  6. Log to iterations/iteration_N.json
  7. Commit: git commit -m "iter-N: <change description>"
  8. Update CURRENT_STATE.md with learnings
```

**Iteration JSON schema**: See [PLAN.md#appendix-d](./PLAN.md#appendix-d-checkpoint-protocol)

---

### Checkpoint Protocol

At iterations 4, 8, 12, 16, 20:

```
1. Write INNER_LOOP_LEARNINGS.md (synthesis of 4 iterations)
2. Write metrics_summary.json (comparison table)
3. Write errors_analysis.csv (50 error samples)
4. Write decisions.md (questions for human)
5. Save best_model.pkl
6. Commit: git commit -m "L{N}-checkpoint: Inner loop {N} complete"
7. Tag: git tag -a "L{N}-checkpoint" -m "Best F1: X.XX"
8. STOP and output:

═══════════════════════════════════════════════════════════════
CHECKPOINT L{N}: Awaiting human review

Review: outer_loops/outer_loop_1/inner_loops/inner_loop_{N}/
Reply: "continue" or provide guidance
═══════════════════════════════════════════════════════════════
```

---

## Phase 3: Completion

### If Targets Met
```
□ Write OUTER_LOOP_LEARNINGS.md
□ Document production recommendations
□ Final commit and tag
```

### If Targets Not Met (after 20 iterations)
```
□ Write OUTER_LOOP_LEARNINGS.md with failure analysis
□ Archive as exploratory POC
□ Document learnings for future POC design
```

---

## Folder Structure

```
scm/pocs/oos-prediction-poc-0.1/
├── PLAN.md                    # Full specification (reference)
├── EXECUTION.md               # This file (runbook)
├── CURRENT_STATE.md           # Living state file (updated each iteration)
├── oos_predictor.py           # Main model script
├── requirements.txt           # Python dependencies
│
├── config/
│   └── pod_selection.json     # Selected POD
│
├── data/
│   ├── indian_festivals.csv   # Festival calendar
│   ├── raw_features.parquet   # Extracted features
│   └── processed_features.parquet
│
├── eda/
│   ├── feature_config.json
│   ├── composite_features.json
│   ├── baseline_metrics.json
│   ├── calibration/
│   └── oos_analysis.md
│
├── schemas/tables/            # 22 table schemas
│
├── errors/
│   └── error_log.md           # Blocked issues
│
├── queries/
│   ├── extract_features.sql
│   └── select_pod.sql
│
└── outer_loops/outer_loop_1/
    ├── OUTER_LOOP_LEARNINGS.md
    └── inner_loops/
        ├── inner_loop_1/
        │   ├── INNER_LOOP_LEARNINGS.md
        │   ├── metrics_summary.json
        │   ├── errors_analysis.csv
        │   ├── decisions.md
        │   ├── best_model.pkl
        │   └── iterations/
        │       ├── iteration_1.json
        │       ├── iteration_2.json
        │       ├── iteration_3.json
        │       └── iteration_4.json
        ├── inner_loop_2/ ...
        ├── inner_loop_3/ ...
        ├── inner_loop_4/ ...
        └── inner_loop_5/ ...
```

---

## Error Handling

```
ON ERROR:
  1. Retry once (may be transient)
  2. Try workaround (smaller query, different path)
  3. Log to errors/error_log.md:
     - Error message
     - What was attempted
     - Hypothesis
     - Suggested fix
  4. STOP and wait for human
```

---

## Quick Commands

```bash
# Start fresh session
"Execute Phase 1 setup for OOS POC, starting from Step 1"

# Resume after checkpoint
"Continue OOS POC from L2 checkpoint. Decision: use threshold optimization, skip SMOTE"

# Check current state
cat scm/pocs/oos-prediction-poc-0.1/CURRENT_STATE.md

# View iteration history
git log --oneline --grep="iter-"
```

---

## Human Review Checklist

At each checkpoint, review:

- [ ] `decisions.md` - Answer all questions
- [ ] `errors_analysis.csv` - Validate error patterns make domain sense
- [ ] `metrics_summary.json` - Confirm improvement trend
- [ ] `INNER_LOOP_LEARNINGS.md` - Agree with synthesis

Then reply: `"continue"` or provide specific guidance.
