# Swiggy Instamart Supply Chain Management: Comprehensive Overview

## Executive Summary

This document synthesizes comprehensive research on Swiggy Instamart's Supply Chain Management (SCM) system, covering the complete picture from brands to customers. The research is based on 100+ internal documents from Confluence, JIRA, GitHub, Google Docs, and Slack channels accessed via Glean.

**Key Findings:**
- **Three-tier physical infrastructure**: Brand Companies → Mother Warehouses → Dark Stores (PODs) → Customers
- **Sophisticated DS models**: TFT-based demand forecasting achieving ~18.6% MAPE at pod-hour level (launched April 2024)
- **Complex inventory management**: MIM, ILS, IAS, Control Room systems managing real-time availability across 160+ PODs
- **Multiple PO flows**: DSD (direct delivery) and Movement Planning (warehouse to POD) with Vendor Portal and Booking Portal
- **Evolving serviceability**: Distance-based → Polygon-based (Isolines) for deterministic coverage
- **Recent enhancements (2024-2025)**: LPN-based unloading, Stock Replenishment tasks, Gatepass system, expanded inventory buckets

---

## Table of Contents

1. [Supply Chain Architecture](#1-supply-chain-architecture)
2. [Physical Infrastructure](#2-physical-infrastructure)
3. [Key Systems and Platforms](#3-key-systems-and-platforms)
4. [Demand Forecasting and DS Models](#4-demand-forecasting-and-ds-models)
5. [Inventory Management](#5-inventory-management)
6. [Purchase Order Flows](#6-purchase-order-flows)
7. [Network and Serviceability](#7-network-and-serviceability)
8. [Metrics and KPIs](#8-metrics-and-kpis)
9. [Key Challenges](#9-key-challenges)
10. [Swiggy Brain Initiative](#10-swiggy-brain-initiative)
11. [Document Index](#11-document-index)

---

## 1. Supply Chain Architecture

### End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       BRAND COMPANIES                                 │
│              (Nestle, Amul, ITC, P&G, etc.)                          │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPPLIERS                                     │
│        Primary (direct from brand) │ Secondary (distributors)        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                      ▼
┌────────────────────────┐          ┌─────────────────────────────────┐
│   MOTHER WAREHOUSES    │          │    DSD (Direct Store Delivery)   │
│   (1-2 per city)       │          │    For perishables/FMCG          │
│   - Vinculum WMS       │          │    Dairy, bread, soft drinks     │
│   - Inbound/Outbound   │          └───────────────┬─────────────────┘
└──────────┬─────────────┘                          │
           │ Movement Planning PO                   │ DSD PO
           ▼                                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DARK STORES (PODs)                              │
│   Tiers: S, M, L, XL, XXL, 4XL, 5XL, 6XL (Mega)                     │
│   - 160+ pods across cities                                          │
│   - MIM (Master Inventory Management)                                │
│   - Rack Management (Aisle-Rack-Bin)                                 │
│   - Picker/Loader Apps                                               │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Last Mile (10-minute delivery)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          CUSTOMERS                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Stakeholders and Roles

| Role | Responsibility |
|------|----------------|
| **Category Manager** | Selection, pricing, brand negotiations |
| **Demand Planner** | Forecasting, movement planning |
| **Procurement Manager** | PO creation, supplier management |
| **Warehouse Manager** | WH operations, inwarding, putaway |
| **Store Manager (POD)** | POD operations, GRN approval, inventory |
| **Picker** | Order picking, location scanning |
| **Loader** | Manifest handling, vehicle coordination |
| **DE (Delivery Executive)** | Last-mile delivery |

---

## 2. Physical Infrastructure

### 2.1 Mother Warehouses

**Characteristics:**
- 1-2 warehouses per major city
- Centralized inventory storage and distribution
- Managed by Vinculum WMS (third-party, primary system)

**Storage Zones:**
- Ambient, Chiller (2-8°C), Freezer (-18°C), Pharma, Fresh

**Key Operations:**
- Inbound: Receiving, QC (AQR), GRN, Putaway
- Outbound: Movement Planning, Picking, LPN creation, Dispatch

### 2.2 Dark Stores (PODs)

**Tier Structure:**

| Tier | Size | SKU Capacity | Coverage |
|------|------|--------------|----------|
| S/M/L | Small-Large | 2,000-3,000 | 4 km |
| XL/XXL | Extra Large | Higher | 4 km |
| 4XL-6XL (Mega) | Mega | 50K+ | 6-6.5 km |

**Physical Layout:**
- Aisle-Rack-Bin (ARB) system
- Zone types: AC, Chiller, Freezer, Fresh, FMCG Food/Non-Food, etc.
- QR code-based location tracking

**Key Operations:**
- Inwarding: LPN scanning, QC, GRN approval, Putaway
- Order Fulfillment: Picking (FEFO), Packing, DE handover
- Inventory Management: Cycle counts, RTV, Liquidation

---

## 3. Key Systems and Platforms

### 3.1 Inventory Management Stack

| System | Purpose |
|--------|---------|
| **MIM** | Master Inventory Management - central ERP |
| **ILS** | Inventory Location Service - batch/location tracking |
| **IAS** | Inventory Availability Service - catalog availability |
| **Control Room** | Rule-based availability determination (in_stock, OOS overrides, holiday slots) |
| **Vinculum** | Third-party WMS for warehouses (primary for IM) |

> **Note:** Jarvis WMS is being developed for **Lynk** (Swiggy's B2B platform), NOT for Instamart operations. Vinculum remains the primary WMS for all Instamart warehouse operations.

### 3.2 Supporting Systems

| System | Purpose |
|--------|---------|
| **scm-task-manager** | Task orchestration |
| **scm-procurement** | PO management |
| **scm-invoicing** | Invoice processing |
| **scm-inbound-operations** | Gatepass and dock management |
| **dash-rack-management** | Location/rack management |
| **dash-serviceability** | Serviceability evaluation |
| **delivery-auto-assign** | DE assignment |
| **Vendor Portal** | Supplier self-service (PO status, inventory visibility, performance) |
| **Booking Portal** | Slot reservation for DSD deliveries, capacity management |

### 3.3 Data Infrastructure

| Component | Technology |
|-----------|------------|
| **Data Warehouse** | Snowflake, Databricks |
| **Operational DB** | DynamoDB |
| **Messaging** | Kafka, SQS FIFO |
| **Storage** | S3 |
| **Search** | Elasticsearch |
| **Geospatial** | Tile38 |
| **Dashboards** | Retool, Grafana |
| **ML Training** | Databricks, Azure ML |

---

## 4. Demand Forecasting and DS Models

### 4.1 TFT (Temporal Fusion Transformer) Model

**Purpose:** Pod-hour level demand forecasting

**Performance:**
- Current MAPE: ~18.6% (improved from 20.2%)
- Granularity: Pod x Hour x Date
- Horizon: 1-14 days ahead

**Key Features:**
- Quantile regression for uncertainty
- Variable selection networks
- Attention mechanisms
- Missing data handling

### 4.2 Movement Planning Forecasting

**Purpose:** Warehouse to POD inventory transfer planning

**Improvements (Nov 2025):**
- 50% runtime reduction
- Rs 10 lakhs/month cost savings
- FnV Dual Dispatch: +6pp availability, -2.5pp wastage

### 4.3 PSLA Prediction

**Purpose:** Delivery time component prediction

**Components Predicted:**
- O2A, FM, O2MPR, Service Time, LM, R2D, O2D, O2R

**Platform:** DSP runtime with RILL real-time features

### 4.4 Other DS Models

| Model | Purpose | Status |
|-------|---------|--------|
| **Movement Planning** | WH → POD stock transfer | Production |
| **Search LTR** | Storefront ranking | Scaled |
| **EP LTR** | Personalization | Early-Scaled |

---

## 5. Inventory Management

### 5.1 Inventory States

| State | Description |
|-------|-------------|
| **Sellable** | Available for customer orders |
| **Picking Reserved** | Reserved for active orders |
| **Putaway Reserved** | Awaiting putaway |
| **DamageReserved** | Reserved for damage marking operations (2024) |
| **PilferageReserved** | Reserved for pilferage marking operations (2024) |
| **ExpiryUpdateReserved** | Reserved for expiry update operations (2024) |
| **Unsellable** | Quality issues |
| **Damaged** | Physically damaged |
| **Expired** | Past expiry date |
| **Disposed** | Physically disposed items - terminal state (2025) |
| **RTV Reserved/Shipped** | Return to vendor |
| **Liquidation Reserved/Shipped** | Sent for liquidation |
| **Pilferage** | Missing inventory |

**Note**: `Unsellable_reserved` = sum of DamageReserved + PilferageReserved + ExpiryUpdateReserved + RTV_reserved + Liquidation_reserved

### 5.2 Key Operations

**Batch Management:**
- Unique batch: SKU + Expiry + Location + MRP + Seller
- FEFO (First Expiry First Out) for picking
- Automatic unsellable date triggers

**Reconciliation:**
- Location batch reconciliation
- Location reconciliation (all batches)
- Cycle count process

**Shrinkage Management:**
- Pilferage tracking
- Damage dispositions
- Expiry wastage

### 5.3 Availability Computation

```
available_qty = sellable - picking_reserved - putaway_reserved
in_stock = (available_qty > 0) AND (control_room_rules allow)
```

---

## 6. Purchase Order Flows

### 6.1 PO Types

| Type | Source | Destination | Use Case |
|------|--------|-------------|----------|
| **DSD PO** | External Supplier | POD | Perishables, FMCG |
| **Movement Planning PO** | Warehouse | POD | Centralized replenishment |
| **OTB PO** | Supplier | Warehouse | Planned inventory |
| **ADHOC PO** | Supplier | Warehouse | Unplanned purchases |

### 6.2 DSD PO Flow

```
File Upload → Job Submission → PO Creation → File Generation (PDF/XML)
→ Supplier Email (every 30 min) → Delivery → GRN → Inwarding
```

### 6.3 Movement Planning PO Flow

```
Analytics Trigger → File Upload → PO Creation → Vinculum Sync
→ Warehouse Picking → LPN Dispatch → POD Inwarding
```

### 6.4 Fill Rate Metrics

| Metric | Description |
|--------|-------------|
| **Unit Fill Rate** | Qty received / Qty requested |
| **Line Fill Rate** | % of lines with 100% fill |
| **OTIF** | On-Time In Full (100% fill + within lead time) |

---

## 7. Network and Serviceability

### 7.1 Serviceability Models

**Legacy (Distance-Based):**
- Google 4-Wheeler distances at L8 geohash
- OSM fallback
- 97% cache hit rate

**New (Polygon-Based):**
- Isoline polygons for deterministic coverage
- Blackzone support for exclusions
- Point-in-polygon checks via Tile38

### 7.2 Coverage Parameters

| Pod Type | Radius |
|----------|--------|
| Regular | 4 km |
| Mega | 6-6.5 km |

### 7.3 Banner Factor (Capacity)

```
Banner Factor = Active Demand / Active Supply
```

**Levels:**
- Zone-level, Service-line, Cohort-level, Pod-level

**Selective Dipping:**
- Stage 1: Only DDEs
- Stage 2: Buffer SDEs when BF > 1.0
- Stage 3: Full shared fleet on severe stress

### 7.4 H3 Geospatial

- Hexagonal indexing for customer-pod mapping
- L8 resolution (~0.17 km²) for primary caching
- Used for demand forecasting and network planning

---

## 8. Metrics and KPIs

### 8.1 Availability Metrics

| Metric | Description |
|--------|-------------|
| **OOS Rate** | Out-of-stock percentage |
| **Search OOS** | Items searched but unavailable |
| **Chronic OOS** | Persistent stockouts |
| **WH Availability** | Warehouse stock vs demand |
| **POD Availability** | Session-based availability |

### 8.2 Inventory Health

| Metric | Description |
|--------|-------------|
| **DOH/DOI** | Days of Inventory |
| **Wastage CPO** | Wastage value per order |
| **Shrinkage** | Unexplained loss |
| **Fill Rate** | PO fill percentage |

### 8.3 Speed Metrics

| Metric | Description |
|--------|-------------|
| **O2A** | Order to Accept |
| **O2MFR** | Order to Market Fulfillment Ready |
| **MFR2P** | MFR to Pickup |
| **O2P** | Order to Pickup |

### 8.4 Critical Thresholds

| Metric | Threshold |
|--------|-----------|
| **Critically Low DOH** | <= 1 day |
| **Low DOH** | <= 5 days |
| **Fill Rate Minimum** | 90% for Top 80 articles |
| **MAPE Target** | <16% for pod-hour |

---

## 9. Key Challenges

### 9.1 System Challenges

| Challenge | Impact |
|-----------|--------|
| **Vinculum Latency** | 30+ min timeouts |
| **Data Sync Issues** | PO state inconsistencies |
| **Duplicate POs** | During retries |
| **ES Dependency** | P0 flows blocked on failure |

### 9.2 Operational Challenges

| Challenge | Impact |
|-----------|--------|
| **Hyperlocal Blind Spots** | City averages hide pocket issues |
| **Slow Manual RCA** | Days to resolve issues |
| **Reactive Operations** | Fire-fighting after breakage |
| **Alert Fatigue** | Too many dashboards |

### 9.3 Forecasting Challenges

| Challenge | Impact |
|-----------|--------|
| **New Pod Handling** | No historical data |
| **Next Week Accuracy** | Forecasts not usable |
| **External Events** | IPL, festivals not modeled |
| **SKU-level Sparsity** | Low ROI for ML |

### 9.4 Procurement Challenges

| Challenge | Impact |
|-----------|--------|
| **Fill Rate Variability** | 25-30% swings |
| **MOQ/MOV Constraints** | ~7-8% cases blocked |
| **DSD Invoice Time** | 20+ minutes per invoice |
| **Multi-system Data** | PO data across 24+ systems |

---

## 10. Swiggy Brain Initiative

### 10.1 Vision

**Swiggy Brain** is a proactive, agentic operations intelligence system that:
- Detects hyperlocal anomalies
- Diagnoses root causes using structured/unstructured data
- Surfaces ranked interventions to owners
- Learns from outcomes over time

### 10.2 MVP Focus: Supply Chain Brain v0.1

**Objective:** Improve availability of most important SKUs at dark-store level

**Target:** +10% in-session conversions without increasing wastage

**Issue Tree for Availability:**
1. **Forecasting-led**: Demand underestimated → Owner: Demand Planner
2. **PO-led**: POs not raised (MOQ/MOV) → Owner: Procurement Manager
3. **Supply-led**: Brands not delivering → Owner: Category Manager
4. **Warehouse ops-led**: Appointment/capacity issues → Owner: Warehouse Manager
5. **Dark store-led**: Space/processing limits → Owner: Store Manager
6. **Tagging/config-led**: Incorrect tiering, Control Room misconfig → Owner: Product Support
7. **Other causes**: Quality, system failures → Owner: On-call team

**P0 Gaps for MVP (identified Dec 2025):**
- Control Room system documentation (Branch 6 diagnosis)
- Chronic OOS detection methodology
- Search OOS tracking instrumentation
- Stakeholder routing matrix with SLAs
- Historical RCA repository for hypothesis generation

**Chronic OOS Definition:**
Chronic OOS refers to SKUs with **persistent unavailability** despite consistent customer demand. Key characteristics:
- High search demand but poor availability over extended periods (not single incidents)
- Typically indicates systemic issues (supplier constraints, incorrect tiering, configuration errors)
- Data source: `data_science.ds_storefront.*` tables for search-to-availability analysis
- Detection: SKUs with availability <50% over rolling 7+ day windows despite top-quartile search volume

**Stakeholder Routing Matrix:**

| Branch | Primary Owner | Secondary Owner | Escalation Path |
|--------|---------------|-----------------|-----------------|
| 1. Forecasting-led | Demand Planner | DS Team | Head of Planning |
| 2. PO-led | Procurement Manager | Category Manager | Head of Procurement |
| 3. Supply-led | Category Manager | Brand Team | Head of Category |
| 4. Warehouse ops-led | Warehouse Manager | Ops Lead | Head of Ops |
| 5. Dark store-led | Store Manager | Area Manager | Head of Store Ops |
| 6. Tagging/config-led | Product Support | SCM Product | Head of Product |
| 7. Other causes | On-call Team | SRE | Head of Tech |

### 10.3 Multi-Agent Architecture

- **Statistical Monitoring Agent**: Anomaly detection
- **Hypothesis & RCA Agent**: Issue tree analysis
- **Knowledge Agent**: Data retrieval and impact estimation
- **Intervention Agent**: Summarize and trigger actions
- **Evaluation Agent**: Continuous improvement

### 10.4 Success Metrics (MVP)

**Leading (Month 1-2):**
- >= 80% precision in identifying true breakage drivers
- >= 60% adoption among stakeholders
- >= 50% of interventions acted upon

**Lagging (Month 3):**
- +10% in-session conversions
- >= 20% reduction in chronic OOS
- No increase in wastage or DOI

---

## 11. Document Index

### Deep-Dive Research Documents

| # | Document | Description |
|---|----------|-------------|
| 01 | [Mother Warehouses & WMS](./01-mother-warehouses-wms.md) | WH infrastructure, Vinculum/Jarvis, Gatepass, Booking Portal |
| 02 | [Dark Stores POD Operations](./02-dark-stores-pod-operations.md) | POD tiers, rack management, picking, LPN unloading, Stock Replenishment |
| 03 | [Demand Forecasting & DS Models](./03-demand-forecasting-ds-models.md) | TFT model (April 2024), movement planning, PSLA, TimeGEN-1 |
| 04 | [Purchase Orders & Procurement](./04-purchase-orders-procurement.md) | DSD PO, Movement Planning PO, Vendor Portal, Booking Portal |
| 05 | [Inventory & Availability Systems](./05-inventory-availability-systems.md) | MIM, ILS, IAS, 10 inventory buckets, FnV handling |
| 06 | [SCM Metrics, KPIs & Dashboards](./06-scm-metrics-kpis-dashboards.md) | All metrics, Retool, Grafana, TriageAssist, real-time OOS |
| 07 | [Network & Serviceability](./07-network-serviceability.md) | Polygon serviceability, banner factor, H3, Society stores |
| 08 | [Quality & Freshness Management](./08-quality-freshness-management.md) | FnV expiry, FEFO enforcement, POD QC, wastage |
| 09 | [Returns, Refunds & Reverse Logistics](./09-returns-refunds-reverse-logistics.md) | Return orders, refunds, PR management, re-inventorization |
| 10 | [Supplier Performance & Fill Rate](./10-supplier-performance-fill-rate.md) | OTIF, UFR, LFR, lead time, Vendor Portal |

### Key Internal References

**Confluence:**
- [SCM Procurement Terminology](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4639916695)
- [DSD and Movement Planning PO](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4626547115)
- [IM Consistent Serviceability - Isolines](https://swiggy.atlassian.net/wiki/spaces/SP/pages/4862869629)
- [Enabling POD on MIM Stack](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3632857456)

**Google Docs:**
- [AI-Native Intelligence for Swiggy Instamart](https://docs.google.com/document/d/1110blKM9CCGPdhWN7XbGRkdhiq1-8HcZrsPJpfpmtM8)
- [Swiggy Brain PRFAQ](https://docs.google.com/document/d/1de_Es5JyVlh2AJ6_ZSfXt_EuReaJYSo52dyPmaYJOzo)

**GitHub:**
- [inventory-location-service](https://github.com/swiggy-private/inventory-location-service)
- [api-registry](https://github.com/swiggy-private/api-registry)
- [schedule-databricks-jobs](https://github.com/swiggy-private/schedule-databricks-jobs)

---

## Summary

Swiggy Instamart's SCM is a sophisticated, multi-layered system enabling 10-minute grocery delivery at scale. Key characteristics:

**Strengths:**
- Production-grade TFT forecasting (18.6% MAPE, launched April 2024) with continuous improvement
- Real-time inventory tracking across 160+ PODs with 10 inventory bucket states
- Sophisticated multi-tier pod network with mega pod extension (6.5km coverage)
- LPN-based traceability and Stock Replenishment reducing inventory mismatches
- Strong observability with Grafana, Retool, TriageAssist dashboards
- Vendor Portal and Booking Portal for supplier self-service

**Key Gaps:**
- Vinculum dependency and reliability issues (2+ hour CDC lag)
- Reactive operations vs proactive anomaly detection
- Next-week forecasting accuracy (not usable, >1pp MAPE degradation)
- Alert fatigue from scattered dashboards
- Manual RCA processes taking days
- Control Room documentation incomplete for config-led diagnosis

**Strategic Direction:**
- Swiggy Brain initiative for AI-driven operations intelligence
- Polygon-based serviceability (Isolines) for deterministic coverage
- TimeGEN-1 exploration for improved forecasting (onboarded Nov 2024)
- Autonomous ordering loops for stable categories
- Availability Issue Tree Playbook for systematic RCA

**2024-2025 Enhancements:**
- Gatepass system for digital inbound tracking
- LPN-based unloading (₹1.2 lakh+ daily savings)
- Stock Replenishment tasks for FEFO adherence
- FnV Dual Dispatch (+6pp availability, -2.5pp wastage)
- New inventory buckets (Disposed, DamageReserved, PilferageReserved)
- Society stores serviceability handling

---

*Research compiled from 100+ internal documents via Glean | December 2025*
*Updated with verification research findings | December 2025*
*For Swiggy Brain Supply Chain Brain MVP development*
