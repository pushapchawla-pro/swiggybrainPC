# Execution Bandwidth: Availability Monitoring POC

**POC Duration**: 3 days (Jan 13-15, 2026)
**Total Estimated Effort**: ~4-5 person-days
**LLM API Calls**: ~50-100 (RCA generation + testing)

---

## Team & Bandwidth

| Code | Persona | Effort (days) | Critical Timing |
|------|---------|---------------|-----------------|
| **EE** | Executing Engineer | 3.0 | All days |
| **AE** | Analytics Expert | 0.5 | Day 1 (validation) |
| **PM** | Product Manager | 0.5 | Day 1 + Day 3 |
| **MS** | Metadata Support | 0.25 | Day 1 (schema) |
| **AA** | AI Architect | 0.25 | Day 2 (review) |
| **CC** | Claude Code | — | Continuous |

**Total Human Effort**: ~4.5 person-days

---

## Executing Engineer Profile

**Required Skills**:
- Claude Code proficiency (MCP tools, Bash, prompt engineering)
- Python/SQL (Databricks notebooks)
- Data pipeline experience
- LLM integration experience

**Availability**: Full-time for 3 days

---

## Effort by Day

| Day | Focus | EE Effort | Support Effort |
|-----|-------|-----------|----------------|
| **Day 1** | Data Pipeline | 1.0 day | AE: 0.5, MS: 0.25, PM: 0.25 |
| **Day 2** | Rule Engine + LLM | 1.0 day | AA: 0.25 |
| **Day 3** | QA + Demo | 1.0 day | PM: 0.25 |

---

## Critical Dependencies

| Dependency | Risk Level | Mitigation |
|------------|------------|------------|
| **Snowflake access** | HIGH | Request before Day 1 |
| **Databricks workspace** | HIGH | Confirm setup before Day 1 |
| **LLM API key** | MEDIUM | Provision Claude API key |
| **Source table availability** | HIGH | Validate schema Day 1 AM |

---

## Pre-POC Checklist

### Access & Permissions
- [ ] Snowflake credentials obtained
- [ ] Databricks workspace access granted
- [ ] GitHub repo cloned
- [ ] Claude API key provisioned

### Technical Setup
- [ ] `snowsql` CLI configured
- [ ] Databricks CLI configured
- [ ] Python environment ready

### Data Validation
- [ ] Bradman SKU list table accessible
- [ ] Availability RCA table accessible
- [ ] Sample queries run successfully

---

## Success Metrics

| Priority | Metric | Target |
|----------|--------|--------|
| **PRIMARY** | End-to-end pipeline working | Yes |
| **PRIMARY** | Alert deduplication correct | 100% |
| **SECONDARY** | RCA quality (no hallucinations) | Yes |
| **SECONDARY** | Demo delivered | Yes |
| **TERTIARY** | Sample reports generated | 5+ |

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Source table schema mismatch | Pipeline fails | Day 1 validation + fallbacks |
| Data quality issues (nulls, stale) | Incorrect alerts | Quality audit Day 1 |
| LLM hallucinations | Incorrect RCA | Prompt grounding + QA |
| Pipeline timeout | Demo fails | Batch processing + caching |

---

## Post-POC Next Steps

1. **Validate RCA accuracy** — Target ≥80% precision with business review
2. **Expand scope** — Other cities, categories
3. **Integrate Slack notifications** — Automated daily alerts
4. **Build closed-loop learning** — Track action outcomes, refine recommendations
5. **Connect to intervention agent** — Link to Supply Chain Brain v0.1 MVP

---

## Artifacts Checklist

| Day | Artifact | Owner | Status |
|-----|----------|-------|--------|
| Day 1 | `docs/data-mapping.md` | EE + AE | [ ] |
| Day 1 | `docs/gap-analysis.md` | EE | [ ] |
| Day 1 | `notebooks/01_data_pipeline.py` | EE | [ ] |
| Day 2 | `config/rules.yaml` | EE | [ ] |
| Day 2 | `notebooks/02_rule_engine.py` | EE | [ ] |
| Day 2 | `prompts/rca_prompt.txt` | EE | [ ] |
| Day 2 | `notebooks/03_llm_integration.py` | EE | [ ] |
| Day 3 | `docs/qa-checklist.md` | EE | [ ] |
| Day 3 | `outputs/sample_reports/` | EE | [ ] |
| Day 3 | `docs/presentation.pdf` | PM | [ ] |
