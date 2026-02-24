-- CB-2: Sales 3M MoM L2-Level Extraction
-- L1 Categories: bath body and hair, beauty and grooming, hygiene and wellness, makeup (lowercase)
-- Min GMV: 10000
-- Generated: 2026-01-30

WITH month_0 AS (
    SELECT
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(GMV_ADJUSTED) AS gmv,
        SUM(TOTAL_QUANTITY) AS units,
        AVG(A2C) AS avg_daily_a2c,
        AVG(S2C) AS avg_daily_s2c,
        AVG(GROSS_MARGIN) AS avg_gross_margin_inr,
        COUNT(DISTINCT DT) AS days_with_data
    FROM ANALYTICS.PUBLIC.IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN DATEADD('day', -28, CURRENT_DATE) AND CURRENT_DATE - 1
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY, L2_CATEGORY
    HAVING SUM(GMV_ADJUSTED) >= 10000
),
month_1 AS (
    SELECT
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(GMV_ADJUSTED) AS gmv,
        SUM(TOTAL_QUANTITY) AS units
    FROM ANALYTICS.PUBLIC.IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN DATEADD('day', -56, CURRENT_DATE) AND DATEADD('day', -29, CURRENT_DATE)
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY, L2_CATEGORY
),
month_2 AS (
    SELECT
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(GMV_ADJUSTED) AS gmv,
        SUM(TOTAL_QUANTITY) AS units
    FROM ANALYTICS.PUBLIC.IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN DATEADD('day', -84, CURRENT_DATE) AND DATEADD('day', -57, CURRENT_DATE)
        AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY, L2_CATEGORY
)
SELECT
    m0.L1_CATEGORY,
    m0.L2_CATEGORY,
    ROUND(m0.gmv, 2) AS m0_gmv,
    ROUND(COALESCE(m1.gmv, 0), 2) AS m1_gmv,
    ROUND(COALESCE(m2.gmv, 0), 2) AS m2_gmv,
    m0.units AS m0_units,
    ROUND(m0.avg_daily_a2c, 2) AS avg_daily_a2c,
    ROUND(m0.avg_daily_s2c, 2) AS avg_daily_s2c,
    ROUND(m0.avg_gross_margin_inr, 2) AS avg_gross_margin_inr,
    m0.days_with_data,
    ROUND((m0.gmv - COALESCE(m1.gmv, 0)) * 100.0 / NULLIF(m1.gmv, 0), 2) AS m0_vs_m1_gmv_growth_pct,
    ROUND((COALESCE(m1.gmv, 0) - COALESCE(m2.gmv, 0)) * 100.0 / NULLIF(m2.gmv, 0), 2) AS m1_vs_m2_gmv_growth_pct,
    ROUND((POWER(m0.gmv / NULLIF(m2.gmv, 0), 0.5) - 1) * 100, 2) AS two_period_gmv_cagr_pct,
    CASE
        WHEN m0.gmv > COALESCE(m1.gmv, 0) AND COALESCE(m1.gmv, 0) > COALESCE(m2.gmv, 0) THEN 'stable_up'
        WHEN m0.gmv > COALESCE(m1.gmv, 0) AND COALESCE(m1.gmv, 0) <= COALESCE(m2.gmv, 0) THEN 'accelerating'
        WHEN m0.gmv <= COALESCE(m1.gmv, 0) AND COALESCE(m1.gmv, 0) > COALESCE(m2.gmv, 0) THEN 'decelerating'
        WHEN m0.gmv < COALESCE(m1.gmv, 0) AND COALESCE(m1.gmv, 0) < COALESCE(m2.gmv, 0) THEN 'stable_down'
        ELSE 'volatile'
    END AS sales_trend_direction,
    CASE
        WHEN m0.gmv > COALESCE(m1.gmv, 0) AND COALESCE(m1.gmv, 0) > COALESCE(m2.gmv, 0) THEN 100
        WHEN m0.gmv > COALESCE(m1.gmv, 0) AND COALESCE(m1.gmv, 0) <= COALESCE(m2.gmv, 0) THEN 75
        WHEN m0.gmv <= COALESCE(m1.gmv, 0) AND COALESCE(m1.gmv, 0) > COALESCE(m2.gmv, 0) THEN 50
        WHEN m0.gmv < COALESCE(m1.gmv, 0) AND COALESCE(m1.gmv, 0) < COALESCE(m2.gmv, 0) THEN 0
        ELSE 25
    END AS sales_trend_stability_score
FROM month_0 m0
LEFT JOIN month_1 m1
    ON m0.L1_CATEGORY = m1.L1_CATEGORY AND m0.L2_CATEGORY = m1.L2_CATEGORY
LEFT JOIN month_2 m2
    ON m0.L1_CATEGORY = m2.L1_CATEGORY AND m0.L2_CATEGORY = m2.L2_CATEGORY
WHERE m0.gmv >= 10000
ORDER BY m0.gmv DESC;
