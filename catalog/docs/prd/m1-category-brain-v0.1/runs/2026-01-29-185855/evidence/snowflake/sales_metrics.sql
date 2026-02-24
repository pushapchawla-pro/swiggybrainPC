-- Sales MoM Data Extraction for Category Brain v0.1
-- Generated: 2026-01-29
-- L1 Categories: Bath Body and Hair, Beauty and Grooming, Hygiene and Wellness, Makeup
-- Lookback: 4 weeks
--
-- NOTE: Query corrected to match actual IM_ITEM_SALES_DAILY schema:
--   - SKU_ID instead of ITEM_ID
--   - PROD_NAME instead of ITEM_NAME
--   - ITEM_CATEGORY instead of L2_CATEGORY
--   - PL_CATEGORY instead of L3_CATEGORY
--   - TOTAL_QUANTITY instead of QUANTITY
--   - TOTAL_STORE_PRICE instead of GMV (using as proxy)
--   - ORDERS (count) instead of ORDER_ID (distinct)
--
-- EXECUTION STATUS: BLOCKED - IP restriction (390422)

WITH current_sales AS (
    SELECT
        s.SKU_ID,
        s.PROD_NAME,
        s.L1_CATEGORY,
        s.ITEM_CATEGORY AS L2_CATEGORY,
        s.PL_CATEGORY AS L3_CATEGORY,
        s.BRAND,
        SUM(s.TOTAL_QUANTITY) AS units_sold,
        SUM(s.TOTAL_STORE_PRICE) AS gmv,
        SUM(s.ORDERS) AS order_count,
        COUNT(DISTINCT s.STORE_ID) AS active_stores
    FROM IM_ITEM_SALES_DAILY s
    WHERE s.DT BETWEEN DATEADD('day', -7, CURRENT_DATE) AND CURRENT_DATE - 1
        AND s.L1_CATEGORY IN ('Bath Body and Hair','Beauty and Grooming','Hygiene and Wellness','Makeup')
    GROUP BY 1, 2, 3, 4, 5, 6
    HAVING SUM(s.TOTAL_STORE_PRICE) >= 1000
),
previous_sales AS (
    SELECT
        s.SKU_ID,
        SUM(s.TOTAL_QUANTITY) AS units_sold,
        SUM(s.TOTAL_STORE_PRICE) AS gmv,
        SUM(s.ORDERS) AS order_count
    FROM IM_ITEM_SALES_DAILY s
    WHERE s.DT BETWEEN DATEADD('day', -35, CURRENT_DATE) AND DATEADD('day', -8, CURRENT_DATE)
        AND s.L1_CATEGORY IN ('Bath Body and Hair','Beauty and Grooming','Hygiene and Wellness','Makeup')
    GROUP BY 1
)
SELECT
    c.SKU_ID,
    c.PROD_NAME,
    c.BRAND,
    c.L1_CATEGORY,
    c.L2_CATEGORY,
    c.L3_CATEGORY,
    c.units_sold AS current_units,
    c.gmv AS current_gmv,
    c.order_count AS current_orders,
    c.active_stores,
    p.units_sold AS prev_units,
    p.gmv AS prev_gmv,
    ROUND((c.units_sold - COALESCE(p.units_sold, 0)) * 100.0 / NULLIF(p.units_sold, 0), 2) AS units_mom_growth_pct,
    ROUND((c.gmv - COALESCE(p.gmv, 0)) * 100.0 / NULLIF(p.gmv, 0), 2) AS gmv_mom_growth_pct
FROM current_sales c
LEFT JOIN previous_sales p ON c.SKU_ID = p.SKU_ID
ORDER BY c.gmv DESC
LIMIT 500;
