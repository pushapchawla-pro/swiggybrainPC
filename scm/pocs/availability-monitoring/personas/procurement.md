# Procurement Team Persona

## Overview

**Mission**: Ensure timely and accurate purchase orders are raised to suppliers/vendors to maintain inventory availability at warehouses and dark stores (PODs), while optimizing costs through MOQ/MOV constraints, vendor negotiations, and contract management.

**Operating Level**: City / Warehouse level (raises POs to suppliers for warehouse and DSD replenishment)

**Key Leaders**: Supratim Gupta (Demand Planning & Procurement), Rohit Shaw (FMCG Procurement Lead), Nishant Kishore (Planning & Procurement Tech Lead)

---

## Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **PO Creation** | Raise POs for warehouse (OTB) and POD (DSD) replenishment based on demand forecasts |
| **OTB to PO Conversion** | Convert Open-to-Buy planning documents into executable Purchase Orders |
| **MOQ/MOV Handling** | Ensure POs meet supplier-defined minimum order quantities and values |
| **Vendor Mapping** | Maintain primary/secondary supplier mappings per item-city combination |
| **Contract Management** | Manage supplier contracts with pricing, margins, lead times |
| **Appointment Booking** | Schedule warehouse inbound appointments via Booking Portal |
| **PO Amendment/Cancellation** | Handle PO modifications, short-closes, and cancellations |
| **Vendor Communication** | Send PO documents (PDF/XML) to suppliers via automated emailers |

---

## Systems & Tools

| System | Purpose |
|--------|---------|
| **MIM Dashboard** | Primary UI for PO uploads (OTB, ADHOC, DSD), contract management, supplier master |
| **Vinculum** | Third-party ERP for PO sync, inventory management, legal compliance |
| **scm-procurement** | Core backend service for PO creation, amendment, search |
| **scm-supplier-master** | Supplier onboarding, contract master, supplier profiles |
| **Vendor Portal / Booking Portal** | Supplier-facing portal for PO scheduling, appointment booking |
| **scm-api-gateway** | API gateway for vendor portal and procurement APIs |

---

## Key Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| **OTIF (On-Time In-Full)** | % of orders delivered on time AND in full | >90% |
| **UFR (Unit Fill Rate)** | Total qty received / Total qty requested | >85% |
| **LFR (Line Fill Rate)** | % of line items with 100% fill rate | >80% |
| **NZFR (Non-Zero Fill Rate)** | % of line items where at least 1 unit was fulfilled | >95% |
| **LTA (Lead Time Adherence)** | % of POs received within expected lead time | >90% |
| **PO Expiry Rate** | % of POs that expire without fulfillment | <10% |

**Thresholds**: DANGER: <70%, NEUTRAL: >90%

---

## Common Issues Handled

| Issue Type | Description | Resolution Path |
|------------|-------------|-----------------|
| **MOQ/MOV Blocking** | PO cannot be raised due to order value/quantity below minimum | Club POs, negotiate with vendor, wait for demand accumulation |
| **Contract Missing** | No active contract for item-city-supplier combination | Escalate to Contract Ops for creation |
| **Vendor Not Delivering** | Supplier fails to fulfill PO (fill rate <80%) | Escalate to vendor, consider secondary supplier |
| **PO Expiry** | PO expires before booking slot is available | Reissue PO with extended expiry |
| **Appointment Slot Unavailable** | No warehouse slots available for PO delivery | Reschedule or increase WH capacity |
| **Vinculum Sync Failure** | PO fails to sync with Vinculum ERP | Debug via scm-procurement logs, retry |

---

## RCA Branch Mapping

### Procurement-Owned Waterfall Codes

These are the actual `final_reason` values from `analytics.public.sku_wise_availability_rca_with_reasons_v7`:

| Waterfall Code | `final_reason` | Description | Procurement Action |
|----------------|----------------|-------------|-------------------|
| `oos_8` | `Long Term Supply Issue` | Supplier hasn't delivered for extended period (>7 days) | Escalate to supplier, activate secondary supplier |
| `oos_9` | `fillrate Issue` | Supplier fill rate <80% of PO quantity | Track fill rate, escalate to vendor |

### RCA Branch: A1 - Supplier & Inbound Constraints

| Sub-Issue | How It Manifests | Procurement Action |
|-----------|------------------|-------------------|
| **Vendor Fill Rate Issues** | Mapped to `fillrate Issue` (oos_9) | Monitor UFR/OTIF, escalate chronic defaulters |
| **Long-term Supply Problems** | Mapped to `Long Term Supply Issue` (oos_8) | Activate secondary supplier, market buying |
| **MOQ/MOV Blocking** | Not a separate waterfall code - rolled into `Planning Ordering Issue` (oos_10) | Collaborate with Planning on clubbing POs |
| **Contract Issues** | Not a separate waterfall code - causes PO creation failure | Fix via ERP Team |

**Important Note**: MOQ/MOV constraints, contract issues, and PO creation failures do not have dedicated waterfall codes. They typically manifest as:
- `Planning Ordering Issue` (oos_10) when POs aren't raised
- `Long Term Supply Issue` (oos_8) when supplier consistently doesn't deliver
- `fillrate Issue` (oos_9) when supplier delivers partial quantities

**Branch Description**: The issue is that suppliers are not delivering to the warehouse due to fill rate problems or long-term supply disruptions.

---

## Stakeholder Interactions

| Stakeholder | Interaction Type |
|-------------|------------------|
| **Demand Planning** | Receive OTB plans, forecast inputs for PO quantities |
| **Category Team** | Brand company mapping, SKU prioritization, margin negotiations |
| **Warehouse Ops** | Coordinate inbound appointments, capacity planning |
| **Finance** | Budget approvals, entity management, invoice reconciliation |
| **Vendors/Suppliers** | PO communication, delivery coordination, contract negotiation |
| **Pod Ops** | DSD PO coordination for direct store delivery |

---

## SOPs & Playbooks

### Diagnosis SOP for PO-Led Issues

1. **Check** if PO exists for the SKU × City × Supplier combination in the breach window
2. **Validate** if MOQ/MOV constraints blocked the PO (`moq_enabled`, `mov_enabled` flags)
3. **Review** contract status - ensure active contract exists for Item × City × Supplier
4. **Check** PO state - is it EXPIRED, CANCELLED, or PENDING_DELIVERY?
5. **Verify** appointment booking status - was a slot available and booked?
6. **If supplier issue**: Check fill rate history (UFR, OTIF) for last 30 days
7. **Escalate** to vendor if chronic fill rate issues (<80% for 2+ consecutive POs)
8. **Identify** if secondary supplier can be activated as fallback

### MOQ Handling Playbook

1. Identify SKUs blocked by MOQ constraints
2. Check if demand can be clubbed across cities/warehouses
3. Negotiate split deliveries with vendor
4. Consider market buying as fallback for critical SKUs
5. Document MOQ waiver requests for Category team

### PO Escalation Playbook

1. Identify POs with low fill rate or delayed delivery
2. Raise to Vendor POC via Vendor Portal
3. Track acknowledgment and expected resolution date
4. Escalate to Category Manager if no response within SLA
5. Document escalation for supplier scorecard

---

## Key Data Tables

| Table | Purpose |
|-------|---------|
| `prod.dash_scm.scm_procurement_po` | Purchase order master |
| `prod.dash_scm.scm_procurement_po_details` | PO line items |
| `prod.dash_erp_engg.dash_scm_supplier_master` | Supplier information |
| `prod.dash_erp_engg.dash_scm_contract_master` | Contract terms and pricing |
| `analytics_prod.im_vendor_portal_po_module` | PO performance metrics |
| `analytics.public.booking_portal_po_details` | Booking portal data |

---

## Agent Integration

**When to route to Procurement**:
- Reason codes: `Long Term Supply Issue` (oos_8), `fillrate Issue` (oos_9)
- Pattern is city or warehouse-wide (procurement operates at these levels)
- Vendor hasn't delivered for extended period
- Vendor fill rate consistently below 80% threshold

**Key Signals to Surface**:
- Last PO date and state for SKU × WH
- MOQ/MOV threshold vs current demand
- Contract status (active/expired/missing)
- Vendor fill rate trend (OTIF, UFR)
- Secondary supplier availability

**Action Verbs**: Raise, Club, Negotiate, Escalate, Reschedule, Reissue
