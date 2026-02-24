# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Availability Monitoring & RCA Copilot POC** — An automated system that detects chronic SKU availability issues and generates actionable insights with root cause analysis and recommended owners.

**Core Question**: "Which SKUs have chronic availability issues, why, and who should fix them?"

**Scope**: Bangalore, FMCG, ~6,000 Bradman SKUs, Chronic threshold (≥15 of 30 days below 99.9%)

**Timeline**: 3 working days (Jan 13-15, 2026)

**Documentation**: See `plan.md` for execution breakdown.

## Two-Stage Architecture

### Stage 1: Rule-Based Tree Traversal (Deduplication)

Top-down traversal to eliminate duplicate alerts:

```
Level 1: Brand × City     — Is brand chronic across entire city?
    ↓ (if no)
Level 2: Brand × Pod      — Is brand chronic at specific pods?
    ↓ (if no)
Level 3: SKU × City       — Is single SKU chronic across city?
    ↓ (if no)
Level 4: Warehouse × Cat  — Multiple pods from same warehouse affected?
    ↓ (if no)
Level 5: SKU × Pod        — Isolated pod-level issue
```

**Output**: Deduplicated incident list with alert type and entity.

### Stage 2: LLM-Based Analysis (Claude)

Each deduplicated incident processed by LLM for RCA:

**LLM Call 1 - Structured RCA (JSON)**:
```json
{
  "l1_reason": "Fill Rate Issue",
  "l2_reason": "Vendor fillrates 65%, target 80%",
  "l3_reason": "Root cause narrative with context...",
  "owner": "Procurement",
  "plan_of_action": "Escalate to vendor, review MOQ constraints"
}
```

**LLM Call 2 - Report Formatting (HTML)**:
- Summary card with metrics
- Impact breakdown (GMV loss, pods affected)
- Attribution percentages
- Action recommendations

## Base Table Schema

**Table**: `availability_monitoring` (20 fields)

| Field | Type | Description |
|-------|------|-------------|
| `sku_id` | STRING | SKU identifier |
| `sku_name` | STRING | SKU display name |
| `brand_id` | STRING | Brand identifier |
| `brand_name` | STRING | Brand display name |
| `category` | STRING | Product category |
| `pod_id` | STRING | POD (dark store) identifier |
| `pod_name` | STRING | POD display name |
| `warehouse_id` | STRING | Source warehouse ID |
| `warehouse_name` | STRING | Warehouse display name |
| `city` | STRING | City name (Bangalore) |
| `availability_pct` | FLOAT | Avg availability last 15 days |
| `target_pct` | FLOAT | Target availability (99.9%) |
| `gmv_loss` | FLOAT | GMV loss due to unavailability |
| `chronic_days` | INT | Days below target (of last 30) |
| `is_chronic_sku_pod` | BOOL | SKU×POD chronic flag |
| `num_pods_impacted` | INT | PODs with this SKU issue |
| `pct_pods_impacted` | FLOAT | % of city PODs affected |
| `l1_reason` | STRING | High-level RCA category |
| `l2_reason` | STRING | Specific cause |
| `owner` | STRING | Recommended action owner |

## Alert Types

| Type | Scope | Example |
|------|-------|---------|
| Brand × City | Brand chronic across all city PODs | Coca-Cola chronic in Bangalore |
| Brand × Pod | Brand chronic at specific PODs | Pepsi chronic at HSR POD |
| SKU × City | Single SKU chronic citywide | Maggi 2-min noodles chronic |
| SKU × Pod | Single SKU chronic at one POD | Parle-G chronic at Koramangala |
| Warehouse × Cat | Multiple PODs from same WH | Central WH → 5 PODs affected |

## Alert Prioritization

| Priority | Criteria | Action |
|----------|----------|--------|
| P0 | GMV loss ≥ ₹X Lakhs | Immediate escalation |
| P1 | GMV loss ₹Y - ₹X Lakhs | Same-day resolution |
| P2 | GMV loss < ₹Y Lakhs | Track within week |

## Key Thresholds

| Parameter | Value |
|-----------|-------|
| Target availability | 99.9% |
| Chronic threshold | ≥15 of 30 days below target |
| Yesterday check | Must be below target yesterday too |
| City POD threshold | ≥x% of city PODs affected for SKU×City alert |

## Data Sources

| Source | Schema | Purpose |
|--------|--------|---------|
| `analytics_prod.analytics_public_rb_bradman_spin_list_16_dec_seasonality_eol_removal` | Analytics | Bradman SKUs (is_top_item = 1) |
| `analytics.public.sku_wise_availability_rca_with_reasons_v7` | Analytics | Availability RCA with L1/L2 reasons |

**Filters**:
- `is_top_item = 1` for Bradman SKUs
- `assortment IN ('A', 'MLT', 'MnE')` for availability RCA

## Output Format

### Slack Message Structure

**Summary Header**:
```
📊 Availability Alert Summary | Jan 13, 2026
City: Bangalore | Category: FMCG
Tracked SKUs: 6,000 | Chronic Issues: 45
City Avg Availability: 98.7% | Target: 99.9%
Total GMV Loss: ₹X Lakhs
```

**Detail Card** (per alert):
```
🔥 P0 | Brand × City | Coca-Cola

📉 Impact:
- GMV Loss: ₹12.5 Lakhs
- Chronic Days: 22/30
- PODs Affected: 15 (75%)

📦 Affected SKUs:
- Coca-Cola 500ml (18 days)
- Coca-Cola 1L (20 days)
- Coca-Cola 2L (22 days)

📊 Attribution:
- Fill Rate: 45%
- WH Capacity: 30%
- Forecast: 25%

🔍 Root Cause (L3):
Vendor fill rates at 65% vs 80% target. Primary supplier
facing production constraints. MOQ requirements forcing
partial shipments.

👤 Owner: Procurement
📋 Action: Escalate to vendor, review alternate suppliers
```

## Tools Available

| Tool | Purpose | Access |
|------|---------|--------|
| Snowflake | Query source tables | `snowsql` via Bash |
| Databricks | Build pipeline notebooks | Databricks workspace |
| Glean Search | Internal docs/Slack | `mcp__glean_default__search` |
| Claude API | RCA generation | LLM API |
| Git | Version control | `git` via Bash |

## Owner Mapping

| L1 Reason | Recommended Owner |
|-----------|------------------|
| Fill Rate Issue | Procurement |
| Warehouse Capacity | WH Ops |
| Forecast Error | Planning |
| POD Space/Processing | Pod Ops |
| Config/Tagging | Category Management |

## Directory Structure

```
availability-monitoring/
├── config/
│   └── rules.yaml              # Alert deduplication rules
├── docs/
│   ├── data-mapping.md         # Field → source mapping
│   ├── gap-analysis.md         # Missing field fallbacks
│   ├── qa-checklist.md         # QA validation results
│   └── presentation.pdf        # Demo presentation
├── notebooks/
│   ├── 01_data_pipeline.py     # Base table aggregation
│   ├── 02_rule_engine.py       # Tree traversal deduplication
│   └── 03_llm_integration.py   # Claude RCA generation
├── outputs/
│   └── sample_reports/         # Generated HTML reports
├── prompts/
│   └── rca_prompt.txt          # LLM prompt templates
├── plan.md                     # Execution plan
├── CLAUDE.md                   # This file
└── execution-bandwidth.md      # Resource planning
```

## Success Criteria

| Metric | Target |
|--------|--------|
| Base table populated | All 20 fields |
| Alert deduplication | Correctly eliminates duplicates |
| RCA accuracy | No hallucinations, grounded in data |
| End-to-end latency | < 5 minutes |
| Sample outputs | 5+ alert types demonstrated |
