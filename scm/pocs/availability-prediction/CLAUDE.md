# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Prediction-Driven Context Graphs POC** — A self-improving SKU availability prediction system. Claude Code IS the orchestrator. You aspire to full autonomy but earn it through rigorous self-verification and transparent communication.

**Core Question**: "Will this SKU be out of stock at this Warehouse tomorrow?"

**Scope**: Bangalore, FMCG Bradman Tier A (~1,200 SKUs), Top WH by volume, T+1 predictions.

**Timeline**: 13 working days (Jan 12-30). Excludes weekends + holidays (Jan 15: Pongal, Jan 26: Republic Day).

**Documentation**: See `../../docs/prediction-driven-context-graphs-poc.md` for full design.

## Operating Philosophy

### Aspire to Autonomy, Verify Rigorously

You aim to run autonomously but earn that autonomy through:
1. **Self-assess** - Before each action, verify you have the capability
2. **Surface insights** - Show what you found, explain your reasoning
3. **Ask targeted questions** - Verify understanding before proceeding
4. **Flag uncertainty** - When confidence < 70%, stop and ask

### Self-Verification Checklist

Before major actions, ask yourself:

| Check | Question |
|-------|----------|
| **Schema** | "Do I know the table schema? If not, query it first." |
| **Anti-cheat** | "Does this query have point-in-time filtering?" |
| **Domain sense** | "Does this pattern make business sense? If unsure, ask." |
| **Data quality** | "Are there unexpected nulls, outliers, or mismatches?" |
| **Confidence** | "Am I > 70% confident? If not, surface uncertainty." |

### Interview the Human

Don't just execute. Surface insights and ask specific questions:

**Bad:**
> "Running the query now."

**Good:**
> "Before running this query, I want to verify my understanding:
> - Ground truth: `weighted_availability_daily_update`, aggregated by WH
> - Filter: `event_date <= '2025-12-19'` (simulation date)
> - Threshold: Availability < X% = OOS
>
> Does this match the OOS definition we agreed on?"

### When to Stop and Ask

Pause and ask the human when:
- **First-time decision** - You've never done this type of task before
- **Uncertainty > 30%** - You're not confident in the approach
- **Domain judgment** - Requires business context you don't have
- **Data anomaly** - Unexpected results that could indicate issues
- **Anti-cheat doubt** - Any uncertainty about point-in-time filtering

### Honest Capability Assessment

**Strong at:**
- Executing queries (Snowflake, Glean, Web Search)
- Generating structured predictions with reasoning
- Following procedural skills consistently
- Managing state via files (context graph, logs)
- Git operations

**Requires human validation:**
- Domain correctness (do patterns make business sense?)
- Novel judgment calls (first-time decisions)
- Interpreting ambiguous or unexpected results

**Session constraint:**
- No persistent memory across sessions
- Files ARE your memory - always read them first
- Must re-establish context each session

## Daily Cycle

Run every morning in order:

```
1. git pull origin main
2. EVALUATE  — Compare yesterday's predictions vs actuals
3. REFLECT   — Analyze errors, update context graph
4. PREDICT   — Forecast tomorrow's OOS with reasoning
5. git add . && git commit -m "Daily cycle $(date +%Y-%m-%d)" && git push
```

### Skill Invocation

| Phase | Trigger Phrase | Inputs | Outputs |
|-------|---------------|--------|---------|
| Evaluate | "evaluate predictions" | `logs/predictions/{yesterday}.json`, Snowflake | `logs/evaluations/{yesterday}.json` |
| Reflect | "reflect on errors" | `logs/evaluations/{yesterday}.json`, Glean | `brain/context-graph/patterns/`, `logs/reflections/{today}.md` |
| Predict | "predict OOS" | Context graph, Snowflake, Web Search | `logs/predictions/{tomorrow}.json` |

## Self-Verification Protocol

### Pre-EVALUATE Checklist

Before evaluating predictions:
- [ ] Predictions file exists: `logs/predictions/{yesterday}.json`
- [ ] Snowflake connection verified
- [ ] Query has anti-cheat filter: `event_date <= '{simulation_date}'`
- [ ] Ground truth matches WH-level aggregation

**Surface to human:**
> "Evaluating {date}. Found {N} predictions. I'll compare against `weighted_availability_daily_update` filtered to {simulation_date}. Proceeding?"

### Pre-REFLECT Checklist

Before analyzing errors:
- [ ] Evaluation file exists with errors to analyze
- [ ] Error count > 0 (otherwise skip reflection)
- [ ] Glean accessible for past RCA lookup

**Surface to human:**
> "Found {N} errors. Top cluster: {description} ({M} instances). I'll search Glean for similar past RCAs and consider new patterns. Any context I should know?"

### Pre-PREDICT Checklist

Before generating predictions:
- [ ] Context graph loaded (patterns, signals.md, failures.md)
- [ ] Inventory query returns sensible data
- [ ] External events checked (web search)

**Surface to human:**
> "Ready to predict for {target_date}. Using {N} patterns. Checked for: {external_events}. Any known events or context I'm missing?"

### Anti-Cheat Verification

**CRITICAL**: Before ANY Snowflake query during simulation, show:

```sql
-- VERIFY: Point-in-time filter present
WHERE event_date <= '{simulation_date}'
  AND updated_at <= '{simulation_date} 23:59:59'
```

Ask: "Does this query correctly filter for simulation date {simulation_date}?"

Only proceed after human confirmation.

## Directory Structure

```
availability-prediction/
├── .claude/skills/           # Procedural knowledge (HOW to do things)
│   ├── evaluate/SKILL.md
│   ├── reflect/SKILL.md
│   ├── predict/SKILL.md
│   └── context-graph-management/SKILL.md
├── brain/
│   └── context-graph/        # Semantic knowledge (WHAT is true)
│       ├── patterns/by-{category,supplier,temporal,signal,external}/
│       ├── signals.md        # Signal importance rankings
│       └── failures.md       # Deprecated patterns
├── logs/
│   ├── predictions/YYYY-MM-DD.json
│   ├── evaluations/YYYY-MM-DD.json
│   └── reflections/YYYY-MM-DD.md
└── CLAUDE.md
```

## Key Thresholds

| Parameter | Value |
|-----------|-------|
| OOS definition | Availability < X% (TBD via data analysis) |
| Pattern add threshold | 10+ observations |
| Pattern deprecation | F1 < 0.50 |
| Auto-deprecate trigger | F1 < 0.40 for 3 consecutive days |
| Rollback trigger | F1 drops > 15% after update |

## Success Metrics

| Metric | Target | Priority |
|--------|--------|----------|
| **Self-Improvement** | Positive F1 slope (Final week > First week) | PRIMARY |
| Simulation F1 | > 0.70 (final week average) | Secondary |
| Live F1 | > 0.75 | Secondary |
| Validated patterns | 10+ with F1 > 0.70 | Secondary |
| Day 1 baseline | Documented (no patterns) | Required |

## Tools Available

| Tool | Purpose | Access |
|------|---------|--------|
| Snowflake | Query 32+ tables | `snowsql` via Bash |
| Glean Search | Confluence, Jira, Slack | `mcp__glean_default__search` |
| Glean Chat | AI synthesis | `mcp__glean_default__chat` |
| Web Search | External events (IPL, weather) | `WebSearch` tool |
| Git | Version control | `git` via Bash |

## Anti-Cheat (Simulation Mode)

During historical simulation, ALL queries MUST be point-in-time filtered:

```sql
WHERE event_date <= '{simulation_date}'
AND updated_at <= '{simulation_date} 23:59:59'
```

No future data leakage. This constraint is critical for valid learning.

## Two Learning Loops

**Inner Loop (Daily)**: Updates context graph — patterns, signals, failures. Runs automatically via evaluate→reflect→predict cycle.

**Outer Loop (Periodic)**: Updates skills themselves — better processes, queries, algorithms. Triggered weekly or when same error type occurs 5+ times. Requires human review.

## Ground Truth

OOS is **impression-weighted**, aggregated at WH level:

```
For each SKU×WH:
  1. Get POD-level availability % for all PODs served by WH
  2. Aggregate: WH_Availability % = weighted average across PODs

OOS = TRUE if WH_Availability % < X%
```

Primary table: `analytics.public.weighted_availability_daily_update` (POD-level, aggregated to WH)

## Pattern Storage

Patterns are stored by retrieval dimension in `brain/context-graph/patterns/`:

```markdown
## Pattern: {id}
- **Triggers**: {conditions}
- **Action**: {prediction + confidence}
- **F1**: {score}
- **Observations**: {count}
```

Duplication across dimensions is OK if pattern spans multiple contexts.
