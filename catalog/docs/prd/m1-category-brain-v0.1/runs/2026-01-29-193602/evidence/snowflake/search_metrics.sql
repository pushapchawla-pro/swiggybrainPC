-- Search MoM Data Extraction for Category Brain v0.1
-- Task: CB-1 Search MoM Data Extraction
-- L1 Categories: bath body and hair, beauty and grooming, hygiene and wellness, makeup
-- Current Month: 2026-01-01 to 2026-01-28
-- Previous Month: 2025-12-01 to 2025-12-28
-- Min Volume: 500 (current month), 250 (previous month)
-- Category Mapping Date: 2026-01-14 (latest available)

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
        AND c.DT = '2026-01-14'
    WHERE s.DT BETWEEN '2026-01-01' AND '2026-01-28'
    AND c.L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY s.SEARCH_STRING, c.L1_CATEGORY, c.L2_CATEGORY
    HAVING COUNT(*) > 500
),
prev_month AS (
    SELECT
        s.SEARCH_STRING,
        COUNT(*) as search_volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT s
    WHERE s.DT BETWEEN '2025-12-01' AND '2025-12-28'
    GROUP BY s.SEARCH_STRING
    HAVING COUNT(*) > 250
)
SELECT
    cm.SEARCH_STRING as search_string,
    cm.L1_CATEGORY as l1_category,
    cm.L2_CATEGORY as l2_category,
    cm.search_volume as current_month_volume,
    COALESCE(pm.search_volume, 0) as prev_month_volume,
    ROUND(100.0 * (cm.search_volume - COALESCE(pm.search_volume, 0)) / NULLIF(pm.search_volume, 0), 2) as mom_growth_pct,
    cm.zero_result_rate
FROM current_month cm
LEFT JOIN prev_month pm ON LOWER(cm.SEARCH_STRING) = LOWER(pm.SEARCH_STRING)
ORDER BY mom_growth_pct DESC NULLS LAST
LIMIT 300;
