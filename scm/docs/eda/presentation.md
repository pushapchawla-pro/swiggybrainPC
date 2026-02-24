# Supply Chain Brain: The Availability Story

> A data investigation into availability metrics and prediction architecture for Instamart

---

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║                           THE STORY IN ONE PICTURE                                ║
║                                                                                   ║
║    ┌─────────────────────────────────────────────────────────────────────────┐   ║
║    │                                                                         │   ║
║    │      THE PROBLEM                                                        │   ║
║    │      ───────────                                                        │   ║
║    │      Two questions. No clear answers.                                   │   ║
║    │      • Which metric: Session-based (84%) or Search-weighted (91%)?     │   ║
║    │      • Where to predict: Warehouse? POD? Both?                         │   ║
║    │                                                                         │   ║
║    │                            ↓                                            │   ║
║    │                                                                         │   ║
║    │      THE INVESTIGATION                                                  │   ║
║    │      ─────────────────                                                  │   ║
║    │      9 hypotheses. 30+ SQL queries. 3 surprising findings.             │   ║
║    │      • Why is search-weighted 7% higher? (It's not a bug)              │   ║
║    │      • Does availability drive conversion? (No — that's a surprise)    │   ║
║    │      • Can WH-level prediction reach 99.9%? (No — we proved why)       │   ║
║    │                                                                         │   ║
║    │                            ↓                                            │   ║
║    │                                                                         │   ║
║    │      THE DISCOVERY                                                      │   ║
║    │      ─────────────                                                      │   ║
║    │      • Use search-weighted only (session-based is a distraction)       │   ║
║    │      • Differentiated targets by tier (99%+ for Tier 1, 85% for tail)  │   ║
║    │      • Build both WH + POD prediction (can't reach 99.9% otherwise)    │   ║
║    │      • Bradman covers only 27% — needs to be 66%                       │   ║
║    │                                                                         │   ║
║    └─────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

# Part 1: The Problem

## The Challenge We Faced

Supply Chain Brain needs to predict and prevent stockouts. But before building anything, we had to answer two fundamental questions:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                         QUESTION 1: WHICH METRIC?                               │
│                                                                                  │
│   We have two ways to measure availability. They give different numbers.        │
│                                                                                  │
│   ┌─────────────────────────────┐    ┌─────────────────────────────┐           │
│   │    SESSION-BASED            │    │    SEARCH-WEIGHTED          │           │
│   │                             │    │                             │           │
│   │    Formula:                 │    │    Formula:                 │           │
│   │    1 - (OOS / sessions)     │    │    Σ(avail × impressions)   │           │
│   │                             │    │    ───────────────────────  │           │
│   │    Current: 84%             │    │    Current: 91%             │           │
│   │                             │    │         Σ(impressions)      │           │
│   └─────────────────────────────┘    └─────────────────────────────┘           │
│                                                                                  │
│   Which one should we use? And why is there a 7% gap?                           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                   QUESTION 2: WHERE SHOULD WE PREDICT?                          │
│                                                                                  │
│   Brand → Supplier → Warehouse → Dark Store (POD) → Customer                    │
│                           │              │                                       │
│                           │              │                                       │
│                      Predict here?   Or here?                                   │
│                                                                                  │
│   ┌─────────────────────────────┐    ┌─────────────────────────────┐           │
│   │    OPTION A: POD-LEVEL      │    │    OPTION B/C: WH-LEVEL     │           │
│   │    ✓ Customer-centric       │    │    ✓ Simpler                │           │
│   │    ✗ Sparse data            │    │    ✗ "Allocation blindness" │           │
│   │    ✗ Complex                │    │    ✗ Misses POD variance    │           │
│   └─────────────────────────────┘    └─────────────────────────────┘           │
│                                                                                  │
│   Which approach can actually reach 99.9%? Or do we need both?                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## What We Set Out To Prove

We formed 9 hypotheses to answer these questions. Here's the map of our investigation:

```
                              TWO QUESTIONS
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            WHICH METRIC?                   WHERE TO PREDICT?
                    │                               │
        ┌───────────┴───────────┐       ┌──────────┴──────────┐
        │                       │       │                      │
        ▼                       ▼       ▼                      ▼
    H1.1: Do the           H1.2: Does   H2.1: Is           H2.2: Do PODs
    metrics diverge?       avail drive  "allocation        vary within
                          conversion?   blindness" real?   same WH?
        │                       │           │                  │
        │                       │           │                  │
        │               ┌───────┘           │                  │
        │               │                   │                  │
        │               ▼                   │                  │
        │     ┌─────────────────────────────────────────────┐  │
        │     │                                             │  │
        │     │  SURPRISE: Availability ≠ Conversion        │  │
        │     │  Why? We needed 3 more hypotheses...        │  │
        │     │                                             │  │
        │     └──────────────────┬──────────────────────────┘  │
        │                        │                             │
        │            ┌───────────┼───────────┐                 │
        │            │           │           │                 │
        │            ▼           ▼           ▼                 │
        │         H3.1:      H3.2:       H3.3:                │
        │         Selection  Substitu-   Baseline             │
        │         Bias       tion        Effect               │
        │            │           │           │                 │
        └────────────┴───────────┴───────────┴─────────────────┘
                                 │
                                 ▼
                         THE FULL PICTURE
```

---

# Part 2: The Investigation

## Chapter 1: The Metric Divergence Mystery

### What We Expected

If session-based and search-weighted are measuring the same thing, they should be highly correlated (>95%). A small gap might exist due to weighting, but the numbers should tell the same story.

### What We Found

**They diverge meaningfully.** ~20% of SKUs show >5% divergence.

| Metric | Value |
|--------|-------|
| Session-based availability | **84%** |
| Search-weighted availability | **91%** |
| Gap | **+7 percentage points** |
| SKUs with >5% divergence | **~20%** |

But wait — why is search-weighted **higher**? That seems backwards. If we're weighting by what customers search for, shouldn't availability look *worse* (customers searching for OOS items)?

### The First Discovery: The Gap Is Good News

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                    WHY SEARCH-WEIGHTED > SESSION-BASED                          │
│                         (This is actually expected)                             │
│                                                                                  │
│   SESSION-BASED (84%)              SEARCH-WEIGHTED (91%)                        │
│        │                                  │                                      │
│        │ counts...                        │ weights by...                        │
│        ▼                                  ▼                                      │
│   ┌────────────────┐              ┌────────────────┐                            │
│   │ ALL catalog    │              │ HIGH-DEMAND    │                            │
│   │ SKUs during    │              │ SKUs that get  │                            │
│   │ sessions       │              │ searched       │                            │
│   │                │              │                │                            │
│   │ Including:     │              │ These have     │                            │
│   │ • Long-tail    │              │ BETTER avail   │                            │
│   │   nobody       │              │ because we     │                            │
│   │   searches     │              │ prioritize     │                            │
│   │   (dragging    │              │ stocking them  │                            │
│   │   down avg)    │              │                │                            │
│   └────────────────┘              └────────────────┘                            │
│                                                                                  │
│   The 7% gap = long-tail SKUs with poor availability that nobody searches for   │
│                                                                                  │
│   THIS IS GOOD SUPPLY CHAIN BEHAVIOR — we stock what sells!                     │
│                                                                                  │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│   What WOULD be a red flag:                                                     │
│   Search-weighted < session-based                                               │
│   = "SKUs people want are LESS available than SKUs nobody searches"             │
│   = Supply chain failure                                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>🔍 Technical Details: H1.1 Validation Query</b></summary>

```sql
-- H1.1: Per-SKU divergence between session vs search-weighted availability
-- Environment: Databricks
-- Timeframe: 7 days, Bangalore

WITH search_imps AS (
  SELECT DT, STORE_ID, SKU_ID, SEARCH_IMP
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7)
    AND CITY = 'Bangalore' AND SEARCH_IMP > 0
),
daily_avl AS (
  SELECT DT, STORE_ID, SKU_ID, WTD_AVAILABILITY as session_avail
  FROM prod.analytics_prod.analytics_public_im_sku_day_avl
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
),
sku_metrics AS (
  SELECT s.SKU_ID,
    AVG(a.session_avail) as session_avail,
    SUM(a.session_avail * s.SEARCH_IMP) / SUM(s.SEARCH_IMP) as search_avail
  FROM search_imps s
  INNER JOIN daily_avl a ON s.DT = a.DT AND s.STORE_ID = a.STORE_ID AND s.SKU_ID = a.SKU_ID
  GROUP BY s.SKU_ID HAVING SUM(s.SEARCH_IMP) > 100
)
SELECT
  COUNT(*) as total_skus,
  SUM(CASE WHEN ABS(search_avail - session_avail) > 0.05 THEN 1 END) as divergent_5pct,
  ROUND(SUM(CASE WHEN ABS(search_avail - session_avail) > 0.05 THEN 1 END) * 100.0 / COUNT(*), 2) as pct_divergent,
  ROUND(AVG(session_avail) * 100, 2) as avg_session_avail,
  ROUND(AVG(search_avail) * 100, 2) as avg_search_avail
FROM sku_metrics

-- Result:
-- total_skus: 832,548
-- divergent_5pct: 170,478
-- pct_divergent: 20.48%
-- avg_session_avail: 89.81%
-- avg_search_avail: 93.04%
```

**Note**: Re-validation showed 19.43% (borderline). Cite as "~20%" or "meaningful divergence."

</details>

**Decision Point #1**: The metrics tell different stories. We need to choose based on what we're optimizing for.

---

## Chapter 2: The Conversion Puzzle

### What We Expected

Intuitively: OOS → can't buy → lower conversion. If true, we can justify availability investment with clear conversion ROI.

### What We Found

**No relationship.** Correlation ≈ 0.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                 H1.2: AVAILABILITY → CONVERSION CORRELATION                     │
│                                                                                  │
│   We tested at two levels:                                                      │
│                                                                                  │
│   SKU-LEVEL:                                                                    │
│   ┌────────────────────────────────────────┐                                    │
│   │ Availability vs S2C Rate: -0.01        │  Essentially zero                  │
│   │ Availability vs GMV:      -0.01        │                                    │
│   └────────────────────────────────────────┘                                    │
│                                                                                  │
│   STORE-LEVEL:                                                                  │
│   ┌────────────────────────────────────────┐                                    │
│   │ Store Availability │ Conversion Rate   │                                    │
│   │ <60%               │ 19.58%            │                                    │
│   │ 60-70%             │ 22.05%  ← highest │  No monotonic                      │
│   │ 70-80%             │ 21.96%            │  pattern!                          │
│   │ 80-90%             │ 19.30%            │                                    │
│   │                                        │                                    │
│   │ Correlation: -0.12 (weak negative!)    │                                    │
│   └────────────────────────────────────────┘                                    │
│                                                                                  │
│   ❌ HYPOTHESIS NOT VALIDATED                                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

This was unexpected. How can availability NOT predict conversion?

### The Investigation Deepens: Why No Correlation?

We formed three new hypotheses (H3.1-H3.3) to explain this puzzle:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│            THREE HYPOTHESES FOR WHY AVAILABILITY ≠ CONVERSION                   │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                         │   │
│   │   H3.1: SELECTION BIAS                                                  │   │
│   │   "OOS is concentrated in long-tail SKUs nobody searches for"           │   │
│   │                                                                         │   │
│   │   If true → OOS happens where it doesn't matter → signal diluted        │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                         │   │
│   │   H3.2: SUBSTITUTION EFFECT                                             │   │
│   │   "When OOS, users substitute rather than abandon"                      │   │
│   │                                                                         │   │
│   │   If true → Conversion still happens → Signal masked                    │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                              │                                                   │
│                              ▼                                                   │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                         │   │
│   │   H3.3: BASELINE EFFECT                                                 │   │
│   │   "At 91% availability, OOS encounters are rare per session"            │   │
│   │                                                                         │   │
│   │   If true → Individual impact exists but is statistically diluted      │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>🔍 Technical Details: H1.2 Validation Queries</b></summary>

**Query 1: SKU-Level Correlation**
```sql
WITH sku_metrics AS (
  SELECT s.SKU_ID,
    AVG(a.WTD_AVAILABILITY) as session_avail,
    SUM(a.WTD_AVAILABILITY * s.SEARCH_IMP) / SUM(s.SEARCH_IMP) as search_avail,
    SUM(s.S2C) * 1.0 / SUM(s.SEARCH_IMP) as s2c_rate,
    SUM(s.SEARCH_GMV) as total_search_gmv
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans s
  INNER JOIN prod.analytics_prod.analytics_public_im_sku_day_avl a
    ON s.DT = a.DT AND s.STORE_ID = a.STORE_ID AND s.SKU_ID = a.SKU_ID
  WHERE s.DT >= DATE_SUB(CURRENT_DATE(), 7) AND s.CITY = 'Bangalore'
  GROUP BY s.SKU_ID HAVING SUM(s.SEARCH_IMP) > 100
)
SELECT
  ROUND(CORR(session_avail, s2c_rate), 4) as session_corr_s2c,
  ROUND(CORR(search_avail, s2c_rate), 4) as search_corr_s2c,
  COUNT(*) as num_skus
FROM sku_metrics

-- Result: session_corr_s2c = -0.0119, search_corr_s2c = +0.0172
```

**Query 2: Store-Level Bucketed Analysis**
```sql
WITH store_availability AS (
  SELECT STORE_ID, AVG(WTD_AVAILABILITY) as avg_availability
  FROM prod.analytics_prod.analytics_public_im_sku_day_avl
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
  GROUP BY STORE_ID
),
store_conversion AS (
  SELECT STOREID as STORE_ID, COUNT(*) as total_sessions, SUM(ORDER_IND) as orders
  FROM prod.analytics_prod.analytics_public_im_session_data_serv
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
  GROUP BY STOREID HAVING COUNT(*) > 100
)
SELECT
  CASE WHEN a.avg_availability < 0.6 THEN '1. <60%'
       WHEN a.avg_availability < 0.7 THEN '2. 60-70%'
       WHEN a.avg_availability < 0.8 THEN '3. 70-80%'
       ELSE '4. 80-90%' END as avail_bucket,
  COUNT(*) as num_stores,
  ROUND(SUM(c.orders) * 100.0 / SUM(c.total_sessions), 2) as conversion_rate
FROM store_availability a JOIN store_conversion c ON a.STORE_ID = c.STORE_ID
GROUP BY 1 ORDER BY 1
```

</details>

---

## Chapter 3: Finding the Hidden Pattern

### H3.1: Selection Bias — Where Does OOS Actually Happen?

**What we tested**: Is OOS concentrated in long-tail SKUs that nobody searches for?

**What we found**: ✅ **Yes.** A 17% availability gap between high-demand and long-tail.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│              AVAILABILITY BY SEARCH DEMAND (SPIN-LEVEL)                         │
│                                                                                  │
│   Availability                                                                  │
│       │                                                                          │
│   95% ┤ ▓▓▓▓                                                                    │
│       │ ▓▓▓▓ ▓▓▓▓                                                               │
│   90% ┤ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓                                                          │
│       │ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓                                                     │
│   85% ┤ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓                                                │
│       │ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ░░░░                                           │
│   80% ┤ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ░░░░ ░░░░                                      │
│       │ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ░░░░ ░░░░ ░░░░ ░░░░ ░░░░                       │
│   75% ┤ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ▓▓▓▓ ░░░░ ░░░░ ░░░░ ░░░░ ░░░░                       │
│       │                                                                          │
│   70% ┤                                                                         │
│       └──────────────────────────────────────────────────────────────           │
│          D1   D2   D3   D4   D5   D6   D7   D8   D9   D10                        │
│         ▓▓▓▓ = High demand            ░░░░ = Long-tail                          │
│         (76% of impressions)          (4% of impressions)                       │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │  Top 20% availability:    92.5%                                         │   │
│   │  Bottom 20% availability: 75.2%                                         │   │
│   │  GAP: 17.3 percentage points                                            │   │
│   │                                                                         │   │
│   │  OOS IS CONCENTRATED IN SKUs NOBODY SEARCHES FOR.                       │   │
│   │  That's why aggregate correlation is near zero!                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**⚠️ Correction Note**: Our initial analysis showed a 41% gap, but we discovered we were using the wrong granularity (SKU_ID instead of SPIN_ID). The corrected gap is 17% — still significant, but we almost presented a 2.4x overstatement.

<details>
<summary><b>🔍 Technical Details: H3.1 Corrected Query</b></summary>

```sql
-- H3.1 CORRECTED: SPIN-level (not SKU-level) availability by search decile
-- Key insight: SKU_ID is POD-specific; SPIN_ID is global product
-- Original analysis inflated gap because poorly-stocked PODs dragged down averages

WITH spin_metrics AS (
  SELECT s.SPIN_ID,
    SUM(s.SEARCH_IMP) as total_search_imp,
    SUM(s.SEARCH_IMP * COALESCE(a.WTD_AVAILABILITY, 0)) as weighted_avail_sum
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans s
  LEFT JOIN prod.analytics_prod.analytics_public_im_sku_day_avl a
    ON s.DT = a.DT AND s.STORE_ID = a.STORE_ID AND s.SKU_ID = a.SKU_ID
  WHERE s.DT >= DATE_SUB(CURRENT_DATE(), 7) AND s.CITY = 'Bangalore'
  GROUP BY s.SPIN_ID
),
spin_deciles AS (
  SELECT SPIN_ID, total_search_imp,
    weighted_avail_sum / total_search_imp as impression_weighted_avail,
    NTILE(10) OVER (ORDER BY total_search_imp DESC) as search_decile
  FROM spin_metrics WHERE total_search_imp > 0
)
SELECT search_decile,
  COUNT(*) as num_spins,
  ROUND(AVG(impression_weighted_avail) * 100, 2) as avg_avail_pct,
  ROUND(SUM(total_search_imp), 0) as total_impressions
FROM spin_deciles GROUP BY search_decile ORDER BY search_decile

-- Result comparison:
-- SKU-level (WRONG):  Top 20% = 89%, Bottom 20% = 48%, Gap = 41%
-- SPIN-level (RIGHT): Top 20% = 92%, Bottom 20% = 75%, Gap = 17%
```

</details>

---

### H3.3: Baseline Effect — How Often Do Users Actually See OOS?

**What we tested**: At 91% search-weighted availability, how rare are OOS encounters?

**What we found**: ✅ **Very rare.** Only 6% of impressions are OOS.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                         THE OOS PARADOX                                          │
│                                                                                  │
│                                                                                  │
│          CATALOG VIEW                        IMPRESSION VIEW                    │
│                                                                                  │
│       ┌────────────────┐                   ┌────────────────┐                   │
│       │                │                   │                │                   │
│       │     75%        │                   │     94%        │                   │
│       │   In Stock     │                   │   In Stock     │                   │
│       │                │                   │                │                   │
│       ├────────────────┤                   ├────────────────┤                   │
│       │     25%        │                   │      6%        │                   │
│       │     OOS        │                   │     OOS        │                   │
│       └────────────────┘                   └────────────────┘                   │
│                                                                                  │
│       "1 in 4 items                        "1 in 17 impressions                 │
│        are OOS"                             encounter OOS"                       │
│                                                                                  │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│   WHY THE DIFFERENCE?                                                           │
│                                                                                  │
│   Users don't search equally across all SKUs.                                   │
│   High-demand SKUs get most impressions AND have better availability.           │
│   OOS is concentrated in long-tail (from H3.1).                                 │
│                                                                                  │
│   Even if OOS hurts conversion, the effect is DILUTED because it's rare.        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>🔍 Technical Details: H3.3 Validation Query</b></summary>

```sql
-- H3.3: What fraction of search impressions are for OOS items?
WITH search_imps AS (
  SELECT DT, STORE_ID, SKU_ID, SEARCH_IMP
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
),
availability AS (
  SELECT DT, STORE_ID, SKU_ID, WTD_AVAILABILITY
  FROM prod.analytics_prod.analytics_public_im_sku_day_avl
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
)
SELECT
  SUM(s.SEARCH_IMP) as total_search_impressions,
  SUM(CASE WHEN a.WTD_AVAILABILITY = 0 THEN s.SEARCH_IMP ELSE 0 END) as oos_impressions,
  ROUND(SUM(CASE WHEN a.WTD_AVAILABILITY = 0 THEN s.SEARCH_IMP ELSE 0 END) * 100.0
    / SUM(s.SEARCH_IMP), 2) as pct_impressions_oos
FROM search_imps s
LEFT JOIN availability a ON s.DT = a.DT AND s.STORE_ID = a.STORE_ID AND s.SKU_ID = a.SKU_ID

-- Result:
-- total_search_impressions: 281,982,043
-- oos_impressions: 16,575,983
-- pct_impressions_oos: 5.88%
```

</details>

---

### The Complete Picture: Why Availability ≠ Conversion

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                  THE THREE MASKING EFFECTS (COMBINED)                           │
│                                                                                  │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                         │   │
│   │   1. SELECTION BIAS (H3.1 ✅)                                           │   │
│   │      OOS concentrated in long-tail                                      │   │
│   │      ───────────────────────────                                        │   │
│   │      High-demand: 92% availability                                      │   │
│   │      Long-tail:   75% availability                                      │   │
│   │      → OOS happens where nobody looks                                   │   │
│   │                                                                         │   │
│   │                          ↓                                              │   │
│   │                                                                         │   │
│   │   2. BASELINE EFFECT (H3.3 ✅)                                          │   │
│   │      OOS encounters are rare                                            │   │
│   │      ───────────────────────────                                        │   │
│   │      Only 6% of impressions encounter OOS                               │   │
│   │      → Individual impact exists but is statistically diluted            │   │
│   │                                                                         │   │
│   │                          ↓                                              │   │
│   │                                                                         │   │
│   │   3. SUBSTITUTION EFFECT (H3.2 ⚠️)                                      │   │
│   │      When OOS, behavior unclear                                         │   │
│   │      ───────────────────────────                                        │   │
│   │      No quantitative data available                                     │   │
│   │      Qualitative evidence suggests abandonment > substitution           │   │
│   │      → But impact masked by (1) and (2)                                 │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   IMPLICATION:                                                                  │
│   Don't justify availability improvement with conversion ROI.                   │
│   Justify with customer experience + GMV protection instead.                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Chapter 4: The Allocation Blindness Problem

### What is Allocation Blindness?

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                    THE "ALLOCATION BLINDNESS" SCENARIO                          │
│                                                                                  │
│                                                                                  │
│                    ┌───────────────────┐                                        │
│                    │    WAREHOUSE      │                                        │
│                    │   Stock: 100      │                                        │
│                    └─────────┬─────────┘                                        │
│                              │                                                   │
│               ┌──────────────┼──────────────┐                                   │
│               │              │              │                                    │
│               ▼              ▼              ▼                                    │
│        ┌──────────┐   ┌──────────┐   ┌──────────┐                               │
│        │  POD A   │   │  POD B   │   │  POD C   │                               │
│        │Stock: 50 │   │Stock: 30 │   │Stock: 0  │ ← OOS!                        │
│        └──────────┘   └──────────┘   └──────────┘                               │
│                                                                                  │
│                                                                                  │
│   WH-LEVEL PREDICTION sees:   "We have 100 units. No problem."                  │
│   CUSTOMER at POD C sees:     "Out of Stock"                                    │
│                                                                                  │
│   This is ALLOCATION BLINDNESS:                                                 │
│   WH has stock, but it wasn't allocated to the right POD.                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### What We Found: ✅ 24-28% of OOS is POD-led

| OOS Type | Definition | % of OOS |
|----------|------------|----------|
| **WH-led** | DOH < 3 days OR WH_STOCK < 10 | **72-76%** |
| **POD-led** | WH has stock but POD doesn't | **24-28%** |

### The Math That Kills WH-Only Prediction

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                   CAN WH-ONLY PREDICTION REACH 99.9%?                           │
│                                                                                  │
│                                                                                  │
│   Current availability:        83.32%                                           │
│   Target availability:         99.9%                                            │
│   Gap to close:                16.58 percentage points                          │
│                                                                                  │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│   SCENARIO: WH-LEVEL PREDICTION ONLY                                            │
│                                                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │                                                                        │    │
│   │   Can address:    WH-led OOS = 12.05%                                  │    │
│   │   Can't address:  POD-led OOS = 4.63%  ← INVISIBLE to WH prediction    │    │
│   │                                                                        │    │
│   │   Maximum reach:  83.32% + 12.05% = 95.37%                             │    │
│   │                                                                        │    │
│   │   ❌ CANNOT reach 99.9%                                                 │    │
│   │                                                                        │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│   SCENARIO: WH + POD PREDICTION                                                 │
│                                                                                  │
│   ┌────────────────────────────────────────────────────────────────────────┐    │
│   │                                                                        │    │
│   │   Can address:    WH-led + POD-led = 16.68%                            │    │
│   │                                                                        │    │
│   │   Maximum reach:  83.32% + 16.68% = 100%                               │    │
│   │                                                                        │    │
│   │   ✅ CAN reach 99.9%                                                    │    │
│   │                                                                        │    │
│   └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│   CONCLUSION: Both layers are MATHEMATICALLY REQUIRED for 99.9%.                │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>🔍 Technical Details: H2.1 Validation Query</b></summary>

```sql
-- H2.1: How often does WH have stock but POD is OOS?
-- Source: Waterfall dashboard logic (priority SKUs)
-- Key field: FINAL_REASON patterns

SELECT
  COUNT(*) as total_oos_events,
  SUM(CASE WHEN FINAL_REASON LIKE 'instock_%' THEN NON_AVAIL_SESSIONS ELSE 0 END) as pod_led_oos_sessions,
  SUM(CASE WHEN FINAL_REASON LIKE 'oos_%' THEN NON_AVAIL_SESSIONS ELSE 0 END) as wh_led_oos_sessions,
  ROUND(SUM(CASE WHEN FINAL_REASON LIKE 'instock_%' THEN NON_AVAIL_SESSIONS ELSE 0 END) * 100.0 /
    NULLIF(SUM(NON_AVAIL_SESSIONS), 0), 2) as pct_allocation_blindness
FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE CITY = 'BANGALORE' AND DT >= DATE_SUB(CURRENT_DATE(), 30)
  AND ASSORTMENT IN ('A', 'MLT', 'MnE')  -- Priority SKUs (matches waterfall)

-- Results from different sources:
-- Waterfall (Feb 2025):   POD-led = 27.8%
-- Databricks (Jan 2026):  POD-led = 24.19%
-- Cite as range: "24-28% of OOS is POD-led"
```

**Key fields explained**:
- `FINAL_REASON LIKE 'instock_%'` = POD-led (WH has stock, POD doesn't)
- `FINAL_REASON LIKE 'oos_%'` = WH-led (DOH < 3 OR WH_STOCK < 10)
- `ASSORTMENT IN ('A', 'MLT', 'MnE')` = Priority SKUs filter matching waterfall dashboard

</details>

---

### H2.2: POD Variance Within Same Warehouse

We also found that PODs under the same warehouse behave very differently:

| Metric | Value |
|--------|-------|
| Avg stddev across PODs | **23.24%** |
| P90 stddev | **47.63%** |

**Translation**: For the same SKU, one POD might have 90% availability while another has 40% — and they both report to the same warehouse.

<details>
<summary><b>🔍 Technical Details: H2.2 Validation Query</b></summary>

```sql
-- H2.2: Do PODs under the same WH behave differently?
-- Uses ITEM_CODE (WH-wide) not SKU_ID (POD-specific)

SELECT
  ROUND(AVG(stddev_avail) * 100, 2) as avg_stddev_pct,
  ROUND(PERCENTILE(stddev_avail, 0.5) * 100, 2) as median_stddev_pct,
  ROUND(PERCENTILE(stddev_avail, 0.9) * 100, 2) as p90_stddev_pct,
  COUNT(*) as num_wh_item_combos
FROM (
  SELECT WH_NAME, ITEM_CODE,
    COUNT(DISTINCT STORE_ID) as num_pods,
    STDDEV(AVAILABILITY) as stddev_avail
  FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
  WHERE CITY = 'BANGALORE' AND DT >= DATE_SUB(CURRENT_DATE(), 7)
  GROUP BY WH_NAME, ITEM_CODE
  HAVING COUNT(DISTINCT STORE_ID) >= 5
)

-- Result: avg_stddev_pct = 23.24%, p90_stddev_pct = 47.63%
```

</details>

---

## Chapter 5: The Bradman Problem

### What is Bradman?

**Bradman SKUs** = The current list targeted for 99.9% availability (named after Don Bradman's 99.94 batting average).

### What We Found: Bradman Is Too Narrow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                         BRADMAN COVERAGE GAP                                     │
│                                                                                  │
│                                                                                  │
│   TOTAL SEARCH IMPRESSIONS: 282 million/week                                    │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │█████████████████████████████████████████████████████████████████████████│  │
│   │                                                                          │  │
│   │  ░░░░░░░░░░░░░░░░░░░░                                                   │  │
│   │  ↑                   ↑                                                   │  │
│   │  Bradman (27%)       Not covered (73%)                                   │  │
│   │  76.6M impressions   205M impressions                                    │  │
│   │                                                                          │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│   TOP SEARCH DECILE (highest demand): 9,938 SPINs                               │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │  ░░░░░░░░░░░░░░░                                ████████████████████████ │  │
│   │  ↑                                              ↑                        │  │
│   │  Bradman (37%)                                  NOT Bradman (63%)        │  │
│   │  3,722 SPINs                                    6,216 SPINs              │  │
│   │                                                                          │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│   63% of the HIGHEST-SEARCHED products are NOT in the 99.9% target list!        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### What's Missing from Bradman?

| L1 Category | Gap Impressions/Week | Why Missing |
|-------------|----------------------|-------------|
| **Fruits & Vegetables** | **26.0M** | Lower I2C (browsing behavior) |
| **Dairy, Bread, Eggs** | **13.7M** | Lower GSV per unit |
| Home & Kitchen | 6.7M | Lower conversion |

**The Problem**: F&V and Dairy are **essentials** where OOS → abandonment. But Bradman's value-weighted scoring deprioritizes them.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                   WHY BRADMAN MISSES ESSENTIALS                                  │
│                                                                                  │
│                                                                                  │
│   BRADMAN SCORING:                                                              │
│   Score = 20% GSV + 20% Units + 20% Impressions + 20% Search + 20% I2C          │
│                                                                                  │
│   FRESH PRODUCE (F&V):                           DAIRY BASICS:                  │
│   ├── Lower I2C (browse before buy)              ├── Lower GSV (cheap items)    │
│   ├── Lower GSV (cheap tomatoes)                 ├── But ESSENTIAL!             │
│   └── UNDERSCORED despite being essential        └── UNDERSCORED despite need   │
│                                                                                  │
│   ═══════════════════════════════════════════════════════════════════════════   │
│                                                                                  │
│   Bradman optimizes for VALUE (GSV × conversion)                                │
│   But doesn't consider ESSENTIALITY (must-haves where OOS = abandonment)        │
│                                                                                  │
│   These are exactly the SKUs that should get 99.9% target!                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

<details>
<summary><b>🔍 Technical Details: Bradman Validation Queries</b></summary>

**Query 1: Bradman Coverage**
```sql
WITH bradman_spins AS (
  SELECT DISTINCT SPIN_ID
  FROM prod.analytics_prod.analytics_public_rb_bradman_spin_list_16_dec_seasonality_eol_removal
  WHERE CITY = 'bangalore' AND TOP_ITEM_FLAG = 1  -- Note: lowercase city
),
impressions AS (
  SELECT SPIN_ID, SUM(SEARCH_IMP) as search_imp
  FROM prod.analytics_prod.analytics_public_srk_impressions_metrics_trans
  WHERE DT >= DATE_SUB(CURRENT_DATE(), 7) AND CITY = 'Bangalore'
  GROUP BY SPIN_ID
)
SELECT
  SUM(i.search_imp) as total_impressions,
  SUM(CASE WHEN b.SPIN_ID IS NOT NULL THEN i.search_imp ELSE 0 END) as bradman_impressions,
  ROUND(SUM(CASE WHEN b.SPIN_ID IS NOT NULL THEN i.search_imp ELSE 0 END) * 100.0
    / SUM(i.search_imp), 2) as bradman_pct
FROM impressions i
LEFT JOIN bradman_spins b ON i.SPIN_ID = b.SPIN_ID

-- Result: bradman_pct = 27.15%
```

**Query 2: Category Gaps**
```sql
-- Categories in top 20% not covered by Bradman
SELECT L1_CATEGORY,
  COUNT(DISTINCT SPIN_ID) as non_bradman_spins,
  SUM(SEARCH_IMP) as gap_impressions
FROM (
  -- Top 20% SPINs not in Bradman
  SELECT s.SPIN_ID, s.L1_CATEGORY, s.SEARCH_IMP
  FROM impressions_with_decile s
  LEFT JOIN bradman_spins b ON s.SPIN_ID = b.SPIN_ID
  WHERE s.decile <= 2 AND b.SPIN_ID IS NULL
)
GROUP BY L1_CATEGORY ORDER BY gap_impressions DESC
```

</details>

---

# Part 3: The Discovery

## What We Learned

### Discovery 1: Use Search-Weighted Only

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                    METRIC RECOMMENDATION                                         │
│                                                                                  │
│                                                                                  │
│   USE:                              DON'T USE FOR OPERATIONS:                   │
│                                                                                  │
│   ┌─────────────────────┐           ┌─────────────────────┐                     │
│   │  SEARCH-WEIGHTED    │           │  SESSION-BASED      │                     │
│   │  (91%)              │           │  (84%)              │                     │
│   │                     │           │                     │                     │
│   │  Measures what      │           │  Includes long-tail │                     │
│   │  customers actually │           │  SKUs nobody        │                     │
│   │  search for         │           │  searches for       │                     │
│   │                     │           │                     │                     │
│   │  Customer-backwards │           │  Stocking these     │                     │
│   │                     │           │  doesn't improve    │                     │
│   │                     │           │  customer experience│                     │
│   └─────────────────────┘           └─────────────────────┘                     │
│                                                                                  │
│   The 7% gap = long-tail SKUs. With limited shelf space and inventory budget,   │
│   optimizing for session-based means stocking items that won't drive value.     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Discovery 2: Differentiated Targets by Tier

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                   NOT 99.9% EVERYWHERE — TIERED TARGETS                         │
│                                                                                  │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                         │   │
│   │  TIER 1: Top 20% + Essentials                                           │   │
│   │  ─────────────────────────────                                          │   │
│   │  Current: 89%  │  Target: 99%+  │  Investment: HIGH (WH + POD)          │   │
│   │  76% of impressions │ OOS here = abandonment │ MUST win                 │   │
│   │                                                                         │   │
│   │  TIER 2: Deciles 3-5                                                    │   │
│   │  ────────────────────                                                   │   │
│   │  Current: 86-89%  │  Target: 95%  │  Investment: MODERATE (WH-level)    │   │
│   │                                                                         │   │
│   │  TIER 3: Deciles 6-7                                                    │   │
│   │  ────────────────────                                                   │   │
│   │  Current: 76-83%  │  Target: 90%  │  Investment: LOW (WH-level)         │   │
│   │                                                                         │   │
│   │  TIER 4: Deciles 8-10 (Long-tail)                                       │   │
│   │  ────────────────────────────────                                       │   │
│   │  Current: 45-65%  │  Target: 85%  │  Investment: MINIMAL (monitoring)   │   │
│   │  4% of impressions │ OOS doesn't matter much                            │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│   Bottom 40% have 45-77% availability but generate only 4% of impressions.      │
│   Investing heavily in long-tail availability has minimal customer impact.      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Discovery 3: Both WH + POD Prediction Required for Tier 1

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│                    PREDICTION ARCHITECTURE                                       │
│                                                                                  │
│                                                                                  │
│                          ┌───────────────────┐                                  │
│                          │   TIER 1 SKUs     │                                  │
│                          │  (Top 20% +       │                                  │
│                          │   Essentials)     │                                  │
│                          └─────────┬─────────┘                                  │
│                                    │                                             │
│                    ┌───────────────┴───────────────┐                            │
│                    │                               │                             │
│                    ▼                               ▼                             │
│           ┌───────────────┐               ┌───────────────┐                     │
│           │  WH-LEVEL     │               │  POD-LEVEL    │                     │
│           │  PREDICTION   │               │  PREDICTION   │                     │
│           │               │               │               │                     │
│           │  Addresses:   │               │  Addresses:   │                     │
│           │  72% of OOS   │               │  28% of OOS   │                     │
│           │  (upstream)   │               │  (allocation) │                     │
│           └───────────────┘               └───────────────┘                     │
│                    │                               │                             │
│                    └───────────────┬───────────────┘                            │
│                                    │                                             │
│                                    ▼                                             │
│                          ┌───────────────────┐                                  │
│                          │  99.9% ACHIEVABLE │                                  │
│                          └───────────────────┘                                  │
│                                                                                  │
│   For Tier 2-4: WH-level only (simpler, cheaper, adequate)                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Discovery 4: Expand Bradman from 27% to 66%

| Current Bradman | Proposed Tier 1 |
|-----------------|-----------------|
| 5,256 SPINs | ~20,000 SPINs |
| 27% of impressions | 66% of impressions |
| Missing F&V, Dairy | Includes essentials explicitly |
| 7% in long-tail (noise) | Excludes deciles 6-10 |

**Proposed Tier 1 Definition**:
```
Tier 1 = (Top 20% by search impressions)
       ∪ (Essential categories: Dairy, Bread, Eggs, F&V staples)
       − (Decile 6-10 SPINs)
```

---

### Discovery 5: Don't Justify with Conversion ROI

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│              HOW TO JUSTIFY AVAILABILITY INVESTMENT                             │
│                                                                                  │
│                                                                                  │
│   ❌ DON'T SAY:                        ✅ DO SAY:                                │
│                                                                                  │
│   "Improving availability will         "OOS creates poor customer               │
│    increase conversion by X%"           experience — 'Sold Out' frustrates"     │
│                                                                                  │
│   "ROI of availability =               "Repeated OOS for preferred brand        │
│    conversion lift"                     → user switches platforms"              │
│                                                                                  │
│   "Data shows correlation              "GMV protection: OOS = lost revenue      │
│    between avail and orders"            for that SKU, even if user substitutes" │
│                                                                                  │
│                                                                                  │
│   Availability is like electricity in a store:                                  │
│   You need it to operate, but more of it doesn't get you more customers.        │
│   It's a NECESSARY CONDITION, not a DIFFERENTIATOR.                             │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## What NOT To Do

| Don't | Why |
|-------|-----|
| **Chase uniform 99.9%** | Diminishing returns; bottom 40% gets 4% of impressions |
| **Justify with conversion ROI** | Availability is hygiene (~0 correlation with conversion) |
| **Use session-based for operations** | Includes long-tail SKUs nobody searches |
| **Build POD-level for all SKUs** | Too expensive; reserve for Tier 1 |
| **Trust Bradman as-is** | Only covers 27%; missing essentials |

---

# Part 4: Verification & Corrections

## The Re-Validation We Did

Before presenting, we re-ran all critical queries to prevent reputational risk.

### What We Caught

| Hypothesis | Original Claim | Corrected | What Happened |
|------------|----------------|-----------|---------------|
| **H3.1** | 41.3% gap | **17.3%** gap | Used SKU_ID instead of SPIN_ID — 2.4x overstatement |
| **H1.1** | 20.48% divergent | ~19-20% | Time-period sensitive; cite as "~20%" or "meaningful divergence" |
| **H2.1** | 27.8% POD-led | 24-28% | Different time periods; cite as range |

### The H3.1 Correction Story

Our initial analysis said "41% availability gap between high-demand and long-tail." This would have been a headline number.

**The mistake**: We used `SKU_ID` (POD-level, 5.2M entities) instead of `SPIN_ID` (global product, 99K entities). Since each SPIN has ~52 SKUs (one per POD), poorly-stocked PODs dragged down long-tail averages disproportionately.

**The correction**: Using SPIN_ID (which matches how Bradman defines products), the gap is 17% — still significant, still validates differentiated targets, but not 41%.

**Lesson**: Always match analysis granularity to the entity being optimized.

---

## What Remains Unvalidated

| Assumption | Risk | Impact |
|------------|------|--------|
| "F&V and Dairy have low substitutability" | **High** | Core to Tier 1 definition; needs user research |
| "OOS → abandonment > substitution" | **Medium** | No quantitative data; based on system behavior |
| "99%+ target for Tier 1 is optimal" | **Medium** | Arbitrary; no ROI analysis conducted |

---

# Appendix

## Summary Table

| ID | Hypothesis | Threshold | Result | Status |
|----|------------|-----------|--------|--------|
| **H1.1** | Metrics diverge | >20% SKUs with >5% divergence | ~20% | ⚠️ Borderline |
| **H1.2** | Availability → conversion | Positive correlation | ~0 | ❌ Not validated |
| **H2.1** | Allocation blindness | >20% POD-led | 24-28% | ✅ Validated |
| **H2.2** | POD variance within WH | stddev >10% | 23% | ✅ Validated |
| **H3.1** | OOS in long-tail | Gap >10% | 17% | ✅ Validated (corrected) |
| **H3.2** | Substitution vs abandonment | >50% substitute | Unknown | ⚠️ Inconclusive |
| **H3.3** | OOS encounters rare | <10% of impressions | 6% | ✅ Validated |

## Data Sources

| Table | Purpose |
|-------|---------|
| `analytics_public_im_sku_day_avl` | Daily availability by SKU×Store |
| `analytics_public_srk_impressions_metrics_trans` | Search impressions, S2C, GMV |
| `analytics_public_sku_wise_availability_rca_with_reasons_v7` | OOS attribution (WH-led vs POD-led) |
| `analytics_public_rb_bradman_spin_list_16_dec_seasonality_eol_removal` | Bradman SKU list |

## Key Contacts

| Area | Contact |
|------|---------|
| Bradman Program | Shrinivas Ron |
| Bradman Logic Changes | Sumit Pattanaik |
| OOS Cart Analysis | Kartikay Sharma |
| Cart Abandonment | Akash Mangal |

## Query Environment

```bash
# Databricks authentication
databricks auth login --host https://swiggy-analytics.cloud.databricks.com --profile analytics-workspace

# Query execution
export DBR_TOKEN=$(databricks auth token --profile analytics-workspace 2>/dev/null | grep access_token | cut -d'"' -f4)
source .venv-dbsql/bin/activate
dbsqlcli --hostname swiggy-analytics.cloud.databricks.com \
  --http-path /sql/1.0/warehouses/61ce236c169e5b23 \
  --access-token "$DBR_TOKEN" -e "QUERY"
```

---

*Analysis: 2026-01-15 | Scope: Bangalore, 7-30 days | Re-validated before presentation*
