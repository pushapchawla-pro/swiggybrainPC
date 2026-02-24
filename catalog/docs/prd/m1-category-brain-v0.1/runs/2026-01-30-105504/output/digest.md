# Category Brain Weekly Digest
## Personal Care | Week 5, January 2026

| | |
|---|---|
| **Run ID** | 2026-01-30-105504 |
| **Period** | 2026-01-01 to 2026-01-28 |
| **Insights Generated** | 20 |
| **Data Sources** | Snowflake (search, GMV), Databricks (availability RCA) |

---

## Executive Summary

This week's analysis reveals **5 key themes** driving Personal Care demand on Instamart:

1. **Feminine Hygiene Surge**: Pantyliners (+3215% MoM) and period products show explosive growth, but 62% availability is suppressing conversions. Fill rate issues are the primary bottleneck.

2. **Premium Oral Care Demand**: Close Up (+281% MoM), Sensodyne, and Dabur Red toothpaste searches surging. Oral Care availability at 58% - lowest among top categories.

3. **Sexual Wellness Normalization**: "Nooky chocolate" (+256% MoM) and general sexual wellness searches (+115% MoM) indicate mainstream adoption. 79% availability is adequate but improvement possible.

4. **K-Beauty & Premium Skincare**: CeraVe (+226% MoM) and premium moisturizers trending. Body Lotion category has 74% availability with fill rate issues.

5. **Makeup Tools & Accessories**: Spray bottles (+4404% MoM) and cotton ear buds showing unusual surge. Makeup Brushes & Tools at 57% availability - significant demand leakage.

### Confidence Level Guide

| Level | Criteria |
|-------|----------|
| **High** | >15K weekly searches OR >100% MoM growth with strong conversion |
| **Medium** | 3K-15K weekly searches with 50-100% MoM growth |
| **Low** | Emerging signal with limited historical validation |

### Iteration 1 Feedback Addressed

- **Longer trend windows**: Shifted from Week-over-Week to Month-over-Month to reduce noise from outliers and seasonal spikes
- **Sales data integration**: Added L2-level GMV growth alongside search growth for demand validation
- **Availability-adjusted demand**: Compute estimated demand = actual_gmv ÷ availability% to surface supply-constrained opportunities
- **Brand emergence detection**: New CB-8 task identifies NEW_BRAND and BREAKOUT brands via MoM GMV comparison
- **Search type segmentation**: Distinguish typed queries (organic intent) from autosuggest clicks (navigation) via SRP_ACTION field
- **Absolute volume gates**: Raised minimum threshold from 500 to 3,000 weekly searches to filter noise

**Not Yet Addressed:**
- External trend signals (Reddit, social listening) — Google Trends removed in v0.4, social sources TBD
- SKU-level GMV attribution — data gap identified; L2 is current ceiling (no search→item→GMV table exists)

---

## InsightCards

### Insight 1: Pantyliners Demand Explosion (+3215% MoM)

| | |
|---|---|
| **Consumer Insight** | Pantyliners searches surged from ~250 to 8,453/week - a 32x increase indicating rapid category adoption. This appears to be driven by increased awareness of daily hygiene products and potentially successful brand marketing campaigns. The 91% search-to-cart rate suggests high purchase intent when products are found. |
| **Strategy** | 1. Prioritize fill rate improvement for top pantyliner SKUs (Whisper, Stayfree)<br>2. Expand assortment to include organic/cotton variants for premium segment<br>3. Create discovery merchandising for first-time buyers |
| **Evidence** | **Search**: 8,453/wk (+3215% MoM)<br>**L2 GMV**: INR 43.4Cr (+2.7%)<br>**Availability**: 62.01% |
| **Confidence** | **Medium** - Extraordinary growth rate warrants validation; high S2C confirms intent |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 2: Spray Bottles Category Creation (+4404% MoM)

| | |
|---|---|
| **Consumer Insight** | Spray bottles searches exploded from ~280 to 12,837/week. This is likely driven by DIY beauty routines (facial mists, setting sprays, hair sprays) and home organization trends. The low 12% S2C rate indicates customers aren't finding what they need - potential assortment gap. |
| **Strategy** | 1. Audit spray bottle assortment - add cosmetic-grade options (fine mist, travel size)<br>2. Cross-merchandise with DIY skincare ingredients<br>3. Address 57% availability through fill rate optimization |
| **Evidence** | **Search**: 12,837/wk (+4404% MoM)<br>**L2 GMV**: INR 2.8Cr (-9.3%)<br>**Availability**: 56.64% |
| **Confidence** | **Medium** - High search volume confirmed but low S2C suggests catalog gaps |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 3: V-Wash Intimate Hygiene Growth (+228% MoM)

| | |
|---|---|
| **Consumer Insight** | V-Wash searches at 11,956/week with 228% MoM growth reflects mainstream adoption of intimate hygiene products. The 91% S2C rate is exceptional - customers know what they want and convert when available. This is a brand-led category with high loyalty. |
| **Strategy** | 1. Ensure 100% availability on V-Wash core SKUs (100ml, 200ml, 350ml)<br>2. Expand to V-Wash adjacent products (wipes, plus variants)<br>3. Target first-time buyers with smaller trial sizes |
| **Evidence** | **Search**: 11,956/wk (+228% MoM)<br>**L2 GMV**: INR 43.4Cr (+2.7%)<br>**Availability**: 62.01% |
| **Confidence** | **High** - Strong volume, growth, and conversion metrics |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 4: Premium Shampoo Discovery - L'Oreal Paris Moisture (+789% MoM)

| | |
|---|---|
| **Consumer Insight** | L'Oreal Paris moisture-specific searches grew 8x to 4,917/week, indicating premiumization in hair care. The 124% S2C rate (>100% due to basket additions) shows strong category browsing behavior. Customers searching for specific moisture solutions are high-value. |
| **Strategy** | 1. Create "Dry Hair Solutions" curated collection featuring L'Oreal, Herbal Essences, Sebamed<br>2. Improve fill rate for premium shampoo variants<br>3. Cross-sell with conditioners and hair masks |
| **Evidence** | **Search**: 4,917/wk (+789% MoM)<br>**L2 GMV**: INR 41.2Cr (-0.4%)<br>**Availability**: 72.98% |
| **Confidence** | **Medium** - Strong growth but narrower search term |

**Tags**: `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 5: Close Up Toothpaste Resurgence (+281% MoM)

| | |
|---|---|
| **Consumer Insight** | Close Up searches surged to 12,680/week - a nostalgia-driven or value-seeking behavior as consumers trade down from premium oral care. The 103% S2C rate indicates high conversion, but 58% availability means significant lost sales. Oral Care has the lowest availability among top L2s. |
| **Strategy** | 1. Address fill rate issues for Close Up core SKUs immediately<br>2. Bundle Close Up with mouthwash for basket building<br>3. Monitor premium-to-value trade-down across oral care |
| **Evidence** | **Search**: 12,680/wk (+281% MoM)<br>**L2 GMV**: INR 26.4Cr (-0.5%)<br>**Availability**: 58.49% |
| **Confidence** | **Medium** - High volume and growth; availability is critical bottleneck |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 6: Sensodyne Sensitivity Care (+127% MoM)

| | |
|---|---|
| **Consumer Insight** | Sensodyne repair searches at 15,994/week indicate growing awareness of sensitivity issues. This is a premium, high-margin segment with loyal customers. The 103% S2C shows category browsing - customers often add related products. |
| **Strategy** | 1. Ensure Sensodyne Repair & Protect, Rapid Relief variants always available<br>2. Create "Sensitivity Care" bundle with sensitivity toothbrush<br>3. Target new customers with sample/travel sizes |
| **Evidence** | **Search**: 15,994/wk (+127% MoM)<br>**L2 GMV**: INR 26.4Cr (-0.5%)<br>**Availability**: 58.49% |
| **Confidence** | **Medium** - Strong premium indicator with high volume |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 7: Dabur Red Ayurvedic Oral Care (+112% MoM)

| | |
|---|---|
| **Consumer Insight** | Dabur Red searches at 15,904/week with 112% growth reflects the ayurvedic/natural personal care trend. Combined with Close Up and Sensodyne, oral care shows multi-segment growth (value, premium, natural). Fill rate issues are category-wide. |
| **Strategy** | 1. Create "Ayurvedic Oral Care" collection (Dabur Red, Patanjali, Vicco)<br>2. Prioritize fill rate for Dabur Red 150g, 300g family packs<br>3. Cross-sell with Dabur mouthwash and tongue cleaners |
| **Evidence** | **Search**: 15,904/wk (+112% MoM)<br>**L2 GMV**: INR 26.4Cr (-0.5%)<br>**Availability**: 58.49% |
| **Confidence** | **Medium** - Part of broader oral care surge |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 8: Vicks Lozenges Seasonal Surge (+1885% MoM)

| | |
|---|---|
| **Consumer Insight** | Vicks lozenges searches exploded to 5,021/week - a 19x increase driven by seasonal cold/flu and throat care needs. The 51% S2C rate is moderate but expected for pharma products where customers compare options. |
| **Strategy** | 1. Stock up on Vicks variants ahead of remaining winter season<br>2. Create "Cold & Cough" bundles with related OTC products<br>3. Address 61% availability through better demand forecasting |
| **Evidence** | **Search**: 5,021/wk (+1885% MoM)<br>**L2 GMV**: INR 17.0Cr (-2.5%)<br>**Availability**: 61.11% |
| **Confidence** | **Medium** - Clear seasonal pattern; plan for next season |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 9: Paranda Hair Accessories Trend (+420% MoM)

| | |
|---|---|
| **Consumer Insight** | Paranda (traditional hair extensions) searches grew 4x to 6,452/week, likely driven by wedding season and traditional fashion trends. The 18% S2C and 14% availability indicate severe supply constraints and assortment gaps. |
| **Strategy** | 1. Urgently address long-term supply issues (current top OOS reason)<br>2. Expand paranda assortment - colors, lengths, materials<br>3. Partner with ethnic/traditional accessories brands |
| **Evidence** | **Search**: 6,452/wk (+420% MoM)<br>**L2 GMV**: INR 3.4Cr (+2.0%)<br>**Availability**: 14.29% |
| **Confidence** | **Medium** - Strong trend but critical availability issue |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 10: Aroma Magic Facial Kits (+325% MoM)

| | |
|---|---|
| **Consumer Insight** | Aroma Magic facial kit searches grew 3x to 3,700/week, reflecting at-home spa/facial trend. The 117% S2C rate shows high conversion and basket building. Planning/ordering issues are causing 64% availability. |
| **Strategy** | 1. Fix planning/ordering pipeline for Aroma Magic kits<br>2. Create "At-Home Facial" collection with tools and masks<br>3. Target with weekend delivery promotions |
| **Evidence** | **Search**: 3,700/wk (+325% MoM)<br>**L2 GMV**: INR 22.6Cr (-5.8%)<br>**Availability**: 63.75% |
| **Confidence** | **Medium** - Strong growth in premium self-care segment |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 11: Aloe Vera Universal Demand (+101% MoM)

| | |
|---|---|
| **Consumer Insight** | Aloe vera searches at 27,897/week (2nd highest volume) with 101% growth. This is a multi-use ingredient (skincare, haircare, sunburn) driving search. The 117% S2C indicates customers add multiple aloe products to cart. |
| **Strategy** | 1. Create "Aloe Vera Hub" featuring gels, face washes, hair masks<br>2. Stock pure aloe vera gel from multiple brands (Patanjali, WOW, Nature Republic)<br>3. Position as summer/sun care essential |
| **Evidence** | **Search**: 27,897/wk (+101% MoM)<br>**L2 GMV**: INR 22.6Cr (-5.8%)<br>**Availability**: 63.75% |
| **Confidence** | **Medium** - Very high volume with steady growth |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 12: Livon Hair Serums Premium Segment (+79% MoM)

| | |
|---|---|
| **Consumer Insight** | Livon serum searches at 4,965/week with 79% growth and exceptional 241% GMV growth in hair oil/serum category indicates strong premiumization. Customers are willing to pay for salon-quality hair finish products. |
| **Strategy** | 1. Ensure Livon Serum (50ml, 100ml) consistently available<br>2. Expand premium serum range (Moroccan oil, argan serums)<br>3. Create "Salon Finish at Home" bundles |
| **Evidence** | **Search**: 4,965/wk (+79% MoM)<br>**L2 GMV**: INR 3.1L (+241%)<br>**Availability**: 68.37% |
| **Confidence** | **Medium** - Strong premium indicator with GMV outpacing search |

**Tags**: `SUPPLY_CONSTRAINED` `HIGH_GROWTH`

---

### Insight 13: Nooky Chocolate - Sexual Wellness Innovation (+256% MoM)

| | |
|---|---|
| **Consumer Insight** | "Nooky chocolate" searches at 5,430/week indicate demand for discreet, novel sexual wellness products. The 61% S2C shows good conversion. This represents category maturation - customers seeking variety beyond traditional products. |
| **Strategy** | 1. Expand aphrodisiac/novelty product range<br>2. Improve discreet packaging messaging<br>3. Address planning/ordering gaps affecting 79% availability |
| **Evidence** | **Search**: 5,430/wk (+256% MoM)<br>**L2 GMV**: INR 20.7Cr (-1.9%)<br>**Availability**: 79.08% |
| **Confidence** | **Medium** - Emerging niche with strong growth |

**Tags**: `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 14: CeraVe Dermatologist-Recommended Skincare (+226% MoM)

| | |
|---|---|
| **Consumer Insight** | CeraVe searches at 12,309/week with 226% growth reflects the "dermatologist recommended" trend driven by social media (TikTok/Instagram). Despite low 48% S2C, customers who find products convert - availability at 74% is leaving demand unmet. |
| **Strategy** | 1. Prioritize CeraVe core range availability (Moisturizing Cream, Foaming Cleanser, SA Cleanser)<br>2. Target with "Dermatologist Approved" collection<br>3. Monitor competitor premium skincare (La Roche-Posay, The Ordinary) |
| **Evidence** | **Search**: 12,309/wk (+226% MoM)<br>**L2 GMV**: INR 24.6Cr (-12.4%)<br>**Availability**: 74.08% |
| **Confidence** | **High** - Strong social-driven demand with clear brand intent |

**Tags**: `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 15: Vaseline Moisturiser Traditional Trust (+165% MoM)

| | |
|---|---|
| **Consumer Insight** | Vaseline moisturiser searches at 7,987/week with 165% growth shows customers seeking trusted, value moisturization. This contrasts with CeraVe premium trend - indicates segment bifurcation in body lotion. |
| **Strategy** | 1. Ensure Vaseline range fully stocked (Original, Cocoa Butter, Aloe)<br>2. Position as value-for-money body care staple<br>3. Bundle with Vaseline lip care for basket building |
| **Evidence** | **Search**: 7,987/wk (+165% MoM)<br>**L2 GMV**: INR 24.6Cr (-12.4%)<br>**Availability**: 74.08% |
| **Confidence** | **Medium** - Strong brand search with segment validation |

**Tags**: `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 16: Mysore Soap Heritage Brand (+114% MoM)

| | |
|---|---|
| **Consumer Insight** | Mysore Sandal soap searches at 40,303/week (highest volume signal) with 114% growth indicates strong demand for traditional/heritage products. The 50% S2C is solid for soap category. GMV growing at 9% shows healthy category. |
| **Strategy** | 1. Ensure Mysore Sandal core variants (regular, gold) always available<br>2. Create "Heritage Personal Care" collection<br>3. Address planning/ordering issues affecting 73% availability |
| **Evidence** | **Search**: 40,303/wk (+114% MoM)<br>**L2 GMV**: INR 16.4Cr (+9.0%)<br>**Availability**: 73.23% |
| **Confidence** | **High** - Highest volume signal with consistent growth |

**Tags**: `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 17: Garnier Hair Colour Mass Premium (+119% MoM)

| | |
|---|---|
| **Consumer Insight** | Garnier colour searches at 8,525/week with 119% growth indicates strong at-home hair coloring trend. The 34% S2C suggests customers comparing shades - need better shade discovery. Fill rate issues at 63% availability hurt conversions. |
| **Strategy** | 1. Improve shade range completeness for Garnier Color Naturals<br>2. Create shade finder/guide for hair colour category<br>3. Address fill rate issues for top-selling shades |
| **Evidence** | **Search**: 8,525/wk (+119% MoM)<br>**L2 GMV**: INR 8.1Cr (-4.7%)<br>**Availability**: 63.34% |
| **Confidence** | **Medium** - Strong volume with clear category opportunity |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 18: Mehendi Natural Hair Color (+97% MoM)

| | |
|---|---|
| **Consumer Insight** | Mehendi searches at 15,280/week with 97% growth (7% zero-result rate) indicates demand for natural hair coloring. Combined with Garnier, hair colour is a dual-opportunity category (chemical + natural). Zero-result rate suggests catalog gaps. |
| **Strategy** | 1. Expand mehendi brand range (Godrej, VLCC, Khadi)<br>2. Address 7% zero-result rate with catalog expansion<br>3. Position as "Natural Hair Color" collection |
| **Evidence** | **Search**: 15,280/wk (+97% MoM)<br>**L2 GMV**: INR 8.1Cr (-4.7%)<br>**Availability**: 63.34% |
| **Confidence** | **High** - High volume with zero-result signal indicating gaps |

**Tags**: `SUPPLY_CONSTRAINED` `HIGH_GROWTH`

---

### Insight 19: Kiro Clean Beauty Makeup (+292% MoM)

| | |
|---|---|
| **Consumer Insight** | Kiro lip makeup searches at 7,277/week with 292% growth signals clean beauty/D2C brand adoption. The 29% S2C is typical for makeup discovery. Lip makeup category at 71% availability with fill rate issues. |
| **Strategy** | 1. Prioritize Kiro bestsellers (lipsticks, lip crayons) availability<br>2. Create "Clean Beauty" brand collection (Kiro, Sugar, Kay Beauty)<br>3. Address fill rate for makeup category broadly |
| **Evidence** | **Search**: 7,277/wk (+292% MoM)<br>**L2 GMV**: INR 4.8Cr (-17.3%)<br>**Availability**: 71.04% |
| **Confidence** | **Medium** - Strong D2C brand signal with growth |

**Tags**: `DEMAND_SURGE` `HIGH_GROWTH`

---

### Insight 20: Cotton Ear Buds Utility Demand (+224% MoM)

| | |
|---|---|
| **Consumer Insight** | Cotton ear bud searches at 3,183/week with 224% growth in makeup tools category. This basic utility product showing surge may indicate customers using Instamart for personal care restocking. The 12% S2C and 57% availability suggest significant unmet demand. |
| **Strategy** | 1. Stock cotton ear buds from multiple brands at competitive prices<br>2. Position in "Daily Essentials" quick-add collection<br>3. Address 57% availability - low-cost, high-frequency item |
| **Evidence** | **Search**: 3,183/wk (+224% MoM)<br>**L2 GMV**: INR 2.8Cr (-9.3%)<br>**Availability**: 56.64% |
| **Confidence** | **Medium** - Clear demand signal for utility category |

**Tags**: `SUPPLY_CONSTRAINED` `DEMAND_SURGE` `HIGH_GROWTH`

---

## Availability Summary: Top 10 Most Impacted L2 Categories

| L2 Category | Availability | Top OOS Reason | Non-Avail Sessions | SKU Count |
|-------------|--------------|----------------|-------------------|-----------|
| Shampoo and Conditioner | 72.98% | Fill Rate Issue | 49.9M | 35,648 |
| Feminine Hygiene | 62.01% | Fill Rate Issue | 42.1M | 21,396 |
| Face and Lip Care | 75.56% | Planning/Ordering | 37.2M | 32,299 |
| Oral Care | 58.49% | Fill Rate Issue | 34.3M | 16,704 |
| Face Wash and Scrub | 72.43% | Fill Rate Issue | 27.7M | 19,450 |
| Hair Oil and Serum | 68.37% | Fill Rate Issue | 26.9M | 16,296 |
| Basic Pharma | 61.11% | Fill Rate Issue | 24.9M | 12,913 |
| Sexual Wellness | 79.08% | Planning/Ordering | 23.4M | 21,728 |
| Perfumes Deos and Talc | 82.30% | Fill Rate Issue | 21.1M | 23,098 |
| Lip Makeup | 71.04% | Fill Rate Issue | 20.1M | 14,166 |

**Key Finding**: Fill Rate Issues dominate as the top OOS reason across 8 of 10 categories. This indicates warehouse-to-store distribution bottlenecks rather than procurement gaps.

---

## Emerging Brands to Watch

| Brand | Category | Status | GMV Growth |
|-------|----------|--------|------------|
| Insight Cosmetics | Face Makeup | NEW_BRAND | +18,603% |
| Muuchstac | Face Wash | NEW_BRAND | +11,500% |
| Clayco | Face Wash | NEW_BRAND | New Entry |
| Schwarzkopf | Shampoo | NEW_BRAND | +1,233% |
| Vaseline | Lip Makeup | BREAKOUT | +1,832% |
| Bioderma | Face Cream | BREAKOUT | +256% |
| Moxie Beauty | Makeup Tools | HIGH_GROWTH | +87% |

---

## Data Sources & Methodology

### Signal Fusion Pipeline
1. **Search Volume**: Snowflake `IM_SEARCH_DB_STRING_TO_CATEGORY` - weekly aggregation
2. **Zero Result Rate**: Snowflake `IM_SEARCH_FACT` with `NULL_SEARCH=1`
3. **GMV & Conversion**: Snowflake category-level aggregates
4. **Availability RCA**: Databricks `sku_wise_availability_rca_with_reasons_v7`
5. **Brand Emergence**: Snowflake brand-level GMV with MoM comparison

### Scoring Formula
```
Emerging_Score = (log10(search_volume) * 2) +
                 (mom_growth_pct * 0.1) +
                 ((1 - zero_result_rate) * 10) +
                 (s2c_rate * 0.1) +
                 ((1 - availability_pct) * 20)
```

The Emerging Score identifies search terms with high unmet demand by combining five signals: **search volume** (log-scaled to prevent popular terms from dominating), **month-over-month growth** (faster rising = higher score), **catalog coverage** (low zero-result rate means we have products to sell), **purchase intent** (search-to-cart rate shows real buying behavior), and most heavily weighted, **supply constraint** (low availability suggests demand exceeds supply—the core opportunity signal). A term like "cerave cleanser" with 5K searches, +150% growth, good catalog match, 30% S2C, but only 35% availability would score ~48 points, flagging it as a high-potential opportunity where fixing supply could directly capture latent demand.

### Quality Gates Applied
- Minimum search volume: 3,000/week
- Minimum MoM growth: 50%
- Maximum zero-result rate: 10%
- Confidence scoring based on volume + growth thresholds

---

## Evidence File Index

| File | Description | Location |
|------|-------------|----------|
| ranked_terms.csv | 100 terms passing gates | `intermediate/ranked_terms.csv` |
| availability_rca.csv | 56 L2 availability breakdown | `evidence/databricks/availability_rca.csv` |
| brand_emergence.csv | 50 brands with status | `evidence/snowflake/brand_emergence.csv` |
| digest.md | This document | `output/digest.md` |
| insights.json | Structured insights | `output/insights.json` |

---

*Generated by Category Brain v0.1 | Run: 2026-01-30-105504*
