# Execution Bandwidth Plan: Availability Prediction POC

**Timeline**: Jan 12 - Jan 30, 2026 (13 working days)
**Objective**: Autonomous SKU availability prediction system with self-improving context graphs
**Scope**: Bangalore FMCG, ~1,200 Bradman Tier A SKUs, Top WH by volume

> **Execution Details**: This document covers **bandwidth and resource allocation** only.
> For technical execution (skills, queries, daily tasks, blockers), see [`plan.md`](./plan.md).

---

## Executive Summary

This POC requires a **lean, hybrid human-AI team** where Claude Code operates autonomously for execution while humans provide domain expertise, oversight, and validation at critical checkpoints.

**Total Human Effort**: ~12-14 person-days over 3 weeks
**Claude Code**: ~1,400 API calls (Opus 4.5)

**Key Success Factors**:
1. **Executing Engineer must be identified IMMEDIATELY** — cannot start without dedicated operator
2. **Durga availability in Week 1** — without schema validation, POC cannot start

---

## Team & Bandwidth

| Persona | Who | Role | Total Effort | Critical When |
|---------|-----|------|--------------|---------------|
| AI PM / Owner | Sreeram Sridhar | Drives strategy, manages stakeholders, makes go/no-go decisions. Accountable for success metrics. | ~4 days (40%) | Day 1-2, Day 9, Day 13 |
| **Executing Engineer** | **TBD** | Day-to-day operator who runs Claude Code, monitors outputs, debugs issues. Human-in-the-loop for AI execution. | **~5.5 days (55%)** | Entire POC |
| Analytics Expert | Durga (Bhavana backup) | Validates Snowflake schemas, confirms query correctness, ensures ground truth definitions are accurate. | ~1.5 days (15%) | **Week 1 BLOCKER** |
| AI Architect | Sid Panda | Technical guidance on context graph design and pattern storage. Advisory only — not hands-on execution. | ~0.5 days (5%) | Week 1 |
| Metadata Support | Rohit Tiwari | Documents table schemas, column definitions, join paths. Enables Claude Code to write correct queries. | ~0.5 days (5%) | Day 0-1 |
| Data Engineering | Swiggy Data Platform | Grants Snowflake access, resolves data platform blockers. Minimal involvement after Day 0. | ~0.2 days (2%) | Day 0 |
| Business Stakeholders | IM Availability Team | Validate discovered patterns against domain knowledge, provide feedback, sign off on demo. | ~1 day (10%) | Day 9, Day 13 |
| Claude Code | Opus 4.5 | Autonomous executor — writes code, runs queries, generates predictions, updates context graphs. 24/7 within guardrails. | ~1,400 API calls | 24/7 |

### Executing Engineer Profile (CRITICAL HIRE)

**Skills Required**:
- Deep familiarity with Claude Code CLI and its capabilities
- GenAI/LLM prompting expertise
- Python/SQL for data pipeline work
- Comfortable reading and debugging AI-generated code
- Git workflows for version control

**Risk if Missing**: Sreeram becomes both PM and operator → context switching, burnout, quality drops, timeline slips.

### Critical Dependencies

1. **Executing Engineer MUST be identified before Day 1** — cannot start without dedicated operator
2. **Durga availability in Week 1** — without schema validation, POC cannot start
3. **Snowflake access pre-approved** — submit request on Jan 11 (Day -1)

---

## Weekly Summary

| Week | Focus | Working Days | Human Effort | Claude Effort |
|------|-------|--------------|--------------|---------------|
| **Week 1** | BUILD | 4 days (Jan 12-14, 16) | ~5.5 person-days | ~150 API calls |
| **Week 2** | SIMULATION | 5 days (Jan 19-23) | ~4 person-days | ~1,000 API calls |
| **Week 3** | LIVE + DEMO | 4 days (Jan 27-30) | ~5 person-days | ~240 API calls |

**Holidays**: Jan 15 (Pongal), Jan 26 (Republic Day)

---

## Critical Success Factors

### 1. Executing Engineer Identified (IMMEDIATE)
- **BLOCKER RISK**: No dedicated operator = AI PM overloaded, execution quality drops
- **Profile**: Claude Code + GenAI expertise, 50-60% availability for 3 weeks
- Cannot be Sreeram (conflict: strategy vs execution)

### 2. Analytics Expert Availability (Week 1)
- **BLOCKER RISK**: Durga unavailable = POC cannot start
- Lock Durga's calendar for Day 0-1 (5 hours) NOW
- Backup: Bhavana can cover 50%, but with quality risk

### 3. Snowflake Access Pre-Approval (Day -1)
- **BLOCKER RISK**: Access delay = Day 1 lost
- Submit access request on **Jan 11** for approval by Jan 12 morning

### 4. Day 9 Human Review Checkpoint
- **GO/NO-GO GATE**: If F1 slope negative or patterns nonsensical, STOP
- Allocate 3 hours for deep review (not 30 mins)

### 5. Claude Code Autonomous Operation (Week 2)
- All queries must be validated and working by end of Week 1
- No schema changes during Week 2

---

## Pre-POC Checklist (Complete by Jan 11, Day -1)

### People & Access
- [ ] `[PM - Sreeram]` **Executing Engineer Identified** (CRITICAL - must know Claude Code + GenAI)
- [ ] `[PM - Sreeram]` **Executing Engineer Onboarded** (access to repo, Claude Code, Snowflake)
- [ ] `[EE - TBD + DE]` **Snowflake Access Request Submitted** (for Sreeram, Executing Eng)
- [ ] `[PM - Sreeram]` **Durga Calendar Locked** (7 hours across Jan 12-16)
- [ ] `[PM - Sreeram]` **Rohit Calendar Locked** (3 hours on Jan 11-12 for metadata)
- [ ] `[PM - Sreeram]` **Sid Panda Notified** (2-3 hours advisory expected in Week 1)

### Technical Setup
- [x] `[EE - TBD]` **Glean MCP Configured** (Done)
- [x] `[EE - TBD]` **GitHub CLI Authenticated** (Done)

### Data Validation (See plan.md for queries)
- [ ] `[AE - Durga]` **Data Retention Validated** (Dec 2025 data exists for simulation)
- [ ] `[AE - Durga]` **All Table Names Verified** (Durga validates schema against plan.md)
- [ ] `[MS - Rohit]` **Metadata Dictionary Created** (Rohit creates table-schemas.md)
- [ ] `[AE - Durga + PM - Sreeram]` **OOS Threshold (X%) Decided** (TBD via data analysis)
- [ ] `[AE - Durga]` **Bradman Tier A Definition Confirmed** (Top 20% by Bradman score)
- [ ] `[AE - Durga]` **Top Bangalore WH Identified** (highest volume WH serving Bangalore)
- [ ] `[EE - TBD]` **`known-events.md` Created** (Dec-Jan external events pre-seeded)
- [ ] `[AE - Durga]` **Active SKU×WH Combinations Extracted** (~1,200 expected)
- [ ] `[AE - Durga]` **Timezone Confirmed** (UTC or IST for date filters)
- [ ] `[AE - Durga]` **City Filter Validated** ('Bangalore' or 'Bengaluru')
- [ ] `[AE - Durga]` **DOH Calculation Clarified** (is avg_daily_sales pre-computed?)
- [ ] `[AE - Durga + MS - Rohit]` **SKU-Supplier Linkage Documented** (join path for supplier signals)

---

## Success Metrics

### Primary: Self-Improvement Demonstrated
- First Week F1 < Final Week F1 (positive slope)
- Day 1 baseline F1 < Day 30 F1

### Secondary: Absolute Performance
- Final week simulation F1 > 0.70
- Live F1 > 0.75
- 10+ validated patterns discovered

### Tertiary: Stakeholder Adoption
- Business team sign-off on context graph (Day 9)
- Stakeholder demo delivered (Day 13)
- Scaling plan documented

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Executing Engineer not identified** | Quality drops, PM overloaded | Identify ASAP, must know Claude Code + GenAI |
| **Durga unavailable Week 1** | POC STALLS | Lock calendar NOW, backup Bhavana for 50% |
| **Snowflake access delay** | Day 1 lost | Pre-submit on Jan 11 |
| **Dec 2025 data missing** | Simulation impossible | Validate data retention on Day 0 |
| **F1 slope negative (Day 9)** | Live predictions unsafe | Add 2-3 buffer days, iterate patterns |
| **Table schema changes mid-POC** | Queries break | Freeze schema for 3 weeks |
| **Claude Code API outage** | Simulation stops | Daily commits to preserve state, resume next day |

---

## Post-POC Next Steps (If Successful)

| Phase | Scope | Effort |
|-------|-------|--------|
| **Week 4-5** | Expand to POD×SKU granularity (20 PODs), add Tier B SKUs (+1,800) | 2 person-days |
| **Month 2** | Add FnV (freshness signals), Cold Chain (temp monitoring) | 5 person-days |
| **Month 3** | City expansion: Mumbai, Delhi, Hyderabad | 1 person-week/city |
| **Month 4** | Prescriptive mode: "do X to prevent OOS", PO integration | 2 person-weeks |

---

**Questions?** Contact: Sreeram Sridhar (sreeram.sridhar@swiggy.in)
