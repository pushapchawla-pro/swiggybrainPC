-- CB-3: SKU Attributes Extraction
-- L1 Categories: Bath Body And Hair, Beauty And Grooming, Hygiene And Wellness, Makeup
-- Executed: 2026-01-29
-- Tables Used:
--   - ANALYTICS.PUBLIC.SKU_CATALOG_IM_BIZFIN_ITEM_MASTER (item master)
--   - ANALYTICS.PUBLIC.IM_ITEM_RATINGS_VIEW (ratings)
--   - ANALYTICS.PUBLIC.SL_IM_ITEMS_PRICING_CITY_AGG_HISTORY (pricing - city aggregate)

WITH item_master AS (
    SELECT
        ITEM_CODE,
        SPIN_ID,
        PRODUCT_ID,
        BRAND,
        BRAND_ID,
        COMPANY,
        ITEM_NAME,
        L1_CATEGORY,
        L2_CATEGORY,
        L3_CATEGORY,
        L4_CATEGORY,
        UOM,
        GROSS_WEIGHT,
        SHELF_LIFE,
        SUPPLY_TYPE
    FROM ANALYTICS.PUBLIC.SKU_CATALOG_IM_BIZFIN_ITEM_MASTER
    WHERE L1_CATEGORY IN ('Bath Body And Hair', 'Beauty And Grooming', 'Hygiene And Wellness', 'Makeup')
),
item_ratings AS (
    SELECT
        ITEM_IDENTIFIER,
        RATING_COUNT,
        AVG_RATING,
        DT as rating_date
    FROM ANALYTICS.PUBLIC.IM_ITEM_RATINGS_VIEW
    WHERE DT = (SELECT MAX(DT) FROM ANALYTICS.PUBLIC.IM_ITEM_RATINGS_VIEW)
),
latest_pricing AS (
    SELECT
        SPIN_ID,
        MODE_MRP as MRP,
        MODE_SP as SELLING_PRICE,
        MODE_MSP as MAX_SAVER_PRICE,
        DT as pricing_date
    FROM ANALYTICS.PUBLIC.SL_IM_ITEMS_PRICING_CITY_AGG_HISTORY
    WHERE DT = (SELECT MAX(DT) FROM ANALYTICS.PUBLIC.SL_IM_ITEMS_PRICING_CITY_AGG_HISTORY)
      AND CITY = 'Bangalore'  -- Using Bangalore as reference city
)
SELECT
    m.ITEM_CODE,
    m.SPIN_ID,
    m.PRODUCT_ID,
    m.ITEM_NAME,
    m.BRAND,
    m.COMPANY,
    m.L1_CATEGORY,
    m.L2_CATEGORY,
    m.L3_CATEGORY,
    m.L4_CATEGORY,
    m.UOM,
    m.GROSS_WEIGHT,
    m.SHELF_LIFE,
    m.SUPPLY_TYPE,
    r.AVG_RATING,
    r.RATING_COUNT,
    p.MRP,
    p.SELLING_PRICE,
    p.MAX_SAVER_PRICE,
    ROUND((p.MRP - p.SELLING_PRICE) * 100.0 / NULLIF(p.MRP, 0), 2) AS discount_pct,
    CASE
        WHEN r.AVG_RATING >= 4.5 THEN 'Excellent'
        WHEN r.AVG_RATING >= 4.0 THEN 'Good'
        WHEN r.AVG_RATING >= 3.5 THEN 'Average'
        WHEN r.AVG_RATING >= 3.0 THEN 'Below Average'
        WHEN r.AVG_RATING > 0 THEN 'Poor'
        ELSE 'No Rating'
    END AS rating_tier
FROM item_master m
LEFT JOIN item_ratings r ON m.PRODUCT_ID = r.ITEM_IDENTIFIER
LEFT JOIN latest_pricing p ON m.SPIN_ID = p.SPIN_ID
ORDER BY m.L1_CATEGORY, m.L2_CATEGORY, m.BRAND, m.ITEM_NAME
LIMIT 1000;
