-- Search MoM Data Extraction for Category Brain
-- Generated: 2026-01-29
-- L1 Categories: bath body and hair, beauty and grooming, hygiene and wellness, makeup
-- Min Volume: 3000
-- Lookback: 4 weeks
-- Tables: IM_SEARCH_FACT (daily session data) + IM_SEARCH_DB_STRING_TO_CATEGORY (category mapping)

WITH category_mapping AS (
    -- Get search string to category mapping from the latest snapshot
    SELECT
        SEARCH_STRING,
        L1_CATEGORY,
        L2_CATEGORY
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_STRING_TO_CATEGORY
    WHERE L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
),
current_period AS (
    -- Last 7 days of search sessions (2026-01-22 to 2026-01-28)
    SELECT
        f.SEARCH_STRING,
        COUNT(DISTINCT f.SESSION_ID) AS volume,
        SUM(CASE WHEN f.NULL_SEARCH = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS zero_result_rate
    FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT f
    WHERE f.DT BETWEEN '2026-01-22' AND '2026-01-28'
    GROUP BY f.SEARCH_STRING
    HAVING COUNT(DISTINCT f.SESSION_ID) >= 100
),
previous_period AS (
    -- Previous 4 weeks (2025-12-18 to 2026-01-21)
    SELECT
        f.SEARCH_STRING,
        COUNT(DISTINCT f.SESSION_ID) AS volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT f
    WHERE f.DT BETWEEN '2025-12-18' AND '2026-01-21'
    GROUP BY f.SEARCH_STRING
)
SELECT
    c.SEARCH_STRING,
    cm.L1_CATEGORY,
    cm.L2_CATEGORY,
    c.volume AS current_volume,
    ROUND(c.zero_result_rate, 2) AS zero_result_rate,
    COALESCE(p.volume, 0) AS prev_volume,
    CASE
        WHEN p.volume IS NULL OR p.volume = 0 THEN NULL
        ELSE ROUND((c.volume - p.volume) * 100.0 / p.volume, 2)
    END AS mom_growth_pct
FROM current_period c
INNER JOIN category_mapping cm ON c.SEARCH_STRING = cm.SEARCH_STRING
LEFT JOIN previous_period p ON c.SEARCH_STRING = p.SEARCH_STRING
WHERE c.volume >= 3000
ORDER BY c.volume DESC
LIMIT 500;
