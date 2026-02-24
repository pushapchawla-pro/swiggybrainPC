# Category Management Team Persona

## Overview

**Mission**: Own assortment strategy, brand relationships, and supplier performance at Swiggy Instamart. Ensure the right products are available to customers by curating selection, negotiating with brands, managing supplier fill rates, and driving category growth.

**Operating Level**: Category / Brand / City level (strategic assortment and supplier decisions)

**Team Structure**:
| Role | Focus |
|------|-------|
| **Category Managers (CatMs)** | Strategic - brand negotiations, pricing, growth campaigns, ad campaigns |
| **Catalog Ops (CatOps)** | Operational - NPI processing, quality checks, attribute standardization |
| **Category Executives** | Execution - first-level NPI approvals, data entry |

---

## Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Assortment Planning** | Curate SKU selection at city and darkstore level; decide which items go into which tier of pods (S/M/L/Mega) |
| **Brand Negotiations** | Negotiate margins, pricing, trade discounts, MOQ/MOV terms with brands |
| **Supplier Performance** | Monitor brand fill rates (OTIF, UFR, LTA); escalate chronic low performers |
| **NPI (New Product Introduction)** | Approve new products uploaded by brands; coordinate with Cat Ops for QC |
| **Tiering Decisions** | Define item-store tier mappings; determine which items are "Bradman"/critical |
| **Growth & Campaigns** | Plan category-level campaigns, ads, festive assortment, NPI launches |
| **Regional Selection** | Identify regional products (e.g., Bail Kolhu mustard oil in Lucknow) |
| **Competitive Benchmarking** | Monitor Blinkit/Zepto assortment, pricing, availability gaps |

### Assortment Management Flow

```
Category Team defines Strategy Inputs
    ↓
DS Algorithm runs weekly cron (pod assortment allocation)
    ↓
Output synced to Catalog Team (ERP enable/disable)
    ↓
Auto-emailers to Category Leads on enabled/disabled items
```

---

## Systems & Tools

| System | Purpose |
|--------|---------|
| **GPA (Category Assortment Dashboard)** | Replica of ERP showing MRP, margins, assortment coverage |
| **ERP Region Sheets** | Google Sheets / Snowflake table for catalog configuration |
| **NPI Portal** | Brand-facing portal for new product onboarding |
| **Category Mitr Copilot** | GenAI copilot for category managers (growth, ads, campaigns) |
| **IM Category Manager Copilot** | Hasura-powered AI assistant for day-to-day operations |
| **Vendor Portal** | Self-service portal for suppliers (PO visibility, performance dashboards) |
| **Retool Dashboards** | Contract uploads, item-supplier mapping |

---

## Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| **Category Availability** | % availability of SKUs in category at pod level | >95% |
| **Supplier Fill Rate (UFR/OTIF)** | % of PO quantities delivered on time and in full | >80% |
| **Brand Performance** | GMV, units sold, impressions, I2C per brand | - |
| **Assortment Depth** | # of SKUs enabled per category per pod tier | - |
| **NPI TAT** | Time from brand upload to spin creation | <2 days |
| **Return Task Adherence** | % of low-performer removals completed within SLA | >90% |

**Performance Thresholds**:
| Metric | Warning | Critical |
|--------|---------|----------|
| **OTIF** | <80% | <60% |
| **UFR** | <85% | <70% |
| **LTA** | <90% | <75% |

---

## Common Issues Handled

| Issue Type | Description | Example |
|------------|-------------|---------|
| **Supplier Not Delivering** | Brand fill rates low, causing chronic OOS | Bail Kolhu oil never in stock in Lucknow |
| **Brand OOS** | Primary brand out of stock across city/region | Coca-Cola chronic at 15 Bangalore pods |
| **Tiering Errors** | SKU enabled in wrong tier or disabled incorrectly | Item shows in warehouse but not orderable at pod |
| **Regional Selection Gaps** | Local products missing from assortment | Popular regional brand not onboarded |
| **MOQ/MOV Blocking** | Order constraints preventing small-quantity replenishment | Brand requires 5-ton MOQ, blocking DSD |
| **Brand Mapping Errors** | Incorrect brand ID mappings causing catalog issues | Multiple brands mapped to wrong parent company |
| **Low Performer Stagnation** | Items with zero sales not removed, blocking space | SKU with 0 sales for 45 days still in pod |

---

## RCA Branch Mapping

### Category Management-Owned Waterfall Codes

These are the actual `final_reason` values from `analytics.public.sku_wise_availability_rca_with_reasons_v7`:

| Waterfall Code | `final_reason` | Description | Category Action |
|----------------|----------------|-------------|-----------------|
| `oos_5` | `Fresh_Items` | FnV/perishables special handling (WH OOS) | Review FnV supply chain, dual dispatch |
| `instock_5` | `Fresh_Items` | FnV handling (WH has stock, POD doesn't) | Coordinate FnV movement timing |

### RCA Branch: A4/B4 - Inventory Hygiene (FnV)

Category Management primarily owns fresh/perishable item availability through the `Fresh_Items` code.

**Important Note**: Many supply-led issues that Category Management addresses don't have dedicated waterfall codes:

| Conceptual Issue | How It Manifests in Data | Category Action |
|------------------|-------------------------|-----------------|
| **Supplier fill rate low** | Contributes to `fillrate Issue` (oos_9) - owned by Procurement | Escalate to brand, negotiate terms |
| **Brand OOS at source** | Contributes to `Long Term Supply Issue` (oos_8) - owned by Procurement | Brand relationship escalation |
| **Tiering errors** | No dedicated code - causes downstream issues | Fix via ERP Region Sheets |
| **Assortment not enabled** | Maps to `Not in ERP` (oos_2, instock_1) - owned by ERP Team | Coordinate with ERP Team |

### Shared Ownership Pattern

Category Management often works alongside other teams:
- **With Procurement**: On fill rate escalations (`fillrate Issue`, `Long Term Supply Issue`)
- **With ERP Team**: On enablement decisions (`Not in ERP`)
- **With Planning**: On tiering inputs that affect movement planning

**Branch Description**: Category Management owns FnV availability directly and influences supply-led issues through brand relationships and assortment decisions.

---

## Stakeholder Interactions

| Stakeholder | Interaction Type |
|-------------|------------------|
| **Procurement** | Depends on category assortment decisions; receives escalations on vendor fill rates |
| **Planning** | Provides forecast inputs; depends on category tiering for movement planning |
| **ERP Team** | Executes category enablement decisions in ERP; syncs vendor codes, contracts |
| **Warehouse Ops** | Receives inwarding from category-approved suppliers |
| **Pod Ops** | Depends on correct tiering and enablement for storefront availability |
| **Brands/Suppliers** | Negotiates terms, monitors performance, escalates fill rate issues |
| **Data Science** | Consumes category inputs for hyperlocal assortment algorithm |

---

## SOPs & Playbooks

### Diagnosis SOP for Supply-Led Issues

1. **Check** supplier fill rate trend for last 30 days (UFR, OTIF)
2. **Validate** if issue is isolated (single supplier) or systemic (multiple suppliers)
3. **Review** MOQ/MOV constraints blocking orders
4. **Check** lead time adherence - is supplier delivering late?
5. **Verify** if secondary supplier exists and is activated
6. **Escalate** to Brand POC if fill rate consistently below threshold
7. **Document** escalation and track action taken

### Supplier Performance Review Playbook

1. Generate weekly supplier scorecard (QFR-based)
2. Identify defaulters on fill rate (<80% for 2+ consecutive POs)
3. Create pool of fallback suppliers
4. Schedule Brand <> IM connect to discuss gaps
5. Track fill rate improvement post-escalation

### Assortment Change Playbook

1. Strategy team provides inputs (seasonality, NPI, regional, brand campaigns)
2. DS algorithm runs weekly to reallocate pod assortment
3. Auto-emailers sent to category leads on enabled/disabled items
4. Low performers (zero sales after 45 days) auto-marked for removal
5. Return task pushed to loader app for physical removal

### Brand Escalation Playbook

1. Identify chronic low fill rate or OOS pattern
2. Raise to Category Manager for brand relationship review
3. Category Manager escalates to Brand POC
4. Document resolution and expected fill rate improvement
5. Track and verify improvement in next 2-4 weeks

---

## Key Data Tables

| Table | Purpose |
|-------|---------|
| `analytics_prod.im_vendor_portal_po_module` | PO performance metrics |
| `analytics.public.booking_portal_po_details` | Booking portal data |
| `prod.dash_erp_engg.dash_scm_supplier_master` | Supplier master with fill rates |
| `analytics.public.ab_im_erp_region_sheets_master` | ERP catalog configuration |
| `analytics.public.sku_wise_availability_rca_with_reasons_v7` | Availability RCA with reason codes |
| `temp.public.im_erp_region_sheets_master` | Assortment enable/disable at store level |

---

## Agent Integration

**When to route to Category Management**:
- Reason codes: `Fresh_Items` (oos_5, instock_5) for FnV availability
- Pattern is brand-wide or city-wide (not isolated pod issue)
- Supplier/brand performance consistently below threshold (escalation from Procurement)
- Assortment or tiering decisions need review (coordinate with ERP Team)

**Key Signals to Surface**:
- Brand × City availability trend (chronic status)
- Supplier fill rate vs target (OTIF, UFR)
- MOQ/MOV blocking percentage
- Tiering configuration status
- Secondary supplier activation status

**Action Verbs**: Escalate, Review, Align, Enable, Validate, Negotiate
