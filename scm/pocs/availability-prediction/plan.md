# Execution Plan: SKU Availability Prediction POC

**Timeline**: Jan 12 - Jan 30, 2026 (13 working days across 3 weeks)
**Owner**: Claude Code + Human Supervision
**Reference**: [POC Design Doc](../../docs/prediction-driven-context-graphs-poc.md) | [Bandwidth Plan](./execution-bandwidth.md)

> **Note**: Timeline is flexible. Quality over speed. Can extend if blockers arise.

---

### Calendar & Working Days

```
January 2026
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │     │  1  │  2  │  3  │  4  │
│  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 12  │ 13  │ 14  │ 15  │ 16  │ 17  │ 18  │  ← WEEK 1: BUILD
│ D1  │ D2  │ D3  │ HOL │ D4  │ off │ off │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 19  │ 20  │ 21  │ 22  │ 23  │ 24  │ 25  │  ← WEEK 2: SIMULATION
│ D5  │ D6  │ D7  │ D8  │ D9  │ off │ off │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 26  │ 27  │ 28  │ 29  │ 30  │ 31  │     │  ← WEEK 3: LIVE + DEMO
│ HOL │ D10 │ D11 │ D12 │ D13 │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

D# = Working Day    HOL = Holiday    off = Weekend
Holidays: Jan 15 (Thu) Pongal, Jan 26 (Mon) Republic Day
```

| Week | Focus | Working Days | Dates |
|------|-------|--------------|-------|
| **Week 1** | **BUILD** | 4 days | Jan 12-14 (Mon-Wed), Jan 16 (Fri) |
| **Week 2** | **SIMULATION** | 5 days | Jan 19-23 (Mon-Fri) |
| **Week 3** | **LIVE + DEMO** | 4 days | Jan 27-30 (Tue-Fri) |

**Total: 13 working days**

---

### Team Assignments

| Code | Persona | Who | Primary Responsibilities |
|------|---------|-----|-------------------------|
| **EE** | Executing Engineer | **TBD** | Daily Claude Code operation, debugging, pipeline work |
| **PM** | AI Product Manager | Sreeram Sridhar | Coordination, decisions, stakeholder mgmt, checkpoints |
| **AE** | Analytics Expert | Durga (Bhavana backup) | Schema validation, query correctness, domain knowledge |
| **MS** | Metadata Support | Rohit Tiwari | Table schemas, data dictionary |
| **AA** | AI Architect | Sid Panda | Solutioning advisory |
| **DE** | Data Engineering | Swiggy Data Platform | Snowflake access |
| **BIZ** | Business Stakeholders | IM Availability Team | Requirements, pattern validation, sign-off |
| **CC** | Claude Code | Opus 4.5 | Autonomous execution of skills |

> **Legend**: Tasks below are tagged as `[CODE - Person]` (e.g., `[EE - TBD]`, `[AE - Durga]`). See [execution-bandwidth.md](./execution-bandwidth.md) for effort details.

---

## Pre-requisites (Day 0 - Jan 11)

### 1. Table Location Discovery (BLOCKER - Do First)

- [ ] `[PM - Sreeram + AE - Durga → DE - Platform]` **Discover where each table lives** (BLOCKER):
  - For each table listed in "Required Tables" below, determine:
    - Is it in Snowflake? (synced/replicated)
    - Is it in Databricks/Hive only?
    - Is it in both? (if so, which is source of truth?)
  - **Ask Data Engineering team** — they maintain the data catalog
  - **Check Glean** — search for table documentation

  **Document findings** in `brain/metadata/table-locations.md`:
  | Table | Location | Schema/Catalog | Access Method | Notes |
  |-------|----------|----------------|---------------|-------|
  | `weighted_availability_daily_update` | Snowflake / Databricks | | snowsql / dbsqlcli | |
  | `sku_wise_availability_rca_with_reasons_v7` | Snowflake / Databricks | | snowsql / dbsqlcli | |
  | `dash-scm-inventory-availability` | Snowflake / Databricks | | snowsql / dbsqlcli | |
  | `contract-master` | Snowflake / Databricks | | snowsql / dbsqlcli | |
  | `im_parent_order_fact` | Snowflake / Databricks | | snowsql / dbsqlcli | |
  | `scm-procurement-po` | Snowflake / Databricks | | snowsql / dbsqlcli | |
  | `im_vendor_portal_po_module` | Snowflake / Databricks | | snowsql / dbsqlcli | |
  | `dash-scm-inventory-location` | Snowflake / Databricks | | snowsql / dbsqlcli | |
  | `im_pod_hr_demand_forecasting` | Snowflake / Databricks | | snowsql / dbsqlcli | |
  | `vinculum.swiggy_gamma.inbound` | Snowflake / Databricks | | snowsql / dbsqlcli | Likely Hive |
  | `vinculum.swiggy_gamma.invbal` | Snowflake / Databricks | | snowsql / dbsqlcli | Likely Hive |
  | `final_reason_mapping_avail_rca` | Snowflake / Databricks | | snowsql / dbsqlcli | Critical |
  | `scm-procurement-po-details` | Snowflake / Databricks | | snowsql / dbsqlcli | High |
  | `scm-control-room-rules` | Snowflake / Databricks | | snowsql / dbsqlcli | Medium |
  | `pr_hr_level_avl` | Snowflake / Databricks | | snowsql / dbsqlcli | High |
  | `booking_portal_bookings` | Snowflake / Databricks | | snowsql / dbsqlcli | Optional |
  | `im_vendor_portal_inventory_module` | Snowflake / Databricks | | snowsql / dbsqlcli | High - upstream stock |

  **BLOCKER**: Do not proceed until table locations are documented.

- [ ] `[PM - Sreeram → DE - Platform]` **Obtain Databricks credentials** (if any tables are in Databricks):
  - Request from Data Engineering team:
    - Databricks workspace hostname (e.g., `swiggy.cloud.databricks.com`)
    - SQL Warehouse ID / HTTP path
    - Personal Access Token (PAT) or OAuth setup instructions
  - Document in secure location (do NOT commit tokens to repo)
  - **Skip if all tables are in Snowflake**

---

### 2. Environment Setup

- [ ] `[EE - TBD]` **Snowflake CLI**: Install and configure `snowsql`
  ```bash
  # 1. Install snowsql (macOS)
  brew install --cask snowflake-snowsql

  # 2. Configure credentials (~/.snowsql/config)
  # [connections.default]
  # accountname = <your_account>
  # username = <your_username>
  # password = <your_password>
  # warehousename = <warehouse>
  # dbname = <database>

  # 3. Test connection
  snowsql -q "SELECT current_timestamp();"
  ```

  **BLOCKER**: Do not proceed to Day 1 until snowsql is working.

- [ ] `[EE - TBD]` **Databricks SQL CLI**: Install and configure (if any tables are in Databricks per Step 1)
  ```bash
  # 1. Install databricks-sql-cli
  pip install databricks-sql-cli

  # 2. Configure environment variables (use credentials from Step 1)
  export DBSQLCLI_HOST_NAME=<swiggy-databricks-instance>.cloud.databricks.com
  export DBSQLCLI_HTTP_PATH=/sql/1.0/warehouses/<warehouse-id>
  export DBSQLCLI_ACCESS_TOKEN=<personal-access-token>

  # 3. Test connection
  dbsqlcli -e "SELECT 1;"
  ```

  **Skip if**: All tables are in Snowflake (per Table Location Discovery).

- [ ] `[EE - TBD]` **Glean MCP**: Verify access
  ```
  # Test via Claude Code
  mcp__glean_default__search with query: "Instamart availability"
  ```

- [ ] `[EE - TBD]` **Git**: Initialize repo structure
  ```bash
  cd /Users/sidhant.panda/workspaces/root-workspace/swiggy-brain/scm/pocs/availability-prediction
  git status  # Should be clean
  ```

---

### 3. Verify Table Accessibility (BLOCKER)

- [ ] `[EE - TBD]` **Test each critical table** based on its documented location:

  **For Snowflake tables**:
  ```bash
  snowsql -q "SELECT * FROM schema.table_name LIMIT 1;"
  ```

  **For Databricks tables**:
  ```bash
  dbsqlcli -e "SELECT * FROM catalog.schema.table_name LIMIT 1;"
  ```

  **BLOCKER**: All critical tables must be queryable before Day 1.

---

### 4. Required Tables

- [ ] `[PM - Sreeram → DE - Platform]` Request access to the following tables before Day 1. Group by priority:

#### Critical (Must Have)

| Table | Schema | Purpose |
|-------|--------|---------|
| `weighted_availability_daily_update` | `analytics.public` | **Ground truth** — impression-weighted availability for OOS definition |
| `sku_wise_availability_rca_with_reasons_v7` | `analytics.public` | **RCA attribution** — waterfall reason codes for reflect skill |
| `final_reason_mapping_avail_rca` | `analytics.public` | **Reason mapping** — maps codes to bins/owners |
| `dash-scm-inventory-availability` | DynamoDB/Snowflake | **Inventory state** — real-time sellable qty, DOH calculation |
| `contract-master` | — | **Scope definition** — Bradman membership (see note below for POC tiering) |
| `im_parent_order_fact` | `analytics.public` | **WH ranking** — order volume for Top Bangalore WH selection |

#### High (Core Signals)

| Table | Schema | Purpose |
|-------|--------|---------|
| `scm-procurement-po` | — | **PO status** — stuck/expired POs for Branch 2 detection |
| `scm-procurement-po-details` | — | **PO line items** — quantities, fill rates |
| `im_vendor_portal_po_module` | `analytics_prod` | **Supplier performance** — OTIF, fill rate, lead times |
| `dash-scm-inventory-location` | ILS | **Inventory detail** — batch/location/expiry for DOH |
| `pr_hr_level_avl` | `analytics.public` | **Hourly availability** — granular availability for ground truth aggregation |
| `im_vendor_portal_inventory_module` | `analytics_prod` | **Upstream stock** — vendor inventory visibility, early warning for supply |

#### Medium (Enhanced Signals)

| Table | Schema | Purpose |
|-------|--------|---------|
| `im_pod_hr_demand_forecasting` | `data_science.ds_storefront` | **Forecast comparison** — TFT predictions vs actuals |
| `scm-control-room-rules` | — | **Config rules** — OOS overrides, holiday slots |

#### Optional (Warehouse/CDC)

| Table | Schema | Purpose |
|-------|--------|---------|
| `vinculum.swiggy_gamma.inbound` | Vinculum CDC | GRN timestamps for warehouse delays |
| `vinculum.swiggy_gamma.invbal` | Vinculum CDC | Warehouse SOH |
| `booking_portal_bookings` | `analytics_adhoc` | Warehouse appointment scheduling |

### 5. Query Prerequisites (BLOCKER)

- [ ] `[AE - Durga]` **Validate table selection** (BLOCKER):
  - Review Required Tables list against POC doc Appendix A
  - Confirm we have the right tables for **WH×SKU predictions**
  - Flag any missing critical tables for warehouse-level analysis
  - Document findings in `brain/metadata/table-validation.md`

- [ ] `[AE - Durga + MS - Rohit]` **Validate table schemas**:
  - Run DESCRIBE TABLE for each table below
  - Document in `brain/metadata/table-schemas.md` (column names, types, descriptions)
  - Document join paths in `brain/metadata/join-paths.md`

  | Priority | Table | Purpose |
  |----------|-------|---------|
  | Critical | `weighted_availability_daily_update` | Ground truth (aggregate by WH for OOS definition) |
  | Critical | `sku_wise_availability_rca_with_reasons_v7` | RCA attribution |
  | Critical | `final_reason_mapping_avail_rca` | Reason code mapping |
  | Critical | `dash-scm-inventory-availability` | Inventory state, DOH |
  | Critical | `contract-master` | Bradman membership, SKU scope |
  | Critical | `im_parent_order_fact` | WH ranking, order volume |
  | High | `scm-procurement-po` | PO status |
  | High | `scm-procurement-po-details` | PO line items, fill rates |
  | High | `im_vendor_portal_po_module` | Supplier performance |
  | High | `dash-scm-inventory-location` | Batch/location/expiry |
  | High | `pr_hr_level_avl` | Hourly availability (for WH aggregation) |
  | High | `im_vendor_portal_inventory_module` | Upstream vendor stock visibility |
  | Medium | `im_pod_hr_demand_forecasting` | Forecast vs actuals |
  | Medium | `scm-control-room-rules` | Config rules |

- [ ] `[AE - Durga + MS - Rohit]` **Create query patterns**:
  - Provide working query for each intent below
  - Save as `.sql` files in `brain/queries/` folder
  - Test at least ground truth query end-to-end

  | Intent | File | Description |
  |--------|------|-------------|
  | **Ground Truth** | `ground_truth.sql` | Get OOS status for SKU×WH×Date (aggregate POD availability by WH) |
  | **Inventory State** | `inventory_state.sql` | Get WH inventory, calculate DOH |
  | **Top Bangalore WH** | `top_bangalore_wh.sql` | Identify highest volume WH serving Bangalore |
  | **WH-POD Mapping** | `wh_pod_mapping.sql` | Get which PODs are served by which WH |
  | **Bradman Tier A** | `bradman_tier_a.sql` | Extract top 20% FMCG SKUs by Bradman score |
  | **Active SKU×WH** | `active_sku_wh.sql` | Get SKU×WH combinations with recent orders |
  | **RCA Attribution** | `rca_attribution.sql` | Get OOS reason codes (WH-led focus) |
  | **PO Status** | `po_status.sql` | Get stuck/expired POs by WH |
  | **Supplier Performance** | `supplier_performance.sql` | Get OTIF, fill rate by supplier |
  | **Upstream Stock** | `upstream_stock.sql` | Get vendor inventory levels |

**BLOCKER**: Do not proceed to Day 1 until `brain/metadata/` and `brain/queries/` are populated.

### 6. Additional Clarifications Needed (BLOCKER)

- [ ] `[PM - Sreeram + AE - Durga]` Resolve before Day 1:

| Question | Why It Matters | Ask Who |
|----------|----------------|---------|
| **Timezone**: Are dates in UTC or IST? | All date filters depend on this | Data Engineering |
| **City filter**: Is it `'Bangalore'` or `'Bengaluru'`? | WH/POD queries will fail with wrong value | Check data sample |
| **WH ranking metric**: `order_count`, `units_sold`, or `gmv`? | Defines "Top WH" for POC scope | SCM team |
| **WH-POD mapping**: Which table links warehouses to PODs? | Needed to aggregate POD availability by WH | Data Engineering |
| **DOH calculation**: Is `avg_daily_sales` pre-computed or needs calculation? | Core signal for predictions | Check inventory table schema |
| **SKU-Supplier linkage**: How to join SKU to supplier? | Supplier signals need this join | Check PO table schema |
| **Data pipeline lag**: What time is yesterday's EOD data available? | Live predictions depend on fresh data | Data Engineering |
| **Exogenous events**: Marketing campaigns, festivals, weather, city events? | Demand spikes from promos, holidays, weather disruptions | Glean (internal campaigns) + Web (festivals, weather, public events) |

**BLOCKER**: Document answers before proceeding to Day 1.

---

### 7. External Events Pre-Seeding (BLOCKER)

- [ ] `[PM - Sreeram]` Before simulation starts, create `brain/context-graph/patterns/external/known-events.md` with known events in the simulation period (Dec 19 - Jan 18):

| Event | Date Range | Categories Affected | Expected Impact |
|-------|------------|---------------------|-----------------|
| **Christmas Week** | Dec 23-26 | Confectionery, Beverages, Snacks | +20-40% demand |
| **New Year** | Dec 30 - Jan 2 | Beverages, Snacks, Dairy (cream) | +30-50% demand |
| **Pongal** | Jan 14-17 | Rice, Dairy (milk, ghee), Jaggery, Staples | +25-40% demand |
| **Bangalore Winter** | Dec-Jan | Minimal | No significant disruption |

**Why Pre-Seed?** Web search is disabled during simulation (anti-cheat). Without pre-seeding, external event patterns cannot be learned during the 30-day simulation.

**Optional Enrichment**: Search Glean for internal communications about December/January marketing campaigns and add to the file.

**BLOCKER**: `known-events.md` must exist before Day 1.

---

### 8. Data Validation

- [ ] `[AE - Durga]` **Historical data retention check** (BLOCKER):
  - Verify Dec 2025 data exists in `weighted_availability_daily_update`
  - Expected: Data available from Dec 19, 2025 onwards (30 days for simulation)
  - **BLOCKER**: If Dec 2025 data is missing, adjust simulation start date

- [ ] `[AE - Durga]` **Table freshness check**:
  - Verify ground truth table has recent data (last 30 days)
  - Verify inventory state table is being updated

- [ ] `[AE - Durga]` **Identify Top Bangalore Warehouse** (BLOCKER):
  - Use `brain/queries/top_bangalore_wh.sql`
  - Rank warehouses by order volume serving Bangalore over last 30 days
  - Select single highest-volume WH for POC scope
  - Save to: `brain/context-graph/scope/top_bangalore_wh.json`
  - **BLOCKER**: Document which WH is selected and why

- [ ] `[AE - Durga]` **Document WH-POD Mapping** (BLOCKER):
  - Use `brain/queries/wh_pod_mapping.sql`
  - Identify all PODs served by the selected WH
  - Save to: `brain/context-graph/scope/wh_pod_mapping.json`
  - **Why needed**: Ground truth aggregates POD availability by WH

- [ ] `[AE - Durga]` **Extract Bradman FMCG Tier A SKUs** (~1,200) (BLOCKER):
  - **What is Bradman?** Project Bradman 99.90 targets 99.90% availability for high-priority SKUs
  - **POC Tiering**: Rank Bradman FMCG SKUs by score, take top 20% as Tier A
  - **Fallback**: If `bradman_score` unavailable, use GSV × Units as proxy
  - Save to: `brain/context-graph/scope/bradman_tier_a.json`
  - **BLOCKER**: Document Tier A definition and source

- [ ] `[AE - Durga]` **Extract Active SKU×WH Combinations** (BLOCKER):
  - Get SKU×WH pairs with orders in last 30 days
  - Filter to Top Bangalore WH × Bradman Tier A SKUs
  - Expected: ~1,200 active combinations (1 WH × ~1,200 SKUs with velocity filter)
  - Save to: `brain/context-graph/scope/active_sku_wh.json`

- [ ] `[AE - Durga + PM - Sreeram]` **Determine OOS Threshold (X%)** (BLOCKER):
  - Analyze **WH-level aggregated availability** distribution
  - For each SKU×WH, aggregate POD availability across all PODs served by WH
  - Look for threshold where OOS reason codes start appearing
  - Likely range: 50-70%
  - **BLOCKER**: Document decision rationale before Day 1

---

## Week 1: BUILD (Jan 12-16)

> **4 working days**: Mon-Wed (Jan 12-14) + Fri (Jan 16). Jan 15 Thu is Pongal holiday.
> **Goal**: All skills built, full cycle working, ready for simulation.
> **Primary**: `[EE - TBD]` | **Support**: `[AE - Durga]` `[PM - Sreeram]` `[AA - Sid]`

### Day 1-2 (Mon-Tue, Jan 12-13): Foundation + Evaluate

**Goal**: Directory structure, Snowflake working, `evaluate` skill complete
**Owners**: `[EE - TBD]` execution, `[AE - Durga]` query validation, `[PM - Sreeram]` coordination

#### Tasks

1. [ ] `[EE - TBD]` **Install required skills**:
   - `skill-creator` — For creating custom POC skills
   - `glean-connector` — For searching Confluence, Slack, Jira
   - `snowflake-connector` — For querying Snowflake tables
   - `databricks-connector` — For querying Hive/Delta tables (if needed per pre-req verification)

2. [ ] `[EE - TBD]` **Create directory structure**:
   ```
   availability-prediction/
   ├── .claude/skills/
   │   ├── evaluate/
   │   │   ├── SKILL.md
   │   │   └── scripts/calculate_metrics.py
   │   ├── reflect/
   │   │   └── SKILL.md
   │   ├── predict/
   │   │   └── SKILL.md
   │   └── context-graph-management/
   │       └── SKILL.md
   ├── brain/
   │   ├── CLAUDE.md
   │   └── context-graph/
   │       ├── patterns/
   │       │   ├── by-category/
   │       │   ├── by-supplier/
   │       │   ├── by-temporal/
   │       │   ├── by-signal/
   │       │   └── external/
   │       ├── scope/
   │       │   ├── top20_pods.json
   │       │   └── bradman_tier_a.json
   │       ├── signals.md
   │       └── failures.md
   ├── logs/
   │   ├── predictions/
   │   ├── evaluations/
   │   └── reflections/
   ├── CLAUDE.md
   └── plan.md
   ```

3. [ ] `[EE - TBD]` **Write `evaluate` SKILL.md**:
   - Trigger phrases: "evaluate predictions", "check F1"
   - Input: `logs/predictions/{date}.json`
   - Output: `logs/evaluations/{date}.json`
   - Process: Load predictions → Query actuals → Calculate metrics

4. [ ] `[EE - TBD]` **Write `calculate_metrics.py`**:
   - Inputs: predictions list, actuals list
   - Outputs: precision, recall, F1, confusion matrix
   - Include per-pattern performance tracking

5. [ ] `[EE - TBD]` **Test ground truth query**:
   - Use `brain/queries/ground_truth.sql`
   - Query ground truth for first simulation day (Dec 20)
   - Verify query returns expected SKU×WH combinations

6. [ ] `[EE - TBD]` **Calculate baseline metrics** (CRITICAL for self-improvement):

   **Baseline 1: DOH-only rule** (simple heuristic to beat)
   - Rule: If DOH < 1 day, predict OOS
   - Calculate F1 against Dec 20 ground truth
   - This is the minimum bar to clear

   **Baseline 2: Day 1 system F1** (before any patterns)
   - Run first prediction with ZERO patterns in context graph
   - This is the starting point for measuring self-improvement slope
   - Record in `logs/evaluations/baseline.json`

   **Document both**:
   - "DOH-only baseline F1 = X.XX" (heuristic to beat)
   - "Day 1 system F1 = Y.YY" (starting point for improvement)

#### Day 1-2 Verification
- [ ] All directories exist
- [ ] `snowsql` query returns data
- [ ] `evaluate` SKILL.md written
- [ ] `calculate_metrics.py` runs without error
- [ ] DOH-only baseline F1 documented (heuristic to beat)
- [ ] `known-events.md` created with Dec-Jan events

---

### Day 3-4 (Wed + Fri, Jan 14 + 16): Predict + Reflect Skills

> **Note**: Jan 15 (Thu) is Pongal holiday — Day 3 is Wed, Day 4 is Fri.

**Goal**: `predict` and `reflect` skills complete, full cycle working
**Owners**: `[EE - TBD]` execution, `[AA - Sid]` architecture review

#### Tasks

1. [ ] `[EE - TBD]` **Write `predict` SKILL.md**:
   - Trigger phrases: "predict OOS", "forecast availability"
   - Inputs: Context graph, Snowflake (inventory/PO/supplier)
   - Output: `logs/predictions/{date}.json`

2. [ ] `[EE - TBD]` **Create initial `signals.md`**:
   - Define signal tiers (High/Moderate/Contextual)
   - Tier 1: DOH < 1 day, Supplier fill rate < 80%, PO stuck/expired
   - Tier 2: DOH < 2 days, OTIF < 70%, Forecast error > 50%
   - Tier 3: Weekend/holiday, Category seasonality, External events

3. [ ] `[EE - TBD]` **Create inventory query script**:
   - Query point-in-time inventory state (T-1 for T+1 prediction)
   - Use `brain/queries/inventory_state.sql`
   - Calculate DOH from sellable_qty and avg_daily_sales

4. [ ] `[EE - TBD]` **Generate first prediction** (Dec 20 using Dec 19 EOD data):
   - Output format: JSON with sku_id, wh_id, prediction, confidence, reasoning
   - Include matched patterns and signal values
   - Save to `logs/predictions/2025-12-20.json`

5. [ ] `[EE - TBD]` **Run evaluate on Dec 20 predictions**:
   - Load predictions
   - Query Dec 20 actuals
   - Calculate F1
   - **Record this as Day 1 baseline F1** (before any patterns)

#### Verification
- [ ] `predict` SKILL.md written
- [ ] `signals.md` initialized
- [ ] `logs/predictions/2025-12-20.json` generated
- [ ] `logs/evaluations/2025-12-20.json` shows metrics
- [ ] Predict→Evaluate cycle completes without error

---

**Day 3-4 continued: Reflect Skill**

1. [ ] `[EE - TBD]` **Write `reflect` SKILL.md**:
   - Trigger phrases: "reflect on errors", "update patterns"
   - Inputs: Evaluation JSON, Glean (past RCAs)
   - Outputs: Updated patterns, `logs/reflections/{date}.md`
   - Thresholds: Add at 10+ obs, deprecate at F1 < 0.50

2. [ ] `[EE - TBD]` **Write `context-graph-management` SKILL.md**:
   - Storage rules (one pattern per H2)
   - Retrieval rules (Glob + Grep)
   - Cross-reference conventions
   - **Conflict resolution**: Claude decides based on all signals and reasoning (no fixed rule)

3. [ ] `[EE - TBD]` **Write `cluster_errors.py`**:
   - Group errors by: Category, Supplier, Signal combination, Day of week
   - Return clusters with 10+ observations (pattern candidates)

4. [ ] `[EE - TBD]` **Run full cycle for Dec 20-22** (warm-up):
   - Day 1: Predict Dec 20 → Evaluate → Reflect
   - Day 2: Predict Dec 21 → Evaluate → Reflect
   - Day 3: Predict Dec 22 → Evaluate → Reflect

5. [ ] `[EE - TBD]` **Check for emerging patterns**:
   - Low DOH + specific category → OOS
   - Supplier X + Friday → delay
   - etc.

#### Day 3-4 Verification
- [ ] `reflect` SKILL.md written
- [ ] `context-graph-management` SKILL.md written
- [ ] Full cycle runs (predict → evaluate → reflect)
- [ ] `logs/reflections/2025-12-20.md` created
- [ ] At least 1 pattern hypothesis documented
- [ ] **Day 1 baseline F1 recorded** (before any patterns)

---

#### Week 1 Exit Criteria (End of Day 4)
- [ ] All skills complete (evaluate, predict, reflect, context-graph-management)
- [ ] Full cycle working (predict → evaluate → reflect)
- [ ] Test run on Dec 20 data successful
- [ ] Ready for simulation

---

## Week 2: SIMULATION (Jan 19-23)

> **5 working days** (Mon-Fri). Run complete 30-day historical simulation.
> **Goal**: Context graph warm with 30 days of patterns, ready for live predictions.
> **Primary**: `[EE - TBD]` autonomous | **Checkpoints**: `[PM - Sreeram]` `[AE - Durga]` `[BIZ - IM Team]`

### Simulation Overview

**Method**: Each simulated day = one Claude Code session.
- Human triggers: "simulate day YYYY-MM-DD"
- Claude runs: predict → evaluate → reflect
- **Pacing**: ~6 simulated days per real day (30 days ÷ 5 working days)

**Anti-cheat**: All queries MUST be point-in-time filtered (`WHERE date <= sim_date`). No future data leakage.

### Day 5 (Mon, Jan 19): Simulation Days 1-6 (Dec 19-24)

**Simulated period**: Dec 19 → Dec 24 (6 days)
**Owner**: `[EE - TBD]`

1. [ ] `[EE - TBD]` Run 6 simulation cycles (Dec 20-24 predictions using Dec 19-23 data)
2. [ ] `[EE - TBD]` **Day 1 baseline**: Record F1 on Dec 20 with ZERO patterns
3. [ ] `[EE - TBD]` Note: Dec 24 is Christmas Eve - check `known-events.md`

---

### Day 6 (Tue, Jan 20): Simulation Days 7-12 (Dec 25-30)

**Simulated period**: Dec 25 → Dec 30 (6 days)
**Owner**: `[EE - TBD]`

1. [ ] `[EE - TBD]` Run 6 simulation cycles
2. [ ] `[EE - TBD]` **Christmas impact** (Dec 25-26): Note demand patterns
3. [ ] `[EE - TBD]` First patterns should be emerging

---

### Day 7 (Wed, Jan 21): Simulation Days 13-18 (Dec 31 - Jan 5)

**Simulated period**: Dec 31 → Jan 5 (6 days)
**Owner**: `[EE - TBD]`

1. [ ] `[EE - TBD]` Run 6 simulation cycles
2. [ ] `[EE - TBD]` **New Year impact** (Dec 31 - Jan 1): Note demand patterns
3. [ ] `[EE - TBD]` **Mid-simulation checkpoint**:
   - Is F1 trending upward?
   - Are patterns accumulating sensibly?
   - Any signs of overfitting?

---

### Day 8 (Thu, Jan 22): Simulation Days 19-24 (Jan 6-11)

**Simulated period**: Jan 6 → Jan 11 (6 days)
**Owner**: `[EE - TBD]`

1. [ ] `[EE - TBD]` Run 6 simulation cycles
2. Post-holiday normalization - patterns should stabilize
3. Review pattern count and F1 trend

---

### Day 9 (Fri, Jan 23): Simulation Days 25-30 (Jan 12-18) + Review

**Simulated period**: Jan 12 → Jan 18 (7 days, final)
**MANDATORY CHECKPOINT**: `[PM - Sreeram]` `[AE - Durga]` `[BIZ - IM Team]` — 3-hour review session

1. [ ] `[EE - TBD]` Run 7 simulation cycles (includes Pongal Jan 14-17)
2. [ ] `[PM - Sreeram + AE - Durga + BIZ]` **HUMAN REVIEW CHECKPOINT** (mandatory before live):
   - Review F1 progression chart (should show **positive slope**)
   - Review top 5 patterns (do they make business sense?)
   - Review `failures.md` (are deprecations justified?)
   - **Key Question**: Is Final Week F1 > First Week F1?
   - Sign-off: "Context graph approved for live"

3. [ ] `[EE - TBD]` **Analyze pattern performance**:
   ```bash
   grep -r "F1:" brain/context-graph/patterns/
   grep -r "F1: 0.[7-9]" brain/context-graph/patterns/ | wc -l
   ```

4. [ ] `[EE - TBD]` **Document simulation summary**:
   ```markdown
   # Simulation Summary (Dec 19 - Jan 18)

   ## Self-Improvement Validation (Primary)
   - First Week F1 (Dec 20-26): X.XX
   - Final Week F1 (Jan 12-18): Y.YY
   - **Improvement**: +ZZ% ← MUST BE POSITIVE
   - Day 1 Baseline F1 (no patterns): W.WW

   ## Absolute Metrics (Secondary)
   - Final F1: X.XX (target: >0.70)
   - Validated patterns: N (target: 10+)
   - Deprecated patterns: M

   ## External Event Patterns
   - Christmas impact: [observed]
   - New Year impact: [observed]
   - Pongal impact: [observed]
   ```

5. [ ] `[EE - TBD]` **Commit context graph**:
   ```bash
   git add brain/context-graph/
   git commit -m "Context graph after 30-day simulation - F1: X.XX"
   git push origin main
   ```

---

#### Week 2 Exit Criteria (End of Day 9)
- [ ] 30-day simulation complete (Dec 19 → Jan 18)
- [ ] **PRIMARY: Positive F1 slope** (Final week F1 > First week F1)
- [ ] **SECONDARY: F1 > 0.70** on final week average
- [ ] 10+ validated patterns discovered (F1 > 0.70)
- [ ] Context graph committed to main
- [ ] Human review sign-off: "Context graph approved for live"

---

## Week 3: LIVE + DEMO (Jan 27-30)

> **4 working days** (Tue-Fri). Jan 26 Mon is Republic Day holiday.
> **Goal**: Live predictions on real data, stakeholder demo, scaling plan.
> **Primary**: `[EE - TBD]` execution | **Demo**: `[PM - Sreeram]` | **Validation**: `[AE - Durga]` `[BIZ - IM Team]`

### Day 10 (Tue, Jan 27): First Live Prediction

**Goal**: Predict Jan 28 OOS using real-time data (Jan 26 EOD - Republic Day data)
**Owner**: `[EE - TBD]`

#### Tasks

1. [ ] `[EE - TBD]` **Morning cycle**:
   - Pull latest from main
   - Skip evaluate/reflect (no yesterday predictions yet)
   - Run: predict OOS for Jan 28

2. [ ] `[EE - TBD]` **Query live inventory data**:
   - Use `brain/queries/inventory_state.sql`
   - Query EOD snapshot from Jan 26 (Republic Day)
   - Verify data freshness

3. [ ] `[EE - TBD]` **Check for external events**:
   - Republic Day impact (Jan 26) on inventory
   - Weather alerts (web search)
   - Ongoing incidents (Glean)

4. [ ] `[EE - TBD]` **Generate predictions**:
   - Save to `logs/predictions/2026-01-28.json`
   - Commit to main

#### Day 10 Verification
- [ ] Live data queried successfully
- [ ] `logs/predictions/2026-01-28.json` generated
- [ ] External events checked
- [ ] Committed to main

---

### Day 11 (Wed, Jan 28): First Live Evaluation

**Goal**: Evaluate Jan 28 predictions, predict Jan 29
**Owner**: `[EE - TBD]`

#### Tasks

1. [ ] `[EE - TBD]` **Full morning cycle**:
   - Pull latest, run evaluate → reflect → predict
   - Evaluate: Jan 28 predictions vs Jan 28 actuals
   - Reflect: Learn from errors (first live patterns!)
   - Predict: Jan 29 OOS
   - Commit and push

2. [ ] `[EE - TBD]` **Compare live vs simulation accuracy**:
   - Live F1 vs. average simulation F1
   - Note any domain shift

3. [ ] `[EE - TBD]` **Document live learnings**:
   - New patterns from live data
   - Unexpected behaviors

#### Day 11 Verification
- [ ] Full cycle completed
- [ ] First live F1 calculated
- [ ] Live vs simulation comparison documented

---

### Day 12 (Thu, Jan 29): Documentation + Demo Prep

**Goal**: Complete documentation, prepare demo
**Owners**: `[EE - TBD]` execution, `[PM - Sreeram]` demo prep

#### Tasks

1. [ ] `[EE - TBD]` **Run daily cycle** (evaluate Jan 29 predictions, predict Jan 30)

2. [ ] `[EE - TBD]` **Complete all SKILL.md files**:
   - Ensure all trigger phrases documented
   - Add examples
   - Document failure modes

3. [ ] `[EE - TBD]` **External event analysis**:
   - Review Pongal impact (from simulation)
   - Review Republic Day impact (from live)
   - Document findings

4. [ ] `[PM - Sreeram]` **Create demo script**:
   - Introduction (2 min): Problem (reactive OOS) → Solution (predictive graphs)
   - Live Demo (10 min): Today's predictions, reasoning walkthrough, patterns, learning curve
   - Results (5 min): F1 progression, top patterns, business impact projection
   - Q&A (5 min)

5. [ ] `[EE - TBD]` **Prepare visualizations**:
   - F1 trend over 30 days simulation + live
   - Pattern discovery timeline
   - Error reduction by category
   - Self-improvement slope chart

#### Day 12 Verification
- [ ] Daily cycle completed
- [ ] External event impact documented
- [ ] All SKILL.md files complete
- [ ] Demo script ready
- [ ] Visualizations prepared

---

### Day 13 (Fri, Jan 30): Stakeholder Demo + Scaling Plan

**Goal**: Deliver demo, capture feedback, document scaling plan
**Owners**: `[PM]` demo delivery, `[EE]` technical support, `[BIZ]` feedback

#### Tasks

1. [ ] `[EE - TBD]` **Run daily cycle** (final)

2. [ ] `[PM - Sreeram]` **Deliver stakeholder demo**:
   - Follow demo script
   - Show live predictions
   - Demonstrate self-improvement

3. [ ] `[PM - Sreeram + BIZ - IM Team]` **Capture feedback**:
   - What resonated?
   - What concerns?
   - What's missing?

4. [ ] `[PM - Sreeram]` **Document scaling plan**:
   - Phase 1: Expand to 100 PODs (Bangalore)
   - Phase 2: Add Tier B SKUs (+1,800), Add FnV with freshness signals
   - Phase 3: City expansion (Mumbai, Delhi, Hyderabad)
   - Phase 4: Prescriptive mode ("do X to prevent OOS"), PO integration
   - Infrastructure: Scheduled automation, monitoring dashboard, alerts

5. [ ] `[EE - TBD]` **Final commit**:
   - Commit all artifacts with F1 results
   - Push to main

#### Day 13 Verification
- [ ] Daily cycle completed
- [ ] Demo delivered
- [ ] Feedback captured
- [ ] Scaling plan documented

---

### POC Final Exit Criteria

| Criterion | Target | Status |
|-----------|--------|--------|
| **PRIMARY: Self-Improvement** | Positive F1 slope (simulation) | [ ] |
| **SECONDARY: Simulation F1** | > 0.70 (final week avg) | [ ] |
| **Live F1** | > 0.75 | [ ] |
| Validated patterns | 10+ with F1 > 0.70 | [ ] |
| Live predictions | 3+ days | [ ] |
| External events validated | Yes | [ ] |
| Stakeholder demo | Delivered | [ ] |
| Scaling plan | Documented | [ ] |

---

## Risks & Contingencies

| Risk | Detection | Mitigation |
|------|-----------|------------|
| **Data quality issues** | Missing rows, stale timestamps | Validate freshness daily; fall back to last known good |
| **Sparse signal at SKU level** | Low observation counts | Aggregate to POD×Category; reduce scope |
| **Pattern overfitting** | High sim F1, low live F1 | Require 10+ obs; track live vs sim delta |
| **Context graph bloat** | >100 patterns, slow retrieval | Aggressive deprecation; compress similar patterns |
| **Snowflake timeout** | Query >60s | Add timeouts; batch queries; cache results |
| **Simulation vs reality gap** | Live F1 <<< sim F1 | Run parallel predictions; diagnose drift source |
| **No self-improvement** | Flat or negative F1 slope | Diagnose: Are patterns adding noise? Simplify to DOH-only and rebuild |
| **External events missed** | Holiday spikes not predicted | Enrich `known-events.md`; search Glean for marketing calendars |
| **Baseline too high** | DOH-only F1 > 0.70 | Good problem! Focus on incremental value, consider harder prediction horizon (T+2) |

---

## Quick Reference

### Daily Commands
```bash
cd /Users/sidhant.panda/workspaces/root-workspace/swiggy-brain/scm/pocs/availability-prediction
git pull origin main
# Invoke: evaluate → reflect → predict
git add . && git commit -m "Daily cycle $(date +%Y-%m-%d)" && git push
```

### Key Thresholds
| Parameter | Value |
|-----------|-------|
| OOS threshold | Availability < X% (TBD) |
| Pattern add | 10+ observations |
| Pattern deprecate | F1 < 0.50 |
| Auto-deprecate | F1 < 0.40 for 3 days |
| Rollback trigger | F1 drops > 15% |

### Success Targets
| Metric | Week 1 (Build) | Week 2 (Simulation) | Week 3 (Live+Demo) |
|--------|----------------|---------------------|-------------------|
| **Primary: Self-Improvement** | — | Positive F1 slope | Documented |
| **Secondary: F1** | Baseline recorded | Sim >0.70 (final week) | Live >0.75 |
| Patterns | Skills ready | 10+ validated | Demo-ready |
| Cycle | Working end-to-end | 30-day simulation complete | 3+ live days |

### Key Dates
| Date | Day | Milestone |
|------|-----|-----------|
| Jan 12 | D1 | POC starts (Week 1: BUILD) |
| Jan 15 | — | Holiday (Pongal) |
| Jan 16 | D4 | Week 1 ends, all skills ready |
| Jan 19 | D5 | Week 2 starts (SIMULATION) |
| Jan 23 | D9 | Simulation complete (30 days), human review |
| Jan 26 | — | Holiday (Republic Day) |
| Jan 27 | D10 | Week 3 starts (LIVE), first live prediction |
| Jan 28 | D11 | First live evaluation |
| Jan 30 | D13 | Demo + POC complete |
