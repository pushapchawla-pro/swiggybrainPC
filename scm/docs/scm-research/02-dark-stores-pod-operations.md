# Swiggy Instamart Dark Store (POD) Operations: Deep-Dive Research

## Executive Summary

Dark Stores (PODs - Points of Distribution) are Swiggy Instamart's fulfillment centers that enable 10-minute grocery delivery. This document provides comprehensive internal documentation on POD infrastructure, inventory management systems, operational workflows, and key challenges.

---

## 1. POD Tier Structure and Characteristics

### 1.1 POD Tier Classification

| Tier | Size | SKU Capacity | Coverage |
|------|------|--------------|----------|
| **S (Small)** | Smallest | Limited | Hyperlocal |
| **M (Medium)** | Medium | Moderate | Local area |
| **L (Large)** | Large | Standard | District level |
| **XL (Extra Large)** | Extra-large | High | City zones |
| **XXL** | Very large | Very high | Multiple zones |
| **4XL, 5XL, 6XL** | Mega | 50K+ items | Extended 6-7 km radius |

### 1.2 Tier-Based Operational Differences

**Assortment Strategy:**
- Tier differentiation enables hyperlocal assortment optimization
- Top 15K items targeted for availability within 10-minute delivery promise
- Mega PODs have extended last-mile radius (6-6.5 km) vs regular (4 km)
- Smaller PODs focus on top performers and high-velocity items

**Capacity Allocation:**
- Volume allocation split between "Strategy-led" and "Performance-led" items
- Different rack types (Chiller, Freezer, Ambient) with varying capacity limits
- Pod-level volume tracking by rack type for assortment planning

### 1.3 SKU Tiering Configuration

**Tiering Methodology:**
SKU assortment at each POD is determined by a **City × Tier** matrix configuration:

| Dimension | Source | Description |
|-----------|--------|-------------|
| **City** | Network config | City-level demand patterns |
| **POD Tier** | S/M/L/XL/XXL/Mega | Storage capacity and coverage radius |
| **SKU Tier** | Catalog service | Sales velocity, margin, strategic importance |

**Configuration Flow:**
```
Category Planning → Assortment Matrix (City × Tier) → catalog-ingestion-workflow → POD SKU List
```

**Key Data Sources:**
- `catalog-ingestion-workflow`: Processes assortment updates
- `dash-scm-supplier-master`: Supplier-SKU-POD mappings
- `contract-master`: SKU-level tiering attributes

**Tiering Factors:**
- **Sales velocity**: High-velocity items in all tiers; low-velocity only in Mega PODs
- **Category importance**: Staples available everywhere; niche items tiered selectively
- **Margin contribution**: High-margin strategic items prioritized
- **Supplier constraints**: MOQ/lead time affects tiering decisions

**Override Process:**
Manual tier changes require Category Manager approval and are processed via MIM Dashboard → Assortment module.

---

## 2. Physical Layout and Rack Management

### 2.1 Aisle-Rack-Bin (ARB) System

The fundamental organizational structure is the **Aisle-Rack-Bin** location system:

**Location Attributes:**
- **Floor Level**: Multi-floor support (Ground, Floor 1, etc.)
- **Aisle**: Alphabetic identifier (A, B, C...)
- **Rack**: Numeric identifier (1, 2, 3...)
- **Bin**: Alphabetic identifier (A, B, C, Z...)
- **Rank**: Priority ranking for picking optimization
- **QR Code**: Format: `{store_id} AISLE {aisle} RACK {rack} BIN {bin}`

**Example Location**: `A-14-V` represents Aisle A, Rack 14, Bin V

### 2.2 Zone Types

PODs use sophisticated **zone-based categorization**:

| Zone Type | Purpose |
|-----------|---------|
| `ZONE_TYPE_AC` | Air-conditioned storage |
| `ZONE_TYPE_BEST_SELLER` | High-velocity items |
| `ZONE_TYPE_CHILLER` | Refrigerated items |
| `ZONE_TYPE_FREEZER` | Frozen goods |
| `ZONE_TYPE_FRESH` | Fresh produce |
| `ZONE_TYPE_PHARMA` | Pharmaceutical items |
| `ZONE_TYPE_FMCG_FOOD` | FMCG food items |
| `ZONE_TYPE_FMCG_NON_FOOD` | FMCG non-food items |
| `ZONE_TYPE_COLD_DRINKS_JUICES` | Beverages |
| `ZONE_TYPE_PET_SUPPLIES` | Pet products |
| `ZONE_TYPE_GRAINS_PULSES` | Dry goods |
| `ZONE_TYPE_DAMAGE` | Blocked zone for damaged items |
| `ZONE_TYPE_DISPOSE` | Blocked zone for disposal items |
| `ZONE_TYPE_HAZARDOUS` | Hazardous materials storage |
| `ZONE_TYPE_HIGH_VALUE` | High-value items (electronics, etc.) |
| `ZONE_TYPE_FNV` | Fruits and Vegetables specific |

### 2.3 Rack Management System

**Key Components:**
- **Rack Types**: S4 (Standard 4-shelf), and other configurations
- **Space Types**: Regular, Walk-in Freezer, etc.
- **Item Capacity**: Maximum units per location
- **Primary FC Operation Type**: Picking or Putaway designation

**Validation Rules:**
- Items cannot be mapped to DAMAGE or DISPOSE zone locations
- Zone type must align with item category (e.g., frozen items in freezer zones)

---

## 3. Inwarding and Quality Control (QC) Processes

### 3.1 Inwarding Flow Architecture

**Primary Systems:**
- **scm-task-manager**: Creates and orchestrates inwarding tasks
- **scm-task-orchestrator**: Parses warehouse data and triggers task creation
- **scm-inventory-location (ILS)**: Manages inventory addition and settlement
- **Vinculum**: External warehouse management system integration

### 3.2 Inwarding Workflow

```
Step 1: LPN-Based Unloading
├── Warehouses send material in LPNs (License Plate Numbers)
├── Store Manager views expected LPNs via IM Retail app
├── Loaders scan LPNs on arrival
├── Smart reconciliation flags unscanned/missing LPNs
└── Impact: Reduced inventory mismatch significantly

Step 2: Quality Check (QC) Tasks
├── QC tasks created for incoming inventory
├── Loader performs quality inspection
└── System validates:
    ├── MRP deviation (threshold: 90%)
    ├── Expiry date validity
    ├── Batch ID presence
    └── Item condition

Step 3: Putaway Process
├── Express Putaway: Add new location during putaway
├── Guided Putaway: System suggests pre-assigned locations
└── Location Recommendation via ILS based on:
    ├── Item category and zone type
    ├── Available capacity
    ├── Rack accessibility
    └── FEFO considerations
```

### 3.3 GRN (Goods Receipt Note) Process

1. **Gatepass Creation**: Vehicle details, document capture
2. **Invoice QC Task**: Match shipment to PO
3. **Inventory QC**: Damage assessment, expiry check, batch info
4. **GRN Approval**: Store manager confirms receipt
5. **Parallel Putaway**: QC-green items processed immediately
6. **Rack Location Assignment**: ILS recommends bin locations

---

## 4. Picking Process and Picker App

### 4.1 Picker States

| State | Description |
|-------|-------------|
| **Idle** | Not logged in |
| **Free** | Logged in but not assigned to any job |
| **Busy** | Actively working on picking job |

### 4.2 Picking Job Lifecycle

```
Order Confirmation
        ↓
Picking Job Creation
├── Inventory reservation via ILS
├── Location details populated
└── Job assigned to available picker
        ↓
Picking Flow
├── Picker receives job assignment
├── Navigates to location using QR codes
├── Scans items and validates against job
├── Packs items for delivery
└── Marks job as MFR (Mark for Ready)
        ↓
Handover
├── Delivery Executive picks up order
└── Picker state → Free
```

### 4.3 Key Picking Features

- **Location-based Picking**: Items picked from specific ARB locations
- **Batch Picking**: Multiple items from same location
- **QR Code Scanning**: For location and item verification
- **Image Upload**: For quality verification
- **Serial Number Capture**: For high-value items (laptops, tablets)

### 4.4 Picker App Challenges (from POD visits)

- Order sync delay between master and picker app (10-15 seconds)
- Image upload glitches requiring restart
- Barcode scanning failures on some packaging
- Network connectivity issues affecting O2P time

---

## 5. MIM (Master Inventory Management) at POD Level

### 5.1 System Overview

**Core Responsibilities:**
- Tracks inventory from arrival to exit (customer order or wastage)
- Powers catalog availability for customer storefront
- Integrates with POD operations for task generation
- Manages inventory across multiple states and buckets

### 5.2 Inventory Buckets and States

| Bucket | Description |
|--------|-------------|
| **Sellable** | Available for customer orders |
| **Picking Reserved** | Reserved for active orders |
| **Putaway Reserved** | Incoming inventory awaiting putaway |
| **Unsellable** | Damaged/expired but not yet disposed |
| **RTV Reserved** | Reserved for Return to Vendor |
| **RTV Shipped** | Shipped back to vendor |
| **Liquidation Reserved** | Reserved for liquidation |
| **Liquidation Shipped** | Sent for liquidation |
| **Damaged** | Physically damaged items |
| **Disposed** | Items disposed |

### 5.3 Inventory Operations

**Stock Adjustments:**
- Add missing inventory (pilferage correction)
- Mark unsellable (damage, expiry)
- Reserve for RTV/Liquidation
- Ship RTV/Liquidation

**Attribute Updates:**
- Change expiry date
- Correct MRP of units
- Change location of units
- Move inventory across batches

---

## 6. ILS (Inventory Location Service)

### 6.1 Core RPCs

| RPC | Purpose |
|-----|---------|
| `ReserveInventory` | Reserve inventory for orders |
| `SettleInventory` | Complete inventory settlement post-order |
| `CreateInventory` | Add new inventory during inwarding |
| `UpdateItemPrice` | MRP updates and corrections |
| `MoveInventoryAcrossBatches` | Relocate inventory |
| `BatchCreateItemLocationMappings` | Create item-location mappings |
| `BatchDeleteItemLocationMappings` | Remove mappings |
| `ListItemLocationMappings` | Query mappings |
| `SyncInventoryViaSku` | Sync inventory from ILS to IAS for SKU list |
| `PriceUpdate` | Create first-time price in IAS |

### 6.2 Key Database Tables

| Table | Purpose |
|-------|---------|
| `scm-inventory-location` | Main inventory table |
| `scm-inventory-location-planning` | Reservation and planning data |
| `scm-inventory-rules` | Business rules (liquidation prices, FnV master) |
| `dash-scm-rack-management-v2` | Store location and rack data |

### 6.3 FnV Master Module

**Purpose**: City-wise MRP management for Fruits & Vegetables

**Key Features:**
- City x SPIN level MRP upload
- Automatic MRP adoption for new PODs in city
- Bypass validation for authorized users
- MRP deviation guardrails (90% threshold)

---

## 7. Order Fulfillment Process at POD

### 7.1 End-to-End Order Flow

```
Phase 1: Order Confirmation
├── Customer places order
├── Cart validation via IAS
├── Order confirmation event published
└── Capacity controller validates POD capacity

Phase 2: Inventory Reservation
├── ILS ReserveInventory RPC called
├── Sellable → Picking Reserved
├── Location details returned for picking
└── Planning table updated

Phase 3: Picking Job Creation
├── Task Manager creates picking job
├── Job contains item list with locations
├── Picker Assignment recommends optimal picker
└── Job assigned to Free picker

Phase 4: Picking and Packing
├── Picker navigates to locations
├── Items scanned and validated
├── Quality check performed
├── Items packed for delivery
└── Job marked as MFR

Phase 5: Handover and Settlement
├── DE picks up order
├── Order delivered to customer
├── UOMS Complete Order Event published
├── ILS settles inventory
└── Picker state → Free
```

### 7.2 UOMS (Unified Order Management System) Events

UOMS is the central order management system that publishes events throughout the order lifecycle:

| Event | Description |
|-------|-------------|
| `uomscreateorder` | Order created in system |
| `uomscreateconfirmorder` | Order confirmed |
| `uomscancelorder` | Order cancelled |
| `uomscompleteorder` | Order completed (triggers ILS settlement) |
| `uomsfailorder` | Order failed |
| `uomseditorder` | Order edited |
| `uomseditconfirmorder` | Edit confirmed |
| `uomsupdateorder` | Order updated |
| `uomsinitiatereturnorder` | Return initiated |
| `uomscompletereturnorder` | Return completed |
| `uomscancelreturnorder` | Return cancelled |
| `uomsupdatereturnorder` | Return updated |

These events drive downstream systems including ILS inventory settlement, payment processing, and analytics.

---

## 8. Store Manager Responsibilities

### 8.1 Core Responsibilities

**Daily Operations:**
- Manage pickers, loaders, and handlers
- Monitor picking job progress
- Handle escalations and process issues
- Ensure staff performance targets are met

**Inventory Management:**
- Oversee inwarding and putaway
- Approve purchase returns
- Conduct cycle counts
- Manage wastage and liquidation

**Quality Control:**
- Monitor SM QC workflow
- Address customer complaints
- Ensure FSSAI compliance
- Maintain hygiene standards

### 8.2 Tools and Access

| Tool | Purpose |
|------|---------|
| **IM Store Manager Dashboard** | Unified landing page |
| **MIM Dashboard** | Inventory and rack management |
| **Picker Admin** | Picker management and assignment |
| **HRMS** | Attendance, shift, payroll |
| **IM Retail App** | LPN visibility and manifest checking |
| **Slack** | Alert notifications |

---

## 9. POD Capacity and Constraints

### 9.1 Capacity Dimensions

| Dimension | Description |
|-----------|-------------|
| **Active Order Capacity** | Max concurrent orders being picked |
| **MFR Capacity** | Max orders awaiting DE pickup |
| **Storage Capacity** | Volumetric capacity by rack type |
| **Manpower Capacity** | Number of active pickers |

### 9.2 Constraints and Bottlenecks

**Physical Constraints:**
- Limited rack space for expanding assortment
- Storage limitations for heavy/bulky items
- Temperature-controlled zone capacity
- Floor space for putaway operations

**Operational Constraints:**
- Picker availability and attrition
- Network connectivity issues
- Equipment failures (freezers, AC, printers)

**System Constraints:**
- API latency during peak hours
- DynamoDB throttling (WCU/RCU limits)
- Kafka lag in event processing

---

## 10. Fresh/Perishables Handling at POD

### 10.1 Cold Chain Management

- Dedicated chiller zones (`ZONE_TYPE_CHILLER`)
- Walk-in freezers (`SPACE_TYPE_WALK_IN_FREEZER`)
- Temperature monitoring
- Separate storage for veg/non-veg items

### 10.2 Shelf Life Tracking

- Expiry date maintenance in inventory system
- FEFO (First Expired First Out) sorting for reservations
- Quality team maintains shelf life master data
- MRP linked to shelf life in FnV Master

### 10.3 FnV Dual Dispatch Pilot

- Two dispatch slots per day instead of single daily dispatch
- **Impact**: +6pp availability, -2.5pp expiry wastage
- Optimizes movement plans for higher freshness
- **Pilot Status**: Started in Chennai, expanding to Pune and other cities

---

## 11. Cycle Count and Inventory Accuracy

### 11.1 Cycle Count Process

1. Cycle count task assigned to store manager
2. Physical count performed at location level
3. Discrepancies logged and reconciled
4. Inventory adjustments made via MIM dashboard

### 11.2 Inventory Mismatch Challenges

**Common Issues:**
- Purchase returns due to LPN mismatches
- Pilferage during warehouse-POD transfer
- Inwarding errors (wrong quantities)
- System vs. physical stock discrepancies

**Mitigation Strategies:**
- LPN-based unloading with real-time visibility
- Central PR approval tool to validate returns
- Smart reconciliation flagging unscanned LPNs
- Guided putaway to reduce location errors

---

## 12. POD Launch Process for New Stores

### 12.1 Onboarding Steps

**Step 1: Pre-Launch Preparation**
- Create CMR ticket from template
- FSSAI license/reference number validation at KMS
- Invoice identifier configuration
- Store document verification

**Step 2: Config Updates**
- Express Putaway enablement
- RTV/Liquidation App Flow
- FEFO Inventory Settlement
- LPN Inwarding
- FnV Master (if applicable)

**Step 3: Store Layout Upload**
- ARB locations with attributes
- Validation of location mapping file
- QR code generation for all locations

**Step 4: Item-Location Mapping**
- SKUs mapped to specific locations
- Capacity defined per location
- Zone type validation

**Step 5: Go-Live Verification**
- Communication to GTM core group
- Integration testing of all flows
- Monitoring setup in Grafana

---

## 13. Key Challenges and Pain Points

### 13.1 Operational Challenges

| Challenge | Impact |
|-----------|--------|
| High picker attrition | Insufficient staffing during peak |
| Equipment failures | Freezers, AC, printers |
| Network connectivity | Affects O2P time |
| Manual processes | Google Forms instead of app |

### 13.2 Technical Challenges

| Challenge | Impact |
|-----------|--------|
| Race conditions | Order cancellation + MFR update |
| Event ordering | ILS, DPS, TMS not guaranteed |
| Stale Kafka messages | Incorrect states |
| API latency spikes | Affects fulfillment |

**DynamoDB Throttling:**

Key table configurations and documented throttling incidents:

| Table | Initial Config | Max Scaling | Known Issues |
|-------|---------------|-------------|--------------|
| `dash-scm-inventory-availability` | 200 RCU / 200 WCU | 25,000 RCU / 5,000 WCU | - |
| `scm-control-room-rules` | 300 RCU / 100 WCU | 2,500 RCU / 2,500 WCU | - |
| `dash-scm-task-manager-task` | 200 WCU | - | Documented throttling at 700 WCU load |
| `scm-inventory-location` | - | - | Write throttle events observed |

**Kafka Consumer Lag:**

Documented incidents affecting POD operations:

| Incident | Impact | Mitigation |
|----------|--------|------------|
| scm-procurement lag spikes | Messages backed up from <5 to ~800 | Prometheus alerting |
| de-allocator consumer lag | Metric discrepancies | Consumer segregation by business line |
| Heimdall JobStatusUpdate lag | Elevated PSLA, POD unserviceability | Consumer isolation |

Kafka lag directly impacts PSLA (Promised Service Level Agreement) and can trigger POD unserviceability.

---

## 14. Metrics Tracked at POD Level

### 14.1 Operational Metrics

- **Availability**: SKU availability %, Top 15K items availability
- **Speed**: O2P time, Picking time/order, Putaway completion time
- **Quality**: FTR %, Customer escalations, Hygiene compliance

### 14.2 Inventory Metrics

- **Accuracy**: Inventory mismatch %, Cycle count discrepancy, PR rate
- **Efficiency**: DOI, Expiry wastage %, Liquidation volume
- **Capacity**: Storage utilization, Active order capacity, Picker productivity

---

## 15. Capacity Controller and Unserviceability

### 15.1 Capacity Controller Service (`scm-capacity-controller`)

**Purpose:** Manages POD-level capacity constraints and triggers unserviceability

**Key Triggers:**
| Trigger | Condition | Impact |
|---------|-----------|--------|
| **Banner Factor** | BF > threshold | Reduces order acceptance |
| **Picker Availability** | Insufficient pickers | Degraded SLA |
| **Storage Capacity** | Rack utilization > 95% | Inwarding blocked |
| **Active Orders** | Exceeds pod limit | New orders queued |

**Integration:**
- Feeds into `dash-serviceability` for pod availability decisions
- Real-time updates every 15 seconds
- Fallback to adjacent pods when triggered

### 15.2 Stock Replenishment Tasks

**Purpose:** Move inventory from putaway to picking locations for FEFO compliance

**Use Cases:**
1. **Perishable FEFO Adherence**: Move next-expiry batch when picking location depleted
2. **Chilled Item Management**: Refill freezer picking locations from ambient putaway

**Task Creation Logic:**
- Inventory at picking location falls below threshold
- Only for SKUs in replenishment list (~100-150 items per POD)

**Priority Order:**
1. Starved picking jobs
2. Extremely delayed picking jobs
3. FCFS (replenishment vs orders based on creation time)

**Execution:**
1. Picker receives replenishment task
2. System suggests source (putaway) and destination (picking) locations
3. Picker picks from source, navigates to destination
4. Image upload at destination location
5. System updates inventory location

**Config:** `REPLENISHMENT_ENABLED_STORES` - can be paused during peak periods

### 15.3 Purchase Returns (PR) Management

**Volume:** ~₹20 crore/month (PAN India)

**Root Causes:**
- Wrong POD delivery (LPNs to incorrect POD)
- Missed putaway (items not found during inwarding)
- Lack of traceability between warehouse and POD
- Manual errors in manifest selection

**Reduction Initiatives:**
| Initiative | Impact |
|------------|--------|
| **LPN-Based Unloading** | ₹1.2 lakh+ daily savings |
| **Central PR Approval** | Reduced fraudulent returns |
| **Manifest-Agnostic Inwarding** | Eliminates manual selection errors |
| **Guided Putaway** | Reduces new SKU PRs |

---

## 16. Key Document References

### Confluence Documentation
1. [Enabling POD on MIM Stack](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3632857456)
2. [Rack Management PRD](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3782608937)
3. [Inventory Correction PRD](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3782838327)
4. [FnV Master](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4677533759)
5. [Zoning at PODs LLD](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4185948627)

### Technical Specifications
6. [Inventory Location Service](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4189358024)
7. [SCM Inwarding](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3869115216)
8. [Item Location Mapping Migration](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4618027551)
9. [Manifest Agnostic Inwarding](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4650697585)
10. [Space & Rack Type Attributes](https://swiggy.atlassian.net/wiki/spaces/IMSCMFF/pages/5029560475)
11. [Barcode Scan Debugging](https://swiggy.atlassian.net/wiki/spaces/IMSCMFF/pages/4973461537)
12. [Society Stores](https://swiggy.atlassian.net/wiki/spaces/IMSCMFF/pages/4489117782)

### GitHub Repositories
13. [inventory-location-service](https://github.com/swiggy-private/inventory-location-service)
14. [dash-rack-management](https://github.com/swiggy-private/dash-rack-management)
15. [dash-picker-service](https://github.com/swiggy-private/dash-picker-service)
16. [scm-inventory-availability](https://github.com/swiggy-private/scm-inventory-availability)
17. [uoms-lambda](https://github.com/swiggy-private/uoms-lambda)

---

*Document compiled from Glean research across 50+ internal sources | December 2025*
