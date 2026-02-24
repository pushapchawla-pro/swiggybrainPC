-- CB-2: L2-Level Sales Metrics (v0.3)
-- Purpose: Fetch L2-level GMV/sales analytics with MoM growth
-- L1 Categories: Bath Body and Hair, Beauty and Grooming, Hygiene and Wellness, Makeup
-- Date Range: Current Month (2026-01-01 to 2026-01-30), Prev Month (2025-12-01 to 2025-12-31)

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
    FROM ANALYTICS.PUBLIC.IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN '2026-01-01' AND '2026-01-30'
      AND L1_CATEGORY IN ('Bath Body and Hair', 'Beauty and Grooming', 'Hygiene and Wellness', 'Makeup')
    GROUP BY L1_CATEGORY, L2_CATEGORY
),
prev_month AS (
    SELECT
        L1_CATEGORY,
        L2_CATEGORY,
        SUM(GMV_ADJUSTED) as gmv,
        SUM(TOTAL_QUANTITY) as units
    FROM ANALYTICS.PUBLIC.IM_CATEGORY_METRICS_L2_SUMMARY
    WHERE DT BETWEEN '2025-12-01' AND '2025-12-31'
      AND L1_CATEGORY IN ('Bath Body and Hair', 'Beauty and Grooming', 'Hygiene and Wellness', 'Makeup')
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
