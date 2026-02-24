# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope

This folder contains **Supply Chain Management research** supporting Supply Chain Brain v0.1 MVP. See root `CLAUDE.md` for overall Swiggy Brain context.

## Research Documentation

### Reading Order

**Quick Start (30 min)**: `docs/scm-research/00-scm-comprehensive-overview.md` sections 1-3, 9-10

**Deep Dive by Domain**:

| Domain | Document |
|--------|----------|
| Warehouse ops, Vinculum WMS | `01-mother-warehouses-wms.md` |
| Dark store operations, POD tiers | `02-dark-stores-pod-operations.md` |
| Demand forecasting, TFT model | `03-demand-forecasting-ds-models.md` |
| Purchase orders, procurement | `04-purchase-orders-procurement.md` |
| Inventory systems (MIM/ILS/IAS) | `05-inventory-availability-systems.md` |
| Metrics, dashboards, KPIs | `06-scm-metrics-kpis-dashboards.md` |
| Serviceability, network config | `07-network-serviceability.md` |
| Quality, freshness, FEFO | `08-quality-freshness-management.md` |
| Returns, reverse logistics | `09-returns-refunds-reverse-logistics.md` |
| Supplier performance, fill rates | `10-supplier-performance-fill-rate.md` |

## Physical Supply Chain Flow

```
Brand Companies → Suppliers → Mother Warehouses → Dark Stores (PODs) → Customers
                                    ↑                    ↑
                              Movement PO            DSD PO
```

## Key Systems

| System | Purpose |
|--------|---------|
| **MIM** | Master Inventory Management (in-house ERP) |
| **ILS** | Inventory Location Service (batch/location tracking) |
| **IAS** | Inventory Availability Service (catalog availability) |
| **Vinculum** | Third-party WMS for warehouses |
| **Control Room** | Rule-based availability (OOS overrides, holiday slots) |
| **TFT** | Temporal Fusion Transformer (~18.6% MAPE forecast model) |

## Data Sources for RCA Branches

| Issue Branch | Primary Data Source |
|-------------|---------------------|
| Forecasting | `data_science.ds_storefront.im_pod_hr_demand_forecasting` |
| PO/Procurement | `scm-procurement-po`, `analytics_prod.im_vendor_portal_po_module` |
| Supply/Fill Rate | Supplier performance tables, fill rate metrics |
| Warehouse | Vinculum data, GRN timestamps |
| Dark Store | ILS inventory data, POD capacity configs |
| Config/Tagging | Control room rules, tiering configs |

## Stakeholder Mapping

| Issue Type | Owner |
|------------|-------|
| Forecasting | Demand Planner |
| PO/Procurement | Procurement Manager |
| Supplier fill rate | Category Manager |
| Warehouse ops | Warehouse Manager |
| POD operations | Store Manager |
| Config issues | Product Support |

## Dark Store Tiers

| Tier | SKU Capacity | Coverage |
|------|--------------|----------|
| S/M/L | 2,000-3,000 | 4 km |
| XL/XXL | Higher | 4 km |
| 4XL-6XL (Mega) | 50K+ | 6-6.5 km |
