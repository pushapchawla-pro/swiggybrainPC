-- CB-2: L2-Level Sales MoM Data Extraction
-- Purpose: Fetch L2-level GMV/sales analytics with MoM growth
-- L1 Categories: bath body and hair, beauty and grooming, hygiene and wellness, makeup
-- Current Month: 2026-01-01 to 2026-01-28
-- Previous Month: 2025-12-01 to 2025-12-28
-- Generated: 2026-01-30
--
-- NOTE: Using CA_IM_CATEGORY_METRICS_L2_SUMMARY (dynamic table with complete data)
-- instead of IM_CATEGORY_METRICS_L2_SUMMARY (missing December 2025 data)

WITH current_month AS (
    SELECT
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(GMV_ADJUSTED) as gmv,
        SUM(TOTAL_QUANTITY) as units,
        AVG(A2C) as a2c_rate,
        AVG(S2C) as s2c_rate,
        AVG(GROSS_MARGIN) as gross_margin,
        COUNT(DISTINCT DT) as days_with_data
    FROM ANALYTICS.PUBLIC.CA_IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN '2026-01-01' AND '2026-01-28'
      AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY, L2_CATEGORY
),
prev_month AS (
    SELECT
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(GMV_ADJUSTED) as gmv,
        SUM(TOTAL_QUANTITY) as units
    FROM ANALYTICS.PUBLIC.CA_IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN '2025-12-01' AND '2025-12-28'
      AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY, L2_CATEGORY
)
SELECT
    cm.L1_CATEGORY,
    cm.L2_CATEGORY,
    ROUND(cm.gmv, 2) as current_month_gmv,
    ROUND(pm.gmv, 2) as prev_month_gmv,
    ROUND(100.0 * (cm.gmv - COALESCE(pm.gmv, 0)) / NULLIF(pm.gmv, 0), 2) as mom_gmv_growth_pct,
    cm.units as units_sold,
    ROUND(cm.a2c_rate, 4) as a2c_rate,
    ROUND(cm.s2c_rate, 4) as s2c_rate,
    ROUND(cm.gross_margin * 100, 2) as gross_margin_pct,
    cm.days_with_data
FROM current_month cm
LEFT JOIN prev_month pm
    ON cm.L1_CATEGORY = pm.L1_CATEGORY
    AND cm.L2_CATEGORY = pm.L2_CATEGORY
WHERE cm.gmv > 10000
ORDER BY mom_gmv_growth_pct DESC NULLS LAST;
