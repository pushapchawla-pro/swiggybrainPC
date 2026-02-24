# Dhaba Shaba — Restaurant Health Diagnostic

**Restaurant ID**: 45754
**Location**: Kaikondrahalli (Sarjapur Road), Bangalore
**Report Date**: 2026-02-21
**Analysis Period**: 30 days (orders/funnel), 60 days (ratings), 12 months (seasonality)

> **Data Note**: All order/revenue metrics filtered to `ORDER_STATUS = 'completed'` only. All rating metrics exclude 0-star (unrated) entries. These filters prevent two known data artifacts in the source tables.

---

## Restaurant Profile

| Field | Value |
|-------|-------|
| Cuisine | Punjabi, Thalis, Indian |
| Cost for Two | Rs. 250 |
| Tier | Gold |
| Age on Platform | 97 months (~8 years, since Jan 2018) |
| Business Class | India_1 - Non Premium |
| Commission | Fixed |
| Displayed Rating | 3.83 (802 lifetime ratings) |
| SM | pavan.puranik@swiggy.in |
| ASM | chandan.kulkarni@swiggy.in |
| VM | Null |
| AOV (pre-computed) | Rs. 337 |
| City Classification | India_1 |

---

## Vital Signs Summary (Last 30 Days)

| Stage | Metric | Current | Trend | Benchmark | Status |
|-------|--------|---------|-------|-----------|--------|
| Discovery | Menu Views/day | ~395 | Stable | City avg | [✓] |
| Discovery | Available Days/week | 7/7 | Stable | 7 | [✓] |
| Consideration | M2C Rate | 44% | Stable | >25% | [✓] |
| Consideration | M2O Rate | 26% | Stable | >20% | [✓] |
| Conversion | Orders/month | ~3,200-4,000 | Seasonal dip | >500 | [✓] |
| Conversion | AOV | Rs. 346 | Rising | Rs. 280+ | [✓] |
| Conversion | Avg Discount % | 13-19% | Rising | <15% | [!] |
| Conversion | Rx Discount/Order | Rs. 0 | Flat | <Rs. 20 | [✓] |
| Fulfillment | Rx Rating (60d) | 4.2 avg | Stable | >4.0 | [✓] |
| Fulfillment | % Low Ratings (1-2 star) | 5-22% | Spiky | <10% | [~] |
| Fulfillment | Delivery Rating | 4.8 avg | Stable | >4.0 | [✓] |
| Retention | Repeat Cust % | 66% | Stable | >30% | [✓] |
| Retention | Repeat Order % | 77% | Stable | >30% | [✓] |
| Retention | MoM Growth (Jan) | -14.5% | Seasonal | >0% | [~] |
| Retention | New Cust Acq. (Jan) | 780/mo | Seasonal dip | Stable | [~] |

---

## 12-Month Order Trend (Seasonality View)

| Month | Orders | AOV (Rs.) | GMV (Rs.) | % of Peak | Notes |
|-------|--------|-----------|-----------|-----------|-------|
| Feb 2025* | 992 | 330 | 3,27,744 | 20.9% | *Partial (~7 days) |
| Mar 2025 | 4,428 | 332 | 14,67,980 | 93.1% | |
| Apr 2025 | 3,581 | 336 | 12,04,228 | 75.3% | |
| May 2025 | 3,711 | 336 | 12,45,519 | 78.0% | |
| Jun 2025 | 3,766 | 332 | 12,51,174 | 79.2% | |
| **Jul 2025** | **4,756** | **327** | **15,57,039** | **100.0%** | **Peak** |
| Aug 2025 | 4,603 | 337 | 15,49,423 | 96.8% | Near-peak |
| Sep 2025 | 4,226 | 310 | 13,10,953 | 88.9% | |
| Oct 2025 | 3,527 | 319 | 11,24,699 | 74.2% | Seasonal low |
| Nov 2025 | 3,970 | 319 | 12,67,174 | 83.5% | Recovery |
| Dec 2025 | 3,882 | 318 | 12,34,444 | 81.6% | |
| Jan 2026 | 3,318 | 335 | 11,12,750 | 69.8% | Seasonal low |
| Feb 2026* | 2,095 | 352 | 7,37,661 | 44.1% | *Partial (21 days) |

```
Orders  │
  5000  │                         ■(4756) ■(4603)
  4500  │        ■(4428)                          ■(4226)
  4000  │                                                   ■(3970) ■(3882)
  3500  │                 ■(3581) ■(3711) ■(3766)  ■(3527)
  3000  │                                                                    ■(3318)
  2500  │                                                                           ○(~2793p)
        └──────────────────────────────────────────────────────────────────────────
          Feb*  Mar   Apr   May   Jun   Jul   Aug   Sep   Oct   Nov   Dec   Jan   Feb*
          2025                                                                    2026

  Peak: Jul-Aug (~4,680 avg)  |  Troughs: Oct (~3,527) and Jan (~3,318)
  Revenue swing (full months): 29% from peak — Warning zone (30-50%)
```

**Seasonal pattern**: Clear Jul-Aug peak (monsoon = more delivery in Bangalore), with troughs in Oct and Jan-Feb. The Jan 2026 trough (69.8% of peak) is comparable to Oct 2025 (74.2%) — this is **normal seasonality**, not structural decline.

**Feb 2026 projected**: 2,095 orders / 21 days * 28 = **~2,793 orders** (would be the lowest full month, but Feb is typically weak — partial Feb 2025 prorates to ~3,968 for 28 days, suggesting Feb 2026 may be softer than last year).

---

## 30-Day Weekly Order Trend

| Week | Orders | AOV (Rs.) | GMV (Rs.) | WoW Growth |
|------|--------|-----------|-----------|------------|
| Jan 19 | 442 | 332 | 1,46,844 | — |
| Jan 26 | 791 | 338 | 2,67,290 | +79.0% |
| Feb 02 | 677 | 353 | 2,38,928 | -14.4% |
| Feb 09 | 800 | 360 | 2,88,014 | +18.2% |
| Feb 16 | 461 | 341 | 1,57,309 | -42.4% (partial) |

**Weekly run rate**: ~680-800 completed orders/week on full weeks | AOV trending up (Rs. 332 -> Rs. 360)

---

## Funnel Conversion (30 Days, Daily Averages)

| Metric | Average | Range | Benchmark | Status |
|--------|---------|-------|-----------|--------|
| Menu Sessions/day | ~395 | 275-588 | City avg | Healthy |
| M2C Rate | 44% | 35-51% | >25% | Strong |
| C2O Rate | 60% | 52-67% | >50% | Strong |
| M2O Rate | 26% | 21-31% | >20% | Healthy |
| Repeat Order % | 74% | 67-91% | >30% | Excellent |

Funnel is healthy across all stages. No conversion bottleneck.

---

## Ratings Deep Dive (60 Days)

| Week | Orders Rated | Rx Rated | Avg Rx Rating | Low Rx (1-2 star) | % Low Rx | Del Rated | Avg Del Rating | Gap |
|------|-------------|---------|---------------|-------------------|----------|-----------|----------------|-----|
| Dec 22 | 69 | 41 | **4.34** | 2 | 4.9% | 48 | 4.92 | -0.58 |
| Dec 29 | 84 | 48 | **4.46** | 3 | 6.3% | 53 | 4.98 | -0.52 |
| Jan 05 | 80 | 44 | **4.16** | 6 | 13.6% | 59 | 4.71 | -0.55 |
| Jan 12 | 71 | 33 | **4.18** | 5 | 15.2% | 53 | 4.77 | -0.59 |
| Jan 19 | 53 | 29 | **3.97** | 6 | **20.7%** | 39 | 4.74 | -0.78 |
| Jan 26 | 54 | 20 | **4.50** | 1 | 5.0% | 48 | 4.92 | -0.42 |
| Feb 02 | 55 | 22 | **4.91** | 0 | 0.0% | 43 | 5.00 | -0.09 |
| Feb 09 | 56 | 33 | **4.42** | 5 | 15.2% | 40 | 4.78 | -0.35 |
| Feb 16 | 41 | 18 | **4.00** | 4 | **22.2%** | 31 | 4.48 | -0.48 |

**Key findings**:
- Restaurant rating is **4.0-4.9** — mostly in the Healthy zone (>4.0)
- Delivery rating is excellent at **4.5-5.0**
- Rating gap is small: -0.09 to -0.78 (delivery marginally better, which is normal)
- **Intermittent quality spikes**: Jan 19 (20.7% low) and Feb 16 (22.2% low) — worth monitoring but not a sustained crisis
- ~30-50% of orders receive a restaurant rating; the rest skip rating

### Recent 1-2 Star Reviews (Last 30 Days)

| Date | Rx Rating | Del Rating | Comment |
|------|-----------|------------|---------|
| Feb 19 | 2 | 5 | *"Chicken curry was average but tandoori roti was stale and badly cooked"* |
| Feb 19 | 2 | 5 | *"The food was bland, no taste, smelling badly"* |
| Feb 10 | 1 | — | *"Found hair in the curry"* |
| Feb 09 | 1 | 5 | *"Undercooked food"* |
| Jan 24 | 2 | 4 | *"Quantity is very less"* |

**Assessment**: These 5 negative reviews exist among ~150+ orders rated in the period. Themes (stale roti, undercooked, hygiene) are concerning but isolated — the 4.0+ weekly average shows the majority of customers rate positively. Worth flagging to the owner as quality consistency issues, not a systemic collapse.

---

## Discount Analysis (30 Days, Weekly)

| Week | Orders | AOV (Rs.) | Avg Discount | Discount % | Rx Discount | Swiggy Discount | Coupon | % Discounted |
|------|--------|-----------|-------------|------------|-------------|-----------------|--------|-------------|
| Jan 19 | 442 | 332 | Rs. 44 | 13.2% | Rs. 0 | Rs. 1 | Rs. 43 | 81.0% |
| Jan 26 | 791 | 338 | Rs. 47 | 13.9% | Rs. 0 | Rs. 0 | Rs. 46 | 83.8% |
| Feb 02 | 677 | 353 | Rs. 59 | **16.8%** | Rs. 0 | Rs. 1 | Rs. 58 | 84.2% |
| Feb 09 | 800 | 360 | Rs. 66 | **18.3%** | Rs. 0 | Rs. 1 | Rs. 65 | 85.1% |
| Feb 16 | 461 | 341 | Rs. 65 | **19.0%** | Rs. 0 | Rs. 1 | Rs. 63 | 83.7% |

```
┌─ ⚠ WARNING: RISING DISCOUNT DEPENDENCY ──────────────────────────────────┐
│ Discount % climbed from 13.2% to 19.0% in 4 weeks                       │
│ Crossed Warning threshold (15%) in week of Feb 02                        │
│ Restaurant funds Rs. 0 — ALL discounting is Swiggy/platform coupons      │
│ 83% of orders are discounted — organic (non-coupon) demand is thin       │
└──────────────────────────────────────────────────────────────────────────┘
```

This is the **primary concern** in the report. While the restaurant isn't funding discounts itself, the platform's coupon depth is escalating and customers are becoming habituated.

---

## Restaurant Availability

**No closure events in last 30 days.** Fully available 7/7 days every week. Not a factor.

---

## Ad Spend Analysis

| Month | Spend (Rs.) | Clicks | CPC (Rs.) | Campaigns |
|-------|------------|--------|-----------|-----------|
| Dec 2025 | 10,750 | 1,075 | 10.00 | 3 |
| Jan 2026 | 26,560 | 3,610 | 7.36 | 12 |
| Feb 2026 | 16,800 | 1,696 | 9.91 | 6 |

Restaurant is actively investing in ads. CPC is efficient (Rs. 7-10). Jan saw a significant ramp-up to 12 campaigns / Rs. 26.5K spend. Despite the increased spend, orders declined 14% MoM — suggesting the seasonal headwind was stronger than the ad push. Feb spend has moderated.

---

## Customer Retention (6 Months, Completed Orders)

| Month | Total Customers | Repeat Customer % | Repeat Order % |
|-------|----------------:|------------------:|---------------:|
| Sep 2025 | 2,733 | 64.6% | 77.1% |
| Oct 2025 | 2,390 | 62.1% | 74.3% |
| Nov 2025 | 2,734 | 61.6% | 73.5% |
| Dec 2025 | 2,721 | 58.8% | 71.1% |
| Jan 2026 | 2,259 | 65.5% | 76.5% |
| Feb 2026* | 1,545 | 68.2% | 76.5% |

**Key findings**:
- Repeat customer rate stable at 59-68% (benchmark >30%)
- Repeat order share strong at 71-77% — most completed orders come from returning customers
- New customer acquisition dipped in Jan (780 vs 1,122 in Dec = -30%) — but this tracks with seasonal order decline, not a separate issue
- Feb prorated new customers: 492/21 * 28 = ~656, which would be the lowest — warrants watching

---

## Persona Classification

```
Decision Tree:
├── Growth Plateau? MoM growth volatile (-14%, +17%, -2%, -14%), not
│   consistently <2% for 3+ months. Orders >500/mo ✓ but pattern
│   is seasonal, not stagnant.                                        → NO
│
├── Over-Discounter? Avg discount 13-19% (not >25%).
│   Rx funds Rs. 0 of discounts.                                      → NO
│
├── Logistics Loser? Rx rating 4.0-4.9 (not <3.5).
│   Delivery rating 4.5-5.0. No delivery crisis.                      → NO
│
├── Seasonality Sufferer? Revenue swing ~29% peak-to-trough
│   (Jul 15.6L → Jan 11.1L). In Warning zone (approaching 30%),
│   not Critical (>50%). Clear Jul-Aug peak, Oct/Jan troughs.          → PARTIAL MATCH
│
├── Skeptical Traditionalist? Active ad spend (Rs. 16-27K/mo),
│   3,500+ orders/month.                                               → NO
│
└── RESULT: SEASONAL RESTAURANT WITH RISING DISCOUNT DEPENDENCY
    Closest to Seasonality Sufferer (Case 4) but swing not yet >50%
```

---

## Root Cause Analysis

**Persona**: Seasonal restaurant with Warning-level discount dependency
**Confidence**: HIGH — 12 months of data confirm repeating seasonal pattern

| # | Finding | Evidence | Severity | Owner |
|---|---------|----------|----------|-------|
| 1 | **Seasonal order pattern** (normal) | Jul-Aug peak (4,680 avg), Oct/Jan troughs (3,318-3,527). Jan 2026 at 69.8% of peak ≈ Oct 2025 at 74.2% | Low — expected seasonality | Awareness only |
| 2 | **Rising coupon dependency** | Discount % climbed 13.2% → 19.0% in 4 weeks; 83% of orders discounted; Rx funds Rs. 0 | **Warning** — approaching 25% Critical threshold | AM + Platform |
| 3 | **Intermittent food quality blips** | Jan 19 (20.7% low ratings) and Feb 16 (22.2% low ratings); reviews cite stale roti, undercooked, hair in food | **Monitor** — weekly avg still 4.0+ but spikes are concerning | AM → Rx Owner |
| 4 | **Feb 2026 tracking softer than Feb 2025** | Feb 2026 prorated: ~2,793 orders vs Feb 2025 prorated: ~3,968 | **Watch** — could be noise (7-day sample for 2025) or early sign of structural softening | AM |

**What's working well**:
- Funnel conversion: M2C 44%, M2O 26% — both strong
- Repeat rate: 66% customers, 77% orders — excellent loyalty
- AOV: Rs. 346 and rising — healthy basket
- Availability: 100% uptime
- Ratings: 4.0-4.9 avg — good food quality overall
- Ad investment: Active and CPC-efficient

---

## Recommended Actions

```
┌─ PRIORITY 1: DISCOUNT HEALTH (AM Action — This Month) ───────────────────┐
│                                                                           │
│ 1. Review platform coupon strategy for this restaurant                    │
│    - Discount climbed 13% → 19% in 4 weeks with no Rx co-funding         │
│    - Test reducing coupon depth by Rs. 10-15 on selected days to          │
│      measure organic demand elasticity                                    │
│                                                                           │
│ 2. Evaluate coupon ROI: Are discounted orders incremental or would        │
│    they have come anyway? Compare weekday vs weekend, discounted          │
│    vs non-discounted order volumes                                        │
│                                                                           │
│ 3. Discuss Rx co-funding: Restaurant currently funds Rs. 0.               │
│    Even a small Rx contribution (Rs. 10-15/order) could unlock            │
│    better-targeted offers vs blanket coupons                              │
└───────────────────────────────────────────────────────────────────────────┘

┌─ PRIORITY 2: QUALITY CONSISTENCY (AM Flag — Next Check-in) ──────────────┐
│                                                                           │
│ 4. Share the 5 negative reviews with owner — specific complaints:         │
│    stale roti, bland food, undercooked, hair, low quantity                │
│    Not a crisis (avg rating 4.2) but quality spikes (15-22% low           │
│    rating weeks) indicate inconsistent kitchen execution                  │
│                                                                           │
│ 5. Monitor weekly: if % low ratings sustains >15% for 3+ weeks,          │
│    escalate to kitchen audit                                              │
└───────────────────────────────────────────────────────────────────────────┘

┌─ PRIORITY 3: SEASONAL STRATEGY (AM + Rx — Next Quarter Planning) ────────┐
│                                                                           │
│ 6. Pre-plan for Oct 2026 and Jan 2027 troughs:                           │
│    - Counter-seasonal menu items (lighter/comfort food for low months)    │
│    - Increase ad spend during troughs (CPC is cheaper when competitors    │
│      cut back — Jan CPC was Rs. 7.36 vs Dec Rs. 10.00)                   │
│    - Target: reduce peak-to-trough swing from 29% to <20%                │
│                                                                           │
│ 7. Evaluate Feb 2026 vs Feb 2025 once full month completes               │
│    - If Feb 2026 finishes below 3,000 (vs ~3,968 prorated for 2025),     │
│      investigate whether this is market-wide or restaurant-specific       │
└───────────────────────────────────────────────────────────────────────────┘
```

### Tracking Query

```sql
-- Weekly rating health check
SELECT
    DATE_TRUNC('week', CREATED_AT) AS week,
    COUNT(CASE WHEN RESTAURANT_RATING > 0 THEN 1 END) AS rx_rated,
    ROUND(AVG(CASE WHEN RESTAURANT_RATING > 0 THEN RESTAURANT_RATING END), 2) AS avg_rx_rating,
    COUNT(CASE WHEN RESTAURANT_RATING IN (1, 2) THEN 1 END) AS low_rx_count,
    ROUND(COUNT(CASE WHEN RESTAURANT_RATING IN (1, 2) THEN 1 END) * 100.0
        / NULLIF(COUNT(CASE WHEN RESTAURANT_RATING > 0 THEN 1 END), 0), 1) AS pct_low_rx,
    ROUND(AVG(CASE WHEN DELIVERY_RATING > 0 THEN DELIVERY_RATING END), 2) AS avg_del_rating
FROM CMS.SWIGGY.RATINGS
WHERE RESTAURANT_ID = 45754
    AND CREATED_AT >= DATEADD(day, -14, CURRENT_DATE)
GROUP BY 1
ORDER BY 1;
```

---

## Summary

Dhaba Shaba is a **healthy, well-established restaurant** (8 years, Gold tier, 4.2 avg rating, 66% repeat customer rate, strong funnel conversion) going through a **normal seasonal trough** (Jan-Feb). The 12-month pattern shows clear Jul-Aug peaks and Oct/Jan dips with ~29% revenue swing — consistent with Bangalore food delivery seasonality.

**The one genuine concern is rising coupon dependency** — discount depth climbed from 13% to 19% in 4 weeks, with the restaurant funding zero and 83% of orders carrying a coupon. If unchecked, this risks crossing the 25% Critical threshold and creating permanent discount habituation.

Intermittent food quality blips (2-3 weeks with >15% low ratings) warrant a conversation with the owner but do not constitute a crisis — the weekly average remains above 4.0.

**TL;DR**: Good restaurant, normal season. Fix the coupon creep before it becomes structural.

---

## Data Sources

| Table | Database | Used For |
|-------|----------|----------|
| `ANALYTICS.PUBLIC.RESTAURANT_ATTRIBUTES` | Snowflake | Restaurant metadata, AM hierarchy |
| `CMS.SWIGGY.RESTAURANTS` | Snowflake | Outlet master (locality, rating, tier) |
| `FACTS.PUBLIC.DP_ORDER_FACT` | Snowflake | Orders, GMV, discounts (filtered: `ORDER_STATUS = 'completed'`) |
| `ANALYTICS.PUBLIC.REST_DAY_M2O_FUNNEL_API_RR` | Snowflake | Funnel conversion metrics (session-based) |
| `STREAMS.PUBLIC.RESTAURANT_HOLIDAY_SLOT_EVENTS` | Snowflake | Availability/closures |
| `ANALYTICS.PUBLIC.FOOD_ADS_SOS_CPC_BILLING` | Snowflake | CPC ad spend |
| `CMS.SWIGGY.RATINGS` | Snowflake | Rating trend and reviews (filtered: `RESTAURANT_RATING > 0`) |
| `ANALYTICS.PUBLIC.POCKETHERO_ORDER_FACT_V1` | Snowflake | Repeat customer analysis (filtered: `ORDER_STATUS = 'completed'`) |

*Report generated via Swiggy Brain Food Partner Analytics skill.*
