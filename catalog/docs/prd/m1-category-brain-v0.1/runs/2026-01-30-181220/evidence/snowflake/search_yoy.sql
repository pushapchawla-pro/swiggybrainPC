-- CB-1c: YoY Search Seasonality (v0.5)
-- Uses the same table as CB-1 (IM_SEARCH_DB_SS)
-- Executed: 2026-01-30
-- OPD Growth Factor: 1.25

WITH current_month AS (
    SELECT
        LOWER(SEARCH_STRING) as search_string,
        L1_CATEGORY,
        L2_CATEGORY,
        COUNT(*) as volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
    WHERE DT BETWEEN DATEADD('day', -28, CURRENT_DATE) AND CURRENT_DATE - 1
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
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
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
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
    CASE
        WHEN ly.volume IS NULL THEN 'NEW_TREND'
        WHEN (cm.volume::FLOAT / NULLIF(ly.volume, 0)) / 1.25 < 0.8 THEN 'BELOW_SEASONAL'
        WHEN (cm.volume::FLOAT / NULLIF(ly.volume, 0)) / 1.25 > 1.5 THEN 'ABOVE_SEASONAL'
        ELSE 'SEASONAL_NORMAL'
    END AS seasonality_flag,
    CASE
        WHEN ly.volume IS NULL THEN 100
        WHEN (cm.volume::FLOAT / NULLIF(ly.volume, 0)) / 1.25 > 2.0 THEN 100
        WHEN (cm.volume::FLOAT / NULLIF(ly.volume, 0)) / 1.25 > 1.5 THEN 80
        WHEN (cm.volume::FLOAT / NULLIF(ly.volume, 0)) / 1.25 > 1.0 THEN 60
        WHEN (cm.volume::FLOAT / NULLIF(ly.volume, 0)) / 1.25 > 0.8 THEN 40
        ELSE 20
    END AS seasonality_score
FROM current_month cm
LEFT JOIN same_month_last_year ly ON cm.search_string = ly.search_string
WHERE cm.volume >= 100
ORDER BY cm.volume DESC
LIMIT 200;
