-- SKU Pricing Query for Personal Care L1 Categories
-- Extracts MRP, selling price, and discount data for insight enrichment
-- Execution Date: 2026-01-30

WITH personal_care_items AS (
    SELECT DISTINCT
        SKU_ID,
        PROD_NAME as ITEM_NAME,
        BRAND,
        ITEM_CATEGORY as L2_CATEGORY,
        L1_CATEGORY
    FROM ANALYTICS.PUBLIC.IM_ITEM_SALES_DAILY
    WHERE LOWER(L1_CATEGORY) IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    AND DT >= DATEADD(day, -7, CURRENT_DATE())
),
pricing_latest AS (
    SELECT
        SKU_ID,
        AVG(MRP) as AVG_MRP,
        AVG(SELLING_PRICE) as AVG_SP
    FROM ANALYTICS.PUBLIC.SL_IM_ITEMS_PRICING_DATA_HISTORY
    WHERE DT = (SELECT MAX(DT) FROM ANALYTICS.PUBLIC.SL_IM_ITEMS_PRICING_DATA_HISTORY)
    AND SELLING_PRICE > 0
    GROUP BY SKU_ID
)
SELECT DISTINCT
    p.SKU_ID as ITEM_ID,
    p.ITEM_NAME,
    p.BRAND,
    p.L2_CATEGORY,
    p.L1_CATEGORY,
    ROUND(pr.AVG_MRP, 2) as MRP,
    ROUND(pr.AVG_SP, 2) as SELLING_PRICE,
    ROUND(100.0 * (pr.AVG_MRP - pr.AVG_SP) / NULLIF(pr.AVG_MRP, 0), 2) as discount_pct
FROM personal_care_items p
INNER JOIN pricing_latest pr
    ON p.SKU_ID = pr.SKU_ID
ORDER BY SELLING_PRICE DESC
LIMIT 1000;
