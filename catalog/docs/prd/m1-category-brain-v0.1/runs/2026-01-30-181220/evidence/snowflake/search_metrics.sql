-- Search 3M MoM Data Extraction
-- Generated: 2026-01-30
-- Source Table: ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
-- L1 Categories: bath body and hair, beauty and grooming, hygiene and wellness, makeup
-- Min Volume: 500
-- Top Terms: 200
-- Note: Using IMPRESSIONS as volume metric, TYPE='NULL_SS' for zero-result rate

WITH month_0 AS (
    SELECT
        SEARCH_STRING,
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(IMPRESSIONS) AS volume,
        SUM(CASE WHEN TYPE = 'NULL_SS' THEN IMPRESSIONS ELSE 0 END) * 100.0 / NULLIF(SUM(IMPRESSIONS), 0) AS zero_result_rate
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
    WHERE DT BETWEEN DATEADD('day', -28, CURRENT_DATE) AND CURRENT_DATE - 1
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY 1, 2, 3
    HAVING SUM(IMPRESSIONS) >= 500
),
month_1 AS (
    SELECT
        SEARCH_STRING,
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(IMPRESSIONS) AS volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
    WHERE DT BETWEEN DATEADD('day', -56, CURRENT_DATE) AND DATEADD('day', -29, CURRENT_DATE)
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY 1, 2, 3
),
month_2 AS (
    SELECT
        SEARCH_STRING,
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(IMPRESSIONS) AS volume
    FROM ANALYTICS.PUBLIC.IM_SEARCH_DB_SS
    WHERE DT BETWEEN DATEADD('day', -84, CURRENT_DATE) AND DATEADD('day', -57, CURRENT_DATE)
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
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
    ROUND((m0.volume - COALESCE(m1.volume, 0)) * 100.0 / NULLIF(m1.volume, 0), 2) AS m0_vs_m1_growth_pct,
    ROUND((COALESCE(m1.volume, 0) - COALESCE(m2.volume, 0)) * 100.0 / NULLIF(m2.volume, 0), 2) AS m1_vs_m2_growth_pct,
    ROUND((POWER(m0.volume::FLOAT / NULLIF(m2.volume, 0), 0.5) - 1) * 100, 2) AS two_period_cagr_pct,
    CASE
        WHEN m0.volume > COALESCE(m1.volume, 0) AND COALESCE(m1.volume, 0) > COALESCE(m2.volume, 0) THEN 'stable_up'
        WHEN m0.volume > COALESCE(m1.volume, 0) AND COALESCE(m1.volume, 0) <= COALESCE(m2.volume, 0) THEN 'accelerating'
        WHEN m0.volume <= COALESCE(m1.volume, 0) AND COALESCE(m1.volume, 0) > COALESCE(m2.volume, 0) THEN 'decelerating'
        WHEN m0.volume < COALESCE(m1.volume, 0) AND COALESCE(m1.volume, 0) < COALESCE(m2.volume, 0) THEN 'stable_down'
        ELSE 'volatile'
    END AS trend_direction,
    CASE
        WHEN m0.volume > COALESCE(m1.volume, 0) AND COALESCE(m1.volume, 0) > COALESCE(m2.volume, 0) THEN 100
        WHEN m0.volume > COALESCE(m1.volume, 0) AND COALESCE(m1.volume, 0) <= COALESCE(m2.volume, 0) THEN 75
        WHEN m0.volume <= COALESCE(m1.volume, 0) AND COALESCE(m1.volume, 0) > COALESCE(m2.volume, 0) THEN 50
        WHEN m0.volume < COALESCE(m1.volume, 0) AND COALESCE(m1.volume, 0) < COALESCE(m2.volume, 0) THEN 0
        ELSE 25
    END AS trend_stability_score
FROM month_0 m0
LEFT JOIN month_1 m1
    ON m0.SEARCH_STRING = m1.SEARCH_STRING
    AND m0.L1_CATEGORY = m1.L1_CATEGORY
    AND m0.L2_CATEGORY = m1.L2_CATEGORY
LEFT JOIN month_2 m2
    ON m0.SEARCH_STRING = m2.SEARCH_STRING
    AND m0.L1_CATEGORY = m2.L1_CATEGORY
    AND m0.L2_CATEGORY = m2.L2_CATEGORY
WHERE m0.volume >= 500
ORDER BY m0.volume DESC
LIMIT 200;
