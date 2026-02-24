-- CB-1b: Search Type Segmentation
-- Purpose: Segment search terms by input type (typed vs autosuggest) to identify organic demand signals
-- Date Range: Last 28 days
-- Generated: 2026-01-30

WITH search_type_breakdown AS (
    SELECT
        LOWER(s.SEARCH_STRING) as SEARCH_STRING,
        a.SRP_ACTION,
        COUNT(*) as search_count
    FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT s
    JOIN ANALYTICS.PUBLIC.AUTOSUGGEST_FACT a
        ON s.SESSION_ID = a.SID
        AND s.DT = a.DT
    WHERE s.DT BETWEEN DATEADD('day', -28, CURRENT_DATE) AND CURRENT_DATE - 1
      AND a.TAB = 'INSTAMART'
      AND LOWER(s.SEARCH_STRING) IN (
        'condom', 'shampoo', 'toothbrush', 'toothpaste', 'coconut oil',
        'handwash', 'face wash', 'body wash', 'lip balm', 'sanitary pads',
        'body lotion', 'sunscreen', 'colgate', 'pads', 'soap', 'soaps',
        'pregnancy kit', 'dettol', 'whisper', 'cetaphil', 'lipstick',
        'perfumes', 'conditioner', 'hair colour', 'stayfree', 'hair serum',
        'cetaphil cleanser', 'vaseline', 'face mask', 'hair oil', 'period panties',
        'moisturizer', 'vicks', 'perfume', 'nua', 'sensodyne', 'adult diaper',
        'l''oreal shampoo', 'tongue cleaner', 'pears', 'medicine', 'razor',
        'pimple patch', 'paste', 'mask', 'kajal', 'parachute', 'bare anatomy',
        'dove shampoo', 'dettol handwash', 'facewash', 'dove soaps', 'pad',
        'pears soap', 'brush', 'lip gloss', 'pregnancy test', 'nail cutter',
        'loofah', 'dove', 'sanitizer', 'eyeliner', 'prega news', 'mysore sandal',
        'mouthwash', 'lip liner', 'chemist at play', 'nivea', 'facial kit',
        'roll on', 'boroline', 'sofy', 'nail paint', 'mysore soap', 'face razor',
        'durex condom', 'shower gel', 'hair mask', 'castor oil', 'sexual wellness',
        'nail polish', 'vaseline jelly', 'gillette blade', 'minimalist',
        'pilgrim serum', 'face scrub', 'moisturising lotion', 'moisturising cream',
        'prega kit', 'plum', 'mirror', 'body scrub', 'face moisturizer',
        'ghar soaps', 'sex toys', 'razor for men', 'cough syrup', 'foundation',
        'cotton', 'sensodyne toothpaste', 'mascara', 'serum', 'face serum',
        'durex', 'cetaphil moisturiser', 'anti dandruff', 'concealer',
        'aloe vera', 'aloe vera gel', 'face cream', 'nivea moisturizer',
        'dot & key', 'almond oil', 'shoe polish', 'bella vita', 'body oil',
        'hand sanitizer', 'ghar soap', 'vitamin c', 'pilgrim shampoo',
        'hair removal', 'gift for men', 'himalaya face wash', 'blush',
        'paradyes', 'fair and lovely', 'sensodyne toothbrush', 'gillette',
        'perfume men', 'mars', 'the derma co', 'multani mitti', 'hair wax',
        'mars lipstick', 'powder', 'panty liner', 'sebamed', 'nail clipper',
        'pilgrim', 'derma co', 'l''oreal paris', 'electric toothbrush',
        'glycerine', 'face pack', 'toner', 'dot and key', 'rose water',
        'mehendi', 'bombay shaving company', 'lux soap', 'razor for women',
        'nail', 'derma roller', 'cotton pads', 'hair spray', 'pond''s',
        'nails', 'press on nails', 'mamaearth', 'spray bottle', 'n95 mask',
        'lip tint', 'foxtale', 'simple', 'nose strip', 'cetaphil soap',
        'renee', 'spray bottles', 'tresemme shampoo', 'wax', 'lipbalm',
        'bellavita perfume', 'bandage', 'mehendi cones', 'primer', 'hand cream',
        'cough medicine', 'simple wash', 'price drop', 'lens', 'blade',
        'vaseline lip', 'cera ve', 'bb cream', 'deos', 'rosemary oil',
        'eyebrow pencils', 'rosemary water', 'compact', 'dandruff shampoo',
        'minoxidil', 'hair removal spray', 'cetaphil face wash', 'body scrubber',
        'mars lip liner', 'kiro'
      )
    GROUP BY LOWER(s.SEARCH_STRING), a.SRP_ACTION
),
aggregated AS (
    SELECT
        SEARCH_STRING,
        -- ENTER = typed search (user typed and pressed enter)
        -- None = likely typed but no autosuggest interaction captured
        SUM(CASE WHEN SRP_ACTION IN ('ENTER', 'None') THEN search_count ELSE 0 END) as typed_count,
        -- DEEPLINK, SUGGESTION = user clicked on autosuggest
        SUM(CASE WHEN SRP_ACTION IN ('DEEPLINK', 'SUGGESTION', 'DEEPLINK_CTA', 'DEEPLINK_TOOLTIP') THEN search_count ELSE 0 END) as autosuggest_count,
        -- VOICE_SEARCH = voice input
        SUM(CASE WHEN SRP_ACTION = 'VOICE_SEARCH' THEN search_count ELSE 0 END) as voice_count,
        -- STORED_SEARCH = repeated/saved search
        SUM(CASE WHEN SRP_ACTION = 'STORED_SEARCH' THEN search_count ELSE 0 END) as stored_count,
        SUM(search_count) as total_searches
    FROM search_type_breakdown
    GROUP BY SEARCH_STRING
)
SELECT
    SEARCH_STRING,
    typed_count,
    autosuggest_count,
    voice_count,
    stored_count,
    total_searches,
    ROUND(100.0 * typed_count / NULLIF(total_searches, 0), 2) as typed_pct,
    ROUND(100.0 * autosuggest_count / NULLIF(total_searches, 0), 2) as autosuggest_pct,
    ROUND(100.0 * voice_count / NULLIF(total_searches, 0), 2) as voice_pct,
    CASE
        WHEN typed_count * 100.0 / NULLIF(total_searches, 0) >= 50 THEN 'organic'
        ELSE 'navigation'
    END as search_type
FROM aggregated
WHERE total_searches >= 100
ORDER BY total_searches DESC;
