-- Availability RCA Query for Personal Care Categories
-- Run Date: 2026-01-29
-- Purpose: Get top availability issues by category and root cause

-- Query 1: Detailed RCA by L1/L2 category
SELECT
    NEW_L1,
    L2,
    FINAL_REASON,
    COUNT(*) as sku_count,
    ROUND(AVG(AVAILABILITY) * 100, 2) as avg_availability_pct,
    SUM(NON_AVAIL_SESSIONS) as total_non_avail_sessions
FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE DT = '2026-01-28'
AND NEW_L1 IN ('Bath Body and Hair', 'Beauty and Grooming', 'Makeup', 'Hygiene and Wellness')
AND FINAL_REASON IS NOT NULL
GROUP BY NEW_L1, L2, FINAL_REASON
ORDER BY total_non_avail_sessions DESC
LIMIT 100;

-- Query 2: Summary by reason code across all Personal Care
SELECT
    FINAL_REASON,
    COUNT(DISTINCT CONCAT(NEW_L1, '-', L2)) as category_count,
    COUNT(*) as sku_count,
    ROUND(AVG(AVAILABILITY) * 100, 2) as avg_availability_pct,
    SUM(NON_AVAIL_SESSIONS) as total_non_avail_sessions
FROM prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7
WHERE DT = '2026-01-28'
AND NEW_L1 IN ('Bath Body and Hair', 'Beauty and Grooming', 'Makeup', 'Hygiene and Wellness')
AND FINAL_REASON IS NOT NULL
GROUP BY FINAL_REASON
ORDER BY total_non_avail_sessions DESC;
