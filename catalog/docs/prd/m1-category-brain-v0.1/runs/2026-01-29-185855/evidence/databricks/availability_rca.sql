-- CB-5: Availability RCA Extraction
-- Generated: 2026-01-29
-- L1 Categories: Bath Body and Hair, Beauty and Grooming, Hygiene and Wellness, Makeup
-- Table: prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7

SELECT
    DT AS dt,
    CITY AS city,
    NEW_L1 AS l1_category,
    L2 AS l2_category,
    ITEM_CODE AS item_id,
    PRODUCT_NAME AS item_name,
    BRAND AS brand_name,
    ROUND(AVAILABILITY * 100, 2) AS availability_pct,
    ROUND((1 - AVAILABILITY) * 100, 2) AS oos_pct,
    TOTAL_SESSIONS AS total_sessions,
    AVAIL_SESSIONS AS avail_sessions,
    NON_AVAIL_SESSIONS AS non_avail_sessions,
    FINAL_REASON AS primary_oos_reason,
    OOS_REASONS AS oos_reason_detail,
    SALES AS sales,
    WH_STOCK AS wh_stock,
    DOH AS days_of_inventory,
    -- OOS reason flags for categorization
    PLANNING_ISSUE AS forecasting_led_flag,
    ERP_ISSUE AS po_led_flag,
    WH_LONG_TERM_SUPPLY_ISSUE AS supply_led_flag,
    WH_FILLRATE_ISSUE AS wh_fillrate_issue_flag,
    WH_CAP_MISSED AS warehouse_ops_led_flag,
    SPACE_ISSUE AS dark_store_space_flag,
    POD_CAP_MISSED AS dark_store_cap_flag,
    MOVEMENT_SETTING_ISSUE AS tagging_config_flag,
    STOCK_ISSUE AS stock_issue_flag
FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE DT BETWEEN DATE_SUB(CURRENT_DATE(), 7) AND DATE_SUB(CURRENT_DATE(), 1)
    AND NEW_L1 IN ('Bath Body and Hair', 'Beauty and Grooming', 'Hygiene and Wellness', 'Makeup')
    AND AVAILABILITY < 0.95
ORDER BY NON_AVAIL_SESSIONS DESC
LIMIT 500;
