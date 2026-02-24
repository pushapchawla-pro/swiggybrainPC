# CLAUDE.md

This file provides guidance to Claude Code when working with persona files in this folder.

## Purpose

This folder contains **team persona profiles** for the Swiggy Brain Instamart Availability Agent. Each persona defines:
- What a team owns and is responsible for
- How to route availability issues to the right team
- Diagnosis playbooks for each team type
- RCA branch mappings for attribution

## Persona Files

| File | Team | Operating Level | Waterfall Branch |
|------|------|-----------------|------------------|
| `planning.md` | Planning | City / Warehouse / Brand | A2, B2, B3: Forecasting, Movement Design |
| `procurement.md` | Procurement | City / Warehouse | A1: Supplier & Inbound Constraints |
| `category-management.md` | Category Management | Brand / Category / City | A4/B4: FnV Handling (Fresh_Items) |
| `warehouse.md` | Warehouse | Warehouse / WH × Category | A3: WH Throughput & Capacity |
| `pod-ops.md` | Pod Ops | Pod / Pod × SKU | B1: POD Ops Throughput & Capacity |
| `erp-team.md` | ERP Team | City / Region / Catalog | A4/B4: Inventory Hygiene (ERP) |
| `product-support.md` | Product Support | System / Config | B4: POD Config (inactive/blocked) |

## Waterfall Attribution Model

The RCA uses a two-branch waterfall model. See `docs/reason-codes.md` for complete details.

```
STORE AVAILABILITY MISS
├── A. WH-led Availability Miss (~12.8%)
│   ├── A1. Supplier & Inbound       → Procurement
│   ├── A2. WH Planning/Forecasting  → Planning
│   ├── A3. WH Throughput/Capacity   → Warehouse
│   └── A4. Inventory Hygiene (WH)   → ERP Team
│
└── B. POD-led Availability Miss (~4.7%)
    ├── B1. POD Ops Throughput       → Pod Ops
    ├── B2. POD Planning/Demand      → Planning
    ├── B3. Movement Design          → Planning
    └── B4. Inventory Hygiene (POD)  → ERP Team / Product Support / Category Mgmt
```

| Branch | Waterfall Codes | Primary Owner |
|--------|-----------------|---------------|
| **A1** | `Long Term Supply Issue`, `fillrate Issue` | Procurement |
| **A2** | `Planning Ordering Issue` | Planning |
| **A3** | `WH Cap Missed`, `WH_Cap_Movement_Reduced`, `wh_ob_Fillrate Issue`, `wh_putaway_delay` | Warehouse |
| **A4** | `Not in ERP`, `temp_disable`, `Order Blocking List`, `Others` | ERP Team |
| **B1** | `POD Cap Missed`, `pod_Space Issue_cold`, `Putaway_delay` | Pod Ops |
| **B2** | `Forecasting_error` | Planning |
| **B3** | `movement_rr_not_generated`, `movement_rr_blocked`, `Movement Design issue` | Planning |
| **B4** | `pod_inactive`, `disabled_pod`, `movement_blocked_list`, `Fresh_Items` | Product Support / Category Mgmt

## Owner Routing Logic

Use these rules to determine which team owns an availability incident. These map to actual `final_reason` values in `analytics.public.sku_wise_availability_rca_with_reasons_v7`.

```
IF final_reason IN ('movement_rr_not_generated', 'movement_rr_blocked', 'Planning Ordering Issue', 'Forecasting_error', 'Movement Design issue')
   → Planning

IF final_reason IN ('Long Term Supply Issue', 'fillrate Issue')
   → Procurement

IF final_reason IN ('Fresh_Items')
   → Category Management

IF final_reason IN ('WH Cap Missed', 'WH_Cap_Movement_Reduced', 'wh_ob_Fillrate Issue', 'wh_putaway_delay')
   → Warehouse

IF final_reason IN ('POD Cap Missed', 'pod_Space Issue_cold', 'Putaway_delay')
   → Pod Ops

IF final_reason IN ('Not in ERP', 'temp_disable', 'Order Blocking List')
   → ERP Team

IF final_reason IN ('pod_inactive', 'disabled_pod', 'movement_blocked_list')
   → Product Support / Config

IF final_reason IN ('Others')
   → Unassigned (requires manual triage)
```

**Note**: See `docs/reason-codes.md` for complete code definitions and the waterfall attribution logic.

## Shared Ownership Cases

Some issues span multiple teams:

| ai_owner | Split |
|----------|-------|
| `Pod Ops / Planning` | Pod Ops: execution, space, manpower. Planning: movement settings, DOH |
| `Warehouse / Planning` | Warehouse: capacity, putaway, outbound. Planning: movement design, allocation |
| `Category / Procurement` | Category: brand negotiation, fill rate escalation. Procurement: PO creation, MOQ handling |
| `Category / ERP Team` | Category: assortment decisions. ERP: enable/disable execution in system |
| `Product Support / Category` | Product Support: Control Room rules. Category: tiering decisions |

## Using Personas in LLM Prompts

When generating alerts or RCA outputs, reference personas for:

1. **Roles & Responsibility prompt** → Pull team responsibilities from persona
2. **RCA Branch prompt** → Use RCA branch mapping section
3. **Operating Level prompt** → Use operating level guidance
4. **Diagnosis SOP prompt** → Use SOPs & Playbooks section

## Key Data Tables by Persona

| Persona | Primary Tables |
|---------|---------------|
| Planning | `im_pod_hr_demand_forecasting`, `KS_GD_FINAL_RUNRATE` |
| Pod Ops | `im_store_slot_week_level_dataset`, `scm-capacity-controller` |
| Warehouse | Vinculum API, Inbound Dashboard, Movement Planning Portal |
| ERP Team | `im_erp_region_sheets_master`, `im_contract_master_realtime` |
| Procurement | `scm_procurement_po`, `im_vendor_portal_po_module`, `booking_portal_po_details` |
| Category Management | `im_vendor_portal_po_module`, `dash_scm_supplier_master`, `ab_im_erp_region_sheets_master` |
| Product Support | `DASH_SCM_INVENTORY_AVAILABILITY`, `SCM_CONTROL_ROOL_RULES_EVENT`, `CMS_SLOTS` |

## Updating Personas

When updating persona files:
1. Verify information via Glean search (`mcp__glean_default__search`)
2. Cross-reference with SCM research docs in `scm/docs/scm-research/`
3. Validate RCA codes against `sku_wise_availability_rca_with_reasons_v7`
4. Keep SOPs aligned with actual team playbooks from Confluence
