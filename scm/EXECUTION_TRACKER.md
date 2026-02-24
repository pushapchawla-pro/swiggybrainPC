# Swiggy Brain: Execution Tracker
**Last Updated**: January 19, 2026

---

## What is Swiggy Brain?

AI-first operations intelligence platform for Swiggy's businesses, enabling proactive anomaly detection, root cause analysis, and intervention recommendations. **Current Focus (JFM 2026)**: Supply Chain Brain - SKU availability improvement at Instamart dark stores.

---

## Our Goal

**+10% in-session conversions** via SKU availability improvement for Bradman Bangalore FMCG SKUs (~1,200 SKUs) by March 31, 2026.

**Constraints**: Must NOT increase wastage or days of inventory (DOH).

**Team**: Central AI POD (Sreeram, Amaresh, Vatsal, Sidhant, Shridhar, Sufiyan) + Business POD (Supratim, Rohit, Ishan) + Analytics POD (Shrinivas, Godavarthi, Bhavana) | **Leadership**: Phani, Madhu, Ankit, Himavant, Goda

---

## Status Snapshot

- **Initiative Health**: On Track
- **Current Week**: 3 of 13 (Jan 6 - Mar 31, 2026)
- **Blockers**: None
- **Top Priority**: Start user testing Proactive Report POC with Procurement team, build rule-based prediction model

---

## Hypothesis Tree

### Primary Question: Why are SKUs chronically unavailable?

We believe the root cause is one (or more) of these:

```
                        SKU Unavailability
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   VISIBILITY GAP        PREDICTION GAP       EXECUTION GAP
   (H1 - H1c)              (H2)               (H3a - H3c)
        │                     │                     │
   Don't see the         Can't predict        See it, but
   right issues          before it happens    can't/don't act
```

---

### H1: Visibility Gap (Validate via: User Interviews + POC)

**Core Belief**: Teams have data but it's too fragmented to act on. They're not looking at top issues because info isn't prioritized or surfaced to the right person.

| Sub-Hypothesis | What We Believe | Finding (Week 1-2) | Status |
|----------------|-----------------|-------------------|--------|
| **H1a: Fragmentation** | Procurement has data in 5+ places. No single prioritized view. | **PARTIAL**: Procurement has RCA report (`TEMP.PUBLIC.RCA_FILE_WH`) with daily detailed analysis. BUT for supplier fill rate reasons, they must reach out to buy team separately (emails) to get exact reasons and get issues sorted. **Some fragmentation exists for fill rate attribution.** | 🟡 Partially Validated |
| **H1b: Prioritization** | Top issues aren't highlighted. Everything looks equally important. | **FALSE**: Via RCA report, they DO know their top SKUs contributing to unavailability. Prioritization is not the problem. | 🔴 Invalidated |
| **H1c: Routing** | Issues go to wrong person or no one owns them | Not yet validated. Need to understand: once they see top issues, do they know who to escalate to? | ⚪ Testing in Week 3 |

**Key Insight**: The problem is NOT that procurement doesn't know their top issues (H1b is false). The potential problem is:
1. **Fill rate attribution** requires reaching out to buy team (fragmentation for root cause)
2. **Routing/ownership** once issue is identified (H1c - still unknown)

**Remaining Validation (Week 3)**:
- Validate H1c: Interview procurement to understand escalation paths and ownership clarity
- Test Proactive Report POC to see if surfacing fill rate reasons (from buy team knowledge) helps

---

### H2: Prediction Gap (Validate via: POC Build + Historical Testing)

**Core Belief**: Even if people see current issues, they can't predict what will go OOS 3-5 days ahead. They're always reactive.

| Sub-Hypothesis | What We Believe | How We Validate | If TRUE | If FALSE |
|----------------|-----------------|-----------------|---------|----------|
| **H2a: Predictability** | OOS events have detectable signals 3-5 days ahead (DOH trends, PO delays, supplier patterns) | Build rule-based model, test on 1 week historical data | Model achieves ≥70% precision | Signals too noisy or late |
| **H2b: Lead Time** | 3-5 days is enough lead time to take action | Interview: If we told you 5 days ahead, could you act? | Build alert system | Need different horizon |

**Validation Method**: Predictive Model POC (Week 3-4) + User Interviews

**This Week's Focus**:
- Build rule-based model v1 using DOH, open POs, fill rate signals
- Test on 1 week historical data

---

### H3: Execution Gap (Validate via: User Interviews + Observation)

**Core Belief**: Teams see the top issues but can't solve them fast enough. The bottleneck is action, not information.

| Sub-Hypothesis | What We Believe | How We Validate | If TRUE | If FALSE |
|----------------|-----------------|-----------------|---------|----------|
| **H3a: Top issues solved fast** | Top 5 chronic SKUs are already being solved quickly (24-48h) | Interview: Track top 5 from RCA report. How long to resolve? | Problem is long-tail, not top issues | Focus on speeding up top issue resolution |
| **H3b: Action clarity** | People know WHAT action to take but can't take it (capacity, approvals, dependencies) | Interview: When you see chronic OOS, what do you do? What blocks you? | Remove blockers, streamline workflow | Need to prescribe actions |
| **H3c: Ownership clarity** | It's unclear WHO should act on each type of issue | Interview: Who owns supplier fill rate? Who owns warehouse capacity? | Build clear RACI | Ownership is clear |

**Validation Method**: User Interviews (Week 3) + Workflow Observation

**This Week's Focus**:
- Interview 2-3 procurement/category managers
- Track: How long do top 5 chronic SKUs take to resolve?
- Observe: What happens after they see an issue in RCA report?

---

## Validation Status Summary

| Hypothesis | Method | Status | Finding / Key Question |
|------------|--------|--------|------------------------|
| H1a: Fragmentation | Interview | 🟡 Partial | RCA report exists, but fill rate reasons require buy team emails. Some fragmentation. |
| H1b: Prioritization | Interview | 🔴 Invalidated | They know top SKUs via RCA report. Prioritization is NOT the problem. |
| H1c: Routing | Interview | ⚪ Testing | Who do they escalate to? Clear ownership? |
| H2a: Predictability | POC (historical) | 🟡 Building | Can we predict OOS 3-5 days ahead at ≥70% precision? |
| H2b: Lead Time | Interview | ⚪ Not Started | Is 3-5 days enough to act? |
| H3a: Top issues fast | Interview | ⚪ Testing | How long to resolve top 5? 24h or 7 days? |
| H3b: Action clarity | Interview | ⚪ Testing | Do they know what to do? What blocks them? |
| H3c: Ownership | Interview | ⚪ Testing | Clear RACI for each issue type? |

---

## POCs & Validation Activities

| Activity | Validates | This Week Focus | Next Milestone |
|----------|-----------|-----------------|----------------|
| **Proactive Report POC** | H1c (Routing) | Test if surfacing fill rate reasons from buy team helps procurement | Complete testing by Week 3 end |
| **Predictive Model POC** | H2a | Build rule-based model v1 | Model tested on historical data by Week 3 end |
| **User Interviews** | H1c, H2b, H3a-c | Interview 2-3 procurement/category managers (H1a, H1b already answered) | Document findings by Week 3 end |
| **Workflow Observation** | H3a, H3b | Shadow procurement handling chronic OOS after they see RCA report | Observe 1-2 sessions by Week 3 end |

---

## This Week's Focus (Week 3: Jan 20-24)

### What We Already Know (from Week 1-2)

- **H1b (Prioritization) is FALSE**: Procurement knows their top SKUs via RCA report. Prioritization is not the problem.
- **H1a (Fragmentation) is PARTIAL**: RCA report exists, but supplier fill rate reasons require separate buy team outreach.

### Remaining Validation Goals

| Goal | Validates | Specific Question to Answer |
|------|-----------|----------------------------|
| Interview 2-3 procurement managers | H1c, H3a, H3b, H3c | Who do they escalate to? How long to resolve top 5? What blocks action? |
| Test Proactive Report with Rohit | H1c | Does surfacing fill rate reasons (buy team knowledge) help? |
| Build predictive model v1 | H2a | Can we detect OOS signals 3-5 days ahead? |
| Shadow 1 workflow session | H3a, H3b | What actually happens after they see an issue in RCA report? |

### Expected Outcomes by Week End

**If H1c (Routing) is the problem**: Unclear ownership, no escalation path → Build persona-specific routing + fill rate attribution

**If H3 (Execution) is the problem**: They know top issues AND who to escalate to, but can't act fast (capacity, approvals, dependencies) → Pivot to workflow optimization / escalation tooling

**If H2 (Prediction) is viable**: Model achieves ≥60% precision on historical data → Continue building, test with users in Week 4

**Blockers**: None

---

## Week-by-Week Progress

### Week 3 (Jan 20-24, 2026) - IN PROGRESS

**What We Set Out To Do**:
- Start user testing Proactive Report POC
- Build rule-based ML model for Predictive POC
- Conduct user interviews for H3 validation

**What Changed Since Last Week**: Built D-1 availability dashboard, mapped supply chain lego blocks. Now starting user validation.

**What Actually Happened**:
*(To be filled at week end)*

**Key Decisions Made**:
*(None yet this week)*

---

### Week 2 (Jan 13-17, 2026) - COMPLETED

**What We Set Out To Do**:
- Build Proactive Report POC dashboard
- Map supply chain building blocks
- Meet with Procurement team

**What Actually Happened**:
- Built Proactive Report POC dashboard ([PowerBI Link](https://app.powerbi.com/groups/me/reports/d684b4b4-570a-4d22-aec2-59651e81f535/ReportSection44eedd349a2030a00d13?experience=power-bi&clientSideAuth=0))
- Mapped 16 granular supply chain building blocks (PO planning, supplier/appointment, warehouse ops, demand/movement)
- Met with Mahesh (Procurement team) - documented in [2026-01-16 learnings](pocs/availability-prediction/learnings/2026-01-16.md)
- Analyzed procurement RCA table structure (30+ columns: DOH, QFR, in-transit stock, open POs)
- Identified three core problems: PO expiry (warehouse capacity), run rate mismatch (ARS vs actual), tribal knowledge gap

**Key Insight**: Problem is NOT lack of data. Problem IS execution at scale + coordination gaps + can't predict proactively.

**Key Decisions Made**:
- Run Proactive Report + Predictive POCs in parallel to test H1 and H2 simultaneously
- Start with rule-based model (not ML/GenAI) for faster validation

---

### Week 1 (Jan 6-10, 2026) - COMPLETED

**What We Set Out To Do**:
- Define North Star goal
- Identify hypotheses to test
- Start building D-1 Availability Dashboard
- Begin stakeholder conversations

**What Actually Happened**:
- Defined North Star goal: +10% in-session conversions via availability improvement
- Identified three core hypotheses to test (Information Gap, Prediction Gap, Execution Gap)
- Started building D-1 Availability Dashboard
- Began stakeholder conversations with Procurement team

**Key Insight**: Three gaps identified: Coordination & Accountability, Attention & Scale, Proactive Prediction. See [Strategic Framework](pocs/availability-prediction/learnings/strategic-framework.md).

**Key Decisions Made**:
- Focus POCs on Bradman Bangalore FMCG SKUs (~1,200 SKUs) for faster validation cycle

---

## Open Questions (Mapped to Hypotheses)

### Hypothesis Validation Questions

**Already Answered (Week 1-2)**:

| # | Question | Validates | Answer |
|---|----------|-----------|--------|
| 1 | Can procurement name their top 5 chronic OOS SKUs right now? | H1b | **YES** - via RCA report (`TEMP.PUBLIC.RCA_FILE_WH`). H1b invalidated. |
| 2 | How many tools/reports does procurement check daily? | H1a | **RCA report + buy team emails** for fill rate reasons. Partial fragmentation. |

**Need Answers (Week 3)**:

| # | Question | Validates | Method | Owner | Status |
|---|----------|-----------|--------|-------|--------|
| 3 | When they see a chronic OOS in RCA report, who do they escalate to? | H1c (Routing) + H3c (Ownership) | Interview | Sreeram | Not Answered |
| 4 | How long do top 5 chronic SKUs take to resolve? 24h? 7 days? | H3a (Top issues fast) | Interview + Data | Sreeram | Not Answered |
| 5 | What blocks them from taking action even when they know the issue? | H3b (Action clarity) | Interview | Sreeram | Not Answered |
| 6 | If we predicted OOS 5 days ahead, could they act in time? | H2b (Lead time) | Interview | Sreeram | Not Answered |

### Baseline & Scope Questions (Need Answers Week 3-4)

| # | Question | Why It Matters | Owner | Status |
|---|----------|----------------|-------|--------|
| 7 | What is baseline in-session conversion % for Bradman Bangalore FMCG? | Need to measure +10% improvement | Sreeram + Analytics POD | Not Answered |
| 8 | What % of SKUs currently <60% available (chronic)? | Defines scope of problem | Sreeram | Not Answered |
| 9 | What's distribution of root causes in chronic OOS? (% supplier vs warehouse vs demand) | If 80% one cause, simpler solution | Sreeram + Analytics | Not Answered |

### Strategic Questions (Need Answers Week 4-6)

| # | Question | Why It Matters | Owner | Status |
|---|----------|----------------|-------|--------|
| 10 | If H1 (Visibility) is invalidated, do we pivot to H2 (Prediction) or H3 (Execution)? | Determines pivot strategy | Sreeram + Phani | Not Answered |
| 11 | Can we access Brand SCM emails via Glean for tribal knowledge extraction? | Critical for V1 Predictive POC | Sreeram + Goda | Not Answered |
| 12 | Proactive Report: D-1 report or real-time alerts? | D-1 is reactive. Real-time catches earlier. | Sreeram (user testing) | Not Answered |
| 13 | Predictive POC: What prediction horizon - 3/5/7 days? | Too short = no time to act. Too long = accuracy drops. | Sreeram + Business | Not Answered |
| 14 | Acceptable false positive rate for predictions? | High FP = alert fatigue | Sreeram + Phani | Not Answered |

---

## Key Decisions Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| Week 1 | Scope POCs to Bradman Bangalore FMCG (~1,200 SKUs) | Faster validation cycle, highest business impact | Reduced from 10K+ SKUs, allows 2-3 week POC cycles |
| Week 2 | Run Proactive + Predictive POCs in parallel | Test H1 and H2 simultaneously, faster learning | Team bandwidth split, but will know in 4-5 weeks which has more traction |
| Week 2 | Start with rule-based model (not ML/GenAI) | Faster to build, easier to explain | Simpler model, may have lower accuracy but establishes baseline |

---

## Blockers & Risks

**Current Blockers**: None

*When blockers arise, add a row:* `| Issue | Severity (Critical/Medium/Low) | Impact | Mitigation | Owner | Status |`

---

## Quick Reference

### POC Details

**POC 1: Proactive Report (D-1 Dashboard)**
- **Tests**: H1 - Information Gap
- **Timeline**: Week 1-2 (Build) → Week 3 (User Testing) → Week 4 (Iterate) → Week 5 (Decide POC→Production)
- **Success Criteria**: Need 1 of 3:
  1. Helps team track more SKUs than manual monitoring (extends beyond Top 100/Bradman)
  2. Enables action on top 5 issues within 24-48 hours
  3. Gives leadership visibility on what breaks, why, and time-to-resolution
- **Link**: [PowerBI Dashboard](https://app.powerbi.com/groups/me/reports/d684b4b4-570a-4d22-aec2-59651e81f535/ReportSection44eedd349a2030a00d13?experience=power-bi&clientSideAuth=0)

**POC 2: Predictive Model (Rule-Based)**
- **Tests**: H2 - Prediction Gap
- **Timeline**: Week 3 (Build Model) → Week 4 (Test Historical) → Week 5 (User Testing) → Week 6-7 (Iterate) → Week 8 (Decide POC→Production)
- **Success Criteria**:
  1. Prediction accuracy: ≥70% precision on OOS events 3-5 days ahead
  2. Attribution accuracy: ≥80% correct root cause (supplier/warehouse/demand)
  3. Actionability: Users agree actions relevant in ≥60% of cases
- **Docs**: [POC Plan](pocs/availability-prediction/plan.md), [CLAUDE.md](pocs/availability-prediction/CLAUDE.md)

### Resources & Links

**Daily Learnings**: `scm/pocs/availability-prediction/learnings/` (dated files: YYYY-MM-DD.md)

**Key Documents**:
- [2026-01-16: Supply Chain Deep Dive](pocs/availability-prediction/learnings/2026-01-16.md) - Comprehensive supply chain understanding, lego blocks, RCA table
- [Strategic Framework](pocs/availability-prediction/learnings/strategic-framework.md) - Hypothesis framework, V0/V1/V2 approach

**Stakeholder Conversations**:
- Week 1-2: Mahesh (Procurement) - see [2026-01-16.md](pocs/availability-prediction/learnings/2026-01-16.md)

---

### Important Artifacts, Tables & Dashboards

#### Data Tables

| Purpose | Databricks | Snowflake | Filter/Notes |
|---------|------------|-----------|--------------|
| **Bradman SKU List** | `analytics_prod.analytics_public_rb_bradman_spin_list_16_dec_seasonality_eol_removal` | `analytics.public.rb_bradman_spin_list_16_dec_seasonality_eol_removal` | Filter: `is_top_item = 1` |
| **SPIN ID → SKU Mapping** | `prod.analytics_prod.im_store_sku_spin_mapping` | - | Maps SPIN ID to SKU |
| **D-1 Unavailability RCA** | `analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7` | `analytics.public.sku_wise_availability_rca_with_reasons_v7` | Powers D-1 dashboard |
| **Procurement RCA Table** | - | `TEMP.PUBLIC.RCA_FILE_WH` | Daily RCA report for procurement |
| **Competition Availability** | `anakin.swiggy_anakin_competition_availability_new` | - | Competitor availability data |

#### Dashboards

| Dashboard | Link | Purpose |
|-----------|------|---------|
| **D-1 Unavailability (POC 1)** | [PowerBI](https://app.powerbi.com/groups/me/reports/d684b4b4-570a-4d22-aec2-59651e81f535/ReportSection44eedd349a2030a00d13?experience=power-bi&clientSideAuth=0) | Proactive Report POC - SKU-level availability RCA |
| **Competition Availability Benchmark** | [PowerBI](https://app.powerbi.com/groups/me/apps/0e87d9dd-6260-4aad-9638-d2e8b23abfc6/reports/6c26fdaa-47de-48ec-a187-79c1af73dd72/c08f677f87bd03f8f6a3?experience=power-bi) | Compare availability vs Blinkit, Zepto, BBNow |
| **Assortment 2.0 Availability** | [PowerBI](https://app.powerbi.com/groups/me/apps/0e87d9dd-6260-4aad-9638-d2e8b23abfc6/reports/7e06fe57-2bde-450c-9bfd-5a0b717a08b4/486d466478c0e228594e?experience=power-bi) | Assortment-level availability tracking |

---

## For Daily Updates

**Instructions**: Add one line per day. Format: `[1-2 sentence summary]. Key: [most important item]. Link: [if detailed notes exist]`

| Date | Update |
|------|--------|
| Jan 20 (Mon) | |
| Jan 21 (Tue) | |
| Jan 22 (Wed) | |
| Jan 23 (Thu) | |
| Jan 24 (Fri) | |

---

## How to Update This Document

**Daily (2 min)**: Go to "For Daily Updates" above, fill in today's entry.
**Weekly (10 min)**: Update Week section, move completed week to archive.
**When something changes**: Update the relevant table (decisions, blockers, questions).

---

## Appendix

### What is Swiggy Brain? (Full Context)

**Larger Initiative**: AI-first operations intelligence platform for Swiggy's businesses, enabling proactive anomaly detection, root cause analysis, and intervention recommendations.

**Three Domains**:
1. **Supply Chain Brain** (Current Focus - JFM 2026): SKU availability improvement at Instamart dark stores
2. **Category Brain** (Future): Selection gaps, pricing, competitive intelligence for category managers
3. **Growth Brain** (Future): Retention, conversion, hyperlocal demand for growth/CRM teams

---

### Full Team Structure

**Leadership**:
- Phani (Overall Initiative Lead)
- Madhu (Engineering Leadership)
- Ankit & Himavant (IM Leadership)
- Goda (Central AI Leadership)

**POD Structure**:

**1. Business & Consumer POD**:
- Supratim Gupta (Demand Planning & Procurement)
- Rohit Shaw (FMCG Procurement Lead)
- Ishan (FMCG Demand Planning Lead)
- Category Manager Team

**2. Business Analytics POD**:
- Shrinivas Ron
- Godavarthi Sai Durga Prasad
- Bhavana Addagulla

**3. Engineering POD**:
- 2 Engineers (TBD)

**4. Central AI POD** (Execution Owner: Sreeram):
- Amaresh Marripudi
- Sreeram Sridhar
- Sidhant Panda
- Shridhar Bhat
- Sufiyan Shaikh
- Vatsal

---

### Success Metrics Details

**Primary Metric**: +10% in-session conversions (relative improvement over baseline)
- Example: If baseline is 80% conversion, target is 88% conversion

**Constraints** (Must NOT increase):
- Wastage (spoilage, expired inventory)
- Days of Inventory (DOH)

**Scope**: Bradman Bangalore FMCG SKUs (~1,200 SKUs for POC validation)

**Pass Criteria**: Need **at least 1 of 3** POC success criteria met to move to production. If all 3 fail, hypothesis invalidated → pivot.

---

### Update Guidelines

**When X Changes, Update Y**:

| What Changed | Where to Update |
|--------------|-----------------|
| Daily progress | For Daily Updates table |
| POC hits milestone | Hypotheses & POCs tables |
| Hypothesis validated/invalidated | Hypotheses table status |
| New blocker arises | Blockers & Risks table |
| Open question answered | Open Questions table status |
| Decision made | Key Decisions Log table |

**Status Key**: On Track / Testing / Building / Blocked / Completed / Not Answered / Answered

---

**Version**: 4.0 | **Created**: January 19, 2026 | **Owner**: Sreeram
