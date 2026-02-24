# Meghana Foods -- Bangalore Chain Health Report

**Date**: 2026-02-20
**Chain**: Meghana Foods (PARENT_NAME: `Meghana Foods`)
**City**: Bangalore (CITY_CODE: 1)
**Active Outlets**: 15
**On Swiggy Since**: March 2015
**AM**: sumit.mishra1@swiggy.in
**Business Classifier**: India_1 - Non Premium
**Commission Type**: Percentage

> **Data Note**: All order/revenue metrics filtered to `ORDER_STATUS = 'completed'` only. All rating metrics exclude 0-star (unrated) entries. These filters prevent two known data artifacts in the source tables.

---

## 1. Chain Scale & Trend (Last 6 Months)

| Month | Orders | Avg AOV | GMV (Cr) | Customers | Discount % |
|-------|-------:|--------:|---------:|----------:|-----------:|
| Sep '25 | 264,651 | Rs. 588 | 15.6 | 198,674 | 5.6% |
| Oct '25 | 251,740 | Rs. 608 | 15.3 | 190,944 | 4.6% |
| Nov '25 | 266,282 | Rs. 602 | 16.0 | 198,920 | 4.1% |
| Dec '25 | **302,320** | Rs. 602 | **18.2** | 226,735 | 6.3% |
| Jan '26 | 282,296 | Rs. 598 | 16.9 | 210,709 | 3.6% |
| Feb '26* | 166,239 | Rs. 596 | 9.9 | 136,446 | 3.9% |

*Feb partial (~21 days). Run-rate projects to ~221K orders, Rs. 13.2 Cr.*

**Summary**: Stable at **~275K completed orders/month**, **Rs. 16 Cr GMV/month**. Dec saw a seasonal peak driven by higher discounting (6.3%). AOV is strong at **Rs. 596-608**. Discount is very lean (**3.6-6.3%**, almost entirely Swiggy-funded, Rs. 0 restaurant-funded discount).

---

## 2. Funnel (Last 30 Days)

```
Menu Views     Cart Adds      Orders
  919,318  -->  539,113  -->  261,573
           58.6%         48.5%         28.5%
           (M2C)         (C2O)         (M2O)
```

| Metric | Value | Benchmark | Status |
|--------|------:|-----------|--------|
| M2C Rate | 58.6% | >25% | Exceptional |
| C2O Rate | 48.5% | >40% | Strong |
| M2O Rate | 28.5% | >15% | Exceptional |
| Repeat Order % | 76.5% | >30% | Elite loyalty |

> Funnel data from `REST_DAY_M2O_FUNNEL_API_RR` (session-based, pre-aggregated).

---

## 3. Customer Loyalty (Last 90 Days)

| Month | Total Customers | Repeat Customer % | Repeat Order % |
|-------|----------------:|------------------:|---------------:|
| Dec '25 | 226,735 | 70.5% | 74.3% |
| Jan '26 | 210,709 | 73.1% | 76.5% |
| Feb '26* | 136,446 | 73.6% | 75.8% |

Repeat customer % trending UP (70.5% -> 73.6%). ~76% of all completed orders come from repeat customers.

---

## 4. Fulfillment (Last 30 Days)

| Status | Count | % |
|--------|------:|---:|
| Completed | 264,518 | 84.9% |
| Failed | 43,829 | 14.1% |
| Cancelled | 3,200 | 1.0% |
| Processing | 10 | 0.0% |

> **14.1% failed orders** is the single biggest operational concern. Failed orders have GMV_TOTAL = 0 (no transaction occurred). Root cause investigation via `prod.vendor.orders` is critical -- possible causes include DE assignment failures, restaurant rejections, or payment timeouts.

---

## 5. Ratings (Last 30 Days)

**Chain-wide avg: 4.41** | 14,019 rated orders | 10% low (1-2 star) | 74% five-star

### Star Distribution

| Stars | Count | % |
|------:|------:|---:|
| 1 | 1,040 | 7.4% |
| 2 | 390 | 2.8% |
| 3 | 679 | 4.8% |
| 4 | 1,878 | 13.4% |
| 5 | 10,437 | 74.4% |

### Outlet-Level Ratings

| Outlet | Avg Rating | 1-2 Star % | 5 Star % | Status |
|--------|----------:|----------:|---------:|--------|
| Residency Road | **4.56** | 6.9% | 78.3% | Best |
| Kanakapura Rd | 4.54 | 6.7% | 77.2% | Excellent |
| BHEL Layout | 4.53 | 7.0% | 75.2% | Excellent |
| Hosur Road | 4.48 | 8.8% | 75.6% | Strong |
| Jayanagar | 4.48 | 8.1% | 74.6% | Strong |
| Indiranagar | 4.47 | 8.3% | 74.1% | Strong |
| Koramangala | 4.43 | 9.8% | 73.8% | Good |
| Dr Rajkumar Rd | 4.43 | 9.2% | 73.1% | Good |
| Bannergatta | 4.43 | 9.9% | 73.3% | Good |
| Sarjapur Road | 4.40 | 10.4% | 73.5% | Good |
| Doddathoguru | 4.35 | 11.3% | 71.8% | OK |
| Brookefields | 4.34 | 10.5% | 68.4% | OK |
| HRBR Layout | **4.29** | **12.5%** | 67.7% | Watch |
| Marathahalli | **4.28** | **12.4%** | 67.5% | Watch |
| Park View Layout | **4.27** | **13.0%** | 67.3% | Watch |

All outlets above 4.0 benchmark. Bottom 3 (HRBR, Marathahalli, Park View) have ~12-13% low ratings vs ~7% for top performers.

### Hourly Quality Pattern

| Time Block | Avg Rating | 1-2 Star % |
|-----------|----------:|----------:|
| 4-9 AM (off-peak) | 4.47-4.76 | 0-9% |
| 10 AM-12 PM (pre-lunch) | 4.56-4.59 | 5-6% |
| 12-4 PM (lunch rush) | 4.34-4.59 | 5-12% |
| 4-7 PM (snacks) | 4.37-4.54 | 6-10% |
| 7-10 PM (dinner rush) | 4.33-4.47 | 8-12% |
| 10 PM-1 AM (late night) | **4.04-4.27** | **13-19%** |

Late night (10 PM-1 AM) is the weakest window: avg drops to 4.04, 1-2 star rate spikes to 19%.

### Top Complaint Themes (from 1-2 star reviews)

| Theme | ~Freq | Representative Quotes |
|-------|------:|----------------------|
| Cold/Stale Food | 25% | "food arrived cold, tasted stale, felt like yesterday's leftovers" |
| Excessive/Inconsistent Spice | 15% | "full of chilly powder, can't eat", "overwhelmingly spicy" |
| Quantity/Value | 15% | "less quantity of chicken", "Box biryani not enough for one person" |
| Wrong Orders | 12% | "ordered chicken got paneer", "wrong parcel with someone else's order" |
| Quality Decline Perception | 10% | "Meghana has gone downhill", "not the regular taste" |
| Food Safety | 8% | "food poisoning", "rotten smell from chicken lollipop" |
| Missing Items/Extras | 8% | "no kaju in kaju masala", "no onions/lemon with biryani" |
| Packaging/Spills | 7% | "food spilt", "full bag oil" |

> One customer mentioned "delivered from central kitchen... quality was not good" -- if Meghana is shifting outlets to a central kitchen model, this could explain inconsistency at specific locations.

---

## 6. Top Items (30 Days)

| # | Item | Orders | Revenue (Cr) | % Rev |
|---|------|-------:|-------------:|------:|
| 1 | Chicken Boneless Biryani | 76,422 | 2.89 | 19.6% |
| 2 | Meghana Spl Boneless Biryani | 63,055 | 2.47 | 16.8% |
| 3 | Paneer Biryani | 34,349 | 1.30 | 8.8% |
| 4 | Chicken Biryani | 16,628 | 0.61 | 4.1% |
| 5 | Box Meghana Spl Boneless | 17,861 | 0.45 | 3.1% |

> Top 3 items = 45.2% of revenue -- moderate concentration. "Box Biryani" format gaining traction as a value play (Rs. 245-250 vs Rs. 370-393 for regular). Note: ITEM_SALES table has no ORDER_STATUS column, so item counts include all order statuses.

---

## 7. Per-Outlet Leaderboard (Last 30 Days, Completed Orders)

| Outlet (Locality) | Age (mo) | Orders | AOV | GMV (L) | Disc% | Ord/Cust |
|-------------------|-------:|-------:|----:|--------:|------:|---------:|
| Sarjapur Road | 38 | 29,155 | 571 | 166.5 | 4.0% | 1.35 |
| Brookefields | 76 | 27,465 | 604 | 165.9 | 4.4% | 1.25 |
| Marathahalli | 131 | 25,438 | 586 | 149.2 | 4.8% | 1.30 |
| Hosur Road | 64 | 20,126 | 583 | 117.4 | 4.1% | 1.32 |
| Bannergatta | 80 | 18,844 | 591 | 111.4 | 3.8% | 1.28 |
| Koramangala | 131 | 18,437 | 551 | 101.7 | 4.4% | 1.28 |
| Indiranagar | 131 | 17,764 | 585 | 103.9 | 3.5% | 1.28 |
| HRBR Layout | 86 | 17,478 | 626 | 109.5 | 3.8% | 1.21 |
| Park View Layout | 83 | 16,460 | 642 | 105.7 | 3.5% | 1.21 |
| Jayanagar | 130 | 16,142 | 594 | 95.9 | 4.5% | 1.25 |
| Dr Rajkumar Rd | 68 | 14,721 | 606 | 89.1 | 3.8% | 1.21 |
| Doddathoguru | 86 | 11,854 | 594 | 70.5 | **5.9%** | 1.25 |
| BHEL Layout | 62 | 11,766 | 601 | 70.7 | 5.2% | 1.24 |
| Residency Road | 126 | 11,062 | **665** | 73.5 | **3.3%** | 1.24 |
| Kanakapura Rd *(new)* | 6 | 7,806 | 646 | 50.4 | 4.2% | 1.27 |

Sarjapur Road is the #1 outlet by volume with the highest order frequency (1.35). Residency Road commands the highest AOV (Rs. 665) with lowest discount (3.3%). Kanakapura Road (6 months old) is already doing 7.8K completed orders/month.

---

## Verdict

| Area | Assessment | Status |
|------|-----------|--------|
| Scale | 275K completed orders/month, Rs. 16 Cr GMV | STRONG |
| AOV | Rs. 598 stable, premium positioning | STRONG |
| Discounting | 3.6-4% lean, zero Rx-funded | STRONG |
| Funnel | 58.6% M2C, 28.5% M2O | STRONG |
| Loyalty | 73% repeat customers, 76% repeat orders | STRONG |
| New outlet ramp | Kanakapura at 7.8K orders in 6 months | STRONG |
| Ratings | 4.41 avg, 10% low | HEALTHY |
| Late-night quality | 4.04 avg, 19% low after 10 PM | WATCH |
| Bottom 3 outlets | HRBR, Marathahalli, Park View at 4.27-4.29 | WATCH |
| Failed orders | 14.1% failed orders (GMV=0) needs investigation | WARNING |

**Actionable issues**:
1. **Failed orders (14.1%)**: 43.8K orders/month fail with zero GMV -- likely DE assignment, restaurant rejection, or payment timeout. This is the #1 operational lever.
2. Late-night quality dip (10 PM-1 AM): cold food, inconsistent spice -- likely end-of-day batch issues
3. 3 outlets lagging on ratings (HRBR, Marathahalli, Park View): 12-13% low vs 7% chain best
4. Wrong order mix-ups across outlets (12% of complaints)

### Recommended Deep Dives

1. **Failed orders RCA**: Query `prod.vendor.orders` for failure reasons -- breakout by DE unavailability, restaurant rejection, payment failure, customer cancellation
2. **Box Biryani cannibalization**: Check if Rs. 245 "Box" format is cannibalizing Rs. 380 regular biryanis
3. **Late-night process audit**: Compare kitchen operations after 10 PM vs peak hours

---

## Data Sources

| Table | Database | Used For |
|-------|----------|----------|
| `ANALYTICS.PUBLIC.RESTAURANT_ATTRIBUTES` | Snowflake | Chain identification, outlet metadata |
| `CMS.SWIGGY.RESTAURANTS` | Snowflake | Outlet master (locality, rating, tier) |
| `FACTS.PUBLIC.DP_ORDER_FACT` | Snowflake | Orders, GMV, discounts, fulfillment (filtered: `ORDER_STATUS = 'completed'`) |
| `ANALYTICS.PUBLIC.REST_DAY_M2O_FUNNEL_API_RR` | Snowflake | Funnel conversion metrics (session-based) |
| `ANALYTICS.PUBLIC.ITEM_SALES` | Snowflake | Item-level revenue breakdown (no ORDER_STATUS filter available) |
| `ANALYTICS.PUBLIC.POCKETHERO_ORDER_FACT_V1` | Snowflake | Repeat customer analysis (filtered: `ORDER_STATUS = 'completed'`) |
| `CMS.SWIGGY.RATINGS` | Snowflake | Rating trend and review analysis (filtered: `RESTAURANT_RATING > 0`) |

*Report generated via Swiggy Brain Food Partner Analytics skill.*
