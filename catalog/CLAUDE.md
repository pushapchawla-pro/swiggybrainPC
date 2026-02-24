# CLAUDE.md - Catalog Domain

This file provides guidance for the Catalog Intelligence domain (Category Brain).

## Domain Purpose

**Category Brain** enables Category Managers to identify catalog gaps and double-down opportunities through automated trend detection, fusing external signals (Google Trends) with internal search analytics.

## Current Focus: Category Brain v0.1

**Objective**: Automated weekly insights for Personal Care BU (8 L1 categories)
**Target**: >60% of insights marked actionable by CMs

## Implementation Roadmap

| Milestone | Spec | Stories | Status |
|-----------|------|---------|--------|
| **M1: Category Brain v0.1** | `docs/prd/m1-category-brain-v0.1/spec.md` | US-001 to US-008 | In Progress |

**Current State**: M1 in progress.

## Directory Structure

```
catalog/
├── CLAUDE.md                           # This file
├── docs/prd/
│   └── m1-category-brain-v0.1/         # Milestone artifacts
│       ├── discovery.md
│       ├── verification-strategy.md
│       ├── landscape.md
│       ├── decision-log.md
│       ├── spec.md
│       ├── progress.md
│       ├── runs/                       # Per-invocation evidence
│       └── digests/                    # Symlinks to digest outputs
├── src/                                # Implementation code (TBD)
└── tests/                              # Test suite (TBD)
```

## Data Sources

| Use Case | Source | Table |
|----------|--------|-------|
| Daily search term trends | Snowflake | `IM_SEARCH_DB_STRING_TO_CATEGORY` |
| Zero-result search tracking | Snowflake | `IM_SEARCH_FACT` with `NULL_SEARCH=1` |
| Category taxonomy | Snowflake | `SRK_CATEGORY_DASHBOARD_LABEL3` |
| Availability root causes | Databricks | `sku_wise_availability_rca_with_reasons_v7` |
| Trending searches | Databricks | `features.trending_searches_delta` |

## Key Abbreviations

| Abbrev | Meaning |
|--------|---------|
| CM | Category Manager |
| Q2C | Query-to-Cart conversion rate |
| ZRS | Zero Result Search |
| WoW | Week over Week |
| MoM | Month over Month |
| L1/L2/L3 | Category hierarchy levels |
