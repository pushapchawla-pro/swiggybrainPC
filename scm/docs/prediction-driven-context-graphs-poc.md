# POC: Prediction-Driven Context Graphs for SKU Availability

---

## Executive Summary

**Objective**: Build a self-improving SKU availability prediction system that learns what context matters through prediction pressure, not manual curation.

**Approach**: Daily predict→evaluate→reflect cycle where ground truth (actual OOS) validates predictions, and errors drive context graph evolution.

**Scope**: Bangalore, FMCG Bradman Tier A (~1.2K SKUs), Top WH by volume, T+1 predictions.

**Timeline**: 13 working days across 3 weeks (Jan 12-30). Week 1: Build (Jan 12-16). Week 2: Simulation (Jan 19-23). Week 3: Live + Demo (Jan 27-30). *Excludes weekends and holidays (Jan 15: Pongal, Jan 26: Republic Day).*

**Success**: **Primary**: Positive F1 slope (self-improvement). **Secondary**: F1 >0.70 (simulation), F1 >0.75 (live), 10+ validated patterns.

**Conceptual Foundation**: [Prediction-Driven Context Graphs](./prediction-driven-context-graphs.md)

---

## 1. Problem Statement

### Current State: Diagnostic Analytics

Current AI analytics systems at Swiggy operate in **diagnostic mode**—asking "why did this SKU go OOS?" after the fact. This approach has fundamental limitations:

| Problem | Impact |
|---------|--------|
| **Subjective feedback** | Humans upvote/downvote, no ground truth |
| **Manual context curation** | Humans must add wikis, metadata, tags |
| **No self-improvement** | System learns from limited human feedback only |
| **Post-hoc alerting** | Issues detected after damage done |
| **7 RCA branches are incomplete** | Rules capture known patterns, miss emergent ones |

### The Core Insight

Prediction pressure forces discovery of what context matters—the context graph writes itself. (See [concept doc](./prediction-driven-context-graphs.md#why) for the theoretical foundation.)

### Why SKU Availability is the Ideal Testbed

| Property | Value for Learning |
|----------|-------------------|
| Binary outcomes | In-stock/OOS = unambiguous ground truth |
| 24hr feedback loops | Fast validation cycles |
| Bounded complexity | 7 RCA branches = manageable scope |
| Existing infrastructure | Data already available in Snowflake |
| Business impact | Direct tie to conversion metrics |

---

## 2. High-Level Approach

### Shift: Diagnostic → Predictive

Instead of asking "**why did this go OOS?**" (post-hoc, subjective), ask "**will this go OOS tomorrow?**" (predictive, verifiable).

```
DIAGNOSTIC (Current)                    PREDICTIVE (POC)
─────────────────────                   ─────────────────
"Why did X go OOS?"                     "Will X go OOS tomorrow?"
     │                                        │
     ▼                                        ▼
Human reviews RCA                        Binary outcome in 24hrs
     │                                        │
     ▼                                        ▼
Subjective feedback                      Ground truth validation
     │                                        │
     ▼                                        ▼
Limited learning                         Context graph self-curates
```

### Inner Loop: Daily Prediction Cycle

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
             ┌────────────┐                                   │
             │  EVALUATE  │ ◄─── Compare predictions vs       │
             │            │      actual OOS (ground truth)    │
             └─────┬──────┘                                   │
                   │                                          │
                   │ errors                                   │
                   ▼                                          │
             ┌────────────┐                                   │
             │  REFLECT   │ ◄─── Analyze errors, extract      │
             │            │      patterns, update context     │
             └─────┬──────┘                                   │
                   │                                          │
                   │ patterns                                 │
                   ▼                                          │
             ┌────────────┐                                   │
             │  PREDICT   │ ◄─── Forecast tomorrow's OOS      │
             │            │      with reasoning               │
             └─────┬──────┘                                   │
                   │                                          │
                   │ predictions                              │
                   │                                          │
                   └──────────── 24 hours ────────────────────┘
```

**Daily Sequence:**
```
MORNING (T+0):
  0. GIT PULL    ─── Checkout latest from main branch
  1. EVALUATE    ─── Compare yesterday's predictions vs actuals (binary truth)
  2. REFLECT     ─── Analyze errors → extract patterns → update context graph
  3. PREDICT     ─── Forecast OOS for tomorrow with reasoning
  4. GIT COMMIT  ─── Commit all changes (predictions, evaluations, patterns) to main
```

**Why Git?** Context graph evolution is version-controlled. Every pattern, prediction, and learning is traceable. Enables rollback if patterns degrade.

### Outer Loop: Skill Evolution

The inner loop updates the context graph daily. A separate **outer loop** updates skills themselves (better processes, queries, algorithms). Triggered weekly or on error accumulation. See [Section 3.5](#35-learning-loops) for details.

### Cold-Start via Historical Simulation

Build initial context graph BEFORE going live, so Day 1 isn't starting from scratch.

```
Historical Simulation (Dec 19 - Jan 18):
  Day 1: Predict Dec 20 using ONLY Dec 19 EOD data → Context graph: EMPTY
  Day 2: Evaluate → Reflect (Pattern_001) → Predict Dec 21
  ...
  Day 30: Context graph has 30 days of patterns → READY FOR LIVE

Live (Jan 19+):
  Start with warm context graph, continue learning
```

**Anti-Cheat**: Point-in-time query filtering required. See [Section 4.4](#44-anti-cheat-requirements).

---

## 3. Low-Level Design

### 3.1 Prediction Target

**Core Question**: "Will this SKU be out of stock at this Warehouse tomorrow?"

#### 3.1.1 What We Predict

| Dimension | Value | Rationale |
|-----------|-------|-----------|
| **Prediction unit** | SKU × WH | WH-led issues are 3× more common (12.8% vs 4.7% POD-led). Denser signal, faster learning. |
| **Time horizon** | T+1 (tomorrow) | 24hr feedback loop for fast learning |
| **Outcome** | Binary (OOS / IN_STOCK) | Unambiguous ground truth |

> **Note**: Phase 1 focuses on WH×SKU predictions (single top Bangalore WH). Phase 2 can expand to POD×SKU if needed.

#### 3.1.2 Ground Truth & Evaluation

**OOS Definition** — For WH×SKU, we **aggregate POD-level availability** across all PODs served by the warehouse:

```
For each SKU×WH:
  1. Get POD-level availability % for all PODs served by WH
  2. Aggregate: WH_Availability % = weighted average across PODs (by impressions or equal weight)

OOS = TRUE  if  WH_Availability % < X%  for the day
OOS = FALSE otherwise
```

**Threshold (X): TBD** — To be determined via data analysis during Week 1. Considerations:
- Too high (e.g., 70%): Many false positives, noisy learning signal
- Too low (e.g., 30%): Misses partial-day stockouts that still hurt conversion
- Will analyze distribution of WH-aggregated availability % to find natural breakpoint

**Why aggregate by WH?** WH-led issues (supplier, procurement, warehouse ops) are 3× more common than POD-led issues. Aggregating provides denser signal for pattern learning.

**F1 Score Calculation** — We use **Micro-F1**, pooling all SKU×WH predictions for the day:

```
Precision = TP / (TP + FP)    → "When we predict OOS, how often correct?"
Recall    = TP / (TP + FN)    → "Of actual stockouts, how many caught?"
F1        = 2 × (P × R) / (P + R)
```

| Outcome | Meaning |
|---------|---------|
| TP | Predicted OOS, was OOS |
| FP | Predicted OOS, was IN_STOCK (false alarm) |
| FN | Predicted IN_STOCK, was OOS (missed) |

**Why F1 over Accuracy?** Class imbalance — most SKUs are in-stock. A naive "always predict IN_STOCK" model gets ~95% accuracy but catches zero stockouts. F1 forces us to actually predict OOS correctly.

**Secondary metrics** (for diagnostics, not exit criteria):
- OOS rate: % of SKU×WH pairs that went OOS (class balance)
- Per-category F1: Performance by Dairy, Beverages, etc.
- Per-supplier F1: Are some suppliers harder to predict?

### 3.2 Architecture

**Claude Code IS the Orchestrator** with full autonomy:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         CLAUDE CODE (Orchestrator)                             │
│                                                                                │
│  Full autonomy: Run any query, computation, search, or model needed           │
│                                                                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                    SKILLS (Procedural Knowledge)                          │ │
│  │                                                                           │ │
│  │   .claude/skills/evaluate/    .claude/skills/reflect/                     │ │
│  │   .claude/skills/predict/     .claude/skills/context-graph-management/    │ │
│  │                                                                           │ │
│  │   Updated via OUTER LOOP (periodic) - See Section 3.5                     │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                    CONTEXT GRAPH (Semantic Knowledge)                     │ │
│  │                                                                           │ │
│  │   brain/context-graph/patterns/by-{dimension}/   # Discovered patterns    │ │
│  │   brain/context-graph/signals.md                 # Signal importance      │ │
│  │   brain/context-graph/failures.md                # Deprecated patterns    │ │
│  │                                                                           │ │
│  │   Updated via INNER LOOP (daily)                                          │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                                │
│  ┌───────────────────────────────────────────────────────────────────────────┐ │
│  │                    LOGS (Daily Artifacts)                                 │ │
│  │                                                                           │ │
│  │   logs/predictions/YYYY-MM-DD.json   # Daily prediction outputs           │ │
│  │   logs/evaluations/YYYY-MM-DD.json   # Daily evaluation results           │ │
│  │   logs/reflections/YYYY-MM-DD.md     # Daily learnings & hypotheses       │ │
│  └───────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘
          │                    │                    │                    │
          ▼                    ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Snowflake     │  │   Glean MCP     │  │   Web Search    │  │   Git           │
│   (32 Tables)   │  │   (Internal KB) │  │   (External)    │  │   (Versioning)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 3.3 Knowledge Types

| Aspect | CLAUDE.md (Instructions) | Skills (Procedural) | Context Graph (Semantic) |
|--------|--------------------------|---------------------|--------------------------|
| **Type** | "What to do" | "How to do it" | "What is true" |
| **Content** | High-level directives, constraints, goals | Steps, queries, algorithms | Patterns, facts, relationships |
| **Examples** | "Always use point-in-time queries" | "How to calculate F1 score" | "Supplier X delays on Fridays" |
| **Loading** | **Always loaded** (auto-read) | **On-demand** (invoked) | **On-demand** (retrieved) |
| **Learning Loop** | N/A (manual) | **Outer (periodic)** | **Inner (daily)** |
| **Update Trigger** | Rarely (fundamental changes) | When process improves | When new patterns discovered |
| **Persistence** | `CLAUDE.md` in key directories | `.claude/skills/*.md` | `brain/context-graph/*.md` |
| **Scope** | Project-wide principles | Task-specific procedures | Instance-specific facts |

**Analogy**:
- **CLAUDE.md** = "Drive safely, follow traffic rules" (principles—always in mind)
- **Skills** = "How to parallel park" (procedural memory—recalled when needed)
- **Context Graph** = "This road floods when it rains" (semantic memory—retrieved by context)

**Loading Hierarchy**:
```
ALWAYS LOADED (auto-read on entry):
  └── CLAUDE.md files in current + parent directories

LOADED ON DEMAND (invoked explicitly):
  └── Skills via trigger phrases ("evaluate predictions", "predict OOS")

RETRIEVED BY CONTEXT (during prediction):
  └── Context graph patterns matching current SKU/POD/signals
```

### 3.4 Skills (Procedural Knowledge)

Four skills form the daily cycle. Located at `.claude/skills/`. Implementation details are discovered through iteration—these are guidelines, not prescriptions.

#### Skill: `evaluate`

Compare yesterday's predictions against actual OOS outcomes.

| Aspect | Detail |
|--------|--------|
| **Trigger** | "evaluate predictions", "check F1" |
| **Inputs** | `logs/predictions/{yesterday}.json`, Snowflake availability data |
| **Outputs** | `logs/evaluations/{yesterday}.json` |
| **Ground Truth** | Availability < X% = OOS (threshold TBD) |

**Process**: Load predictions → Query actuals from Snowflake → Calculate precision/recall/F1 → Track which patterns triggered each prediction → Write evaluation with per-prediction error details.

**Failure Modes**: Missing prediction file (skip day, log gap), Snowflake timeout (retry 3x, then skip).

#### Skill: `reflect`

Learn from prediction errors and update the context graph.

| Aspect | Detail |
|--------|--------|
| **Trigger** | "reflect on errors", "update patterns" |
| **Inputs** | `logs/evaluations/{yesterday}.json`, Glean (past RCAs/incidents) |
| **Outputs** | `brain/context-graph/patterns/`, `logs/reflections/{today}.md` |
| **Thresholds** | Add pattern: 10+ observations; Deprecate: F1 <0.50 |

**Process**: Analyze errors from evaluation → Cluster by root cause → Search Glean for past RCAs → Extract patterns (only after 10+ observations) → Deprecate failing patterns to `failures.md` → Update `signals.md` with revised importance → Write daily learnings to `reflections/`.

**Failure Modes**: No errors to analyze (skip reflection, note in log), Glean timeout (proceed without historical context).

#### Skill: `predict`

Forecast tomorrow's OOS with reasoning.

| Aspect | Detail |
|--------|--------|
| **Trigger** | "predict OOS", "forecast availability" |
| **Inputs** | `brain/context-graph/patterns/`, `signals.md`, Snowflake (inventory/PO/supplier), Web (events) |
| **Outputs** | `logs/predictions/{tomorrow}.json` |
| **Scope** | Bangalore, Bradman FMCG Tier A, Top WH by volume |

**Process**: Read `signals.md` for importance ranking → Retrieve relevant patterns from context graph → Query Snowflake for current inventory, PO status, supplier metrics → Check external events (IPL, weather, festivals) via web search → Check Glean for ongoing incidents → Generate predictions with matched patterns and reasoning.

**Failure Modes**: Snowflake partial failure (predict with available data, flag confidence), Web search timeout (proceed without external events).

#### Skill: `context-graph-management`

Guidelines for storing and retrieving patterns.

**Pattern Generalization Principle**: Patterns are learned at **higher granularity** than predictions for signal density:

```
PATTERN LEVEL (learned):          PREDICTION LEVEL (applied):
─────────────────────────         ──────────────────────────
Category × Signal                 SKU × WH
"Dairy + DOH<1 → 80% OOS"   ───►  "SKU 12345 at WH 7 → OOS"
                                   (SKU 12345 is dairy, DOH=0.5)

Supplier × Temporal               SKU × WH
"Supplier X + Friday → delay" ──► "SKU 67890 at WH 3 → OOS"
                                   (SKU 67890 from Supplier X)
```

This allows patterns to generalize across SKUs while predictions remain actionable at SKU × WH level.

| Aspect | Detail |
|--------|--------|
| **Core Principle** | Structure IS the index—organize by retrieval dimension |
| **Dimensions** | `by-category/`, `by-supplier/`, `by-temporal/`, `by-signal/`, `external/` |
| **Format** | Consistent markdown headers for grep-ability |
| **Duplication** | OK if pattern spans multiple dimensions |

**Storage Rules**:
- One pattern per H2 header (`## Pattern: {id}`)
- Always include: triggers, action, F1, observation count
- Cross-reference related patterns via links

**Retrieval**: Use Glob for dimension, Grep for specific conditions.

### 3.5 Learning Loops

Two distinct feedback loops drive system improvement:

```
┌─────────────────────────────────────────────────────────────────────┐
│                       INNER LOOP (Daily)                            │
│                    Context Graph Evolution                          │
│                                                                     │
│   Evaluate → Reflect → Predict → [24 hours] → Evaluate → ...        │
│                                                                     │
│   Updates: patterns/, signals.md, failures.md, reflections/         │
│   Scope: "What is true" - semantic knowledge about the world        │
└─────────────────────────────────────────────────────────────────────┘
                               │
                               │ reflections accumulate
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     OUTER LOOP (Periodic)                           │
│                       Skill Evolution                               │
│                                                                     │
│   Review reflections → Identify process gaps → Update skills        │
│                                                                     │
│   Updates: .claude/skills/*.md, scripts/                            │
│   Scope: "How to do it better" - procedural knowledge improvement   │
└─────────────────────────────────────────────────────────────────────┘
```

#### Inner Loop: Context Graph Updates

The daily cycle (evaluate → reflect → predict) updates semantic knowledge:

| Artifact | What Gets Updated | Trigger |
|----------|-------------------|---------|
| `patterns/` | New patterns added when 10+ observations confirm | Daily, during reflect |
| `signals.md` | Signal importance rankings revised | Daily, based on error analysis |
| `failures.md` | Patterns deprecated when F1 < 0.50 | Daily, during reflect |
| `reflections/` | Daily learnings, error clusters, hypotheses | Daily, end of reflect |

**Stability**: Context graph changes daily, but individual patterns require evidence (10+ observations) before being added.

#### Outer Loop: Skill Evolution

Skills are procedural knowledge—they change less frequently and require more validation:

| Trigger | Example | Action |
|---------|---------|--------|
| **Weekly review** | End of Week 1, end of Week 2 | Human + Claude review `reflections/`, identify process gaps |
| **Error threshold** | Same error type 5+ times | Claude proposes skill improvement, human approves |
| **Performance plateau** | F1 stuck below target | Analyze which skill phase is bottleneck |
| **Human-initiated** | "Improve supplier delay detection" | Direct instruction to update specific skill |

**Process:**
1. **Aggregate** - Read all `logs/reflections/*.md` from period
2. **Identify gaps** - Find recurring errors about process, not just missing patterns
3. **Propose changes** - Draft updates to SKILL.md or scripts/
4. **Validate** - Run simulation subset with new skill
5. **Commit** - If performance improves, commit skill changes

**Examples of skill improvements:**
- "Evaluate uses wrong OOS threshold (50% vs 30%)" → Update `evaluate/SKILL.md`
- "Predict should check PO status before inventory levels" → Update `predict/SKILL.md`
- "Reflect adds patterns too aggressively (5 obs instead of 10)" → Update `reflect/SKILL.md`
- "Supplier metric query misses key columns" → Update `scripts/fetch_supplier.sql`

**Why separate loops?**
- **Stability**: Skills shouldn't thrash based on one bad day
- **Evidence**: Process changes need multiple days of data to validate
- **Testability**: Skill changes can be A/B tested in simulation
- **Human oversight**: Procedural changes are higher-risk, warrant review

#### Rollback & Recovery

| Trigger | Action |
|---------|--------|
| F1 drops >15% after pattern update | `git revert` to previous context graph |
| Pattern F1 <0.40 for 3 consecutive days | Auto-deprecate to `failures.md` |
| Skill change causes regression | Revert skill, re-run simulation subset |
| Snowflake outage during evaluation | Skip day, note gap in `reflections/` |

**Recovery principle**: Context graph is version-controlled. Every state is recoverable via git history.

### 3.6 Tools Available to Agent

| Tool | Purpose | Access Method |
|------|---------|---------------|
| **Snowflake** | Query any of 32 tables | `snowsql` CLI via Bash |
| **Glean Search** | Search Confluence, Jira, Slack, Docs | `mcp__glean_default__search` |
| **Glean Chat** | AI-powered synthesis across sources | `mcp__glean_default__chat` |
| **Glean Read** | Read full document by URL | `mcp__glean_default__read_document` |
| **Glean Code** | Search internal code repos | `mcp__glean_default__code_search` |
| **Web Search** | External events (IPL, festivals, weather) | `WebSearch` tool |
| **Web Fetch** | Fetch specific URLs | `WebFetch` tool |
| **Git** | Version control for context graph | `git` via Bash |
| **Python** | Statistical analysis, ML models | `python` via Bash |
| **File I/O** | Read/Write/Edit files | Read, Write, Edit tools |

**Skill Reference**: `/knowledge-work:glean-connector` for enterprise knowledge queries.

### 3.7 Directory Structure

**Root**: `/Users/sidhant.panda/workspaces/root-workspace/swiggy-brain/scm/pocs/availability-prediction/`

```
availability-prediction/
├── .claude/
│   └── skills/
│       ├── evaluate/
│       │   ├── SKILL.md
│       │   └── scripts/
│       │       └── calculate_metrics.py
│       ├── reflect/
│       │   ├── SKILL.md
│       │   └── scripts/
│       │       └── cluster_errors.py
│       ├── predict/
│       │   ├── SKILL.md
│       │   └── scripts/
│       │       ├── fetch_inventory.sql
│       │       └── apply_patterns.py
│       └── context-graph-management/
│           └── SKILL.md          ← Storage & retrieval philosophy
│
├── brain/
│   ├── CLAUDE.md                 ← Auto-read by Claude Code
│   └── context-graph/
│       ├── patterns/
│       │   ├── by-category/      ← dairy.md, beverages.md, staples.md
│       │   ├── by-supplier/      ← chronic-delay-suppliers.md
│       │   ├── by-temporal/      ← friday.md, weekend.md, month-end.md
│       │   ├── by-signal/        ← low-doh.md, low-fill-rate.md
│       │   └── external/         ← ipl.md, weather.md
│       ├── signals.md            ← Signal importance rankings
│       └── failures.md           ← Deprecated patterns & lessons
│
├── logs/
│   ├── predictions/
│   │   └── YYYY-MM-DD.json       ← Daily prediction outputs
│   ├── evaluations/
│   │   └── YYYY-MM-DD.json       ← Daily evaluation metrics
│   └── reflections/
│       └── YYYY-MM-DD.md         ← Daily learnings & hypotheses
│
└── CLAUDE.md
```

### 3.8 Context Graph & Logs Format

#### Context Graph (Flexible—Agent Discovers)

**Patterns** (`brain/context-graph/patterns/by-{dimension}/*.md`): See [context-graph-management skill](#skill-context-graph-management) for format and storage rules.

**Signals** (`brain/context-graph/signals.md`): Ranked list of signals by predictive power. Updated by reflect skill.

**Failures** (`brain/context-graph/failures.md`): Deprecated patterns with original triggers, why it failed, and lesson learned.

#### Predictions Schema (Fixed)

`logs/predictions/YYYY-MM-DD.json`:
```json
{
  "date": "YYYY-MM-DD",
  "generated_at": "ISO timestamp",
  "predictions": [
    {
      "sku_id": "string",
      "wh_id": "string",
      "prediction": "OOS | IN_STOCK",
      "confidence": 0.0-1.0,
      "patterns_matched": ["pattern_id", ...],
      "signals": { "signal_name": value, ... },
      "reasoning": "string"
    }
  ]
}
```

#### Evaluations Schema (Fixed)

`logs/evaluations/YYYY-MM-DD.json`:
```json
{
  "date": "YYYY-MM-DD",
  "metrics": { "precision": 0.XX, "recall": 0.XX, "f1": 0.XX },
  "confusion": { "tp": N, "fp": N, "tn": N, "fn": N },
  "errors": [
    {
      "sku_id": "string",
      "wh_id": "string",
      "predicted": "OOS | IN_STOCK",
      "actual": "OOS | IN_STOCK",
      "patterns_used": ["pattern_id", ...],
      "signals_at_prediction": { ... }
    }
  ],
  "pattern_performance": {
    "pattern_id": { "tp": N, "fp": N, "fn": N, "f1": 0.XX }
  }
}
```

#### Reflections (Flexible—Agent Discovers)

`logs/reflections/YYYY-MM-DD.md`: Daily learnings—error clusters, pattern updates made, hypotheses for tomorrow. Format evolves as agent learns what's useful to capture.

---

## 4. POC Scope & Constraints

### 4.1 Scope

| Dimension | Scope | Rationale |
|-----------|-------|-----------|
| **City** | Bangalore only | Largest volume, best data quality |
| **Category** | FMCG only | Excludes FnV (perishable complexity), Electronics, etc. |
| **SKU tier** | Bradman FMCG Tier A | Top 20% of Bradman FMCG by Bradman score (~1,200 SKUs) |
| **Warehouse** | Top 1 by volume | Single highest-volume WH serving Bangalore. WH-led issues are 3× more common. |
| **Velocity** | ≥1 unit sold/day at WH | Ensures learning signal exists |
| **Active** | SKU enabled at WH | Skip de-listed or seasonal |
| **Prediction** | Binary OOS (availability < X%) | Simpler than regression, threshold TBD |
| **Horizon** | Tomorrow (T+1) | 24hr feedback loop |

**What is Bradman?** "Project Bradman 99.90" is a strategic supply chain initiative targeting **99.90% availability** for high-priority SKUs (named after Don Bradman's 99.94 batting average). Bradman SKUs are selected via weighted scoring (20% each): GSV, Units Sold, Impressions, Search HC Impressions, and I2C. Scope: ~19K+ SKUs across Bangalore.

**POC Tiering** (subset of Bradman FMCG):

| Tier | Criteria | Est. SKUs | POC Scope |
|------|----------|-----------|-----------|
| **Tier A** | Top 20% by Bradman score | ~1,200 | ✅ Phase 1 (WH×SKU) |
| **Tier B** | Next 30% by Bradman score | ~1,800 | Phase 2 |
| **Tier C** | Remaining 50% | ~3,000 | Phase 3 |

**Estimated daily scope**: ~1,200 SKUs × 1 WH × velocity filter → **~1,200 predictions/day**

> **Phase 2 Expansion**: After validating WH×SKU predictions, can expand to POD×SKU level (~1,200 SKUs × 20 PODs → ~2,000-4,000 predictions/day)

### 4.2 Success Metrics

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Self-Improvement (PRIMARY)** | Day 1 F1 | Positive slope | Final week F1 > First week F1 |
| **Prediction F1 (SECONDARY)** | 0.50 (random) | >0.70 | Average F1 over final week of simulation |
| **Pattern Discovery** | 0 (cold start) | 10+ validated | Patterns with F1 >0.70 |
| **Context Efficiency** | Day 1 tokens | -20% | Token usage reduction over 30 days |

> **Primary Metric: Self-Improvement Slope** — Validates the core hypothesis that prediction pressure drives learning. Success = positive F1 slope over simulation period.

> **Secondary Metric: F1** — Balances precision (avoid false alarms) and recall (catch stockouts). See [Section 3.1.2](#312-ground-truth--evaluation) for calculation details. Patterns validated at F1 >0.70, deprecated at <0.50.

#### Self-Improvement Slope (Key Exit Criterion)

We measure **improvement rate** to validate that the system learns over time:

```
Improvement % = (F1_final_week - F1_first_week) / F1_first_week × 100

Example: F1 improves from 0.55 (week 1) to 0.72 (week 4) → 31% improvement
```

**Visualization**: Plot daily F1 scores and fit a trend line. Success = positive slope.

```
F1
 │
0.8┤                                    ╭──●
   │                              ╭────●
0.7┤                        ╭────●
   │                  ╭────●
0.6┤            ╭────●
   │      ╭────●
0.5┤ ●───●
   │
   └────────────────────────────────────────► Day
     1    5    10   15   20   25   30
```

**Threshold (X): TBD** — Will determine target improvement % after analyzing Week 1 baseline. Considerations:
- Minimum viable: ≥10% improvement (system is learning)
- Strong signal: ≥25% improvement (clear value demonstrated)
- If flat or negative slope: hypothesis invalidated, pivot needed

### 4.3 External Events 

External events can be looked up by the agent using the web search tool.

| Event Type | Current Gap | POC Approach |
|------------|-------------|--------------|
| IPL Matches | 20.1% MAPE vs 17.5% | Web Search for schedule |
| Festivals | Timing variability | Web Search for dates |
| Weather | Only rain flag | Web Search for forecasts |
| City Events | Not captured | Web Search for local events |

### 4.4 Anti-Cheat Requirements

During historical simulation, all queries MUST be point-in-time filtered:
```sql
WHERE event_date <= '{simulation_date}'
AND updated_at <= '{simulation_date} 23:59:59'
```

No future data leakage. Claude Code enforces this constraint.

---

## 5. Execution Plan

This POC is built **by Claude Code, with human supervision**. Claude Code is both the builder AND the runtime system. Human provides direction; Claude implements, tests on historical data, and iterates. No waiting for "tomorrow"—historical simulation provides instant feedback.

**Build Loop:**
```
HUMAN: High-level instruction
    │
    ▼
CLAUDE CODE: Implement
    │
    ▼
CLAUDE CODE: Test on historical data (instant feedback)
    │
    ▼
PASS? ─── No ──→ CLAUDE CODE: Analyze error, fix, retry
    │
   Yes
    ▼
CLAUDE CODE: Commit to git
    │
    ▼
HUMAN: Review, approve, next instruction
```

### Calendar & Working Days

```
January 2026
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 12  │ 13  │ 14  │ 15  │ 16  │ 17  │ 18  │  ← WEEK 1: BUILD
│ D1  │ D2  │ D3  │ HOL │ D4  │ off │ off │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 19  │ 20  │ 21  │ 22  │ 23  │ 24  │ 25  │  ← WEEK 2: SIMULATION
│ D5  │ D6  │ D7  │ D8  │ D9  │ off │ off │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 26  │ 27  │ 28  │ 29  │ 30  │ 31  │     │  ← WEEK 3: LIVE + DEMO
│ HOL │ D10 │ D11 │ D12 │ D13 │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘

D# = Working Day    HOL = Holiday    off = Weekend
Holidays: Jan 15 (Thu) Pongal, Jan 26 (Mon) Republic Day
```

### Week 1: BUILD (Jan 12-16)

**Goal**: All skills built, full cycle working, ready for simulation.

> **4 working days** (Mon-Wed Jan 12-14, Fri Jan 16). Jan 15 Thu is Pongal holiday.

| Day | Date | Deliverable |
|-----|------|-------------|
| **1-2** | Mon-Tue, Jan 12-13 | Directory structure, Snowflake CLI, `evaluate` skill, baseline F1 |
| **3-4** | Wed+Fri, Jan 14+16 | `predict` + `reflect` skills, full cycle working, warm-up (Dec 20-22) |

**Week 1 Exit Criteria:**
- [ ] All skills complete (evaluate, predict, reflect, context-graph-management)
- [ ] Full cycle working (predict → evaluate → reflect)
- [ ] Test run on Dec 20 data successful
- [ ] Ready for simulation

### Week 2: SIMULATION (Jan 19-23)

**Goal**: Run complete 30-day historical simulation. Context graph warm with patterns, ready for live.

> **5 working days** (Mon-Fri). Run ~6 simulated days per real day.

| Day | Date | Deliverable |
|-----|------|-------------|
| **5** | Mon, Jan 19 | Simulation Days 1-6 (Dec 19-24, Christmas Eve) |
| **6** | Tue, Jan 20 | Simulation Days 7-12 (Dec 25-30, Christmas) |
| **7** | Wed, Jan 21 | Simulation Days 13-18 (Dec 31 - Jan 5, New Year) |
| **8** | Thu, Jan 22 | Simulation Days 19-24 (Jan 6-11, post-holiday) |
| **9** | Fri, Jan 23 | Simulation Days 25-30 (Jan 12-18, Pongal) + Human Review |

**Week 2 Exit Criteria (End of Day 9):**
- [ ] 30-day simulation complete (Dec 19 → Jan 18)
- [ ] **PRIMARY: Positive F1 slope** (Final week F1 > First week F1)
- [ ] **SECONDARY: F1 > 0.70** on final week average
- [ ] 10+ validated patterns discovered (F1 > 0.70)
- [ ] Context graph committed to main
- [ ] Human review sign-off: "Context graph approved for live"

### Week 3: LIVE + DEMO (Jan 27-30)

**Goal**: Live predictions on real data, stakeholder demo, scaling plan.

> **4 working days** (Tue-Fri). Jan 26 Mon is Republic Day holiday.

| Day | Date | Deliverable |
|-----|------|-------------|
| **10** | Tue, Jan 27 | First live prediction (predict Jan 28 using Jan 26 EOD data) |
| **11** | Wed, Jan 28 | First live evaluation + predict Jan 29 |
| **12** | Thu, Jan 29 | Documentation, external events analysis, demo prep |
| **13** | Fri, Jan 30 | Stakeholder demo delivered, scaling plan documented |

**POC Exit Criteria:**
- [ ] **PRIMARY: Self-improvement validated** (positive F1 slope in simulation)
- [ ] Live F1 > 0.75
- [ ] 3+ days of live predictions
- [ ] External events validated
- [ ] Stakeholder demo delivered
- [ ] Scaling plan documented

### Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Data quality issues | Start with Bradman SKUs; validate freshness |
| Sparse signal at SKU level | Aggregate to POD×Category if needed |
| Pattern overfitting | Min 10 observations before adding pattern |
| Context graph bloat | Aggressive compression; decay old patterns |
| Simulation vs reality gap | Run parallel live predictions after validation |

---

## Appendix A: Data Tables

### Core Inventory & Availability

| Signal | Table | POC Relevance |
|--------|-------|---------------|
| Inventory State | `dash-scm-inventory-availability` | ✅ Core — DynamoDB (~231M items), real-time sellable qty. Primary signal for current stock levels. |
| Inventory Detail | `dash-scm-inventory-location` | ✅ Signal — batch/location/expiry tracking via ILS. Use for DOH calculation and FEFO analysis. |
| Inventory Planning | `dash-scm-inventory-planning` | 📋 Reference — transaction planning, idempotency. Less relevant for prediction. |
| Control Room Rules | `scm-control-room-rules` | ✅ Signal — ~404K rules for OOS overrides, holiday slots. Critical for Branch 6 (config-led) detection. |
| Availability RCA | `analytics.public.sku_wise_availability_rca_with_reasons_v7` | ✅ Core — **Ground truth for evaluation**. Waterfall attribution to 28 reason codes. Use for reflect skill. |
| Weighted Availability | `analytics.public.weighted_availability_daily_update` | ✅ Core — **Impression-weighted availability** for OOS definition. Primary metric for prediction target. |
| Reason Mapping | `analytics.public.final_reason_mapping_avail_rca` | ✅ Core — Maps `final_reason` → `bin`, `ai_owner`, `notes`, `rnk`. Critical for RCA aggregation. |
| RCA Aggregates | `analytics.public.im_availability_rca_overall_part_1*` | ✅ Signal — Pre-aggregated RCA by city, category, band. Quick dashboards for pattern validation. |

### Forecasting & Orders

| Signal | Table | POC Relevance |
|--------|-------|---------------|
| TFT Forecast | `data_science.ds_storefront.im_pod_hr_demand_forecasting` | ✅ Signal — Pod-hour demand forecast (MAPE ~18.6%). Compare forecast vs actual for Branch 1 (forecasting-led). |
| Historical Orders | `analytics.public.im_parent_order_fact` | ✅ Signal — demand velocity, order patterns. Calculate run rates for DOH signals. |
| Pod Availability | `analytics.public.pr_hr_level_avl` | ✅ Core — hourly availability by POD. Aggregates to daily availability for ground truth. |
| Demand Timeseries | `data_science.im_b2b_demand_forecast_fnv_timeseries_data` | ✅ Signal — Demand attribution pipeline output. Joins sales, search, availability at SKU level. |
| Store Master | `prod.swiggykms.stores` | 📋 Reference — POD metadata (tier, location, last-mile threshold). |

### Procurement & PO

| Signal | Table | POC Relevance |
|--------|-------|---------------|
| PO Status | `scm-procurement-po` | ✅ Signal — PO lifecycle (DRAFT→CONFIRMED→CLOSED). Detect stuck/expired POs for Branch 2 (PO-led). |
| PO Details | `scm-procurement-po-details` | ✅ Signal — line-item quantities, fill rates. Key for measuring PO execution. |
| Booking Slots | `analytics_adhoc.booking_portal_bookings` | ✅ Signal — warehouse appointment scheduling. Delays here → Branch 4 (warehouse ops-led). |
| PO Automation | `analytics_adhoc.po_automation_metrics` | 📋 Reference — ~45% automation coverage. Context for manual vs auto PO patterns. |

### Supplier Performance

| Signal | Table | POC Relevance |
|--------|-------|---------------|
| Supplier PO Metrics | `analytics_prod.im_vendor_portal_po_module` | ✅ Signal — OTIF, UFR, LFR, lead times. Primary data for Branch 3 (supply-led). |
| Supplier Scoring | `supplier_performance_metrics` (ES) | ✅ Signal — real-time composite scores (0.4×OTIF + 0.3×UFR + 0.2×LTA + 0.1×Quality). |
| Vendor Inventory | `analytics_prod.im_vendor_portal_inventory_module` | ✅ Signal — upstream stock visibility. Early warning for supply constraints. |
| Supplier Master | `dash_scm_supplier_master` | 📋 Reference — supplier metadata, contact, tiers. |

### POD Operations

| Signal | Table | POC Relevance |
|--------|-------|---------------|
| Rack Management | `dash-scm-rack-management-v2` | 📋 Reference — POD capacity, bin locations. Context for Branch 5 (dark store-led). |
| Contract/Tiering | `contract-master` | ✅ Signal — SKU tiering, Bradman membership, assortment. **Critical for POC scope filtering.** |

### Warehouse CDC (Vinculum)

| Signal | Table | POC Relevance |
|--------|-------|---------------|
| GRN/Inbound | `vinculum.swiggy_gamma.inbound` / `inbounddetail` | ✅ Signal — GRN timestamps, received qty vs PO qty. Detect inwarding delays for Branch 4. |
| PO Lifecycle | `vinculum.swiggy_gamma.po` / `podetail` | ✅ Signal — PO status in WMS. Cross-check with MIM for sync issues. |
| Inventory Balance | `vinculum.swiggy_gamma.invbal` | ✅ Signal — warehouse SOH (stock on hand). Source for WH-level DOH calculation. |
| Dispatch | `vinculum.swiggy_gamma.dispatch` / `delmanifest` | ✅ Signal — dispatch to POD timing. Detect movement delays for Branch 4. |

**Note**: Vinculum CDC tables sync via AWS DMS with 15-120 min lag. Use for historical patterns, not real-time signals.

---

## Appendix B: DS Pipelines Reference

| Pipeline | Purpose | Output Table | POC Relevance |
|----------|---------|--------------|---------------|
| **TFT Demand Forecasting** | 10-stage pipeline predicting pod-hour demand using Temporal Fusion Transformer | `data_science.ds_storefront.im_pod_hr_demand_forecasting` | ✅ Signal — Compare forecast vs actual sales. Gap indicates Branch 1 (forecasting-led) issues. MAPE ~18.6% normal, 20.1% during IPL. |
| **Demand Attribution** | Traces sessions → search → impressions → orders → SKU sales. 9 intermediate tables. | `data_science.im_b2b_demand_forecast_fnv_timeseries_data` | ✅ Signal — Joins sales, search volume, availability at SKU level. Use for demand velocity signals. |
| **Weighted Availability** | Calculates impression-weighted availability per SKU×POD×day | `analytics.public.weighted_availability_daily_update` | ✅ Core — **Primary metric for OOS definition**. Weights by customer sessions, not clock time. |
| **Availability Attribution** | Waterfall logic attributing OOS to 7 deterministic branches | `analytics.public.sku_wise_availability_rca_with_reasons_v7` | ✅ Core — **Ground truth for RCA**. Use in reflect skill to understand why prediction was wrong. |
| **FnV Movement Planning** | 3-stage PuLP optimization for perishable inventory movement | `movement-planning` tables | ❌ Out of scope — FnV excluded from POC |

**Key Parameters**:
- TFT: Lookback 7-14 days, Prediction 1-14 days, Quantiles [0.4, 0.5, 0.6, 0.7, 0.8]
- TFT MAPE: 18.6% (normal), 20.1% (IPL) ← opportunity for external event signals
- Low-volume PODs (OPD<500) have **4.6x worse forecast accuracy** (22% vs 4.8% WAPE)

---

## Appendix C: Availability Reason Codes

The waterfall assigns each SKU×POD to exactly one `final_reason`. Reasons are prioritized in order (first match wins). Understanding these codes is critical for the POC's reflect skill to learn meaningful patterns.

### RCA Taxonomy Overview

![Store Availability RCA Taxonomy](./images/store-availability-rca-taxonomy.png)

**Figure: Store Availability Issue Tree** — Two main branches: WH-led (~12.8% of miss) and POD-led (~4.7% of miss).

<details>
<summary>Taxonomy Text Reference (click to expand)</summary>

```
STORE AVAILABILITY
│
├─ A. WH-led Availability Miss (~12.8%)
│   │
│   ├─ A1. Supplier & Inbound Constraints
│   │   ├─ A1.1 Vendor Fill Rate & LT Supply Issues
│   │   └─ A1.2 MOQ / MOV / Case Size / Contract / OTIF
│   │
│   ├─ A2. WH-side Planning & Forecasting
│   │   ├─ A2.1 Under-biased Forecasts (even with good fill rate)
│   │   └─ A2.2 Demand Shocks (price / visibility / events / tiering)
│   │
│   ├─ A3. Warehouse Throughput & Capacity
│   │   ├─ A3.1 Low Outbound Fill Rate & Backlog
│   │   ├─ A3.2 WH Capacity / Space Constraints
│   │   ├─ A3.3 Putaway / Backlog Delays ('physically present but unavailable')
│   │   └─ A3.4 Productivity-driven De-prioritisation of bulky / tail SKUs
│   │
│   └─ A4. Inventory Hygiene & Systems (WH)
│       ├─ A4.1 ERP Disabled / Movement Blocking
│       ├─ A4.2 Phantom Inventory & Quality / Expiry Holds
│       └─ A4.3 Reason / Ownership Gaps ('Others / Unallocated')
│
└─ B. POD-led Availability Miss (~4.7%)
    │
    ├─ B1. POD Ops Throughput & Capacity
    │   ├─ B1.1 POD Missed Qty & OPD > Inbound
    │   ├─ B1.2 Inwarding Delays vs Morning Peak
    │   ├─ B1.3 POD Space Constraints (incl. freezer / chiller)
    │   └─ B1.4 Pod Closure / Unserviceability & Spillover
    │
    ├─ B2. POD-level Planning & Demand Dynamics
    │   ├─ B2.1 Forecast Error at POD Granularity
    │   └─ B2.2 Cannibalisation / Substitution Misses
    │
    ├─ B3. Replenishment Logic & Movement Design
    │   ├─ B3.1 Null / Mis-estimated POD×SKU Run Rates
    │   ├─ B3.2 Finite Capacity Rounding (low-RR SKUs)
    │   ├─ B3.3 Movement Setting Design Issues (caps, min/max)
    │   └─ B3.4 ERP / Movement Blocks at POD
    │
    └─ B4. Inventory Hygiene & Freshness (POD)
        ├─ B4.1 FIFO Misses & Fresh Wastage
        └─ B4.2 Quality / Expiry Holds
```

</details>

### Mapping: Taxonomy → Waterfall Codes

| Taxonomy Code | Description | Waterfall Code(s) |
|---------------|-------------|-------------------|
| **A1** | Supplier & Inbound | `oos_8`, `oos_9` |
| **A2** | WH Planning/Forecasting | `oos_10` |
| **A3** | WH Throughput/Capacity | `instock_9`, `instock_10`, `instock_12`, `instock_15` |
| **A4** | WH Inventory Hygiene | `oos_2`, `oos_3`, `oos_4`, `instock_17` |
| **B1** | POD Ops/Capacity | `instock_8`, `instock_11`, `instock_14` |
| **B2** | POD Planning/Demand | `instock_13` |
| **B3** | Movement Design | `oos_6`, `oos_7`, `instock_6`, `instock_7`, `instock_16` |
| **B4** | POD Inventory Hygiene | `instock_0-5` (config codes) |

### When Warehouse Stock = OOS (upstream supply problem)

These codes indicate the warehouse itself doesn't have stock. The problem is "upstream" of POD operations.

| Code | Reason | What It Means | POC Relevance |
|------|--------|---------------|---------------|
| `oos_0` | `pod_inactive` | POD is disabled in system | ❌ Skip — not a prediction target (POD not serving) |
| `oos_1` | `disabled_pod` | Movement to this POD is blocked | ❌ Skip — config issue, not predictable demand/supply gap |
| `oos_2` | `Not in ERP` | SKU missing from ERP master | ❌ Skip — data hygiene issue, not inventory problem |
| `oos_3` | `temp_disable` | SKU temporarily disabled (quality hold, recall) | ⚠️ Low — could predict if we track disable patterns |
| `oos_4` | `Order Blocking List` | SKU blocked from ordering | ❌ Skip — explicit business decision |
| `oos_5` | `Fresh_Items` | FnV/perishables special handling | ❌ Skip — FnV out of POC scope |
| `oos_6` | `movement_rr_not_generated` | No run-rate calculated → no movement planned | ✅ Signal — indicates new SKU or planning gap |
| `oos_7` | `movement_rr_blocked` | Run-rate set to 0.001 (blocked) | ⚠️ Low — explicit block, not predictable |
| `oos_8` | `Long Term Supply Issue` | Supplier hasn't delivered for extended period | ✅ Core — supplier reliability pattern, highly predictable |
| `oos_9` | `fillrate Issue` | Supplier delivered <80% of PO qty | ✅ Core — supplier fill rate pattern, key signal |
| `oos_10` | `Planning Ordering Issue` | No other reason → default to planning gap | ✅ Core — catch-all for PO/planning failures |

### When Warehouse Stock = Instock (movement/POD problem)

These codes indicate warehouse has stock but POD doesn't. The problem is in movement or POD operations.

| Code | Reason | What It Means | POC Relevance |
|------|--------|---------------|---------------|
| `instock_0` | `pod_inactive` | POD is disabled | ❌ Skip — not serving |
| `instock_1` | `Not in ERP` | SKU missing from ERP at POD level | ❌ Skip — data issue |
| `instock_2` | `movement_blocked_list` | Movement explicitly blocked for this POD | ❌ Skip — config decision |
| `instock_3` | `temp diable` | Temporarily disabled at POD | ⚠️ Low — could predict disable patterns |
| `instock_4` | `Order Blocking List` | Blocked from ordering at POD | ❌ Skip — explicit block |
| `instock_5` | `Fresh_Items` | FnV handling | ❌ Skip — out of scope |
| `instock_6` | `movement_rr_not_generated` | No run-rate at POD level | ✅ Signal — new SKU-POD mapping or gap |
| `instock_7` | `movement_rr_blocked` | Run-rate blocked at POD | ⚠️ Low — explicit block |
| `instock_8` | `POD Cap Missed` | POD capacity full, couldn't receive | ✅ Core — capacity constraint pattern, predictable |
| `instock_9` | `WH Cap Missed` | Warehouse dispatch capacity exceeded | ✅ Core — warehouse throughput pattern |
| `instock_10` | `WH_Cap_Movement_Reduced` | Movement reduced due to WH constraints | ✅ Signal — partial fulfillment pattern |
| `instock_11` | `pod_Space Issue_cold` | Cold storage at POD full | ✅ Core — cold chain constraint, seasonal pattern |
| `instock_12` | `wh_ob_Fillrate Issue` | Warehouse outbound fill rate <80% | ✅ Core — warehouse execution pattern |
| `instock_13` | `Forecasting_error` | Actual sales >3× forecast run-rate | ✅ Core — **demand spike pattern**, highly valuable |
| `instock_14` | `Putway_delay` | Inwarding to shelf delayed at POD | ✅ Signal — POD operations pattern |
| `instock_15` | `wh_putaway_delay` | Free DOH <3 days (stock stuck in staging) | ✅ Signal — warehouse operations pattern |
| `instock_16` | `Movement Design issue` | Movement plan design gap | ✅ Signal — planning algorithm gap |
| `instock_17` | `Others` | Catch-all for unexplained gaps | ⚠️ Low — noisy, needs deeper investigation |

### POC Priority Summary

| Priority | Codes | Count | Pattern Type |
|----------|-------|-------|--------------|
| ✅ **Core** | oos_8, oos_9, oos_10, instock_8, instock_9, instock_11, instock_12, instock_13 | 8 | Supplier, capacity, forecasting — highest signal |
| ✅ **Signal** | oos_6, instock_6, instock_10, instock_14, instock_15, instock_16 | 6 | Operations patterns — secondary signals |
| ⚠️ **Low** | oos_3, oos_7, instock_3, instock_7, instock_17 | 5 | Explicit blocks or noisy catch-alls |
| ❌ **Skip** | oos_0-2, oos_4-5, instock_0-2, instock_4-5 | 10 | Config/data issues, not predictable |

**Source**: `availability_attribution_waterfall.sql` → `analytics.public.sku_wise_availability_rca_with_reasons_v7`

**Reason Mapping Table**: `analytics.public.final_reason_mapping_avail_rca`
```sql
SELECT final_reason, bin, ai_owner, notes, rnk
FROM analytics.public.final_reason_mapping_avail_rca
```

---

## Appendix D: Quick Reference

**Daily Commands:**
```bash
# Morning cycle (run in order)
cd /Users/sidhant.panda/workspaces/root-workspace/swiggy-brain/scm/pocs/availability-prediction
git pull origin main
# Then invoke: evaluate → reflect → predict
git add . && git commit -m "Daily cycle $(date +%Y-%m-%d)" && git push
```

**Debugging:**
```bash
# Check pattern performance
grep -r "F1:" brain/context-graph/patterns/

# View yesterday's errors
cat logs/evaluations/$(date -d "yesterday" +%Y-%m-%d).json | jq '.errors | length'

# Find deprecated patterns
cat brain/context-graph/failures.md

# Check F1 trend over last 7 days
for f in logs/evaluations/*.json; do echo -n "$f: "; jq '.metrics.f1' "$f"; done | tail -7
```

**Key Thresholds:**
| Parameter | Value |
|-----------|-------|
| OOS definition | Availability < X% (TBD) |
| Pattern minimum observations | 10 |
| Pattern deprecation threshold | F1 <0.50 |
| Auto-deprecate trigger | F1 <0.40 for 3 consecutive days |
| Outer loop trigger | Same error type 5+ times |
| Rollback trigger | F1 drops >15% |

---

## References

- [Prediction-Driven Context Graphs Concept](./prediction-driven-context-graphs.md)
- [Supply Chain Brain PRFAQ](./supply-chain-PRFAQ.md)
- [Swiggy Brain PRFAQ](https://docs.google.com/document/d/1de_Es5JyVlh2AJ6_ZSfXt_EuReaJYSo52dyPmaYJOzo)
- SCM Research: `scm-research/*.md`
