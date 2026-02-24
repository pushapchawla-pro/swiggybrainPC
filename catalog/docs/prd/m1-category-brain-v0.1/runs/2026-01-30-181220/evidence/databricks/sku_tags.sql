-- SKU Tags Query for Personal Care L1 Categories
-- Extracts SKU attributes (combo_size, item_type, private_label) for insight enrichment
-- Source: Databricks prod.analytics_prod.im_spins_master
-- Execution Date: 2026-01-30
-- Note: TOP_100 column not available in im_spins_master; using sp_type for private_label detection

SELECT
    spin_id as ITEM_ID,
    item_code,
    product_name,
    brand,
    l1_category,
    l2_category,
    pack_of as combo_size,
    uom_qty,
    sp_type,
    item_type,
    CASE WHEN sp_type = 'Private Label' THEN true ELSE false END as is_private_label
FROM prod.analytics_prod.im_spins_master
WHERE LOWER(l1_category) IN ('bath body and hair', 'beauty and grooming', 'hygiene and wellness', 'makeup')
LIMIT 1000;
