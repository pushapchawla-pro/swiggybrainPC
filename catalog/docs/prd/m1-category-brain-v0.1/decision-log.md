# Architecture Decisions: Catalog & Assortment Intelligence

**Created**: 2026-01-28
**Problem**: Category Brain v0.1 - automated trend detection for Category Managers

---

## Decision Index

| ID | Title | Status | Date |
|----|-------|--------|------|
| ADR-001 | Data Pipeline: Snowflake vs Databricks | Decided | 2026-01-28 |
| ADR-002 | Google Trends Access Method | Decided | 2026-01-28 |
| ADR-003 | LLM Provider for Insight Generation | Open | - |
| ADR-004 | Delivery Mechanism | Open | - |

---

## ADR-001: Data Pipeline - Snowflake vs Databricks

### Status
**Decided**: Use Snowflake as primary, Databricks as supplementary

### Context
Both Snowflake and Databricks contain relevant search and catalog data. Need to decide which to use as the primary data source for the POC.

**Data Availability Explored**:

| Data Type | Snowflake | Databricks |
|-----------|-----------|------------|
| Search events (raw) | `IM_SEARCH_FACT` - 10M/day | `streams_delta.im_search_event` - streaming |
| Search aggregates | `IM_SEARCH_DB_STRING_TO_CATEGORY` | `analytics_prod.im_search_*` |
| SKU catalog | `SKU_CATALOG_IM_BIZFIN_ITEM_MASTER` | `data_science_prod.im_catalog` - 45M rows |
| Availability RCA | Basic tables | **`sku_wise_availability_rca_with_reasons_v7`** - 20+ reason codes |
| ML features | Limited | `features.*` - 80+ search feature tables |

### Options Considered

**Option A: Snowflake Only**
- Pros: Single source, simpler queries, BI team familiarity
- Cons: Missing ML features, availability RCA less rich

**Option B: Databricks Only**
- Pros: ML features, streaming data, rich availability RCA
- Cons: Complex access patterns, compute costs

**Option C: Hybrid (Recommended)**
- Snowflake for aggregated search analytics and reporting
- Databricks for ML features and real-time availability RCA

### Decision
**Option C: Hybrid approach**

| Use Case | Data Source | Table |
|----------|-------------|-------|
| Daily search term trends | Snowflake | `IM_SEARCH_DB_STRING_TO_CATEGORY` |
| Zero-result search tracking | Snowflake | `IM_SEARCH_FACT` with `NULL_SEARCH=1` |
| Category taxonomy | Snowflake | `SRK_CATEGORY_DASHBOARD_LABEL3` |
| Availability root causes | Databricks | `sku_wise_availability_rca_with_reasons_v7` |
| Trending searches | Databricks | `features.trending_searches_delta` |

### Consequences
- Need to maintain data pipelines to both systems
- Join logic required across systems for complete view
- SQL skills sufficient for most queries (no Spark required for POC)

---

## ADR-002: Google Trends Access Method

### Status
**Decided**: pytrends with batch processing

### Context
Need to ingest Google Trends data for external demand signals. Options include:
- Official Google Trends API (alpha, application required)
- Unofficial pytrends library
- Third-party services (SerpApi, Glimpse)

**POC Results**:

| Approach | Success Rate | Cost | Reliability |
|----------|--------------|------|-------------|
| pytrends @ 3s delay | 20% | Free | Poor |
| pytrends @ 30s delay | 100% | Free | Good |
| SerpApi | N/A | $50/mo | Enterprise |
| Official API | N/A | Free | Unknown (alpha) |

### Options Considered

**Option A: pytrends with batch processing**
- Pros: Free, works with 30s delays, India data available
- Cons: No SLA, 2,880 terms/day max, rate limiting

**Option B: Apply for Official Google Trends API**
- Pros: Stable, higher rate limits
- Cons: Alpha access required, unknown timeline

**Option C: Third-party (SerpApi)**
- Pros: Reliable, no rate limits
- Cons: Cost ($50+/mo), external dependency

### Decision
**Option A: pytrends with batch processing**

**Implementation**:
```python
# Nightly batch job configuration
PYTRENDS_CONFIG = {
    "delay_seconds": 30,
    "terms_per_run": 500,
    "timeframe": "today 3-m",
    "geo": "IN",
    "cache_hours": 24
}
```

**Capacity Planning**:
- 500 category keywords (not SKU-level)
- Run at 2am IST (low traffic time)
- Cache results for 24 hours
- Estimated runtime: ~4 hours

### Consequences
- Cannot support real-time trend queries
- Limited to ~500 category-level terms
- Need fallback for official API if Google blocks pytrends
- Consider SerpApi for v2 if reliability becomes issue

---

## ADR-003: Insight Generation Architecture

### Status
**Decided**: Claude Code as orchestration engine

### Context
Need to select approach for generating consumer insights and strategy recommendations from data signals.

### Decision
**Claude Code orchestrates end-to-end** - reasoning + deterministic code execution.

This is not a traditional LLM API call pattern. Instead:
- Claude Code acts as the reasoning engine
- Triggers SQL queries via Snowflake/Databricks connectors
- Processes and synthesizes data inline
- Generates InsightCards as markdown output

### Architecture
```
Claude Code (orchestrator)
    ├── Reads category term list
    ├── Executes pytrends batch script
    ├── Runs Snowflake SQL for internal search metrics
    ├── Runs Databricks SQL for availability RCA
    ├── Synthesizes signals → emerging_score
    └── Generates InsightCard markdown per category
```

### Consequences
- No separate LLM API integration needed
- Execution via `/implement-spec` with task-management skill
- Lower complexity, direct data access
- Requires Claude Code session for weekly runs (can be scheduled via cron + CLI)

---

## ADR-004: Delivery Mechanism

### Status
**Decided**: Markdown file per week

### Context
Need to decide how to deliver weekly insights to Category Managers.

### Decision
**Weekly markdown file** - simplest approach for POC validation.

### Implementation
```
docs/prd/temp/catalog-intelligence/digests/
├── 2026-W05-personal-care.md
├── 2026-W06-personal-care.md
└── ...
```

Each file contains:
- InsightCards for all 8 Personal Care L1 categories
- Ranked by emerging_score
- Signal sources with data values
- Strategy recommendations

### Consequences
- No Slack/Dashboard integration in v0.1
- CM reviews markdown file directly or via shared folder
- Feedback collected separately (manual for POC)
- Can evolve to Slack/Strategy+1 in v0.2 after validating content quality

---

## Open Questions for PRD Phase

1. **Scope**: Should v0.1 cover all 8 Personal Care L1 categories or start with 2-3?
2. **Signal fusion weights**: How to balance Google Trends vs internal search signals?
3. **Actionability threshold**: What emerging_score qualifies as "worth actioning"?
4. **Feedback loop**: How to track if CM acted on an insight and what happened?
5. **Competitor integration**: Should Unify Apps competitor data be included in v0.1?

---

*Decision log created: 2026-01-28*
