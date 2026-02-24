-- CB-8: Brand Emergence Detection
-- Detects NEW_BRAND, BREAKOUT, and HIGH_GROWTH brands in Personal Care categories
-- Generated: 2026-01-30
-- Note: Using Nov 2025 as previous period (Dec 2025 data missing for these categories)

WITH current_period AS (
    SELECT
        BRAND_NAME,
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(GMV_ADJUSTED) as gmv,
        SUM(TOTAL_QUANTITY) as units,
        COUNT(DISTINCT CITY) as city_reach
    FROM ANALYTICS.PUBLIC.IM_BRAND_CATEGORY_SALES
    WHERE DT BETWEEN '2026-01-01' AND '2026-01-28'
      AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
      AND BRAND_NAME IS NOT NULL
      AND BRAND_NAME != ''
    GROUP BY BRAND_NAME, L1_CATEGORY, L2_CATEGORY
    HAVING SUM(GMV_ADJUSTED) > 100000
),
prev_period AS (
    SELECT
        BRAND_NAME,
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(GMV_ADJUSTED) as gmv,
        SUM(TOTAL_QUANTITY) as units
    FROM ANALYTICS.PUBLIC.IM_BRAND_CATEGORY_SALES
    WHERE DT BETWEEN '2025-11-01' AND '2025-11-28'
      AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
      AND BRAND_NAME IS NOT NULL
    GROUP BY BRAND_NAME, L1_CATEGORY, L2_CATEGORY
)
SELECT
    c.BRAND_NAME,
    c.L1_CATEGORY,
    c.L2_CATEGORY,
    ROUND(c.gmv, 2) as current_gmv,
    ROUND(COALESCE(p.gmv, 0), 2) as prev_gmv,
    ROUND(100.0 * (c.gmv - COALESCE(p.gmv, 0)) / NULLIF(p.gmv, 0), 2) as gmv_growth_pct,
    c.units as current_units,
    c.city_reach,
    CASE
        WHEN p.gmv IS NULL OR p.gmv < 10000 THEN 'NEW_BRAND'
        WHEN c.gmv / NULLIF(p.gmv, 0) >= 2 THEN 'BREAKOUT'
        WHEN c.gmv / NULLIF(p.gmv, 0) >= 1.5 THEN 'HIGH_GROWTH'
        ELSE 'EXISTING'
    END as brand_status
FROM current_period c
LEFT JOIN prev_period p
    ON c.BRAND_NAME = p.BRAND_NAME
    AND c.L1_CATEGORY = p.L1_CATEGORY
    AND c.L2_CATEGORY = p.L2_CATEGORY
WHERE (p.gmv IS NULL OR c.gmv > p.gmv)
ORDER BY
    CASE
        WHEN p.gmv IS NULL THEN 1
        WHEN c.gmv / NULLIF(p.gmv, 0) >= 2 THEN 2
        ELSE 3
    END,
    c.gmv DESC
LIMIT 100;
