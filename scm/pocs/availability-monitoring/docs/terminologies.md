# Instamart Availability RCA: Terminology Guide

This document defines key terms used in the Instamart SKU availability monitoring and root cause analysis system.

---

## Physical Supply Chain Entities

### POD (Point of Distribution)
Dark store that serves customers. Each POD has a `store_id` and belongs to a city. PODs are tiered by size (S/M/L/XL/XXL/Mega) which determines SKU capacity and delivery radius.

### Warehouse (WH)
Mother warehouse that holds bulk inventory and replenishes PODs. Examples: `BLR ECOM2` (ambient), `BLR COLDSTAR` (cold). Each POD is mapped to specific warehouses for ambient and cold items.

### SKU (Stock Keeping Unit)
Individual product identified by `item_code` (numeric) and `sku_id` (internal). Also called "item" in various contexts.

### Ambient vs Cold
Temperature classification for storage and logistics:
- **Ambient**: Room temperature items (stored in regular warehouse sections)
- **Cold**: Items requiring refrigeration, further split into:
  - **Cooler/Chiller**: +4 to +8°C (dairy, beverages)
  - **Freezer**: -18°C (frozen foods, ice cream)

---

## Inventory Metrics

### DOH (Days of Inventory / Days on Hand)
```
DOH = WH_STOCK / BASE_RR
```
Number of days the current warehouse stock will last at the expected consumption rate. **Critical threshold: DOH < 3 means WH is effectively OOS.**

### DOI (Days of Inventory)
Synonym for DOH, used interchangeably in some contexts.

### WH_STOCK
Physical quantity of an SKU available at the warehouse. Excludes stock in staging areas or with expiry issues.

### Free Stock vs Staging Stock
- **Free Stock**: Inventory in pickable bin locations, ready for movement to PODs
- **Staging Stock**: Inventory received but not yet put away into bins (not available for picking)

### Free DOH
```
Free DOH = (WH_STOCK - STAGING_STOCK) / BASE_RR
```
Days of inventory considering only put-away stock. Low free DOH with high total DOH indicates putaway delays.

---

## Run Rates & Forecasting

### Base RR (Base Run Rate)
Expected daily demand for an SKU, aggregated from POD-level forecasts. Used to calculate DOH and drive procurement planning.

### Movement RR (Movement Run Rate)
Expected daily transfer quantity from WH to a specific POD. Drives movement planning decisions.

### TFT (Temporal Fusion Transformer)
Deep learning model used for demand forecasting. Produces ~18.6% MAPE (Mean Absolute Percentage Error).

---

## Purchase Orders & Procurement

### PO (Purchase Order)
Order placed with supplier to replenish warehouse inventory. Key fields:
- `POCODE`: PO identifier
- `EAQTY`: Expected/ordered quantity
- `RCVDQTY`: Received quantity

### GRN (Goods Receipt Note)
Document confirming physical receipt of goods at warehouse. GRN date and quantity are critical for fill rate calculations.

### Fill Rate
```
Fill Rate = GRN_QTY / PO_QTY
```
Percentage of ordered quantity actually delivered by supplier. **Threshold: < 80% indicates fill rate issue.**

### Last PO Fill Rate
Fill rate of the most recent PO for an SKU-WH combination. **Threshold: < 50% indicates acute supply problem.**

### OTIF (On Time In Full)
Delivery performance metric. OTIF issue flagged when goods not received within `lead_time_in_days + 3 days` of PO creation.

### Lead Time
Number of days between PO creation and expected delivery, configured per supplier-city combination.

### MOV (Minimum Order Value)
Minimum rupee value required to place a PO with a supplier.

### MOQ (Minimum Order Quantity)
Minimum units required to place a PO for an SKU.

### Case Size
Minimum ordering multiple (e.g., if case size = 12, must order in multiples of 12).

### OTB (Open To Buy)
Budget allocation for procurement. OTB Block means the category has exhausted its buying budget.

---

## Movement Planning

### Movement Plan
Daily plan for transferring inventory from WH to PODs. Separate plans for ambient and cold items.

### Transfer Qty
Planned quantity to move from WH to a specific POD on a given day.

### Intransit Qty
Quantity currently in transit from WH to POD (dispatched but not yet received).

### Cutoff DOH
DOH threshold configured in movement planning. PODs receive stock only if their projected DOH falls below this cutoff.

### Cutoff Actual
The actual DOH cutoff being applied after capacity adjustments. If `cutoff_actual < cutoff`, movement settings were tightened.

### Pod Enable
Binary flag (0/1) indicating if a POD is enabled for movement planning. `pod_enable = 0` means no movement plans generated for that POD.

### Movement Blocking
When `movement_rr = NULL` or `movement_rr = 0.001`, the SKU is blocked from movement to that POD.

---

## Capacity Constraints

### WH Capacity Issue
Warehouse cannot ship full planned quantity due to picking/dispatch capacity limits.

### POD Capacity Issue
POD cannot receive full planned quantity due to storage space limits.

### Stock Sufficiency Issue
Cold chain specific: WH doesn't have enough stock to fulfill all POD demands.

### Space Issue
Cold chain specific: POD freezer/cooler space constraint preventing receipt of planned quantity.

### QPL (Quantity Per Line)
Picker efficiency metric. Quantities may be reduced to maintain optimal picks per hour.

---

## ERP & Catalog

### ERP (Enterprise Resource Planning)
Master system for item configuration. Key fields from ERP region sheets:
- `ITEM CODE`: SKU identifier
- `City`: Geographic scope
- `TEMPORARY DISABLE FLAG`: Temp Disable, Block OTB, etc.
- `FRESH/NON-FRESH`: Fresh item indicator
- `DSD/WH`: Delivery model (WH-TCI for ambient, WH-SPAR for cold)

### ERP Issue
Item not present in ERP region sheet for a city (`erp_item_code IS NULL`).

### Temp Disable
Item temporarily disabled in ERP. Cannot be ordered or sold.

### Block OTB
Item blocked due to OTB budget constraints.

### Vinculum
Third-party Warehouse Management System (WMS) used for warehouse operations. Source of PO, GRN, and inventory data.

---

## Availability Metrics

### Availability %
```
Availability = Avail_Sessions / Total_Sessions
```
Percentage of customer sessions when the SKU was available at a POD.

### Avail Sessions
Number of customer sessions where the SKU was shown as available.

### Non-Avail Sessions
Number of customer sessions where the SKU was shown as unavailable (OOS).

### Total Sessions
Sum of available and unavailable sessions. Represents customer demand/interest in the SKU.

### Assortment
SKU classification by importance:
- **A**: Must-have SKUs (Bradman list)
- **MLT**: Multi-local/tail assortment
- **MnE**: Meat & Eggs

---

## Stock Status Classification

### WH_STOCK1 (Warehouse Stock Status)
Binary classification derived from DOH:
```sql
CASE
  WHEN DOH < 3 OR WH_STOCK < 10 THEN 'OOS'     -- Warehouse effectively empty
  WHEN DOH >= 3 THEN 'Instock'                  -- Warehouse has stock
END
```

This is the **primary branching point** for RCA:
- **OOS path**: Problem is in supply chain (procurement, vendor, planning)
- **Instock path**: Problem is in distribution (movement, POD ops, config)

---

## Delay Metrics

### Putaway Delay (POD)
Time between invoice receipt and putaway completion at POD. High delay = inventory sitting in staging, not sellable.

### WH Putaway Delay
Stock received at WH but not put away into free bins. Indicated by `free_doh < 3` while total DOH is higher.

### MP Delay Issue
Movement plan date is after the latest inward date at WH, indicating lag in planning response to new stock.

---

## Owner Categories

| Owner | Responsibility |
|-------|----------------|
| **Business** | Store operations, POD active/inactive status |
| **Catalog** | ERP configuration, item enablement, vendor codes |
| **Planning** | Demand forecasting, movement planning, run rates |
| **Procurement** | PO management, vendor fill rates, OTIF |
| **Cat M (Category Management)** | Contracts, OTB budgets, supplier relationships |
| **Warehouse** | WH operations, capacity, putaway, outbound fulfillment |
| **Pod Ops** | POD operations, space management, inward processing |

---

## Data Tables Reference

| Table | Purpose |
|-------|---------|
| `wh_item_level_doh_v2` | WH-level DOH calculations |
| `sku_wise_availability_rca_v7` | SKU×POD availability with all metrics joined |
| `sku_wise_availability_rca_with_reasons_v7` | Final table with RCA reasons assigned |
| `im_sku_day_avl` | Daily SKU availability at POD level |
| `mp_ambient_plan_30min` | Ambient movement planning data |
| `mp_cold_plan_30min` | Cold movement planning data |
| `im_erp_region_sheets_master` | ERP item configuration by city |
| `final_reason_mapping_avail_rca` | Reason code → bin → owner mapping |

---

## Waterfall Priority

The attribution system uses a **first-match-wins** approach. Reasons are checked in priority order, and the first matching condition determines the `final_reason`. This prevents double-counting and ensures single-owner accountability.

Example priority (OOS path):
1. POD Inactive → 2. ERP Disabled → 3. Temp Disable → 4. Fresh Items → 5. Long Term Supply → 6. Fill Rate Issue → ... → N. Catch-all

---

## Thresholds Summary

| Metric | Threshold | Interpretation |
|--------|-----------|----------------|
| DOH | < 3 days | WH effectively OOS |
| WH_STOCK | < 10 units | WH effectively OOS |
| Fill Rate | < 80% | Vendor underperformance |
| Last PO Fill Rate | < 50% | Acute supply problem |
| Pod Fill Rate | < 80% | WH outbound issue |
| Sales vs Movement RR | > 3× | Demand spike / forecast error |
| Free DOH | < 3 days | WH putaway delay |
| OTIF | > lead_time + 3 days | Late delivery |
