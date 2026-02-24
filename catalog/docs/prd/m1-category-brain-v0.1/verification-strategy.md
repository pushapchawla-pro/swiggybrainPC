# Verification Strategy: Catalog & Assortment Intelligence

## Success Definition

**Primary**: Category Managers find the generated insights actionable - they would act on the recommendations provided by the system.

**Quantified**: >60% of insights in weekly digest marked as "Actionable" by CMs.

---

## Test Pyramid

### Unit Tests
| Component | Test Cases |
|-----------|------------|
| Google Trends ingestion | Parses pytrends response correctly, handles rate limits, normalizes scores |
| Search analytics SQL | Aggregations correct, WoW/MoM calculations accurate, zero-result detection works |
| Emerging score calculation | Score formula produces expected values for known inputs |
| Insight card generation | Output matches expected format, all fields populated |

### Integration Tests
| Integration | Test Cases |
|-------------|------------|
| pytrends → Snowflake | Trend data lands in expected table with correct schema |
| Snowflake → Signal Fusion | Internal search metrics correctly joined with external signals |
| Signal Fusion → LLM | Prompt constructed correctly, response parsed into insight card |
| Digest → Slack/Email | Weekly digest delivered with correct formatting |

### E2E Tests
| Journey | Test Cases |
|---------|------------|
| Weekly Trend Review | Digest generated, contains insights for pilot category, CM can mark actionable |
| Investigate Signal | Search term lookup returns multi-source data within 5 seconds |
| Catalog Gap Alert | High-volume ZRS triggers alert to correct CM |

---

## Test Data Strategy

### Static Mocks for Development
```python
MOCK_GOOGLE_TRENDS = {
    "see through air fryer": {
        "interest_over_time": [45, 52, 58, 65, 72, 80, 92],  # 7 weeks
        "wow_growth": 0.45,
        "related_queries": ["glass air fryer", "transparent air fryer"]
    }
}

MOCK_INTERNAL_SEARCH = {
    "see through air fryer": {
        "weekly_searches": 1250,
        "wow_growth": 0.60,
        "zero_result_rate": 0.82,
        "conversion_rate": 0.0  # No products to convert to
    }
}
```

### Validation Data from Manual Process
Use the existing spreadsheet examples as ground truth:
- Air Fryer insight should match "see-through at price of basic"
- Eggs insight should match "specialty growing 2x"
- Fragrance insight should match "bridge-to-premium 1k-2k"

---

## Validation Checkpoints

### Checkpoint 1: Data Pipeline Works
- [ ] Google Trends data ingested for pilot category terms
- [ ] Internal search metrics aggregated daily
- [ ] Data lands in Snowflake with correct schema

### Checkpoint 2: Signal Detection Works
- [ ] Emerging terms identified match known trends
- [ ] Zero-result searches captured with volume
- [ ] WoW/MoM growth calculated correctly

### Checkpoint 3: Insight Generation Works
- [ ] Insight cards generated in expected format
- [ ] Consumer insight text is coherent and specific
- [ ] Strategy recommendations are actionable

### Checkpoint 4: CM Validation
- [ ] CM reviews 10 generated insights
- [ ] >6 marked as "Actionable" or "Useful"
- [ ] Feedback collected on what's missing

---

## Quality Gates

| Gate | Check | Must Pass |
|------|-------|-----------|
| Data freshness | Google Trends data <7 days old | Yes |
| Data completeness | >90% of pilot category terms have both internal + external signals | Yes |
| Signal correlation | Internal search trend direction matches Google Trends in >70% cases | Yes |
| Insight quality | LLM-generated insight passes coherence check | Yes |
| CM acceptance | >60% actionable rate in pilot | Yes |

---

## Feedback Collection

### Per-Insight Feedback
```
[ACTIONABLE] - I would act on this
[USEFUL BUT NOT NOW] - Good insight, not priority
[NEED MORE INFO] - Missing data to make decision
[NOT RELEVANT] - Doesn't apply to my category
[INCORRECT] - Data or recommendation is wrong
```

### Weekly Digest Feedback
- NPS-style: "How useful was this week's digest?" (1-10)
- Open text: "What's missing?"
- Feature request: "What would make this more useful?"

---

## POC Success Criteria

| Criteria | Target | How to Measure |
|----------|--------|----------------|
| Insights generated | 10+ per week for pilot category | Count in digest |
| CM actionable rate | >60% | Feedback buttons |
| Data accuracy | >80% signals match CM's understanding | CM validation |
| Delivery reliability | 100% weekly digests sent on time | Monitoring |
| Time to insight | <2 min for on-demand lookup | Timer in UI |

---

## Risk Mitigations

| Risk | Mitigation | Test |
|------|------------|------|
| pytrends rate limited | Implement 60s delay, cache 24h | Load test with 100 terms |
| LLM hallucination | Ground insights in data, show sources | Human review of 20 insights |
| CM doesn't engage | Start with engaged CM, iterate on format | Weekly feedback sessions |
| Data quality issues | Validate against manual analysis | Compare to spreadsheet ground truth |

---

## Definition of Done (POC)

- [ ] Weekly digest delivered for pilot category
- [ ] Contains 10+ insight cards with Consumer Insight + Strategy
- [ ] Sources shown for each signal (Google Trends, Internal Search)
- [ ] CM can mark each insight as Actionable/Not Actionable
- [ ] >60% marked Actionable in pilot validation
- [ ] Documentation: How to extend to new categories

---

*Verification strategy created: 2026-01-28*
