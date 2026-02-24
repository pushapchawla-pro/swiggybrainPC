-- CB-1: Search MoM Data Extraction
-- Generated: 2026-01-30
-- L1 Categories: Bath Body and Hair, Beauty and Grooming, Hygiene and Wellness, Makeup
-- Lookback Weeks: 4
-- Min Volume: 500

WITH current_month AS (
    SELECT
        s.SEARCH_STRING,
        c.L1_CATEGORY,
        c.L2_CATEGORY,
        COUNT(*) as search_volume,
        SUM(CASE WHEN s.NULL_SEARCH = 1 THEN 1 ELSE 0 END) as zero_results,
        ROUND(100.0 * SUM(CASE WHEN s.NULL_SEARCH = 1 THEN 1 ELSE 0 END) / COUNT(*), 2) as zero_result_rate
    FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT s
    LEFT JOIN ANALYTICS.PUBLIC.IM_SEARCH_DB_STRING_TO_CATEGORY c
        ON LOWER(s.SEARCH_STRING) = LOWER(c.SEARCH_STRING)
        AND c.DT = '2026-01-29'
    WHERE s.DT BETWEEN '2026-01-01' AND '2026-01-30'
    AND c.L1_CATEGORY IN ('Bath Body and Hair', 'Beauty and Grooming', 'Hygiene and Wellness', 'Makeup')
    GROUP BY s.SEARCH_STRING, c.L1_CATEGORY, c.L2_CATEGORY
    HAVING COUNT(*) > 500
),
prev_month AS (
    SELECT
        s.SEARCH_STRING,
        COUNT(*) as search_volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT s
    WHERE s.DT BETWEEN '2025-12-01' AND '2025-12-31'
    GROUP BY s.SEARCH_STRING
    HAVING COUNT(*) > 250
)
SELECT
    cm.SEARCH_STRING,
    cm.L1_CATEGORY,
    cm.L2_CATEGORY,
    cm.search_volume as current_month_volume,
    pm.search_volume as prev_month_volume,
    ROUND(100.0 * (cm.search_volume - pm.search_volume) / NULLIF(pm.search_volume, 0), 2) as mom_growth_pct,
    cm.zero_result_rate
FROM current_month cm
LEFT JOIN prev_month pm ON LOWER(cm.SEARCH_STRING) = LOWER(pm.SEARCH_STRING)
WHERE pm.search_volume > 0
ORDER BY mom_growth_pct DESC NULLS LAST
LIMIT 200;
