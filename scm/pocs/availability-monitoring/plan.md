# Execution Plan: Availability Monitoring & RCA Copilot POC

**Timeline**: Jan 13-15, 2026 (3 working days)
**Owner**: Claude Code + Human Supervision
**Reference**: [HLD Doc](https://docs.google.com/document/d/17M4eK_GLPvT8hvMikGLJnUTizZW9_Vnwnq-SDLpqbHs) | [Execution Plan Doc](https://docs.google.com/document/d/1xb8uK8WEJROhR5yI7prgIDZ6SNFz0KPRbnJuSC8bC3k)

> **Note**: This is a 3-day sprint POC. Quality over speed.

---

### Calendar & Working Days

```
January 2026
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 12  │ 13  │ 14  │ 15  │ 16  │ 17  │ 18  │
│     │ D1  │ D2  │ D3  │     │ off │ off │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

D# = Working Day    off = Weekend
```

| Day | Focus | Date |
|-----|-------|------|
| **Day 1** | **DATA PIPELINE** | Jan 13 (Mon) |
| **Day 2** | **RULE ENGINE + LLM** | Jan 14 (Tue) |
| **Day 3** | **QA + DEMO** | Jan 15 (Wed) |

**Total: 3 working days**

---

### Team Assignments

| Code | Persona | Who | Primary Responsibilities |
|------|---------|-----|-------------------------|
| **EE** | Executing Engineer | **TBD** | Daily Claude Code operation, pipeline work |
| **PM** | AI Product Manager | Sreeram Sridhar | Coordination, decisions, stakeholder mgmt |
| **AE** | Analytics Expert | Durga (Bhavana backup) | Schema validation, query correctness |
| **MS** | Metadata Support | Rohit Tiwari | Table schemas, data dictionary |
| **AA** | AI Architect | Sid Panda | Solutioning advisory |
| **CC** | Claude Code | Opus 4.5 | Autonomous execution |

> **Legend**: Tasks below are tagged as `[CODE - Person]` (e.g., `[EE - TBD]`, `[AE - Durga]`).

---

## Pre-requisites (Before Day 1)

### Environment Setup

- [ ] `[PM - Sreeram → DE - Platform]` **Snowflake access**: Confirm credentials for required tables
- [ ] `[PM - Sreeram → DE - Platform]` **Databricks access**: Workspace, SQL Warehouse ID, PAT
- [ ] `[EE - TBD]` **GitHub repo setup**: Clone `swiggy-brain` repo

### Required Tables

| Priority | Table | Schema | Purpose |
|----------|-------|--------|---------|
| **Critical** | `analytics_prod.analytics_public_rb_bradman_spin_list_16_dec_seasonality_eol_removal` | Analytics | Bradman SKUs (is_top_item = 1) |
| **Critical** | `analytics.public.sku_wise_availability_rca_with_reasons_v7` | Analytics | Availability RCA with reasons |

### Pre-requisites Checklist

- [ ] Snowflake access confirmed
- [ ] Databricks workspace setup
- [ ] GitHub repo created
- [ ] LLM API key provisioned (Claude)
- [ ] HLD document link shared

---

## Day 1: Data Discovery & Pipeline Setup (Jan 13)

> **Goal**: Validated schema, built aggregated base table
> **Owners**: `[EE - TBD]` execution, `[AE - Durga]` validation, `[PM - Sreeram]` coordination

### Morning Tasks

1. [ ] `[EE - TBD]` **Step 1: HLD Validation & Schema Design**
   - Validate 20 target fields against HLD
   - Confirm field definitions with `[AE - Durga]`

2. [ ] `[AE - Durga + MS - Rohit]` **Step 2: Data Discovery & Quality Audit**
   - Map each of 20 fields to source tables
   - Check data quality (nulls, freshness, coverage)
   - Document in `docs/data-mapping.md`

### Afternoon Tasks

3. [ ] `[EE - TBD]` **Step 3: Gap Analysis & Resolution**
   - Identify missing/partial fields
   - Document fallback strategies
   - Save to `docs/gap-analysis.md`

4. [ ] `[EE - TBD]` **Step 4: Build Aggregated Table**
   - Create Databricks notebook
   - Build `availability_monitoring` base table
   - Sample data for last 7-14 days
   - Save to `notebooks/01_data_pipeline.py`

### Day 1 Deliverables

| Artifact | Location |
|----------|----------|
| Data mapping table | `docs/data-mapping.md` |
| Gap analysis report | `docs/gap-analysis.md` |
| Data pipeline notebook | `notebooks/01_data_pipeline.py` |

### Day 1 Verification

- [ ] All 20 fields mapped to source tables
- [ ] Gap analysis documented with fallbacks
- [ ] Base table query runs successfully
- [ ] Sample data generated (7-14 days)

---

## Day 2: Rule Engine & LLM Integration (Jan 14)

> **Goal**: Rule-based deduplication working, LLM generating RCAs
> **Owners**: `[EE - TBD]` execution, `[AA - Sid]` architecture review

### Morning Tasks

1. [ ] `[EE - TBD]` **Step 5: Rule-Based Classification Logic**

   Define tree traversal rules for alert deduplication:

   | Level | Check | Alert Type Generated |
   |-------|-------|---------------------|
   | 1 | Is brand chronic at city level? | Brand × City |
   | 2 | Is brand chronic at specific pods? | Brand × Pod |
   | 3 | Is SKU chronic in ≥x% city pods? | SKU × City |
   | 4 | Are multiple pods from same WH affected? | Warehouse × Category |
   | 5 | Is SKU chronic at specific pod? | SKU × Pod (isolated) |

   - Implement in `notebooks/02_rule_engine.py`
   - Test on sample data
   - Save rule definitions to `config/rules.yaml`

### Afternoon Tasks

2. [ ] `[EE - TBD]` **Step 6: LLM Integration - RCA & Report Generation**

   **Two LLM Calls**:

   | Call | Purpose | Output |
   |------|---------|--------|
   | 1 | Structured RCA | JSON with L1/L2/L3 reasons, owner, action |
   | 2 | Report formatting | HTML Slack message |

   - Create prompt templates: `prompts/rca_prompt.txt`
   - Integrate Claude API
   - Generate sample outputs
   - Save to `notebooks/03_llm_integration.py`

### Day 2 Deliverables

| Artifact | Location |
|----------|----------|
| Rule definitions | `config/rules.yaml` |
| Rule engine notebook | `notebooks/02_rule_engine.py` |
| LLM prompt templates | `prompts/rca_prompt.txt` |
| LLM orchestration | `notebooks/03_llm_integration.py` |

### Day 2 Verification

- [ ] Rule engine deduplicates alerts correctly
- [ ] LLM generates structured RCA (JSON)
- [ ] LLM formats HTML report
- [ ] Sample outputs generated for 5+ alerts

---

## Day 3: QA & Presentation (Jan 15)

> **Goal**: End-to-end pipeline validated, demo ready
> **Owners**: `[EE - TBD]` QA, `[PM - Sreeram]` presentation

### Morning Tasks

1. [ ] `[EE - TBD]` **Step 7: End-to-End QA**

   | Component | QA Focus |
   |-----------|----------|
   | Data pipeline | Freshness, completeness, nulls |
   | Rule engine | Deduplication accuracy, alert types |
   | LLM outputs | RCA accuracy, no hallucinations |
   | Full pipeline | End-to-end latency, error handling |

   - Document QA results in `docs/qa-checklist.md`

### Afternoon Tasks

2. [ ] `[PM - Sreeram]` **Step 8: Presentation Preparation**

   **Demo Flow**:
   - Problem statement (2 min)
   - Pipeline architecture (3 min)
   - Live demo (10 min)
   - Sample outputs (5 min)
   - Limitations & roadmap (5 min)

   - Pre-generate backup reports for demo
   - Document limitations
   - Save to `docs/presentation.pdf`

### Day 3 Deliverables

| Artifact | Location |
|----------|----------|
| QA checklist (completed) | `docs/qa-checklist.md` |
| Sample HTML reports | `outputs/sample_reports/` |
| Presentation deck | `docs/presentation.pdf` |

### Day 3 Verification

- [ ] Full pipeline runs end-to-end
- [ ] QA checklist completed
- [ ] Sample reports generated
- [ ] Presentation ready

---

## POC Exit Criteria

| Criterion | Target | Status |
|-----------|--------|--------|
| Base table built | 20 fields populated | [ ] |
| Rule engine working | Deduplication correct | [ ] |
| LLM integration | RCA + report generation | [ ] |
| End-to-end pipeline | < 5 min per run | [ ] |
| Sample outputs | 5+ alert types | [ ] |
| QA completed | All checks passed | [ ] |
| Demo delivered | Presentation ready | [ ] |

---

## Risks & Contingencies

| Risk | Detection | Mitigation |
|------|-----------|------------|
| Source table missing columns | Day 1 data mapping | Fallback strategies in gap analysis |
| Data quality issues | Day 1 quality audit | Flag blockers by Day 1 EOD |
| LLM hallucinations in RCA | Day 3 QA | Prompt engineering to ground in data |
| Pipeline timeout | Day 3 E2E test | Batch processing, query optimization |

---

## Quick Reference

### Directory Structure

```
availability-monitoring/
├── config/
│   └── rules.yaml              # Rule definitions
├── docs/
│   ├── data-mapping.md         # Field to source mapping
│   ├── gap-analysis.md         # Missing field fallbacks
│   ├── qa-checklist.md         # QA results
│   └── presentation.pdf        # Demo deck
├── notebooks/
│   ├── 01_data_pipeline.py     # Base table creation
│   ├── 02_rule_engine.py       # Alert deduplication
│   └── 03_llm_integration.py   # RCA generation
├── outputs/
│   └── sample_reports/         # Generated reports
├── prompts/
│   └── rca_prompt.txt          # LLM prompt templates
├── plan.md                     # This file
├── CLAUDE.md                   # Operational guidance
└── execution-bandwidth.md      # Resource planning
```

### Key Parameters

| Parameter | Value |
|-----------|-------|
| Geography | Bangalore |
| Category | FMCG |
| SKUs | Bradman (~6,000, is_top_item = 1) |
| Chronic threshold | 15 of last 30 days < 99.9% |
| Target availability | 99.9% |

### Alert Priority

| Priority | GMV Loss Threshold | Action |
|----------|-------------------|--------|
| P0 | ≥ ₹X Lakhs | Immediate escalation |
| P1 | ₹Y - ₹X Lakhs | Same-day resolution |
| P2 | < ₹Y Lakhs | Track within week |
