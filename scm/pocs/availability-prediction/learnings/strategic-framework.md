# Instamart Availability: Swiggy Brain POC - Strategic Framework

## Executive Summary

### The Paradox
Teams have the knowledge. Teams know the actions. Yet availability problems persist.

### What We Know
- Knowledge exists
- People know the actions (Brand SCM knows supplier issues via emails/calls)
- Each Team do RCA daily (Procurement RCA, CatM RCA)
- Teams can track priority SKUs

### Our Three Core Hypotheses for Why the Gap Exists:

1. **Coordination & Accountability Gap**: Information exists but doesn't reach the right person at the right time with clear accountability. When multiple teams could act (Procurement, Catm, Brand SCM), ownership is unclear.

2. **Attention & Scale Gap**: Teams can only humanly monitor Top 100 brands and Bradman/Band 1/Band 2 SKUs. Band 3, Band 4, and long-tail SKUs have availability issues that go completely unnoticed - not because teams don't know what to do, but because it's impossible to track thousands of SKUs manually.

3. **Proactive Prediction Gap**: We don't know proactively what will go out of stock before it happens. We only find out after it's already OOS.

### The Central Question
Can Swiggy Brain solve these three gaps? Or will we just build an expensive dashboard showing problems everyone already knows about?

### What Success Looks Like
Teams taking action they wouldn't have taken without the system (both on priority SKUs caught earlier AND on long-tail SKUs they couldn't monitor before), resulting in measurable improvement in availability metrics.

### The Risk
If we add GenAI prediction without fixing the underlying coordination problem AND extending monitoring beyond human capacity, we risk building an expensive dashboard that shows problems everyone already knows about.

## Summary Table

| Aspect | Details |
|--------|---------|
| Problem | Availability issues persist despite teams having knowledge and action playbooks |
| Root Cause Hypothesis | **Gap 1 - Coordination & Accountability**: Information doesn't reach right person at right time with clear ownership<br><br>**Gap 2 - Scale & Attention**: Teams can only monitor high-priority SKUs manually, leaving Band 3/4 and long-tail untracked<br><br>**Gap 3 - Proactive Prediction**: We don't know proactively what will go out of stock before it happens |
| Proposed Solution | Swiggy Brain to solve ALL THREE gaps:<br><br>**For Gap 1**: Route information + recommended actions to right person at right time with clear accountability<br><br>**For Gap 2**: Extend monitoring to Band 3/4 and long-tail SKUs impossible to track manually<br><br>**For Gap 3**: Predict which SKUs will go OOS before it happens (V1 Predictive POC) |
| Approach | Phased POC: V0 (Reactive Routing) → V1 (Predictive + Learning) → V2 (Advanced Context with SKU-specific Rules) |
| Key Question | Will GenAI solve all three actual constraints or just add another visibility layer? |

## 1. Proposed Solution Versions

### 1.1 Version 0 (V0): Reactive Intelligence with Proactive Routing

| Component | Description |
|-----------|-------------|
| **What it does** | For events that already happened (D-1), route information proactively to the right person with the right action to take |
| **Example** | Yesterday, SKU X went OOS because supplier didn't deliver despite PO being raised appointment given → System identifies Catm responsibility → Alerts Catm: "Contact supplier Y about missed delivery for SKU X, expedite or source from backup" |
| **Core Hypothesis** | Routing/alerting system will improve execution by solving Gaps 1 & 2:<br>• **Gap 1**: Information doesn't reach the right person at the right time with clear accountability<br>• **Gap 2**: Teams can only monitor high-priority SKUs manually, leaving long-tail untracked |
| **Value Proposition** | **Solves Gap 1**: Eliminates coordination gap by routing with clear accountability<br><br>**Solves Gap 2**: Extends team attention beyond Top 100 brands and Bradman/Band 1/Band 2 SKUs to Band 3, Band 4, and long-tail SKUs that aren't humanly possible to track manually |
| **What we're testing** | • Can we correctly identify what happened, why it happened, who should act, and what action to take?<br>• Will this enable teams to maintain availability across a broader SKU base without additional headcount?<br>• Do Band 3/Band 4 SKUs have availability issues that go unnoticed simply because teams can't monitor everything? |

### 1.2 Version 1 (V1): Predictive Intelligence with Historical Action Learning

| Component | Description |
|-----------|-------------|
| **What it does** | Predict which SKUs will go OOS, explain why they will go OOS, show what actions were taken in similar past situations, and recommend future actions based on what worked |
| **Example** | SKU X will likely go OOS in 3 days because supplier has pattern of underdelivering in this season → In past 5 similar cases, 3 were resolved by expediting from backup supplier, 2 by increasing buffer from another warehouse → Recommend: Expedite from backup supplier (success rate 60%) |
| **Value Proposition** | **Solves Gap 3**: Moves from reactive to predictive.<br><br>Learns from history to recommend actions with probabilistic success rates |
| **What we're testing** | • Can we predict accurately?<br>• Can we extract learnings from past actions (structured data + unstructured emails/calls)?<br>• Can we recommend actions that teams actually find useful? |

### 1.3 Version 2 (V2): Advanced Context Reasoning with SKU-Specific Rules

| Component | Description |
|-----------|-------------|
| **What it does** | Learn dynamic rules specific to each SKU × City × Supplier combination through context graphs, rather than applying generic rules across all SKUs |
| **Example** | **For SKU A in City X from Supplier Y**: Learn that underdelivery happens every March due to seasonal capacity constraints → Apply specific intervention (order 2 weeks early)<br><br>**For SKU B in City Z from Supplier W**: Learn that appointment delays cause issues → Apply different intervention (priority appointment scheduling) |
| **Status** | TBD - depends on learnings from V0 and V1 |
| **Other Possibilities** | • Reconciliation of multiple forecasting systems (Movement Planning vs other models)<br>• Autonomous action execution for low-risk, high-frequency scenarios<br>• Real-time feedback loops that improve recommendations based on human decisions |
| **Decision Point** | V2 scope will be defined based on V0/V1 validation results and where highest ROI opportunities emerge |

### Our Goal with V0, V1 and V2

Prove that GenAI doesn't just predict, but actually solves:

**1. Coordination & Execution Gap by:**
- Routing information to the right person at the right time
- Providing clear action recommendations
- Establishing clear accountability

**2. Scale & Attention Gap by:**
- Extending monitoring to Band 3, Band 4, and long-tail SKUs
- Making it possible to maintain availability across thousands of SKUs without proportional headcount increase

**3. Proactive Prediction Gap by:**
- Predicting which SKUs will go OOS before it happens
- Learning from historical actions to recommend what works

## 2. Current Understanding: Key Insights from User Research

### 2.1 The Availability Problem - Major Root Causes

| Category | Sub-Components | Control Level |
|----------|----------------|---------------|
| **Fill Rate Issues** | **Vendor → Warehouse:**<br>• Supplier production issues<br>• Supplier reliability<br>• Vendor capacity constraints | Lower control |
| | **Movement Planning:**<br>• Warehouse → Pod inventory movement<br>• Appointment scheduling<br>• PO timing and quantity | Higher control |
| **Demand Forecasting** | • Analytics model forecasts on higher side for warehouse to pod movement plan<br>• Warehouse Ordering is based on Movement Planning demand or another model<br>• Systems may not be in sync, causing availability gaps | Mixed control |
| **Operational Constraints** | • OTIF issues<br>• MOV/MOQ constraints | Mixed control |

### 2.2 The Data & Knowledge Problem

| What Exists | Where It's Trapped | Issue |
|-------------|-------------------|-------|
| Procurement Team does RCA daily on troubled SKUs | Daily reports, dashboards | Knowledge exists but fragmented |
| Brand SCM knows supplier issues | Emails, phone calls with brands | Tribal knowledge - not systematically captured |
| Each SKU × City has unique failure reasons | Individual team member experience | Pattern recognition happens in human brains, not systems |
| Root cause information (production issues, delivery timing, appointment gaps) | Scattered across emails, calls, multiple systems | Even with Glean admin tokens, emails don't surface easily without specific mappings |

**Critical Unanswered Questions (that remain systematic blind spots):**
- Did we give the brand an appointment at the right time?
- If some brand came to take an appt, do we know they actually came to take an appointment?
- If we didn't, do we know that we didn't give them?
- When we raised a PO, was it the right quantity?
- If supplier didn't deliver, what was the exact reason - production issue or something else?

### 2.3 The Attribution & Accountability Problem

| Surface Level | Reality | Gap |
|---------------|---------|-----|
| Dashboard shows "fill rate issue" | Multiple potential causes:<br>• When did we raise PO?<br>• Did we raise right quantity?<br>• When did we define to raise it?<br>• Did we give the appointment on time?<br>• Why exactly is brand not supplying - production issue, payment issue, capacity constraint? | If PO is raised AND appointment is given, who is responsible - Procurement or Catm? |
| Focus on Top 100 brands, Bradman, Band 1 & 2 SKUs | Band 3, Band 4, and long-tail SKUs get minimal attention | It's not humanly possible to monitor all SKUs manually - likely have availability issues that go unnoticed |
| Teams know what actions to take | Action playbooks exist:<br>• Catm has specific actions for certain scenarios<br>• Procurement has intervention options<br>• Brand SCM has supplier relationships | But ownership isn't always clear when multiple teams could act |

### 2.4 The Action Problem

**Teams know the actions - but then what's the issue?**

| Potential Root Cause | Evidence | Implication for Solution |
|---------------------|----------|-------------------------|
| Information not reaching right person at right time | Knowledge trapped in emails, calls, individual experience | Routing/alerting system could help |
| Unclear accountability when multiple teams could act | "If PO is raised and appointment is given, who is responsible?" | Need clear ownership mapping |
| Competing priorities causing execution gaps | Focus on Bradman/Band 1-2 leaves others unmonitored | System needs to prioritize and route |
| Human attention limits | Teams can only monitor high-priority SKUs manually | GenAI needed to extend monitoring to long-tail |
| Lack of confidence in which action will work | Multiple intervention options, unclear success rates | Need historical learning on action efficacy |

**Solutions Being Explored:**
- If brands cause the issue: Buy from market and debit brand for margin loss
- If supplier reliability is the pattern: Focus on supplier diversification rather than just prediction
- If it's appointment/PO timing: Better internal coordination without prediction

## 3. Questions for the Team

### 3.1 Understanding the Problem

#### Question 1: Knowledge exists but availability remains an issue - what's actually broken?

Procurement does daily RCA. Brand SCM knows via emails/calls why suppliers didn't deliver. Teams know what actions to take. Yet availability issues persist.

Is the constraint: coordination failure, accountability gaps, execution discipline, or human attention limits? If GenAI only provides earlier visibility into problems people already know about, have we solved anything?

#### Question 2: Where should GenAI focus - problems we can't control or problems we can?

Fill rate issues: Vendor → Warehouse (lower control) vs Movement Planning (higher control)

#### Question 3: Can GenAI extract insights from tribal knowledge - and should we for this POC?

Brand SCM knowledge lives in thousands of emails and call notes where the reason for why a particular supplier is not able to fulfill a particular SKU.

Glean can access with admin tokens if we specify which account manager handles which brand.

**Questions to resolve:**
- From a security perspective, should we use Glean admin tokens for account manager emails?

#### Question 4: How do competitors handle availability?

- How do direct competitors (Blinkit, Zepto, BBNow) and indirect competitors handle similar availability challenges?
- Do they face similar issues or have they solved this differently?
- Can we learn from their approaches?

#### Question 5: What level of solution are we building?

- **Level 1**: Predict OOS ("SKU X will be out of stock in 3 days")
- **Level 2**: Predict OOS with reason ("SKU X will be OOS because supplier missed delivery")
- **Level 3**: Predict OOS with reason and action ("SKU X will be OOS because supplier missed delivery → recommend expedite from backup supplier")

Which level solves the actual business problem? Do we need all three sequentially, or can we skip to Level 3 if that's where the value is?

#### Question 6: Do we need to map who does what before GenAI can recommend actions?

Different teams have different action playbooks:
- Catm has specific actions for certain scenarios
- Procurement has their intervention options
- When PO is raised and appointment is given, ownership between Procurement and Catm isn't always clear

#### Question 7: Where should GenAI add value - high-volume SKUs or long-tail?

Focus is heavily on Bradman and Band 1 & 2 SKUs. But what about remaining SKUs?

Should Swiggy Brain:
- Help prioritize which SKUs to focus on dynamically based on business impact?
- Focus POC on one segment where intervention ROI is highest?
- Try to solve availability across all SKUs?

What's the value distribution - is solving long-tail availability worth the complexity cost?

#### Question 8: How do we create the feedback loop to improve the model?

In human-augmentation mode:
1. GenAI predicts OOS + recommends action
2. Human sees prediction and recommendation
3. Human takes action, modifies it, or ignores it
4. Outcome occurs (OOS happened/didn't happen, action worked/didn't work)

We need to capture: Did human agree with prediction? Take recommended action? Modify it? What was outcome?

- What instrumentation is needed to learn from human decisions?
- How does this feedback loop improve future predictions and recommendations?

#### Question 9: Do we need to map data sources before GenAI can learn from them?

We need both structured and unstructured data. Unstructured is accessible via Glean, but we need to tell Glean where to look:
- Which account manager handles which brand
- Which email addresses to query
- Which systems contain appointment data, PO data, delivery data
- Which Slack channels have relevant discussions

**Questions:**
- How long will this mapping take?
- Can we start POC with partial mapping, or does incomplete data invalidate proof of concept?
