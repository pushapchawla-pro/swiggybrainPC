# **Swiggy Brain – Internal PRFAQ**

**Primary Sponsor:** Harsha  
**Initial Scope:** Instamart (2026 launch), Swiggy-wide platform thereafter

---

## **Press Release**

**Bengaluru, India** \- Swiggy today announced **Swiggy Brain**, a next‑generation, AI‑first operations intelligence system designed to run Instamart with Toyota‑grade kaizen discipline, Amazon‑style hands‑off‑the‑wheel ambition, and Meituan‑level hyperlocal precision.

Over the last decade we have invested heavily in building Instamart’s supply chain, dark-store network, and growth engine. But the operating model is still fundamentally *human-policed*:

Analysts chase anomalies *after* the damage is done; Category managers swim in dashboards and spreadsheets; City & supply leaders jump from escalation to escalation; Hundreds of local pockets of demand/attrition/quality issues never even surface, because averages hide nuance

In a world where [Amazon’s SCOT](https://remars.amazonevents.com/discover/automation/article/five-lessons-from-SCOT/?trk=direct) and “[Hands Off The Wheel](https://www.reworked.co/digital-workplace/how-amazon-uses-ai-to-automate-work-in-its-corporate-headquarters/)” systems already automate core supply decisions, Toyota embeds AI into kaizen loops on the factory floor, Walmart runs AI‑driven supply‑chain control towers, and Meituan orchestrates the world’s largest minute‑level delivery network using a real‑time AI “super brain”, continuing to run Instamart by dashboards is a strategic liability or opportunity.

**Swiggy Brain changes the operating system of Instamart.**

Swiggy Brain is a **proactive, agentic operations brain** that continuously scans Instamart’s hyperlocal metrics, identifies economically meaningful anomalies, diagnoses root causes using structured and unstructured data, and surfaces **precise, ranked interventions** to the right owners. Over time, it learns from outcomes and safely automates routine optimizations under strict guardrails.

At launch, Swiggy Brain will not silently change payouts or network configurations. It will operate as a copilot:

* Category Brain for category and brand managers  
* Supply Chain Brain for dark store, network, and supply chain leaders  
* Growth Brain for growth, CRM, and city marketing teams

Each persona will receive:

* A daily, ruthlessly prioritized digest (Slack \+ app) of the 3 most important interventions that matter *today*  
* A deep‑dive investigation workspace that explains *why* something is happening, with traceable evidence  
* A closed‑loop action tracker that learns from what was done and what worked

Under the hood, Swiggy Brain combines classical statistics, causal reasoning, and modern LLMs into a **multi‑agent architecture**:

* A **Statistical Monitoring Agent** detects anomalies across thousands of metrics  
* A **Hypothesis & RCA Agent** generates and tests issue trees using past RCAs, SOPs, playbooks etc  
* A **Knowledge Agent** retrieves information from relevant data sources (snowflake, google documents etc) and estimates impacts from different causalities  
* An **Intervention Agent** summarizes the top reasons for breakage and potential solves to look into and triggers intimation to a relevant individual / team  
* An **Evaluation & Learning Agent** continuously improves thresholds, playbooks, and recommendations

Brain will also be available as an on-demand platform which an employee can invoke to better understand a metric that is not actively monitored. For e.g. RoAS of an individual brand being poor

By 2027, our ambition is that:

* Every pod‑level speed, availability, or quality issue is detected and triaged *before* it materially impacts conversion or NPS  
* Every category, city, and dark store runs on a Brain‑first cockpit, not scattered dashboards & sheets  
* Even an average employee is transformed to a high performing one

If we get this right, Swiggy Brain will become a compounding moat. Every RCA, every action, every outcome makes the system smarter. Unlike headcount, it scales without fatigue and retains institutional memory.

In a business environment where product led differentiation is increasingly hard to sustain for too long, we will create a competitive advantage with the amount of sophistication used in optimizing the business. Everyone knows / have read the Toyota way but there is still only one Toyota in the world\!

---

## **FAQs**

### **1\. What exactly is Swiggy Brain and what problem does it solve?**

Swiggy Brain is a proactive, LLM‑orchestrated operations intelligence system that detects hyperlocal anomalies, explains why they happened, and drives targeted interventions \- learning from outcomes over time.

**The core problems today:**

* **Hyperlocal blind spots:** Averages hide real pain. A city‑level 10‑minute promise can mask multiple pockets suffering 18–22 minute ETAs that silently kill conversion.  
* **Slow, manual RCA:** Today’s workflow: Issue occurs → employee pulls data → to & fro slack / email threads → meetings → action; takes days with no easy source of truth. Given employee churn, org context is also not necessarily preserved well  
* **Reactive, not proactive:** Large parts of the org kick into action *after* something breaks  
* **Fragmented understanding:** Our business is complex with several interaction effects (incorrect location of dark store leads to poor retention of delivery partners leads to high delivery times leads to poor customer retention) \- while rockstar employees can discern some of these, usually context is quite fragmented

**Swiggy Brain solves this by:**

1. Statistical anomaly detection first  
   A lightweight monitoring agent runs classical statistical tests to identify *economically material* anomalies. Only these trigger deeper analysis.  
2. **Agentic RCA grounded in data**  
   Separate agents generate hypotheses from first‑principles issue trees and past RCAs, pull data from Snowflake/Databricks and approved unstructured sources, and quantify contribution ranges.  
3. **Ranked, owner‑specific interventions**  
   Brain surfaces only the highest‑impact actions for each persona, with confidence scores   
4. **Closed‑loop learning**  
   Brain tracks what was actioned, what worked, and what didn’t \- continuously improving thresholds, playbooks, and recommendations.

### **2\. What are some sample stories that Brain could potentially solve?**

1. **Category Brain**  
   1. A system that monitors search terms on the consumer app at a hyperlocal level, identifies key selection, pricing or availability gap by triangulating across our available selection, competitive benchmarking, worldly knowledge (of popular brands / products or occasions like festivals coming up) and makes a specific recommendation on selection to onboard, price to fix etc  
   2. When meeting a brand \- helps look through different aspects of a brands performance in relation to competitors (product strategy, existing distribution, pricing, discounts, key words being bid for on ads etc) as well as category level nuances (shift towards purchase of clean ingredients, rise in popularity of korean versions of products etc) and gives targeted recommendations on actions to be taken  
2. **Supply Chain Brain**  
   1. Constantly monitors availability of skus in darkstores and for key skus that matter to customers (evidenced by search terms, importance of these skus to drop off from carts), analyzes where in the supply chain is the issue (poor demand forecasting, fill rates / supply issues from brands, unavailability of manpower in warehouse to inward or outward the products, limitations in dark store to accept these products etc) and gives targeted intervention suggestions to improve it thereby optimizing the supply chain  
   2. Identifies improper rostering in dark stores leading to excess manpower in certain hours and insufficient in others leading to poor customer experience in the latter and inflated costs overall  
   3. Analyzes cause of attrition of delivery staff at a dark store level as being driven by improper payout structures not account for traffic in the area (while the last mile distances are low, delivery partners are taking too long to deliver the orders reducing their earnings leading to attrition); Flags incorrect configuration of surge payouts (despite it raining heavily with high delivery partner logouts, payouts were only being made half of what they should have been)  
3. **Growth Brain**  
   1. Proactively analyzes pockets of poor customer retention and high customer retention and gives clear rationale plaguing poor areas \- for e.g. reduced incidence of customers ordering high frequency products like fruits & vegetables, dairy, bread, eggs, chocolates and ice-creams leading to drop in frequency of purchase. The reduced incidence itself is driven by low visibility on the customer storefront where new customers are acquired are on categories like home & kitchen and electronics  
   2. Identify pockets of high demand (illustrated by active sessions being received from customers in these pockets) with poor conversion rates and give recommendation by reason \- poor darkstore location leading to elevated delivery promise times (new dark store to be launched), improper network configurations leading to lesser selection available (improve last mile radius of mega pods which have higher selection from 6 to 6.5kms to cover this region) or improper service being delivered (high customer escalations related to unhygienic deliveries, fresh products being delivered stale etc)

### **3\. Why now?**

**Because the next phase of quick commerce is operational alpha, not product parity.**

* Product features are copied at rapid pace, the major alpha is actually in delivering consistent service at scale at the lowest cost.  
* Instamart’s structure of thousands of mini‑businesses (store × selection × service × price) create complexity no human org can fully monitor.  
* Data infra maturity (Snowflake/Databricks), agent frameworks, rapid evolution of LLMs and evaluation tooling may finally make this viable at scale.

### **4\. What are the biggest risks and how are we countering them?**

**Risk 1: “LLMs watching hundreds of metrics” is computationally and cognitively infeasible.**  
**Mitigation:** Separate concerns. A statistical monitoring agent flags anomalies; only then does an LLM‑powered RCA agent activate.

**Risk 2: Hallucinated or misleading RCAs erode trust.**  
**Mitigation:**

* LLMs only for hypothesis generation, summarization, and reasoning over retrieved evidence; The data itself is retrieved from databases  
* Mandatory citations and confidence bands  
* LLM as a judge to add additional checker mechanisms

**Risk 3: Alert fatigue kills adoption.**  
**Mitigation:**

* Hard cap: **max 3 alerts per user per day**  
* Economic impact ranking  
* Alert suppression and learning from snoozes

**Risk 4: Premature autonomy causes costly mistakes.**  
**Mitigation:** Human‑in‑the‑loop first; shadow mode; constrained automation domains with kill switches.

### **5\. How do we ingest and use unstructured data (Slack, RCA docs, CX chats)?**

* Prioritize **specific use cases**, not “ingest everything”.  
* For the initial MVP scope, identify / create specific documents by manually going through the most important documents (we will leverage some SMEs to do this)  
* Index RCAs and SOPs as first‑class, structured objects feeding Brain’s issue trees.

### **6\. What do we build vs. buy?**

**Buy / leverage:**

* Snowflake Cortex / Databricks Mosaic AI for governed LLM access  
* LangChain / LangGraph for agent orchestration  
* Leverage Cimba / PromptQL as needed to retrieve / summarize data

**Build:**

* Metric hierarchy and semantic layer  
* Instamart‑specific issue trees and playbooks  
* Closed‑loop learning and evaluation

The moat is not infra \- it’s **our encoded understanding of the business**. We will need to invest a meaningful amount of time in getting the right data along with the ontology / semantic layer in place.

### **7\. Do we have a form factor in mind?**

**Short term** \- Slack based alerting system along with a daily email summary; Employees should be able to investigate this at greater length in a separate dashboard integrated with PromptQL / Cimba for follow up questions

**Medium term \-**  A mobile and desktop application where any employee can

1. Track their key metrics  
2. Have a newsfeed / alerting mechanism that flags areas of important intervention  
3. An interface to deep dive / verify the data

**Long term \-** Medium term solution supplemented with a way to trigger actions

### **8\. What are some must-haves to be able to do this well?**

1. Strong playbooks, SOPs, RCAs to be able to glean out good issue trees  
2. Data instrumentation of metrics that comprise the issue trees for easy retrieval / analysis  
3. Sophisticated enough LLMs / agents that parse through data to be able to identify contributing factors in a high confidence manner  
4. Clear repository of individuals to flag specific issues to (who do we flag for what problem)  
5. Mechanism (ideally automated) to track if actions have been taken and the resultant impact to feed into our issue trees, RCAs for future analysis

### **9\. Success metrics (Month 3 for MVP, Year 1 for org)**

* ≥70% alert usefulness rating  
* ≥30% reduction in time‑to‑detect major issues  
* Measurable uplift in conversion, availability, and retention in pilot cities  
* ≥60% weekly active usage among pilot operators