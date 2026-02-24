# Phase 3 Validation: E8 — WH→Pod Distribution Bottleneck (Originally: Pod Allocation Bias)

## Validation Question 1: Are the same pods consistently worst across multiple SKUs?

**Answer: YES — clear chronic pod-level starvation.**

```sql
-- Pod-level: % of SKUs below 30% avail
WITH pod_rank AS (
    SELECT STORE_ID, WH_NAME, COUNT(DISTINCT ITEM_CODE), AVG(avail_pct),
           SUM(CASE WHEN avail_pct < 30 THEN 1 ELSE 0 END) AS skus_below_30pct, ...
)
SELECT * FROM pod_rank ORDER BY pct_skus_below_30 DESC LIMIT 20
```

### Worst Pods

| Pod (STORE_ID) | WH | Total SKUs | Avg Avail % | % SKUs <30% | OOS Sessions |
|----------------|-----|-----------|-------------|-------------|-------------|
| **1403746** | BLR IM2 COLD | 950 | **11.1%** | **88.6%** | 214K |
| 911033 | BLR ECOM2 | 19,958 | 46.2% | 43.6% | 3.08B |
| 1382349 | BLR DHL | 21,218 | 52.1% | 35.7% | 1.81B |
| 1381969 | BLR IM1 | 19,847 | 60.2% | 35.4% | 152M |
| 854379 | BLR IM1 | 20,317 | 55.6% | 35.3% | 925M |
| 1388682 | BLR ECOM2 | 20,603 | 55.3% | 32.4% | 2.21B |

**Pod 1403746 (BLR IM2 COLD)** is the clear outlier at 88.6% starved SKUs — this cold-chain pod has 11.1% avg availability across 950 SKUs.

> **⚠ Correction**: An earlier version stated "Store 1381969 appears across 3 different WHs" — this was factually incorrect. Store 1381969 appears in only 1 row (BLR IM1) in the data above.

---

## Validation Question 2 (Attempt 1): Amul Greek Feta (224247) — pod breakdown

**Result: FAILED as representative SKU** — 0.0% availability at ALL 20 pods for 29 days. Primary reason: "oos_9.fillrate Issue" everywhere. This is supply failure (vendor not delivering), not allocation bias.

---

## Validation Question 2 (Attempt 2): Lotus Biscoff (406819) — better representative

**SKU selection criteria**: Mean avail 30-60%, stddev >20, spread >50pp, 10+ pods.

### Candidate SKUs Found

| ITEM_CODE | Product | Pods | Mean Avail | StdDev | Worst | Best | OOS Sessions |
|-----------|---------|------|-----------|--------|-------|------|-------------|
| **406819** | Lotus Biscoff Original Cookie Family Pack | 90 | 35.2% | 22.7 | 9.6% | 100.0% | 752K |
| 27820 | SAMYANG Carbo Hot Chicken Ramen | 90 | 36.4% | 24.4 | 7.1% | 100.0% | 743K |
| 138896 | Ralli Red Grapes (Seedless) | 90 | 35.9% | 20.6 | 12.9% | 100.0% | 729K |

### Lotus Biscoff — Bottom 10 Pods

| Pod | WH | Days | Avail% | OOS Sessions | Avg WH Stock | Fillrate Issue Days | Primary Reason |
|-----|-----|------|--------|-------------|-------------|--------------------|-|
| 1387633 | BLR ECOM2 | 29 | **9.6%** | 168K | 741.5 | **29** | fillrate Issue |
| 1404583 | BLR ECOM2 | 29 | **10.1%** | 95K | 741.5 | **29** | fillrate Issue |
| 1386712 | BLR ECOM2 | 29 | **11.1%** | 98K | 741.5 | **29** | fillrate Issue |
| 1404614 | BLR ECOM2 | 29 | **12.5%** | 154K | 741.5 | **29** | fillrate Issue |
| 1399355 | BLR ECOM2 | 29 | **13.8%** | 98K | 741.5 | **29** | fillrate Issue |
| 1404580 | BLR ECOM2 | 16 | 14.0% | 38K | 1731.3 | **16** | fillrate Issue |
| 1403050 | BLR ECOM2 | 25 | 14.7% | 17K | 1298.5 | **25** | fillrate Issue |
| 1403417 | BLR ECOM2 | 29 | **14.7%** | 84K | 741.5 | **29** | fillrate Issue |
| 1181690 | BLR ECOM2 | 25 | 15.9% | 21K | 1298.5 | **25** | fillrate Issue |
| 1402774 | BLR ECOM2 | 29 | **17.0%** | 85K | 741.5 | **29** | fillrate Issue |

### Critical Finding

**WH has 741 avg stock, but pods get <20% availability.** All bottom 30 pods report "fillrate Issue" as primary reason on 100% of observed days. Zero movement_design_issue days. The pod-level variance (9.6% to ~100%) comes from differential WH→Pod distribution efficiency, not from planning/allocation logic.

---

## Revised Assessment

```
┌─ VERDICT ──────────────────────────────────────────────────────────────┐
│                                                                        │
│  ORIGINAL HYPOTHESIS: Pod allocation bias in planning logic.           │
│  STATUS: DOWNGRADED                                                    │
│                                                                        │
│  ACTUAL MECHANISM: WH-to-Pod distribution bottleneck.                  │
│  - WH has stock (741 avg for Biscoff, 138-179 at DHL)                 │
│  - Fillrate to pods is uniformly poor across ALL bottom pods           │
│  - The variance is in distribution logistics, not allocation logic     │
│  - Some pods get slightly better fills (proximity? capacity? route?)   │
│                                                                        │
│  Pod-level starvation is REAL but the root cause is different          │
│  from what E8 hypothesizes. The fix is dispatch logistics, not         │
│  fairness constraints in allocation software.                          │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

## 5 Whys

```
WHY 1: Real? YES for starvation. Pod 1403746 has 88.6% of SKUs <30% avail.
WHY 2: Immediate cause? Fillrate from WH to pods — not allocation logic.
WHY 3: Why persist? Distribution logistics not equalized across pods.
WHY 4: Reinforcement? Pods with lower fill → lower sales → less demand signal → less priority.
WHY 5: Fix? Investigate dispatch logistics for worst pods; review route optimization.
         Owner: Procurement (upstream) + Planning (distribution).
```

## Golden Pattern Alignment

> **⚠ Misalignment Note**: This finding does NOT match the golden pattern E8 ("Pod Allocation Bias") as defined in the SOP rubric. The E8 hypothesis (allocation logic unfairly distributes stock across pods) was **disproved** — the actual mechanism is a WH→Pod distribution/fillrate bottleneck where WH has stock but pods don't receive it. This is better classified as a distribution logistics issue overlapping with C4 (fillrate). The finding should be relabeled as "WH→Pod Distribution Bottleneck" rather than E8.

## Quality Score: 7/10

| Criterion | Score | Evidence |
|-----------|-------|----------|
| Specificity | 2 | Named pod IDs, WHs, SKU-level traces |
| Quantification | 2 | 88.6% starved for worst pod, per-WH distribution |
| Mechanism | 1 | Pod starvation confirmed but mechanism revised (fillrate not allocation) |
| Repeatability | 1 | Pattern exists but generalizable rule needs further probing |
| Actionability | 1 | "Review dispatch logistics" is directional but not specific enough |
