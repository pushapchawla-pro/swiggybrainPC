# Landscape: Catalog & Assortment Intelligence

**Updated**: 2026-01-28
**Problem Context**: Category Brain v0.1 - automated trend detection and catalog gap identification for Category Managers

---

## Executive Summary

| Channel | Status | Key Finding |
|---------|--------|-------------|
| Glean/Internal Docs | ✅ Complete | Existing tools (Category Mitr, Unify Apps) + rich search analytics infrastructure |
| Snowflake Data | ✅ Complete | `IM_SEARCH_FACT` has complete search funnel, null search rate <0.5% |
| Databricks Data | ✅ Complete | 45M SKU catalog, RCA tables with 20+ reason codes, real-time availability |
| pytrends POC | ✅ Complete | Works for India, 30s delays required, viable for batch processing |
| LangChain Patterns | ✅ Complete | Structured output + Router pattern recommended |

**Bottom Line**: All data sources are accessible and production-quality. The primary opportunity is **conversion optimization** (search→purchase), not coverage gaps (null search rate is already <0.5%).

---

## Internal Landscape

### 1. Existing Systems & Tools

| System | Purpose | Owner | Relevance |
|--------|---------|-------|-----------|
| **Category Mitr** | Copilot for category teams - growth and ad campaigns | Central AI | High - can extend with trend insights |
| **Unify Apps Dashboard** | Missing brands/SKUs analysis vs competitors | External | High - competitor gap analysis |
| **Strategy+1 Tracker** | Category strategy planning with sizing, targets | Rajeshwari Kannan | High - delivery vehicle for insights |
| **MIM (Master Inventory Management)** | Central dashboard for inventory ops | SCM | Medium - integration point |
| **Grafana/Mission Control** | Search Intent + Null Search monitoring | IM Search Team | High - existing infrastructure |

### 2. Internal Data Sources

#### Snowflake (Primary for Analytics)

| Table | Purpose | Volume | Freshness |
|-------|---------|--------|-----------|
| `ANALYTICS.PUBLIC.IM_SEARCH_FACT` | Event-level search logs with funnel | ~10M/day | T-1 |
| `ANALYTICS.PUBLIC.IM_SEARCH_DB_STRING_TO_CATEGORY` | Search term → L1/L2 mapping with Q2C | Daily agg | T-1 |
| `ANALYTICS.PUBLIC.SRK_CATEGORY_DASHBOARD_LABEL3` | L1/L2/L3 + store-level SKU data | Snapshot | T-1 |
| `ANALYTICS.PUBLIC.SKU_CATALOG_IM_BIZFIN_ITEM_MASTER` | Full L1-L6 hierarchy, brand, attributes | Master | Daily |
| `ANALYTICS.PUBLIC.IM_SEARCH_DB_PLATFORM_METRICS` | City/segment/slot aggregates | Daily | T-1 |

**Key Metrics Available**:
- `NULL_SEARCH` flag for zero-result detection
- `ORDER_SID` for search-to-purchase conversion
- `Q2C` (Query-to-Cart) rate per search term
- `MRR` (Mean Reciprocal Rank) for relevance

**Sample Query - Null Search Terms**:
```sql
SELECT SEARCH_STRING, COUNT(*) as searches
FROM ANALYTICS.PUBLIC.IM_SEARCH_FACT
WHERE DT = CURRENT_DATE - 1 AND NULL_SEARCH = 1
GROUP BY SEARCH_STRING
ORDER BY searches DESC LIMIT 50;
```

#### Databricks (Primary for ML/Features)

| Table | Purpose | Volume | Freshness |
|-------|---------|--------|-----------|
| `prod.streams_delta.im_search_event` | Real-time search events with intent | Streaming | Hourly |
| `prod.data_science_prod.im_catalog` | SKU catalog with hierarchy | 45.5M rows | Daily |
| `prod.analytics_prod.analytics_public_sku_wise_availability_rca_with_reasons_v7` | Availability with 20+ RCA codes | Daily | T-1 |
| `prod.features.trending_searches_delta` | Trending search detection | Real-time | Continuous |
| `prod.features.popular_searches_around_you` | Location-based popular searches | Features | Daily |

**Key Finding**: Availability RCA table already has reason codes:
- `oos_2.Not in ERP` - Not in catalog
- `oos_10.Planning Ordering Issue` - Forecasting/PO issue
- `oos_9.fillrate Issue` - Supply-led
- `oos_8.Long Term Supply Issue` - Strategic gaps

### 3. Internal APIs/Services

| Service | Purpose | Access |
|---------|---------|--------|
| IM Search API (Scout) | Real-time search with intent prediction | Internal |
| Synth | Central model gateway for AI features | Internal |
| Grafana DP Events | Search event monitoring | Dashboard |
| New Relic | AI Search performance monitoring | APM |

### 4. Key Contacts

| Domain | Contact | Role |
|--------|---------|------|
| IM Search Engineering | Mirza Kaazima Ifrah, Ujjwal Yadav | Search team leads |
| Search Analytics | Raj Shekhar | Analytics POC |
| Category Strategy | Rajeshwari Kannan | Strategy+1 Tracker |
| Catalog/Taxonomy | Ravina, Siddharth Nageswaran | NI-Catalog |
| AI/Copilots | Sidhant Panda, Sreeram Sridhar | Central AI |
| Query Expansion | Rutvik Vijjali | Search NLP |

---

## External Landscape

### 1. Google Trends (pytrends) - POC Complete

**Status**: ✅ Viable for batch processing

**POC Results**:

| Test Term | Data Points | Rising Queries | Top Queries |
|-----------|-------------|----------------|-------------|
| niacinamide serum | 93 | 14 | 25 |
| retinol cream | 93 | 4 | 18 |
| air fryer | 93 | 19 | 25 |

**Sample Output (India)**:
```
Term: "niacinamide serum"
Latest value: 44 (scale 0-100)
Mean value: 68.6
Rising queries:
  - niacinamide serum india (400 - breakout)
  - niacinamide serum price (200)
  - best niacinamide serum in india (190)
Regional breakdown:
  - Kerala: 51, Tamil Nadu: 48, Delhi: 44, Karnataka: 43
```

**Rate Limiting Observations**:

| Delay | Success Rate | Recommendation |
|-------|--------------|----------------|
| 3 seconds | 20% | Not viable |
| 10 seconds | ~50% | Intermittent |
| 30 seconds | 100% | **Production minimum** |

**Production Architecture**:
```
[Nightly Cron Job @ 2am]
    └─> [Pytrends Worker] ──30s delay──> [Google Trends]
           └─> [Snowflake Cache] ──> [Category Brain Agents]

Capacity: ~2,880 terms/day @ 30s/request
Recommendation: 500 category/keyword terms (not SKU-level)
```

**Limitations Discovered**:
1. Corporate network requires SSL verification disabled
2. Batch-only viable (no real-time)
3. No production SLA (unofficial API)
4. Some regional data appears counterintuitive

### 2. LangChain Patterns - Research Complete

**Recommended Patterns for Insight Generation**:

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Structured Output** | InsightCard JSON generation | `with_structured_output()` + Pydantic |
| **Router Pattern** | Multi-source data synthesis | LangGraph conditional edges |
| **Map-Reduce** | Batch anomaly processing | LangGraph `Send` API |
| **Summarization Middleware** | Long context management | `SummarizationMiddleware` |

**InsightCard Schema**:
```python
class InsightCard(BaseModel):
    category: str
    consumer_insight: str
    strategy: str
    sizing: dict
    signals: list[Signal]
    actionability: Literal["actionable", "need_more_info", "not_relevant"]
```

**Synthesis Architecture**:
```
[Data Sources] ──> [Signal Fusion Layer] ──> [LLM Synthesis] ──> [InsightCard]
     │                    │                        │
     ├─ Google Trends     ├─ Normalize 0-100      ├─ Consumer Insight
     ├─ Internal Search   ├─ Cross-validate       ├─ Strategy
     └─ (Future: Social)  └─ Emerging score       └─ Sizing
```

### 3. Competitor Data Sources (Deferred)

| Source | Status | Notes |
|--------|--------|-------|
| Blinkit/Zepto scraping | Not evaluated | Legal/ToS considerations |
| Twitter API | Not evaluated | Cost at scale |
| Reddit API | Not evaluated | May be useful for niche trends |

---

## Data Quality Assessment

### Search Data Quality (Snowflake)

| Dimension | Rating | Evidence |
|-----------|--------|----------|
| **Freshness** | Excellent | T-1 availability |
| **Completeness** | Good | Full funnel tracking |
| **Volume** | High | ~10M searches/day |
| **Null Search Rate** | **Very Low** | 0.16-0.56% by city |

### City-Level Benchmark (Jan 27, 2026)

| City | Searches | Null Search % | Conversion % |
|------|----------|---------------|--------------|
| Bangalore | 1.3M | 0.16% | 54.6% |
| Hyderabad | 876K | 0.41% | 45.0% |
| Mumbai | 827K | 0.24% | 49.7% |
| Delhi | 666K | 0.34% | 37.5% |
| Chennai | 615K | 0.35% | 46.5% |

**Insight**: The very low null search rate (<0.5%) suggests:
- Search coverage is already good
- Opportunity is in **conversion optimization**, not coverage gaps
- Focus should be on "searched but didn't buy" rather than "couldn't find"

---

## Recommendations

### Build vs Buy vs Integrate

| Component | Recommendation | Rationale |
|-----------|----------------|-----------|
| Google Trends ingestion | **Build** | Simple pytrends wrapper with caching |
| Search analytics | **Integrate** | Snowflake/Databricks tables exist |
| Insight generation | **Build** | Custom LLM synthesis with structured output |
| Category taxonomy | **Integrate** | Use existing SKU master tables |
| Competitor data | **Defer** | Not critical for POC, legal complexity |
| Delivery mechanism | **Integrate** | Extend Strategy+1 Tracker or Category Mitr |

### Recommended Stack for POC

```
┌────────────────────────────────────────────────────────────┐
│                    Data Ingestion                           │
├────────────────┬───────────────────┬───────────────────────┤
│ Google Trends  │ Snowflake Search  │ Databricks Features   │
│ (pytrends,     │ (IM_SEARCH_FACT,  │ (im_catalog,          │
│ nightly batch) │ daily aggregates) │ trending_searches)    │
└───────┬────────┴─────────┬─────────┴───────────┬───────────┘
        │                  │                     │
        └──────────────────┼─────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────────┐
│              Signal Fusion Layer (Python)                   │
│  - Normalize scores (0-100)                                 │
│  - Cross-validate external vs internal signals              │
│  - Compute emerging_score                                   │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│           LLM Insight Generation (LangChain)                │
│  - Structured output (InsightCard)                          │
│  - Router pattern for multi-source synthesis                │
│  - Grounded in data (no hallucination)                      │
└────────────────────────────┬───────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│              Delivery (Weekly Digest)                       │
│  - Slack notification with top 5 insights                   │
│  - Link to full dashboard (Retool or Strategy+1)            │
│  - Feedback buttons (Actionable/Not/Need Info)              │
└────────────────────────────────────────────────────────────┘
```

### Gaps Identified

| Gap | Impact | Mitigation |
|-----|--------|------------|
| No direct link between search and availability at search time | Can't distinguish "searched, not shown" vs "shown, not converted" | Join with availability tables post-hoc |
| pytrends rate limiting | Limits real-time trend detection | Accept batch-only, 500 term limit |
| No Social/Twitter data | Missing early weak signals | Defer to v2 |
| Category taxonomy inconsistencies | ~4,700 categories with duplicates | Filter to top categories for POC |

---

## Next Steps

1. **Run /generate-prd** to create formal PRD with:
   - User stories for CM workflows
   - Technical specs for data pipeline
   - Success metrics and validation plan

2. **Prototype Components**:
   - [ ] pytrends batch job with 50 Personal Care terms
   - [ ] Snowflake SQL for rising search terms
   - [ ] LangChain InsightCard generation

3. **Stakeholder Alignment**:
   - [ ] Validate output format with Category Manager
   - [ ] Confirm delivery mechanism (Slack vs Dashboard)
   - [ ] Identify pilot category and engaged CM

---

*Landscape research completed: 2026-01-28*
