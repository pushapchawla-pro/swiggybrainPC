# Swiggy Instamart Mother Warehouses and WMS Operations: Deep-Dive Research

## Executive Summary

Mother Warehouses are central hubs in Swiggy Instamart's supply chain that receive goods from suppliers and distribute to dark stores (PODs). This document covers warehouse infrastructure, WMS systems (Vinculum/Jarvis), inbound/outbound operations, and key challenges.

---

## 1. Physical Infrastructure of Mother Warehouses

### 1.1 Warehouse Hierarchy

```
Brand Companies (Nestle, Amul, ITC, etc.)
          │
          ▼
      Suppliers
    ├── Primary (direct from brand)
    └── Secondary (distributors)
          │
          ├────────────────┐
          ▼                ▼
    Mother Warehouses    DSD (Direct Store Delivery)
    (1-2 per city)       (bypasses warehouse)
          │
          ▼
    Dark Stores (PODs)
          │
          ▼
      Customers
```

### 1.2 Warehouse Characteristics

- **Typical Count**: 1-2 warehouses per major city
- **Purpose**: Centralized inventory storage and distribution
- **Operations**: Inbound (receiving), Storage (putaway), Outbound (picking/dispatch)
- **Management**: Vinculum WMS (third-party, primary system)

### 1.3 Storage Zones

| Zone Type | Description |
|-----------|-------------|
| **Ambient** | Room temperature storage |
| **Chiller** | Refrigerated (2-8°C) |
| **Freezer** | Frozen goods (-18°C) |
| **Pharma** | Pharmaceutical items |
| **Fresh** | Fresh produce |

---

## 2. WMS Systems

### 2.1 Vinculum WMS (Legacy)

**Overview:**
- Third-party Warehouse Management System
- Primary ERP for warehouse operations
- Handles inbound/outbound, PO operations, legal compliance

**Key Functions:**
- PO Management
- Inventory tracking
- GRN (Goods Receipt Note) processing
- Dispatch to PODs
- Invoice generation

**Integration Points:**
- MIM Dashboard callbacks
- PO sync between MIM and Vinculum
- Invoice callbacks for inwarding

**API Endpoints:**
- Invoice callback: `https://externalha-mimvin.in-west.swig.gy/inwarding/api/v1/invoiceDetails`

**Challenges:**
- High latency issues (30+ min timeouts observed)
- Data sync inconsistencies with MIM
- Duplicate PO creation during failures
- Critical dependency with no easy alternative

### 2.2 WMS Landscape Clarification

**Important Note:**
- **Jarvis WMS** is being developed for **Lynk (B2B platform)**, NOT for Instamart
- Instamart continues to use **Vinculum WMS** as the primary warehouse management system
- There is no active migration from Vinculum to Jarvis for Instamart operations

**Vinculum Remains Primary for IM:**
- All Instamart warehouse operations run on Vinculum
- In-house improvements focus on integration layer (MIM Dashboard, scm-inbound-operations)
- Key initiative: Gatepass system development to enhance Vinculum workflows

### 2.3 In-House WMS Development (New Initiative)

**Overview:**
Swiggy is developing an in-house WMS for Instamart, starting with the **Inbound module**. This is separate from Jarvis WMS (which is for Lynk B2B).

**Motivation:**
- Limited flexibility with Vinculum (vendor-led enhancements)
- Integration gaps with internal systems
- Need for end-to-end ownership over warehouse processes, data, and enhancements
- Faster rollouts, cost savings, and tighter ecosystem integration

**Scope (Inbound Module - Phase 1):**
- Source-based inbound entry point
- Manual creation of receiving entries
- Search by PO ID, Vehicle Number, Invoice number
- Completion of receiving processes
- Latencies under standard limits with atomic writes for consistency

**Status**: Work in progress (HLD phase)

**Reference**: [HLD - Warehouse Receiving Part 1](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5367398459)

---

## 3. Inbound Operations

### 3.1 Receiving Process

```
Supplier Arrives at Warehouse
          │
          ▼
    Dock Assignment
    (Vehicle scheduling)
          │
          ▼
    Document Verification
    (PO matching, invoice check)
          │
          ▼
    Unloading
    (Physical goods receipt)
          │
          ▼
    Quality Check (AQR)
    (Inspection, sampling)
          │
          ▼
    GRN Generation
    (System entry, inventory addition)
          │
          ▼
    Putaway
    (Storage location assignment)
```

### 3.2 Warehouse Appointment System

**Purpose:**
- Schedule supplier deliveries
- Manage dock capacity
- Reduce wait times

**Key Elements:**
- Appointment slots by dock
- Vehicle registration
- Expected arrival time
- PO linking

### 3.3 Quality Check (AQR Process)

**Inspection Types:**
| Type | Description |
|------|-------------|
| **Visual** | Physical appearance check |
| **Quantity** | Count verification |
| **Expiry** | Date validation |
| **Damage** | Physical condition |
| **Temperature** | For cold chain items |

**Acceptance Criteria:**
- MRP deviation threshold: 90%
- Minimum shelf life remaining
- No physical damage
- Correct batch information

### 3.4 GRN (Goods Receipt Note) Process

**Steps:**
1. PO matching with delivery
2. Quantity verification
3. Quality check completion
4. System entry in Vinculum
5. Inventory update in MIM
6. GRN number generation
7. Document archival

**Validations:**
- PO exists and is active
- Quantity within tolerance
- Item matches PO specification
- Expiry date acceptable

### 3.5 Gatepass System

**Purpose:**
Security and access control for warehouse entry, linking vehicle arrivals to valid POs before allowing physical entry.

**Gatepass Workflow:**
```
Vehicle Arrives at Gate
        │
        ▼
Security Guard Entry
(Vehicle number, driver details)
        │
        ▼
PO Validation
(Check for active POs linked to supplier)
        │
        ▼
Gatepass Generation
(Unique pass number, timestamp)
        │
        ▼
Dock Assignment
(Based on PO type, capacity)
        │
        ▼
Entry Authorization
        │
        ▼
GRN Processing (post unloading)
```

**Gatepass Data Captured:**
| Field | Description |
|-------|-------------|
| `gatepass_id` | Unique pass identifier |
| `fc_id` | Fulfillment center ID |
| `vehicle_number` | Vehicle registration |
| `driver_name` | Driver identification |
| `vendor_id` | Supplier vendor ID |
| `supplier_code` | Linked supplier |
| `po_numbers` | Associated POs |
| `invoice_number` | Invoice reference |
| `invoice_amount` | Invoice value |
| `invoice_date` | Invoice date |
| `entry_time` | Gate entry timestamp |
| `dock_assigned` | Allocated dock bay |
| `warehouse_location` | Specific warehouse |
| `courier` | Courier details |
| `status` | Gatepass status |
| `exit_time` | Gate exit timestamp |

**Reference**: [Warehouse Gatepass App Contracts](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4866146307)

**Key Benefits:**
- Prevents unauthorized warehouse access
- Links physical arrivals to system POs
- Enables dock scheduling optimization
- Provides audit trail for receiving

### 3.6 Warehouse Location and Zone Management

**Zone Types (14 Categories):**
| Zone Code | Description | Temperature |
|-----------|-------------|-------------|
| AMB | Ambient storage | Room temp |
| CHI | Chiller | 2-8°C |
| FRZ | Freezer | -18°C |
| PHR | Pharmaceutical | Controlled |
| FRS | Fresh produce | Variable |
| HVL | High-value locked | Room temp |
| QAR | Quarantine area | Variable |
| STG | Staging area | Variable |
| RTV | Return to vendor | Variable |
| DMG | Damage storage | Variable |
| LIQ | Liquidation | Variable |
| EXP | Expired items | Variable |
| RCK | Rack storage | Variable |
| BLK | Bulk storage | Variable |

**Location Hierarchy:**
```
Warehouse
    └── Zone (14 types)
           └── Aisle
                  └── Rack
                         └── Shelf
                                └── Bin
```

**Location Naming Convention:**
`<Zone>-<Aisle>-<Rack>-<Shelf>-<Bin>`
Example: `AMB-A01-R05-S03-B02`

### 3.7 Data Architecture and CDC Tables

**CDC (Change Data Capture) Flow:**
```
Vinculum WMS (Operational)
        │
        ▼ (CDC stream)
Snowflake Staging
        │
        ▼ (2+ hour lag)
Snowflake Production
        │
        ▼
Analytics/Dashboards
```

**Key CDC Tables:**
| Table | Source | Purpose |
|-------|--------|---------|
| `vinculum_grn_cdc` | Vinculum | GRN transactions |
| `vinculum_po_cdc` | Vinculum | PO status changes |
| `vinculum_inventory_cdc` | Vinculum | Inventory movements |
| `vinculum_dispatch_cdc` | Vinculum | Dispatch records |

**Data Lag Challenge:**
- **Current lag**: ~2+ hours from Vinculum to Snowflake (approximate - validate with data engineering team)
- **Impact**: Real-time dashboards show stale data
- **Workaround**: Direct Vinculum API calls for real-time needs
- **Initiative**: Exploring real-time streaming alternatives

---

## 4. Storage and Putaway

### 4.1 Putaway Process

```
Post-GRN Approval
       │
       ▼
Location Recommendation
(Based on zone, capacity, FEFO)
       │
       ▼
Physical Movement
(Worker moves goods)
       │
       ▼
Location Scan
(Confirm putaway location)
       │
       ▼
System Update
(Inventory at location)
```

### 4.2 Location Assignment Logic

**Factors:**
- Item category → Zone type
- Temperature requirements
- Available capacity
- FEFO (First Expiry First Out)
- Pick path optimization

### 4.3 Storage Organization

| Level | Description |
|-------|-------------|
| **Zone** | Temperature/category area |
| **Aisle** | Corridor identifier |
| **Rack** | Shelving unit |
| **Bin** | Specific location |

---

## 5. Outbound Operations

### 5.1 Movement Planning Trigger

Movement Planning POs are generated based on:
- Analytics-based demand forecasting
- Pod inventory levels
- Safety stock thresholds
- Capacity constraints

**Movement Planning Portal:**
A centralized interface where operations executives can:
- Upload required input files (demand planning run-rate, warehouse-POD mappings)
- View and manage PO creation status
- Monitor dispatch execution

**Reference**: [Movement Planning Portal](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4701618453)

### 5.2 Picking Process

```
Movement Planning PO Created
          │
          ▼
    Pick List Generation
    (Items, quantities, locations)
          │
          ▼
    Picker Assignment
          │
          ▼
    Physical Picking
    (FEFO-based, location scanning)
          │
          ▼
    Quantity Verification
          │
          ▼
    Staging Area
```

### 5.3 Dispatch to PODs

```
Staged Inventory
       │
       ▼
LPN (License Plate Number) Creation
       │
       ▼
Vehicle Assignment
       │
       ▼
Loading
       │
       ▼
Dispatch Confirmation
       │
       ▼
In-Transit to POD
```

### 5.4 LPN-Based Dispatch

**LPN Benefits:**
- Traceability from WH to POD
- Reduced inventory mismatch
- Smart reconciliation at POD
- Real-time visibility

**LPN Master Service:**
- Manages lifecycle of License Plate Numbers (containers/crates)
- Tracks inventory information and item details per LPN
- Enables container reuse across inbound/outbound operations
- Integrates with Movement Planning and dispatch systems

---

## 6. Warehouse Capacity and Planning

### 6.1 Capacity Dimensions

| Dimension | Description |
|-----------|-------------|
| **Storage** | Volumetric capacity by zone |
| **Inbound** | Daily receiving capacity |
| **Outbound** | Daily dispatch capacity |
| **Manpower** | Worker availability |
| **Dock** | Loading/unloading bays |

### 6.2 Capacity Planning

**Inputs:**
- Demand forecasts
- Current inventory levels
- Supplier delivery schedules
- POD requirements

**Constraints:**
- Physical space
- Cold storage limits
- Manpower availability
- Dock capacity

---

## 7. Key Challenges and Pain Points

### 7.1 System Challenges

| Challenge | Impact |
|-----------|--------|
| **Vinculum Latency** | 30+ min timeouts, blocking operations |
| **Data Sync Issues** | PO state inconsistencies between MIM and Vinculum |
| **Duplicate POs** | Created during retries |
| **API Reliability** | Vinculum API degradation incidents |

### 7.2 Operational Challenges

| Challenge | Impact |
|-----------|--------|
| **Appointment Adherence** | Suppliers missing slots |
| **Inwarding Capacity** | Throughput constraints |
| **Quality Issues** | AQR rejections |
| **Cold Chain** | Temperature maintenance |

### 7.3 Integration Challenges

| Challenge | Impact |
|-----------|--------|
| **Vinculum Lock-in** | Critical dependency |
| **CDC Data Lag** | Affects real-time operations |
| **Multi-system** | PO data across 24+ systems |

---

## 8. Metrics Tracked at Warehouse Level

### 8.1 Inbound Metrics

| Metric | Description |
|--------|-------------|
| **GRN TAT** | Time from arrival to GRN |
| **AQR Pass Rate** | Quality check pass percentage |
| **Dock Utilization** | % of dock capacity used |
| **Putaway Time** | Time from GRN to putaway |

### 8.2 Outbound Metrics

| Metric | Description |
|--------|-------------|
| **Pick Accuracy** | Correct items picked |
| **Dispatch TAT** | Time from PO to dispatch |
| **LPN Accuracy** | Correct LPN contents |
| **Movement Fill Rate** | % of PO quantity dispatched |

### 8.3 Inventory Metrics

| Metric | Description |
|--------|-------------|
| **DOI** | Days of Inventory |
| **Inventory Accuracy** | System vs physical count |
| **Shrinkage** | Unexplained loss |
| **Wastage** | Expired/damaged inventory |

---

## 9. Technical Infrastructure

### 9.1 Systems Stack

| Component | Technology |
|-----------|------------|
| **WMS** | Vinculum (third-party, primary for IM) |
| **Database** | DynamoDB (operational) |
| **Data Warehouse** | Snowflake |
| **Messaging** | Kafka |
| **File Storage** | S3 |
| **scm-inbound-operations** | Manages inbound operations lifecycle and metadata at PODs/warehouses |
| **scm-inbound-gateway** | API gateway for inbound LPN operations |

### 9.2 Integration Architecture

```
Suppliers
    │
    ▼
Vinculum WMS ←→ MIM Dashboard
    │               │
    ├──────────────┼────────────────┐
    ▼               ▼                ▼
DynamoDB      Snowflake (CDC)    Kafka Events
```

---

## 10. Key Document References

### Warehouse Operations
1. [WIP - HLD - Warehouse Receiving Part 1](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5367398459)
2. [Warehouse Receiving](https://swiggy.atlassian.net/wiki/spaces/SII/folder/5367562325)

### WMS Integration
3. [Vinculum API Integration](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4611408146) - RCA on degradation
4. [Picker API Gateway - Backend of IM SCM UI](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4761354380)

### Procurement and PO
5. [SCM Procurement Terminology](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4639916695)
6. [DSD and Movement Planning Purchase Order](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4626547115)

### Recent RCAs
7. [2025-04-28 - RCA - Vinculum APIs high latencies and degradation](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4611408146)
8. [2025-12-11 - RCA - Delayed Invoice Callbacks from Vinculum](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5405999105)
9. [2025-07-24 - RCA - Incorrect MRP Inwarding](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4798644247)

### Additional References
10. [Movement Planning Portal](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4701618453)
11. [Warehouse Gatepass App Contracts](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4866146307)
12. [Warehouse Gatepass App Solutioning Doc](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4934369281)
13. [WH Gatepass Fast Followers](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5338398861)
14. [Space & Rack Type Attributes for Store Layout](https://swiggy.atlassian.net/wiki/spaces/IMSCMFF/pages/5029560475)
15. [Vinculum Sync Overview](https://swiggy.atlassian.net/wiki/spaces/NICatalog/pages/4672390879)
16. [DSD PO AutoEmailer Analysis and Debugging](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4650762389)
17. [PO systems <> Inbound systems interactions](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/5340070111)

### Code References
18. [inbound_lpn.proto (mim-dashboard)](https://github.com/swiggy-private/mim-dashboard/blob/master/server/proto/scm_inbound_gateway/inbound/v1/inbound_lpn.proto)

---

## Summary

Mother Warehouses are critical nodes in Swiggy Instamart's supply chain, handling centralized inventory management and distribution to PODs. The system relies on Vinculum WMS (third-party) as the primary warehouse management system. Note: Jarvis WMS is being developed for Lynk (B2B), not Instamart.

**Key Initiative**: Swiggy is developing an in-house WMS for Instamart (starting with Inbound module) to gain end-to-end ownership and reduce Vinculum dependency.

Key challenges include Vinculum reliability (latency, data sync issues), and capacity constraints. The LPN-based dispatch system has significantly improved traceability and reduced inventory mismatches. The Movement Planning Portal enables centralized management of warehouse-to-POD transfers.

---

*Document compiled from Glean research across internal sources | December 2025*
*Last verified: December 2025*
