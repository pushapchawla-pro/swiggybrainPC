# Prediction-Driven Context Graphs for Swiggy Brain

## WHAT

As we know there are 4 categories of analytics.

| Type | Question | Feedback | Learning Potential |
|------|----------|----------|-------------------|
| **Descriptive** | What happened? | Subjective | None |
| **Diagnostic** | Why did it happen? | Ambiguous | Low |
| **Predictive** | What will happen? | Binary right/wrong | High |
| **Prescriptive** | What should we do? | Measurable outcome | High |

In Hermes, Cimba, and Hasura, we've mostly operated in the descriptive and diagnostic paradigm.

**Problems with this approach:**
- **"Why" is not always relevant** - diagnostic explanations are often surface level, don't lead to actionable insight.
- **Context must be added manually** - humans curate what the system should know in terms of metadata, wikis, context etc.
- **Humans must measure and provide feedback** - no objective ground truth, humans will upvote/downvote to provide feedback.
- **No self-improvement mechanism** - the system doesn't learn from outcomes, rather only from limited human feedback.

If we follow the exact same mechanism, we will hit similar problems again. It seems that it is infeasible to extend and scale an autonomous agentic system which just works on principles of descriptive and diagnostic analytics.

**The Proposal:** Try predictive and prescriptive analytics for Swiggy Brain, starting with availability for SCM - an ideal testbed with binary outcomes (in-stock or not), bounded complexity, existing root-cause infrastructure, and fast feedback loops. Instead of asking **"why did this SKU go OOS?"** (diagnostic), ask **"will this SKU go OOS tomorrow?"** (predictive) and eventually **"what action prevents it?"** (prescriptive). Start with predictive, graduate to prescriptive once the prediction loop proves out.

**The key insight:** Agents that predict outcomes must discover what context matters - and when they document this, the context graph emerges as a side effect. This is different from hand-crafted knowledge graphs. The graph writes itself through the pressure of prediction.

"Context graphs" have emerged as a central theme in AI architecture over the last few weeks. Foundation Capital called it "AI's trillion-dollar opportunity" - arguing that the next major platforms will capture decision traces, not just data.

## WHY

The prediction has a **verifiable answer**. The prescription has a **measurable outcome**. This creates the feedback loop that enables genuine "learning".

**The Core Intuition:**
1. LLMs became PhD-level experts about the world just by predicting the next token. They weren't explicitly taught physics, law, or medicine - the prediction objective created pressure to build internal world models that enable reasoning. This is what actually drives the scaling laws for transformers as it leads to self-supervised training through variable rewards (both pre-training and post-training RL).
2. Humans are also predictive machines - we predict what will happen next, and then learn when there's a "surprise" (prediction error). In fact, this is exactly how human memory works.

**Benefits:**

| Benefit | Mechanism |
|---------|-----------|
| **Context graph created by agents** | To predict accurately, agents must discover what signals matter - then document and compress this into retrievable precedent. |
| **Self-improvement via verifiable reward** | Predictions resolve to ground truth. The agent knows unambiguously whether it was right. |
| **Clear actionable for humans** | Predictions help determine issues before it occurs. Prescriptions ("raise PO now", "adjust forecast") are concrete. Stakeholders know what to do. |

**The Paradigm Shift:**
```
OLD: Human curates context → Agent reasons → Human validates → (Limited learning)
NEW: Agent predicts → Reality validates → Agent documents & compresses → (Continuous learning)
```

**Why rules aren't enough:** The 7 RCA branches are starting priors, not complete truth. Prediction pressure discovers what rules can't: sub-branches (MOQ vs MOV), cross-branch interactions (forecast + warehouse), temporal dynamics (IPL, festivals), and patterns hidden in "Other".

## HOW

**Start with availability prediction:** Will this SKU be in stock at this POD tomorrow? Will this PO be fulfilled on time? Will this city x brand have chronic availability issues?

**Objective function:** f(Prediction Accuracy, Context Efficiency)
- Maximize prediction accuracy reinforces getting the right answer most of the time
- Minimize token cost reinforces knowledge compression across runs

**Context graph as side effect:** The agent documents its predictions, reasoning, and outcomes - compressing learnings into structured, retrievable precedent. This is nothing but decision documentation optimized for AI retrieval. The objective function drives compression: only context that improves predictions survives.

**Self-improvement loop:**
1. **Predict:** Agent forecasts "SKU X will go OOS at POD Y tomorrow due to PO delay"
2. **Reality validates:** Next day, SKU X is indeed OOS (or not) - binary ground truth
3. **Document learnings:** Agent records what signals it used, what reasoning it applied, whether prediction was correct
4. **Compress into precedent:** Successful prediction patterns get summarized into retrievable documentation ("PO delays from Supplier Z typically cause OOS within 48hrs for dairy SKUs")
5. **Retrieve for next prediction:** When similar situation arises, agent retrieves relevant precedent to inform new prediction

The loop is automatic - no human labeling required. Failed predictions create a learning signal; successful predictions create reusable precedent.

**Implementation Phases:**

We will start with predictions first, and based on the success eventually move to prescriptions.

| Phase | Horizon | What We Predict | Why This Order |
|-------|---------|-----------------|----------------|
| 1 | Hours | Will this SKU go OOS today? | Fastest feedback - validate approach works |
| 2 | Days | Will this PO arrive on time? | More signal types, still tight loop |
| 3 | Weeks | Which SKUs will have chronic availability issues? | Harder predictions, but now we have precedent from Phase 1-2 |

We will start simple to prove the loop works, then extend the horizon as the context graph accumulates useful precedents. If the initial hypothesis works out, we could also think of a prediction market and let multiple agents compete with each other, leading to discovery of different isolated context graphs that could be eventually shared across those agents - typical to how organizational knowledge also works.

---

## Bibliography

- [What is a context graph and how is it relevant for building AI agents which can act on our behalf](https://x.com/JayaGup10/status/2003525933534179480) - Jaya Gupta
- [How do you exactly build this context graph from first principles](https://x.com/akoratana/status/2005303231660867619) - Anant Koratana
- [Compressing Context](https://factory.ai/news/compressing-context) - Factory.ai (2025)
- [Effective Context Engineering for AI Agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) - Anthropic (2025)
- [Prediction Markets are Learning Algorithms](https://blog.gensyn.ai/prediction-markets-are-learning-algorithms/) - Gensyn (2024)

---
*January 2026 | Supply Chain Brain Architecture Proposal*
