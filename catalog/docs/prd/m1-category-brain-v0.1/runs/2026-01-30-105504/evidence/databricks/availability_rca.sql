-- CB-5: Availability RCA Extraction
-- Date: 2026-01-28
-- L1 Categories: Bath Body and Hair, Beauty and Grooming, Hygiene and Wellness, Makeup

WITH rca_summary AS (
    SELECT
        NEW_L1 as l1_category,
        L2 as l2_category,
        FINAL_REASON as oos_reason,
        COUNT(*) as sku_count,
        ROUND(AVG(AVAILABILITY) * 100, 2) as avg_availability_pct,
        SUM(NON_AVAIL_SESSIONS) as total_non_avail_sessions,
        ROW_NUMBER() OVER (
            PARTITION BY NEW_L1, L2
            ORDER BY SUM(NON_AVAIL_SESSIONS) DESC
        ) as reason_rank
    FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
    WHERE DT = '2026-01-28'
    AND NEW_L1 IN ('Bath Body and Hair', 'Beauty and Grooming', 'Hygiene and Wellness', 'Makeup')
    AND FINAL_REASON IS NOT NULL
    GROUP BY NEW_L1, L2, FINAL_REASON
)
SELECT
    l1_category,
    l2_category,
    avg_availability_pct as availability_pct,
    oos_reason as top_oos_reason,
    total_non_avail_sessions as non_avail_sessions,
    sku_count
FROM rca_summary
WHERE reason_rank = 1
ORDER BY non_avail_sessions DESC;
