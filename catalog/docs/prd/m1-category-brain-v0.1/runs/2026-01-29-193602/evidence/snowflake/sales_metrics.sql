-- CB-2 Sales MoM Data Extraction
-- L1 Categories: bath body and hair, beauty and grooming, hygiene and wellness, makeup
-- Current Month: 2026-01-01 to 2026-01-28
-- Previous Month: 2025-12-01 to 2025-12-28
-- Note: Using L1_CATEGORY since L2_CATEGORY not available in IM_ITEM_SALES_DAILY table
-- GMV computed from TOTAL_STORE_PRICE, units from TOTAL_QUANTITY

WITH current_month AS (
    SELECT
        L1_CATEGORY,
        SUM(TOTAL_STORE_PRICE) as gmv,
        SUM(TOTAL_QUANTITY) as units,
        SUM(ORDERS) as total_orders,
        SUM(TOTAL_STORE_PRICE) / NULLIF(SUM(ORDERS), 0) as avg_ov
    FROM ANALYTICS.PUBLIC.IM_ITEM_SALES_DAILY
    WHERE DT BETWEEN '2026-01-01' AND '2026-01-28'
    AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY
),
prev_month AS (
    SELECT
        L1_CATEGORY,
        SUM(TOTAL_STORE_PRICE) as gmv
    FROM ANALYTICS.PUBLIC.IM_ITEM_SALES_DAILY
    WHERE DT BETWEEN '2025-12-01' AND '2025-12-28'
    AND L1_CATEGORY IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    GROUP BY L1_CATEGORY
)
SELECT
    cm.L1_CATEGORY as l1_category,
    ROUND(cm.gmv, 2) as current_month_gmv,
    ROUND(pm.gmv, 2) as prev_month_gmv,
    ROUND(100.0 * (cm.gmv - pm.gmv) / NULLIF(pm.gmv, 0), 2) as mom_gmv_growth_pct,
    cm.units as units_sold,
    cm.total_orders as total_orders,
    ROUND(cm.avg_ov, 2) as avg_order_value
FROM current_month cm
LEFT JOIN prev_month pm ON cm.L1_CATEGORY = pm.L1_CATEGORY
ORDER BY mom_gmv_growth_pct DESC NULLS LAST;
