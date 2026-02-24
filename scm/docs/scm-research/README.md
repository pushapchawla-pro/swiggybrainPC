# Swiggy Instamart SCM Research Documentation

## Purpose

This research documentation provides a comprehensive understanding of Swiggy Instamart's Supply Chain Management (SCM) system. It was compiled to support the **Swiggy Brain** initiative, specifically the **Supply Chain Brain v0.1 MVP** focused on SKU-level availability.

## How to Read This Research

### Recommended Reading Order

**For Executive Understanding (30 min):**
1. Start with `00-scm-comprehensive-overview.md` - Read Sections 1-3 for architecture
2. Skim Section 9 (Key Challenges) and Section 10 (Swiggy Brain)

**For Technical Deep Dive (2-3 hours):**
1. `00-scm-comprehensive-overview.md` - Full document for synthesis
2. Pick domain-specific docs based on your focus area (see below)

**For Specific Domains:**

| If you're focused on... | Read this document |
|------------------------|-------------------|
| Warehouse operations, WMS, Vinculum | `01-mother-warehouses-wms.md` |
| Dark store operations, picking, POD tiers | `02-dark-stores-pod-operations.md` |
| Demand forecasting, ML models, PSLA | `03-demand-forecasting-ds-models.md` |
| Purchase orders, suppliers, fill rates | `04-purchase-orders-procurement.md` |
| Inventory systems (MIM/ILS/IAS) | `05-inventory-availability-systems.md` |
| Metrics, dashboards, alerting | `06-scm-metrics-kpis-dashboards.md` |
| Serviceability, network, banner factor | `07-network-serviceability.md` |
| Quality, freshness, FEFO, FnV expiry | `08-quality-freshness-management.md` |
| Returns, refunds, reverse logistics | `09-returns-refunds-reverse-logistics.md` |
| Supplier performance, OTIF, fill rates | `10-supplier-performance-fill-rate.md` |

---

## Document Index

| # | Document | Pages | Key Topics |
|---|----------|-------|------------|
| 00 | [Comprehensive Overview](./00-scm-comprehensive-overview.md) | ~20 | Full SCM architecture, synthesis of all findings |
| 01 | [Mother Warehouses & WMS](./01-mother-warehouses-wms.md) | ~12 | Vinculum, gatepass, inbound/outbound, GRN, zone management |
| 02 | [Dark Stores POD Operations](./02-dark-stores-pod-operations.md) | ~18 | POD tiers, LPN inwarding, capacity controller, picking, MIM |
| 03 | [Demand Forecasting & DS Models](./03-demand-forecasting-ds-models.md) | ~14 | TFT model, movement planning, PSLA, promotional demand |
| 04 | [Purchase Orders & Procurement](./04-purchase-orders-procurement.md) | ~15 | DSD PO, OTB/ADHOC Warehouse PO, Movement Planning PO, fill rates |
| 05 | [Inventory & Availability Systems](./05-inventory-availability-systems.md) | ~15 | MIM, ILS, IAS, inventory buckets, reconciliation |
| 06 | [SCM Metrics, KPIs & Dashboards](./06-scm-metrics-kpis-dashboards.md) | ~14 | OOS, DOH, fill rate, Retool, EagleEye |
| 07 | [Network & Serviceability](./07-network-serviceability.md) | ~13 | Polygon serviceability (LIVE), banner factor, H3 |
| 08 | [Quality & Freshness Management](./08-quality-freshness-management.md) | ~11 | FnV expiry, FEFO, POD QC, IGCC, wastage |
| 09 | [Returns & Reverse Logistics](./09-returns-refunds-reverse-logistics.md) | ~14 | Return orders, refunds, re-inventorization, PR management |
| 10 | [Supplier Performance & Fill Rate](./10-supplier-performance-fill-rate.md) | ~15 | OTIF, UFR, LFR, NZFR, lead time, booking portal |

---

## Quick Reference: Key Concepts

### Physical Infrastructure
```
Brand Companies → Suppliers → Mother Warehouses → Dark Stores (PODs) → Customers
                      ↓              ↑                    ↑
                  OTB/ADHOC PO   Movement PO           DSD PO
                  (manual)       (automated)          (manual)
```

### Key Systems
- **MIM**: Master Inventory Management (in-house ERP)
- **ILS**: Inventory Location Service (batch/location tracking)
- **IAS**: Inventory Availability Service (catalog availability)
- **Vinculum**: Third-party WMS for warehouses
- **TFT**: Temporal Fusion Transformer (demand forecasting model)

### Key Metrics
- **OOS**: Out of Stock rate
- **DOH/DOI**: Days of Inventory on Hand
- **MAPE**: Mean Absolute Percentage Error (forecast accuracy)
- **Fill Rate**: PO quantity received / requested
- **Banner Factor**: Demand / Supply ratio for capacity

### Key Abbreviations
| Abbrev | Full Form |
|--------|-----------|
| POD | Point of Distribution (Dark Store) |
| PO | Purchase Order |
| DSD | Direct Store Delivery |
| GRN | Goods Receipt Note |
| RTV | Return to Vendor |
| FEFO | First Expiry First Out |
| ARB | Aisle-Rack-Bin (location system) |
| DE | Delivery Executive |
| PSLA | Promised Service Level Agreement |
| LPN | License Plate Number (shipment tracking) |

---

## For Swiggy Brain Development

### Availability Issue Tree (MVP Focus)

The research validates the 7-branch deterministic RCA tree:

1. **Forecasting-led**: Demand underestimated
2. **PO-led**: POs not raised (MOQ/MOV constraints)
3. **Supply-led**: Brands not delivering to warehouse
4. **Warehouse ops-led**: Appointment/capacity/throughput issues
5. **Dark store-led**: Space/processing limits
6. **Tagging/config-led**: Incorrect tiering, mis-tagged SKUs
7. **Other causes**: Identified during pilot

### Data Sources for Each Branch

| Branch | Key Data Sources |
|--------|-----------------|
| Forecasting | `data_science.ds_storefront.im_pod_hr_demand_forecasting` |
| PO | `scm-procurement-po`, `scm-procurement-po-details`, `analytics_prod.im_vendor_portal_po_module`. For warehouse POs: MIM Dashboard uploads, scm-operations-batch-job logs, Vinculum WMS |
| Supply | Fill rate tables, supplier performance |
| Warehouse | Vinculum data, GRN timestamps |
| Dark Store | ILS inventory data, POD capacity configs |
| Config | Control room rules, tiering configs |

### Key Stakeholders to Alert

| Issue Type | Owner |
|------------|-------|
| Forecasting issues | Demand Planner |
| PO/Procurement | Procurement Manager |
| Supplier fill rate | Category Manager |
| Warehouse ops | Warehouse Manager |
| POD operations | Store Manager |
| Config issues | Product Support |

---

## Research Methodology

This research was compiled through:

1. **Initial Context**: Swiggy Brain PRFAQ and high-level SCM overview
2. **Breadth-First Search**: Glean chat for landscape understanding
3. **Deep-Dive Agents**: 7 parallel sub-agents researching specific domains
4. **Source Documents**: 100+ internal documents from Confluence, JIRA, GitHub, Google Docs, Slack

### Source Coverage

- Confluence: SCM, DASH, SII, SPAP, SP spaces
- GitHub: api-registry, inventory-location-service, schedule-databricks-jobs
- JIRA: CMRs, IMSCM tickets
- Google Docs: Strategy docs, LLDs, PRDs

---

## Limitations

1. **Point-in-Time**: Research as of December 2025
2. **Vinculum Details**: Some WMS internals not fully documented
3. **Real-Time Metrics**: Actual current values not captured (dashboards needed)
4. **Cost Data**: Financial metrics not included for confidentiality

---

## Contributing

To update this research:
1. Add new findings to relevant deep-dive document
2. Update `00-scm-comprehensive-overview.md` synthesis
3. Add new source URLs to document references

---

*Research compiled December 2025 for Swiggy Brain initiative*
