# Category Brain Weekly Digest
## Personal Care | Week 5, 2026 (Jan 21-27)

**Generated**: 2026-01-29 11:00 IST
**Run ID**: 2026-01-29-104830
**Evidence Folder**: [runs/2026-01-29-104830/evidence/](../evidence/)

---

## Executive Summary

This week's analysis identified **8 high-priority opportunities** across Personal Care categories. Key themes:

1. **Small/Travel Size Surge**: Sachet and travel-size products showing explosive growth
2. **Feminine Hygiene Supply Crunch**: Multiple brands showing demand surge but constrained by 62% availability
3. **Hair Colour Opportunity**: Beard colour and mehndi trending, supply-constrained
4. **D2C Brand Rise**: Premium D2C brands (CeraVe, The Derma Co, Cetaphil) showing strong growth

---

## Confidence Level Guide

| Level | Definition | Criteria |
|-------|------------|----------|
| **High** | Strong signal alignment | Google Trends + Internal search signals both positive/negative |
| **Medium** | Moderate certainty | High volume (>2000/wk) OR Google Trends data available |
| **Low** | Directional only | Internal signal only, lower volume, use with caution |

---

## Insight 1: Soap Paper (+846% WoW)

| | |
|---|---|
| **Consumer Insight** | Customers are searching for "soap paper" (portable paper soap sheets) at unprecedented rates—from 259 to 2,451 searches WoW. This signals demand for travel-friendly, hygienic handwash alternatives, aligning with convenience-seeking behavior. |
| **Strategy** | 1. Expand soap paper SKU assortment immediately<br>2. Address fillrate issues with vendors (current 62% availability)<br>3. Feature in "travel essentials" collection |
| **Evidence** | **Why this insight?** Highest emerging_score (69.2) in the dataset. Internal search volume jumped 9.5x in one week with near-zero (0.04%) zero-result rate, indicating we have the product but supply is constrained.<br><br>**Source Data:**<br>• Snowflake: 2,451 searches (Jan 21-27) vs 259 (Jan 14-20)<br>• Databricks: L2 category (Hand Wash) at 62.44% availability, top OOS reason: fillrate issue<br>• Google Trends: No data (niche term) |
| **Confidence** | **Medium** — High internal growth signal (+846%) with meaningful volume (2,451/wk). No Google Trends validation available for this niche term, but internal data is strong and actionable. |

---

## Insight 2: Sachet/Small Shampoo Demand Surge

| | |
|---|---|
| **Consumer Insight** | Multiple search variants for small-format shampoo showing triple-digit growth: "shampoo sachets" (+587%), "small shampoo" (+341%), "shampoo packets" (+177%). Combined 3,717 weekly searches indicate strong demand for trial-size and value-pack formats. |
| **Strategy** | 1. Expand sachet SKU range across top brands (L'Oreal, Dove, Head & Shoulders)<br>2. Create travel-size bundles for impulse purchase<br>3. Review pricing strategy for value packs |
| **Evidence** | **Why this insight?** Three distinct search terms with similar intent all showing >100% WoW growth suggests a real trend, not an anomaly. Category availability at 73% is acceptable but fillrate issues persist.<br><br>**Source Data:**<br>• Snowflake: "shampoo sachets" 1,443 (was 210), "small shampoo" 732 (was 166), "shampoo packets" 542 (was 196)<br>• Databricks: L2 category (Shampoo & Conditioner) at 72.98% availability<br>• Google Trends: No data (long-tail terms) |
| **Confidence** | **Low** — Strong internal signals across multiple related terms, but no external validation from Google Trends. Volume is moderate. Recommend validating with CM before major investment. |

---

## Insight 3: Feminine Hygiene Supply Crisis

| | |
|---|---|
| **Consumer Insight** | Strong demand signals across feminine hygiene with supply severely constrained at 62% availability. Pantyliners (+271%, 5,983 searches), Stayfree (+93%, 3,469), Whisper XXL (+60%, 3,884), and Nua pad (+72%, 2,820) all trending. Fillrate issues causing an estimated 42M lost sessions. |
| **Strategy** | 1. **Urgent**: Fix fillrate issues with Whisper, Stayfree, and Nua suppliers<br>2. Expand pantyliner assortment—currently underserved<br>3. Prioritize XXL size variants (multiple XXL searches trending) |
| **Evidence** | **Why this insight?** High-volume category with multiple brands showing synchronized growth—unlikely to be random. 62% availability is critically low for an essential category. Databricks shows 42M non-available sessions attributed to fillrate issues.<br><br>**Source Data:**<br>• Snowflake: pantyliners 5,983 (was 1,611), stayfree pad 3,469 (was 1,802), whisper xxl 3,884 (was 2,428)<br>• Databricks: L2 category at 62.01% availability, 42.1M non-avail sessions, top reason: fillrate issue<br>• Google Trends: No specific data |
| **Confidence** | **Medium** — High volume (5,983/wk for pantyliners), multiple corroborating signals across brands. Supply constraint is objectively verified via Databricks RCA data. |

---

## Insight 4: Beard Colour & Natural Hair Dye

| | |
|---|---|
| **Consumer Insight** | Men's grooming segment showing growth with "beard colour" (+325%) alongside natural hair colour demand. "Mehndi" (+174%) and "Indus Valley" brand gaining traction, indicating interest in natural/henna-based alternatives. Category faces 63% availability constraint. |
| **Strategy** | 1. Expand beard colour SKU range (currently limited)<br>2. Add natural/henna-based hair colour options (Indus Valley, Attar Ayurveda)<br>3. Address fillrate issues limiting availability |
| **Evidence** | **Why this insight?** Beard colour is a niche but growing segment in men's grooming. Mehndi has both internal growth (+174%) and Google Trends presence (16/100 interest), providing cross-validation. Supply constraint at 63% is limiting conversion.<br><br>**Source Data:**<br>• Snowflake: beard colour 896 (was 211), mehndi 1,118 (was 408), garnier colour 3,128 (was 1,437)<br>• Databricks: L2 category (Hair Colour) at 63.34% availability<br>• Google Trends: mehndi at 16/100 interest (validates awareness) |
| **Confidence** | **Medium** — Mehndi has Google Trends validation. Beard colour is internal-only but growth is significant (+325%). Multiple related terms trending (garnier colour +118%). |

---

## Insight 5: Premium Skincare Brands Rising

| | |
|---|---|
| **Consumer Insight** | D2C and premium skincare brands showing strong growth: Cetaphil moisturizer (+399%), Boroline antiseptic (+478%), Sanfe exfoliating (+406%), molecular sunscreen (+254%). Customers increasingly seeking targeted skincare solutions and science-backed ingredients. |
| **Strategy** | 1. Ensure adequate inventory of Cetaphil, The Derma Co, Deconstruct ranges<br>2. Highlight "molecular sunscreen" as a trending ingredient/format<br>3. Review pricing competitiveness vs D2C direct channels |
| **Evidence** | **Why this insight?** Multiple premium/D2C brand searches showing 200-400% growth indicates a category-level shift toward premium skincare. Category availability at 78% is acceptable, so this is a demand-driven opportunity.<br><br>**Source Data:**<br>• Snowflake: cetaphil moisturizer 569 (was 114), boroline 584 (was 101), sanfe exfoliating 668 (was 132)<br>• Databricks: L2 category (Face Cream) at 78.41% availability<br>• Google Trends: No specific data for these terms |
| **Confidence** | **Low** — Strong internal signals but lower absolute volume (<700/wk per term). No Google Trends validation. Recommend monitoring for 2-3 more weeks before major assortment changes. |

---

## Insight 6: Oral Care Availability Critical

| | |
|---|---|
| **Consumer Insight** | "Small toothpaste" (+277%) trending alongside overall oral care demand. Category has the lowest availability in Personal Care at 58%, with fillrate issues affecting major brands. Estimated 34M lost sessions from supply issues. |
| **Strategy** | 1. **Urgent**: Prioritize oral care fillrate improvement (58% is critical)<br>2. Add travel-size toothpaste variants<br>3. Review Colgate and Sensodyne supply chain |
| **Evidence** | **Why this insight?** 58% availability is the lowest across all Personal Care L2 categories—a clear supply-side problem. Small toothpaste growth aligns with the broader "travel/small size" trend seen in shampoo and soap.<br><br>**Source Data:**<br>• Snowflake: small toothpaste 830 (was 220), colgate paste 2,562 (was 1,528)<br>• Databricks: L2 category (Oral Care) at 58.49% availability, 34.3M non-avail sessions<br>• Google Trends: No specific data |
| **Confidence** | **Low** — Availability crisis is objectively verified, but search volume for "small toothpaste" is moderate (830/wk). Main action should be fixing supply, which is justified by RCA data regardless of search trends. |

---

## Insight 7: Makeup - Stick-On Nails & D2C Brands

| | |
|---|---|
| **Consumer Insight** | Makeup category seeing interest in stick-on nails (+103%) and Insight Cosmetics brand (+77%, 2,111 searches). Renee lipstick (+69%) also growing. Indicates interest in DIY beauty and affordable D2C makeup brands. |
| **Strategy** | 1. Expand stick-on nail assortment (currently limited)<br>2. Feature Insight Cosmetics prominently (D2C brand gaining traction)<br>3. Add more Renee lipstick variants |
| **Evidence** | **Why this insight?** Insight Cosmetics has high volume (2,111/wk) with +77% growth—suggests strong brand momentum. Stick-on nails is a niche but fast-growing segment. Category availability at 71% is acceptable.<br><br>**Source Data:**<br>• Snowflake: insight cosmetics 2,111 (was 1,191), stick on nails 526 (was 259), renee lipstick 954 (was 564)<br>• Databricks: L2 category (Face Makeup) at 71.1% availability<br>• Google Trends: No specific data |
| **Confidence** | **Medium** — Insight Cosmetics has high volume (>2000/wk), meeting medium confidence threshold. Stick-on nails is lower volume but growth is notable. |

---

## Insight 8: Soap - Ghar Soaps & Regional Brands

| | |
|---|---|
| **Consumer Insight** | "Ghar soaps" showing massive volume (11,148 searches, +98% WoW) alongside Lifebuoy (+104%), Mysore Sandal (+65%). Strong demand for traditional, value-oriented, and regional soap brands. |
| **Strategy** | 1. Ensure Ghar Soaps (regional brand) has adequate inventory—highest volume term<br>2. Feature value packs for Lifebuoy and Mysore Sandal<br>3. Add small/travel soap variants |
| **Evidence** | **Why this insight?** Ghar Soaps at 11,148 weekly searches is the highest-volume single term in this analysis. Near-doubling WoW growth suggests either a viral moment or successful marketing. Worth investigating the cause.<br><br>**Source Data:**<br>• Snowflake: ghar soaps 11,148 (was 5,639), lifebuoy soap 2,056 (was 1,007), mysore sandal 6,195 (was 3,752)<br>• Databricks: L2 category (Soap) at 73.23% availability, top OOS reason: Planning Ordering Issue<br>• Google Trends: No specific data |
| **Confidence** | **Medium** — Very high volume (11,148/wk) provides confidence despite lack of Google Trends data. Multiple soap brands showing synchronized growth validates the category trend. |

---

## Availability Summary by L2 Category

| L2 Category | Availability | Status | Top OOS Reason | Est. Lost Sessions |
|-------------|--------------|--------|----------------|-------------------|
| Oral Care | **58%** | 🔴 Critical | Fillrate Issue | 34M |
| Feminine Hygiene | **62%** | 🔴 Critical | Fillrate Issue | 42M |
| Hand Wash & Sanitizer | **62%** | 🔴 Critical | Fillrate Issue | 10M |
| Hair Colour | **63%** | 🟡 Warning | Fillrate Issue | 17M |
| Hair Oil & Serum | **68%** | 🟡 Warning | Fillrate Issue | 27M |
| Lip Makeup | **71%** | 🟢 Acceptable | Fillrate Issue | 20M |
| Shampoo & Conditioner | **73%** | 🟢 Acceptable | Fillrate Issue | 50M |
| Soap | **73%** | 🟢 Acceptable | Planning Issue | 19M |
| Face Cream | **78%** | 🟢 Acceptable | Fillrate Issue | 14M |

---

## Data Sources & Methodology

### Sources
| Source | Table/API | Date Range | Records |
|--------|-----------|------------|---------|
| Internal Search | Snowflake: `IM_SEARCH_FACT` | Jan 14-27, 2026 | 100 terms |
| Category Mapping | Snowflake: `IM_SEARCH_DB_STRING_TO_CATEGORY` | Jan 14, 2026 | Snapshot |
| Availability RCA | Databricks: `sku_wise_availability_rca_with_reasons_v7` | Jan 28, 2026 | 100 rows |
| External Trends | Google Trends (pytrends) | 3-month lookback | 20 terms |

### Signal Fusion Formula
```
emerging_score = 0.5 × internal_growth_normalized +
                 0.3 × google_interest_normalized +
                 0.2 × (100 - zero_result_rate)
```

### Selection Criteria
Insights were selected based on:
1. **Emerging Score** — Composite score ranking all terms
2. **Volume Threshold** — Minimum 500 searches/week for inclusion
3. **Category Grouping** — Related terms grouped into single insights
4. **Supply-Demand Balance** — Flagged supply-constrained vs demand-surge opportunities

---

## Evidence File Index

| File | Description |
|------|-------------|
| [evidence/snowflake/search_metrics.csv](../evidence/snowflake/search_metrics.csv) | 100 search terms with WoW growth |
| [evidence/snowflake/search_metrics.sql](../evidence/snowflake/search_metrics.sql) | Query used to extract search data |
| [evidence/databricks/availability_rca.csv](../evidence/databricks/availability_rca.csv) | Availability RCA by L1/L2/reason |
| [evidence/databricks/rca_summary.txt](../evidence/databricks/rca_summary.txt) | Summary of OOS reasons |
| [evidence/google_trends/terms_queried.csv](../evidence/google_trends/terms_queried.csv) | Google Trends data for 20 terms |
| [intermediate/signal_fusion.json](../intermediate/signal_fusion.json) | Full ranked results with scores |
| [intermediate/ranked_terms.csv](../intermediate/ranked_terms.csv) | Simplified ranked output |

---

*Generated by Category Brain v0.1*
