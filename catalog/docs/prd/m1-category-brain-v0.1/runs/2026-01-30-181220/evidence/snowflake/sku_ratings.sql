-- SKU Ratings Query for Personal Care L1 Categories
-- Extracts rating and review data for insight enrichment
-- Execution Date: 2026-01-30

WITH personal_care_items AS (
    SELECT DISTINCT
        SKU_ID,
        TRY_CAST(ITEM_CODE AS INTEGER) as ITEM_ID_NUM,
        PROD_NAME as ITEM_NAME,
        BRAND,
        ITEM_CATEGORY as L2_CATEGORY,
        L1_CATEGORY
    FROM ANALYTICS.PUBLIC.IM_ITEM_SALES_DAILY
    WHERE LOWER(L1_CATEGORY) IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
    AND DT >= DATEADD(day, -30, CURRENT_DATE())
),
ratings_latest AS (
    SELECT ITEM_ID, AVG_RATING, RATING_COUNT
    FROM ANALYTICS.PUBLIC.AJ_ITEM_RATINGS_XP
    WHERE DT = (SELECT MAX(DT) FROM ANALYTICS.PUBLIC.AJ_ITEM_RATINGS_XP)
    AND RATING_COUNT > 0
)
SELECT DISTINCT
    p.SKU_ID as ITEM_ID,
    p.ITEM_NAME,
    p.BRAND,
    p.L2_CATEGORY,
    p.L1_CATEGORY,
    ROUND(r.AVG_RATING, 2) as avg_rating,
    r.RATING_COUNT as review_count
FROM personal_care_items p
INNER JOIN ratings_latest r
    ON p.ITEM_ID_NUM = r.ITEM_ID
ORDER BY r.RATING_COUNT DESC
LIMIT 500;
