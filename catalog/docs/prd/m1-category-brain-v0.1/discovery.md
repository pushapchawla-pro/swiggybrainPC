# Discovery: Catalog & Assortment Intelligence for Instamart

**Started**: 2026-01-28
**Type**: New Feature | **Domain**: AI/ML + Data
**Codename**: Category Brain v0.1

---

## Problem Statement

Category Managers at Instamart manually spend significant hours researching trends across Google Trends, social media, competitor apps, and internal data to identify:
1. **Catalog gaps**: Products/categories customers want but Instamart doesn't carry
2. **Double-down opportunities**: Existing products showing demand acceleration that need scaled supply

This manual process is:
- **Time-consuming**: Hours per category per week
- **Inconsistent**: Different CMs use different methodologies
- **Reactive**: Trends identified after competitors have moved
- **Noisy**: Too many weak signals, unclear prioritization

**Goal**: Build an automated system that generates actionable insights and recommendations for category managers, helping them identify the "next big thing" before it peaks.

---

## Two Value Plays

```
NEW TO CATALOG (Gaps)              DOUBLE DOWN (Scale)
─────────────────────────────────────────────────────
Products we don't carry            Products we already carry
but should                         but need to scale

Action: Source & List              Action: Deepen supply, expand
                                   SKUs, improve availability

Signal: Zero-result searches,      Signal: Rising searches, rising
external trends, competitor        sales velocity, positive
launches                           competitor ratings
```

---

## Signal Spectrum

```
WEAK SIGNALS (Early, noisy)          STRONG SIGNALS (Late, clear)
─────────────────────────────────────────────────────────────────►

Social chatter    Search intent    Competitor    Internal      Sales
about a topic     (Google Trends)  launches      search gaps   spike
                                   + ratings     (no results)
```

---

## Personas

### Primary: Category Manager (CM)
- **Role**: Owns category P&L, assortment decisions, brand negotiations
- **Current workflow**: Manual research across multiple sources weekly
- **Pain points**: Time-consuming, inconsistent, reactive
- **Success criteria**: "I would act on this insight"

### Secondary (Future):
- **Merchandising Team**: Execute on CM strategy, manage listings
- **Supply Chain**: Plan inventory based on demand signals
- **Leadership**: Strategic investment decisions

---

## User Journeys

### Journey 1: Weekly Trend Review
**Persona**: Category Manager
**Trigger**: Start of week / scheduled review
**Flow**:
1. CM receives weekly digest (Slack/email) with top signals for their category
2. Reviews insight cards: Consumer Insight → Strategy → Sizing
3. Drills down on specific signals to see data sources
4. Marks insights as "Actionable" / "Not Actionable" / "Need More Info"
5. Converts actionable insights to tasks (source brand, expand SKUs, etc.)

**Success**: CM acts on 2+ insights per week

### Journey 2: Investigate Specific Signal
**Persona**: Category Manager
**Trigger**: CM notices a signal or wants to research a term
**Flow**:
1. CM enters a search term/category in the system
2. System shows multi-source data: Google Trends, internal search, competitor presence
3. CM sees trend direction, velocity, regional breakdown
4. CM decides whether to act

**Success**: CM gets comprehensive view in <2 minutes

### Journey 3: Catalog Gap Alert
**Persona**: Category Manager
**Trigger**: Automated alert for high-potential gap
**Flow**:
1. System detects high-volume zero-result search term with external validation
2. Alert sent to relevant CM with: term, search volume, trend direction, competitor status
3. CM reviews and either dismisses or initiates sourcing workflow

**Success**: Gap-to-listing time reduced

---

## POC Scope: Personal Care Business Unit

**Selected**: 1 Business Unit (Personal Care), All 8 L1 Categories

| L1 Category | Trend Sensitivity | Key Signal Types |
|-------------|-------------------|------------------|
| **Fragrances** | Very High | DEO→EDP shift, bridge-to-premium (600-1500), gifting |
| **Skincare** | Very High | Ingredient trends (Niacinamide, Retinol, Ceramide), K-beauty |
| **Hair Care** | High | Skinification, active ingredients (Salicylic, Peptides) |
| **Bath & Body** | Medium-High | Therapeutic/functional, premium formats |
| **Grooming** | Medium | Male grooming expansion, trimmers |
| **Oral Care** | Medium | Electric toothbrushes, whitening |
| **Makeup** | High | Social-driven trends, clean beauty |
| **Feminine Hygiene** | Medium | Organic, sustainable options |

**Why Personal Care for POC**:
- Highly trend-sensitive (Google Trends signals strong)
- Ingredient-driven (searchable terms like "niacinamide serum")
- Good examples in manual process spreadsheet (Fragrances, Skincare 30+)
- Clear L2/L3 structure for drilling down

---

## Data Channels (POC Scope)

| Channel | Signal Type | Access Method | Priority |
|---------|-------------|---------------|----------|
| **Google Trends** | External demand signals | pytrends library | P0 |
| **Internal Search** | Intent + gaps (zero-results) | Snowflake SQL | P0 |
| **Internal Purchases** | Demand velocity | Snowflake SQL | P1 |
| **Competitor Ratings** | What's working for others | Scraping / API | P2 |
| **Social (Twitter)** | Early weak signals | Twitter API | P2 |

---

## Key Insights from Research

### 1. No Off-the-Shelf Solution Fits
- Global platforms (EDITED, Trendalytics, Stackline) focus on fashion/Western markets
- India quick-commerce (Blinkit, Zepto, BigBasket) not covered by any major platform
- **Recommendation**: Custom build required

### 2. Google Trends Access
- **Official API**: Alpha launched July 2025 - apply for access
- **pytrends**: Unofficial but works with rate limiting (60s delays)
- **Alternative**: SerpApi/Glimpse for production reliability
- India-specific data available at country and state level

### 3. Internal Search Analytics
Key metrics to track:
- **Zero-Result Rate**: % searches with no products (target <10%)
- **Rising Terms**: WoW/MoM growth rate with volume threshold
- **Search-to-Purchase**: Conversion signal for high-intent terms
- **Refinement Chains**: What users search next

Recommended schema:
```
search_events → search_term_daily_metrics → search_term_trends
```

### 4. Signal Fusion Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                   Data Sources                               │
├──────────────┬──────────────┬──────────────────────────────┤
│ Google Trends│ Internal     │ (Future: Competitor,         │
│ (pytrends)   │ Search/Sales │  Social)                     │
└──────┬───────┴──────┬───────┴──────────────────────────────┘
       │              │
       ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│              Signal Fusion Layer                             │
│  - Normalize scores (0-100)                                  │
│  - Cross-validate signals                                    │
│  - Compute emerging_score                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Insight Generation (LLM)                             │
│  - Consumer Insight synthesis                                │
│  - Strategy recommendation                                   │
│  - Sizing estimation                                         │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Weekly Digest (Insight Cards)                        │
│  Category → Consumer Insight → Strategy → Action             │
└─────────────────────────────────────────────────────────────┘
```

---

## Output Format: Insight Card

Based on manual process examples:

```
┌────────────────────────────────────────────────────────────┐
│ CATEGORY: Kitchen Appliances > Air Fryers                  │
├────────────────────────────────────────────────────────────┤
│ CONSUMER INSIGHT                                           │
│ See-through air fryers help with prevention of over-       │
│ cooking and better temp consistency. Rising search         │
│ interest (+45% MoM on Google Trends, +60% internal).       │
├────────────────────────────────────────────────────────────┤
│ STRATEGY                                                   │
│ Introduce see-through air fryers at price of basic air     │
│ fryer. Target brands: Cookwell, Solara.                    │
├────────────────────────────────────────────────────────────┤
│ SIZING                                                     │
│ Current: 16.23 Cr (IM) | Strategy SKUs: 4 | Target: 25%   │
├────────────────────────────────────────────────────────────┤
│ SIGNALS                                                    │
│ 🔵 Google Trends: +45% MoM                                 │
│ 🟢 Internal Search: +60% MoM, 0.8% zero-result             │
│ 🟡 Competitor: Available on Blinkit, 4.2★ rating           │
├────────────────────────────────────────────────────────────┤
│ [ACTIONABLE] [NEED MORE INFO] [NOT RELEVANT]               │
└────────────────────────────────────────────────────────────┘
```

---

## Open Questions

1. **Snowflake access**: What tables contain search logs and purchase data?
2. **Category taxonomy**: How are L1/L2/L3 categories structured in the data?
3. **Competitor data**: Is there existing competitor price/assortment scraping?
4. **CM feedback loop**: How will CMs mark insights as actionable? (Slack, internal tool?)
5. **Pilot category selection**: Which category has best data quality + engaged CM?

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **CM finds actionable** | >60% of insights marked actionable | CM feedback in digest |
| **Time saved** | >4 hours/week/CM | Survey + activity tracking |
| **Signal precision** | >70% of flagged trends materialize | 90-day lookback |
| **Gap-to-listing time** | <4 weeks for high-priority gaps | Sourcing workflow tracking |

---

## Next Steps

1. **Run /solutioning** to explore build options and architecture decisions
2. **Identify Snowflake tables** for search and purchase data
3. **Select pilot category** based on data quality and CM engagement
4. **Prototype Google Trends ingestion** with pytrends

---

*Discovery completed: 2026-01-28*
