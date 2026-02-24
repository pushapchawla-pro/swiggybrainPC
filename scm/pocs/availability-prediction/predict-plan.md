# Plan: OOS Prediction Agent - Predict Skill Design (v4 - Validated)

## Executive Summary

Design a **token-efficient predict skill** where:
- **Scripts do 95% of the work**: Query data, calculate DOH, apply rules, generate predictions
- **Claude Code does 5%**: Review flagged cases, apply reasoning-based overrides

### Key Design Decisions

| Decision | Choice |
|----------|--------|
| **Granularity** | SKU × POD (single POD) |
| **OOS Threshold** | X (TBD from data) |
| **Cold Start** | Hybrid (DOH + RCA priors as rules in script) |
| **External Events** | Full per-category (Claude reviews) |

---

## 1. The Token-Efficient Architecture

### 1.1 Why This Architecture?

**Problem with v2**: Claude Code writing ~1,200 prediction JSONs = massive token consumption.

**Solution**: Scripts generate ALL predictions. Claude Code only intervenes when:
- Signals conflict and need judgment
- External events need interpretation
- High-uncertainty cases need reasoning
- Patterns are ambiguous

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      TOKEN-EFFICIENT PREDICTION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 1: DETERMINISTIC (Script does 95%)                                │    │
│  │                                                                         │    │
│  │  1. Query Snowflake → Get all signals for ~1,200 SKUs                   │    │
│  │  2. Calculate DOH, base_risk for each SKU                               │    │
│  │  3. Apply rule-based patterns (DOH < 1, WH OOS, etc.)                   │    │
│  │  4. Generate predictions with confidence scores                         │    │
│  │  5. Flag uncertain cases for Claude review                              │    │
│  │  6. Write predictions.json (script output)                              │    │
│  │                                                                         │    │
│  │  TOKEN COST: ~0 (it's Python/SQL)                                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                          │
│                                      ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ PHASE 2: LLM REVIEW (Claude does 5%)                                    │    │
│  │                                                                         │    │
│  │  1. Read predictions.json (script output)                               │    │
│  │  2. Read flagged_for_review.json (~50-100 uncertain cases)              │    │
│  │  3. Check external events (WebSearch for IPL, weather, festivals)       │    │
│  │  4. Check Glean for active incidents                                    │    │
│  │  5. Apply reasoning-based overrides where needed                        │    │
│  │  6. Write overrides.json (only changed predictions)                     │    │
│  │  7. Merge: final_predictions.json = predictions + overrides             │    │
│  │                                                                         │    │
│  │  TOKEN COST: ~5-10% of v2 (only reviewing edge cases)                   │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 What Gets Flagged for Claude Review?

The script flags predictions for Claude review when:

| Flag Condition | Rationale |
|----------------|-----------|
| `confidence < 0.6` | Uncertain - needs judgment |
| `conflicting_patterns = True` | Multiple patterns suggest different outcomes |
| `base_risk BETWEEN 0.4 AND 0.6` | Borderline - could go either way |
| `category IN ('beverages', 'snacks', 'ice_cream')` | Event-sensitive categories |
| `is_weekend OR is_festival_eve` | Temporal patterns need interpretation |
| `wh_doh < 3.0 AND base_risk < 0.3` | Upstream risk not reflected in base calc (WH critically low) |

---

## 2. Detailed Execution Flow

### 2.1 What Happens When Human Says "Run Predict"

```
HUMAN: "Run predict for tomorrow"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ CLAUDE CODE reads .claude/skills/predict/SKILL.md                               │
│                                                                                 │
│ SKILL.md tells Claude:                                                          │
│   "1. Run the prediction script"                                                │
│   "2. Review flagged cases"                                                     │
│   "3. Check external events"                                                    │
│   "4. Apply overrides if needed"                                                │
│   "5. Merge and save final predictions"                                         │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: RUN PREDICTION SCRIPT (Deterministic)                                   │
│                                                                                 │
│ Claude Code runs:                                                               │
│   Bash: python scripts/predict.py --date 2026-01-16 --pod POD_BLR_001           │
│                                                                                 │
│ Script internally does:                                                         │
│   a. Query Snowflake for all signals                                            │
│   b. Calculate DOH, run_rate, base_risk for each SKU                            │
│   c. Load patterns from context-graph/patterns/*.json (rule format)             │
│   d. Apply pattern rules (if trigger matches → add risk_weight)                 │
│   e. Generate prediction (OOS if combined_risk > 0.5)                           │
│   f. Flag uncertain cases                                                       │
│   g. Write outputs:                                                             │
│      - logs/predictions/2026-01-16/base_predictions.json (~1,200 SKUs)          │
│      - logs/predictions/2026-01-16/flagged_for_review.json (~50-100 SKUs)       │
│      - logs/predictions/2026-01-16/summary.json (stats)                         │
│                                                                                 │
│ Claude receives: "Script completed. 1,187 predictions. 67 flagged for review."  │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: CHECK EXTERNAL EVENTS (Claude Reasoning)                                │
│                                                                                 │
│ Claude Code runs:                                                               │
│   WebSearch: "IPL match January 16 2026 Bangalore"                              │
│   WebSearch: "Bangalore weather January 16 2026"                                │
│   WebSearch: "Indian festivals January 16 2026"                                 │
│   Glean: "Instamart supply chain incidents"                                     │
│                                                                                 │
│ Claude REASONS:                                                                 │
│   "Found: IPL match RCB vs CSK at 7:30 PM                                       │
│    Impact: Beverages, snacks, ice cream demand +30-50%                          │
│    Action: Flag beverages/snacks SKUs for potential override"                   │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: REVIEW FLAGGED CASES (Claude Reasoning)                                 │
│                                                                                 │
│ Claude Code reads flagged_for_review.json and REASONS about each:               │
│                                                                                 │
│ Example case:                                                                   │
│   SKU: Coca-Cola 500ml                                                          │
│   Script prediction: IN_STOCK (combined_risk: 0.48)                             │
│   Flagged because: confidence < 0.6, category = beverages                       │
│   Signals: DOH = 2.1, base_risk = 0.30, no patterns matched                     │
│                                                                                 │
│ Claude REASONS:                                                                 │
│   "IPL match tonight. Beverages demand typically +40%.                          │
│    Effective DOH after spike: 2.1 / 1.4 = 1.5 days                              │
│    This is below MinDOH (3.0) for Top 50 item.                                  │
│    OVERRIDE: Change to OOS, confidence 0.75                                     │
│    Reasoning: IPL demand spike will deplete stock"                              │
│                                                                                 │
│ Claude writes override to overrides.json                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: MERGE AND SAVE (Deterministic or Claude)                                │
│                                                                                 │
│ Claude Code runs:                                                               │
│   Bash: python scripts/merge_predictions.py --date 2026-01-16                   │
│                                                                                 │
│ OR Claude writes directly:                                                      │
│   - Read base_predictions.json                                                  │
│   - Apply overrides.json                                                        │
│   - Write final_predictions.json                                                │
│                                                                                 │
│ Final output: logs/predictions/2026-01-16/final_predictions.json                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. File Structure & Separation of Concerns

### 3.1 Directory Structure

```
availability-prediction/
│
├── .claude/
│   └── skills/
│       └── predict/
│           ├── SKILL.md              ← Procedural: WHAT Claude does
│           └── scripts/
│               ├── predict.py        ← Main prediction script
│               ├── merge_predictions.py
│               ├── queries/
│               │   ├── fetch_signals.sql
│               │   └── fetch_scope.sql
│               └── config/
│                   ├── thresholds.yaml   ← MinDOH, MaxDOH by item class
│                   └── flag_rules.yaml   ← When to flag for review
│
├── brain/
│   └── context-graph/
│       ├── patterns/                 ← Semantic: WHAT is true
│       │   ├── rules.json            ← Machine-readable patterns for script
│       │   ├── by-category/          ← Human-readable patterns for Claude
│       │   │   └── dairy.md
│       │   └── by-supplier/
│       │       └── chronic-delays.md
│       ├── signals.md                ← Signal importance rankings
│       └── failures.md               ← Deprecated patterns
│
├── logs/
│   └── predictions/
│       └── YYYY-MM-DD/
│           ├── base_predictions.json     ← Script output (all SKUs)
│           ├── flagged_for_review.json   ← Script flags these
│           ├── overrides.json            ← Claude's changes
│           ├── final_predictions.json    ← Merged final output
│           └── summary.json              ← Stats for the day
│
└── CLAUDE.md
```

### 3.2 Dual-Format Patterns (Machine + Human Readable)

**For Script (rules.json)**:
```json
{
  "patterns": [
    {
      "id": "LOW_DOH_CRITICAL",
      "trigger": "effective_doh < 1.0",
      "risk_weight": 0.40,
      "source": "inventory_physics"
    },
    {
      "id": "WH_OOS_UPSTREAM",
      "trigger": "wh_doh < 3.0",
      "risk_weight": 0.30,
      "source": "rca_branch_a"
    },
    {
      "id": "SUPPLIER_FILL_RATE_LOW",
      "trigger": "supplier_fill_rate < 0.80 AND has_pending_po = True",
      "risk_weight": 0.25,
      "source": "rca_branch_3"
    },
    {
      "id": "NO_MOVEMENT_RR",
      "trigger": "movement_rr IS NULL OR movement_rr = 0.001",
      "risk_weight": 0.50,
      "source": "rca_branch_6"
    },
    {
      "id": "DEMAND_SPIKE",
      "trigger": "yesterday_sales > run_rate * 2.0",
      "risk_weight": 0.20,
      "source": "rca_branch_1"
    },
    {
      "id": "DAIRY_LOW_DOH",
      "trigger": "category = 'dairy' AND effective_doh < 1.5",
      "risk_weight": 0.25,
      "source": "learned"
    },
    {
      "id": "OTIF_ISSUE",
      "trigger": "otif_issue = 1 OR (has_pending_po = True AND pending_po_days > lead_time + 3)",
      "risk_weight": 0.35,
      "source": "rca_branch_3"
    },
    {
      "id": "WH_PUTAWAY_DELAY",
      "trigger": "free_inventory_wh < 3.0 AND wh_stock_qty > 0",
      "risk_weight": 0.30,
      "source": "rca_branch_4"
    },
    {
      "id": "CONTRACT_MISSING",
      "trigger": "has_valid_contract = False",
      "risk_weight": 0.40,
      "source": "rca_branch_3"
    },
    {
      "id": "WH_STOCK_SUFFICIENCY_LOW",
      "trigger": "wh_stock_sufficiency < 1.0 AND pod_importance_rank > 3",
      "risk_weight": 0.35,
      "source": "rca_branch_4"
    }
  ]
}
```

**For Claude (by-category/dairy.md)**:
```markdown
# Dairy Category Patterns

## Pattern: DAIRY_LOW_DOH

Dairy products with DOH < 1.5 days have 85% probability of OOS within 24 hours.

### Why This Matters
- Dairy has short shelf life and high velocity
- Lead time from WH is 1.5 days
- DOH < 1.5 means stock will deplete before replenishment arrives

### When Claude Should Override
- If WH also has low DOH → increase confidence
- If IPL/festival → demand spike will accelerate depletion
- If supplier fill rate is low → replenishment may not arrive

### Historical Performance
- F1: 0.78 (47 observations)
- Last updated: 2026-01-14
```

---

## 4. The Predict Script (predict.py)

### 4.1 What the Script Does

```python
# predict.py - Deterministic prediction generation

def main(date: str, pod_id: str):
    """
    Generate predictions for all SKUs at a POD.
    Claude Code runs this, then reviews flagged cases.
    """

    # ═══════════════════════════════════════════════════════════════════════
    # STEP 1: LOAD CONFIGURATION
    # ═══════════════════════════════════════════════════════════════════════
    thresholds = load_yaml("config/thresholds.yaml")
    flag_rules = load_yaml("config/flag_rules.yaml")
    patterns = load_json("brain/context-graph/patterns/rules.json")

    # ═══════════════════════════════════════════════════════════════════════
    # STEP 2: QUERY SIGNALS FROM SNOWFLAKE
    # ═══════════════════════════════════════════════════════════════════════
    # Based on 13 minimum inputs from Data Inputs doc + pattern signals
    signals = query_snowflake("""
        SELECT
            -- SKU Identity
            sku_id,
            sku_name,
            category,
            item_class,

            -- Pod Inventory State (Inputs 1, 3)
            pod_inventory AS on_hand_qty,
            in_transit_qty,

            -- WH Inventory State (Inputs 2, 10)
            wh_inventory AS wh_stock_qty,
            wh_doh,
            free_inventory_wh,           -- WH putaway status

            -- Demand Signals (Inputs 4, 5, 6)
            last_7d_sales_avg,
            last_7d_availability_avg,
            opd_forecast,
            current_opd,
            yesterday_sales,             -- For spike detection

            -- Configuration (Inputs 7, 8, 11)
            -- (MinDOH/MaxDOH loaded from config, not queried)
            pod_capacity_pct,            -- Current utilization

            -- Blocking Flags (Inputs 12, 13)
            erp_enabled,
            temp_disable_flag,
            movement_rr,                 -- NULL or 0.001 = blocked

            -- Upstream Signals (for patterns)
            supplier_fill_rate,
            has_pending_po,
            pending_po_expected_date,

            -- New signals for v4 patterns
            otif_issue,                  -- OTIF issue flag (1 = late delivery)
            pending_po_days,             -- Days since PO placed (for OTIF calculation)
            lead_time,                   -- Expected lead time for this SKU
            has_valid_contract,          -- Contract availability at WH
            wh_stock_sufficiency,        -- WH stock / total pod demand (< 1 = insufficient)
            pod_importance_rank          -- Pod priority ranking (1 = highest)

        FROM availability_signals_view   -- Pre-joined view
        WHERE pod_id = '{pod_id}'
          -- ANTI-CHEAT: Point-in-time filtering for historical simulation
          AND event_date <= '{date}'
          AND updated_at <= '{date} 23:59:59'
          -- Standard filters
          AND is_active = True
          AND velocity >= 1.0            -- Excludes dead stock
          AND erp_enabled = True         -- Skip disabled SKUs
          AND (temp_disable_flag IS NULL OR temp_disable_flag = False)
    """)

    # ═══════════════════════════════════════════════════════════════════════
    # STEP 3: CALCULATE DERIVED SIGNALS FOR EACH SKU
    # ═══════════════════════════════════════════════════════════════════════
    predictions = []
    flagged = []

    for sku in signals:
        # Calculate run rate (availability-corrected × OPD bump)
        availability_factor = max(sku.last_7d_availability_avg, 0.3)
        availability_corrected = sku.last_7d_sales_avg / availability_factor
        opd_bump = sku.opd_forecast / max(sku.current_opd, 1)
        run_rate = availability_corrected * opd_bump

        # Calculate effective DOH
        effective_inventory = sku.on_hand_qty + sku.in_transit_qty
        effective_doh = effective_inventory / max(run_rate, 0.1)

        # Get thresholds for item class
        min_doh = thresholds[sku.item_class]["min_doh"]
        max_doh = thresholds[sku.item_class]["max_doh"]

        # Calculate base risk
        base_risk = max(0, (min_doh - effective_doh) / min_doh)
        base_risk = min(1.0, base_risk)

        # ═══════════════════════════════════════════════════════════════════
        # STEP 4: APPLY PATTERN RULES
        # ═══════════════════════════════════════════════════════════════════
        matched_patterns = []
        pattern_boost = 0.0

        for pattern in patterns:
            if evaluate_trigger(pattern.trigger, sku, effective_doh, run_rate):
                matched_patterns.append(pattern.id)
                pattern_boost += pattern.risk_weight

        # Combined risk
        combined_risk = min(1.0, base_risk + pattern_boost)

        # ═══════════════════════════════════════════════════════════════════
        # STEP 5: GENERATE PREDICTION
        # ═══════════════════════════════════════════════════════════════════
        if combined_risk >= 0.5:
            prediction = "OOS"
            confidence = 0.5 + (combined_risk - 0.5) * 1.0  # 0.5-1.0
        else:
            prediction = "IN_STOCK"
            confidence = 1.0 - combined_risk

        # ═══════════════════════════════════════════════════════════════════
        # STEP 6: FLAG FOR CLAUDE REVIEW IF UNCERTAIN
        # ═══════════════════════════════════════════════════════════════════
        should_flag = (
            confidence < 0.6 or
            (0.4 < combined_risk < 0.6) or
            (len(matched_patterns) > 2 and base_risk < 0.3) or  # Conflicting
            sku.category in ['beverages', 'snacks', 'ice_cream'] or
            sku.wh_doh < 3.0  # WH critically low (matches Pod MinDOH)
        )

        result = {
            "sku_id": sku.sku_id,
            "sku_name": sku.sku_name,
            "category": sku.category,
            "prediction": prediction,
            "confidence": round(confidence, 3),
            "signals": {
                "on_hand_qty": sku.on_hand_qty,
                "in_transit_qty": sku.in_transit_qty,
                "run_rate": round(run_rate, 2),
                "effective_doh": round(effective_doh, 2),
                "min_doh": min_doh,
                "base_risk": round(base_risk, 3),
                "pattern_boost": round(pattern_boost, 3),
                "combined_risk": round(combined_risk, 3),
                "wh_doh": round(sku.wh_doh, 2),
                "supplier_fill_rate": sku.supplier_fill_rate
            },
            "patterns_matched": matched_patterns,
            "flagged_for_review": should_flag,
            "flag_reasons": get_flag_reasons(sku, confidence, combined_risk)
        }

        predictions.append(result)
        if should_flag:
            flagged.append(result)

    # ═══════════════════════════════════════════════════════════════════════
    # STEP 7: WRITE OUTPUTS
    # ═══════════════════════════════════════════════════════════════════════
    output_dir = f"logs/predictions/{date}"
    write_json(f"{output_dir}/base_predictions.json", {
        "date": date,
        "pod_id": pod_id,
        "generated_at": datetime.utcnow().isoformat(),
        "total_predictions": len(predictions),
        "predicted_oos": sum(1 for p in predictions if p["prediction"] == "OOS"),
        "flagged_for_review": len(flagged),
        "predictions": predictions
    })

    write_json(f"{output_dir}/flagged_for_review.json", {
        "date": date,
        "flagged_count": len(flagged),
        "cases": flagged
    })

    write_json(f"{output_dir}/summary.json", {
        "date": date,
        "total": len(predictions),
        "oos_count": sum(1 for p in predictions if p["prediction"] == "OOS"),
        "in_stock_count": sum(1 for p in predictions if p["prediction"] == "IN_STOCK"),
        "flagged_count": len(flagged),
        "avg_confidence": sum(p["confidence"] for p in predictions) / len(predictions),
        "patterns_triggered": Counter(p for pred in predictions for p in pred["patterns_matched"])
    })

    print(f"Predictions complete: {len(predictions)} total, {len(flagged)} flagged for review")
```

---

## 5. What Claude Code Does (The 5%)

### 5.1 SKILL.md Content

```markdown
# Predict Skill

## Purpose
Generate OOS predictions for tomorrow. Script does deterministic work;
Claude reviews flagged cases and applies reasoning-based overrides.

## Trigger Phrases
- "predict OOS"
- "run predict"
- "forecast availability"

## Pre-Execution Verification

Before running predictions, verify:
- [ ] Context graph exists: `brain/context-graph/patterns/rules.json`
- [ ] Config files present: `config/thresholds.yaml`, `config/flag_rules.yaml`
- [ ] Snowflake connectivity verified
- [ ] Date parameter is correct (anti-cheat: no future data)
- [ ] POD ID specified (default: POD_BLR_001)

Surface to human:
> "Ready to predict for {date}. Using {N} patterns from context graph.
> Config: MinDOH thresholds loaded for 4 item classes.
> Anti-cheat: Query will filter to data available on {date}.
> Proceed?"

## Execution Steps

### Step 1: Run Prediction Script
```bash
python .claude/skills/predict/scripts/predict.py \
  --date {tomorrow} \
  --pod POD_BLR_001
```

Read the summary output to understand what was generated.

### Step 2: Check External Events
Search for events that affect demand:
- WebSearch: "IPL match {date} Bangalore"
- WebSearch: "Bangalore weather {date}"
- WebSearch: "Indian festivals {date}"
- Glean: "Instamart supply chain incidents"

Note relevant events and affected categories.

### Step 3: Review Flagged Cases
Read `logs/predictions/{date}/flagged_for_review.json`.

For each flagged case, consider:
1. Do external events affect this category?
2. Is upstream (WH) risk higher than base_risk reflects?
3. Are there conflicting signals that need judgment?
4. Does your domain knowledge suggest a different prediction?

If override needed, document:
- Original prediction
- New prediction
- Confidence
- Reasoning (natural language)

### Step 4: Write Overrides
Write overrides to `logs/predictions/{date}/overrides.json`:
```json
{
  "date": "YYYY-MM-DD",
  "override_count": N,
  "external_events": ["IPL match: RCB vs CSK"],
  "overrides": [
    {
      "sku_id": "SKU_12345",
      "original_prediction": "IN_STOCK",
      "new_prediction": "OOS",
      "original_confidence": 0.52,
      "new_confidence": 0.75,
      "reasoning": "IPL match tonight. Beverages demand +40% expected..."
    }
  ]
}
```

### Step 5: Merge Predictions
```bash
python .claude/skills/predict/scripts/merge_predictions.py --date {date}
```

This creates `final_predictions.json` by applying overrides to base predictions.

## When to Override (Guidelines)

### Increase OOS Confidence
- IPL/cricket match + beverages/snacks → +0.2 risk
- Festival eve + staples/sweets → +0.2 risk
- Extreme weather + relevant category → +0.1 risk
- Active Glean incident mentioning category → +0.15 risk
- WH DOH < 5 but base_risk < 0.3 → likely understated risk

### Decrease OOS Confidence (Change to IN_STOCK)
- Rain forecast + dairy/bakery → demand may drop
- Pattern matched but WH has high DOH → likely safe
- Multiple weak patterns vs one strong signal → trust signal

### Do Not Override
- High confidence predictions (>0.8) unless strong contrary evidence
- Patterns that have F1 > 0.8 in context graph
- When you're not sure → trust the script

## Output Files
- `base_predictions.json` - Script output (all SKUs)
- `flagged_for_review.json` - Cases Claude should review
- `overrides.json` - Claude's changes (written by Claude)
- `final_predictions.json` - Merged output (script merges)
- `summary.json` - Stats for the day
```

### 5.2 Example Claude Override Session

```
Claude reads summary.json:
  "1,187 predictions. 67 flagged for review. 89 predicted OOS."

Claude searches for external events:
  WebSearch: "IPL match January 16 2026 Bangalore"
  Result: "RCB vs CSK, 7:30 PM at Chinnaswamy Stadium"

Claude reads flagged_for_review.json and reasons:

  Case 1: Coca-Cola 500ml
    Script: IN_STOCK (confidence: 0.52)
    Signals: DOH=2.1, base_risk=0.30, category=beverages
    Flag reason: confidence < 0.6, category=beverages

    Claude thinks: "IPL tonight. Beverages +40%. Adjusted DOH = 1.5.
    This is below MinDOH (3.0). Override to OOS."

    Override: OOS (confidence: 0.75)
    Reasoning: "IPL match will spike beverages demand ~40%..."

  Case 2: Amul Butter 500g
    Script: OOS (confidence: 0.58)
    Signals: DOH=1.8, base_risk=0.40, category=dairy
    Flag reason: confidence < 0.6

    Claude thinks: "No external events affect dairy. WH DOH=8.5 is healthy.
    Script prediction reasonable. No override."

Claude writes overrides.json with 12 overrides (out of 67 flagged).
Claude runs merge script to create final_predictions.json.
```

---

## 6. Context Graph vs Skill: Final Clarification

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  .claude/skills/predict/                brain/context-graph/                    │
│  ════════════════════════               ════════════════════                    │
│                                                                                 │
│  SKILL.md                               patterns/rules.json                     │
│  ─────────────────                      ───────────────────                     │
│  Tells Claude:                          Used by Script:                         │
│  • Run this script                      • Machine-readable triggers             │
│  • Check these events                   • Risk weights                          │
│  • Review flagged cases                 • Pattern IDs                           │
│  • Write overrides here                                                         │
│                                         patterns/by-category/*.md               │
│  scripts/                               ───────────────────────────             │
│  ─────────                              Used by Claude:                         │
│  • predict.py (does the work)           • Human-readable explanations           │
│  • merge_predictions.py                 • When to override guidance             │
│  • SQL queries                          • Historical performance                │
│  • Config files                                                                 │
│                                         signals.md                              │
│                                         ───────────                             │
│                                         Signal importance rankings              │
│                                         (informs both script and Claude)        │
│                                                                                 │
│  UPDATED: Outer loop (weekly)           UPDATED: Inner loop (daily)             │
│  When process improves                  When new patterns discovered            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Key Domain Knowledge (From Documents)

### 7.1 Complete Signal Requirements (From Data Inputs Doc)

The prediction script needs these **13 minimum inputs** for Pod-level prediction:

| # | Signal | Granularity | Source | Used For |
|---|--------|-------------|--------|----------|
| 1 | `pod_inventory` | SKU × Pod | Inventory system | DOH calculation |
| 2 | `wh_inventory` | SKU × WH | Inventory system | Stock sufficiency, upstream risk |
| 3 | `in_transit_qty` | SKU × Pod | PO system | Effective inventory |
| 4 | `last_7d_sales` | SKU × Pod × Day | Sales data | Run rate calculation |
| 5 | `last_7d_availability` | SKU × Pod × Day | Availability data | Availability correction |
| 6a | `opd_forecast` | Pod × Day | DS model | Predicted OPD (for bump factor) |
| 6b | `current_opd` | Pod | Sales data | Current avg OPD (for bump factor denominator) |
| 7 | `item_class` | SKU × City | ERP/Catalog | MinDOH/MaxDOH lookup |
| 8 | `min_doh` / `max_doh` | Item class | Config | Reorder trigger threshold |
| 9 | `case_size` | SKU | ERP/Catalog | Order rounding (not for prediction) |
| 10 | `pod_wh_mapping` | Pod | Network config | Which WH serves this Pod |
| 11 | `pod_capacity` | Pod | Store master | Capacity constraint flag |
| 12 | `erp_flags` | SKU × City | ERP/Catalog | Blocking (temp_disable, erp_enabled) |
| 13 | `movement_rr` | SKU × Pod | Planning | Movement block detection (NULL or 0.001) |

**Additional signals for pattern matching:**

| # | Signal | Used For | Pattern |
|---|--------|----------|---------|
| 14 | `supplier_fill_rate` | Upstream reliability pattern | SUPPLIER_FILL_RATE_LOW |
| 15 | `has_pending_po` | PO in pipeline | SUPPLIER_FILL_RATE_LOW, OTIF_ISSUE |
| 16 | `yesterday_sales` | Demand spike detection | DEMAND_SPIKE |
| 17 | `wh_doh` | Upstream risk assessment | WH_OOS_UPSTREAM |
| 18 | `free_inventory_wh` | WH putaway status | WH_PUTAWAY_DELAY |
| 19 | `otif_issue` | Late delivery flag | OTIF_ISSUE |
| 20 | `pending_po_days` | Days since PO placed | OTIF_ISSUE |
| 21 | `lead_time` | Expected SKU lead time | OTIF_ISSUE |
| 22 | `has_valid_contract` | Contract availability | CONTRACT_MISSING |
| 23 | `wh_stock_sufficiency` | WH stock / total demand | WH_STOCK_SUFFICIENCY_LOW |
| 24 | `pod_importance_rank` | Pod priority (1=highest) | WH_STOCK_SUFFICIENCY_LOW |

### 7.2 Data Quality Requirements

| Signal | Freshness | Impact if Stale |
|--------|-----------|-----------------|
| `pod_inventory` | Real-time / EOD | Direct DOH error |
| `wh_inventory` | Real-time / EOD | Upstream risk missed |
| `last_7d_sales` | Daily | Run rate error |
| `opd_forecast` | Daily | Bump factor error |
| `item_class` | Weekly OK | Wrong thresholds |
| `supplier_fill_rate` | Weekly OK | Pattern mismatch |

### 7.3 Pod Replenishment Logic

```
Run Rate = Availability-Corrected 7-Day Avg × OPD Bump Factor

Effective DOH = (On-Hand + In-Transit) / Run Rate

MinDOH = Lead Time (1.5) + Review Frequency (1) + Safety Stock (0.5) = 3 days

IF Effective DOH < MinDOH → Trigger reorder
```

### 7.4 Item Class Thresholds (config/thresholds.yaml)

```yaml
Top_50:
  min_doh: 3.0
  max_doh: 3.5
  availability_target: 0.98

Top_100:
  min_doh: 2.5
  max_doh: 3.0
  availability_target: 0.95

MSKU:
  min_doh: 2.0
  max_doh: 2.5
  availability_target: 0.90

Long_tail:
  min_doh: 1.0
  max_doh: 1.5
  availability_target: 0.70
```

### 7.5 Key RCA Reason Codes (For Pattern Rules)

| Code | Meaning | Pattern Rule |
|------|---------|--------------|
| `oos_6` | movement_rr = NULL | NO_MOVEMENT_RR (+0.50) |
| `oos_7` | movement_rr = 0.001 | NO_MOVEMENT_RR (+0.50) |
| `oos_8` | Long term supply issue | WH_SUPPLY_ISSUE (+0.35) |
| `oos_9` | Fill rate < 80% | SUPPLIER_FILL_RATE_LOW (+0.25) |
| `oos_10` | OTIF issue (late PO) | OTIF_ISSUE (+0.35) |
| `oos_11` | WH putaway delay | WH_PUTAWAY_DELAY (+0.30) |
| `oos_12` | Contract missing/expired | CONTRACT_MISSING (+0.40) |
| `oos_13` | WH insufficient for all pods | WH_STOCK_SUFFICIENCY_LOW (+0.35) |
| `instock_13` | Sales > 3× RR | DEMAND_SPIKE (+0.20) |

---

## 8. Implementation Sequence

1. **Create directory structure**
2. **Write config files** (thresholds.yaml, flag_rules.yaml)
3. **Create rules.json** (bootstrap patterns in machine-readable format)
4. **Build predict.py** (main prediction script)
5. **Build merge_predictions.py** (merges base + overrides)
6. **Write SKILL.md** (procedural instructions for Claude)
7. **Create human-readable patterns** (by-category/*.md for Claude reference)
8. **Test on single day** (Dec 20 historical data)
9. **Run full simulation** (30 days)
10. **Iterate based on reflect feedback**

---

## 9. Token Efficiency Summary

| Activity | v2 (Old) | v3 (New) |
|----------|----------|----------|
| Query data | Claude runs SQL | Script runs SQL |
| Calculate DOH | Claude calculates | Script calculates |
| Apply patterns | Claude reads + matches | Script applies rules |
| Generate predictions | Claude writes ~1,200 | Script writes all |
| Write JSON | ~50K tokens | ~0 tokens |
| External events | Claude checks all | Claude checks once |
| Override decisions | Claude for all | Claude for ~5% |
| **Total tokens/day** | ~100K+ | ~5-10K |

---

## 10. Validation Summary (v4)

### Validation Agents Run
Three independent validation agents reviewed this plan against all reference documents:

| Agent | Scope | ✅ | ⚠️ | ❌ |
|-------|-------|-----|-----|-----|
| Data/Signal | Signals, queries, formulas | 6 | 3 | 1 |
| Architecture/POC | Daily cycle, structure, tools | 9 | 2 | 0 |
| Domain/Business | Thresholds, patterns, RCA | 9 | 2 | 1 |
| **TOTAL** | | **24** | **7** | **2** |

### Critical Issues Fixed (v3 → v4)

| Issue | v3 Value | v4 Value | Source |
|-------|----------|----------|--------|
| **Supplier fill rate threshold** | `< 0.70` | `< 0.80` | OTB doc line 634 |
| **Anti-cheat filter** | Missing | Added to SQL WHERE | POC CLAUDE.md |

### Minor Issues Fixed (v3 → v4)

| Issue | Fix Applied |
|-------|-------------|
| WH DOH flag threshold | Changed from 5.0 to 3.0 (matches Pod MinDOH) |
| OPD signal ambiguity | Clarified both `opd_forecast` AND `current_opd` required |
| Pre-predict checklist | Added verification section to SKILL.md |
| Glean incident search | Already in Step 2 (confirmed) |

### Domain Gaps Addressed (v3 → v4)

| Gap | Pattern Added | Risk Weight |
|-----|---------------|-------------|
| OTIF Issues (late POs) | `OTIF_ISSUE` | +0.35 |
| Putaway Delays | `WH_PUTAWAY_DELAY` | +0.30 |
| Contract Availability | `CONTRACT_MISSING` | +0.40 |
| WH Stock Sufficiency | `WH_STOCK_SUFFICIENCY_LOW` | +0.35 |

### New Signals Added (v4)

| # | Signal | Used For |
|---|--------|----------|
| 19 | `otif_issue` | Late delivery flag |
| 20 | `pending_po_days` | Days since PO placed |
| 21 | `lead_time` | Expected SKU lead time |
| 22 | `has_valid_contract` | Contract availability |
| 23 | `wh_stock_sufficiency` | WH stock / total demand |
| 24 | `pod_importance_rank` | Pod priority (1=highest) |

### Pattern Count

| Version | Core Patterns | Total Rules |
|---------|---------------|-------------|
| v3 | 6 | 6 |
| v4 | 10 | 10 (+4 new) |

### Readiness Assessment

| Category | Status |
|----------|--------|
| **Signal completeness** | ✅ All 24 signals documented |
| **Anti-cheat filtering** | ✅ Point-in-time SQL filter added |
| **Pattern coverage** | ✅ 10 patterns covering 7 RCA branches |
| **Threshold accuracy** | ✅ All values validated against docs |
| **Architecture alignment** | ✅ Matches POC daily cycle |
| **Token efficiency** | ✅ Scripts 95%, Claude 5% design |

**Plan Status**: Ready for implementation.

---

## References

- `/scm/pocs/availability-prediction/context-graph/Instamart Inventory Replenishment v2.md` - Pod replenishment logic, RCA codes
- `/scm/pocs/availability-prediction/context-graph/Instamart Warehouse OTB.md` - WH procurement, supplier constraints
- `/scm/pocs/availability-prediction/context-graph/Instamart Inventory Data Inputs.md` - **Complete signal requirements (13 minimum inputs)**
- `/scm/docs/prediction-driven-context-graphs.md` - Conceptual foundation
- `/scm/docs/prediction-driven-context-graphs-poc.md` - POC architecture
