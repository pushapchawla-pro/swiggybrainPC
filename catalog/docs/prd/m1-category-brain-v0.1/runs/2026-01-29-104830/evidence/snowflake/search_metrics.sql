-- Personal Care Search Analytics Query
-- Run Date: 2026-01-29
-- Purpose: Get top search terms with WoW growth for Category Brain v0.1

WITH current_week AS (
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
    WHERE s.DT BETWEEN '2026-01-21' AND '2026-01-27'
    AND c.L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'makeup', 'hygiene and wellness')
    GROUP BY s.SEARCH_STRING, c.L1_CATEGORY, c.L2_CATEGORY
    HAVING COUNT(*) > 500
),
prev_week AS (
    SELECT
        s.SEARCH_STRING,
        COUNT(*) as search_volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT s
    WHERE s.DT BETWEEN '2026-01-14' AND '2026-01-20'
    GROUP BY s.SEARCH_STRING
    HAVING COUNT(*) > 100
)
SELECT
    cw.SEARCH_STRING,
    cw.L1_CATEGORY,
    cw.L2_CATEGORY,
    cw.search_volume as current_week_volume,
    pw.search_volume as prev_week_volume,
    ROUND(100.0 * (cw.search_volume - pw.search_volume) / NULLIF(pw.search_volume, 0), 2) as wow_growth_pct,
    cw.zero_result_rate
FROM current_week cw
LEFT JOIN prev_week pw ON LOWER(cw.SEARCH_STRING) = LOWER(pw.SEARCH_STRING)
WHERE pw.search_volume > 0
ORDER BY wow_growth_pct DESC NULLS LAST
LIMIT 100;
