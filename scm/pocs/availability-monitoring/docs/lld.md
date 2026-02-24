# LLD: Availability Monitoring & RCA Copilot

**Version**: 1.0
**Date**: Jan 13, 2026
**Owner**: AI Architecture Team

---

## Milestones

| Milestone | Scope | Deliverable | Sections |
|-----------|-------|-------------|----------|
| **M1: Core Alerts** | Alert pipeline + Slack report | Top 5 alerts per persona via Slack | §1-8 |
| **M2: Dashboard** | Visual dashboards | Executive + 7 Persona dashboards | §9 |

### M1 Success Criteria
- [ ] Base table query returns chronic SKU-POD records
- [ ] Records correctly routed to 7 owner buckets
- [ ] Top 5 alerts per persona generated with RCA
- [ ] Slack report sent with actionable alerts

### M2 Success Criteria
- [ ] Executive dashboard with KPIs and accountability table
- [ ] 7 persona-specific dashboards with team metrics
- [ ] Drill-down from alert to action items

---

# MILESTONE 1: CORE ALERT PIPELINE
## 1. Overview & Assumptions

### Purpose
Automated daily system that detects chronic SKU availability issues, generates root cause analysis, and routes actionable alerts to the right team owners.

### Assumptions
- **Base table ready** with 18 fields (see schema below)
- **Claude Code orchestrates** end-to-end (no external LLM API)
- **Personas folder** provides domain knowledge for grounded RCA
- **Output**: Top 5 alerts per persona, sorted by GMV impact

### Scope
| Dimension | Value |
|-----------|-------|
| Geography | Bangalore |
| Category | FMCG |
| SKUs | ~6,000 Bradman SKUs |
| Chronic Threshold | ≥15 of 30 days below 99.9% availability |
| Alert Limit | Top 5 per persona (max 35 total) |

---

## 2. Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AVAILABILITY MONITORING FLOW                      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Base Table  │────▶│ Skill 1:     │────▶│ Skill 2:         │
│  (18 fields) │     │ fetch-chronic│     │ route-by-owner   │
│              │     │ -data        │     │                  │
└──────────────┘     └──────────────┘     └────────┬─────────┘
                                                   │
                     ┌─────────────────────────────┘
                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    OWNER BUCKETS                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Planning │ │Procurement│ │ Category │ │ Pod Ops  │ ...    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Skill 3: aggregate-per-persona                                │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ 1. Load persona → get operating_level                   │  │
│ │ 2. Aggregate at that level (Pod for Pod Ops, etc.)      │  │
│ │ 3. Sum GMV loss per group                               │  │
│ │ 4. Sort by GMV (descending)                             │  │
│ │ 5. Take TOP 5 per persona                               │  │
│ └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Skill 4: generate-rca                                         │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ For each alert:                                         │  │
│ │ 1. Read persona's RCA Branch Mapping                    │  │
│ │ 2. Read persona's Diagnosis SOP                         │  │
│ │ 3. Generate L3 narrative (grounded in data)             │  │
│ │ 4. Generate action plan (using persona's Action Verbs)  │  │
│ └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│ Skill 5: format-report                                        │
│ ┌─────────────────────────────────────────────────────────┐  │
│ │ Generate Slack report:                                  │  │
│ │ - Summary header (total GMV, chronic count)             │  │
│ │ - Sections per owner (Category, Procurement, etc.)      │  │
│ │ - Top 5 alerts per section, ranked by GMV               │  │
│ └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                     │
                     ▼
              ┌──────────────┐
              │ Slack Report │
              │ (grouped by  │
              │   owner)     │
              └──────────────┘
```

### Skills Interaction

```
/fetch-chronic-data
        │
        ▼
  chronic_records.json
        │
        ▼
/route-by-owner
        │
        ▼
  owner_buckets.json ─────────────────┐
        │                             │
        ▼                             ▼
/aggregate-per-persona          personas/*.md
        │                        (domain knowledge)
        ▼
    alerts.json
        │
        ▼
/generate-rca ◀─────────────────── personas/*.md
        │                          (SOPs, action verbs)
        ▼
  alerts_with_rca.json
        │
        ▼
/format-report
        │
        ▼
  slack_report.md
```

---

## 3. Skills Reference

### Skill 1: `fetch-chronic-data`

```yaml
# .claude/skills/fetch-chronic-data/SKILL.md

name: fetch-chronic-data
description: Query base table for chronic SKU-POD combinations
triggers:
  - "fetch chronic data"
  - "get availability issues"
  - "load chronic records"

inputs: None (reads from Snowflake/Databricks)

process:
  1. Connect to data warehouse
  2. Query base table with filters:
     - is_chronic_sku_pod = true
     - yesterday_availability < 99.9%
  3. Return all matching records

output:
  file: logs/chronic_records.json
  schema:  # 18 base fields (aggregate metrics computed later)
    - sku_id: string
    - sku_name: string
    - brand: string
    - business_category: string
    - l1_category: string
    - l2_category: string
    - l3_category: string
    - city: string
    - pod: string
    - warehouse: string
    - availability_pct: float
    - target_pct: float
    - gmv_loss: float
    - chronic_days: int
    - is_chronic_sku_pod: bool
    - l1_reason: string
    - l2_reason: string
    - ai_owner: string
```

### Skill 2: `route-by-owner`

```yaml
# .claude/skills/route-by-owner/SKILL.md

name: route-by-owner
description: Group chronic records by ai_owner, handle shared ownership
triggers:
  - "route alerts"
  - "group by owner"
  - "assign owners"

inputs:
  file: logs/chronic_records.json

process:
  1. For each record:
     a. Parse ai_owner field
        - "Pod Ops" → ["Pod Ops"]
        - "Pod Ops / Planning" → ["Pod Ops", "Planning"]
     b. Assign to primary_owner bucket (first in list)
     c. If secondary owner exists, track in secondary_buckets

  2. Handle shared ownership:
     | ai_owner Pattern | Primary | Secondary |
     |------------------|---------|-----------|
     | Pod Ops / Planning | Pod Ops | Planning |
     | Warehouse / Planning | Warehouse | Planning |
     | Category / Procurement | Category | Procurement |
     | Category / ERP Team | Category | ERP Team |
     | Product Support / Category | Product Support | Category |

output:
  file: logs/owner_buckets.json
  schema:
    primary_buckets:
      Planning: [records...]
      Procurement: [records...]
      Category Management: [records...]
      Warehouse: [records...]
      Pod Ops: [records...]
      ERP Team: [records...]
      Product Support: [records...]
    secondary_buckets:
      Planning: [(record, primary_owner)...]
      ...
```

### Skill 3: `aggregate-per-persona`

```yaml
# .claude/skills/aggregate-per-persona/SKILL.md

name: aggregate-per-persona
description: Aggregate each owner's records at their operating level, prioritize by GMV
triggers:
  - "aggregate alerts"
  - "create persona alerts"
  - "prioritize by gmv"

inputs:
  file: logs/owner_buckets.json
  personas: personas/*.md

process:
  1. For each owner bucket:
     a. Load persona file (e.g., personas/pod-ops.md)
     b. Extract operating_level from persona

  2. Aggregation levels by persona:
     | Persona | Operating Level | Aggregate By |
     |---------|-----------------|--------------|
     | Planning | City / WH | city → warehouse |
     | Procurement | City / WH | city → warehouse |
     | Category | Brand / Category | brand → l1_category |
     | Warehouse | Warehouse | warehouse |
     | Pod Ops | Pod | pod |
     | ERP Team | City | city |
     | Product Support | SKU | sku_id (no aggregation) |

  3. For each group:
     a. Sum gmv_loss across all records in group
     b. Count affected SKUs
     c. Collect l1_reason distribution

  4. Sort groups by total_gmv_loss (descending)

  5. Take TOP 5 groups per persona

  6. Create secondary alerts for shared ownership (also top 5)

output:
  file: logs/alerts.json
  schema:
    alerts:
      - alert_id: string
        owner: string
        scope: string (e.g., "Pod", "Brand", "Warehouse")
        entity: string (e.g., "HSR Pod", "Coca-Cola", "Central WH")
        gmv_loss: float
        rank: int (1-5)
        affected_sku_count: int
        affected_skus: [sku_ids...]
        chronic_days_avg: float
        l1_reason_distribution: {reason: percentage...}
        is_primary: bool
        shared_with: string | null
```

### Skill 4: `generate-rca`

```yaml
# .claude/skills/generate-rca/SKILL.md

name: generate-rca
description: Claude Code reasons over persona context to generate RCA narrative
triggers:
  - "generate rca"
  - "analyze root cause"
  - "create action plan"

inputs:
  file: logs/alerts.json
  personas: personas/*.md

process:
  For each alert:
  1. Load persona file for alert.owner
  2. Read persona sections:
     - "RCA Branch Mapping" → understand reason codes
     - "Diagnosis SOP" → analysis steps
     - "Agent Integration" → key signals to surface
     - "Action Verbs" → vocabulary for actions

  3. Generate L3 narrative:
     - Ground in the DATA (gmv_loss, chronic_days, affected_skus)
     - Reference persona's RCA branch
     - Explain WHY (root cause) not just WHAT
     - Keep concise (2-3 sentences max)

  4. Generate action plan:
     - Use persona's action verbs (e.g., "Escalate", "Club", "Clear")
     - Be specific (who, what)
     - Maximum 2 action items

output:
  file: logs/alerts_with_rca.json
  schema:
    alerts:
      - ...all fields from alerts.json...
      - l3_narrative: string
      - action_plan: string
      - key_signals: [string...]
```

### Skill 5: `format-report`

```yaml
# .claude/skills/format-report/SKILL.md

name: format-report
description: Generate Slack-formatted report grouped by owner
triggers:
  - "format report"
  - "generate slack message"
  - "create alert summary"

inputs:
  file: logs/alerts_with_rca.json

process:
  1. Calculate summary metrics:
     - Total chronic issues
     - Total GMV at risk
     - Breakdown by owner

  2. Group alerts by owner

  3. Sort owners by total GMV (highest first)

  4. For each owner section:
     - Header with owner name, alert count, total GMV
     - List alerts 1-5, each with:
       - Rank + Priority emoji (🔥 P0, 🟠 P1, 🟡 P2)
       - Entity name + GMV loss + impact count
       - Key metric (fill rate, utilization, etc.)
       - Action plan

  5. Priority assignment:
     | GMV Loss | Priority | Emoji |
     |----------|----------|-------|
     | ≥ ₹5L | P0 | 🔥 |
     | ₹1L - ₹5L | P1 | 🟠 |
     | < ₹1L | P2 | 🟡 |

output:
  file: outputs/slack_report.md
```

---

## 4. Root-Cause-First Algorithm

### Decision Trace: Why Root-Cause-First Over Scope-First?

#### Approach 1: Scope-First Deduplication (REJECTED)

**How it works**: Traverse top-down by geographic scope (Brand×City → Brand×Pod → SKU×City → WH×Category → SKU×Pod), marking records as "covered" at higher levels.

```
100 chronic SKU×PODs
    ↓
Level 1: Brand×City (5 alerts)    ← Mixed owners per alert
Level 2: Brand×Pod (10 alerts)    ← Mixed owners per alert
Level 3: SKU×City (3 alerts)      ← Mixed owners per alert
Level 4: WH×Category (2 alerts)   ← Mixed owners per alert
Level 5: SKU×Pod (15 alerts)      ← Mixed owners per alert
    ↓
Total: 35 alerts (ownership unclear)
```

**The fundamental flaw**: Same scope can have DIFFERENT root causes requiring DIFFERENT owners.

```
Example: "Brand×Pod: Coca-Cola @ HSR"
├── Coca-Cola 500ml → l1_reason: "pod_space_full" → Pod Ops
├── Coca-Cola 1L    → l1_reason: "vendor_fillrate_low" → Category
└── Coca-Cola 2L    → l1_reason: "po_not_raised" → Procurement

One alert, THREE different owners. Who acts?
```

| Pros | Cons |
|------|------|
| Simple to understand | Mixed ownership within alerts |
| Guarantees no duplicate SKU×POD alerts | Alerts at wrong level for some personas |
| Reduces alert count | "Who owns this?" confusion |
| | SOPs don't apply cleanly |
| | Shared ownership gets lost |

---

#### Approach 2: Root-Cause-First Deduplication (CHOSEN)

**How it works**: First group by WHO CAN FIX IT (ai_owner), then aggregate within each owner's bucket at THEIR natural operating level.

```
100 chronic SKU×PODs
    ↓ Group by ai_owner
┌─────────────────────────────────────────────────┐
│ Planning (20 records) → Aggregate by City: 3    │
│ Procurement (25) → Aggregate by WH: 4           │
│ Category (20) → Aggregate by Brand: 5           │
│ Warehouse (10) → Aggregate by WH: 2             │
│ Pod Ops (15) → Aggregate by Pod: 8              │
│ ERP Team (5) → Aggregate by City: 2             │
│ Product Support (5) → Keep SKU-level: 5         │
└─────────────────────────────────────────────────┘
    ↓ Sort by GMV, take top 5 per persona
Total: 29 primary + 4 secondary (shared) = 33 alerts
Each alert has CLEAR SINGLE OWNER
```

| Pros | Cons |
|------|------|
| Clear single owner per alert | Slightly more complex logic |
| Alerts at persona's operating level | May have more total alerts |
| Persona's SOP applies directly | Requires parsing ai_owner field |
| Shared ownership handled explicitly | |
| Actionable (owner knows what to do) | |
| Aligned with persona documentation | |

---

#### Key Insight: Personas Operate at Different Levels

From reading all 7 persona files, we identified that each team operates at a specific level:

| Persona | Operating Level | Why |
|---------|-----------------|-----|
| **Planning** | City / WH / Brand | Movement plans, DOH cutoffs are set at city/WH level |
| **Procurement** | City / WH | POs are raised at warehouse level |
| **Category** | Brand / Category | Supplier negotiations happen at brand level |
| **Warehouse** | Warehouse | WH capacity is per-warehouse |
| **Pod Ops** | Pod | Store execution is pod-level |
| **ERP Team** | City / Region | Catalog config is city-level |
| **Product Support** | SKU | Control Room rules are SKU-specific |

**Implication**: Aggregating at "Brand×City" is WRONG for Pod Ops (they work at Pod level), but RIGHT for Category (they work at Brand level). Root-cause-first respects each persona's natural operating level.

---

#### Handling Shared Ownership

The personas document shows shared ownership cases:

| ai_owner Pattern | Primary | Secondary | Split Responsibility |
|------------------|---------|-----------|---------------------|
| Pod Ops / Planning | Pod Ops | Planning | Pod Ops: execution, space. Planning: movement settings |
| Warehouse / Planning | Warehouse | Planning | Warehouse: capacity. Planning: movement design |
| Category / Procurement | Category | Procurement | Category: negotiation. Procurement: PO creation |
| Category / ERP Team | Category | ERP Team | Category: assortment. ERP: enable/disable |
| Product Support / Category | Product Support | Category | Product Support: rules. Category: tiering |

**Solution**: Create SEPARATE alerts for each owner in split ownership cases, not one combined alert. This ensures each team gets actionable alerts at their operating level.

---

### Why This Matters

**Solution**: Group by WHO CAN FIX IT first, then aggregate at their operating level.

### Algorithm Pseudocode

```python
def generate_alerts(chronic_records):
    # STEP 1: GROUP BY ROOT CAUSE (ai_owner)
    primary_buckets = defaultdict(list)
    secondary_buckets = defaultdict(list)

    for record in chronic_records:
        owners = parse_ai_owner(record.ai_owner)
        # "Pod Ops / Planning" → ["Pod Ops", "Planning"]

        primary_owner = owners[0]
        secondary_owner = owners[1] if len(owners) > 1 else None

        primary_buckets[primary_owner].append(record)

        if secondary_owner:
            secondary_buckets[secondary_owner].append({
                'record': record,
                'primary_owner': primary_owner
            })

    # STEP 2: AGGREGATE AT PERSONA'S OPERATING LEVEL + PRIORITIZE
    all_alerts = []

    for owner, records in primary_buckets.items():
        persona = load_persona(owner)
        agg_level = persona.operating_level

        # Aggregate records at persona's natural level
        groups = aggregate_by(records, level=agg_level)

        # Calculate total GMV per group
        for group in groups:
            group.total_gmv_loss = sum(r.gmv_loss for r in group.records)
            group.affected_sku_count = len(set(r.sku_id for r in group.records))

        # SORT BY GMV LOSS (highest impact first)
        sorted_groups = sorted(groups, key=lambda g: g.total_gmv_loss, reverse=True)

        # TAKE TOP 5 PER PERSONA
        top_5 = sorted_groups[:5]

        for rank, group in enumerate(top_5, 1):
            alert = create_alert(
                owner=owner,
                scope=agg_level,
                entity=group.key,
                gmv_loss=group.total_gmv_loss,
                rank=rank,
                affected_skus=group.sku_ids,
                is_primary=True
            )
            all_alerts.append(alert)

    # STEP 3: HANDLE SHARED OWNERSHIP
    for owner, items in secondary_buckets.items():
        persona = load_persona(owner)
        agg_level = persona.operating_level

        records = [item['record'] for item in items]
        groups = aggregate_by(records, level=agg_level)

        sorted_groups = sorted(groups, key=lambda g: g.total_gmv_loss, reverse=True)
        top_5 = sorted_groups[:5]

        for rank, group in enumerate(top_5, 1):
            alert = create_alert(
                owner=owner,
                scope=agg_level,
                entity=group.key,
                gmv_loss=group.total_gmv_loss,
                rank=rank,
                is_primary=False,
                shared_with=get_primary_owners(group)
            )
            all_alerts.append(alert)

    return all_alerts
```

### Persona Operating Levels

| Persona | Operating Level | Aggregation Key | Example Alert |
|---------|-----------------|-----------------|---------------|
| **Planning** | City / WH | `city`, `warehouse` | "Bangalore forecasting issues" |
| **Procurement** | City / WH | `city`, `warehouse` | "Central WH PO issues" |
| **Category** | Brand / Category | `brand`, `l1_category` | "Coca-Cola fill rate issues" |
| **Warehouse** | Warehouse | `warehouse` | "Central WH outbound issues" |
| **Pod Ops** | Pod | `pod` | "HSR Pod space issues" |
| **ERP Team** | City | `city` | "Bangalore ERP config issues" |
| **Product Support** | SKU | `sku_id` | "SKU-12345 Control Room rule" |

---

## 5. RCA Generation Process

### How Claude Reasons Over Personas

```
INPUT: Alert + Persona File

STEP 1: Load Persona Context
─────────────────────────────
Read from personas/{owner}.md:
- "RCA Branch Mapping" section → understand reason codes
- "Diagnosis SOP" section → analysis steps
- "Agent Integration" section → key signals
- "Action Verbs" section → vocabulary

STEP 2: Analyze Alert Data
──────────────────────────
From alert:
- gmv_loss → magnitude of impact
- affected_skus → breadth of issue
- l1_reason_distribution → root cause breakdown
- chronic_days_avg → duration of issue

STEP 3: Generate L3 Narrative
─────────────────────────────
Rules:
- MUST be grounded in data (reference numbers)
- MUST explain WHY not just WHAT
- MUST be 2-3 sentences max
- NO hallucination (only reference available data)

Example:
"Vendor fill rates at 45% vs 80% target for Coca-Cola brand.
Primary supplier facing production constraints affecting
15 pods with ₹12.5L GMV at risk."

STEP 4: Generate Action Plan
────────────────────────────
Rules:
- Use persona's action verbs (Escalate, Club, Clear, etc.)
- Be specific (who, what)
- Maximum 2 actions

Example:
"Escalate to Brand POC. Activate secondary supplier."
```

### Action Verbs by Persona

| Persona | Action Verbs |
|---------|-------------|
| **Planning** | Review, Adjust, Increase, Modify, Align |
| **Procurement** | Raise, Club, Negotiate, Escalate, Reschedule, Reissue |
| **Category** | Escalate, Review, Align, Enable, Validate, Negotiate |
| **Warehouse** | Check, Review, Confirm, Identify, Escalate, Adjust |
| **Pod Ops** | Clear, Escalate, Adjust, Coordinate, Verify, Enable |
| **ERP Team** | Review, Fix, Validate, Sync, Enable, Escalate |
| **Product Support** | Check, Validate, Review, Update, Disable, Escalate, Debug |

---

## 6. Output Formats

### Slack Report Template

```
📊 AVAILABILITY ALERT SUMMARY | {date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
City: Bangalore | Category: FMCG | SKUs Tracked: 6,000
Total Chronic Issues: {total_issues} | Total GMV at Risk: ₹{total_gmv}L

ALERTS BY OWNER (Top 5 each, sorted by GMV impact)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 CATEGORY MANAGEMENT ({count} alerts | ₹{gmv}L GMV)
────────────────────────────────────────────────────
#1 {priority_emoji} {entity} | ₹{gmv}L | {impact_count} pods
   {key_metric}
   Action: {action_plan}

#2 {priority_emoji} {entity} | ₹{gmv}L | {impact_count} pods
   {key_metric}
   Action: {action_plan}

... (up to 5)

🏭 PROCUREMENT ({count} alerts | ₹{gmv}L GMV)
────────────────────────────────────────────────────
#1 {priority_emoji} {entity} | ₹{gmv}L | {impact_count} SKUs
   {key_metric}
   Action: {action_plan}

... (continue for each persona with alerts)
```

### JSON Schemas

#### chronic_records.json
```json
{
  "generated_at": "2026-01-13T10:00:00Z",
  "record_count": 150,
  "records": [
    {
      "sku_id": "SKU-12345",
      "sku_name": "Coca-Cola 500ml",
      "brand": "Coca-Cola",
      "business_category": "Beverages",
      "l1_category": "Soft Drinks",
      "l2_category": "Carbonated",
      "l3_category": "Cola",
      "city": "Bangalore",
      "pod": "HSR Pod",
      "warehouse": "Central WH",
      "availability_pct": 85.5,
      "target_pct": 99.9,
      "gmv_loss": 25000,
      "chronic_days": 18,
      "is_chronic_sku_pod": true,
      "l1_reason": "vendor_fillrate_low",
      "l2_reason": "primary_supplier_constraint",
      "ai_owner": "Category Management"
    }
  ]
}
```

#### alerts.json
```json
{
  "generated_at": "2026-01-13T10:05:00Z",
  "total_alerts": 28,
  "alerts_by_owner": {
    "Category Management": 5,
    "Procurement": 5,
    "Pod Ops": 5,
    "Planning": 4,
    "Warehouse": 3,
    "ERP Team": 2,
    "Product Support": 4
  },
  "alerts": [
    {
      "alert_id": "ALT-001",
      "owner": "Category Management",
      "scope": "Brand",
      "entity": "Coca-Cola",
      "gmv_loss": 1250000,
      "rank": 1,
      "affected_sku_count": 8,
      "affected_skus": ["SKU-12345", "SKU-12346", ...],
      "chronic_days_avg": 20,
      "l1_reason_distribution": {
        "vendor_fillrate_low": 0.65,
        "lead_time_violation": 0.35
      },
      "is_primary": true,
      "shared_with": null
    }
  ]
}
```

#### alerts_with_rca.json
```json
{
  "generated_at": "2026-01-13T10:10:00Z",
  "alerts": [
    {
      "alert_id": "ALT-001",
      "owner": "Category Management",
      "scope": "Brand",
      "entity": "Coca-Cola",
      "gmv_loss": 1250000,
      "rank": 1,
      "priority": "P0",
      "l3_narrative": "Vendor fill rates at 45% vs 80% target for Coca-Cola brand. Primary supplier facing production constraints affecting 15 pods.",
      "action_plan": "Escalate to Brand POC. Activate secondary supplier.",
      "key_signals": [
        "Fill Rate: 45% (target: 80%)",
        "Chronic Days: 20 avg",
        "Pods Affected: 15 (75%)"
      ]
    }
  ]
}
```

---

## 7. Daily Orchestration

### Command Sequence

```bash
# Daily run (triggered by cron or manual)
cd /path/to/availability-monitoring

# 1. Fetch chronic data
claude "fetch chronic data"
# Output: logs/chronic_records.json

# 2. Route by owner
claude "route alerts"
# Output: logs/owner_buckets.json

# 3. Aggregate per persona
claude "aggregate alerts"
# Output: logs/alerts.json

# 4. Generate RCA
claude "generate rca"
# Output: logs/alerts_with_rca.json

# 5. Format report
claude "format report"
# Output: outputs/slack_report.md

# 6. Commit and push
git add logs/ outputs/
git commit -m "Daily availability alerts $(date +%Y-%m-%d)"
git push origin main
```

### Error Handling

| Error Type | Detection | Recovery |
|------------|-----------|----------|
| Data source unavailable | Query timeout | Retry 3x, then alert on-call |
| No chronic records | Empty result | Log "No chronic issues today" |
| Persona file missing | FileNotFound | Use default aggregation (SKU level) |
| GMV calculation error | NaN/null values | Default to 0, flag in report |
| Report generation failure | Exception | Output partial report, log error |

### Logging

```
logs/
├── chronic_records.json      # Raw chronic data
├── owner_buckets.json        # Grouped by owner
├── alerts.json               # Aggregated alerts
├── alerts_with_rca.json      # With RCA narratives
└── run_log_{date}.txt        # Execution log

outputs/
└── slack_report.md           # Final report
```

---

## 8. Appendix

### Persona Summary Table

| Persona | File | RCA Branch | Operating Level | Key Metrics |
|---------|------|------------|-----------------|-------------|
| Planning | `planning.md` | Branch 1: Forecasting | City / WH | wMAPE, Missed Qty |
| Procurement | `procurement.md` | Branch 2: PO-led | City / WH | OTIF, UFR, LFR |
| Category | `category-management.md` | Branch 3: Supply-led | Brand / Category | Fill Rate, NPI TAT |
| Warehouse | `warehouse.md` | Branch 4: WH ops | Warehouse | GRN TAT, Outbound Fill |
| Pod Ops | `pod-ops.md` | Branch 5: Pod ops | Pod | Inwarding TAT, FTR |
| ERP Team | `erp-team.md` | Branch 6: Config | City | Enablement Rate |
| Product Support | `product-support.md` | Branch 6/7: Config | SKU | OOS Override % |

### Reason Code → Owner Mapping

```python
ROUTING_RULES = {
    # Branch 1: Forecasting-led → Planning
    'movement_rr_not_generated': 'Planning',
    'Forecasting_error': 'Planning',
    'conservative_doh': 'Planning',

    # Branch 2: PO-led → Procurement
    'moq_constraint': 'Procurement',
    'mov_constraint': 'Procurement',
    'po_not_raised': 'Procurement',
    'po_expired': 'Procurement',
    'contract_issue': 'Procurement',

    # Branch 3: Supply-led → Category Management
    'vendor_fillrate_low': 'Category Management',
    'brand_oos_at_source': 'Category Management',
    'lead_time_violation': 'Category Management',

    # Branch 4: Warehouse ops → Warehouse
    'wh_cap_missed': 'Warehouse',
    'wh_outbound_fill_rate': 'Warehouse',
    'putaway_delay': 'Warehouse',

    # Branch 5: Pod ops → Pod Ops
    'pod_space_full': 'Pod Ops',
    'pod_capped': 'Pod Ops',
    'slow_putaway': 'Pod Ops',
    'pod_disabled': 'Pod Ops',

    # Branch 6: Config → ERP Team / Product Support
    'item_disabled_erp': 'ERP Team',
    'vendor_code_missing': 'ERP Team',
    'control_room_misconfiguration': 'Product Support',
    'sku_mis_tiering': 'Product Support',
    'holiday_slot_error': 'Product Support',
}
```

### Base Table Schema (18 Fields)

| # | Field | Type | Source | Description |
|---|-------|------|--------|-------------|
| 1 | sku_id | STRING | rca_table | SKU identifier |
| 2 | sku_name | STRING | rca_table | SKU display name |
| 3 | brand | STRING | rca_table | Brand name |
| 4 | business_category | STRING | rca_table | Business category |
| 5 | l1_category | STRING | sku_mapping | Level 1 category |
| 6 | l2_category | STRING | sku_mapping | Level 2 category |
| 7 | l3_category | STRING | sku_mapping | Level 3 category |
| 8 | city | STRING | rca_table | City name |
| 9 | pod | STRING | rca_table | POD name |
| 10 | warehouse | STRING | rca_table | Warehouse name |
| 11 | availability_pct | FLOAT | Derived | Avg availability last 15 days |
| 12 | target_pct | FLOAT | Derived | Target (99.9%) |
| 13 | gmv_loss | FLOAT | Derived | GMV loss due to unavailability |
| 14 | chronic_days | INT | Derived | Days below target (of 30) |
| 15 | is_chronic_sku_pod | BOOL | Derived | Chronic flag (≥15 days) |
| 16 | l1_reason | STRING | rca_table | High-level RCA category |
| 17 | l2_reason | STRING | rca_table | Specific cause |
| 18 | ai_owner | STRING | rca_table | Recommended owner |

---

# MILESTONE 2: DASHBOARDS

## 9. Dashboard Design

### Dashboard Architecture

Two complementary views serving different audiences:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DASHBOARD ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────┐       ┌─────────────────────────────┐│
│   │  EXECUTIVE          │       │  PERSONA DASHBOARDS         ││
│   │  DASHBOARD          │       │  (7 team-specific views)    ││
│   │                     │       │                             ││
│   │  • High-level KPIs  │       │  • Planning                 ││
│   │  • GMV by Owner     │       │  • Procurement              ││
│   │  • Alerts by Branch │       │  • Category Management      ││
│   │  • Trend over time  │       │  • Warehouse                ││
│   │  • Top 5 P0 alerts  │       │  • Pod Ops                  ││
│   │                     │       │  • ERP Team                 ││
│   │  Audience:          │       │  • Product Support          ││
│   │  Leadership, SCM    │       │                             ││
│   │  Head, City Leads   │       │  Audience: Team members,    ││
│   │                     │       │  Managers, On-call          ││
│   └─────────────────────┘       └─────────────────────────────┘│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 9.1 Executive Dashboard

**Audience**: Leadership, SCM Head, City Leads
**Purpose**: High-level view of availability health, GMV at risk, and owner accountability

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  🧠 SWIGGY BRAIN - AVAILABILITY MONITORING                          📅 Jan 14, 2026 | 10:30 AM  🔔     │
│  ─────────────────────────────────────────────────────────────────────────────────────────────────────  │
│  📍 Bangalore  |  🏷️ FMCG  |  📦 6,000 Bradman SKUs                    [Executive View ▼] [🔄 Refresh] │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────── KPI SUMMARY ─────────────────────────────────────────────┐
│                                                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  AVAILABILITY   │  │  CHRONIC SKUS   │  │   GMV AT RISK   │  │  TOTAL ALERTS   │  │  RESOLUTION   │  │
│  │                 │  │                 │  │                 │  │                 │  │     RATE      │  │
│  │    98.2%        │  │      127        │  │   ₹52.3L        │  │       28        │  │     73%       │  │
│  │   ──────────    │  │   ──────────    │  │   ──────────    │  │   ──────────    │  │   ──────────  │  │
│  │  Target: 99.9%  │  │  ▲ 12 vs SDLW   │  │  ▼ ₹8L vs SDLW  │  │  P0:5 P1:12 P2:11│ │  ▲ 5% vs LW   │  │
│  │   🔴 -1.7%      │  │   🔴 +10%       │  │   🟢 -13%       │  │                 │  │   🟢          │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  └───────────────┘  │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────── ACCOUNTABILITY & DISTRIBUTION ──────────────────────────────────────────┐
│                                                                                                         │
│   GMV AT RISK BY OWNER                       │   ALERTS BY RCA BRANCH                                  │
│   ════════════════════                       │   ════════════════════                                  │
│                                              │                                                          │
│   Category     ████████████████████  ₹18.2L  │   Branch 3: Supply    ████████████████  35%             │
│   Procurement  █████████████████     ₹12.8L  │   Branch 2: PO-led    ████████████      25%             │
│   Pod Ops      ████████████          ₹8.4L   │   Branch 5: Pod       ██████████        20%             │
│   Planning     ██████████            ₹6.5L   │   Branch 1: Forecast  ██████            12%             │
│   Warehouse    ████████              ₹4.2L   │   Branch 4: WH        ███               5%              │
│   ERP Team     ████                  ₹1.8L   │   Branch 6: Config    ██                3%              │
│   Product Sup  █                     ₹0.4L   │                                                          │
│                                              │                                                          │
│   CHRONIC DURATION (DAYS)                    │   TREND: CHRONIC SKUs (Last 30 Days)                    │
│   ═══════════════════════                    │   ═══════════════════════════════════                   │
│                                              │                                                          │
│   15-18 days   ████████████████████  45%     │   150│    ╭─╮                                            │
│   19-22 days   ██████████████        30%     │      │   ╭╯ ╰╮    ╭──╮                                   │
│   23-26 days   ████████              18%     │   100│──╮╯    ╰──╯  ╰─╮   ╭╮                             │
│   27-30 days   ███                   7%      │      │  ╰              ╰─╯ ╰──●127                       │
│                                              │    50│                                                   │
│                                              │      └────────────────────────────────▶                  │
│                                              │       D1      D10      D20      D30                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────── OWNER ACCOUNTABILITY TABLE ──────────────────────────────────────┐
│                                                                                                         │
│  OWNER              │ ALERTS │ GMV AT RISK │ TOP ISSUE                    │ STATUS      │ ACTIONS      │
│  ═══════════════════╪════════╪═════════════╪══════════════════════════════╪═════════════╪══════════════│
│  📦 Category        │   5    │   ₹18.2L    │ Coca-Cola fill rate 45%      │ 🔴 Critical │ [View →]     │
│  🏭 Procurement     │   5    │   ₹12.8L    │ MOQ blocking 35% of POs      │ 🔴 Critical │ [View →]     │
│  🏪 Pod Ops         │   5    │   ₹8.4L     │ HSR Pod at 98% capacity      │ 🟠 Warning  │ [View →]     │
│  📋 Planning        │   4    │   ₹6.5L     │ Snacks DOH gap -2 days       │ 🟠 Warning  │ [View →]     │
│  🏢 Warehouse       │   3    │   ₹4.2L     │ GRN TAT 6.2hrs (target: 4)   │ 🟡 Monitor  │ [View →]     │
│  ⚙️ ERP Team        │   2    │   ₹1.8L     │ 8 vendor codes missing       │ 🟡 Monitor  │ [View →]     │
│  🔧 Product Support │   4    │   ₹0.4L     │ 12 stale OOS overrides       │ 🟡 Monitor  │ [View →]     │
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────── TOP 5 P0 ALERTS (CRITICAL) ─────────────────────────────────────┐
│                                                                                                         │
│  # │ SCOPE       │ ENTITY              │ OWNER       │ GMV      │ DAYS │ ROOT CAUSE SUMMARY            │
│  ══╪═════════════╪═════════════════════╪═════════════╪══════════╪══════╪═══════════════════════════════│
│  1 │ Brand×City  │ Coca-Cola           │ Category    │ ₹12.5L   │  22  │ Supplier fill rate 45%        │
│  2 │ WH×Category │ Central WH × Dairy  │ Procurement │ ₹5.2L    │  18  │ MOQ blocking 60%              │
│  3 │ Brand×City  │ Parle               │ Category    │ ₹3.2L    │  20  │ Lead time violation           │
│  4 │ Pod         │ HSR Layout          │ Pod Ops     │ ₹2.8L    │  16  │ Rack utilization 98%          │
│  5 │ City×Cat    │ Bangalore × Snacks  │ Planning    │ ₹2.5L    │  19  │ wMAPE 35% (target 20%)        │
│                                                                                                         │
│  [View All 28 Alerts →]                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 9.2 Persona Dashboard Template

**Audience**: Team members, Managers, On-call engineers
**Purpose**: Team-specific view with relevant metrics, alerts, and actionables

Each persona dashboard follows this consistent structure:

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  PERSONA DASHBOARD TEMPLATE                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  SECTION 1: HEADER                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ • Team name + icon                                                              │   │
│  │ • Operating level (Pod / Warehouse / Brand / City)                              │   │
│  │ • Last updated timestamp                                                        │   │
│  │ • Filter: Priority (All/P0/P1/P2)                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  SECTION 2: PERSONA-SPECIFIC KPIs (4 metrics)                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ • Primary metric relevant to team's function                                    │   │
│  │ • Secondary metrics showing team health                                         │   │
│  │ • All with targets and trend indicators                                         │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  SECTION 3: ALERT LIST (Top 5, sorted by GMV)                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ • Priority badge + Scope badge                                                  │   │
│  │ • Entity name at team's operating level                                         │   │
│  │ • GMV loss + Chronic days + Impact count                                        │   │
│  │ • 7-day trend sparkline                                                         │   │
│  │ • Expandable: Attribution breakdown, RCA, Plan of Action                        │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
│  SECTION 4: TOP ACTIONABLES (5 items)                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │ • Specific, named actions using team's action verbs                             │   │
│  │ • GMV impact quantified                                                         │   │
│  │ • [Execute] and [Snooze] buttons                                                │   │
│  │ • LLM disclaimer                                                                │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 9.3 Persona Dashboards

#### 6.3.1 CATEGORY MANAGEMENT Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  📦 CATEGORY MANAGEMENT                                     📅 Jan 14, 2026 | 10:30 AM │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  Operating Level: Brand / Category / City            Filter: [All ▼] P0 P1 P2  [🔄]    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ AVG FILL RATE   │ │ BRANDS AT RISK  │ │ NPI PENDING     │ │ ESCALATIONS     │
│                 │ │                 │ │                 │ │                 │
│     68%         │ │      12         │ │       5         │ │     3 OPEN      │
│  ──────────     │ │  ──────────     │ │  ──────────     │ │  ──────────     │
│  Target: 80%    │ │  GMV: ₹18.2L    │ │  > 7 days old   │ │  Avg age: 4d    │
│  🔴 -12%        │ │  🔴 +3 vs LW    │ │  🟠 +2 vs LW    │ │  🟡 stable      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────────────────────────── ALERTS (5) ──────────────────────────────────────┐
│                                                                                         │
│  🔥 P0  [BRAND×CITY]  Coca-Cola × Bangalore                              ╭─────╮       │
│  ₹12.5L GMV  |  22 days  |  15 pods (75%)                                │trend│       │
│  Fill Rate: 45% → 80%                                                    │  ↘  │       │
│  ┌─────────────────────────────────────────────────────────────────┐    ╰─────╯       │
│  │ ⚙ Affected: Coca-Cola 500ml, 1L, 2L, Zero 500ml (+4 more)       │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ◎ Attribution: Fill Rate 65% | OTIF 20% | Supply 15%            │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ 🤖 RCA: Primary supplier HCCB failing fill targets. Production  │                  │
│  │    constraints at Bidadi plant. 3 weeks declining trend.        │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ⚡ Actions: Escalate to Brand POC | Activate secondary supplier │                  │
│  │ ⚠ LLM generated - verify before action                          │                  │
│  └─────────────────────────────────────────────────────────────────┘                  │
│  ─────────────────────────────────────────────────────────────────────────────────────│
│  🟠 P1  [BRAND×CITY]  Parle × Bangalore                    ₹3.2L  |  18d  |  8 pods   │
│  🟠 P1  [BRAND×POD]   Britannia × Koramangala              ₹1.8L  |  16d  |  1 pod    │
│  🟡 P2  [BRAND×CITY]  ITC × Bangalore                      ₹0.8L  |  15d  |  5 pods   │
│  🟡 P2  [BRAND×POD]   Haldirams × HSR                      ₹0.4L  |  15d  |  1 pod    │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────── TOP ACTIONABLES ─────────────────────────────────────┐
│                                                                                         │
│  □  Escalate Coca-Cola to Brand POC (HCCB) ──────────── ₹12.5L  [Execute] [Snooze]    │
│  □  Activate secondary supplier for Parle products ──── ₹3.2L   [Execute] [Snooze]    │
│  □  Review fill rate SLA breach with Britannia ──────── ₹1.8L   [Execute] [Snooze]    │
│  □  Schedule weekly brand connect with ITC ──────────── ₹0.8L   [Execute] [Snooze]    │
│  □  Validate tiering for Haldirams regional SKUs ────── ₹0.4L   [Execute] [Snooze]    │
│                                                                                         │
│  ⚠ LLM generated recommendations - please verify before executing                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### 6.3.2 PROCUREMENT Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🏭 PROCUREMENT                                             📅 Jan 14, 2026 | 10:30 AM │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  Operating Level: City / Warehouse                   Filter: [All ▼] P0 P1 P2  [🔄]    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   OTIF RATE     │ │  MOQ BLOCKING   │ │ PENDING POs     │ │CONTRACT ISSUES  │
│                 │ │                 │ │                 │ │                 │
│     72%         │ │      35%        │ │      18         │ │     4 EXPIRED   │
│  ──────────     │ │  ──────────     │ │  ──────────     │ │  ──────────     │
│  Target: 90%    │ │  ₹8.2L blocked  │ │  > 48 hrs old   │ │  ₹3.1L blocked  │
│  🔴 -18%        │ │  🔴 +5% vs LW   │ │  🟠 +4 vs LW    │ │  🔴 +2 vs LW    │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────────────────────────── ALERTS (5) ──────────────────────────────────────┐
│                                                                                         │
│  🔥 P0  [WH×CATEGORY]  Central WH × Dairy                                ╭─────╮       │
│  ₹5.2L GMV  |  18 days  |  12 SKUs                                       │trend│       │
│  MOQ Blocking: 60% of items                                              │  ↘  │       │
│  ┌─────────────────────────────────────────────────────────────────┐    ╰─────╯       │
│  │ ⚙ Affected: Amul Butter 500g, Milk 1L, Curd 400g (+9 more)      │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ◎ Attribution: MOQ 60% | Contract 25% | Tonnage 15%             │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ 🤖 RCA: MOQ threshold 500 cases blocking replenishment.         │                  │
│  │    Current demand only 180 cases. Need clubbing or negotiation. │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ⚡ Actions: Club POs across WH | Negotiate MOQ reduction         │                  │
│  │ ⚠ LLM generated - verify before action                          │                  │
│  └─────────────────────────────────────────────────────────────────┘                  │
│  ─────────────────────────────────────────────────────────────────────────────────────│
│  🟠 P1  [WH×CATEGORY]  South WH × Beverages                ₹2.3L  |  16d  |  6 SKUs   │
│  🟠 P1  [CITY]         Bangalore × Staples                 ₹2.1L  |  17d  |  8 SKUs   │
│  🟡 P2  [WH×CATEGORY]  Central WH × Snacks                 ₹1.8L  |  15d  |  5 SKUs   │
│  🟡 P2  [WH×CATEGORY]  North WH × Personal Care            ₹1.4L  |  15d  |  4 SKUs   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────── TOP ACTIONABLES ─────────────────────────────────────┐
│                                                                                         │
│  □  Club POs for Dairy category to meet MOQ ─────────── ₹5.2L   [Execute] [Snooze]    │
│  □  Renew expired contract: South WH × Beverages ────── ₹2.3L   [Execute] [Snooze]    │
│  □  Raise emergency PO for Staples (0 inventory) ────── ₹2.1L   [Execute] [Snooze]    │
│  □  Negotiate MOQ reduction with Amul (500→200) ─────── ₹1.8L   [Execute] [Snooze]    │
│  □  Reissue expired PO for Personal Care ────────────── ₹1.4L   [Execute] [Snooze]    │
│                                                                                         │
│  ⚠ LLM generated recommendations - please verify before executing                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### 6.3.3 POD OPS Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🏪 POD OPS                                                 📅 Jan 14, 2026 | 10:30 AM │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  Operating Level: Pod / Pod × SKU                    Filter: [All ▼] P0 P1 P2  [🔄]    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ AVG RACK UTIL   │ │ INWARDING TAT   │ │ PODS AT RISK    │ │   FTR RATE      │
│                 │ │                 │ │                 │ │                 │
│     92%         │ │    4.2 hrs      │ │       5         │ │     88%         │
│  ──────────     │ │  ──────────     │ │  ──────────     │ │  ──────────     │
│  Target: <85%   │ │  Target: <2 hrs │ │  >95% capacity  │ │  Target: 95%    │
│  🔴 +7%         │ │  🔴 +2.2 hrs    │ │  🟠 +1 vs LW    │ │  🟠 -7%         │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────────────────────────── ALERTS (5) ──────────────────────────────────────┐
│                                                                                         │
│  🔥 P0  [POD]  HSR Layout                                                ╭─────╮       │
│  ₹2.8L GMV  |  16 days  |  9 SKUs                                        │trend│       │
│  Rack Utilization: 98%                                                   │  →  │       │
│  ┌─────────────────────────────────────────────────────────────────┐    ╰─────╯       │
│  │ ⚙ Affected: Coca-Cola 2L, Maggi 4-pack, Amul Butter (+6 more)   │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ◎ Attribution: Space 70% | Putaway 20% | Manpower 10%           │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ 🤖 RCA: Pod at 98% rack capacity. 45 units pending putaway >4   │                  │
│  │    hrs. Slow mover backlog consuming 15% of space.              │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ⚡ Actions: Clear backlog | Return slow movers | Add loader     │                  │
│  │ ⚠ LLM generated - verify before action                          │                  │
│  └─────────────────────────────────────────────────────────────────┘                  │
│  ─────────────────────────────────────────────────────────────────────────────────────│
│  🟠 P1  [POD]  Koramangala 4th Block                       ₹2.1L  |  15d  |  7 SKUs   │
│  🟠 P1  [POD]  Indiranagar                                 ₹1.6L  |  17d  |  6 SKUs   │
│  🟡 P2  [POD]  BTM Layout                                  ₹1.2L  |  15d  |  5 SKUs   │
│  🟡 P2  [POD]  Whitefield                                  ₹0.7L  |  16d  |  4 SKUs   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────── TOP ACTIONABLES ─────────────────────────────────────┐
│                                                                                         │
│  □  Clear backlog at HSR Pod (45 units pending) ─────── ₹2.8L   [Execute] [Snooze]    │
│  □  Add evening loader shift at Koramangala ─────────── ₹2.1L   [Execute] [Snooze]    │
│  □  Return slow movers at Indiranagar (12 SKUs) ─────── ₹1.6L   [Execute] [Snooze]    │
│  □  Escalate rack damage issue at BTM ───────────────── ₹1.2L   [Execute] [Snooze]    │
│  □  Review space allocation at Whitefield ───────────── ₹0.7L   [Execute] [Snooze]    │
│                                                                                         │
│  ⚠ LLM generated recommendations - please verify before executing                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### 6.3.4 PLANNING Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  📋 PLANNING                                                📅 Jan 14, 2026 | 10:30 AM │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  Operating Level: City / Warehouse / Brand           Filter: [All ▼] P0 P1 P2  [🔄]    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  FORECAST ACC   │ │  DOH BREACHES   │ │  RR GENERATION  │ │ MOVEMENT GAPS   │
│                 │ │                 │ │                 │ │                 │
│   wMAPE: 22%    │ │      8 SKUs     │ │     94%         │ │     12 SKUs     │
│  ──────────     │ │  ──────────     │ │  ──────────     │ │  ──────────     │
│  Target: <20%   │ │  Below min DOH  │ │  Target: 100%   │ │  No movement    │
│  🟠 +2%         │ │  🟠 +3 vs LW    │ │  🟡 -6%         │ │  🔴 +5 vs LW    │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────────────────────────── ALERTS (4) ──────────────────────────────────────┐
│                                                                                         │
│  🟠 P1  [CITY×CATEGORY]  Bangalore × Snacks                              ╭─────╮       │
│  ₹2.5L GMV  |  19 days  |  7 SKUs                                        │trend│       │
│  wMAPE: 35% (target: 20%)                                                │  ↘  │       │
│  ┌─────────────────────────────────────────────────────────────────┐    ╰─────╯       │
│  │ ⚙ Affected: Lays Classic, Kurkure, Haldirams Bhujia (+4 more)   │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ◎ Attribution: Forecast 60% | DOH Setting 30% | RR Gap 10%      │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ 🤖 RCA: Snacks category underforecasted by 35%. Weekend demand  │                  │
│  │    spike not captured. DOH set at 2 days, should be 4.          │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ⚡ Actions: Increase DOH to 4 days | Review forecast model       │                  │
│  │ ⚠ LLM generated - verify before action                          │                  │
│  └─────────────────────────────────────────────────────────────────┘                  │
│  ─────────────────────────────────────────────────────────────────────────────────────│
│  🟠 P1  [WH×CATEGORY]   Central WH × Dairy                 ₹2.0L  |  17d  |  5 SKUs   │
│  🟡 P2  [CITY×CATEGORY] Bangalore × Beverages              ₹1.2L  |  16d  |  4 SKUs   │
│  🟡 P2  [BRAND]         Amul Brand                         ₹0.8L  |  15d  |  3 SKUs   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────── TOP ACTIONABLES ─────────────────────────────────────┐
│                                                                                         │
│  □  Increase DOH for Snacks (current: 2 → rec: 4) ───── ₹2.5L   [Execute] [Snooze]    │
│  □  Review forecast model for Dairy seasonality ─────── ₹2.0L   [Execute] [Snooze]    │
│  □  Generate missing RRs for Beverages (12 SKUs) ────── ₹1.2L   [Execute] [Snooze]    │
│  □  Adjust safety stock for Amul high-velocity ──────── ₹0.8L   [Execute] [Snooze]    │
│                                                                                         │
│  ⚠ LLM generated recommendations - please verify before executing                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### 6.3.5 WAREHOUSE Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🏢 WAREHOUSE                                               📅 Jan 14, 2026 | 10:30 AM │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  Operating Level: Warehouse / WH × Category          Filter: [All ▼] P0 P1 P2  [🔄]    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   GRN TAT       │ │ OUTBOUND FILL   │ │ CAPACITY UTIL   │ │ PUTAWAY PENDING │
│                 │ │                 │ │                 │ │                 │
│    6.2 hrs      │ │     91%         │ │     88%         │ │    120 units    │
│  ──────────     │ │  ──────────     │ │  ──────────     │ │  ──────────     │
│  Target: <4 hrs │ │  Target: 95%    │ │  Target: <90%   │ │  > 24 hrs old   │
│  🔴 +2.2 hrs    │ │  🟠 -4%         │ │  🟡 -2%         │ │  🟠 +30 vs LW   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────────────────────────── ALERTS (3) ──────────────────────────────────────┐
│                                                                                         │
│  🟠 P1  [WAREHOUSE]  Central WH                                          ╭─────╮       │
│  ₹2.4L GMV  |  17 days  |  8 SKUs                                        │trend│       │
│  GRN TAT: 6.2 hrs (target: 4 hrs)                                        │  ↘  │       │
│  ┌─────────────────────────────────────────────────────────────────┐    ╰─────╯       │
│  │ ⚙ Affected: Multiple categories - Dairy, Snacks, Beverages      │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ◎ Attribution: GRN Delay 50% | Outbound 30% | Capacity 20%      │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ 🤖 RCA: GRN processing delayed due to manpower shortage. 45     │                  │
│  │    pending GRNs > 6 hrs. Outbound dispatch frequency reduced.   │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ⚡ Actions: Clear GRN backlog | Increase dispatch frequency      │                  │
│  │ ⚠ LLM generated - verify before action                          │                  │
│  └─────────────────────────────────────────────────────────────────┘                  │
│  ─────────────────────────────────────────────────────────────────────────────────────│
│  🟡 P2  [WAREHOUSE]  South WH                              ₹1.2L  |  15d  |  4 SKUs   │
│  🟡 P2  [WAREHOUSE]  North WH                              ₹0.6L  |  16d  |  3 SKUs   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────── TOP ACTIONABLES ─────────────────────────────────────┐
│                                                                                         │
│  □  Clear GRN backlog at Central WH (45 pending) ────── ₹2.4L   [Execute] [Snooze]    │
│  □  Increase outbound dispatch to South pods ────────── ₹1.2L   [Execute] [Snooze]    │
│  □  Review appointment slots for tomorrow ───────────── ₹0.6L   [Execute] [Snooze]    │
│                                                                                         │
│  ⚠ LLM generated recommendations - please verify before executing                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### 6.3.6 ERP TEAM Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚙️ ERP TEAM                                                📅 Jan 14, 2026 | 10:30 AM │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  Operating Level: City / Region / Catalog            Filter: [All ▼] P0 P1 P2  [🔄]    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  ENABLEMENT %   │ │ VENDOR CODES    │ │ CONTRACT SYNC   │ │ CONFIG ERRORS   │
│                 │ │                 │ │                 │ │                 │
│     97.2%       │ │   8 MISSING     │ │    3 PENDING    │ │       2         │
│  ──────────     │ │  ──────────     │ │  ──────────     │ │  ──────────     │
│  Target: 99%    │ │  Blocking POs   │ │  > 48 hrs old   │ │  Blocking avail │
│  🟠 -1.8%       │ │  🔴 +3 vs LW    │ │  🟡 stable      │ │  🟡 stable      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────────────────────────── ALERTS (2) ──────────────────────────────────────┐
│                                                                                         │
│  🟠 P1  [CITY]  Bangalore - Vendor Code Issues                           ╭─────╮       │
│  ₹1.2L GMV  |  16 days  |  8 SKUs                                        │trend│       │
│  Missing vendor codes blocking POs                                       │  →  │       │
│  ┌─────────────────────────────────────────────────────────────────┐    ╰─────╯       │
│  │ ⚙ Affected: New suppliers - Fresh Farms, Metro Beverages (+6)   │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ◎ Attribution: Vendor Code 70% | Contract 20% | Mapping 10%     │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ 🤖 RCA: 8 new suppliers onboarded but vendor codes not created  │                  │
│  │    in ERP. Blocking PO creation for 8 SKUs across categories.   │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ⚡ Actions: Create vendor codes | Sync contracts to ERP          │                  │
│  │ ⚠ LLM generated - verify before action                          │                  │
│  └─────────────────────────────────────────────────────────────────┘                  │
│  ─────────────────────────────────────────────────────────────────────────────────────│
│  🟡 P2  [CITY]  Bangalore - Contract Sync                  ₹0.6L  |  15d  |  3 SKUs   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────── TOP ACTIONABLES ─────────────────────────────────────┐
│                                                                                         │
│  □  Create vendor codes for 8 new suppliers ─────────── ₹1.2L   [Execute] [Snooze]    │
│  □  Sync Amul contract (blocking PO creation) ───────── ₹0.6L   [Execute] [Snooze]    │
│                                                                                         │
│  ⚠ LLM generated recommendations - please verify before executing                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

#### 6.3.7 PRODUCT SUPPORT Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  🔧 PRODUCT SUPPORT                                         📅 Jan 14, 2026 | 10:30 AM │
│  ─────────────────────────────────────────────────────────────────────────────────────  │
│  Operating Level: SKU / System Config                Filter: [All ▼] P0 P1 P2  [🔄]    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  OOS OVERRIDES  │ │  STALE RULES    │ │ HOLIDAY SLOTS   │ │  CR RULE ERRS   │
│                 │ │                 │ │                 │ │                 │
│      12         │ │       4         │ │   2 MISCONFIG   │ │       1         │
│  ──────────     │ │  ──────────     │ │  ──────────     │ │  ──────────     │
│  > 48 hrs old   │ │  Not disabled   │ │  Blocking sales │ │  Eval failure   │
│  🟠 +4 vs LW    │ │  🟠 +2 vs LW    │ │  🔴 new issue   │ │  🟡 stable      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

┌─────────────────────────────────────── ALERTS (4) ──────────────────────────────────────┐
│                                                                                         │
│  🟡 P2  [SKU]  SKU-78901 - OOS Override Stale                            ╭─────╮       │
│  ₹0.15L GMV  |  15 days  |  1 SKU                                        │trend│       │
│  Manual OOS flag not reverted after quality issue resolved               │  →  │       │
│  ┌─────────────────────────────────────────────────────────────────┐    ╰─────╯       │
│  │ ⚙ Affected: Maggi 2-min Masala 70g                              │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ◎ Attribution: OOS Override 100%                                │                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ 🤖 RCA: Manual OOS override set on Jan 2 for quality issue.     │                  │
│  │    Issue resolved Jan 5 but flag not cleared. 50 units sellable.│                  │
│  ├─────────────────────────────────────────────────────────────────┤                  │
│  │ ⚡ Actions: Clear overridden_oos flag | Verify inventory quality │                  │
│  │ ⚠ LLM generated - verify before action                          │                  │
│  └─────────────────────────────────────────────────────────────────┘                  │
│  ─────────────────────────────────────────────────────────────────────────────────────│
│  🟡 P2  [CONFIG] Flash Sale Rules - Not Disabled           ₹0.12L |  3d   |  4 SKUs   │
│  🟡 P2  [CONFIG] Holiday Slot - Republic Day Misconfig     ₹0.08L |  1d   |  2 SKUs   │
│  🟡 P2  [SKU]    SKU-12345 - CR Rule Eval Failure          ₹0.05L |  2d   |  1 SKU    │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────── TOP ACTIONABLES ─────────────────────────────────────┐
│                                                                                         │
│  □  Clear 12 stale OOS overrides (> 48 hrs) ─────────── ₹0.15L  [Execute] [Snooze]    │
│  □  Disable flash sale rules from Jan 11 event ──────── ₹0.12L  [Execute] [Snooze]    │
│  □  Fix holiday slot config for Republic Day ────────── ₹0.08L  [Execute] [Snooze]    │
│  □  Debug CR rule eval failure for SKU-12345 ────────── ₹0.05L  [Execute] [Snooze]    │
│                                                                                         │
│  ⚠ LLM generated recommendations - please verify before executing                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 9.4 Dashboard Design Summary

#### Persona Metrics Reference

| Persona | KPI 1 | KPI 2 | KPI 3 | KPI 4 |
|---------|-------|-------|-------|-------|
| **Category** | Avg Fill Rate | Brands at Risk | NPI Pending | Open Escalations |
| **Procurement** | OTIF Rate | MOQ Blocking % | Pending POs | Contract Issues |
| **Pod Ops** | Rack Utilization | Inwarding TAT | Pods at Risk | FTR Rate |
| **Planning** | Forecast Acc (wMAPE) | DOH Breaches | RR Generation % | Movement Gaps |
| **Warehouse** | GRN TAT | Outbound Fill % | Capacity Util | Putaway Pending |
| **ERP Team** | Enablement % | Missing Vendor Codes | Contract Sync | Config Errors |
| **Product Support** | OOS Overrides | Stale Rules | Holiday Misconfig | CR Rule Errors |

#### Operating Level by Persona

| Persona | Primary Level | Secondary Level | Alert Scope Examples |
|---------|---------------|-----------------|----------------------|
| **Category** | Brand | Category / City | BRAND×CITY, BRAND×POD |
| **Procurement** | Warehouse | City | WH×CATEGORY, CITY |
| **Pod Ops** | Pod | Pod×SKU | POD |
| **Planning** | City | WH / Brand | CITY×CATEGORY, WH×CATEGORY |
| **Warehouse** | Warehouse | WH×Category | WAREHOUSE |
| **ERP Team** | City | Region | CITY |
| **Product Support** | SKU | Config | SKU, CONFIG |

---
