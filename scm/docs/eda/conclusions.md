# Supply Chain Brain: Availability Metrics & Prediction Architecture

## Executive Summary

This document summarizes the data validation conducted to inform two key decisions for Supply Chain Brain:

1. **Metric Choice**: Should we use session-based or search-weighted availability?
2. **Prediction Architecture**: Should we predict OOS at WH-level, POD-level, or both?

**Bottom Line**:
- Use **search-weighted availability only** for Supply Chain Brain (customer-backwards, actionable)
- **Differentiated targets by tier** — NOT uniform 99.9% (diminishing returns above 90%)
- Build **both WH-level AND POD-level prediction** for Tier 1 SKUs
- **Don't justify availability with conversion ROI** — availability is hygiene, not a conversion driver

---

## Key Decisions (TL;DR for Leadership)

| Decision | Recommendation | Data Support |
|----------|----------------|--------------|
| **Which metric?** | Search-weighted (91%) only | 20.48% of SKUs diverge >5%; session-based (84%) includes long-tail nobody searches |
| **Prediction level?** | Both WH + POD for Tier 1 | WH-only caps at 95.4%; 28% of OOS is POD-led despite WH having stock |
| **Target for all SKUs?** | **NO** — Tiered targets | Top 20% SKUs have 89% avail; bottom 20% have 48% — invest where it matters |
| **How to justify availability?** | Customer experience + GMV protection | Availability has ~0 correlation with conversion — it's hygiene, not differentiator |

**Why NOT 99.9% Everywhere?**
```
Availability by Demand Tier (Bangalore, 7 days)
───────────────────────────────────────────────
Top 20% (high search):     89% availability, 66% of impressions
Bottom 40% (long-tail):    45-65% availability, 4% of impressions
                           ↑
                           Investing here has minimal customer impact
```

**Recommended Tiered Targets**:

| Tier | SKUs | Current | Target | Investment |
|------|------|---------|--------|------------|
| **Tier 1** | Top 20% + essentials | 89% | **99%+** | High (WH + POD prediction) |
| **Tier 2** | Deciles 3-5 | 86-89% | **95%** | Moderate |
| **Tier 3** | Deciles 6-7 | 76-83% | **90%** | Low |
| **Tier 4** | Bottom 30% (long-tail) | 45-65% | **85%** | Minimal |

---

## The Two Questions

### Question 1: Which Availability Metric?

| Metric | Definition | Current Value |
|--------|------------|---------------|
| **Session-based** | `1 - (OOS sessions / total sessions)` for all catalog SKUs | 84% |
| **Search-weighted** | Availability weighted by search impressions | 91% |

### Question 2: WH-level vs POD-level Prediction?

| Approach | Predicts At | Pros | Cons |
|----------|-------------|------|------|
| **Option A** | POD (dark store) | Customer-centric, hyperlocal signals | Sparse data, more complex |
| **Option B** | Warehouse (inventory) | Simpler, familiar to ops | Allocation blindness |
| **Option C** | Warehouse (demand) | Demand-driven | Still misses POD variance |

---

## Hypothesis Validation

### H1.1: Do Session-Based and Search-Weighted Metrics Diverge?

#### Why This Matters

We have two ways to measure SKU availability:

| Metric | Formula | What It Captures |
|--------|---------|------------------|
| **Session-based** | `1 - (OOS sessions / total sessions)` | Availability across ALL catalog SKUs during user sessions |
| **Search-weighted** | `Σ(availability × impressions) / Σ(impressions)` | Availability weighted by how often SKUs are actually searched |

**The question**: If these metrics are highly correlated (>95%), switching doesn't matter - pick either. But if they diverge, we're measuring fundamentally different things and must choose based on what matters.

| If Validated (>20% SKUs diverge) | If Not Validated |
|----------------------------------|------------------|
| The metrics measure different things | Either metric works |
| We must choose based on what matters | No strong preference |
| Long-tail SKUs behave differently from high-demand | Uniform behavior across catalog |

**Threshold**: >20% of SKUs showing >5% divergence

#### Result: ✅ VALIDATED (20.48%)

**Data**: 832,548 SKUs analyzed over 7 days (Bangalore)

| Metric | Value |
|--------|-------|
| SKUs with >5% divergence | 170,478 (**20.48%**) |
| SKUs with >10% divergence | 118,256 (14.20%) |
| **Aggregate session-based availability** | **84%** |
| **Aggregate search-weighted availability** | **91%** |
| Gap | **+7%** |

#### What This Proves

The metrics ARE meaningfully different. 20.48% > 20% threshold. We cannot use them interchangeably - we must choose based on what we're trying to measure.

**Why Search-Weighted (91%) > Session-Based (84%)** - this is EXPECTED, not a data anomaly:
- **Session-based** includes ALL catalog SKUs, including long-tail SKUs nobody searches for
- **Search-weighted** weights toward high-demand SKUs that actually get searched
- High-demand SKUs have better availability (we prioritize stocking what sells)
- Long-tail SKUs have worse availability (less inventory priority)

The 7% gap is a sign of **good supply chain behavior** - we're prioritizing what matters. What WOULD be surprising (and a red flag) is if search-weighted < session-based, meaning "SKUs people want are LESS available than SKUs nobody searches."

---

### H1.2: Does Availability Predict Conversion?

#### Why This Matters

Intuitively, if something is OOS, customers can't buy it → lower conversion. If we can prove this link, it justifies investment in availability improvement with clear ROI.

| If Validated | If Not Validated |
|--------------|------------------|
| OOS directly hurts conversion | Availability is hygiene, not differentiator |
| Clear ROI for availability improvement | Justify via customer experience, not conversion |

**Threshold**: Meaningful positive correlation between availability and conversion

#### Result: ❌ NOT VALIDATED (No relationship found)

**Analysis 1: SKU-Level Correlation**

| Correlation | Session-based | Search-weighted |
|-------------|---------------|-----------------|
| vs S2C Rate | -0.0119 | +0.0172 |
| vs Search GMV | -0.0147 | -0.0055 |

Both near zero - no relationship at SKU level.

**Analysis 2: Store-Level Correlation** (additional validation)

Since session-level OOS encounter data isn't available, we tested: do stores with lower availability have lower session conversion?

| Store Availability | Num Stores | Conversion Rate |
|--------------------|------------|-----------------|
| <60% | 7 | 19.58% |
| 60-70% | 42 | **22.05%** |
| 70-80% | 74 | **21.96%** |
| 80-90% | 26 | 19.30% |

Correlation: **-0.12** (weak negative). No monotonic pattern - mid-range availability has slightly better conversion than extremes.

**Analysis 3: Glean Search**

- No existing session-level OOS impact analysis at Swiggy
- Cart abandonment dataset exists with OOS flag (DPC-12041) but hasn't been analyzed for this
- No substitution rate data (% of users who substitute vs abandon when facing OOS)

#### What This Proves

Availability is a **hygiene factor**, not a conversion driver. Like electricity in a store - you need it to operate, but having more doesn't get you more customers.

**Why availability doesn't predict conversion**:

| Factor | Explanation |
|--------|-------------|
| **High baseline** | At 91% search-weighted availability, most searched items are in stock |
| **Substitution masks signal** | User buys Brand B when Brand A is OOS - conversion still happens |
| **Other factors dominate** | Price, relevance, search ranking, product attributes drive conversion |
| **Aggregate hides individual** | Session-level impact may exist but not visible at store/SKU level |

**For Supply Chain Brain**: Don't justify availability improvement with conversion ROI. Instead use:
- **Customer experience**: Nobody likes seeing "Sold Out"
- **GMV protection**: OOS = lost revenue for that SKU, even if user substitutes
- **Brand loyalty**: Repeated OOS for preferred brand → user switches platforms

---

### H2.1: Is Allocation Blindness Real?

#### Why This Matters

**What is allocation blindness?** When the warehouse has stock, but specific PODs are OOS because inventory wasn't allocated/transferred to them. A WH-level prediction system is "blind" to this - it sees WH has stock and doesn't flag the problem.

**The question**: If most OOS is WH-led (supply problems), WH-level prediction suffices. If significant OOS is POD-led (allocation problems), we NEED POD-level prediction to reach 99.9%.

| If Validated (>20% OOS is POD-led) | If Not Validated |
|------------------------------------|------------------|
| WH-level prediction has a blind spot | WH-level prediction is sufficient |
| Can't reach 99.9% without POD-level | Simpler architecture works |
| Must build two-layer system | Option B/C alone works |

**Threshold**: >20% of OOS occurs when WH has stock but POD doesn't

#### Result: ✅ VALIDATED (27.8%)

**Data**: Waterfall dashboard (priority SKUs with `ASSORTMENT IN ('A', 'MLT', 'MnE')`)

| OOS Type | Definition | % of OOS | Absolute Miss |
|----------|------------|----------|---------------|
| **WH-led** | DOH < 3 days OR WH_STOCK < 10 | 72% | 12.05% |
| **POD-led** | WH has stock but POD doesn't | 28% | 4.63% |

#### What This Proves

Allocation blindness is real and significant. 27.8% > 20% threshold.

**The Math That Matters**:
- 28% of OOS happens despite warehouse having stock
- A WH-level prediction system is "blind" to this - it sees WH has stock and doesn't flag
- **WH-only prediction caps availability at 95.4%** (current 83.32% + 12.05% WH-led recovery)
- The remaining 4.63% POD-led OOS is **unreachable** without POD-level prediction

**Architectural Implication**: We NEED both WH-level and POD-level prediction to achieve 99.9% availability. This is not a "nice to have" - it's mathematically required.

---

### H2.2: Is There Meaningful POD Variance Within the Same WH?

#### Why This Matters

Even if allocation blindness exists (H2.1), maybe PODs under the same WH behave similarly enough that WH-level signals are sufficient. If PODs vary significantly, we need POD-level granularity to capture the signal.

| If Validated (stddev >10%) | If Not Validated |
|----------------------------|------------------|
| Same SKU behaves very differently across PODs | PODs are homogeneous |
| WH-level aggregation loses signal | WH-level is representative |
| POD-level prediction adds value | POD-level is overkill |

**Threshold**: Average stddev of availability across PODs within same WH >10%

#### Result: ✅ VALIDATED (23.24%)

**Data**: 163,787 WH×Item combinations (Bangalore, 7 days)

| Metric | Value |
|--------|-------|
| Avg stddev across PODs | **23.24%** |
| Median stddev | 23.89% |
| P90 stddev | 47.63% |

#### What This Proves

PODs under the same warehouse behave very differently. 23.24% > 10% threshold.

**Why This Matters**:
- Same item has very different availability across PODs within the same WH
- At P90, variance reaches 47.6% - extreme heterogeneity for 10% of items
- WH-level prediction treats all PODs as homogeneous - misses this signal completely
- A POD with 90% availability and a POD with 40% availability look the same when averaged at WH level

**Architectural Implication**: POD-level prediction is not just needed for allocation blindness (H2.1), it also captures signals that WH-level aggregation destroys. The two findings reinforce each other.

---

## Results Summary

| ID | Hypothesis | Threshold | Result | Status |
|----|------------|-----------|--------|--------|
| **H1.1** | Session vs search metrics diverge meaningfully | >20% SKUs with >5% divergence | **20.48%** | ✅ Validated |
| **H1.2** | Availability predicts conversion | Positive correlation | SKU: ~0, Store: -0.12 | ❌ Not validated |
| **H2.1** | Allocation blindness is real (WH has stock, POD doesn't) | >20% of OOS is POD-led | **27.8%** | ✅ Validated |
| **H2.2** | POD variance exists within same WH | avg stddev > 10% | **23.24%** | ✅ Validated |
| **H3.1** | OOS concentrated in long-tail (selection bias) | Top-Bottom gap >10% | **41.3%** gap | ✅ Validated |
| **H3.2** | Users substitute rather than abandon | Substitution >50% | No data; leans abandonment | ⚠️ Inconclusive |
| **H3.3** | OOS spread thin at impression level | <10% impressions OOS | **5.88%** | ✅ Validated |

---

## Why Availability ≠ Conversion: The Three Masking Effects

H1.2 showed no correlation between availability and conversion. This was puzzling — intuitively, OOS should hurt sales. H3.1-H3.3 explain WHY the correlation is masked:

### H3.1: Selection Bias — OOS is in the Long-Tail ✅

**Availability by Search Volume Decile** (Bangalore, 7 days):

| Decile | Avg Availability | % of Impressions |
|--------|------------------|------------------|
| 1 (Top 10%) | **89%** | 48% |
| 2 | **90%** | 18% |
| ... | ... | ... |
| 9 | **51%** | 0.7% |
| 10 (Bottom 10%) | **45%** | 0.2% |

**Key Finding**: Top 20% of SKUs by search have **89% availability** vs **48% for bottom 20%** — a **41 percentage point gap**.

**What This Means**: OOS is concentrated in SKUs nobody searches for. High-demand SKUs have excellent availability. The aggregate correlation is near-zero because OOS happens where it doesn't matter.

### H3.2: Substitution Effect — Leans Toward Abandonment ⚠️

**Finding**: No quantitative substitution rate data exists at Swiggy.

**Qualitative Signals Favor Abandonment**:
- Cart Error 161 removes OOS items, prompts user to search manually
- Multiple internal docs reference "cart drop-offs" and "abandonment"
- No automatic substitution suggestions in cart flow
- AI-Native Strategy explicitly aims to "reduce cart abandonment"

**Implication**: If abandonment > substitution, OOS DOES hurt conversion. But the impact is masked by H3.1 (OOS in long-tail) and H3.3 (OOS is rare).

### H3.3: Baseline Effect — OOS Encounters Are Rare ✅

| Metric | Value |
|--------|-------|
| % of SKU×Store×Day combos that are OOS | 24.63% |
| % of search impressions that are OOS | **5.88%** |

**The Paradox**: While ~25% of inventory combinations are OOS, only ~6% of search impressions encounter OOS items.

**Why**: Users don't search equally across all SKUs. High-demand SKUs (which get most impressions) have better availability. OOS encounters are diluted at the impression level.

### Combined Effect

```
Why No Correlation at Aggregate Level
──────────────────────────────────────
H3.1: OOS is concentrated in long-tail (41% gap)
      → OOS happens on items nobody searches for

H3.3: Only 5.88% of impressions encounter OOS
      → Individual impact exists but is rare

H3.2: When OOS does happen, users may abandon
      → But masked by (1) and (2)
```

---

## Strategic Implication: Differentiated Targets by Tier

The H3 findings validate **differentiated availability targets** rather than uniform 99.9%:

| Tier | Criteria | Current Avail | Target | Rationale |
|------|----------|---------------|--------|-----------|
| **Tier 1** | Top 20% search + essentials | 89% | **99%+** | OOS here → abandonment, high impact |
| **Tier 2** | Deciles 3-5 | 86-89% | **95%** | Good baseline, maintain |
| **Tier 3** | Deciles 6-7 | 76-83% | **90%** | Moderate priority |
| **Tier 4** | Deciles 8-10 (long-tail) | 45-65% | **85%** | Low search, OOS doesn't matter (H3.1) |

**Key Insight**: Bottom 40% of SKUs have 45-77% availability but generate only **4% of impressions**. Investing in long-tail availability has minimal customer impact.

---

## Bradman SKU Validation: Does the Current 99.9% List Align?

**Bradman SKUs** are the current list targeted for 99.9% availability. We validated whether they align with our Tier 1 framework.

### Bradman Selection Criteria (Current)

| Factor | Weight |
|--------|--------|
| GSV (Gross Sales Value) | 20% |
| Units Sold | 20% |
| Impressions (Overall) | 20% |
| Search High Confidence Impressions | 20% |
| I2C (Impression to Cart conversion) | 20% |

### Key Findings

| Metric | Bradman | Our Tier 1 (Top 20% + Essentials) |
|--------|---------|-----------------------------------|
| **SPIN count** | 5,256 | ~20,000 |
| **% of search impressions** | **27%** | **66%** |
| **Current availability** | 87% | 89% |
| **Coverage of essentials** | Partial | Full |

### The Gap Problem

| Issue | Data |
|-------|------|
| Bradman covers only **37%** of top search decile | 62% of high-search SPINs NOT covered |
| **140.3M impressions/week** go to non-Bradman high-search SPINs | Significant customer exposure gap |
| Essential categories underrepresented | F&V: 26M gap, Dairy: 13.7M gap |

### Categories Missing from Bradman

| L1 Category | Gap Impressions/Week | Why Missing |
|-------------|---------------------|-------------|
| **Fruits & Vegetables** | 26.0M | Lower I2C (browsing) |
| **Dairy, Bread, Eggs** | 13.7M | Lower GSV per unit |
| Home & Kitchen | 13.4M | Lower conversion |

**Critical Issue**: F&V and Dairy are **essentials with low substitutability** — exactly where OOS → abandonment. But Bradman's value-weighted scoring deprioritizes them.

### Verdict: Bradman Needs Re-examination ⚠️

| Aspect | Assessment |
|--------|------------|
| **Direction** | Right intent (prioritize high-value SKUs) |
| **Coverage** | Too narrow (27% vs 66% needed) |
| **Essentials** | Missing Fresh + Dairy categories |
| **Long-tail noise** | 7% of Bradman is in deciles 6-10 |

### Recommendations

1. **Expand Bradman** from 5.3K to ~20K SPINs (top 20% by search)
2. **Add essentials explicitly**: Dairy, Bread, Eggs, F&V staples regardless of I2C score
3. **Remove long-tail**: Drop SPINs in deciles 6-10 (low search, doesn't matter)
4. **Add "essentiality" factor**: Low-substitutability items should get 99.9% target

### Proposed Tier 1 Definition

```
Tier 1 = (Top 20% by search impressions)
       ∪ (Essential categories: Dairy, Bread, Eggs, F&V staples)
       - (Decile 6-10 SPINs)
```

**Key Contacts**: Shrinivas Ron (Program Owner), Sumit Pattanaik (pending logic changes)

---

## Key Discovery: OOS Handling in Search

**Question**: Does Instamart search hide OOS items or show them? This affects whether search-weighted is artificially inflated.

**Answer**: ✅ **VERIFIED** - OOS items ARE shown in Instamart search.

| Aspect | Behavior | Source |
|--------|----------|--------|
| **Visibility** | Shown in dedicated OOS widget section | GitHub PRs, test code |
| **Visual treatment** | "Sold Out" sticker, dimmed image, disabled CTA | `SwIMVariantDetailNodeV3.swift`, Android code |
| **Ranking** | Pushed to bottom/end of search results | `im-discovery-service` ranking logic |
| **Analytics** | Impressions tracked via GTM events | `OutOfStockFragmentViewModel.kt` |

**Data Validation** (Bangalore, 7 days):
- 9.5M OOS SKU-store-day combinations
- **3.88M (40.8%) received search impressions**
- **16.6M total impressions went to OOS items**

The 59.2% without impressions are likely low-demand SKUs nobody searched for, not hidden OOS.

**Why This Matters for Metric Interpretation**:

Since OOS items ARE shown (just ranked lower):
- Search-weighted isn't inflated by hiding OOS - it's inflated by **ranking**
- Users don't scroll to bottom → OOS gets fewer impressions organically
- This is intentional UX design, not data manipulation
- Search-weighted = "availability of what customers actually see above the fold"
- **Our metric recommendation stands**: search-weighted for customer targets is valid

---

## Conclusions

### 1. Metric Choice: Search-Weighted Only

| Use Case | Recommended Metric | Reasoning |
|----------|-------------------|-----------|
| **Supply Chain Brain** | **Search-weighted** | Focus on what customers actually search for |
| **Customer availability targets** | **Search-weighted** | Customer-backwards - reflects actual experience |
| **Assortment planning** | Session-based (optional) | Only for deciding what SHOULD be in catalog |

**Key insight**: The 7% gap (91% search-weighted vs 84% session-based) represents long-tail SKUs that nobody searches for. With limited POD shelf space and inventory budget, optimizing for session-based means stocking items that won't drive customer value.

**Why NOT session-based for operations**:
- If customers don't search for a SKU, stocking it doesn't improve their experience
- The "supply chain diagnostics" use case is weak — what action does it enable?
- Resources spent on long-tail availability could go to high-demand items
- Session-based only matters for assortment planning (deciding what to add/remove from catalog)

### 2. Prediction Architecture (Tiered by SKU Priority)

**Recommendation**: Differentiated investment by tier

| Tier | SKUs | Target | Prediction Approach |
|------|------|--------|---------------------|
| **Tier 1** | Top 20% + essentials | **99%+** | WH + POD (both layers) |
| **Tier 2** | Deciles 3-5 | **95%** | WH-level primarily |
| **Tier 3-4** | Bottom 50% (long-tail) | **85-90%** | Aggregate monitoring only |

**Why POD-level for Tier 1 only**:
- POD-level prediction is complex and resource-intensive
- 28% of OOS is POD-led (WH has stock, POD doesn't)
- But this matters most for Tier 1 where OOS → abandonment
- For Tier 3-4 (long-tail), WH-level suffices — few users search anyway

### 3. What NOT to Do

| Don't | Why |
|-------|-----|
| **Chase uniform 99.9%** | Diminishing returns above 90%; bottom 40% SKUs get 4% of impressions |
| Justify availability with conversion ROI | Availability is hygiene, not differentiator — use customer experience instead |
| Use session-based for operations | Includes long-tail SKUs nobody searches for |
| Invest equally in all SKUs | Top 20% have 89% avail, bottom 20% have 48% — prioritize where it matters |
| Build POD-level prediction for all SKUs | Too expensive; reserve for Tier 1 where OOS hurts most |

---

## Data Sources

| Table | Purpose | Location |
|-------|---------|----------|
| `sku_wise_availability_rca_with_reasons_v7` | Session-based availability, OOS attribution | Snowflake + Databricks |
| `im_sku_day_avl` | Daily availability by SKU×POD | Snowflake + Databricks |
| `srk_impressions_metrics_trans` | Search impressions, S2C, GMV | Snowflake + Databricks |

**Key fields**:
- `WH_STOCK1 = 'OOS'` → WH-led OOS
- `WH_STOCK1 = 'Instock'` → POD-led OOS (allocation blindness)
- `ASSORTMENT IN ('A', 'MLT', 'MnE')` → Priority SKUs (waterfall filter)

---

## Next Steps

1. **Align on tiered target framework** with stakeholders — 99%+ for Tier 1, 95%/90%/85% for others
2. **Define Tier 1 SKU list** — Top 20% by search + category essentials (milk, eggs, atta, oil, etc.)
3. **Build tiered prediction architecture**:
   - Tier 1: WH + POD prediction (both layers)
   - Tier 2-4: WH-level only (aggregate monitoring)
4. **Quantify substitution rate** — analyze `im_cart_splits_am` dataset with Kartikay Sharma
5. **Measure Tier 1 availability separately** — track 99%+ target for essentials independently
6. **Frame availability as customer experience** — not conversion ROI (hygiene factor)

---

## Data Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **No session-level OOS encounter data** | Can't measure "sessions where user saw OOS → did they convert?" | Used store-level proxy; recommend instrumenting session-level tracking |
| **No substitution rate data (H3.2)** | Can't quantify "% of users who substitute vs abandon when facing OOS" | Qualitative signals suggest abandonment > substitution; needs validation |
| **Cart abandonment dataset not analyzed** | `im_cart_splits_am` has OOS flag but hasn't been used for this | Analyze with Kartikay Sharma / Akash Mangal |
| **Bangalore only** | Results may not generalize to other cities | Recommend validating key hypotheses in 2-3 additional cities |

**Key contacts for deeper analysis**:
- **Kartikay Sharma** — OOS Cart analysis, flash sale OOS impact
- **Rajat Nagar** — "Shopping Continuation Mission OOS interventions" PRD
- **Akash Mangal** — `IM_Cart_Abandonment_Tracker_AM.sql` owner
- **Srinath K C** — FTR (Failure to Fulfill) data
- **Sunil Rathee** — OOS Handling Brain proposal owner

---

*Analysis conducted: 2026-01-15*
*Data scope: Bangalore, 7-30 days depending on query*
*Validated via: Databricks + Snowflake queries*
*OOS handling verified via: Glean code search + impression data analysis*
