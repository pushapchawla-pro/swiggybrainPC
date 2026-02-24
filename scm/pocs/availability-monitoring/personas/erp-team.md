# ERP Team Persona

## Overview

**Mission**: Own catalog and ERP configuration for Instamart. Ensure SKUs are correctly present and enabled in ERP for the right cities and pods. Ensure vendor codes and contracts exist so POs can be created. Fix ERP or integration issues that block POs, movement, or selling.

**Operating Level**: City or Region or Catalog Configuration level (fixes ERP/catalog settings for SKUs and suppliers)

---

## Key Responsibilities

| Responsibility | Description |
|---------------|-------------|
| **SKU Enablement** | Ensure SKUs are correctly present and enabled in ERP for the right cities and pods. Manage assortment enable/disable at store level via `temp.public.im_erp_region_sheets_master` table |
| **Vendor Code Management** | Create and maintain vendor codes in Vinculum; ensure 1:1 mapping between internal supplier IDs and Vinculum vendor codes |
| **Contract Management** | Maintain contract master (CityId + ItemCode + SupplierBuyingType) with margin details, start/end dates; sync contracts to Vinculum |
| **Item-Supplier Mapping (ISM)** | Manage primary/secondary supplier mappings per Item × City; handle percent allocation across suppliers |
| **Vinculum Integration** | Ensure sync between MIM (Master Inventory Management) and Vinculum ERP system for POs, inventory, invoices |
| **ERP Data Hygiene** | Clean up duplicate suppliers, validate HSN codes, ensure FSSAI compliance |

---

## Systems & Tools

| System/Tool | Purpose |
|-------------|---------|
| **MIM (Master Inventory Management)** | Central dashboard for inventory, SKU management, PO uploads, inwarding |
| **Vinculum** | External ERP system for warehouse management, PO creation, GRN, inventory sync |
| **ERP Region Sheets Master** | Google Sheets / Snowflake table (`analytics.public.ab_im_erp_region_sheets_master`) for catalog configuration |
| **Supplier Master Service** | `scm-supplier-master` service managing Item-Supplier mappings, contracts |
| **Contract Master Sync Lambda** | Lambda consuming SQS messages to sync contracts to Vinculum |
| **Retool Dashboards** | UI for contract uploads, item-supplier mapping, PO management |
| **Config Platform (CP)** | For enabling stores, managing feature flags |

---

## Key Metrics

| Metric | Description |
|--------|-------------|
| **SKU Enablement Rate** | % of Bradman/critical SKUs enabled in ERP per city |
| **Vendor Mapping Coverage** | % of items with valid vendor codes and active contracts |
| **Integration Error Rate** | Vinculum API failure rate for PO creation, contract sync, GRN |
| **Contract Sync Success Rate** | % of contracts successfully synced to Vinculum |
| **Duplicate Supplier Count** | Number of GST duplicates causing sync failures |
| **Missing Contract Count** | Items without active contracts blocking PO creation |

---

## Common Issues Handled

| Issue Type | Description | Example |
|------------|-------------|---------|
| **Item Disabled in ERP** | SKU not enabled for city/pod, blocking movement and ordering | Item shows in warehouse but not orderable at pod |
| **Missing Vendor Code** | Supplier exists in MIM but no Vinculum vendor code mapped | PO creation fails with "SKU not linked with vendor" |
| **Contract Blocking PO** | No active contract for Item × City × Supplier | "contract not found" error during OTB upload |
| **Vinculum Sync Failures** | Integration errors between MIM and Vinculum | Context timeout, HeuristicMixedException from Vinculum |
| **Duplicate Supplier GST** | Multiple active suppliers with same GST causing sync failures | "multiple suppliers found for GST: XXXXX" |
| **HSN Code Errors** | Invalid/missing HSN codes blocking invoice generation | RTV invoice generation failures |
| **MIM-Vinculum Desync** | PO state mismatch between internal system and Vinculum | PO cancelled in MIM but active in Vinculum |

---

## RCA Branch Mapping

### ERP Team-Owned Waterfall Codes

These are the actual `final_reason` values from `analytics.public.sku_wise_availability_rca_with_reasons_v7`:

| Waterfall Code | `final_reason` | Description | ERP Team Action |
|----------------|----------------|-------------|-----------------|
| `oos_2` | `Not in ERP` | SKU missing from ERP master (WH level) | Enable SKU in ERP, fix region mapping |
| `oos_3` | `temp_disable` | SKU temporarily disabled (quality hold, recall) | Resolve quality issue, re-enable |
| `oos_4` | `Order Blocking List` | SKU explicitly blocked from ordering | Review blocking reason, remove if applicable |
| `instock_1` | `Not in ERP` | SKU missing from ERP at POD level | Enable SKU for POD in ERP |
| `instock_3` | `temp_disable` | Temporarily disabled at POD | Resolve issue, re-enable |
| `instock_4` | `Order Blocking List` | Blocked from ordering at POD | Review and remove block |

### RCA Branch: A4/B4 - Inventory Hygiene & Systems

| Sub-Branch | Waterfall Code | Description |
|------------|----------------|-------------|
| **A4.1** ERP Disabled | `Not in ERP` (oos_2) | SKU not in ERP master |
| **A4.2** Temp Disable | `temp_disable` (oos_3, instock_3) | Quality hold, compliance |
| **A4.3** Order Blocking | `Order Blocking List` (oos_4, instock_4) | Business decision block |

**Important Note**: Vendor code issues, contract blocking, and Vinculum sync failures do not have dedicated waterfall codes. They typically cause:
- PO creation failures (no dedicated code - rolled into `Planning Ordering Issue`)
- Integration errors (not tracked as availability reason)

**Branch Description**: The issue is that the item is disabled in ERP, temporarily held, or explicitly blocked from ordering.

---

## Stakeholder Interactions

| Stakeholder | Interaction Type |
|-------------|------------------|
| **Procurement Team** | Receives PO creation requests; depends on contracts and vendor mappings being correct |
| **Planning Team** | Supplies forecast data; depends on ERP enablement for SKUs to be included in movement plans |
| **Warehouse Ops** | Depends on correct GRN configuration, Vinculum sync for inwarding |
| **Pod Ops** | Depends on SKU enablement at store level |
| **Category Team** | Provides assortment decisions; ERP team executes enablement |
| **Finance/BizFin** | Depends on correct HSN codes, contract margins for invoicing |
| **Vinculum Team** | External partner for ERP integration troubleshooting |

---

## SOPs & Playbooks

### Diagnosis SOP for ERP Issues

1. **Check** if the SKU is present and enabled in ERP and mapped to the correct Instamart city or region
2. **Validate** vendor code exists in Vinculum for the supplier (`vinculum_vendor_code` in supplier master)
3. **Verify** Item-Supplier mapping exists for Item × City (`analytics_prod.item_primary_supplier_mappings_master_otb_po`)
4. **Check** contract status - ensure active contract exists for Item × City × Supplier Buying Type (`analytics_prod.im_contract_master_realtime`)
5. **Validate** no duplicate suppliers exist for same GST (causing "multiple suppliers found" errors)
6. **Check** for any ERP, Vinculum or catalog errors in logs that would block PO creation, GRN or movement
7. **If sync failure**: Verify Vinculum API health, check for timeout/rate limit issues
8. **Identify** configuration fixes needed so that future POs and movements can be created without errors

---

## Key Data Tables

| Table | Purpose |
|-------|---------|
| `analytics.public.ab_im_erp_region_sheets_master` | ERP catalog configuration (city, item_code, vendor_code, lead_time) |
| `prod.analytics_prod.im_contract_master_realtime` | Active contracts with margins, suppliers |
| `analytics_prod.item_primary_supplier_mappings_master_otb_po` | Primary supplier mappings |
| `prod.dash_erp_engg.dash_scm_supplier_master` | Supplier master with Vinculum vendor codes |
| `analytics_prod.hmg_erp_assortment_table` | Consolidated ERP enablement flags at store level |

---

## Agent Integration

**When to route to ERP Team**:
- Reason codes: `Not in ERP` (oos_2, instock_1), `temp_disable` (oos_3, instock_3), `Order Blocking List` (oos_4, instock_4)
- Pattern is city or region-wide (catalog configuration level)
- SKU not enabled or temporarily disabled in ERP
- SKU blocked from ordering via business decision

**Key Signals to Surface**:
- SKU enabled/disabled status
- Vendor code mapping status
- Contract active/expired status
- Vinculum sync error logs
- Duplicate supplier flags

**Action Verbs**: Review, Fix, Validate, Sync, Enable, Escalate (to Vinculum if integration issue)
