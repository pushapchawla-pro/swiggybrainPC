# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

**Swiggy Brain** is an AI-first operations intelligence platform for Swiggy's businesses. This repository contains research documentation, PRFAQs, and domain knowledge supporting the multi-agent architecture that will power proactive anomaly detection, root cause analysis, and intervention recommendations.

**Current Focus**: Supply Chain Brain v0.1 MVP targeting SKU-level availability improvement at Instamart dark stores.

## Repository Structure

```
swiggy-brain/
├── docs/
│   └── PRFAQ.md                    # Master Swiggy Brain vision document
├── scm/                            # Supply Chain Brain domain
│   ├── CLAUDE.md                   # SCM-specific guidance
│   └── docs/
│       ├── supply-chain-PRFAQ.md   # MVP scope (90-day)
│       └── scm-research/           # Deep-dive research (10 documents)
└── .claude/
    └── settings.local.json         # Glean MCP permissions
```

**Note**: This is a documentation-only repository. No production code exists here.

## Swiggy Brain Architecture

### Three Brain Personas (Long-term Vision)
1. **Category Brain**: Category/brand managers - selection gaps, pricing, competitive intelligence
2. **Supply Chain Brain**: Dark store/supply leaders - availability, forecasting, procurement
3. **Growth Brain**: Growth/CRM teams - retention, conversion, hyperlocal demand

### Multi-Agent System
- **Statistical Monitoring Agent**: Anomaly detection across metrics
- **Hypothesis & RCA Agent**: Issue tree analysis using past RCAs/SOPs
- **Knowledge Agent**: Data retrieval from Snowflake/docs
- **Intervention Agent**: Ranked actions to owners (max 3/day/user)
- **Evaluation Agent**: Closed-loop learning from outcomes

## MVP Scope (Supply Chain Brain v0.1)

**Objective**: +10% in-session conversions via SKU availability

**Availability Issue Tree** (7 deterministic branches):
1. Forecasting-led: Demand underestimated
2. PO-led: POs not raised (MOQ/MOV constraints)
3. Supply-led: Brands not delivering to warehouse
4. Warehouse ops-led: Appointment/capacity/throughput issues
5. Dark store-led: Space/processing limits
6. Tagging/config-led: Incorrect tiering, mis-tagged SKUs
7. Other causes

**Success Metrics**:
- ≥80% precision in RCA
- ≥60% stakeholder adoption
- +10% conversion improvement for targeted SKUs

## Using Glean for Research

`mcp__glean_default__search` and `mcp__glean_default__chat` are pre-approved. Use them to:
- Search Confluence, JIRA, GitHub, Google Docs, Slack
- Read specific documents via `mcp__glean_default__read_document`
- Synthesize answers across sources

## Key Abbreviations

| Abbrev | Meaning |
|--------|---------|
| POD | Point of Distribution (Dark Store) |
| PO | Purchase Order |
| DSD | Direct Store Delivery |
| OOS | Out of Stock |
| DOH/DOI | Days of Inventory |
| FEFO | First Expiry First Out |
| PSLA | Promised Service Level Agreement |
| TFT | Temporal Fusion Transformer (forecast model) |
| MIM | Master Inventory Management |
| ILS | Inventory Location Service |
| IAS | Inventory Availability Service |
