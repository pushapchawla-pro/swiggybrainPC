# Spec: Category Brain v0.1

**Problem**: Catalog & Assortment Intelligence for Instamart
**Created**: 2026-01-28
**Status**: Ready for Implementation

---

## Introduction

Category Managers at Instamart manually spend significant hours researching trends across Google Trends, social media, competitor apps, and internal data to identify catalog gaps and double-down opportunities. This process is time-consuming, inconsistent, reactive, and noisy.

Category Brain v0.1 automates trend detection by fusing external signals (Google Trends) with internal search analytics to generate actionable weekly insights for Category Managers.

**Key Insight from Solutioning**: Null search rate is very low (<0.5%), so the opportunity is **conversion optimization** (search→purchase), not coverage gaps.

---

## Goals

1. **Reduce CM research time** by >4 hours/week through automated signal detection
2. **Improve insight quality** with >60% of generated insights marked "Actionable" by CMs
3. **Enable proactive trend detection** by identifying rising signals before they peak
4. **Provide data-grounded recommendations** with clear signal sources and sizing

---

## Non-Goals (v0.1)

- Real-time trend alerts (batch-only in v0.1)
- Social media signal integration (Twitter, Reddit)
- Competitor scraping automation
- Full category coverage (POC: Personal Care BU only)
- Self-service search term investigation (v0.2)

---

## User Stories

### US-001: Google Trends Data Ingestion

| |
|---|
| **Description:** As the system, I need to ingest Google Trends data nightly so that external demand signals are available for analysis. |
| **Dependencies:** None |
| <details><summary>**Test Requirements**</summary><br>- [ ] Test: pytrends fetches India data for test terms (unit)<br>- [ ] Test: 30-second delay handles rate limiting without failures (unit)<br>- [ ] Test: Data lands in Snowflake cache table with correct schema (integration)<br>- [ ] Test: 500 terms processed within 5-hour window (integration)</details> |
| **Acceptance Criteria:**<br>- [ ] All tests pass<br>- [ ] Nightly job runs at 2am IST<br>- [ ] Results cached for 24 hours<br>- [ ] Error handling for rate limits with exponential backoff |

---

### US-002: Internal Search Analytics Pipeline

| |
|---|
| **Description:** As the system, I need to aggregate internal search metrics daily so that search volume, growth rates, and zero-result rates are available per term. |
| **Dependencies:** None |
| <details><summary>**Test Requirements**</summary><br>- [ ] Test: WoW and MoM growth calculations are accurate (unit)<br>- [ ] Test: Zero-result detection matches NULL_SEARCH=1 flag (unit)<br>- [ ] Test: Query aggregates correctly for pilot categories (integration)<br>- [ ] Test: Data freshness is T-1 (integration)</details> |
| **Acceptance Criteria:**<br>- [ ] All tests pass<br>- [ ] Daily aggregates available by 6am IST<br>- [ ] Covers all 8 Personal Care L1 categories<br>- [ ] Q2C (Query-to-Cart) rate calculated per term |

---

### US-003: Signal Fusion Layer

| |
|---|
| **Description:** As the system, I need to normalize and cross-validate external and internal signals so that an emerging_score can be computed for each term. |
| **Dependencies:** US-001, US-002 |
| <details><summary>**Test Requirements**</summary><br>- [ ] Test: Scores normalized to 0-100 scale (unit)<br>- [ ] Test: emerging_score formula produces expected values for known inputs (unit)<br>- [ ] Test: Cross-validation flags terms with conflicting signals (unit)<br>- [ ] Test: Signal fusion joins Google Trends + internal search correctly (integration)</details> |
| **Acceptance Criteria:**<br>- [ ] All tests pass<br>- [ ] emerging_score computed for all terms with both signals<br>- [ ] Terms ranked by emerging_score descending<br>- [ ] Confidence level indicated (high/medium/low based on signal alignment) |

---

### US-004: Insight Generation via Claude Code Orchestration

| |
|---|
| **Description:** As the system, Claude Code orchestrates data retrieval and generates InsightCards as markdown output so that CMs receive structured, actionable recommendations. |
| **Dependencies:** US-003 |
| <details><summary>**Test Requirements**</summary><br>- [ ] Test: InsightCard markdown follows template structure (unit)<br>- [ ] Test: Consumer insight text is coherent and specific (manual review)<br>- [ ] Test: Strategy recommendations reference actual data (unit)<br>- [ ] Test: No hallucinated data in output (spot check against source queries)</details> |
| **Acceptance Criteria:**<br>- [ ] All tests pass<br>- [ ] InsightCard includes: category, consumer_insight, strategy, sizing, signals<br>- [ ] Sources shown for each signal with actual values<br>- [ ] Executed via Claude Code with task-management skill |

**InsightCard Markdown Template:**
```markdown
## [Category]: [L1] > [L2]

### Consumer Insight
[2-3 sentence insight synthesized from signals]

### Strategy
[Recommended action with specific targets]

### Sizing
| Metric | Value |
|--------|-------|
| Current GMV | ₹X Cr |
| Target SKUs | Y |
| Growth Potential | Z% |

### Signals
| Source | Metric | Value | Trend |
|--------|--------|-------|-------|
| Google Trends | Interest | 72/100 | +45% MoM |
| Internal Search | Volume | 12,500/wk | +38% WoW |
| Availability | In-stock % | 67% | - |
```

---

### US-005: Weekly Digest as Markdown File

| |
|---|
| **Description:** As a Category Manager, I want a weekly markdown digest of top insights so that I can review trends without manual research. |
| **Dependencies:** US-004 |
| <details><summary>**Test Requirements**</summary><br>- [ ] Test: Digest contains insights for all 8 Personal Care L1 categories (integration)<br>- [ ] Test: Markdown renders correctly with tables and formatting (unit)<br>- [ ] Test: File saved to correct location with week number (integration)</details> |
| **Acceptance Criteria:**<br>- [ ] All tests pass<br>- [ ] Weekly file generated: `digests/YYYY-WXX-personal-care.md`<br>- [ ] Contains InsightCards ranked by emerging_score<br>- [ ] All 8 L1 categories covered<br>- [ ] Execution triggered via Claude Code CLI (can be scheduled) |

---

### US-006: Run Evidence Persistence

| |
|---|
| **Description:** As the system owner, I need each run to save all evidence and intermediate data so that insights are auditable and reproducible. |
| **Dependencies:** US-001, US-002, US-003, US-004 |
| <details><summary>**Test Requirements**</summary><br>- [ ] Test: Run folder created with timestamp (unit)<br>- [ ] Test: All SQL queries saved with results (integration)<br>- [ ] Test: pytrends raw responses cached (integration)<br>- [ ] Test: Signal fusion intermediate calculations saved (unit)</details> |
| **Acceptance Criteria:**<br>- [ ] Each run creates unique folder: `runs/YYYY-MM-DD-HHMMSS/`<br>- [ ] All source data saved as JSON/CSV<br>- [ ] SQL queries saved with execution logs<br>- [ ] Final digest linked to evidence folder |

**Run Metadata Schema:**
```json
{
  "run_id": "2026-01-28-093000",
  "started_at": "2026-01-28T09:30:00+05:30",
  "completed_at": "2026-01-28T09:45:00+05:30",
  "status": "completed",
  "version": "v0.1",
  "config": {
    "categories": ["Personal Care"],
    "l1_count": 8,
    "google_trends_terms": 487,
    "pytrends_delay_seconds": 30
  },
  "stats": {
    "terms_processed": 487,
    "insights_generated": 12,
    "snowflake_queries": 3,
    "databricks_queries": 2,
    "errors": []
  },
  "evidence_files": [
    "evidence/google_trends/raw_responses.json",
    "evidence/snowflake/search_metrics.csv",
    "evidence/databricks/availability_rca.csv"
  ],
  "output_file": "output/digest.md",
  "feedback_status": "pending"
}
```

**Run Folder Structure:**
```
docs/prd/temp/catalog-intelligence/runs/
└── 2026-01-28-093000/
    ├── metadata.json              # Run config, timestamp, version (schema above)
    ├── evidence/
    │   ├── google_trends/
    │   │   ├── raw_responses.json # pytrends API responses
    │   │   └── terms_queried.csv  # List of terms with status
    │   ├── snowflake/
    │   │   ├── search_metrics.sql # Query executed
    │   │   ├── search_metrics.csv # Results
    │   │   └── execution_log.txt  # Timing, row counts
    │   └── databricks/
    │       ├── availability_rca.sql
    │       ├── availability_rca.csv
    │       └── execution_log.txt
    ├── intermediate/
    │   ├── signal_fusion.json     # Normalized scores, emerging_score
    │   └── ranked_terms.csv       # Terms ranked by emerging_score
    ├── output/
    │   └── digest.md              # Final InsightCards
    └── feedback/
        └── (populated after CM review)
```

---

### US-007: Per-Run Feedback Collection

| |
|---|
| **Description:** As the system, I need to collect focused feedback from CMs after each run to measure actionability and identify the top improvement opportunity. |
| **Dependencies:** US-005, US-006 |
| <details><summary>**Test Requirements**</summary><br>- [ ] Test: Feedback collected via AskUserQuestion (integration)<br>- [ ] Test: Feedback saved to run folder (integration)<br>- [ ] Test: Summary metrics computed correctly (unit)</details> |
| **Acceptance Criteria:**<br>- [ ] 3 focused questions via AskUserQuestion<br>- [ ] Per-insight quick rating (batch)<br>- [ ] Top blocker and top improvement captured<br>- [ ] Responses saved to `runs/*/feedback/` |

---

#### Feedback Questions (3 total)

**Q1: Per-Insight Quick Rating** (single question, batch all insights)
```
Question: "Rate each insight - which would you act on?"
Header: "Actionable"
MultiSelect: true  # Select all that are actionable
Options:
  - "Fragrances > DEO→EDP shift"
  - "Skincare > Niacinamide rise"
  - "Hair Care > Peptide trend"
  - ... (list all insights from run)
```

**Q2: Top Blocker** (for non-actioned insights)
```
Question: "For insights you didn't select, what's the main blocker?"
Header: "Blocker"
Options:
  - "Sizing too small"
  - "Already knew this"
  - "Data seems off"
  - "Need more detail"
```

**Q3: Top Improvement**
```
Question: "What one thing would make this more useful?"
Header: "Improve"
Options:
  - "More granular (L3/brand level)"
  - "Better sizing estimates"
  - "Competitor context"
  - "Regional breakdown"
```

---

#### Feedback Output

**File:** `runs/2026-01-28-093000/feedback/summary.json`
```json
{
  "run_id": "2026-01-28-093000",
  "reviewer": "CM Name",
  "insights_total": 8,
  "insights_actionable": 3,
  "actionability_rate": 0.375,
  "top_blocker": "sizing_too_small",
  "top_improvement": "competitor_context",
  "acted_on": ["Fragrances > DEO→EDP", "Skincare > Niacinamide", "Makeup > Clean beauty"]
}
```

---

#### Improvement Loop

```
Aggregate across runs:
  - Actionability rate trending (target: >60%)
  - Top blockers by frequency → Fix highest
  - Top improvements by frequency → Prioritize roadmap
```

---

### US-008: Availability RCA Integration

| |
|---|
| **Description:** As the system, I need to enrich signals with availability root cause data so that CMs understand why products may be unavailable. |
| **Dependencies:** US-003, US-006 |
| <details><summary>**Test Requirements**</summary><br>- [ ] Test: RCA reason codes mapped from Databricks table (unit)<br>- [ ] Test: Top reason codes aggregated per SKU/category (unit)<br>- [ ] Test: Integration with signal fusion adds availability context (integration)<br>- [ ] Test: RCA data saved to run evidence folder (integration)</details> |
| **Acceptance Criteria:**<br>- [ ] All tests pass<br>- [ ] Availability RCA from `sku_wise_availability_rca_with_reasons_v7` integrated<br>- [ ] Reason codes translated to human-readable text<br>- [ ] Insights flag supply-side vs demand-side issues<br>- [ ] RCA evidence saved to `runs/*/evidence/databricks/` |

---

## Functional Requirements

| ID | Requirement | User Story | Priority |
|----|-------------|------------|----------|
| FR-1 | Ingest Google Trends data for 500 category terms nightly | US-001 | P0 |
| FR-2 | Aggregate internal search metrics with WoW/MoM growth | US-002 | P0 |
| FR-3 | Compute emerging_score from normalized signals | US-003 | P0 |
| FR-4 | Generate InsightCard markdown via Claude Code orchestration | US-004 | P0 |
| FR-5 | Deliver weekly markdown digest file | US-005 | P0 |
| FR-6 | Save all evidence and intermediate data per run | US-006 | P0 |
| FR-7 | Collect and persist per-run feedback from CMs | US-007 | P0 |
| FR-8 | Enrich insights with availability RCA data | US-008 | P1 |
| FR-9 | Cache Google Trends results for 24 hours | US-001 | P0 |
| FR-10 | Support all 8 Personal Care L1 categories | US-002 | P0 |
| FR-11 | Show signal sources on each InsightCard | US-004 | P0 |
| FR-12 | Link each digest to its evidence run folder | US-005, US-006 | P0 |

---

## Technical Considerations

### Architecture Decisions (from decision-log.md)

| ADR | Decision | Rationale |
|-----|----------|-----------|
| ADR-001 | Hybrid Snowflake + Databricks | Snowflake for aggregates, Databricks for ML features + availability RCA |
| ADR-002 | pytrends with 30s batch delays | Free, works for India, 500 terms/day viable |
| ADR-003 | Claude Code orchestration | Reasoning + deterministic code execution in single session |
| ADR-004 | Markdown file per week | Simple POC delivery, no Slack integration needed |

### Data Sources

| Use Case | Source | Table |
|----------|--------|-------|
| Daily search term trends | Snowflake | `IM_SEARCH_DB_STRING_TO_CATEGORY` |
| Zero-result search tracking | Snowflake | `IM_SEARCH_FACT` with `NULL_SEARCH=1` |
| Category taxonomy | Snowflake | `SRK_CATEGORY_DASHBOARD_LABEL3` |
| Availability root causes | Databricks | `sku_wise_availability_rca_with_reasons_v7` |
| Trending searches | Databricks | `features.trending_searches_delta` |

### Recommended Stack

```
┌────────────────────────────────────────────────────────────┐
│              Claude Code Orchestration Session              │
│  (Reasoning + Code Execution via task-management skill)     │
└────────────────────────────┬───────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
┌───────────────┐  ┌─────────────────┐  ┌─────────────────────┐
│ Google Trends │  │ Snowflake SQL   │  │ Databricks SQL      │
│ (pytrends     │  │ (search metrics,│  │ (availability RCA,  │
│  batch script)│  │  category data) │  │  trending searches) │
└───────┬───────┘  └────────┬────────┘  └──────────┬──────────┘
        │                   │                      │
        └───────────────────┼──────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────┐
│              Signal Fusion (inline in Claude Code)          │
│  - Normalize scores (0-100)                                 │
│  - Cross-validate external vs internal signals              │
│  - Compute emerging_score                                   │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│           Insight Generation (Claude Code reasoning)        │
│  - Synthesize consumer insight from data                    │
│  - Generate strategy recommendations                        │
│  - Output InsightCard markdown                              │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│              Evidence Persistence                           │
│  - Run folder: runs/YYYY-MM-DD-HHMMSS/                      │
│  - SQL queries, results, intermediate data                  │
│  - Metadata and execution logs                              │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│              Delivery (Markdown File)                       │
│  - Weekly digest: runs/*/output/digest.md                   │
│  - Symlink: digests/YYYY-WXX-personal-care.md               │
│  - All 8 L1 categories + link to evidence                   │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│              Feedback Collection                            │
│  - Template: runs/*/feedback/feedback_template.md           │
│  - CM fills and saves to runs/*/feedback/                   │
│  - Aggregation across runs for quality tracking             │
└────────────────────────────────────────────────────────────┘
```

### Complete Folder Structure

```
docs/prd/temp/catalog-intelligence/
├── discovery.md
├── verification-strategy.md
├── landscape.md
├── decision-log.md
├── spec.md
├── progress.md
├── digests/                           # Symlinks to latest run outputs
│   ├── 2026-W05-personal-care.md → ../runs/2026-01-27-090000/output/digest.md
│   └── 2026-W06-personal-care.md → ../runs/2026-02-03-090000/output/digest.md
└── runs/                              # Per-invocation evidence
    ├── 2026-01-27-090000/
    │   ├── metadata.json
    │   ├── evidence/
    │   │   ├── google_trends/
    │   │   ├── snowflake/
    │   │   └── databricks/
    │   ├── intermediate/
    │   ├── output/
    │   │   └── digest.md
    │   └── feedback/
    │       ├── feedback_template.md
    │       ├── feedback_responses.md
    │       └── feedback_summary.json
    └── 2026-02-03-090000/
        └── ...
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **CM actionable rate** | >60% | Feedback buttons on insights |
| **Time saved** | >4 hours/week/CM | Survey + activity tracking |
| **Signal precision** | >70% trends materialize | 90-day lookback |
| **Data freshness** | Google Trends <7 days | Monitoring |
| **Delivery reliability** | 100% weekly digests on time | Monitoring |
| **Insights generated** | 10+ per week for pilot | Count in digest |

---

## Open Questions

1. ~~**LLM Provider**~~: ✅ Decided - Claude Code orchestrates end-to-end
2. ~~**Delivery Mechanism**~~: ✅ Decided - Markdown file per week
3. ~~**Category Scope**~~: ✅ Decided - All 8 Personal Care L1 categories
4. **Signal Fusion Weights**: How to balance Google Trends vs internal search signals? (Define during implementation)
5. **Actionability Threshold**: What emerging_score qualifies as "worth actioning"? (Calibrate with CM feedback)
6. **Pilot CM**: Need to identify engaged CM before Phase 3 validation

---

## Test Summary

| Test Type | Count | Coverage |
|-----------|-------|----------|
| Unit | 15 | Data processing, scoring, markdown validation, folder structure |
| Integration | 9 | Pipeline joins, data landing, evidence persistence, feedback |
| Manual Review | 2 | Insight quality check, CM validation |

**Key Test Areas**:
- Evidence folder created with correct structure per run
- All SQL queries and results saved
- 3-question feedback flow via AskUserQuestion
- Feedback summary saved to run folder

---

## Implementation Order

```
Phase 1: Data Pipeline + Evidence (Week 1-2)
├── US-001: Google Trends Ingestion
├── US-002: Internal Search Analytics
├── US-006: Run Evidence Persistence (folder structure, metadata)
└── US-008: Availability RCA Integration

Phase 2: Intelligence Layer (Week 3)
├── US-003: Signal Fusion Layer
└── US-004: Insight Generation via Claude Code

Phase 3: Delivery & Feedback (Week 4)
├── US-005: Weekly Digest as Markdown File
└── US-007: Per-Run Feedback Collection
```

---

*Spec generated: 2026-01-28*
