# **MVP – Swiggy Brain (Supply Chain Brain v0.1)**

**Scope: 90-day MVP (Jan \- Mar 2026\)**  
**Primary Objective:** Improve availability of the most important Instamart SKUs at a dark-store level and drive **\+10% in-session conversions** without increasing wastage or days of inventory.

In service of our ambition to build the world’s most operationally sophisticated quick-commerce network, Swiggy will launch the first live incarnation of Swiggy Brain \- **Supply Chain Brain v0.1**\- as a focused, 90-day MVP. This MVP targets Instamart’s most fundamental customer problem: **“I want it, but it’s out of stock.”**

Even today, customers encounter chronic unavailability of high-demand SKUs \- fruits & vegetables, dairy, eggs, beverages, ice-creams etc \- despite Swiggy possessing strong upstream supply, robust dark-store infrastructure, and deep demand signals. The cause is not one issue, but a chain of micro-breakages hidden across forecasting, procurement, warehouse operations, and dark-store processing.

 The system will:

* Continuously scan high-confidence search OOS items and high-impression SKUs with chronic unavailability  
* Diagnose *why* a SKU is unavailable using a deterministic issue tree  
* Surface **ranked, actionable interventions** to the right owner (category manager, demand planner, procurement manager, WH/Pod manager)  
* Establish a closed feedback loop on actions taken and resulting improvement in availability, conversion, and wastage

Supply Chain Brain v0.1 will be the **first real proof** that Swiggy Brain can permanently change how Instamart runs day-to-day.

# **MVP FAQs**

### **1\. What exactly will the MVP do?**

The MVP will monitor and diagnose SKU-level unavailability across select pilot pods/dark-stores.

It will:  
 **a. Detect Availability Breakages**

* SKUs with high search demand but poor availability  
* SKUs with high sales velocity or high impressions with chronic OOS patterns that lead to customer drop off  
* Sudden demand spikes vs. supply constraints

**b. Run a deterministic, data-grounded RCA using the following issue tree:**

1. *Forecasting-led:* demand consistently underestimated  
2. *PO-led:* POs not raised due to MOQ/MOV constraints or config gaps  
3. *Supply-led:* brands not delivering to the warehouse  
4. *Warehouse ops-led:* appointment issues, inwarding capacity, or throughput constraints  
5. *Dark store-led:* space/processing limits preventing inwarding  
6. *Tagging/config-led:* incorrect tiering or mis-tagged SKUs blocking visibility  
7. *Other causes:* identified during pilot

**c. Rank & deliver interventions:**  
 For each SKU, the system outputs the **top levers** that most likely explain the breakage, with supporting evidence pulled from Snowflake, WH logs, procurement data, historical forecasts, and RCAs and recommend actions.

**d. Create a closed loop:**  
 The system records:

* What action the stakeholder took  
* The observed effect on availability and conversion  
* Whether the RCA hypothesis was correct

This becomes the foundation for Swiggy Brain’s long-term learning loop.

### **2\. Why is the MVP focused specifically on availability?**

Because availability is the **\#1 driver of customer switching in quick commerce** and a structural bottleneck for Instamart’s perception flywheel.

And because this problem is unusually amenable to AI-driven diagnosis:

* The issue tree is mature, well-bounded, and deterministic  
* Owners are clearly identifiable (category → DP → procurement → WH → DS)  
* Unlike customer-retention RCA, the causal graph is data-complete  
* Amazon, Walmart and Meituan have already demonstrated massive step-ups in operational efficiency using similar availability-focused intelligence systems  
* Improvements are measurable quickly

In short: clear scope → high business impact → high feasibility → fast learnings.

### **3\. What does the MVP not do?**

* It will **not** autonomously change forecasts, POs, appointments, or dark-store capacities  
* It will **not** attempt complex growth or retention RCAs  
* It will **not** ingest unstructured signals (Slack, chats) unless tied to high-confidence cases

### **4\. How will the MVP be judged? (Success Metrics)**

**Leading Indicators (Month 1–2):**

* ≥80% precision in identifying true breakage drivers  
* ≥60% adoption among category \+ DP \+ procurement owners  
* ≥50% of surfaced interventions acted upon

**Lagging Indicators (By end of Month 3):**

* **\+10% improvement in in-session conversions** for targeted SKUs / dark-stores  
* ≥20% reduction in chronic OOS episodes for pilot SKUs  
* No increase in wastage or days of inventory  
* Clear evidence that Swiggy Brain’s RCA improves with each feedback loop

If we hit even 70% of these, we’ll have strong proof that Swiggy Brain can meaningfully run Instamart’s operational backbone.