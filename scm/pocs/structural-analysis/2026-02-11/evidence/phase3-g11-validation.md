# Phase 3 Validation: G11 — ERP Flags Blocking Sellable Stock

## Validation Question 1: Is the issue limited to BLR ECOM2?

**Answer: NO — all 3 ambient WHs are affected.**

```sql
SELECT WH_NAME, COUNT(DISTINCT ITEM_CODE) AS erp_blocked_skus,
       SUM(NON_AVAIL_SESSIONS) AS total_oos_sessions, ...
FROM analytics.public.sku_wise_availability_rca_with_reasons_v7
WHERE (ERP_ISSUE = 1 OR ERP_TEMP_DISABLE = 1) AND NON_AVAIL_SESSIONS > 0
```

| WH | ERP Blocked SKUs | % City OOS | Avg WH Stock | Pods | Days |
|----|-----------------|-----------|-------------|------|------|
| BLR ECOM2 | 27,609 | 27.85% | 26.4 | 90 | 29 |
| BLR IM1 | 29,447 | 15.16% | 11.9 | 50 | 29 |
| BLR DHL | 24,136 | 12.81% | 10.7 | 50 | 29 |
| BLR COLDSTAR | 105 | ~0% | 27.6 | 89 | 29 |
| BLR IM2 COLD | 101 | ~0% | 42.5 | 62 | 29 |
| **Total** | **81,398** | **55.82%** | | | |

Cold-chain WHs have negligible ERP blocking (~100 SKUs each).

---

## Validation Question 2: Are FMCG brands affected, or just gifting/seasonal?

**Answer: FMCG brands ARE affected.**

```sql
-- Brand breakdown of ERP-blocked SKUs with stock >5 and <10% avail
SELECT WH_NAME, BRAND, COUNT(DISTINCT ITEM_CODE) AS erp_blocked_skus, ...
HAVING erp_blocked_skus >= 3
```

| WH | Brand | Blocked SKUs | OOS Sessions | Avg Stock |
|----|-------|-------------|-------------|-----------|
| BLR ECOM2 | (null) | 273 | 970M | 45.1 |
| BLR IM1 | (null) | 223 | 411M | 24.2 |
| BLR DHL | (null) | 13 | 21.6M | 19.1 |
| BLR ECOM2 | **Dabur** | 5 | 401K | 81.2 |
| BLR ECOM2 | **Naturo** | 3 | 108K | 245.4 |
| BLR IM2 COLD | **Amul** | 3 | 34K | 159.4 |

The null-brand rows (509 SKUs, ~1.4B OOS sessions) are likely private-label/unbranded grocery items.

---

## Validation Question 3: Do blocked SKUs have genuine customer demand?

**Answer: YES — 209 high-demand SKUs confirmed.**

```sql
-- Demand segmentation of ERP-blocked SKUs
CASE WHEN total_sessions > 1000000 THEN 'HIGH_DEMAND'
     WHEN total_sessions > 100000 THEN 'MEDIUM_DEMAND'
     ELSE 'LOW_DEMAND' END
```

| Segment | SKU Count | Sample Brands |
|---------|-----------|---------------|
| HIGH_DEMAND (>1M sessions) | **209** | Cheetos, Pedigree, Carlton London, NO_BRAND |
| MEDIUM_DEMAND (100K-1M) | **137** | Pedigree, Cheetos, NO_BRAND |
| LOW_DEMAND (<100K) | **72** | Levista, Brahmins, Kennel Kitchen, Eastern |
| **Total** | **418** | |

The 209 high-demand SKUs are mainstream FMCG/grocery being blocked with genuine customer search traffic.

---

## 5 Whys

```
WHY 1: Is the pattern real?
├── YES — 81K SKUs, 55.8% of city OOS, all 3 ambient WHs, 29 consecutive days.

WHY 2: What is the immediate cause?
├── ERP_ISSUE flag = 1. Not ERP_TEMP_DISABLE or OTB_BLOCK.

WHY 3: Why does it persist?
├── No automated reconciliation: stock >0 + sellability =0 generates no alert.
├── Some items may be deliberately disabled (seasonal exit) but flag stays on.

WHY 4: What reinforces it?
├── Dead inventory accumulates (expiry, shrinkage). No feedback loop to resolve.

WHY 5: Structural fix?
├── Auto-alert: ERP_ISSUE=1 AND WH_STOCK > threshold for >7 days → ERP review.
├── Audit 209 high-demand SKUs immediately.
├── Owner: ERP Team + Category.
```

## Quality Score: 8/10

| Criterion | Score | Evidence |
|-----------|-------|----------|
| Specificity | 2 | 81K SKUs across 3 named WHs with per-WH breakdown |
| Quantification | 2 | SKU counts, session %, stock levels, demand segments |
| Mechanism | 1 | ERP flag identified but WHY it's set is unclear (deliberate vs accidental) |
| Repeatability | 2 | Rule: any SKU with ERP_ISSUE=1 + WH_STOCK>0 is blocked |
| Actionability | 1 | "Audit ERP flags" is correct but needs decomposition by sub-cause |
