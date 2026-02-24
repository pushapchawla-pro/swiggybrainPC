# Instamart Analytics: Domain Architecture

## Context

Swiggy Brain's analytics-context-builder has produced **7 IM skills** (all complete) + 1 cross-BU skill:
- `im-catops-data-analytics` (16 tables) — Catalog Operations
- `im-delops-data-analytics` (11 tables) — Delivery Operations
- `im-pricing-data-analytics` (11 tables) — Pricing & Discounting
- `im-growth-data-analytics` (17 tables) — Growth & Promotions
- `im-discovery-data-analytics` (10 tables) — Discovery & Storefront
- `im-cc-data-analytics` (16 tables) — Customer Care / IGCC
- `food-partner-data-analytics` (17 tables) — Food/Restaurant Analytics (cross-BU)

**This document is the master architecture** — it derives the domain taxonomy from first principles, starting from how Instamart physically operates, its four organizational pillars, and the analytical questions each team asks daily.

**Key architectural decision:** `im-availability-data-analytics` (21 tables) is **dismantled entirely**. "Availability" is not a domain — it's a cross-cutting diagnostic question ("why is SKU X unavailable?") that spans procurement, warehouse ops, pod ops, and catalog. Its 21 tables are redistributed to the domains that own the underlying operations. The RCA workflow becomes a cross-domain routing protocol.

**Revised domain count:** 11 domains (6 built + 3 new + 2 pending)

**Validation method:** Domain completeness verified via Glean research across Confluence, Slack, GDrive, JIRA, and People Directory (Feb 2026). Each domain has confirmed evidence of dedicated teams, services, dashboards, and Snowflake/Databricks tables.

---

## Part 1: How Instamart Operates as a Unit

### The Four Pillars

Instamart is a separate subsidiary (Swiggy Instamart Pvt Ltd, 5,320 org). Four organizational pillars drive the business, each with a distinct mandate:

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                INSTAMART: FOUR-PILLAR OPERATING MODEL                        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

                        ┌──────────────────────┐
                        │  CEO (Amitesh Jha)    │
                        │  5,320 org            │
                        └──────────┬───────────┘
           ┌───────────┬───────────┴───────────┬───────────┐
           ▼           ▼                       ▼           ▼
  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐ ┌──────────────┐
  │  OPERATIONS  │ │  COMMERCIAL  │ │ PRODUCT/TECH  │ │   GROWTH     │
  │  COO Ankit   │ │  CBO Hari    │ │ SVP Himavant  │ │ VP Arjun     │
  │  3,637 ppl   │ │  1,375 ppl   │ │ 217 + Eng     │ │   44 ppl     │
  │              │ │              │ │   matrix      │ │              │
  │  EXECUTES    │ │  DECIDES     │ │  BUILDS       │ │  ACQUIRES    │
  │  the physical│ │  what to     │ │  systems      │ │  & retains   │
  │  value chain │ │  stock,      │ │  & tools      │ │  users       │
  │              │ │  price,      │ │               │ │              │
  │              │ │  source      │ │               │ │              │
  └──────┬───────┘ └──────┬───────┘ └──────┬────────┘ └──────┬───────┘
         │                │                │                  │
  Skills:            Skills:          Skills:            Skills:
  • Pod Ops          • Procurement    • Discovery         • Growth
  • WH Ops           • Catalog        • CC/IGCC
  • Del Ops          • Pricing        • TnS
                                      • Finance
```

### Org Hierarchy (Verified via Glean People Directory, Feb 2026)

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║  AMITESH KUMAR JHA — CEO, Instamart (5,320 org, since Sep 2024)                         ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                          ║
║  PILLAR 1: OPERATIONS (COO)                                                              ║
║  ├── Ankit Jain — COO, Instamart (3,637 org, since May 2025, ex-Flipkart)               ║
║  │   ├── Manoj Muthu Kumar (Natl Biz Head, 1491) .. City clusters, pod ops, growth      ║
║  │   ├── Sanjay Digambar Joshi (AVP SC, 1068) .... Warehouse ops (3 regional dirs)      ║
║  │   ├── Anant Choudhary (AVP Ops, 609) .......... Delivery ops (IM-specific)           ║
║  │   ├── Gajender Yadav (Dir Infra, 292) ......... Physical infra, maintenance          ║
║  │   ├── Priya Chandramouli (AVP Planning, 45) ... Ops strategy, S&OP, control tower   ║
║  │   ├── Swayambhu Panda (Dir BizOps, 53) ........ Audit, inventory mgmt, network      ║
║  │   ├── Alok Kumar Tiwari (GM SLP, 59) .......... Safety, loss prevention              ║
║  │   ├── N Pitchumani (Dir Procurement, 10) ....... Indirect procurement                ║
║  │   └── Lakshmi Narayanan K R (VP OpsDesign) .... Strategic/advisory                   ║
║  │                                                                                       ║
║  PILLAR 2: COMMERCIAL (CBO)                                                              ║
║  ├── Hari Kumar Gopinathan — SVP & CBO (1,375 org, since Oct 2024, ex-Flipkart)         ║
║  │   ├── Mayank Rajvaidya (VP FnV, 692) .......... Fruits & Vegetables                  ║
║  │   ├── Supratim Gupta (AVP Demand+Proc, 215) ... Demand planning + procurement        ║
║  │   │   ├── Rohit Shaw (Dir Procurement, 125) ... FMCG procurement execution           ║
║  │   │   ├── Ishan (GM Demand Planning)                                                  ║
║  │   │   └── Gaurav Gupta (Dir Demand Planning)                                          ║
║  │   ├── Atul Handa (VP, 174) .................... Categories (Non-FnV, FMCG etc.)      ║
║  │   ├── Deepinder Singh Binner (AVP Storefront, 102) . Storefront, merchandising       ║
║  │   ├── Manender Kaushik (AVP Category, 69) ..... Category + New Commerce              ║
║  │   ├── Kanika Tiwari (Dir Ads) ................. Ads monetization                      ║
║  │   ├── Shravani Sinha (AVP New Commerce, 5) .... New Commerce [*Q8]                    ║
║  │   ├── Tusita (SM Category) .................... Category                              ║
║  │   ├── Prashanth B (Manager, joined Feb 2026) .. New joiner                            ║
║  │   └── Arshia Verma, Royan Mody, Saurabh Bansal + others (category leaders)           ║
║  │   NOTE: Hari has 12 direct reports per Glean (Feb 2026). 9 previously listed + 3 added.║
║  │                                                                                       ║
║  PILLAR 3: PRODUCT (SVP)                                                                 ║
║  ├── Himavant Kurnala — SVP Product (217 org, since Jul 2024, ex-JioMart/Amazon)         ║
║  │   ├── Shrinivas Ron (AVP Analytics, 80) ....... ALL IM analytics                     ║
║  │   ├── Siddiq K A (Dir T&S, 48) ................ Trust & Safety (IGCC fraud etc.)     ║
║  │   ├── Manish Hiroo (GM Catalog Product & Ops, 41) . Catalog product & ops            ║
║  │   ├── Vidya Nand (AVP Product, 13) ............ Product mgmt (incl Pod Ops PM)       ║
║  │   ├── Revathy Jeevan (GM Product GTM) ......... Product go-to-market                 ║
║  │   ├── Saurabh Umakant Singh (Dir PM, 11) ..... Product Management                   ║
║  │   ├── Sudhir Subramanian Mani (Dir PM, 6) .... Product Management                   ║
║  │   ├── Sourav Das (Principal PM, 3)                                                   ║
║  │   └── Akshay Singh (Principal PM, 3)                                                 ║
║  │                                                                                       ║
║  PILLAR 4: GROWTH & STRATEGY (VP CoS)                                                    ║
║  ├── Arjun Choudhary — VP & Chief of Staff (44 org)                                      ║
║  │   ├── Sreeram S (VP Revenue & Growth, 32)                                             ║
║  │   │   ├── Varun Kumar Reddy (Dir Growth Strategy)                                     ║
║  │   │   │   ├── Vatsal Agrawal (GM Growth Strategy)                                     ║
║  │   │   │   └── Shravesh Jain (GM Growth)                                               ║
║  │   │   ├── Harshit Agarwal (Dir New Initiatives) [*Q4]                                 ║
║  │   │   ├── Divya Nayak (Dir City Growth Strategy, 7)                                   ║
║  │   │   ├── Trisha Hegde (Dir Growth Strategy, 7)                                       ║
║  │   │   └── + 2 ICs (Sambara Saketh, Ragini Singh etc.)                                 ║
║  │   ├── Tadikonda Harsha Mohan (GM Category)                                            ║
║  │   └── Abhishek Shetty (Dir Brand Marketing)                                           ║
║  │                                                                                       ║
║  OTHER DIRECTS                                                                           ║
║  ├── Abhinav Gupta (AVP, 30) .................... Assortment design [*Q3]                 ║
║  └── Anirudh Puppala (AVP & Chief of Staff - Cx & Strategy, 16)                          ║
║      └── Anshita Chandak + 1 unknown [*Q2]                                               ║
║      NOTE: Acts as IM-side CX escalation owner. Routes CC issues via                     ║
║            #cx_anecdotes_and_escalations. Closest to "CC domain owner" within IM org.     ║
║                                                                                          ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║  CENTRAL FUNCTIONS (serve IM via matrix, NOT under Amitesh)                              ║
║                                                                                          ║
║  ENGINEERING (under CTO Madhusudhan Rao):                                                ║
║  └── Nitesh Garg (SVP Eng, 350) ............. ALL IM Engineering                        ║
║      ├── Arnav Agarwal (AVP Eng, 246) ....... B2C + Discovery + Assure/B2B             ║
║      │   ├── Sumit Gupta (Dir Eng, 96) ...... Discovery / Storefront / App              ║
║      │   ├── Ajay Kumar (Dir Eng, 68) ....... Pricing Eng / Fleet / Services            ║
║      │   └── Ashish Bhide (Dir Eng, 37) ..... Assure / B2B                              ║
║      ├── Tapan Ghia (AVP Eng, 71) ........... SCM + QA/SDET                             ║
║      │   ├── Nishant Kishore (Sr EM, 34) .... SCM Planning & Procurement                ║
║      │   ├── Samkit Jain (EM, 18) ........... IM Pod Operations                         ║
║      │   └── N A Karthick (Sr Lead SDET, 11)  QA/SDET                                   ║
║      └── Vivek Vasvani (AVP Eng, 32) ........ New initiative (NOT IM-scoped; excluded)  ║
║          NOTE: Reports to Nitesh. Org size accounting: 350 = 246+71+32+1.               ║
║          His team works on a new initiative outside Instamart's core scope.              ║
║                                                                                          ║
║  DATA SCIENCE (under CTO Madhusudhan Rao):                                               ║
║  └── Goda Doreswamy Ramkumar (VP Data Science & Analytics, 97 org, 11 DRs)              ║
║      └── Sunil Rathee (AVP Data Science, 32 org)                                         ║
║          └── Soumyajyoti Banerjee (Staff DS, IM lead, IC — no reports)                   ║
║      NOTE: Only Sunil Rathee's sub-org serves IM specifically.                            ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

### Pillar Interaction Model

```
COMMERCIAL decides WHAT to stock       OPERATIONS executes HOW to move it
(assortment, pricing, vendors)    ──►  (warehouse, dark store, delivery)
         ▲                                       │
         │         ◄── feedback loop ────────────┘
         │         (availability data, fulfillment rates)
         │
PRODUCT/TECH builds the systems        GROWTH drives WHO comes
(analytics, fraud detection,      ──►  (acquisition, retention,
 catalog tooling, features)             campaigns, ads)

KEY HANDOFF POINTS (where pillars meet):
─────────────────────────────────────────
H1: Commercial → Operations
    PO raised (Commercial) → executed at WH/POD (Operations)
    Assortment decision → store enablement

H2: Operations → Commercial (feedback)
    Availability data → assortment/planning decisions
    Fulfillment rates → vendor scorecards

H3: Growth → Commercial
    Campaign needs → pricing/offer configuration
    User cohort data → assortment priorities

H4: Product/Tech → All
    Analytics dashboards → used by all pillars
    System features → operationalized by Ops
    Fraud signals → actioned by CC and Ops

H5: Operations → Product (escalation)
    System bugs → engineering fixes
    Process gaps → feature requests
```

### Operating Rhythm

```
CADENCE           WHO MEETS                    WHAT HAPPENS
──────────        ──────────                   ─────────────
Quarterly MBR     CEO + all pillars            Targets set, strategy aligned
Weekly S&OP       Planning + Ops + Commercial  Demand forecast ↔ capacity
Weekly WBR        Ops + Commercial + Growth    Execution review, course correct
Daily Ops         Ops teams independently      Execution: inwarding, picking,
                                               delivery, manpower
Daily Commercial  Procurement + Planning       POs raised, vendor coordination
Daily Growth      Growth + CRM + Ads           Campaign execution, CRM triggers
Real-time CC      CC + Ops + Product           Issue resolution, escalation
```

### The Physical Value Chain

Every item sold on Instamart follows a physical path from brand to customer. Each stage is owned by a distinct team with distinct analytical questions.

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║                   THE LIFE OF AN INSTAMART ITEM                                         ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

  STAGE 1: SOURCING & PLANNING
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ Brand/Supplier negotiates with Category Manager → Contract signed                   │
  │ Demand Planner forecasts demand (TFT model) → Run rates set per SKU/city           │
  │ Movement Planner creates WH→POD transfer plans based on DOH triggers               │
  │ Procurement Manager raises POs (DSD direct to POD, or WH-routed)                   │
  │                                                                                     │
  │ TEAM: Supratim Gupta → Rohit Shaw (Procurement) + Ishan (Planning)                 │
  │ SYSTEMS: ARS, MIM, Vendor Portal                                                    │
  │ ANALYTICS SKILL: im-procurement (NEW — absorbs availability core)                  │
  └─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
  STAGE 2: WAREHOUSE OPERATIONS
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ Supplier arrives at Mother WH (1-2 per city, ~15-20 nationwide)                     │
  │ Gate pass → Dock allocation → Unloading → QC (AQR: Accepted Quality Report)        │
  │ GRN (Goods Receipt Note) → Putaway to storage → Pick for POD transfers             │
  │ Pack into LPN (crate/box) → Dispatch to assigned Dark Stores                        │
  │                                                                                     │
  │ TEAM: Central WH Ops → WH Manager → WH Executives                                  │
  │ SYSTEMS: Vinculum WMS (3P, being replaced by in-house), MIM                         │
  │ ANALYTICS SKILL: im-warehouse-ops (NEW)                                             │
  └─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                            ┌────────────┤
                            │            │
                     LPN from WH    DSD (Direct Store Delivery)
                            │       Perishables: dairy, bread, F&V
                            │       Vendor delivers directly to POD
                            ▼            │
  STAGE 3: DARK STORE / POD OPERATIONS   │
  ┌──────────────────────────────────────┴──────────────────────────────────────────────┐
  │ LPN/DSD arrives at Dark Store (~1,173 stores × 130 cities)                          │
  │ Loader scans LPN barcodes → QC (accept/damage/expire) → GRN at POD                │
  │ Putaway to designated rack (e.g., A-17-C = Ambient, Row 17, Shelf C)               │
  │ 12+ zone types: AMBIENT, CHILLER, FREEZER, HIGH_VALUE_CAGE, PHARMA, etc.           │
  │ Cycle counts (4 types: regular, real-time, spot audit, manual)                      │
  │ FEFO enforcement (First Expiry First Out)                                            │
  │ Enable/disable at multiple levels (store master, movement planning, ERP, features)  │
  │                                                                                     │
  │ TEAM: Pod Ops Central (Srikanth Reddy, Sonal Goswami, Karun Sangal) → COM → SM → ASM → Pickers/Loaders │
  │ SYSTEMS: MIM, ILS, Picker Admin, scm-task-manager, dash-picker-service              │
  │ ANALYTICS SKILL: im-podops (NEW — CRITICAL GAP)                                    │
  └─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
  STAGE 4: ORDER FULFILLMENT (at Dark Store)
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ Customer places order via app → Order routed to nearest serviceable POD             │
  │ Picker Assignment Cron (every 5 sec PAN India) matches order to free picker         │
  │ Picker navigates store using rack codes → Scans items → Packs → Generates invoice  │
  │ Places order in pigeon hole → MFR (Mark Food Ready) triggered                       │
  │                                                                                     │
  │ TEAM: Same Pod Ops team (picker = ground staff under Store Manager)                 │
  │ SYSTEMS: dash-picker-service, IM Retail Tasks App (Android HHD)                     │
  │ ANALYTICS SKILL: im-podops (picker OPH, O2MFR) + im-delops (MFR2P timing)          │
  └─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
  STAGE 5: LAST MILE DELIVERY
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ DE assigned (DDE dedicated / Shared fleet / 3PL)                                    │
  │ DE arrives at POD → Picks up from pigeon hole → Transit → Delivered to customer     │
  │ O2D milestone: O2A → O2HAR → MFR2P → Transit → Delivered                           │
  │                                                                                     │
  │ TEAM: Anant Choudhary (AVP) → Boby Sebastian, Rahul Kumar, Gaurav Bang              │
  │       (sourcing & onboarding), Shashank Jain (control tower) [*Q6]                 │
  │       → COH → OM → AM → Fleet Coach → DEs (DDE/Shared/3PL)                        │
  │ SYSTEMS: delivery-auto-assign, Heimdall, Alchemist, DLM                             │
  │ ANALYTICS SKILL: im-delops ✅                                                       │
  └─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
  STAGE 6: POST-ORDER
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ Customer receives order → Tracks via WIMO → May raise issue (missing/wrong/expired)│
  │ Bot triage (WIMO/GPT-4o-mini) → Image validation (Gemini 2.5 Flash)                │
  │ Rule engine recommendation → Agent if HITL → Resolution (refund/replace/deny)      │
  │ RQC (Return Quality Check) at POD → Re-inward or unsellable                         │
  │                                                                                     │
  │ TEAM: CC Ops Lead, QC Lead, Product Support                                         │
  │ SYSTEMS: OneView, CRM, Resolute (ML), cc-service                                   │
  │ ANALYTICS SKILL: im-cc ✅                                                           │
  └─────────────────────────────────────────────────────────────────────────────────────┘

  ═══════════════════════════════════════════════════════════════════════════════════════

  PARALLEL CUSTOMER JOURNEY (Digital):

  STAGE A: DISCOVERY
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ App open → Serviceability check → Home page load → Browse/Search → PDP → Cart      │
  │ 6 surfaces: browse, search, merch, YGTI, reorder, cart                              │
  │ ML models: LTR v2, popularity scoring, semantic search, spell correct               │
  │                                                                                     │
  │ TEAM: Deepinder Binner (AVP SF, CBO) + Vidya Nand (AVP Product) │ Eng: Arnav Agarwal │
  │ ANALYTICS SKILL: im-discovery ✅                                                    │
  └─────────────────────────────────────────────────────────────────────────────────────┘

  STAGE B: PRICING & CHECKOUT
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ MRP → Cost Price → Anchor Price → Competition Check → Discount Attribution          │
  │ Offer stacking (BDP + SDPO + LDPO) → Final selling price → Checkout → Payment      │
  │                                                                                     │
  │ TEAM: Pricing Team, Category Managers                                               │
  │ SYSTEMS: im-cps, Plutus, Hulk, offer-builder                                       │
  │ ANALYTICS SKILL: im-pricing ✅                                                      │
  └─────────────────────────────────────────────────────────────────────────────────────┘

  STAGE C: GROWTH & RETENTION
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ AAARRR lifecycle: Awareness → Acquisition (F2M) → Activation (M2C, C2O)            │
  │ → Retention (habit formation) → Revenue (AOV, ROAS) → Referral (XPoll)              │
  │ Campaigns, CRM, Ads (Brand Portal), Swiggy One integration                          │
  │                                                                                     │
  │ TEAM: Growth PM (Vatsal, Rishitha), CRM, City Leads, Ads Analysts                  │
  │ ANALYTICS SKILL: im-growth ✅                                                       │
  └─────────────────────────────────────────────────────────────────────────────────────┘

  FOUNDATION LAYER:
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ CATALOG: SPIN lifecycle, CHS/CQS, attribute health, store coverage, NPI             │
  │ TEAM: CatOps (Manish Hiroo, GM Catalog Product & Ops), Taxonomy team               │
  │ ANALYTICS SKILL: im-catops ✅                                                       │
  └─────────────────────────────────────────────────────────────────────────────────────┘

  CROSS-CUTTING LAYERS:
  ┌─────────────────────────────────────────────────────────────────────────────────────┐
  │ TRUST & SAFETY: COD fraud, offer abuse, IGCC fraud, image manipulation              │
  │ TEAM: TnS (Siddiq K A under SVP Product)                                            │
  │ ANALYTICS SKILL: im-tns (PENDING)                                                   │
  │                                                                                     │
  │ FINANCE / UNIT ECONOMICS: UE per order, CPO breakdown, margin waterfall, P&L        │
  │ TEAM: Finance (IM Finance VP being hired)                                            │
  │ ANALYTICS SKILL: im-finance (PENDING)                                               │
  └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Domain Taxonomy (11 True Domains)

### Design Principle

> A domain maps to a **team that owns data and decisions**, not to a cross-cutting question.
> "Availability" is not a domain because no single team owns it —
> it's the emergent outcome of 7+ teams doing their jobs well.

### Domain Tree

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║     INSTAMART ANALYTICS: 11 DOMAINS (6 built, 3 new, 2 pending)                        ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

INSTAMART
│
├── A. OPERATIONS PILLAR (COO Ankit Jain) ──────────────────────────────────────────────
│   ├── 1. Pod Operations                   [!! NEW]     ~8-10 tables
│   │      Owner: Manoj Muthu Kumar (Natl Biz Head, 1491 org)
│   │      Skill: im-podops-data-analytics
│   │
│   ├── 2. Warehouse Operations             [!  NEW]     ~10 tables
│   │      Owner: Sanjay Digambar Joshi (AVP SC, 1068 org)
│   │      Skill: im-warehouse-ops-data-analytics
│   │
│   └── 3. Delivery Operations              [✓  BUILT]   11 tables
│          Owner: Anant Choudhary (AVP Ops, 609 org)
│          Skill: im-delops-data-analytics
│
├── B. COMMERCIAL PILLAR (CBO Hari Kumar Gopinathan) ───────────────────────────────────
│   ├── 4. Procurement & Supply Planning    [!  NEW]     ~14 tables
│   │      Owner: Supratim Gupta (AVP Demand+Proc, 215 org)
│   │      Skill: im-procurement-data-analytics
│   │      NOTE: Absorbs core of dismantled im-availability
│   │
│   ├── 5. Catalog Operations               [✓  BUILT]   16 tables
│   │      Owner: Manish Hiroo (GM Catalog Product & Ops, 41 org)
│   │      Skill: im-catops-data-analytics
│   │
│   └── 6. Pricing & Discounting            [✓  BUILT]   11 tables
│          Owner: Category teams under Atul Handa / Manender Kaushik
│          Skill: im-pricing-data-analytics
│
├── C. CUSTOMER EXPERIENCE (Product + Eng) ─────────────────────────────────────────────
│   ├── 7. Discovery & Storefront            [✓  BUILT]   10 tables
│   │      Owner: Deepinder Binner (AVP Storefront, CBO) + Vidya Nand (AVP Product) │ Eng: Arnav Agarwal (AVP Eng)
│   │      Skill: im-discovery-data-analytics
│   │
│   └── 8. Customer Care / IGCC              [✓  BUILT]   16 tables
│          Owner: Central CX & Care (Swiggy-wide, NOT IM-specific) [*Q1]
│          IM-side escalation: Anirudh Puppala (AVP & CoS - Cx & Strategy)
│          Skill: im-cc-data-analytics
│
├── D. GROWTH PILLAR (VP Arjun Choudhary) ──────────────────────────────────────────────
│   └── 9. Growth & Promotions               [✓  BUILT]   17 tables
│          Owner: Sreeram S → Vatsal Agrawal
│          Skill: im-growth-data-analytics
│
└── E. CROSS-CUTTING ──────────────────────────────────────────────────────────────────
    ├── 10. Trust & Safety                   [   PENDING]
    │       Owner: Siddiq K A (Dir T&S, 48 org)
    │       Skill: im-tns-data-analytics
    │
    └── 11. Finance / Unit Economics         [   PENDING]
            Owner: IM Finance VP (being hired)
            Skill: im-finance-data-analytics

× DISMANTLED: im-availability-data-analytics (21 tables)
  └── Tables redistributed to domains 1, 2, 4, 5 (see Part 5)
  └── RCA workflow becomes cross-domain protocol (see Part 4)
```

### Team → Domain Coverage Map

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║             COMPLETE TEAM → DOMAIN MAPPING                                               ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                          ║
║  #  │ TEAM / FUNCTION          │ LEADER → CHAIN                │ DOMAIN         │ STATUS ║
║  ───┼──────────────────────────┼───────────────────────────────┼────────────────┼─────── ║
║     │                          │                               │                │        ║
║     │ ─── TEAMS WITH DEDICATED DOMAINS ─────────────────────────────────────────────── ║
║     │                          │                               │                │        ║
║  1  │ Pod Ops / Dark Store     │ Manoj→Cluster CEOs(COO)      │ Pod Ops        │[!!]NEW ║
║  2  │ Warehouse Ops            │ Sanjay Joshi→3 WH Dirs(COO)  │ Warehouse Ops  │ [!]NEW ║
║  3  │ Delivery Ops             │ Anant Choudhary→Boby,Rahul   │ Delivery Ops   │ [✓]    ║
║     │                          │ (COO, "Drivers Org")          │                │        ║
║  4  │ Procurement + Planning   │ Supratim→Rohit Shaw,125(CBO) │ Procurement &  │ [!]NEW ║
║     │                          │ Sunil Rathee (DS models)      │ Supply Planning│        ║
║  5  │ CatOps / Catalog         │ Manish Hiroo(SVP Prod)       │ Catalog Ops    │ [✓]    ║
║  6  │ Pricing / Discounting    │ Category teams(CBO)          │ Pricing        │ [✓]    ║
║  7  │ Discovery/Search         │ Deepinder Binner(CBO)+Vidya  │ Discovery      │ [✓]    ║
║     │                          │ Nand(SVP Prod)│Eng:Arnav     │                │        ║
║  8  │ Customer Care/IGCC       │ Central CX & Care (Swiggy-   │ CC / IGCC      │ [✓]    ║
║     │                          │ wide); IM: Anirudh P [*Q1]   │                │        ║
║  9  │ Growth & Promotions      │ Sreeram→Vatsal(VP CoS)       │ Growth         │ [✓]    ║
║ 10  │ Trust & Safety           │ Siddiq K A,48(SVP Prod)      │ TnS            │ [ ]    ║
║ 11  │ Finance/Unit Econ        │ IM Finance VP (being hired)  │ Finance        │ [ ]    ║
║     │                          │                               │                │        ║
║     │ ─── TEAMS COVERED BY MULTI-DOMAIN ACCESS (NO STANDALONE NEEDED) ──────────────── ║
║     │                          │                               │                │        ║
║ 12  │ Category Mgmt (strategic)│ Atul Handa,Manender(CBO)     │ catops+pricing │ covered║
║ 13  │ Storefront/Merch         │ Deepinder Binner(CBO)        │ discovery      │ covered║
║ 14  │ Ads/Monetization         │ Kanika Tiwari(CBO)           │ im-growth      │ covered║
║ 15  │ Quality/Freshness        │ Split: WH+POD teams          │ warehouse+pod  │ covered║
║ 16  │ Network/Serviceability   │ Priya(Planning)+Discovery    │ discovery+del  │ covered║
║ 17  │ Infra/Maintenance        │ Gajender Yadav(COO)          │ podops(context)│ covered║
║ 18  │ Reverse Logistics        │ Split: WH+POD+CC             │ warehouse+pod  │ covered║
║ 19  │ Workforce/Staffing       │ Picker→PodOps, DE→DelOps     │ podops+delops  │ covered║
║ 20  │ Payments/Checkout        │ Platform-level                │ SKIP           │ N/A    ║
║     │                          │                               │                │        ║
║  SUMMARY: 11 dedicated domains (6 built + 3 new + 2 pending)                            ║
║           9 teams covered by multi-domain access                                         ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## Part 3: Per-Domain Profiles

### Domain 1: Pod Operations (`im-podops-data-analytics`) [!! NEW — CRITICAL]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Operations (COO → Manoj Muthu Kumar, 1491 org)                │
│  Reporting:    Manoj → Cluster CEOs → COM → SM → ASM → Pickers/Loaders      │
│  Central:      Samanth Kumar Miryala (Dir Perf & Planning, 72)               │
│                Abhijan Ghosh (GM Process Excellence PODs, 4)                  │
│  Scale:        ~1,173 stores × 130 cities × ~5-8 staff/store = ~7K+ staff   │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Dark store execution — from inwarding to MFR.                               │
│  "Is each of our 1,173 stores operating at peak efficiency?"                 │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. What is picker OPH at POD X — trend over 7 days?                         │
│  2. How full are racks at POD Y? Which zone is at capacity?                  │
│  3. Inwarding TAT — how long from LPN arrival to shelf?                      │
│  4. Which PODs were disabled this week and why (which level)?                │
│  5. Cycle count accuracy — discrepancy rate at POD Z?                        │
│  6. Manpower vs demand — are we understaffed at peak hours?                  │
│  7. Pod scorecard — top/bottom 10 PODs by city?                              │
│  8. O2MFR breakdown — is picking or packing the bottleneck?                  │
│  9. Pigeon hole utilization — are orders waiting for pickup?                 │
│  10. FEFO compliance — expiry-related wastage rate?                          │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  Picker OPH, inwarding TAT, rack utilization (by zone), cycle count accuracy,│
│  manpower ratio, pod capacity score, enable/disable frequency, pigeon hole   │
│  utilization, O2MFR, FEFO compliance, pod scorecard composite                │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  MIM, ILS, Picker Admin, dash-picker-service, scm-task-manager,             │
│  IM Retail Tasks App (Android HHD)                                            │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  ← WH Ops (LPN handoff: WH dispatches, POD receives)                        │
│  → Del Ops (MFR2P timing: POD packs, DE picks up)                            │
│  ← Procurement (DSD inwarding: vendor delivers directly to POD)              │
│  → CC (RQC at POD: return quality checks happen at store)                    │
│  ← Del Ops (POD_OPS_SLA2 flag: Del Ops detects, Pod Ops diagnoses)          │
│                                                                               │
│  SKILL STATUS: [!! NEW — CRITICAL GAP]  ~8-10 tables                        │
│  Serves as data foundation for #copilot_im_pod_ops.                          │
│  Only ops team with zero dedicated analytics.                                │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Field Reporting Chain:**

```
  Amitesh Jha (CEO IM)
  └── Ankit Jain (COO)
      └── Manoj Muthu Kumar (Natl Biz Head, 1491 org)
          ├── Merwyn Crasto (AVP Cluster CEO, 293) .... cluster of cities
          ├── Abhinav Pophali (Dir Cluster CEO, 375) ... cluster of cities
          ├── Emani Vishwanath Sarath Kumar (Dir Cluster CEO, 263) ...... cluster of cities
          ├── Markand Vyas (City Head Kolkata, 130)
          ├── Annamalai A T (GM Cluster CEO Chennai, 148)
          ├── Samanth Kumar Miryala (Dir Perf & Planning, 72)
          │   └── Srikanth Reddy (SM Perf & Planning, 12)
          ├── Abhijan Ghosh (GM Process Excellence PODs, 4)
          └── Shubham Dixit (Dir Growth Strategy, 175)
              └── Under each cluster: COM → SM → ASM → Pickers/Loaders
```

**Why this is a critical gap:**

```
┌─ ⚠ CRITICAL GAP ─────────────────────────────────────────────────────────────┐
│ • ~1,173 dark stores across 130 cities — zero dedicated analytics             │
│ • ~7,000+ ground staff (Store Managers, ASMs, Pickers, Loaders)              │
│ • Every other ops team of comparable scale has a skill (Del Ops: ✅)          │
│ • Active Pod Ops AI Copilot initiative (#copilot_im_pod_ops) needs this data │
│ • Store Manager dashboard exists (Retool) but NO SQL-queryable analytics     │
│ • POD-led availability miss = ~4.7% of total OOS (RCA branches B1+B4)       │
│ • DelOps attributes ~36% of chronic POD slots to POD_OPS_SLA2 breaches      │
│ • Can DETECT pod issues (binary flags) but CANNOT DIAGNOSE or PRESCRIBE     │
│ • Analogy: Having a thermometer (flags) but no diagnostic lab (process data) │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### Domain 2: Warehouse Operations (`im-warehouse-ops-data-analytics`) [! NEW]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Operations (COO → Sanjay Digambar Joshi, AVP SC, 1068 org)    │
│  Reporting:    Sanjay → 3 regional WH Directors → WH Managers → Executives   │
│  Scale:        ~15-20 mother warehouses nationwide, ~1,068 staff             │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Mother warehouse execution — from gate to dispatch.                          │
│  "Are our ~20 warehouses processing inbound and dispatching outbound         │
│   efficiently?"                                                               │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. GRN turnaround time by warehouse — which are bottlenecked?               │
│  2. Dock utilization — are we turning away vendors?                           │
│  3. Outbound fill rate — which WH→POD transfers are incomplete?              │
│  4. Appointment fill rate — vendor no-show rate?                              │
│  5. Wastage rate by category — are F&V losses within benchmark?              │
│  6. LPN dispatch TAT — are PODs waiting for transfers?                       │
│  7. QC rejection rate — which vendors have quality issues?                   │
│  8. Putaway efficiency — staging area dwell time?                            │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  GRN TAT, dock utilization, outbound fill rate, QC pass rate,                │
│  appointment fill rate, wastage %, RTV volume, pilferage rate,               │
│  inwarding throughput, staging area dwell time                                │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  Vinculum WMS (3P, being replaced by in-house), MIM, scm-fulfilment,        │
│  scm-reporting                                                                │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  ← Procurement (PO → appointment booking → vendor arrives at WH)             │
│  → Pod Ops (LPN dispatch: WH ships, POD receives)                            │
│  ← Procurement (INBOUND/INBOUNDDETAIL tables shared at boundary)             │
│                                                                               │
│  SKILL STATUS: [! NEW]  ~10 tables                                           │
│                                                                               │
│  ┌─ ⚠ RISK ──────────────────────────────────────────────────────────────┐  │
│  │ In-house WMS migration active (Feb 2026) — schemas may change.        │  │
│  │ Align with Samkit Jain (EM IM Pod Operations) + Tapan Ghia (AVP Eng   │  │
│  │ SCM) on timing.                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Field Reporting Chain:**

```
  Amitesh Jha (CEO IM)
  └── Ankit Jain (COO)
      └── Sanjay Digambar Joshi (AVP Supply Chain, 1068 org)
          ├── Rupesh Kumar Choudhary (Dir WH Ops, 443) .. regional
          ├── Vijender Sangwan (Dir WH Mumbai, 190) ..... Mumbai
          ├── Anurag Tiwari (Dir WH Ops, 183) ........... regional
          ├── Diptiranjan Sahoo (GM Process Excellence WH, 166)
          ├── Subhendu Natta (SM WH Kolkata, 60)
          └── Kartik Prabhakar Shenoy (Dir Perf Control Tower, 20)
```

**Why Pod Ops and Warehouse Ops must be separate:**

```
  DIMENSION             MOTHER WAREHOUSE              DARK STORE (POD)
  ───────────────────── ───────────────────────────── ─────────────────────────────
  Count                 ~15-20 nationwide              ~1,173 nationwide
  Team                  WH Managers (Central WH Ops)   SMs + Central Pod Ops
  Reporting chain       Central WH → WH Mgr → Exec   Pod Ops Central → COM → SM
  Receives from         External suppliers/brands      WH (via LPN) or DSD vendors
  Ships to              Dark Stores (PODs)             End Customers (via DE)
  Customer impact       Indirect (via PODs)            DIRECT (10-min promise)
  WMS                   Vinculum (3P, Rs 4-5Cr/yr)    MIM + ILS (in-house)
  Scale                 Bulk (pallets, crates)         Unit-level (individual items)
  RCA branches          A3 (4 waterfall codes)         B1 (3 waterfall codes)
  Key KPIs              GRN TAT, outbound FR, dock     Inwarding TAT, OPH, rack util

  Analogy: Conflating them is like conflating a FACTORY with a RETAIL STORE.
```

---

### Domain 3: Delivery Operations (`im-delops-data-analytics`) [✓ BUILT]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Operations (COO → Anant Choudhary, AVP Ops, 609 org)         │
│  Reporting:    Anant → Boby Sebastian (Dir, 257), Rahul Kumar (Dir, 235),    │
│                Gaurav Bang (sourcing & onboarding), Shashank Jain            │
│                (control tower) [*Q6]                                         │
│                Ground: COH → OM → AM → Fleet Coach → DEs (DDE/Shared/3PL)   │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Last mile delivery — from MFR to customer doorstep.                          │
│  "Are we delivering within the 10-minute promise?"                            │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. What is O2D for POD X in morning vs evening slots?                       │
│  2. Which PODs are chronic high O2D? Root cause?                             │
│  3. PSLA adherence by city — trend over 30 days?                             │
│  4. DDE vs Shared fleet mix and utilization?                                 │
│  5. Serviceability split — Del Ops vs Pod Ops vs Net Ops?                    │
│  6. DE assignment TAT — how long from MFR to pickup?                         │
│  7. Cancel rate and reasons by city?                                          │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  O2D (4-segment), O2HAR, MFR2P, PSLA adherence, DDE/Shared fleet mix,       │
│  OPH, serviceability %, chronic/superchronic classification                   │
│  Thresholds: Unsvc >2.5%, O2HAR >7min, PSLA <90%, Cancel >3%                │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  delivery-auto-assign, Heimdall, Alchemist, DLM                              │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  ← Pod Ops (MFR timing, pigeon hole readiness)                               │
│  → CC (delivery issues: late, missing, wrong)                                │
│  → Pod Ops (POD_OPS_SLA2 flag: detect at Del Ops, diagnose at Pod Ops)       │
│                                                                               │
│  SKILL STATUS: [✓ BUILT]  11 tables │ 11 files │ G1-G6 PASSED               │
│                                                                               │
│  BUILD DETAILS                                                                │
│  Tables:     11 (5 Snowflake + 3 Databricks + 3 geography reuse)             │
│  Files:      11 (SKILL.md + 6 references + 2 tasks + 1 script + logs)       │
│  Workflows:  POD Delivery Diagnostic (5-phase), Chronic POD Analysis         │
│  SQL Gotchas: 18                                                              │
│  Personas:   4 (POD Managers, Del Ops Leads, Fleet Coordinators, plus ops)   │
│  CLI:        5 commands                                                       │
│  CROSS-REF:  POD_OPS_SLA2 flag → route to im-podops for root cause          │
│              PERC_POD_OPS attribution → im-podops for process data            │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### Domain 4: Procurement & Supply Planning (`im-procurement-data-analytics`) [! NEW — absorbs availability]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Commercial (CBO → Supratim Gupta, AVP Demand+Proc, 215 org)  │
│  Reporting:    Supratim → Rohit Shaw (Dir Procurement, 125)                  │
│                         → Ishan (GM Demand Planning)                          │
│                         → Gaurav Gupta (Dir Demand Planning)                  │
│                NOTE: Supratim has 8 DRs per Glean (incl. Anand Pratapray     │
│                Thacker, Minal Rahar, Rishi Tripathi, Vallabh Koushik).       │
│  NOTE: Procurement sits under CBO (commercial), NOT under COO (operations).  │
│  This reflects the commercial nature of vendor relationships and contracts.  │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Demand forecasting, PO lifecycle, vendor management.                         │
│  "Is the right product arriving at the right place at the right time?"       │
│                                                                               │
│  NOTE: This domain absorbs the CORE of what was im-availability.             │
│  Supratim's team owns both demand planning AND procurement.                  │
│  The "availability" question is primarily answered here —                     │
│  70%+ of OOS root causes trace to planning/procurement branches.             │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. Why is SKU X unavailable at store Y? (→ triggers RCA workflow)           │
│  2. Vendor fill rate (OTIF) — which vendors are underperforming?             │
│  3. Forecast accuracy — are run rates aligned with actual demand?            │
│  4. PO coverage — which SKUs have demand but no PO raised?                   │
│  5. MOQ/MOV constraints — how many SKUs blocked from ordering?               │
│  6. DSD vs WH procurement mix by category?                                   │
│  7. Vendor lead time trends — who is consistently late?                      │
│  8. Which SKUs have expired contracts blocking PO creation?                  │
│  9. Availability % by city — trend over 30 days?                             │
│  10. Top 10 SKUs by revenue lost to OOS this week?                           │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  Availability %, OOS %, vendor OTIF, PO coverage, forecast accuracy (MAPE), │
│  MOQ/MOV block rate, vendor lead time, DSD %, contract compliance            │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  ARS, MIM, Vendor Portal, scm-procurement, supplier-master                   │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  → WH Ops (PO → appointment booking → GRN)                                  │
│  → Pod Ops (DSD inwarding: vendor delivers directly to POD)                  │
│  → Catalog (assortment enablement: ERP config flags)                         │
│  ← All domains (availability data: everyone consumes availability metrics)   │
│                                                                               │
│  SKILL STATUS: [! NEW]  ~14 tables                                           │
│  Absorbs: 13 tables from dismantled im-availability                          │
│  + new vendor performance tables                                              │
│  Availability RCA workflow task template lives here.                          │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Field Reporting Chain:**

```
  Amitesh Jha (CEO IM)
  └── Hari Kumar Gopinathan (CBO)
      └── Supratim Gupta (AVP Demand Planning & Procurement, 215 org)
          ├── Rohit Shaw (Dir Procurement, 125)
          │   ├── Amit Rai (SM Procurement Delhi, 63)
          │   ├── Sreedhar C (Mgr Procurement BLR, 23)
          │   ├── Krishna Parik (SM Procurement, 15)
          │   └── + regional procurement managers
          ├── Anand Pratapray Thacker (Dir Procurement, 45)
          ├── Gaurav Gupta (Dir Demand Planning, 12)
          ├── Ishan (GM Demand Planning, 7)
          └── Minal Rahar, Rishi Tripathi, Vallabh Koushik (planning)
```

---

### Domain 5: Catalog Operations (`im-catops-data-analytics`) [✓ BUILT]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Product (SVP Product → Manish Hiroo, GM Catalog Product       │
│                & Ops, 41 org)                                                │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Catalog quality and lifecycle management.                                    │
│  "Is every product correctly described, attributed, and enabled?"            │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. CQS distribution by category — which L2s have lowest quality?            │
│  2. Attribute completeness for top 100 SPINs by revenue?                     │
│  3. NPI TAT — how long from creation to first sale?                          │
│  4. Store catalog coverage — which stores have gaps?                         │
│  5. SPIN lifecycle health — how many SPINs are stale/inactive?               │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  CQS/CHS, attribute completeness, SPIN lifecycle health,                     │
│  store catalog coverage, NPI TAT                                              │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  Catalog management system, ERP master, brand master                          │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  → Discovery (catalog quality → search visibility)                            │
│  → Procurement (assortment → PO eligibility)                                 │
│  ← Procurement (ERP config flags affect catalog enablement)                  │
│                                                                               │
│  SKILL STATUS: [✓ BUILT]  16 tables │ 10 files │ G1-G6 PASSED               │
│                                                                               │
│  BUILD DETAILS                                                                │
│  Tables:     16                                                               │
│  Files:      10 (SKILL.md + 5 references + 2 tasks + 1 script + logs)       │
│  Workflows:  Catalog Health Diagnostic, SPIN Change Tracker                  │
│  SQL Gotchas: 17                                                              │
│  Personas:   1                                                                │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### Domain 6: Pricing & Discounting (`im-pricing-data-analytics`) [✓ BUILT]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Commercial (CBO → Category teams: Atul Handa, Manender)       │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Margin health, competitive positioning, and discount governance.             │
│  "Are we priced right, and is our discount burn efficient?"                  │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. What is our price gap vs Blinkit/Zepto for top 100 SKUs by city?         │
│  2. Negative margin exposure this week — which categories, how much burn?    │
│  3. Which offers expired causing throughput drop on Tuesday?                  │
│  4. Discount decomposition — BDP vs SDPO vs LDPO split by category/city?    │
│  5. Pricing engine impact — CompBench/demand-based effectiveness?            │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  NM %, GM %, COGS, PI (price index), price gap, BDP/SDPO/LDPO (11 subtypes),│
│  CDPO, RPO, GSV, discount burn rate, CompBench effectiveness                 │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  im-cps, im-cds, Plutus, offer-builder, offer-server                         │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  → Growth (offers stacked with campaigns)                                     │
│  → Finance (discount burn → P&L impact)                                      │
│  ← Catalog (ERP master: cost price, MRP)                                     │
│                                                                               │
│  SKILL STATUS: [✓ BUILT]  11 tables │ 9 files │ G1-G6 PASSED                │
│                                                                               │
│  BUILD DETAILS                                                                │
│  Tables:     11 (8 Databricks + 2 Snowflake + 3 CDC config)                  │
│  Files:      9 (SKILL.md + 5 references + 1 task + 1 script + logs)         │
│  Workflows:  Pricing Health Diagnostic (4-phase)                              │
│  SQL Gotchas: 9                                                               │
│  Personas:   3 (Category Managers, Pricing Analysts, Commercial Finance)     │
│  CLI:        4 commands                                                       │
│  Key DQ:     DPO_COMBINED has 54% exact-row duplicates (ETL bug)             │
│              — MUST use SELECT DISTINCT * then aggregate                      │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### Domain 7: Discovery & Storefront (`im-discovery-data-analytics`) [✓ BUILT]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Commercial (Deepinder Binner, AVP Storefront) + Product       │
│                (Vidya Nand, AVP Product) │ Eng: Arnav Agarwal (AVP Eng,     │
│                under SVP Eng Nitesh Garg)                                    │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Search, browse, and storefront — the digital path to cart.                   │
│  "Are customers finding and adding what they want?"                          │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. Serviceability rate in Bangalore HSR — what % sessions served?           │
│  2. Q2C trend by city/platform — which queries have lowest conversion?       │
│  3. Null search rate trending up? Top null queries this week?                │
│  4. Which surface (browse/search/merch/YGTI) drives most GMV?               │
│  5. Brand SOV — which brands are gaining/losing impression share?            │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  Q2C, null search rate, MRR, surface attribution (6 surfaces),               │
│  SRP OOS rate, brand SOV/NTB, serviceability rate, API P95 latency           │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  Discovery service, LTR v2, popularity scoring, semantic search              │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  ← Catalog (catalog quality → search visibility)                              │
│  → Growth (surface-level campaign attribution)                                │
│  ← Pricing (price display on SRP/PDP)                                        │
│                                                                               │
│  SKILL STATUS: [✓ BUILT]  10 tables │ 12 files │ G1-G6 PASSED               │
│                                                                               │
│  BUILD DETAILS                                                                │
│  Tables:     10 (all Snowflake; 3 dropped, 6 competitor tables inaccessible) │
│  Files:      12 (SKILL.md + 8 references + 1 task + 1 script + logs)        │
│  Workflows:  Discovery Funnel Diagnostic (5-phase, max parallel: 4)          │
│  SQL Gotchas: 14                                                              │
│  Personas:   4 with decision tree and owner mapping                          │
│  CLI:        4 commands                                                       │
│  Unique:     Monitoring reference file (dashboards, alerts, BCP, SOPs)       │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### Domain 8: Customer Care / IGCC (`im-cc-data-analytics`) [✓ BUILT]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Central CX & Care (Swiggy-wide, NOT IM-specific) [*Q1]       │
│  NOTE:         Arulvasan T (GM Product Support) is under CTO org — he       │
│                handles operational product support (MIM dashboard access,    │
│                vendor portal), NOT customer complaints/IGCC. Previously      │
│                listed here in error. Siddiq K A is Domain 10 (TnS) only.    │
│  IM-side:      Anirudh Puppala (AVP & CoS - Cx & Strategy, 16 org)          │
│                routes IM CC escalations via #cx_anecdotes_and_escalations.   │
│                No dedicated IM CC ops lead identified. [*Q1]                 │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Post-order issue resolution — from complaint to closure.                     │
│  "Are we resolving customer issues accurately and efficiently?"              │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. What is IGCC CPO by issue type (missing item, wrong item, expired)?      │
│  2. Agent adherence to bot recommendations — which cities are worst?         │
│  3. RQC pass rate for AI vs agent-assisted — how is accuracy trending?       │
│  4. Top 5 categories driving IGCC volume this week?                          │
│  5. Refund leakage — how many claims gratified despite high-fraud tag?       │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  IGCC CPO (20p impact), bot efficacy (85%), agent AHT, FTNR,                │
│  RQC accuracy (91% AI), refund accuracy, image validation accuracy,          │
│  ITO, CSAT/NPS, fraud tag penetration                                         │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  cc-service, OneView, CRM, Resolute (ML-powered)                             │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  ← Del Ops (delivery issues: late, missing, wrong)                            │
│  ← Pod Ops (RQC at POD: return quality checks)                               │
│  → TnS (fraud escalation: suspicious claims → TnS investigation)             │
│                                                                               │
│  SKILL STATUS: [✓ BUILT]  16 tables │ 10 files │ G1-G6 PASSED               │
│                                                                               │
│  BUILD DETAILS                                                                │
│  Tables:     16 (all Snowflake; 6 tables dropped)                             │
│  Files:      10 (SKILL.md + 6 references + 2 tasks + 1 script)              │
│  Workflows:  IGCC Diagnostic (4-phase), Refund Leakage RCA (4-phase)        │
│  SQL Gotchas: 17                                                              │
│  Personas:   4 (CC Ops Lead, Product Support, QC Lead, CX/Finance)           │
│  CLI:        4 commands                                                       │
│  Key DQ:     6 FAILs all resolved to WARN with documented mitigations        │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### Domain 9: Growth & Promotions (`im-growth-data-analytics`) [✓ BUILT]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Growth (VP Arjun Choudhary → Sreeram → Vatsal Agrawal)        │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  User acquisition, retention, and campaign effectiveness.                     │
│  "Are we growing efficiently and retaining the right users?"                 │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. Campaign X conversion rate — which cohort responded best?                │
│  2. Menu-to-cart drop-off trend this week vs last?                           │
│  3. Ads ROAS by campaign — keyword SOV for top brands?                       │
│  4. Which city has lowest F2O conversion? Why?                               │
│  5. Habit formation journey completion rate by city?                          │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  F2M, M2C, C2O, AOV, campaign CVR, LTV, habit journey completion,           │
│  ad ROAS/SOV, XPoll CVR                                                       │
│  UPSI Metrics (restricted): GOV, OPD, MTU, UE, C1                           │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  Campaign service, CRM, Brand Portal, Swiggy One                             │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  → Pricing (campaign → offer configuration)                                   │
│  → Discovery (surface-level campaign attribution)                             │
│  → Finance (campaign spend → P&L impact)                                     │
│                                                                               │
│  SKILL STATUS: [✓ BUILT]  17 tables │ 12 files │ G1-G6 PASSED               │
│                                                                               │
│  BUILD DETAILS                                                                │
│  Tables:     17 (15 Snowflake + 2 Databricks; 4 dropped)                     │
│  Files:      12 (SKILL.md + 7 references + 2 tasks + 1 script + logs)       │
│  Workflows:  Growth Diagnostic (6-phase), Campaign RCA (4-phase)             │
│  SQL Gotchas: 7                                                               │
│  Personas:   4 (Visibility Starved, Conversion Blocked, Discount             │
│              Dependent, Retention Leaker) with decision tree                  │
│  CLI:        4 commands                                                       │
│  Key pattern: IM Growth Dashboard broken since Nov 2024 — this skill fills   │
│              the gap                                                          │
│                                                                               │
│  ┌─ ⚠ RISK ──────────────────────────────────────────────────────────────┐  │
│  │ UPSI data (GOV, OPD, MTU, UE, C1) has strict access control.         │  │
│  │ Skill marks UPSI metrics in glossary but does NOT query them.         │  │
│  │ Non-UPSI layer built first. UPSI layer requires separate RBAC.       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### Domain 10: Trust & Safety (`im-tns-data-analytics`) [PENDING]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Product (SVP Product → Siddiq K A, Dir T&S, 48 org)          │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Fraud detection, prevention, and abuse management.                           │
│  "Are we catching fraud without blocking good customers?"                    │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. What is IGCC fraud rate by city — trending up or down?                   │
│  2. How many offers were blocked by TnS this week? False positive rate?      │
│  3. COD availability vs fraud trade-off — which cities need tightening?      │
│  4. Image manipulation detection accuracy — how many caught vs missed?       │
│  5. UE impact of TnS interventions — savings from fraud prevention?          │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  Fraud rate, block rate, false positive rate, COD abuse rate,                │
│  IGCC fraud %, offer abuse rate, UE impact (20-50p/order)                    │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  fraud-and-abuse (FNA), offer-eval, TnS cart integration,                    │
│  InstrumentFraudCheckPlugin                                                   │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  ← CC (fraud escalation: suspicious IGCC claims)                              │
│  → Pricing (offer abuse blocking)                                             │
│  → Del Ops (trusted DE for fraud carts)                                      │
│                                                                               │
│  SKILL STATUS: [PENDING]                                                      │
│                                                                               │
│  ┌─ KEY CONTEXT ─────────────────────────────────────────────────────────┐   │
│  │ Fraud types specific to IM:                                           │   │
│  │   - COD abuse (dynamic limits, CX scoring)                            │   │
│  │   - Offer/coupon abuse (templateless coupons, Rs X deals)             │   │
│  │   - IGCC claim fraud (AI-generated images, gallery upload abuse)      │   │
│  │   - Fake orders (e.g., Dominos incident via vendor tech support)      │   │
│  │   - Chargeback fraud (UPI, Razorpay disputes)                         │   │
│  │ Active AI: COD risk models, CX scoring (NU CX Score v3),             │   │
│  │   image manipulation detection, gallery upload restrictions.           │   │
│  │ Cross-cuts: Pricing (offer abuse), CC (IGCC fraud),                   │   │
│  │   Payments (COD/chargeback), Delivery (trusted DE for fraud carts).   │   │
│  │ Key Docs: "TnS Upstream Intervention", "Trust and Safety IM Cart      │   │
│  │   Integration", "IM Trusted DE Psla Solutioning"                      │   │
│  │ Slack: #tns-pd-alerts, #im-discounting-prod-support                   │   │
│  └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

### Domain 11: Finance / Unit Economics (`im-finance-data-analytics`) [PENDING]

```
┌─ DOMAIN PROFILE ─────────────────────────────────────────────────────────────┐
│                                                                               │
│  PILLAR & ORG OWNERSHIP                                                       │
│  Pillar:       Finance (IM Finance VP being hired)                            │
│                                                                               │
│  RESPONSIBILITY STATEMENT                                                     │
│  Unit economics, cost attribution, and P&L analytics.                         │
│  "Where are we making and losing money per order?"                           │
│                                                                               │
│  TOP QUESTIONS                                                                │
│  1. UE breakdown for Bangalore this month — where are we losing money?       │
│  2. Which categories are negative margin? What's the CPO from IGCC?          │
│  3. Handling fee contribution to UE — trend over last 3 months?              │
│  4. Discount burn rate by campaign type — which are most efficient?          │
│  5. Delivery cost per order by city — where is 3PL more expensive?           │
│                                                                               │
│  KEY METRICS & KPIs                                                           │
│  UE per order (CPO breakdown), margin by category, discount burn,            │
│  handling fee contribution, delivery cost, CC cost (IGCC CPO), RPO,          │
│  GOV, EBITDA components                                                       │
│                                                                               │
│  SYSTEMS & DATA SOURCES                                                       │
│  finance-reconciliation-service, finance-cash (FCMS)                          │
│                                                                               │
│  CROSS-DOMAIN HANDOFFS                                                        │
│  ← Pricing (discount burn → P&L impact)                                      │
│  ← CC (IGCC CPO → cost per order)                                            │
│  ← Del Ops (delivery cost → cost per order)                                  │
│  ← Growth (campaign spend → P&L impact)                                      │
│                                                                               │
│  SKILL STATUS: [PENDING — BUILD LAST]                                         │
│                                                                               │
│  ┌─ ⚠ RISK ──────────────────────────────────────────────────────────────┐  │
│  │ UPSI sensitivity: GOV, OPD, MTU, UE, C1 all restricted.              │  │
│  │ This is the "CFO Brain" — connects all domain costs to P&L.          │  │
│  │ Build LAST since it aggregates outputs from all other domains.        │  │
│  │ Requires strict RBAC: leadership-only metrics gated by role.          │  │
│  │ Seller management complexity: 22→6 sellers consolidation in progress. │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 4: Cross-Domain Workflows

### Workflow 1: "Why is SKU X unavailable?" (Availability RCA)

Availability is NOT a domain — it's a **cross-domain routing protocol**. No single team owns it; it's the emergent outcome of 7+ teams doing their jobs well.

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║     CROSS-DOMAIN WORKFLOW: "WHY IS SKU X UNAVAILABLE?"                          ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  ENTRY POINT: User asks availability question                                    ║
║  PRIMARY SKILL: im-procurement (owns RCA fact tables + demand planning)          ║
║                                                                                  ║
║  STEP 1: Query sku_wise_availability_rca → identify RCA branch                  ║
║  STEP 2: Route to domain skill based on branch:                                 ║
║                                                                                  ║
║  ┌──────────────────────────────┬────────────────────────────────────────────┐  ║
║  │ RCA Branch                   │ Route To                                   │  ║
║  ├──────────────────────────────┼────────────────────────────────────────────┤  ║
║  │ Forecasting-led OOS          │ im-procurement (demand planning tables)    │  ║
║  │ PO not raised (MOQ/MOV)      │ im-procurement (PO lifecycle tables)       │  ║
║  │ Vendor delivery failure       │ im-procurement (vendor OTIF tables)        │  ║
║  │ Warehouse ops delay          │ im-warehouse-ops (GRN/putaway data)       │  ║
║  │ Movement planning failure     │ im-procurement (movement plan tables)      │  ║
║  │ Dark store constraint        │ im-podops (capacity/inwarding data)       │  ║
║  │ Catalog/config issue         │ im-catops (ERP/assortment data)           │  ║
║  └──────────────────────────────┴────────────────────────────────────────────┘  ║
║                                                                                  ║
║  STEP 3: Domain skill provides deep-dive root cause                              ║
║  STEP 4: Synthesize across domains if multi-branch                               ║
║                                                                                  ║
║  The RCA workflow task template lives in im-procurement                           ║
║  (tasks/availability-rca-workflow.md) and can cross-reference                     ║
║  other skills for deep-dives.                                                    ║
║                                                                                  ║
║  AVAILABILITY ISSUE TREE (7 deterministic branches):                             ║
║  1. Forecasting-led: Demand underestimated                                       ║
║  2. PO-led: POs not raised (MOQ/MOV constraints)                                ║
║  3. Supply-led: Brands not delivering to warehouse                               ║
║  4. Warehouse ops-led: Appointment/capacity/throughput issues                    ║
║  5. Dark store-led: Space/processing limits                                      ║
║  6. Tagging/config-led: Incorrect tiering, mis-tagged SKUs                      ║
║  7. Other causes                                                                 ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

### Cross-Domain Overlap Map

Skills don't exist in isolation. This map defines where one skill detects and another diagnoses, and how shared tables are owned.

```
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ PROCUREMENT  │◄───►│ WAREHOUSE    │◄───►│ POD OPS      │◄───►│ DELOPS       │
  │ (PO→vendor)  │     │ OPS          │     │ (inward→pick │     │ (last mile)  │
  │ Owns RCA     │     │ (GRN→dispatch│     │  →customer)  │     │              │
  │ fact tables   │     │  →LPN)       │     │              │     │              │
  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
         │                    │                     │                     │
         │  O1: RCA routes   │  O2: PO/GRN shared │  O3: LPN handoff   │  O4: MFR→pickup
         │  to operational   │  at boundary        │  WH dispatches     │  Pod→Del handoff
         │  skills for       │                      │  POD receives      │
         │  deep-dive        │                      │                     │
         └────────────────────┴──────────────────────┴─────────────────────┘
                              SCM CLUSTER (shared geography + catalog tables)

  ┌──────────────┐                                    ┌──────────────┐
  │ DELOPS       │◄── O5: Detection / Diagnosis ────►│ POD OPS      │
  │ (last mile)  │    DelOps: POD_OPS_SLA2 flag       │ (store ops)  │
  │              │    PodOps: explains WHY              │              │
  └──────────────┘                                    └──────────────┘

  ┌──────────────┐                                    ┌──────────────┐
  │ CATOPS       │◄── O6: "Why not showing?" ────────►│ DISCOVERY    │
  │ (quality)    │    CatOps = catalog quality          │ (visibility) │
  └──────────────┘    Discovery = SRP/ranking           └──────────────┘

  ┌──────────────┐                                    ┌──────────────┐
  │ PRICING      │◄── O7: Discount → P&L ────────────►│ FINANCE      │
  └──────────────┘                                    └──────────────┘

  ┌──────────────┐                                    ┌──────────────┐
  │ CC / IGCC    │◄── O8: Fraud scope ────────────────►│ TRUST &      │
  │ (post-order) │    CC = resolution                   │ SAFETY       │
  └──────────────┘    TnS = detection + prevention      └──────────────┘

  RESOLUTION PATTERN:
  ┌───────────────────────────────────────────────────────────────────────────────┐
  │ Upstream skill DETECTS → Downstream skill DIAGNOSES root cause               │
  │ Shared tables have primary owner; referenced (not duplicated) elsewhere      │
  └───────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Availability Dismantlement — Table Redistribution

The 21 tables from the dismantled `im-availability-data-analytics` are redistributed to the domains that own the underlying operations.

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║     AVAILABILITY SKILL (21 TABLES) → REDISTRIBUTION MAP                         ║
╠══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                  ║
║  TO: PROCUREMENT & SUPPLY PLANNING (im-procurement)                              ║
║  ───────────────────────────────────────────────────                              ║
║  • PO (Vinculum)                  PO header                                      ║
║  • PODETAIL (Vinculum)            PO line items                                  ║
║  • INBOUND (Vinculum)             GRN header [shared w/ WH Ops]                  ║
║  • INBOUNDDETAIL (Vinculum)       GRN line items [shared w/ WH Ops]              ║
║  • DASH_SCM_SUPPLIER_MASTER       Vendor info                                    ║
║  • SCM_ITEM_SUPPLIER_MAPPINGS     Approved vendor-SKU mappings                   ║
║  • scm_fc_inbound_appointment     Appointment bookings                           ║
║  • im_ars_mov_details             MOQ/MOV thresholds                             ║
║  • ars_uploaded_archives4         ARS planning output (demand plan)              ║
║  • sku_wise_avail_rca_v7          RCA fact table (primary home)                  ║
║  • final_reason_mapping_avail_rca Reason code mapping                            ║
║  • RCA_FILE_WH                    Daily RCA snapshot                             ║
║  • im_gmv_category_bands          GMV classification                             ║
║  SUBTOTAL: ~13 tables                                                            ║
║                                                                                  ║
║  TO: WAREHOUSE OPS (im-warehouse-ops)                                            ║
║  ─────────────────────────────────────                                           ║
║  • INBOUND (Vinculum)             [shared ref from Procurement]                  ║
║  • INBOUNDDETAIL (Vinculum)       [shared ref from Procurement]                  ║
║  • LOCATION (Vinculum)            WH master (primary home)                       ║
║  • + ~7 new tables from WMS       (to be discovered in Phase 3)                  ║
║  SUBTOTAL: 1 owned + 2 shared + ~7 new = ~10 tables                             ║
║                                                                                  ║
║  ALREADY IN CATOPS (no move needed):                                             ║
║  ─────────────────────────────────────                                           ║
║  • cms_spins_1                    Product catalog (already in catops)            ║
║  • brands                         Brand master (already in catops)              ║
║  • SKU (Vinculum)                 SKU master (Vinculum-specific)                ║
║  • im_erp_master_f9               ERP master [shared w/ Pricing]                ║
║  • codelkup (Vinculum)            Status codes [shared reference]               ║
║                                                                                  ║
║  SHARED GEOGRAPHY (all skills reference):                                        ║
║  ─────────────────────────────────────────                                       ║
║  • city (swiggykms)               City master                                   ║
║  • stores (swiggykms)             Store/POD master                              ║
║                                                                                  ║
║  RESULT: im-availability-data-analytics DELETED entirely                         ║
║          Skill directory archived, not rebuilt                                    ║
╚══════════════════════════════════════════════════════════════════════════════════╝
```

**Table accounting verification:**

```
  Procurement:   13 tables (owned or primary)
  Warehouse Ops:  1 table owned (LOCATION) + 2 shared refs (INBOUND, INBOUNDDETAIL)
  Already CatOps: 5 tables (no move needed)
  Shared geo:     2 tables (referenced by all skills)
  ─────────────────────────────────────────────────────────────────────
  TOTAL:         21 tables accounted for ✓ (some shared across boundaries)
```

---

## Part 6: Skill Structure Standard

Every analytics skill must follow this standard structure:

```
STANDARD SKILL STRUCTURE:
─────────────────────────
{skill-name}/
├── SKILL.md                    # Router: routing table, lifecycle, gotchas, glossary
├── references/
│   ├── table-schemas.md       # All tables: columns, grain, refresh, warnings
│   ├── glossary-metrics.md    # Metrics with formulas and benchmarks
│   ├── {topic-1}.md           # Domain-specific SQL templates (3-6 files)
│   ├── {topic-2}.md
│   └── persona-mapping.md     # (if multi-persona) Entity classifier + owner map
├── tasks/
│   ├── {primary-workflow}.md  # Main diagnostic (4-7 phases, parallel dispatch)
│   └── {secondary-workflow}.md# RCA or specialized workflow
├── scripts/
│   └── {skill}_health.py     # CLI tool (no DB needed, local utilities)
└── logs/
    └── {YYYY-MM-DD}-{slug}.md # Runtime execution logs (append-only)
```

### Mandatory SKILL.md Sections (12)

```
  #  SECTION                              PURPOSE
  ── ──────────────────────────────────── ──────────────────────────────────────
  1  YAML frontmatter                     Name, description, triggers
  2  Capability summary                   5-7 bullets: what this skill can do
  3  Prerequisites: connector skills      Which data connectors are needed
  4  Quick Reference routing table        Question → file mapping
  5  Proactive file loading               Intent → file priority for preloading
  6  Task workflows table                 Workflow name → file → description
  7  Execution model                      Persistent logs + task graph rules
  8  Cross-platform query routing          Table → platform → connector
  9  Lifecycle diagram                    ASCII, domain-specific
  10 SQL best practices                   8-18 gotchas specific to this domain
  11 Glossary                             15-25 acronyms with definitions
  12 Related references                   Links to all files in the skill
```

### Optional Sections

- Personas / decision trees (when multi-persona)
- Cross-domain handoff references (when shared boundaries)
- Monitoring reference (dashboards, alerts, BCP, SOPs)

---

## Part 7: Build Status & Priority

### Built Skills Summary

```
╔═══════════════════════════════════════════════════════════════════════════════════════╗
║  Skill                     │ Tables │ Files │ SQL Templates │ SQL Gotchas │ Personas ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║  im-catops                 │   16   │  10   │     ~39       │     17      │    1     ║
║  im-delops                 │   11   │  11   │     ~25       │     18      │    4     ║
║  im-pricing                │   11   │   9   │     ~33       │      9      │    3     ║
║  im-growth                 │   17   │  12   │     ~34       │      7      │    4     ║
║  im-discovery              │   10   │  12   │     ~44       │     14      │    4     ║
║  im-cc                     │   16   │  10   │     ~30       │     17      │    4     ║
╠═══════════════════════════════════════════════════════════════════════════════════════╣
║  TOTAL (6 skills)          │   81   │  64   │    ~205       │     82      │   20     ║
╚═══════════════════════════════════════════════════════════════════════════════════════╝

All 6 built IM skills: Phase 6/6 complete, Gates G1-G6 PASSED, 8-point DQ × all tables.
```

### Analytics Coverage Heat Map

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║         ANALYTICS COVERAGE BY VALUE CHAIN STAGE                                          ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                          ║
║  VALUE CHAIN STAGE          │ SKILL               │ COVERAGE    │ GAP SEVERITY           ║
║  ───────────────────────────┼──────────────────────┼─────────────┼─────────────────────── ║
║  Demand Planning/Forecast   │ im-procurement (NEW) │ ░░░░░░░░░░  │ 🔄 ABSORBS from avail  ║
║  Procurement / PO lifecycle │ im-procurement (NEW) │ ░░░░░░░░░░  │ 🔄 ABSORBS from avail  ║
║  Vendor management          │ im-procurement (NEW) │ ░░░░░░░░░░  │ ❌ MISSING (new tables) ║
║  Warehouse operations       │ im-warehouse-ops(NEW)│ ░░░░░░░░░░  │ ❌ MISSING              ║
║  POD inwarding + putaway    │ im-podops (NEW)      │ ░░░░░░░░░░  │ ❌ MISSING              ║
║  POD rack/space management  │ im-podops (NEW)      │ ░░░░░░░░░░  │ ❌ MISSING              ║
║  Picker operations          │ im-podops (NEW)      │ ░░░░░░░░░░  │ ❌ MISSING              ║
║  Order fulfillment at POD   │ im-podops + delops   │ ████░░░░░░  │ PARTIAL (timing only)  ║
║  Last mile delivery         │ im-delops            │ ██████████  │ ADEQUATE               ║
║  Catalog / selection        │ im-catops            │ ██████████  │ ADEQUATE               ║
║  Discovery / search         │ im-discovery         │ ██████████  │ ADEQUATE               ║
║  Pricing / discounting      │ im-pricing           │ ██████████  │ ADEQUATE               ║
║  Growth / campaigns         │ im-growth            │ ██████████  │ ADEQUATE               ║
║  Customer care              │ im-cc                │ ██████████  │ ADEQUATE               ║
║  Trust & safety             │ NONE                 │ ░░░░░░░░░░  │ ⏳ PENDING (planned)    ║
║  Finance / unit economics   │ NONE                 │ ░░░░░░░░░░  │ ⏳ PENDING (planned)    ║
║                                                                                          ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝

  LEGEND: ██ = full coverage, ░░ = no coverage, ████░░ = partial
```

### Priority Sequencing (New Skills)

```
  PRIORITY    SKILL                              EFFORT     RATIONALE
  ─────────── ────────────────────────────────── ────────── ──────────────────────────────
  #1 [!!]     im-podops-data-analytics           ~1 sess    CRITICAL GAP. 1,173 stores,
              (~8-10 new tables)                             7K+ staff, zero analytics.
                                                             Active Copilot initiative.

  #2 [!]      im-procurement-data-analytics      ~1 sess    HIGH. Absorbs 13 tables from
              (~14 tables: 13 migrated + 1+)                 dismantled availability +
                                                             new vendor perf tables.
                                                             Availability RCA workflow
                                                             lives here.

  #3 [!]      im-warehouse-ops-data-analytics    ~1 sess    HIGH. In-house WMS migration
              (~10 tables: 3 shared + 7 new)                 active. Align before schemas
                                                             change.

  #4 [ ]      Archive im-availability            ~0.5 s     Move to archived/, update
                                                             any cross-references.

  #5 [ ]      im-tns-data-analytics              ~1 sess    Cross-cutting fraud.

  #6 [ ]      im-finance-data-analytics          Last       Capstone. RBAC + UPSI heavy.
```

### Execution Approach

Each new skill follows the existing **6-phase analytics-context-builder workflow**:

```
Phase 1: Domain Discovery Interview  ──► Gate G1 (Domain Brief)
Phase 2: Glean + Codebase Research    ──► Gate G2 (Domain Model)
Phase 3: Table Discovery & Schema     ──► Gate G3 (≥1 table passes)
Phase 4: Draft Skill Plan             ──► Gate G4 (User approves)
Phase 5: Data Verification (8-check)  ──► Gate G5 (All PASS/WARN)
Phase 6: Skill Assembly               ──► Gate G6 (Complete skill)
```

**Reusable from existing skills:**
- `scripts/schema_verifier.py` — DQ checks, anti-pattern scan
- All 6 templates in `references/templates/`
- 13-pattern anti-pattern registry
- 8-point verification checklist

---

## Part 8: Domains Confirmed NOT Needed as Separate Skills

| # | Domain | Verdict | Rationale |
|---|--------|---------|-----------|
| 1 | Payments / Checkout | SKIP | Platform-level, not IM-specific. Covered partially by Pricing + Finance |
| 2 | Personalization / Reco | SKIP | Engineering-heavy (model outputs). Covered by Discovery + Growth |
| 3 | Ads / Monetization | SKIP | Sub-domain of Growth (Brand Portal tables already there) |
| 4 | Workforce / Staffing | SKIP | Picker → PodOps, DE → DelOps. No standalone team |
| 5 | Assure / Liquor / Pharma | SKIP (now) | Entity separation in progress. Wait for stable data infra |
| 6 | New Store Launch | SKIP | Project-based, covered across SCM + Discovery + Growth |
| 7 | Compliance / FSSAI | SKIP | Operational. FEFO tracked in Pod Ops |
| 8 | Network Planning | SKIP | Serviceability → Discovery, attribution → DelOps |
| 9 | ERP / Config | SKIP | System health, covered by Procurement + PodOps |
| 10 | Reverse Logistics | SKIP | Split across WH Ops + Pod Ops + CC |
| 11 | IM B2B / Brand Portal | SKIP | Vendor-facing. Build after internal domains are covered |
| 12 | Central Analytics | SKIP | Platform layer (Power BI, Snowflake, Fabric) — tooling, not a domain |
| 13 | Category Mgmt (strategic) | COVERED | catops + pricing (multi-domain access) |
| 14 | Storefront / Merch | COVERED | discovery (multi-domain access) |
| 15 | Quality / Freshness | COVERED | warehouse + pod ops (multi-domain access) |
| 16 | Infra / Maintenance | COVERED | podops contextual (multi-domain access) |

---

## Part 9: Verification Criteria

### Per-Skill Verification (after each build)
1. Run `schema_verifier.py` anti-pattern scan on all tables
2. Execute primary workflow end-to-end with a real entity
3. Verify all SQL queries return valid results
4. Confirm log file is created in `logs/` directory
5. Validate SKILL.md routing table matches actual reference files

### Taxonomy-Level Verification (after all builds)

| Check | Criteria | Status |
|-------|----------|--------|
| Every org team (Part 1) has a domain | No team left without analytics | [ ] |
| Every domain maps to exactly one pillar | No domain straddles two pillars | [ ] |
| Availability is NOT listed as a domain | Listed only as cross-domain workflow | [✓] |
| All 21 availability tables accounted for | Redistribution map is complete (Part 5) | [✓] |
| Per-domain profile has all 8 sections | No profile is incomplete | [✓] |
| Cross-domain handoffs are bidirectional | A→B implies B←A documented | [✓] |
| Skill structure standard matches built skills | Template matches reality | [✓] |
| Domains NOT needed list is comprehensive | 16 confirmed skips with rationale | [✓] |
| Pod Ops Copilot data foundation | im-podops serves #copilot_im_pod_ops | [ ] |
| E2E RCA routing | Procurement routes to WH/Pod/CatOps per branch | [ ] |

---

## Part 10: Open Questions *

Items below could not be confirmed with high confidence from Glean People Directory (Feb 2026). They are marked with `[*Qn]` wherever referenced in the org tree, domain profiles, or team mapping sections above. These should be verified manually (SuccessFactors / direct with stakeholders) before treating as ground truth.

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  #  │ OPEN QUESTION                           │ WHAT WE KNOW        │ CONF  ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║     │                                          │                      │       ║
║  Q1 │ Who is the actual CC/IGCC domain owner   │ Arulvasan T is NOT   │ LOW   ║
║     │ for Instamart? CC is a central Swiggy    │ CC. Anirudh Puppala  │       ║
║     │ function — is there a dedicated IM CC    │ handles escalations. │       ║
║     │ ops lead, or does Anirudh own it?        │ No named CC ops lead │       ║
║     │                                          │ found for IM.        │       ║
║     │                                          │                      │       ║
║  Q2 │ Who are Anirudh Puppala's 2 direct       │ Glean says 2 DRs.    │ LOW   ║
║     │ reports? Trisha Hegde confirmed under    │ Anshita Chandak is   │       ║
║     │ Sreeram, not Anirudh. So who is the      │ one. Second unknown. │       ║
║     │ second besides Anshita Chandak?          │                      │       ║
║     │                                          │                      │       ║
║  Q3 │ Abhinav Gupta (AVP, 30 org, direct of   │ Dept = "Assortment   │ LOW   ║
║     │ Amitesh) — who are his 3 direct reports? │ Design". No names    │       ║
║     │ What exactly does his team do?            │ found via Glean.     │       ║
║     │                                          │                      │       ║
║  Q4 │ Harshit Agarwal (Dir New Initiatives) —  │ Agent 1 (Glean chat) │ MED   ║
║     │ does he report to Sreeram S? Only found  │ listed him. Agent 5  │       ║
║     │ in one Glean chat response, not in the   │ (targeted query) did │       ║
║     │ targeted people directory query.          │ NOT list him.        │       ║
║     │                                          │                      │       ║
║  Q5 │ Shubham Dixit (Dir Growth Strategy, 175, │ People Dir says      │ MED   ║
║     │ under Manoj MK) — his People Dir title   │ "Growth Strategy"    │       ║
║     │ says Growth Strategy but operational      │ but Slack/Confluence │       ║
║     │ evidence shows L&D / Expansion work.     │ show expansion/L&D.  │       ║
║     │ Which is his actual function?             │ Title may be stale.  │       ║
║     │                                          │                      │       ║
║  Q6 │ Boby Sebastian & Rahul Kumar under       │ Confirmed as Anant's │ MED   ║
║     │ Anant Choudhary — exact titles and org   │ key directs. Titles  │       ║
║     │ sizes? Doc says "Dir, 257" and "Dir,     │ and sizes from Glean │       ║
║     │ 235" but Glean returned "9 DRs" for      │ chat, not people dir.│       ║
║     │ Anant without confirming these numbers.  │                      │       ║
║     │                                          │                      │       ║
║  Q7 │ Sonal Goswami & Karun Sangal — exact     │ Confirmed in Central │ MED   ║
║     │ reporting chain within Central Pod Ops.  │ Pod Ops (Confluence). │       ║
║     │ Do they report to Samanth Kumar          │ Direct manager not   │       ║
║     │ Miryala or someone else under Manoj?     │ confirmed.           │       ║
║     │                                          │                      │       ║
║  Q8 │ Shravani Sinha (AVP New Commerce, 5 org) │ Found as Hari's      │ MED   ║
║     │ — is she distinct from Manender          │ direct. Manender has │       ║
║     │ Kaushik's "New Commerce" category? Or    │ Partha & Anuj (also  │       ║
║     │ does she report under Manender?          │ "New Commerce").     │       ║
║     │                                          │ Overlap unclear.      │       ║
║     │                                          │                      │       ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

**Legend**: `[*Qn]` markers appear inline throughout this document wherever an unconfirmed fact is referenced. LOW confidence items are NOT asserted as corrections — they are listed as open questions only.

---

## Immediate Next Steps

```
  NEXT ACTION                               TRIGGER COMMAND
  ─────────────────────────────────────────  ───────────────────────────────────────
  1. Build im-podops-data-analytics          Build analytics skill for IM Pod Ops
  2. Build im-procurement-data-analytics     Build analytics skill for IM Procurement
  3. Build im-warehouse-ops-data-analytics   Build analytics skill for IM Warehouse Ops
  4. Archive im-availability                 Move to archived/, update cross-refs
  5. Build im-tns-data-analytics             Build analytics skill for IM Trust & Safety
  6. Build im-finance-data-analytics         Build analytics skill for IM Finance
```
