# Food Partner Data Analytics Skill

**One-pager for Account Managers, City Heads, and stakeholders**

---

## What Is This?

An AI-powered analytics copilot built into Claude Code that helps Account Managers diagnose restaurant health, identify root causes for underperformance, and execute data-backed growth interventions — without writing SQL or switching between dashboards.

```
  "How is restaurant 12345 doing?"
           │
           ▼
  ┌────────────────────┐     ┌──────────────────┐     ┌───────────────────┐
  │  AUTO-GENERATES    │────>│  CLASSIFIES INTO │────>│  RECOMMENDS       │
  │  Snowflake SQL     │     │  1 of 5 PERSONAS │     │  PHASED PLAYBOOK  │
  │  across 17 tables  │     │  with evidence   │     │  with tracking    │
  └────────────────────┘     └──────────────────┘     └───────────────────┘
```

---

## What Can You Ask?

| Question | What You Get |
|----------|-------------|
| "How is restaurant X performing?" | Full 5-phase diagnostic: vital signs, persona, root cause, intervention |
| "Why are orders declining for X?" | Trend analysis + funnel drop-off + discount dependency check |
| "What persona is this restaurant?" | Classification with data evidence and confidence score |
| "Show me the funnel for restaurant X" | Menu views -> Cart -> Payment -> Order conversion rates |
| "What's the unit economics at AOV 240?" | Profit waterfall: GMV -> Commission -> COGS -> Net Profit |
| "Which items are driving revenue?" | Top items by orders, revenue, and category breakdown |
| "What's the CPC ROI for restaurant X?" | Ad spend vs incremental GMV, weekly trend |
| "Show rating trend for restaurant X" | Weekly restaurant + delivery ratings over 90 days |
| "How to grow this restaurant?" | Persona-specific playbook with phased actions and timelines |

---

## The 5 Restaurant Personas

Each restaurant gets classified based on data signals, then routed to a tailored playbook.

```
┌─────────────────────────┬───────────────────────────┬─────────────────────────┐
│  PERSONA                │  KEY SIGNAL               │  PRIMARY FIX            │
├─────────────────────────┼───────────────────────────┼─────────────────────────┤
│ 1. Skeptical            │ Zero ad spend, <200       │ Micro-commitments,      │
│    Traditionalist       │ orders, 6+ months old     │ data-driven trust       │
├─────────────────────────┼───────────────────────────┼─────────────────────────┤
│ 2. Over-Discounter      │ Avg discount >25%,        │ Unit economics          │
│                         │ profit/order near zero    │ education, AOV strategy │
├─────────────────────────┼───────────────────────────┼─────────────────────────┤
│ 3. Logistics Loser      │ Delivery success <85%,    │ Fix operations before   │
│                         │ returns >15%, rating <3.5 │ scaling anything        │
├─────────────────────────┼───────────────────────────┼─────────────────────────┤
│ 4. Seasonality          │ Revenue swing >50%        │ Counter-seasonal menu,  │
│    Sufferer             │ between best/worst month  │ demand creation         │
├─────────────────────────┼───────────────────────────┼─────────────────────────┤
│ 5. Growth Plateau       │ 0% MoM growth for 6+      │ Product diversification,│
│                         │ months, >500 orders/month │ expand customer base    │
└─────────────────────────┴───────────────────────────┴─────────────────────────┘
```

**Priority rule**: If a restaurant matches multiple personas, fix in order: Logistics > Discount > Trust > Seasonality > Growth.

---

## The Diagnostic Workflow

```
Phase 0          Phase 1           Phase 2          Phase 3          Phase 4-5
IDENTIFY         VITAL SIGNS       CLASSIFY         DEEP DIVE        INTERVENE
─────────        ───────────       ────────         ─────────        ─────────
Restaurant       5-stage health    Match to 1       Persona-         Phased
lookup by        check across      of 5 personas    specific         playbook
name or ID       Discovery →       using data       queries:         with weekly
+ AM hierarchy   Fulfillment       thresholds       CPC, items,      actions and
+ age, tier      lifecycle                          ratings,         tracking
                                                    repeat rate      queries
```

---

## Data Coverage

The skill knows **17 validated Snowflake/Databricks tables** with correct column names, types, and join keys.

| Domain | Tables | Example Metrics |
|--------|--------|-----------------|
| Orders & Revenue | DP_ORDER_FACT, POCKETHERO_ORDER_FACT_V1 | GMV, AOV, discount breakdown, repeat rate |
| Search Funnel | REST_DAY_M2O_FUNNEL_API_RR, SEARCH_FACT_TABLE_v2 | S2M, M2C, C2O conversion rates |
| Restaurant Master | RESTAURANTS, RESTAURANT_ATTRIBUTES | Name, rating, age, AM hierarchy, tier |
| Menu & Items | ITEM_SALES, CMS.SWIGGY.ITEMS | Top items, image coverage, category mix |
| Operations | DP_ORDER_FACT, prod.vendor.order_info | Delivery time, prep time, cancellation rate |
| Ratings | CMS.SWIGGY.RATINGS | Restaurant rating, delivery rating, trends |
| Ads / CPC | FOOD_ADS_SOS_CPC_BILLING | Spend, clicks, CPC, ROI |
| Availability | RESTAURANT_HOLIDAY_SLOT_EVENTS | Holiday closures, slot shutdowns |
| Complaints | RESTAURANT_IGCC_GRANTED_PER | IGCC % (complaint cost as % of revenue) |

---

## Proven Results (from Case Studies)

| Persona | Before | After | Timeline |
|---------|--------|-------|----------|
| Skeptical Traditionalist | 120 orders/mo | 420 orders/mo (+250%) | 3 months |
| Over-Discounter | -Rs. 5 profit/order | +Rs. 88 profit/order | 4 months |
| Logistics Loser | 78% delivery success | 94% delivery success | 4 months |
| Seasonality Sufferer | 80% seasonal gap | 52% seasonal gap | 6 months |
| Growth Plateau | 0% MoM growth | +51% revenue | 4 months |

---

## How to Use

**Option 1: Ask Claude directly** (triggers automatically on keywords like "restaurant partner", "AOV", "funnel", "delivery rate", "partner diagnostic")

```
> How is restaurant 584321 performing?
> Why are orders dropping for Biryani Boss in Bangalore?
> What persona is restaurant 12345?
> Calculate unit economics for AOV 350 with 20% discount
```

**Option 2: CLI tool** (quick lookups, no database connection needed)

```bash
# View health benchmarks
uv run .claude/skills/food-partner-data-analytics/scripts/rx_health.py benchmarks

# Classify a restaurant from metrics
uv run .claude/skills/food-partner-data-analytics/scripts/rx_health.py persona-check \
    --orders 120 --aov 220 --discount-pct 5 --delivery-success 92 \
    --rating 3.8 --mom-growth 2 --rx-age 8

# Calculate profit per order
uv run .claude/skills/food-partner-data-analytics/scripts/rx_health.py unit-economics 240 32
```

---

## Technical Details

| Attribute | Value |
|-----------|-------|
| Skill location | `.claude/skills/food-partner-data-analytics/` |
| Files | 10 markdown + 1 Python script |
| SQL templates | 43+ validated queries |
| Schema validation | All columns verified via `INFORMATION_SCHEMA.COLUMNS` (Feb 2026) |
| Platforms | Snowflake (primary) + Databricks (richer order/delivery data) |
| Target users | ~980 SAMs, ASMs, City Heads |
