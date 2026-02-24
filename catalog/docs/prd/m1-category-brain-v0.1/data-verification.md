# Instamart Search & Sales - Data Verification Request

**Date**: 2026-02-06
**Context**: We ran a set of analytical queries on Jan 30, 2026 to generate category-level trend insights for Personal Care (L1s: Bath Body and Hair, Beauty and Grooming, Hygiene and Wellness, Makeup). This document lists every query executed, the tables and columns used, sample output, and the data issues / open questions we need the analytics team to help verify.

**L1 categories used across all queries**: `bath body and hair`, `beauty and grooming`, `hygiene and wellness`, `makeup`

---

## Table of Contents

1. [Tables Used - Summary](#1-tables-used---summary)
2. [Query 1: Search Volume 3-Month MoM](#2-query-1-search-volume-3-month-mom)
3. [Query 2: Search Type Segmentation](#3-query-2-search-type-segmentation)
4. [Query 3: YoY Search Seasonality](#4-query-3-yoy-search-seasonality)
5. [Query 4: L2-Level Sales 3-Month MoM](#5-query-4-l2-level-sales-3-month-mom)
6. [Query 5: SKU Ratings](#6-query-5-sku-ratings)
7. [Query 6: SKU Pricing](#7-query-6-sku-pricing)
8. [Query 7: Brand Emergence](#8-query-7-brand-emergence)
9. [Query 8: SKU Tags / Master Attributes](#9-query-8-sku-tags--master-attributes)
10. [Cross-System ID Mapping (Verified)](#10-cross-system-id-mapping-verified)
11. [Data Issues Found](#11-data-issues-found)
12. [Questions for Analytics Team](#12-questions-for-analytics-team)

---

## 1. Tables Used - Summary

### Snowflake (`ANALYTICS.PUBLIC`)

| # | Table | What We Used It For | Columns Used |
|---|-------|-------------------|--------------|
| 1 | `IM_SEARCH_DB_SS` | Search volume MoM trends, YoY seasonality | `SEARCH_STRING`, `L1_CATEGORY`, `L2_CATEGORY`, `IMPRESSIONS`, `TYPE`, `DT` |
| 2 | `IM_SEARCH_FACT` | Search type segmentation (typed vs autosuggest) | `SEARCH_STRING`, `SESSION_ID`, `DT` |
| 3 | `AUTOSUGGEST_FACT` | Joined with IM_SEARCH_FACT for search type | `SID`, `SRP_ACTION`, `TAB`, `DT` |
| 4 | `IM_CATEGORY_METRICS_L2_SUMMARY` | L2-level sales MoM trends | `L1_CATEGORY`, `L2_CATEGORY`, `GMV_ADJUSTED`, `TOTAL_QUANTITY`, `A2C`, `S2C`, `GROSS_MARGIN`, `DT` |
| 5 | `IM_ITEM_SALES_DAILY` | Bridge table to look up SKU IDs by category | `SKU_ID`, `ITEM_CODE`, `PROD_NAME`, `BRAND`, `ITEM_CATEGORY`, `L1_CATEGORY`, `DT` |
| 6 | ~~`AJ_ITEM_RATINGS_XP`~~ → **`IM_ITEM_RATINGS_SS`** | SKU-level ratings | `ITEM_ID`, `AVG_RATING`, `RATING_COUNT` (snapshot, no DT partition) |
| 7 | ~~`SL_IM_ITEMS_PRICING_DATA_HISTORY`~~ → **moved to Databricks** | SKU-level pricing (MRP, selling price) | See Databricks table #10 below |
| 8 | `IM_BRAND_CATEGORY_SALES` | Brand-level sales for emergence detection | `BRAND_NAME`, `L1_CATEGORY`, `L2_CATEGORY`, `GMV_ADJUSTED`, `TOTAL_QUANTITY`, `CITY`, `DT` |

### Databricks (`prod.analytics_prod`)

| # | Table | What We Used It For | Columns Used |
|---|-------|-------------------|--------------|
| 9 | `im_spins_master` | SKU master attributes (pack size, item type) | `spin_id`, `item_code`, `product_name`, `brand`, `l1_category`, `l2_category`, `pack_of`, `uom_qty`, `sp_type`, `item_type` |
| 10 | **`im_pricing_data_store_level`** | SKU-level pricing (MRP, selling price) — **P0 table** (13-month TTL) | `sku_id`, `spin_id`, `mrp`, `selling_price`, `store_id`, `dt` |
| 11 | `im_store_sku_spin_mapping` | Store-SKU-SPIN bridge; assortment tiers (TOP_100 etc.) | `store_id`, `sku_id`, `spin_id`, `item_code`, `TOP_100`, `TOP_250`, `ASSORTMENT` |

---

## 2. Query 1: Search Volume 3-Month MoM

**Source**: Snowflake
**Table**: `ANALYTICS.PUBLIC.IM_SEARCH_DB_SS`
**Purpose**: Get top 200 search terms by volume with 3-month MoM growth trends
**Date ranges**:
- M0 (current): `DATEADD('day', -28, CURRENT_DATE)` to `CURRENT_DATE - 1` → Jan 2 - Jan 29, 2026
- M1 (previous): `DATEADD('day', -56, CURRENT_DATE)` to `DATEADD('day', -29, CURRENT_DATE)` → Dec 5, 2025 - Jan 1, 2026
- M2 (2 months ago): `DATEADD('day', -84, CURRENT_DATE)` to `DATEADD('day', -57, CURRENT_DATE)` → Nov 7 - Dec 4, 2025

### Query Executed

```sql
WITH month_0 AS (
    SELECT
        SEARCH_STRING,
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(IMPRESSIONS) AS volume,
        SUM(CASE WHEN TYPE = 'NULL_SS' THEN IMPRESSIONS ELSE 0 END) * 100.0
            / NULLIF(SUM(IMPRESSIONS), 0) AS zero_result_rate
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
    WHERE DT BETWEEN DATEADD('day', -28, CURRENT_DATE) AND CURRENT_DATE - 1
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                            'hygiene and wellness', 'makeup')
    GROUP BY 1, 2, 3
    HAVING SUM(IMPRESSIONS) >= 500
),
month_1 AS (
    SELECT
        SEARCH_STRING, L1_CATEGORY, L2_CATEGORY,
        SUM(IMPRESSIONS) AS volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
    WHERE DT BETWEEN DATEADD('day', -56, CURRENT_DATE)
                 AND DATEADD('day', -29, CURRENT_DATE)
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                            'hygiene and wellness', 'makeup')
    GROUP BY 1, 2, 3
),
month_2 AS (
    SELECT
        SEARCH_STRING, L1_CATEGORY, L2_CATEGORY,
        SUM(IMPRESSIONS) AS volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
    WHERE DT BETWEEN DATEADD('day', -84, CURRENT_DATE)
                 AND DATEADD('day', -57, CURRENT_DATE)
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                            'hygiene and wellness', 'makeup')
    GROUP BY 1, 2, 3
)
SELECT
    m0.SEARCH_STRING,
    m0.L1_CATEGORY,
    m0.L2_CATEGORY,
    m0.volume AS m0_volume,
    ROUND(m0.zero_result_rate, 2) AS zero_result_rate,
    m1.volume AS m1_volume,
    m2.volume AS m2_volume,
    ROUND((m0.volume - COALESCE(m1.volume, 0)) * 100.0
        / NULLIF(m1.volume, 0), 2) AS m0_vs_m1_growth_pct,
    ROUND((COALESCE(m1.volume, 0) - COALESCE(m2.volume, 0)) * 100.0
        / NULLIF(m2.volume, 0), 2) AS m1_vs_m2_growth_pct,
    ROUND((POWER(m0.volume::FLOAT / NULLIF(m2.volume, 0), 0.5) - 1) * 100, 2)
        AS two_period_cagr_pct,
    -- trend_direction and trend_stability_score CASE statements (see below)
FROM month_0 m0
LEFT JOIN month_1 m1 ON m0.SEARCH_STRING = m1.SEARCH_STRING
    AND m0.L1_CATEGORY = m1.L1_CATEGORY AND m0.L2_CATEGORY = m1.L2_CATEGORY
LEFT JOIN month_2 m2 ON m0.SEARCH_STRING = m2.SEARCH_STRING
    AND m0.L1_CATEGORY = m2.L1_CATEGORY AND m0.L2_CATEGORY = m2.L2_CATEGORY
WHERE m0.volume >= 500
ORDER BY m0.volume DESC
LIMIT 200;
```

### Trend Direction Logic (used in this query and in Query 4)

```sql
CASE
    WHEN m0 > m1 AND m1 > m2 THEN 'stable_up'
    WHEN m0 > m1 AND m1 <= m2 THEN 'accelerating'
    WHEN m0 <= m1 AND m1 > m2 THEN 'decelerating'
    WHEN m0 < m1  AND m1 < m2 THEN 'stable_down'
    ELSE 'volatile'
END AS trend_direction
```

### Sample Output (top 5 rows)

| SEARCH_STRING | L1_CATEGORY | L2_CATEGORY | M0_VOLUME | ZERO_RESULT_RATE | M1_VOLUME | M2_VOLUME | M0_VS_M1_GROWTH_PCT | TREND_DIRECTION | TREND_STABILITY_SCORE |
|---|---|---|---|---|---|---|---|---|---|
| condom | hygiene and wellness | sexual wellness | 551,578 | 0.01 | 483,803 | 110,738 | 14.01 | stable_up | 100 |
| shampoo | bath body and hair | shampoo and conditioner | 524,644 | 0.02 | 468,059 | 556,548 | 12.09 | accelerating | 75 |
| toothbrush | hygiene and wellness | oral care | 512,669 | 0.00 | 502,755 | 511,489 | 1.97 | accelerating | 75 |
| toothpaste | hygiene and wellness | oral care | 510,868 | 0.00 | 507,776 | 550,307 | 0.61 | accelerating | 75 |

### Columns & Assumptions — VERIFIED

| Column | Our Assumption | Verified Answer | Source |
|--------|---------------|-----------------|--------|
| `IMPRESSIONS` | Represents search volume (number of times a term was searched) | **VERIFIED: Search session count per dimension slice.** ETL: `COUNT(IMP_SID) AS IMPRESSIONS` for TOP_SS, `SUM(SESSIONS)` for NULL_SS. Each row is a dimension combination (CITY × CUSTOMER_SEGMENT × NEW_REPEAT_IM × BUSINESS_CATEGORY). `SUM(IMPRESSIONS)` across rows gives total search sessions — our approach is correct. | ETL pipeline code |
| `TYPE` | `'NULL_SS'` means zero-result search (no products found) | **VERIFIED CORRECT.** ETL: `NULL_SEARCH = 1` where `item_widgets IS NULL AND ban_flag = 'NO' AND page_number = '0'`. Other TYPE values: `TOP_SS` (results found), percentile ranking buckets (`Between 50% and 70%`, etc.), `OVERALL*` (7 daily aggregate rows). **Must filter `TYPE IN ('TOP_SS', 'NULL_SS')` to exclude percentile buckets and OVERALL aggregates.** | ETL pipeline code + Snowflake query |
| `L1_CATEGORY`, `L2_CATEGORY` | Pre-mapped on this table (each search string already tagged to a category) | **VERIFIED STABLE.** Tested 6 high-volume terms over 28 days — zero cases of a search string mapping to multiple L1/L2 categories. Safe to assume 1:1 mapping. | Snowflake query |
| `DT` | Daily partition | **VERIFIED: 89-day retention** (Nov 8, 2025 - Feb 5, 2026). Per-pipeline TTL — no centralized retention policy. Extension requires DPC ticket (precedent: DPC-5176 extended CA variant to 400 days). | Snowflake query + Glean pipeline code |

> **ACTION**: Add `WHERE TYPE IN ('TOP_SS', 'NULL_SS')` to Query 1 to exclude percentile buckets and OVERALL aggregate rows.

---

## 3. Query 2: Search Type Segmentation

> **INVALID FOR INSTAMART — NEEDS REDESIGN**
> This query is fundamentally broken for Instamart. `SRP_ACTION` is a **Food search field** from `search_fact_dashboard_temp_v3`, LEFT JOINed into `AUTOSUGGEST_FACT`. `AUTOSUGGEST_FACT` itself is built with `CATEGORYPAGE IN ('HOME', 'FOOD')` — it is a Food-centric table. The 77% NULL `SRP_ACTION` values mean "no Food SRP session occurred", NOT "typed IM search". See detailed explanation below.

**Source**: Snowflake
**Tables**: `ANALYTICS.PUBLIC.IM_SEARCH_FACT` joined with `ANALYTICS.PUBLIC.AUTOSUGGEST_FACT`
**Purpose**: Classify search terms as "organic" (typed) vs "navigation" (autosuggest-driven)
**Date range**: Last 28 days

### Query Executed

```sql
WITH search_type_breakdown AS (
    SELECT
        LOWER(s.SEARCH_STRING) as SEARCH_STRING,
        a.SRP_ACTION,
        COUNT(*) as search_count
    FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT s
    JOIN ANALYTICS.PUBLIC.AUTOSUGGEST_FACT a
        ON s.SESSION_ID = a.SID
        AND s.DT = a.DT
    WHERE s.DT BETWEEN DATEADD('day', -28, CURRENT_DATE) AND CURRENT_DATE - 1
      AND a.TAB = 'INSTAMART'
      AND LOWER(s.SEARCH_STRING) IN (
        'condom', 'shampoo', 'toothbrush', 'toothpaste', 'coconut oil',
        -- ... 170+ search terms hardcoded from Query 1 output
      )
    GROUP BY LOWER(s.SEARCH_STRING), a.SRP_ACTION
),
aggregated AS (
    SELECT
        SEARCH_STRING,
        SUM(CASE WHEN SRP_ACTION IN ('ENTER', 'None')
            THEN search_count ELSE 0 END) as typed_count,
        SUM(CASE WHEN SRP_ACTION IN ('DEEPLINK', 'SUGGESTION',
            'DEEPLINK_CTA', 'DEEPLINK_TOOLTIP')
            THEN search_count ELSE 0 END) as autosuggest_count,
        SUM(CASE WHEN SRP_ACTION = 'VOICE_SEARCH'
            THEN search_count ELSE 0 END) as voice_count,
        SUM(CASE WHEN SRP_ACTION = 'STORED_SEARCH'
            THEN search_count ELSE 0 END) as stored_count,
        SUM(search_count) as total_searches
    FROM search_type_breakdown
    GROUP BY SEARCH_STRING
)
SELECT
    SEARCH_STRING,
    typed_count, autosuggest_count, voice_count, stored_count, total_searches,
    ROUND(100.0 * typed_count / NULLIF(total_searches, 0), 2) as typed_pct,
    ROUND(100.0 * autosuggest_count / NULLIF(total_searches, 0), 2) as autosuggest_pct,
    ROUND(100.0 * voice_count / NULLIF(total_searches, 0), 2) as voice_pct,
    CASE
        WHEN typed_count * 100.0 / NULLIF(total_searches, 0) >= 50 THEN 'organic'
        ELSE 'navigation'
    END as search_type
FROM aggregated
WHERE total_searches >= 100
ORDER BY total_searches DESC;
```

### CRITICAL ISSUE: ~77% of SRP_ACTION Values Are Empty/NULL

We verified the complete `SRP_ACTION` distribution on `AUTOSUGGEST_FACT` (Feb 4, 2026 sample for Instamart):

| SRP_ACTION | Count | % | Our Classification |
|---|---|---|---|
| **Empty/NULL** | **52,004** | **76.9%** | **NOT CLASSIFIED** |
| `ENTER` | 9,762 | 14.4% | typed |
| `DEEPLINK` | 5,187 | 7.7% | autosuggest |
| `STORED_SEARCH` | 403 | 0.6% | stored |
| `SUGGESTION` | 322 | 0.5% | autosuggest |
| `VOICE_SEARCH` | 284 | 0.4% | voice |
| `DEEPLINK_CTA` | 8 | <0.1% | autosuggest |
| `DEEPLINK_TOOLTIP` | 8 | <0.1% | autosuggest |

**Our SRP_ACTION bucket list is actually complete** — the 8 values above are the only non-null values. The "missing 75-78%" are **empty/NULL records**, meaning no autosuggest interaction was recorded for those searches.

**This likely means empty/NULL should be classified as "typed/organic"** — users who searched without interacting with autosuggest at all. If so, true `typed_pct` would be ~91% (76.9% NULL + 14.4% ENTER), not the 7-15% we reported, and most search terms would flip from "navigation" to "organic".

**Evidence from our output data** (confirming the NULL gap):

| SEARCH_STRING | typed_count | autosuggest_count | voice | stored | **categorized total** | **total_searches** | **NULL/empty %** |
|---|---|---|---|---|---|---|---|
| coconut oil | 617 | 390 | 32 | 5 | **1,044** | 4,694 | **77.8%** |
| shampoo | 592 | 176 | 18 | 10 | **796** | 4,145 | **80.8%** |
| toothbrush | 435 | 228 | 12 | 14 | **689** | 4,237 | **83.7%** |

**Impact**: Our current query treats `SRP_ACTION IN ('ENTER', 'None')` as typed, but misses the dominant case of empty/NULL. We need to either add `SRP_ACTION IS NULL OR SRP_ACTION = ''` to the typed bucket, or confirm with the analytics team what NULL means.

### Columns & Assumptions — INVALIDATED

| Column / Join | Our Assumption | Verified Finding | Source |
|--------------|---------------|------------------|--------|
| `AUTOSUGGEST_FACT.SRP_ACTION` | Classifies IM search as typed vs autosuggest | **INVALID.** SRP_ACTION comes from `search_fact_dashboard_temp_v3` (Food search table), LEFT JOINed into AUTOSUGGEST_FACT. It is **irrelevant to Instamart search classification.** NULL = no Food SRP session, not "typed IM search". | Glean: ETL pipeline code |
| `AUTOSUGGEST_FACT` table | Contains IM search behavior data | **Food-centric table.** Built from `SUGGEST_V2_CLEANED_FOR_AUTO_SUGGEST_` with `CATEGORYPAGE IN ('HOME', 'FOOD')`. IM presence is only a binary flag (`IM_SEARCH_SESSION` = 0/1). | Glean: ETL pipeline code |
| `IM_SEARCH_SESSION` column | Session ID for tighter IM join | **Not a session ID.** It's a 1/0 boolean flag indicating whether an IM search occurred during that session. | Glean: ETL pipeline code |
| `SRP_ACTION IS NULL / empty` | 77% NULL = unclassified typed searches | **Explained.** NULL = no Food SRP happened in that session. This is expected behavior for non-Food sessions, not a data gap. The 77% figure is consistent with IM sessions that never trigger a Food SRP. | Glean: ETL pipeline code |

### Redesign Needed

This query needs a completely different approach for Instamart. Potential alternatives:
- **`DASH_MART_MENU_SEARCH`**: Has `page_type` field which may distinguish global search vs direct IM search entry points
- **`IM_SEARCH_FACT`** alone: May have fields that indicate search entry method without needing AUTOSUGGEST_FACT
- **Ask analytics team**: What is the correct IM-native approach for classifying typed vs autosuggest searches?

---

## 4. Query 3: YoY Search Seasonality

**Source**: Snowflake
**Table**: `ANALYTICS.PUBLIC.IM_SEARCH_DB_SS`
**Purpose**: Compare current search volume to same period last year to detect seasonality

### Query Executed

```sql
WITH current_month AS (
    SELECT
        LOWER(SEARCH_STRING) as search_string,
        L1_CATEGORY, L2_CATEGORY,
        COUNT(*) as volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
    WHERE DT BETWEEN DATEADD('day', -28, CURRENT_DATE) AND CURRENT_DATE - 1
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                            'hygiene and wellness', 'makeup')
    GROUP BY LOWER(SEARCH_STRING), L1_CATEGORY, L2_CATEGORY
    HAVING COUNT(*) >= 100
),
same_month_last_year AS (
    SELECT
        LOWER(SEARCH_STRING) as search_string,
        COUNT(*) as volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
    WHERE DT BETWEEN DATEADD('day', -28, DATEADD('year', -1, CURRENT_DATE))
                  AND DATEADD('year', -1, CURRENT_DATE) - 1
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                            'hygiene and wellness', 'makeup')
    GROUP BY LOWER(SEARCH_STRING)
)
SELECT
    cm.search_string,
    cm.L1_CATEGORY as l1_category,
    cm.L2_CATEGORY as l2_category,
    cm.volume as current_volume,
    ly.volume as yoy_volume,
    ROUND((cm.volume::FLOAT / NULLIF(ly.volume, 0)), 2) AS raw_yoy_growth,
    ROUND((cm.volume::FLOAT / NULLIF(ly.volume, 0)) / 1.25, 2) AS yoy_adjusted_growth,
    -- seasonality_flag and seasonality_score CASE statements
FROM current_month cm
LEFT JOIN same_month_last_year ly ON cm.search_string = ly.search_string
WHERE cm.volume >= 100
ORDER BY cm.volume DESC
LIMIT 200;
```

### Result

**This query returned no YoY data.** The `same_month_last_year` CTE returned zero rows because `IM_SEARCH_DB_SS` only contains data from ~Nov 2025 onwards (~3 months). The YoY comparison requires 12+ months of history.

All 200 terms were defaulted to `SEASONAL_NORMAL` with a score of 50.

### Verified Answers

- **Retention is ~89 days by design.** Each pipeline manages its own TTL via DELETE statements in ETL code. No centralized retention policy exists. Retention ranges from 7 to 400 days across tables. Extension requires a DPC ticket (precedent: DPC-5176 extended a related table to 400 days).
- **No 12+ month search table exists anywhere.** YoY seasonality via search data is not currently possible. Would need a DPC ticket to extend retention or create a dedicated long-retention aggregate table.

---

## 5. Query 4: L2-Level Sales 3-Month MoM

**Source**: Snowflake
**Table**: `ANALYTICS.PUBLIC.IM_CATEGORY_METRICS_L2_SUMMARY`
**Purpose**: Get L2-level GMV, units, and conversion metrics with 3-month MoM trends
**Date ranges**: Same 3x 28-day windows as Query 1

### Query Executed

```sql
WITH month_0 AS (
    SELECT
        L1_CATEGORY, L2_CATEGORY,
        SUM(GMV_ADJUSTED) AS gmv,
        SUM(TOTAL_QUANTITY) AS units,
        AVG(A2C) AS avg_daily_a2c,
        AVG(S2C) AS avg_daily_s2c,
        AVG(GROSS_MARGIN) AS avg_gross_margin_inr,
        COUNT(DISTINCT DT) AS days_with_data
    FROM ANALYTICS.PUBLIC.IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN DATEADD('day', -28, CURRENT_DATE) AND CURRENT_DATE - 1
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                            'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY, L2_CATEGORY
    HAVING SUM(GMV_ADJUSTED) >= 10000
),
month_1 AS (
    SELECT
        L1_CATEGORY, L2_CATEGORY,
        SUM(GMV_ADJUSTED) AS gmv,
        SUM(TOTAL_QUANTITY) AS units
    FROM ANALYTICS.PUBLIC.IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN DATEADD('day', -56, CURRENT_DATE)
                 AND DATEADD('day', -29, CURRENT_DATE)
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                            'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY, L2_CATEGORY
),
month_2 AS (
    SELECT
        L1_CATEGORY, L2_CATEGORY,
        SUM(GMV_ADJUSTED) AS gmv,
        SUM(TOTAL_QUANTITY) AS units
    FROM ANALYTICS.PUBLIC.IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN DATEADD('day', -84, CURRENT_DATE)
                 AND DATEADD('day', -57, CURRENT_DATE)
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                            'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY, L2_CATEGORY
)
SELECT
    m0.L1_CATEGORY, m0.L2_CATEGORY,
    ROUND(m0.gmv, 2) AS m0_gmv,
    ROUND(COALESCE(m1.gmv, 0), 2) AS m1_gmv,
    ROUND(COALESCE(m2.gmv, 0), 2) AS m2_gmv,
    m0.units AS m0_units,
    ROUND(m0.avg_daily_a2c, 2) AS avg_daily_a2c,
    ROUND(m0.avg_daily_s2c, 2) AS avg_daily_s2c,
    ROUND(m0.avg_gross_margin_inr, 2) AS avg_gross_margin_inr,
    m0.days_with_data,
    ROUND((m0.gmv - COALESCE(m1.gmv, 0)) * 100.0
        / NULLIF(m1.gmv, 0), 2) AS m0_vs_m1_gmv_growth_pct,
    ROUND((COALESCE(m1.gmv, 0) - COALESCE(m2.gmv, 0)) * 100.0
        / NULLIF(m2.gmv, 0), 2) AS m1_vs_m2_gmv_growth_pct,
    ROUND((POWER(m0.gmv / NULLIF(m2.gmv, 0), 0.5) - 1) * 100, 2)
        AS two_period_gmv_cagr_pct,
    -- same trend_direction and trend_stability_score CASE as Query 1
FROM month_0 m0
LEFT JOIN month_1 m1 ON m0.L1_CATEGORY = m1.L1_CATEGORY
    AND m0.L2_CATEGORY = m1.L2_CATEGORY
LEFT JOIN month_2 m2 ON m0.L1_CATEGORY = m2.L1_CATEGORY
    AND m0.L2_CATEGORY = m2.L2_CATEGORY
WHERE m0.gmv >= 10000
ORDER BY m0.gmv DESC;
```

### Sample Output (top 5 rows) - DATA ISSUE HIGHLIGHTED

| L1_CATEGORY | L2_CATEGORY | M0_GMV | **M1_GMV** | M2_GMV | M0_UNITS | AVG_DAILY_A2C | AVG_DAILY_S2C | AVG_GROSS_MARGIN_INR | DAYS_WITH_DATA |
|---|---|---|---|---|---|---|---|---|---|
| hygiene and wellness | feminine hygiene | 83,771,177 | **0.0** | 51,571,364 | 339,171 | *(null)* | *(null)* | *(null)* | 12 |
| bath body and hair | shampoo and conditioner | 70,825,633 | **0.0** | 55,658,807 | 196,635 | *(null)* | *(null)* | *(null)* | 12 |
| hygiene and wellness | oral care | 49,173,763 | **0.0** | 37,325,405 | 315,231 | *(null)* | *(null)* | *(null)* | 12 |
| bath body and hair | face cream | 45,224,329 | **0.0** | 34,632,604 | 111,394 | *(null)* | *(null)* | *(null)* | 12 |
| bath body and hair | perfumes, deos and talc | 41,170,004 | **0.0** | 33,262,068 | 90,937 | *(null)* | *(null)* | *(null)* | 12 |

### Issues Found

1. **M1_GMV = 0.0 for ALL 51 L2 categories**: The M1 period (Dec 5, 2025 - Jan 1, 2026) returned zero GMV for every single row. M0 and M2 have data. This is not a query error — it's a data pipeline gap.
2. **A2C, S2C, GROSS_MARGIN are NULL for ALL rows**: Even for M0 which has 12 days of data, these three columns returned NULL.
3. **DAYS_WITH_DATA = 12**: M0 spans 28 days (Jan 2-29) but only 12 days have data, suggesting data only starts from ~Jan 18, 2026.
4. **MoM growth is actually 2-period CAGR**: Because M1=0, the `m0_vs_m1_growth_pct` column is undefined (division by zero). The `two_period_gmv_cagr_pct` (M0 vs M2) was used as a fallback. E.g., Soap shows "15.26% growth" — this is `POWER(M0_GMV / M2_GMV, 0.5) - 1`, not a true MoM figure.

### Columns & Assumptions — PARTIALLY VERIFIED

| Column | Our Assumption | Verified Answer | Source |
|--------|---------------|-----------------|--------|
| `GMV_ADJUSTED` | This is GMV in INR | Still unverified — need to confirm adjustment methodology | — |
| `A2C` | Add-to-cart event count per day | **STILL NULL — UNRESOLVED.** Ask table owner **Bhavana Addagulla**. | Snowflake query |
| `S2C` | Search-to-cart event count per day | **STILL NULL — UNRESOLVED.** Same as above. | Snowflake query |
| `GROSS_MARGIN` | Absolute margin in INR | **STILL NULL — UNRESOLVED.** Same as above. | Snowflake query |
| `DT` | Daily partition | **VERIFIED: 65-day gap is by design.** 180-day rolling TTL in pipeline code. Not a pipeline outage — data is actively deleted beyond 180 days. CA variant was extended to 400 days via DPC-5176, but this table was not. No backfill planned. | Glean: pipeline code + user's Slack (Jan 30) |

### Additional Columns Available (Verified)

We verified this table has **46 columns** total. Beyond what we used, notable columns include:

| Column | Description (inferred) | Potential Use |
|--------|----------------------|---------------|
| `TOTAL_IMP`, `SEARCH_IMP`, `YGTI_IMP`, `MERCH_IMP`, `BROWSE_IMP` | Impression breakdowns by source | Understand traffic sources per L2 |
| `B2C`, `MR2C` | Browse-to-cart, Merch-to-cart | Additional conversion metrics |
| `OVERALL_WTD_SESSIONS`, `OVERALL_SUM_SESSIONS` | Session counts | Session-level analysis |
| `UNIQUE_ORDER_COUNT`, `UNIQUE_CUSTOMER_COUNT` | Order/customer counts | Customer-level metrics |
| `TOTAL_SALES_AMOUNT`, `COGS` | Revenue and cost | Margin analysis |
| `NET_MARGIN_EXCL_LD` | Net margin | Profitability |
| `CITY` | City dimension | City-level breakdown |

**Note**: These columns may also have NULLs (like A2C/S2C/GROSS_MARGIN did). Needs verification.

---

## 6. Query 5: SKU Ratings

**Source**: Snowflake
**Tables**: `ANALYTICS.PUBLIC.IM_ITEM_SALES_DAILY` (bridge) + `ANALYTICS.PUBLIC.AJ_ITEM_RATINGS_XP`
**Purpose**: Get ratings data for SKUs in Personal Care categories

### Query Executed

```sql
WITH personal_care_items AS (
    SELECT DISTINCT
        SKU_ID,
        TRY_CAST(ITEM_CODE AS INTEGER) as ITEM_ID_NUM,
        PROD_NAME as ITEM_NAME,
        BRAND,
        ITEM_CATEGORY as L2_CATEGORY,
        L1_CATEGORY
    FROM ANALYTICS.PUBLIC.IM_ITEM_SALES_DAILY
    WHERE LOWER(L1_CATEGORY) IN ('bath body and hair', 'beauty and grooming',
                                  'hygiene and wellness', 'makeup')
    AND DT >= DATEADD(day, -30, CURRENT_DATE())
),
ratings_latest AS (
    SELECT ITEM_ID, AVG_RATING, RATING_COUNT
    FROM ANALYTICS.PUBLIC.AJ_ITEM_RATINGS_XP
    WHERE DT = (SELECT MAX(DT) FROM ANALYTICS.PUBLIC.AJ_ITEM_RATINGS_XP)
    AND RATING_COUNT > 0
)
SELECT DISTINCT
    p.SKU_ID as ITEM_ID,
    p.ITEM_NAME,
    p.BRAND,
    p.L2_CATEGORY,
    p.L1_CATEGORY,
    ROUND(r.AVG_RATING, 2) as avg_rating,
    r.RATING_COUNT as review_count
FROM personal_care_items p
INNER JOIN ratings_latest r ON p.ITEM_ID_NUM = r.ITEM_ID
ORDER BY r.RATING_COUNT DESC
LIMIT 500;
```

### Observation: Ratings Are at Variant Level, Not SKU Level

The output shows the same product name (e.g., "healthfab gopadfree reusable leak-proof period panty") appearing with 18+ different SKU_IDs — all with identical rating (4.66) and review count (611). This confirms:

- **Ratings are at the variant/ITEM_CODE level** (one rating per SPIN/variant)
- **Multiple SKU_IDs (store-level entries) share the same rating** because the join is through `ITEM_CODE → ITEM_ID`, which is at the variant level, not the store level
- The `TRY_CAST(ITEM_CODE AS INTEGER)` join is working correctly — see [Section 10: Cross-System ID Mapping](#10-cross-system-id-mapping-verified)
- **Note**: The 18+ SKU_IDs for the same product likely represent the same variant stocked at different stores (PODs), not different size/color variants

### Columns & Assumptions — VERIFIED (TABLE CHANGE NEEDED)

> **ACTION**: Switch from `AJ_ITEM_RATINGS_XP` to **`ANALYTICS.PUBLIC.IM_ITEM_RATINGS_SS`**.

| Column / Join | Our Assumption | Verified Answer | Source |
|--------------|---------------|-----------------|--------|
| `AJ_ITEM_RATINGS_XP` | Correct table for item ratings | **WRONG TABLE.** `AJ_ITEM_RATINGS_XP` is Aditya Jaiswal's **experimental** ratings pipeline with EMA/boost scoring. The canonical table is **`im_item_ratings_ss`** — final snapshot table with ratings at product_id level. Confirmed by pipeline owner **Solasu Supradeepth**. | Glean: Slack + pipeline code |
| Rating level | Ratings are per-SKU | **Ratings are computed at `product_id` level**, collected at `spin_id` level. Products with <10 ratings are not shown on app. FnV, Paan Corner, Pharma excluded. | Glean: pipeline code |
| Historical data | Latest snapshot only | For historical (up to 45 days): use `im_item_ratings_ss_date_level` with `run_dt` partition. | Glean: pipeline owner |

---

## 7. Query 6: SKU Pricing

**Source**: Snowflake
**Tables**: `ANALYTICS.PUBLIC.IM_ITEM_SALES_DAILY` (bridge) + `ANALYTICS.PUBLIC.SL_IM_ITEMS_PRICING_DATA_HISTORY`
**Purpose**: Get MRP and selling price for SKUs in Personal Care categories

### Query Executed

```sql
WITH personal_care_items AS (
    SELECT DISTINCT
        SKU_ID,
        PROD_NAME as ITEM_NAME,
        BRAND,
        ITEM_CATEGORY as L2_CATEGORY,
        L1_CATEGORY
    FROM ANALYTICS.PUBLIC.IM_ITEM_SALES_DAILY
    WHERE LOWER(L1_CATEGORY) IN ('bath body and hair', 'beauty and grooming',
                                  'hygiene and wellness', 'makeup')
    AND DT >= DATEADD(day, -7, CURRENT_DATE())
),
pricing_latest AS (
    SELECT
        SKU_ID,
        AVG(MRP) as AVG_MRP,
        AVG(SELLING_PRICE) as AVG_SP
    FROM ANALYTICS.PUBLIC.SL_IM_ITEMS_PRICING_DATA_HISTORY
    WHERE DT = (SELECT MAX(DT) FROM ANALYTICS.PUBLIC.SL_IM_ITEMS_PRICING_DATA_HISTORY)
    AND SELLING_PRICE > 0
    GROUP BY SKU_ID
)
SELECT DISTINCT
    p.SKU_ID as ITEM_ID,
    p.ITEM_NAME, p.BRAND,
    p.L2_CATEGORY, p.L1_CATEGORY,
    ROUND(pr.AVG_MRP, 2) as MRP,
    ROUND(pr.AVG_SP, 2) as SELLING_PRICE,
    ROUND(100.0 * (pr.AVG_MRP - pr.AVG_SP) / NULLIF(pr.AVG_MRP, 0), 2) as discount_pct
FROM personal_care_items p
INNER JOIN pricing_latest pr ON p.SKU_ID = pr.SKU_ID
ORDER BY SELLING_PRICE DESC
LIMIT 1000;
```

### Columns & Assumptions — VERIFIED (TABLE CHANGE NEEDED)

> **ACTION**: Switch from Snowflake `SL_IM_ITEMS_PRICING_DATA_HISTORY` to **Databricks `prod.analytics_prod.im_pricing_data_store_level`** (P0 table, 13-month TTL / 400 days).

| Column / Join | Our Assumption | Verified Answer | Source |
|--------------|---------------|-----------------|--------|
| `SL_IM_ITEMS_PRICING_DATA_HISTORY` | Historical pricing snapshots | **`_HISTORY` table is STALE — last data from May 30, 2025** (~13B rows, no longer updated). The active Snowflake table is `SL_IM_ITEMS_PRICING_DATA` (~37B rows, current to Feb 6, 2026, 366-day TTL, owned by Sahil Luthra). But Analytics explicitly recommends the **Databricks P0 table `im_pricing_data_store_level`** (13-month TTL, 400 days) as the safer source. The ds_search team PR #605 migrated from the Snowflake table to this Databricks table. | Glean + Snowflake query |
| `AVG(MRP)` grouped by `SKU_ID` | We averaged MRP in case of multiple rows per SKU on the same DT | Pricing is at store-level (`store_id` + `sku_id`). Multiple rows per SKU on same date = different stores. Averaging across stores is a valid city-level approximation. City-level alternative: `im_pricing_data_city_level` (Databricks) or `SL_IM_ITEMS_PRICING_CITY_AGG` (Snowflake) with `mode_mrp`, `mode_sp`. | Glean: pipeline code |
| Join on `SKU_ID` | Both tables use `SKU_ID` | Confirmed — both tables use `SKU_ID` at store-variant level. The Databricks P0 table also has `spin_id` for direct variant-level joins. | Glean: schema docs |

---

## 8. Query 7: Brand Emergence

**Source**: Snowflake
**Table**: `ANALYTICS.PUBLIC.IM_BRAND_CATEGORY_SALES`
**Purpose**: Detect new and fast-growing brands by comparing current vs previous period GMV
**Date ranges** (note: manually adjusted due to data gap - see Issues):
- Current period: Jan 19-29, 2026 (11 days)
- Previous period: Oct 19-31, 2025 (13 days)

### Query Executed

```sql
WITH current_period AS (
    SELECT
        BRAND_NAME, L1_CATEGORY, L2_CATEGORY,
        SUM(GMV_ADJUSTED) as gmv,
        SUM(TOTAL_QUANTITY) as units,
        COUNT(DISTINCT CITY) as city_reach
    FROM ANALYTICS.PUBLIC.IM_BRAND_CATEGORY_SALES
    WHERE DT BETWEEN '2026-01-19' AND '2026-01-29'
      AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                          'hygiene and wellness', 'makeup')
      AND BRAND_NAME IS NOT NULL AND BRAND_NAME != ''
      AND LOWER(BRAND_NAME) NOT IN ('unknown', 'other', 'na', 'n/a', 'none')
    GROUP BY BRAND_NAME, L1_CATEGORY, L2_CATEGORY
    HAVING SUM(GMV_ADJUSTED) > 100000
),
prev_period AS (
    SELECT
        BRAND_NAME, L1_CATEGORY, L2_CATEGORY,
        SUM(GMV_ADJUSTED) as gmv,
        SUM(TOTAL_QUANTITY) as units
    FROM ANALYTICS.PUBLIC.IM_BRAND_CATEGORY_SALES
    WHERE DT BETWEEN '2025-10-19' AND '2025-10-31'
      AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming',
                          'hygiene and wellness', 'makeup')
      AND BRAND_NAME IS NOT NULL
    GROUP BY BRAND_NAME, L1_CATEGORY, L2_CATEGORY
)
SELECT
    c.BRAND_NAME, c.L1_CATEGORY, c.L2_CATEGORY,
    ROUND(c.gmv, 2) as current_gmv,
    ROUND(COALESCE(p.gmv, 0), 2) as prev_gmv,
    ROUND(100.0 * (c.gmv - COALESCE(p.gmv, 0)) / NULLIF(p.gmv, 0), 2)
        as gmv_growth_pct,
    c.units as current_units,
    c.city_reach,
    CASE
        WHEN p.gmv IS NULL OR p.gmv < 10000 THEN 'NEW_BRAND'
        WHEN c.gmv / NULLIF(p.gmv, 0) >= 2 THEN 'BREAKOUT'
        WHEN c.gmv / NULLIF(p.gmv, 0) >= 1.5 THEN 'HIGH_GROWTH'
        ELSE 'EXISTING'
    END as brand_status
FROM current_period c
LEFT JOIN prev_period p ON c.BRAND_NAME = p.BRAND_NAME
    AND c.L1_CATEGORY = p.L1_CATEGORY AND c.L2_CATEGORY = p.L2_CATEGORY
WHERE (p.gmv IS NULL OR c.gmv > p.gmv)
ORDER BY
    CASE WHEN p.gmv IS NULL THEN 1
         WHEN c.gmv / NULLIF(p.gmv, 0) >= 2 THEN 2
         ELSE 3 END,
    c.gmv DESC
LIMIT 100;
```

### Sample Output (top 5 rows)

| BRAND_NAME | L1_CATEGORY | L2_CATEGORY | CURRENT_GMV | PREV_GMV | GMV_GROWTH_PCT | CITY_REACH | BRAND_STATUS |
|---|---|---|---|---|---|---|---|
| clayco | bath body and hair | face wash and scrub | 441,847 | 0 | *(null)* | 16 | NEW_BRAND |
| schwarzkopf | bath body and hair | shampoo and conditioner | 114,840 | 0 | *(null)* | 17 | NEW_BRAND |
| vaseline | bath body and hair | body lotion | 12,003,513 | 5,399,529 | 122.31 | 132 | BREAKOUT |
| parachute | bath body and hair | body lotion | 4,031,744 | 1,749,589 | 130.44 | 131 | BREAKOUT |
| evereve | hygiene and wellness | feminine hygiene | 2,500,899 | 1,231,515 | 103.07 | 129 | BREAKOUT |

### Issues

- **Unequal comparison periods**: Current = 11 days (Jan 19-29), Previous = 13 days (Oct 19-31). Growth percentages are not apples-to-apples.
- **3-month gap between periods**: No data from Nov 2025 - Jan 18, 2026. "NEW_BRAND" may just mean the brand existed but had no sales in our narrow comparison window.

### Columns & Assumptions to Verify

| Column | Our Assumption | Question |
|--------|---------------|----------|
| `CITY` | City name for counting city reach | **Is the column `CITY` or `CITY_NAME`?** |
| `GMV_ADJUSTED` | Same GMV metric as in `IM_CATEGORY_METRICS_L2_SUMMARY` | **Confirmed?** |
| `DT` | Daily partition | **Why is there no data from Nov 2025 to Jan 18, 2026?** Same pipeline issue as `IM_CATEGORY_METRICS_L2_SUMMARY`? |

---

## 9. Query 8: SKU Tags / Master Attributes

**Source**: Databricks
**Table**: `prod.analytics_prod.im_spins_master`
**Purpose**: Get SKU master attributes (private label flag, pack size, item type)

### Query Executed

```sql
SELECT
    spin_id as ITEM_ID,
    item_code,
    product_name,
    brand,
    l1_category,
    l2_category,
    pack_of as combo_size,
    uom_qty,
    sp_type,
    item_type,
    CASE WHEN sp_type = 'Private Label' THEN true ELSE false END as is_private_label
FROM prod.analytics_prod.im_spins_master
WHERE LOWER(l1_category) IN ('bath body and hair', 'beauty and grooming',
                              'hygiene and wellness', 'makeup')
LIMIT 1000;
```

### Columns & Assumptions — VERIFIED (MULTIPLE CORRECTIONS)

| Column | Our Assumption | Verified Answer | Source |
|--------|---------------|-----------------|--------|
| `sp_type` | `'Private Label'` identifies private label SKUs | **NO "Private Label" VALUE EXISTS.** Actual values: NULL (105K), `Non-Standard` (97K), `FnV` (7.5K), `Standard` (3.9K), `Non Standard` (3.4K — no hyphen). **Data quality issue**: "Non-Standard" vs "Non Standard" inconsistency. Column was added Dec 2025 via DPC-13028, sourced from `cms_spins_1.attributes.sp_type`. Private label identification needs a different approach. | Databricks query + Glean: DPC-13028 |
| `pack_of` | Number of units in a combo/multipack | Appears correct based on schema. Table has 51 columns total. | Databricks schema query |
| `item_type` | SKU categorization | **VERIFIED: Only 2 values.** `NORMAL` (188K, ~87%) and `VIRTUAL_COMBO` (29K, ~13%). | Databricks query |
| *(missing)* `TOP_100` | Expected in `im_spins_master` | **NOT IN `im_spins_master`.** TOP_100, TOP_250, TOP_200_EXT, TOP_400, TOP_1200 exist only in **`im_store_sku_spin_mapping`** (73 columns). Assortment tier is a **store-level attribute** — a single SPIN can be TOP_100 at one store and not at another. Must join through the mapping table. | Databricks schema query |

> **ACTION**: Remove `CASE WHEN sp_type = 'Private Label' THEN true ELSE false END as is_private_label` — this condition never matches. Need to identify correct private label detection approach (possibly `sp_type IN ('Non-Standard', 'Non Standard')` or a separate flag).

---

## 10. Cross-System ID Mapping (Verified)

We initially hypothesized that `SKU_ID = spin_id` based on both being 10-char alphanumeric IDs. **This was incorrect.** Verification through internal CMS schema documentation (Glean) revealed a 3-level hierarchy.

### ID Hierarchy (Corrected)

```
product_id (product level - groups variants)
  └── spin_id (variant level - PAN-INDIA, one per size/color)
        └── sku_id (store-variant level - one per SPIN per store/POD)
```

**SPIN = Swiggy Product Identification Number** (confirmed via internal glossary).

| ID Column | Table(s) | Format | Level | Scope |
|-----------|----------|--------|-------|-------|
| `product_id` | `cms.cms_spins_1` | Alphanumeric | Product (groups all variants) | PAN-INDIA |
| `spin_id` | `im_spins_master` (Databricks), `cms.cms_spins_1` | Alphanumeric, 10 chars | Variant (one per size/color) | PAN-INDIA |
| `sku_id` / `SKU_ID` | `IM_ITEM_SALES_DAILY`, `SL_IM_ITEMS_PRICING_DATA_HISTORY`, `cms.cms_skus` | Alphanumeric, 10 chars | Store-variant (one per SPIN per store) | Per store/POD |
| `item_code` | `im_spins_master` (Databricks) | Integer | Variant (Vinculum/ERP ID) | PAN-INDIA |
| `ITEM_CODE` | `IM_ITEM_SALES_DAILY` | Numeric string | Same as above | PAN-INDIA |
| `ITEM_ID` | `AJ_ITEM_RATINGS_XP` | Integer | Variant (same as item_code) | PAN-INDIA |

### Key Relationships

- **One `spin_id` → many `sku_id`s** (one per store/POD that carries the variant)
- **`spin_id` ↔ `item_code`** (1:1 mapping at the variant level)
- **`ITEM_CODE` = `item_code` = `ITEM_ID`** (all the same numeric identifier, different tables)
- **`SKU_ID` ≠ `spin_id`** — both are 10-char alphanumeric, but they are different entities at different levels

### Mapping Table

The bridge between `sku_id` and `spin_id` is:
- **Databricks**: `analytics_prod.im_store_sku_spin_mapping`
- **Snowflake**: `analytics.public.store_spin_sku_det`

These contain: `store_id`, `city`, `sku_id`, `spin_id`, `item_code`, `l1_category`, `l2_category`, `brand`, `mrp`, etc.

### Impact on Our Queries

| Query | Join Used | Correct? |
|-------|----------|----------|
| SKU Ratings (Query 5) | `TRY_CAST(ITEM_CODE AS INTEGER) = ITEM_ID` | **Yes** — both are at variant/product level |
| SKU Pricing (Query 6) | `SKU_ID = SKU_ID` (both Snowflake) | **Yes** — same identifier, same system |
| SKU Tags (Query 8) | Output aliased `spin_id as ITEM_ID` | **Misleading alias** — `spin_id` is NOT `ITEM_ID`/`SKU_ID`. However, the query only reads from `im_spins_master` without joining to Snowflake tables, so no incorrect join occurred. |

### Corrected Join Paths

| From | To | Correct Join |
|------|----|-------------|
| `IM_ITEM_SALES_DAILY` → `AJ_ITEM_RATINGS_XP` | `TRY_CAST(ITEM_CODE AS INTEGER) = ITEM_ID` (variant-level) |
| `IM_ITEM_SALES_DAILY` → `SL_IM_ITEMS_PRICING_DATA_HISTORY` | `SKU_ID = SKU_ID` (store-variant level) |
| `IM_ITEM_SALES_DAILY` → `im_spins_master` (Databricks) | **Must go through mapping table**: `SKU_ID → im_store_sku_spin_mapping.sku_id → spin_id → im_spins_master.spin_id` |
| `IM_ITEM_SALES_DAILY` → `im_spins_master` (Databricks) | OR use product-level: `TRY_CAST(ITEM_CODE AS INTEGER) = item_code` |

### Questions for Analytics Team

- **Is the `ITEM_CODE` in `IM_ITEM_SALES_DAILY` equivalent to the Vinculum `item_code` in `im_spins_master`?** Our data samples show matching numeric values, but we want to confirm this is a reliable 1:1 mapping at the variant level.
- **Does `IM_ITEM_SALES_DAILY` have a `spin_id` column?** If so, that would be the cleanest join path to `im_spins_master` without needing the mapping table.

---

## 11. Data Issues Found

### Issue 1 (CRITICAL): Query 2 Is Fundamentally Invalid for Instamart

**Table**: `AUTOSUGGEST_FACT`
**Symptom**: 76.9% of `SRP_ACTION` values are **empty/NULL**.
**Root Cause (CORRECTED)**: `SRP_ACTION` is a **Food search field** from `search_fact_dashboard_temp_v3`, LEFT JOINed into `AUTOSUGGEST_FACT`. `AUTOSUGGEST_FACT` itself is built with `CATEGORYPAGE IN ('HOME', 'FOOD')` — it is a **Food-centric table**. NULL SRP_ACTION means "no Food SRP session occurred", NOT "typed IM search".
**Evidence**: ETL pipeline code confirms the Food-specific origin. Known JIRA issues: IMSEARCH-129 (search string mismatch), INSTAB2C-9867 (broken instrumentation).
**Impact**: The entire Query 2 approach is invalid. Cannot classify IM searches as typed vs autosuggest using `SRP_ACTION`.
**Fix**: **Needs complete redesign.** Must find an IM-native signal for search entry method classification. See [Section 3](#3-query-2-search-type-segmentation) for details.

### Issue 2 (CRITICAL): Sales Table Has 65-Day Data Gap (By Design — TTL)

**Table**: `IM_CATEGORY_METRICS_L2_SUMMARY`
**Verified date range**: Nov 1, 2025 - Jan 31, 2026 (total table range)
**Verified gap**: **Nov 14, 2025 - Jan 17, 2026 (65 days missing)**
- Nov 1-13: 13 days of data (~1,120-1,159 rows/day)
- Nov 14 - Jan 17: **ZERO rows** (65 consecutive days)
- Jan 18-31: 14 days of data (~1,128-1,176 rows/day)

**Root Cause (VERIFIED)**: Not a pipeline outage — this is the **180-day rolling TTL** in the pipeline code. Data is actively deleted beyond 180 days. A CA variant was extended to 400 days via DPC-5176, but this table was not. No backfill is planned.

**Impact on our query**: Our M1 window (Dec 5 - Jan 1) falls entirely within the gap. Our M2 window (Nov 7 - Dec 4) only has 7 days of data (Nov 7-13). Our M0 window (Jan 2-29) only has 12 days (Jan 18-29). All "MoM" comparisons are based on partial data and the `two_period_gmv_cagr_pct` is comparing 12 days vs 7 days, not 28 vs 28.

### Issue 3 (CRITICAL): 11 of 15 Metric Columns Are ALL NULL (Verified)

**Table**: `IM_CATEGORY_METRICS_L2_SUMMARY`
**Symptom**: Far worse than initially reported. Not just A2C/S2C/GROSS_MARGIN — **11 out of 15 metric columns** are entirely NULL even for recent data (Jan 18+, 2026):

| Column | Status | | Column | Status |
|--------|--------|-|--------|--------|
| `GMV_ADJUSTED` | **Populated** (613K rows) | | `TOTAL_IMP` | **ALL NULL** |
| `TOTAL_QUANTITY` | **Populated** | | `SEARCH_IMP` | **ALL NULL** |
| `OVERALL_WTD_SESSIONS` | **99.3% populated** | | `B2C` | **ALL NULL** |
| `UNIQUE_ORDER_COUNT` | **Populated** | | `MR2C` | **ALL NULL** |
| `A2C` | **ALL NULL** | | `TOTAL_SALES_AMOUNT` | **ALL NULL** |
| `S2C` | **ALL NULL** | | `COGS` | **ALL NULL** |
| `GROSS_MARGIN` | **ALL NULL** | | `NET_MARGIN_EXCL_LD` | **ALL NULL** |

**Only 4 columns are usable**: GMV_ADJUSTED, TOTAL_QUANTITY, OVERALL_WTD_SESSIONS, UNIQUE_ORDER_COUNT.
**Impact**: All conversion metrics (A2C, S2C, B2C, MR2C), margin metrics (GROSS_MARGIN, NET_MARGIN_EXCL_LD), impression breakdowns (TOTAL_IMP, SEARCH_IMP), sales amount, and COGS are completely missing. This table is severely incomplete for any funnel or margin analysis.

### Issue 4 (HIGH): No YoY Search Data (Verified: 89 Days Only)

**Table**: `IM_SEARCH_DB_SS`
**Verified date range**: Nov 8, 2025 to Feb 5, 2026 (**89 days only**)
**Full schema verified** (13 columns): `DT`, `SEARCH_STRING`, `TYPE`, `L1_CATEGORY`, `L2_CATEGORY`, `BUSINESS_CATEGORY`, `NEW_REPEAT_IM`, `CUSTOMER_SEGMENT`, `CITY`, `IMPRESSIONS`, `A2C`, `MRR_NUMERATOR`, `MRR_DENOMINATOR`
**Note**: This table also has `A2C` and `CITY` columns we weren't using — could provide search-level add-to-cart and city-level breakdowns.
**Impact**: YoY seasonality analysis is completely non-functional. Only 89 days of history available.

### Issue 5 (HIGH): Brand Sales — December 2025 Missing Entirely (Verified)

**Table**: `IM_BRAND_CATEGORY_SALES`
**Verified date range**: Oct 10, 2025 to Feb 5, 2026 (**118 days**)
**Update (VERIFIED)**: December 2025 has **ZERO rows in the entire table** — not just for Personal Care L1s. November 2025 has 2,317,095 rows across 66 L1 categories (Personal Care = ~411K rows, ~17.7%). The gap is a table-wide issue for December, not a category filter mismatch.
**Impact**: Brand emergence comparison cannot use Dec 2025 as a baseline. Must use Nov 2025 or Oct 2025 for the "previous period". Growth percentages are unreliable due to unequal period lengths.

---

## 12. Questions for Analytics Team

### Self-Verified (For Reference)

The following were answered through our own schema verification queries, Glean searches (ETL code, Slack, PRs), and Databricks/Snowflake queries (Feb 6, 2026):

| # | Question | Answer | Source |
|---|----------|--------|--------|
| V1 | Complete set of `SRP_ACTION` values? | 8 values: `ENTER`, `DEEPLINK`, `STORED_SEARCH`, `SUGGESTION`, `VOICE_SEARCH`, `DEEPLINK_CTA`, `DEEPLINK_TOOLTIP` + 76.9% NULL/empty. **NULL = no Food SRP session (Food-specific field, irrelevant to IM).** | Snowflake query + Glean ETL code |
| V2 | Is `SID` the correct join column in AUTOSUGGEST_FACT? | Yes, but **AUTOSUGGEST_FACT is Food-centric** and not suitable for IM search type classification. `IM_SEARCH_SESSION` is a 1/0 flag, not a session ID. | Glean ETL code |
| V3 | Which is the canonical ratings table? | **`im_item_ratings_ss`** — confirmed by pipeline owner Solasu Supradeepth. `AJ_ITEM_RATINGS_XP` is experimental. Historical: `im_item_ratings_ss_date_level` (45 days). | Glean: Slack + pipeline code |
| V4 | Which is the correct pricing table? | **Databricks `im_pricing_data_store_level`** (P0, 13-month TTL). `SL_IM_ITEMS_PRICING_DATA` exists in Snowflake (366-day TTL) but Analytics recommends the Databricks P0 table. City-level: `im_pricing_data_city_level`. | Glean: ds_search PR #605 |
| V5 | 65-day gap in `IM_CATEGORY_METRICS_L2_SUMMARY`? | **By design.** 180-day rolling TTL in pipeline code. Not an outage — data is actively deleted. CA variant extended to 400 days (DPC-5176) but not this table. | Glean: pipeline code + user's Slack (Jan 30) |
| V6 | `IM_SEARCH_DB_SS` retention? | 89 days (Nov 8, 2025 - Feb 5, 2026). Per-pipeline TTL. No centralized retention policy. No 12+ month search table exists. | Snowflake query + Glean pipeline search |
| V7 | `IM_BRAND_CATEGORY_SALES` date range? | Oct 10, 2025 - Feb 5, 2026 (118 days) — has more data than our query found | Snowflake query |
| V8 | Cross-system ID mapping? | **Corrected**: `SKU_ID ≠ spin_id`. SPIN is variant-level (PAN-INDIA), SKU is store-variant level. `ITEM_CODE = item_code = ITEM_ID` confirmed at variant level. Bridge table: `im_store_sku_spin_mapping`. See [Section 10](#10-cross-system-id-mapping-verified). | Glean: Confluence, Slack, service code |
| V9 | Full `IM_SEARCH_DB_SS` schema? | 13 columns including `A2C` (100% populated), `CITY` (139 cities), `MRR_NUMERATOR` (72.3% populated), `MRR_DENOMINATOR` we weren't using | Snowflake query |
| V10 | Full `IM_CATEGORY_METRICS_L2_SUMMARY` schema? | 46 columns including impression breakdowns, session counts, COGS, net margin | Snowflake query |
| V11 | `sp_type` values for private label detection? | **No "Private Label" value.** Values: NULL (105K), Non-Standard (97K), FnV (7.5K), Standard (3.9K), Non Standard (3.4K). Hyphen inconsistency = data quality issue. | Databricks query |
| V12 | `item_type` valid values? | `NORMAL` (188K), `VIRTUAL_COMBO` (29K). Only 2 values. | Databricks query |
| V13 | Does `TOP_100` exist in `im_spins_master`? | **No.** TOP_100/250/400/1200 are store-level attributes in `im_store_sku_spin_mapping` only. | Databricks schema query |
| V14 | `IMPRESSIONS` in `IM_SEARCH_DB_SS`? | Search session count per dimension slice. ETL: `COUNT(IMP_SID)`. `SUM(IMPRESSIONS)` = total search sessions. | Glean ETL code |
| V15 | `TYPE = 'NULL_SS'` meaning? | Confirmed = zero-result search. ETL: `NULL_SEARCH = 1` where `item_widgets IS NULL AND ban_flag = 'NO' AND page_number = '0'`. | Glean ETL code |
| V16 | Category mapping stability? | Stable — tested 6 terms over 28 days, zero multi-L1/L2 cases. | Snowflake query |
| V17 | `IM_CATEGORY_METRICS_L2_SUMMARY` funnel columns? | **11 of 15 metric columns ALL NULL** (not just A2C/S2C/GROSS_MARGIN). Includes TOTAL_IMP, SEARCH_IMP, B2C, MR2C, TOTAL_SALES_AMOUNT, COGS, NET_MARGIN_EXCL_LD. Only 4 populated: GMV_ADJUSTED, TOTAL_QUANTITY, OVERALL_WTD_SESSIONS (99.3%), UNIQUE_ORDER_COUNT. | Snowflake query (613K rows) |
| V18 | `IM_BRAND_CATEGORY_SALES` Dec 2025 gap? | **December 2025 has ZERO rows table-wide** (not category-specific). Nov 2025: 2.3M rows across 66 L1s. | Snowflake query |
| V19 | `SL_IM_ITEMS_PRICING_DATA_HISTORY` freshness? | **Stale — last data May 30, 2025.** Active table is `SL_IM_ITEMS_PRICING_DATA` (~37B rows, current). Use Databricks P0 instead. | Snowflake query |
| V20 | `IM_ITEM_SALES_DAILY` schema? | 13 columns. Has `SKU_ID` and `ITEM_CODE` but **no `spin_id` column**. Must use `ITEM_CODE` or mapping table for variant-level joins. | Snowflake query |

### Remaining Questions (2 — require human input)

> **Questions 1-4, 5, 8-11 from the original list are now self-verified.** See the V1-V16 table above.

#### Q1 (Blocking): 11 of 15 Metric Columns Are ALL NULL

**Table**: `IM_CATEGORY_METRICS_L2_SUMMARY`
**Ask**: **Bhavana Addagulla** (table owner)

**11 out of 15 metric columns** are entirely NULL even for Jan 18+ data (613K rows with valid GMV). This is not limited to A2C/S2C/GROSS_MARGIN — it includes ALL conversion metrics (A2C, S2C, B2C, MR2C), ALL impression metrics (TOTAL_IMP, SEARCH_IMP), ALL margin/cost metrics (GROSS_MARGIN, NET_MARGIN_EXCL_LD, COGS), and TOTAL_SALES_AMOUNT. Only 4 columns are populated: GMV_ADJUSTED, TOTAL_QUANTITY, OVERALL_WTD_SESSIONS (99.3%), UNIQUE_ORDER_COUNT. Are these columns deprecated, or is this a pipeline issue that will be fixed?

#### Q2 (Blocking): Query 2 Redesign — IM Search Type Classification

**Context**: Our Query 2 (Search Type Segmentation) used `AUTOSUGGEST_FACT.SRP_ACTION` to classify IM searches as typed vs autosuggest. We discovered that **SRP_ACTION is a Food-specific field** and `AUTOSUGGEST_FACT` is a Food-centric table — this approach is fundamentally invalid for Instamart.

**Ask**: What is the correct **IM-native** approach to classify searches as typed/organic vs autosuggest/navigation? Specifically:
- Does `DASH_MART_MENU_SEARCH` have a field (e.g., `page_type`, `ACTION`) that distinguishes search entry methods?
- Is there an IM-specific search instrumentation table that captures how a user initiated their search?

### ~~Priority 1-3 (Original Questions — Now Resolved)~~

<details>
<summary>Click to expand original 11 questions (9 now self-verified, see V1-V16 table above)</summary>

1. ~~Should NULL/empty SRP_ACTION be classified as "typed/organic" search?~~ → **V1: NULL = no Food SRP session. Irrelevant to IM.**
2. ~~What does IMPRESSIONS represent?~~ → **V14: Search session count per dimension slice.**
3. ~~What does TYPE = 'NULL_SS' mean?~~ → **V15: Zero-result search. Confirmed.**
4. ~~Should we use IM_SEARCH_SESSION instead of SID?~~ → **V2: IM_SEARCH_SESSION is a 1/0 flag, not a session ID. But AUTOSUGGEST_FACT is wrong table for IM anyway.**
5. ~~Why is there a 65-day gap?~~ → **V5: By design. 180-day rolling TTL.**
6. **Are A2C/S2C/GROSS_MARGIN still populated?** → **STILL UNRESOLVED** (see Q1 above)
7. ~~IM_BRAND_CATEGORY_SALES Nov-Dec data gap?~~ → **V7: Table has 118 days of data. Likely a category filter mismatch in our query.**
8. ~~Is there a 12+ month search table?~~ → **V6: No. Would need DPC ticket.**
9. ~~Which is the canonical ratings table?~~ → **V3: `im_item_ratings_ss`.**
10. ~~Pricing table difference?~~ → **V4: Use Databricks P0 `im_pricing_data_store_level`.**
11. ~~Is sp_type = 'Private Label' correct?~~ → **V11: No "Private Label" value exists.**

</details>

---

*Generated: 2026-02-06 | Updated with Glean ETL code review, Snowflake/Databricks verification queries, and pipeline documentation. 9 of 11 original questions self-verified; 2 remain for analytics team.*
