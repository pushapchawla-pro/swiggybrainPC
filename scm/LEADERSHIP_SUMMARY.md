# Swiggy Brain Central Tracker
**Last Updated**: January 19, 2026 | **Owner**: Sreeram

> For detailed tracking, hypotheses breakdown, and daily updates, see [Full Execution Tracker](EXECUTION_TRACKER.md)

---

## Initiative Overview

**What**: AI-first operations intelligence platform to improve SKU availability at Instamart PODs.

**Goal**: **+10% in-session conversions** for Bradman Bangalore FMCG SKUs (~1,200 SKUs) by March 31, 2026.

> **Note**: Bradman = Top-tier high-velocity SKUs that drive majority of Instamart revenue.

**Business Impact**: Baseline conversion % TBD. +10% improvement on Bradman SKUs = significant GMV uplift for Instamart.

**Constraints**: No increase in wastage or days of inventory.

**Timeline**: 13 weeks (Jan 6 - Mar 31, 2026)

---

## Current Status

| Metric | Value |
|--------|-------|
| **Health** | 🟢 On Track |
| **Week** | 3 of 13 |
| **Blockers** | None |

---

## This Week's Priority

### User Interviews and Observations

**Validate Execution Hypothesis with Procurement (H3)**:
- Even when they see top issues, can they act fast?
- How long do top 5 chronic SKUs take to resolve?
- What blocks them from taking action even when they know the issue?
- What actions are in their control vs. not in their control?
- Who owns what in the resolution process?

**Understanding with Demand Planning Team**:
- Understand how they make Demand Planning decisions?
- How do they take care of capacity constraints while planning?
- What do they exactly validate with the inputs from the Sell Team?

**Understanding with the Sell Team**:
- Their Sell Plan creation process

### POCs

- Improve Proactive Report V0 → V1 — Add Blinkit competition data, improve LLM reasoning
- Start ML model execution for OOS prediction (H2a)

---

## Daily Standup Snapshot

> **Use this section in daily standups** to track progress across all validation activities.

### Progress This Week (Week 3)

| Validation Activity | Hypothesis | Status | Progress |
|---------------------|------------|--------|----------|
| **User Interviews** | H1c, H3 | 🟡 In Progress | Done: Buy Team, Sell Team, Procurement Team. In Progress: Demand Planning Team |
| **Proactive Report POC** | H1c | 🟡 Building | V0 ready. Next: 1) Improving LLM reasoning 2) Adding Blinkit competition data for chronic SKUs |
| **Predictive Model POC** | H2a | 🟡 Building | Plan made - will start execution with ML model this week |

### Key Questions to Answer This Week

| # | Question | Method | Status |
|---|----------|--------|--------|
| 1 | When procurement sees chronic OOS, who do they escalate to? | Interview | ⚪ Not Answered |
| 2 | How long do top 5 chronic SKUs take to resolve? | Interview | ⚪ Not Answered |
| 3 | What blocks them from taking action even when they know the issue? | Interview | ⚪ Not Answered |
| 4 | Can we predict OOS 3-5 days ahead with ≥60% precision? | POC | 🟡 Testing |

### What Changed Since Last Standup

| Date | Update |
|------|--------|
| Jan 19 | Week 3 kickoff. Scheduling interviews with Procurement, Sell Team, Demand Planning. |
| Jan 20 | *(Update here)* |
| Jan 21 | *(Update here)* |
| Jan 22 | *(Update here)* |
| Jan 23 | *(Update here)* |

---

## What We're Testing

**Primary Question**: Why are SKUs chronically unavailable?

### Hypothesis Status

> **Legend**: ✅ = Ruled out (not the problem) | 🟡 = Partial / In Progress | ⚪ = Not yet tested

| Hypothesis | What We're Validating | Status | Finding |
|------------|----------------------|--------|---------|
| **H1a: Fragmentation** | Is data scattered across multiple tools? | 🟡 Partial | Teams have consolidated RCA report, but must email buy team separately for supplier fill rate reasons. |
| **H1b: Prioritization** | Do teams struggle to identify top problem SKUs? | ✅ Ruled out | **No** - Procurement knows their top SKUs via daily RCA report. Prioritization works. |
| **H1c: Routing** | Once they see an issue, do they know who to escalate to? | ⚪ Testing | Validating via interviews - is escalation path clear? |
| **H2a: Predictability** | Can we predict OOS 3-5 days before it happens? | 🟡 Building | Building rule-based model using DOH, open POs, fill rate signals |
| **H3: Execution Gap** | Even when they see top issues, can they act fast? | ⚪ Testing | Validating via interviews: How long to resolve? What blocks action? Who owns what? |

### Validation Methods

| Method | What We're Validating | Teams Involved | Status |
|--------|----------------------|----------------|--------|
| **User Interviews** | H1c (Routing), H3 (Execution Gap) | Procurement, Sell Team, Demand Planning | 🟡 Week 3 |
| **Proactive Report POC** | Does surfacing fill rate reasons help? | Central AI + Procurement | 🟡 Building |
| **Predictive Model POC** | Can we achieve ≥60% precision? | Central AI POD | 🟡 Building |

---

## POCs Running

| POC | Purpose | Status | Next Milestone |
|-----|---------|--------|----------------|
| **Proactive Report** | Surface prioritized issues to right person | 🟡 Building | Ready for user testing by Week 3 end |
| **Predictive Model** | Predict OOS 3-5 days ahead | 🟡 Building | Model tested on historical data by Week 3 end |

---

## Week 3 Focus (Jan 20-24)

**Primary Activity**: Interview procurement managers, sell team, and demand planning team to understand their systems, personas, and validate hypotheses.

| Activity | Teams | Hypothesis Being Validated |
|----------|-------|---------------------------|
| User interviews (2-3 sessions) | Procurement, Sell Team, Demand Planning | H1c (Routing), H3 (Execution Gap) |
| Build Proactive Report POC | Central AI + Procurement | Does surfacing fill rate reasons help? |
| Build predictive model v1 | Central AI POD | H2a (Can we predict OOS 3-5 days ahead?) |

**Expected Outcomes**:
- Determine if problem is routing/ownership (H1c) or execution capacity (H3)
- Validate if prediction is feasible at ≥60% precision

---

## Key Decisions Made

| Week | Decision | Why |
|------|----------|-----|
| Week 1 | Scope to Bradman Bangalore FMCG (~1,200 SKUs) | Faster validation, highest impact |
| Week 2 | Run Proactive + Predictive POCs in parallel | Test both hypotheses simultaneously |
| Week 2 | Start with rule-based model (not ML/GenAI) | Faster to build, easier to explain |

---

## Insights (Week 1-2)

1. **Prioritization is NOT the problem** - Procurement knows their top SKUs via RCA report
2. **Some fragmentation exists** - Fill rate reasons require reaching out to buy team separately
3. **Problem is execution + coordination** - Not lack of data

---

## Team

**Leadership**: Phani, Madhu, Ankit, Himavant, Goda

**Execution**: Central AI POD (Sreeram - lead) + Business POD (Supratim, Rohit, Ishan) + Analytics POD (Shrinivas, Godavarthi, Bhavana)

---

## Decisions Needed (by Week 4)

| # | Decision | Options | Deadline | Recommendation |
|---|----------|---------|----------|----------------|
| 1 | If H1 (Visibility) invalidated, where to pivot? | A) Double down on H2 (Prediction) B) Pivot to H3 (Execution tooling) | Week 4 | TBD after Week 3 interviews |
| 2 | Approve Glean access for Brand SCM emails? | A) Yes B) No - use alternative data | Week 4 | Pending |

---

## Timeline to Decision

| Milestone | Target |
|-----------|--------|
| Proactive Report POC decision | Week 5 (Feb 3-7) |
| Predictive Model POC decision | Week 8 (Feb 24-28) |
| Final recommendation | Week 10-11 (Mar 10-21) |

---

*For detailed hypothesis breakdown, validation status, data tables, and daily updates, see [Full Execution Tracker](EXECUTION_TRACKER.md)*
