# Swiggy Instamart Inventory Management and Availability Systems: Deep-Dive Research

## Executive Summary

Swiggy Instamart's inventory management is powered by a sophisticated ecosystem of interconnected services, primarily centered around **MIM (Master Inventory Management)**, **ILS (Inventory Location Service)**, and **IAS (Inventory Availability Service)**. The system manages real-time inventory across 160+ stores (PODs), tracking inventory states, batch/expiry management, and maintaining accurate availability for customer-facing catalog.

---

## 1. MIM (Master Inventory Management) Architecture

### 1.1 Overview

MIM is Swiggy's in-house ERP system that replaced GoFrugal as the primary inventory management platform. It serves as the central system governing inventory flow from arrival to departure.

### 1.2 Core Components

**MIM Dashboard Capabilities:**
- Stock adjustments (damaged at POD, pilferage, mark unsellable)
- Inventory reservations (RTV, liquidation, stock transfer)
- Attribute updates (expiry date, MRP, location changes)
- Bulk upload/download functionalities

**Key Services Integration:**
- `scm-inventory-location`: Core inventory tracking
- `scm-inventory-availability`: Aggregated availability computation
- `scm-procurement`: Purchase order management
- `scm-invoicing`: Financial reconciliation
- `scm-reporting`: Analytics layer

### 1.3 Data Model

MIM maintains inventory master table with key attributes:
- Store ID, SKU ID, Location ID
- Expiry date, Manufacturing date, Unsellable date
- MRP, Batch ID, Invoice price
- Inventory buckets: Sellable, Unsellable, Damaged, Pilferage, RTV_reserved, RTV_shipped, Liquidation_reserved, Liquidation_shipped
- Reservation states: Picking_reserved, Put-away_reserved

### 1.4 Migration Status (Updated December 2025)

- Migration from GoFrugal to MIM stack is ongoing
- Config-driven routing still in use for some pods
- Express putaway enablement ongoing for new pods
- RPC migration from protorepo to api-registry in progress
- New pods onboarded directly to MIM stack

---

## 2. ILS (Inventory Location Service)

### 2.1 Purpose

ILS is the core service for managing inventory at batch and location level, tracking physical inventory across POD locations with FEFO support.

### 2.2 Key RPCs

| RPC | Purpose |
|-----|---------|
| `CreateInventory` | Add new inventory records (store onboarding) |
| `AddToItemInventory` | Increment inventory quantities |
| `MoveInventoryAcrossBatches` | Transfer between locations/batches |
| `ReserveInventory` | Reserve for orders, putaway |
| `UpdateItemPrice` | MRP updates across batches |
| `CreateReconcileInventoryTransactions` | Physical vs system reconciliation |
| `FetchPutawayRecommendation` | Get recommended putaway locations |
| `FetchPickupRecommendation` | Get recommended pickup locations |
| `SyncInventoryViaSku` | Sync inventory from ILS to IAS for SKU |
| `SyncInventoryViaStoreId` | Sync inventory from ILS to IAS for store |
| `FetchInventoryDetails` | Fetch inventory SKU details |
| `ListItemInventories` | List inventories (new API in api-registry) |

**Note:** RPCs are being migrated from protorepo to api-registry. See [RPC Migration](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4232052916).

### 2.3 Location Recommendation

**Putaway Recommendations:**
- `RecommendPutawayLocationBOIQService` (BOIQ - Batch on Item Queue)
- `RecommendPutawayLocationBOBAIQService` (BOBAIQ - Batch on Batch and Item Queue)
- Filters out damage/disposal zones

**Picking Recommendations:**
- `RecommendPickupLocationB2COrderPickingBOIQService`
- FEFO-based (First Expiry First Out) batch selection
- Filters expired, unsellable, and damaged buckets

### 2.4 Database Tables

| Table | Purpose |
|-------|---------|
| `dash-scm-inventory-location` | Main inventory tracking |
| `dash-scm-inventory-planning` | Transaction planning and idempotency |
| `scm-control-room-rules` | Control room rules (~404K rules) |
| `item-seller-mapping` | SKU-seller relationships |

---

## 3. IAS (Inventory Availability Service)

### 3.1 Purpose

IAS aggregates inventory data and computes availability status (in_stock/out_of_stock) for customer-facing catalog.

### 3.2 Availability Computation

**Input Sources:**
- Inventory quantities from ILS
- Pricing data (MRP, cost price)
- Control room rules
- Reservation states

**Computation Logic:**
```
available_qty = sellable - picking_reserved - putaway_reserved
in_stock = (available_qty > 0) AND (control_room_rules allow)
```

### 3.3 Control Room Rules

Control Room is the rule-based system that determines final availability beyond raw inventory counts.

**Rule Types:**

| Rule Type | Description | Use Case |
|-----------|-------------|----------|
| **OOS Override** | Force item to appear OOS despite positive stock | Quality issues, recalls, pricing errors |
| **Holiday Slot** | Suppress visibility during specific time windows | Festival closures, supply constraints |
| **Visibility Suppression** | Permanent or temporary removal from catalog | Delisted items, regional restrictions |
| **in_stock Override** | Force item to appear in stock (rare, controlled) | Manual intervention for known good stock |

**Rule Lifecycle:**
```
Create Rule → Activate (start_time) → Active Period → Deactivate (end_time) → Archive
```

**Rule Data Source:** `scm-control-room-rules` DynamoDB table

**Key Fields:**
- `rule_id`: Unique identifier
- `store_id` / `sku_id`: Scope of rule
- `rule_type`: OOS_OVERRIDE, HOLIDAY_SLOT, VISIBILITY_SUPPRESSION
- `start_time` / `end_time`: Active window
- `created_by` / `reason`: Audit trail

**Current Limitations:**
- No scheduled control room rules (cannot auto-enable/disable at specific times)
- Flash sales require manual rule management, leading to FTR issues
- Rules don't auto-rollback post-event, causing wastage if not manually removed

**Brain MVP Relevance:** Control Room rules are critical for Branch 6 (Tagging/config-led) diagnosis. Chronic holiday slots (>30 days) may indicate systemic supply issues being masked.

### 3.4 Item Availability Determination

The final availability status is determined by combining multiple signals:

**Decision Matrix (Non-Liquor BL - IM/MAX):**

| in_stock | overridden_oos | holiday_slot | Final Status |
|----------|----------------|--------------|--------------|
| true     | false          | No           | **Available** |
| true     | true           | -            | OOS |
| false    | -              | -            | OOS |
| true     | false          | Yes          | Holiday Slot |

**Decision Matrix (Liquor BL):**

| overridden_oos | in_stock | Final Status |
|----------------|----------|--------------|
| true           | -        | OOS |
| false          | -        | **Available** |

**Key Distinction:**
- **Holiday Slot**: Time-based visibility suppression (item hidden during specific windows)
- **Control Room OOS**: Inventory-based availability (rule evaluation against threshold)
- **Overridden OOS**: Manual force-OOS by operations team (highest precedence)

**Source:** [Item Availability Determination](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3857550357)

### 3.5 Event Processing

**Kafka Topics:**

| Direction | Topic Name | Purpose |
|-----------|------------|---------|
| Consumer | `dash--scm-inventory-location--inventory-updates` | Inventory/pricing updates from ILS |
| Producer | `im-scm-inventory--ias--inv-avl-updates` | Availability updates to downstream services |

**Events Consumed:**
- Inventory quantity updates (from ILS)
- Pricing updates
- Order status updates
- Picking job status updates
- Contract master sync events

### 3.6 Real-time Updates

- Kafka producer: Publishes to `im-scm-inventory--ias--inv-avl-updates`
- SNS publishing: State machine integration for catalog
- Latency target: Updates within seconds

### 3.7 Migration from Legacy

**Deprecated Services:**
- swiggy-inventory-service
- swiggy-pricing-service

**Cost Savings Breakdown (Monthly):**

| Component | Savings |
|-----------|---------|
| cms-listing-v1 DAX | $2,450 |
| MongoDB Instances (4) | $2,600 |
| swiggy-inventory/pricing EC2 | $475 |
| **Total** | **$5,525** |

**Throughput Reduction:**
- swiggy-listing-service → cms_listing_v1 DAX: 500K RPM → 0
- catalog-ingestion-workflow → swiggy-pricing-service: 3K RPM → 0
- scm-inventory-availability → swiggy-pricing-service: 400 RPM → 0

**Code Cleanup:** ~17,500 lines removed
- cms-catalog-ingestion-workflow: ~6,000 lines
- swiggy-listing-service: ~9,500 lines
- scm-inventory-availability: ~2,000 lines

**Kafka Topics Deprecated:**
- `cms.inventory.change` / `cms.inventory.v2.change`
- `cms.pricing.change` / `cms.pricing.v2.change`

**Source:** [Catalog Inventory/Pricing Deprecation](https://swiggy.atlassian.net/wiki/spaces/NICatalog/pages/4178444516)

### 3.8 IAS Infrastructure

**DynamoDB Tables:**

| Table | Size | Item Count | Streams |
|-------|------|------------|---------|
| `dash-scm-inventory-availability` | ~38 GB | ~231M items | Enabled (NEW_AND_OLD_IMAGES) |
| `scm-control-room-rules` | <1 GB | ~404K rules | Enabled |

**DAX Configuration:**
- Cluster: `ias-dax` (3 nodes)
- Item TTL: 3 days
- Tables: `dash-scm-inventory-availability`

**Lambda Triggers:**
- `cdc-lambda-dash-erp-engg-dash-scm-inventory-availability` (BatchSize: 10000)
- `cdc-lambda-singapore-scm-control-room-rules` (BatchSize: 2500)

**Source:** [Service Footprint Report](https://swiggy.atlassian.net/wiki/spaces/MTI/pages/5248122926)

### 3.9 Valkey Migration (WIP - 2025)

IAS is migrating from DAX to Valkey for improved caching:

**Key Changes:**
- Negative caching for non-existent SKUs to prevent repeated DDB lookups
- Cross-slot key handling for batch operations
- Average item entry size: 172 bytes

**Status:** Work in progress as of November 2025

**Source:** [IAS Valkey Migration](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5144215725)

---

## 4. Inventory State Machine

### 4.1 Primary Buckets

| Bucket | Description |
|--------|-------------|
| **Sellable** | Available for customer orders |
| **Picking_reserved** | Reserved for active orders |
| **Putaway_reserved** | Reserved for putaway tasks |
| **Unsellable** | Cannot be sold (quality issues) |
| **Damaged** | Physically damaged items |
| **Expired** | Past expiry date |

### 4.2 Disposition Buckets

| Bucket | Description |
|--------|-------------|
| **RTV_reserved** | Reserved for return to vendor |
| **RTV_shipped** | Shipped back to vendor |
| **Liquidation_reserved** | Reserved for liquidation |
| **Liquidation_shipped** | Sent for liquidation |
| **Pilferage** | Missing inventory (theft/loss) |
| **Disposed** | Physically disposed/destroyed items |

### 4.3 Reservation Buckets (New - 2024-2025)

| Bucket | Description |
|--------|-------------|
| **DamageReserved** | Reserved pending damage processing |
| **PilferageReserved** | Reserved pending pilferage investigation |
| **ExpiryUpdateReserved** | Reserved during expiry date correction |
| **Dispose** | Items marked for disposal |
| **DisposeReserved** | Items reserved for disposal |

**Source:** [GitHub PR #775](https://github.com/swiggy-private/inventory-location-service/pull/775)

**Note:** `Unsellable_reserved` = Sum of all unsellable reservation buckets:
```
Unsellable_reserved = DamageReserved + PilferageReserved + ExpiryUpdateReserved + DisposeReserved + RTV_reserved + Liquidation_reserved
```

### 4.4 Complete Bucket Taxonomy

```
Inventory Buckets
├── Sellable Buckets
│   ├── Sellable (available for orders)
│   ├── Picking_reserved (assigned to orders)
│   └── Putaway_reserved (being stored)
│
├── Unsellable Buckets
│   ├── Unsellable (quality issues)
│   ├── Expired (past expiry)
│   └── Damaged (physically damaged)
│
├── Disposition Buckets
│   ├── RTV_reserved / RTV_shipped
│   ├── Liquidation_reserved / Liquidation_shipped
│   ├── Pilferage
│   ├── Dispose / DisposeReserved  ← NEW (2024-2025)
│   └── Disposed
│
└── Reservation Buckets (NEW - 2024-2025)
    ├── DamageReserved
    ├── PilferageReserved
    ├── ExpiryUpdateReserved
    └── DisposeReserved
```

### 4.5 State Transitions

**Inventory Addition Flow:**
```
Stock mismatch/PR correction/Sales return → Sellable
Inwarding → Sellable (via put-away completion)
```

**Inventory Deduction Flow:**
```
Sellable → Picking_reserved (order assignment)
Picking_reserved → Deducted (order completion)
Sellable → Unsellable (quality check/expiry approaching)
Unsellable → Damaged (damage marking)
Unsellable → RTV_reserved (return to vendor process)
RTV_reserved → RTV_shipped (shipment completion)
```

### 4.6 Priority of Deduction

1. Sellable
2. Unsellable
3. RTV_reserved
4. Liquidation_reserved

### 4.7 Row Deletion Conditions

Records archived when:
- Picking_reserved = 0
- Putaway_reserved = 0
- Sellable = 0
- Unsellable = 0
- RTV_reserved = 0

---

## 5. Batch and Expiry Management

### 5.1 Batch Definition

A unique batch is identified by:
- SKU ID + Expiry Date + Location + MRP + Seller

### 5.2 Batch Lifecycle

1. **Inwarding**: Batch created with expiry date, MFG date
2. **Storage**: Multiple batches per SKU tracked separately
3. **FEFO Picking**: Earliest expiring batch picked first
4. **Expiry Management**:
   - Shelf life (total days from MFG to expiry)
   - Sellable shelf life (days before expiry when item becomes unsellable)
   - `Unsellable date = Expiry date - Shelf life + Sellable shelf life`
   - `Manufacturing date = Expiry date - Shelf life`

### 5.3 Batch Operations

- **Batch Reconciliation**: Physical count vs system for specific batches
- **Expiry Change Adjustments**: Move inventory from one expiry batch to another
- **Batch-level MRP Updates**: Handle price changes for specific batches

### 5.4 Batch Validation

- Expiry date must be in future
- MFG date < Expiry date
- Unsellable date triggers automatic state change
- System prevents picking from expired/near-expiry batches

---

## 6. Stock Reconciliation Process

### 6.1 Reconciliation Types

| Type | Scope | Input |
|------|-------|-------|
| **Location Batch** | Item + Location + Batch | Physical count per batch |
| **Location** | Item + Location (all batches) | Total physical count |

### 6.2 Reconciliation API Flow

**Step 1: CreateReconcileInventoryTransactions**

```
Input:
├── Item details (SPIN ID, Store ID, Location)
├── Physical inventory (sellable, damaged counts per batch)
├── Actor (user performing reconciliation)
└── Idempotency key

Process:
1. Validate request
2. Fetch SKU from listing service
3. Check if reconciliation already processed
4. Validate inventory state (no active picking)
5. Identify adjustments:
   ├── Batch adjustments (expiry changes)
   └── Inventory adjustments (quantity differences)
6. Create planning table transactions
7. Return transaction IDs
```

**Step 2: CommitTransaction or CancelTransaction**

```
CommitTransaction:
├── Apply adjustments to inventory master
├── Update inventory quantities
├── Change batch expiry dates if needed
└── Mark transaction as completed

CancelTransaction:
├── Discard identified adjustments
└── Mark transaction as cancelled
```

### 6.3 Reconciliation Validations

**Pre-conditions:**
- Inventory exists for the SKU
- No active picking (picking_reserved = 0)
- Valid location and expiry dates

**Failure Codes:**
- `FAILED_PRECONDITION`: Picking in progress
- `NOT_FOUND`: SKU has no inventory
- `INVALID_ARGUMENT`: Invalid request parameters
- `ALREADY_EXISTS`: Reconciliation already completed

---

## 7. Shrinkage and Wastage Management

### 7.1 Shrinkage Categories

| Category | Description | Detection |
|----------|-------------|-----------|
| **Pilferage** | Missing inventory | Reconciliation |
| **Damage** | Physically damaged | QC, handling issues |
| **Expiry** | Past sellable date | Automatic state change |

### 7.2 Damage Dispositions

- Handling Issue
- FnV Quality Issue (Fruits & Vegetables)
- Sales Return Damage
- Rat Bite
- Equipment Malfunction
- Expired

### 7.3 Wastage Workflows

**Marking Unsellable:**
```
Process:
1. Inventory controller marks items as unsellable
2. Inventory moved: Sellable → Unsellable
3. MIM dashboard: Bulk upload with reason
4. Validation: Valid store, SKU, location, expiry
```

**RTV (Return to Vendor) Process:**
```
Flow:
1. Reservation: Unsellable → RTV_reserved
2. Shipment: RTV_reserved → RTV_shipped
3. Validation: RTV_reserved quantity available
```

**Liquidation Process:**
```
Flow:
1. Reservation: Unsellable → Liquidation_reserved
2. Shipment: Liquidation_reserved → Liquidation_shipped
```

### 7.4 Wastage Analytics

Analytics table: `analytics_prod.assure_store_inventory_ledger_day_level`
- Retention: 365 days
- Categories: Opening stock, Inwarding, Sales, PSA, Damage, Pilferage, Expiry, RTV/Liquidation

---

## 8. OOS (Out of Stock) Detection

### 8.1 Real-time OOS Detection

Computed by IAS:
```
OOS = (available_qty <= 0) OR (control_room_override = false)
```

### 8.2 OOS Monitoring

**Alert**: `INVENTORY_AVAILABILITY_OOS_COUNT_SDLW_COMPARISON_CRITICAL`

**Common Root Causes:**
- DAX connectivity failures
- Network timeouts
- BatchGetSkuDetails operation failures

### 8.3 OOS Handling in Applications

**Consumer App:**
- OOS items shown separately in cart
- "Notify Me" option for OOS items
- Toast notifications on adding OOS items

**Cart Updates:**
- Error code 161 handling
- Automatic retry with available items
- Removed items tracking and notification

---

## 9. Additional System Components

### 9.1 Rack Management

- **Service**: dash-rack-management
- **Functions**: Location hierarchy, Item-location mapping, QR code generation
- **Special Locations**: Damage, Disposal, LocationType: `SPECIAL_AISLE_RACK_BIN`
- **Assortment V2 Fields** (New):
  - `spaceType`: Space type classification
  - `rackType`: Rack type classification
  - Validated for stores enabled under Assortment V2 configuration

**Source:** [JIRA CMR-156670](https://swiggy.atlassian.net/browse/CMR-156670)

### 9.2 Cycle Count

- **Service**: scm-cycle-count-consumer
- **Purpose**: Periodic inventory verification
- **Process**: Create tasks → DE performs count → Results to reconciliation

### 9.3 Stock Replenishment

**Purpose**: Move inventory from putaway to picking locations

**Triggers:**
- Picking location below threshold
- FEFO adherence (next expiring batch)
- Chilled item requirements

---

## 10. Key Technical Challenges

### 10.1 Scalability

- **Listing Service**: 500K RPM peak (before deprecation)
- **IAS DynamoDB**: ~231M inventory records
- **DAX Cluster**: 3 nodes, 3-day TTL
- **POD Count**: 160+ active dark stores
- **System Runtime**: ~15 hours/day at maximum capacity
- Millions of SKU-location combinations

### 10.2 Data Consistency

- Eventual consistency via Kafka
- DAX caching layer
- Risk of stale reads during high load

### 10.3 Migration Complexity

- GoFrugal → MIM: Phased migration
- Inventory/Pricing → IAS: Alcohol BL migration
- Singapore → Mumbai: Zero-downtime cross-region

### 10.4 Operational Challenges

- AI model accuracy for damage/wrong item detection
- Fraud detection (DE not returning items)
- High shrinkage PODs governance

### 10.5 Recent Incidents (2024-2025)

| Date | Incident | Root Cause |
|------|----------|------------|
| 2025-10-24 | SCM Impact from Listing Service Catalog Disruption | Fallback rule triggered when Spin IDs not found from listing service |
| 2025-11-03 | ILS API Latency | Increased latency in MoveInventoryAcrossBatches API |
| 2025-11-12 | Inventory Pricing Updates Consumer Lag | Critical lag in processing pricing updates |
| 2025-09-08 | DAX BatchGet Unprocessed Keys | Errors in processing batch get requests |
| 2025-06-22 | IAS Stream Lambda Spillover | Provisioned concurrency spillover invocations |
| 2025-06-16 | DynamoDB Connectivity Issues | Multiple services unable to connect to DDB |

**RCA Sources:**
- [SCM Impact from Listing Service Catalog Disruption](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5184979009)
- [DDB Connectivity RCA](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4681433089)

---

## 11. Key Document References

### Architecture & Design
1. [Instamart Supply Chain Tech and Inventory Management](https://swiggy.atlassian.net/wiki/spaces/BAZ/pages/3404661575)
2. [Inventory and Pricing Domain Revamp](https://docs.google.com/document/d/1KycU0My0oUMaf3Zc76wOE5kvlaA2ToVFNTCv18b-Xzc/edit)
3. [ILS LLD](https://docs.google.com/document/d/1UcvVTpMjtTSpKDzGDKvZM-McsDwEjpai9Vln3MABb_Y/edit)
4. [IAS LLD](https://docs.google.com/document/d/1aA6mm5pLfqOywIUZImpP1Mv_uRlmcctK2U1rzm47olE/edit)

### API Documentation
5. [SPIN, SKU and Inventory Management API](https://swiggy.atlassian.net/wiki/spaces/AB1/pages/4748673440)
6. [Inventory API Proto](https://github.com/swiggy-private/api-registry/blob/master/scm_inventory/scm_inventory_gateway/scminventory/v1/inventory_api.proto)

### Operations & Workflows
7. [PRD: Inventory Correction Use Cases](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3782838327)
8. [MIM Dashboard PRD](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3782609505)
9. [Stock Replenishment LLD](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4186243147)

### Code Repositories
10. [Reconcile Inventory Service](https://github.com/swiggy-private/inventory-location-service/blob/master/internal/app/ils/service/reconcile_inventory_service.go)
11. [Reconcile Inventory Implementation PR](https://github.com/swiggy-private/inventory-location-service/pull/405)

### Migration & Deprecation
12. [Catalog Inventory/Pricing Deprecation](https://swiggy.atlassian.net/wiki/spaces/NICatalog/pages/4178444516)

### Incidents & RCAs
13. [Item OOS Issue in Availability Service RCA](https://swiggy.atlassian.net/wiki/spaces/swiggyarch/pages/1570504721)
14. [SCM Config Management Issue RCA](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3763339728)

### New References (2024-2025)
15. [Catalog Inventory/Pricing Deprecation Details](https://swiggy.atlassian.net/wiki/spaces/NICatalog/pages/4178444516)
16. [Service Footprint: scm-inventory-availability](https://swiggy.atlassian.net/wiki/spaces/MTI/pages/5248122926)
17. [IAS Valkey Migration](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5144215725)
18. [Debugging Item Availability Issues](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3885695143)
19. [Rule and Item Availability Audit](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3806593295)
20. [Item Availability Determination](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3857550357)
21. [RTV, Liquidation & Wastage Management v2](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3786022404)
22. [FNV Expiry Management](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5228724260)
23. [RPC Migration (protorepo to api-registry)](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4232052916)
24. [Enabling a POD on MIM Stack](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3632857456)

---

*Document compiled from Glean research across internal sources | Updated December 2025*
*Last verified: December 22, 2025*
