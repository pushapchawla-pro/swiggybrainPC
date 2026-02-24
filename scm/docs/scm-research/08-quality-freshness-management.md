# Swiggy Instamart Quality & Freshness Management: Deep-Dive Research

## Executive Summary

This document covers quality control and freshness management systems at Swiggy Instamart, including FnV (Fruits & Vegetables) expiry management, FEFO enforcement, POD-level quality checks, and integration with the availability issue tree (Branch 5: Dark store-led, Branch 7: Other causes).

**Key Systems:**
- FnV Expiry Management with dynamic expiry calculation
- FEFO (First Expiry First Out) enforcement with picker nudges
- POD QC for returned items and inwarding
- Quality issue categorization via IGCC data

---

## 1. FnV Expiry Management System

### 1.1 Dynamic Expiry Calculation

**Formula:**
```
expiry_date = packaging_date + shelf_life - 1
```

**Key Components:**
- **Packaging Date**: Extracted from dynamic barcodes during inwarding
- **Shelf Life**: Sourced from Catalog service (master data)
- **CX Cutoff Date**: `expiry_date - sellable_shelf_life_days`

**Barcode Formats:**
| Format | Pattern | Example |
|--------|---------|---------|
| **Without Serial** | `a_itemcode_DD-MM-YYYY` | `a_123456_25-12-2025` |
| **With Serial** | `b_itemcode_DD-MM-YYYY_serialNumber` | `b_123456_25-12-2025_001` |

### 1.2 Shelf Life Configuration

**Configuration Source:** Catalog service (source of truth)

**Key Fields:**
| Field | Description |
|-------|-------------|
| `shelf_life` | Total days from packaging to expiry |
| `sellable_shelf_life` | Days item can be sold to customers |
| `inwarding_cutoff` | Minimum days remaining at inwarding |
| `cx_cutoff` | Customer-facing cutoff threshold |

### 1.3 FnV Master Module

**Purpose:** City x SPIN level MRP management for fresh items

**Capabilities:**
- Dynamic MRP updates based on market conditions
- Seller recommendation flows
- Quality-based pricing adjustments
- Integration with movement planning

**Config:** `FNV_EXPIRY_ENABLED_STORES`

### 1.4 FnV Expiry V2 (November 2025)

**Purpose:** Single source of truth for FnV expiry calculation

**Key Changes:**
- Unified expiry calculation across all systems (ILS, Control Room, Picking)
- Eliminated discrepancies between POD and warehouse expiry tracking
- Real-time sync with Catalog service shelf life updates

**Architecture:**
```
Catalog Service (shelf_life master)
       ↓
FnV Expiry Calculator (centralized)
       ↓
├── ILS (batch expiry)
├── Control Room (availability rules)
├── Picker App (FEFO enforcement)
└── Wastage Dashboard (expiry tracking)
```

**Impact:**
- Reduced expiry-related OOS by eliminating system mismatches
- Improved FEFO compliance accuracy
- Single point of control for shelf life changes

---

## 2. FEFO (First Expiry First Out) Enforcement

### 2.1 Picking Location Strategy

**Zoning Implementation (2024):**
- **Picking Locations**: Earliest expiring batches
- **Putaway Locations**: Non-earliest batches
- Automatic assignment during putaway based on expiry

**Benefits:**
- Ensures customers receive freshest possible items
- Reduces wastage from expired inventory
- Accurate tracking of expiry movements

### 2.2 Picker Nudge System

**Mechanism:**
1. Picker scans item location
2. System checks if scanned batch is earliest expiry
3. If not earliest, shows "Fresher batch available" nudge
4. Picker can bypass after 2 nudges with SM approval

**Configuration:**
| Config | Default | Description |
|--------|---------|-------------|
| `FEFO_NUDGE_COUNT` | 2 | Number of nudges before bypass allowed |
| `FEFO_ENABLED_STORES` | [store_ids] | Stores with FEFO enforcement |

### 2.3 Batch Management Rules

**Unique Batch Definition:**
```
Batch = SKU + Expiry Date + Location + MRP + Seller
```

**Location Rules:**
- Maximum 4 locations per SKU (3 putaway, 1 picking)
- One location per distinct expiry batch (FEFO-tracked items)
- First expiry batch → Picking location
- Subsequent batches → Putaway locations

### 2.4 Stock Replenishment Tasks

**Purpose:** Move inventory from putaway to picking locations

**Triggers:**
- Picking location inventory falls below threshold
- Only for SKUs in replenishment list (~100-150 items/POD)

**Priority Order:**
1. Starved picking jobs
2. Extremely delayed picking jobs
3. FCFS (replenishment vs orders by creation time)

**Config:** `REPLENISHMENT_ENABLED_STORES`

---

## 3. Quality Control at POD Level

### 3.1 Inwarding QC

**Process:**
```
Goods Arrival → Visual Inspection → Quantity Check → Expiry Validation → Temperature Check (cold chain) → GRN Approval
```

**Acceptance Criteria:**
| Check | Threshold |
|-------|-----------|
| MRP Deviation | 90% of catalog MRP |
| Minimum Shelf Life | Per category configuration |
| Physical Condition | No visible damage |
| Temperature | Within category range |

### 3.2 POD QC for Returns

**IM Reverse QC 2.0 Process:**

**Step 1: Return Pickup**
- DE picks up returned item from customer
- Image capture at pickup

**Step 2: POD QC by Store Manager**
- Visual inspection of returned item
- Quality assessment
- Decision: Re-inventorize vs Unsellable

**Step 3: Disposition:**
| Decision | Action |
|----------|--------|
| **Re-inventorize** | Add back to sellable inventory |
| **Unsellable** | Move to damage/expiry/pilferage bucket |

**Impact Metrics:**
- POD QC adherence: 77% → 84%
- Repeat IGCC on re-inventorized items: 3.00% → 2.21%
- CPO gains: Rs 0.76 per order

### 3.3 AI-Assisted QC (IM Reverse QC 2.0)

**Two-Track System:**

| Track | Trigger | Process |
|-------|---------|---------|
| **AI-Led QC** | Confidence > 80% | Auto-disposition based on image analysis |
| **Agent-Led QC** | Confidence < 80% OR flagged categories | Manual review in CRM tool |

**AI-Led QC Details:**
- ML model trained on 500K+ return images
- Categories: Packaging damage, seal broken, wrong item, expired
- Auto-disposition: Re-inventorize OR Unsellable
- Real-time feedback loop for model improvement

**Agent-Led QC Details:**
- Queue-based assignment to QC agents
- Image + order context displayed
- Decision: Re-inventorize / Damaged / Expired / Pilferage
- SLA: Same-day QC completion
- Escalation path for disputes

**QC 2.0 Performance (Dec 2025):**
| Metric | Value |
|--------|-------|
| AI Auto-Disposition Rate | ~65% |
| Agent QC Accuracy | 94% |
| POD QC Adherence | 84% (up from 77%) |
| Repeat IGCC on Re-inventorized | 2.21% (down from 3.00%) |

### 3.4 High-Value Item QC

**Special Handling:**
- Items above configured value threshold
- Mandatory image capture during picking
- Enhanced verification at POD exit
- Trusted DE routing for returns

---

## 4. Quality Issue Categorization (IGCC)

**IGCC = Instamart Grade and Color Coding** - The quality complaint categorization system used to classify customer-reported issues.

### 4.1 Issue Categories

**L1 Categories:**
| Category | Description |
|----------|-------------|
| **Expiry** | Item past expiry or near-expiry |
| **Packaging** | Damaged/torn packaging |
| **Quality** | Product quality issues (taste, smell, appearance) |

### 4.2 FnV vs Non-FnV Handling

| Aspect | FnV | Non-FnV |
|--------|-----|---------|
| **Expiry Issues** | Mapped to Quality/Packaging | Standard expiry handling |
| **Shelf Life** | Dynamic (packaging date based) | Static (catalog based) |
| **QC Frequency** | Higher (perishable) | Standard |

### 4.3 IGCC Data Sources

**Primary Tables:**
- `tns_fna_fact_igcc`: Quality complaints and categorization
- `analytics.public.im_igcc_summary`: Aggregated metrics

**Key Fields:**
- Issue category (L1/L2)
- Fraud segment scoring
- Resolution status
- Refund/replacement outcome

---

## 5. Wastage Management

### 5.1 Wastage Categories

| Type | Description | Bucket |
|------|-------------|--------|
| **Expired** | Past CX cutoff, no RTV/Liquidation | `Expired` |
| **Damaged** | Spoiled, mishandled, defective | `Damaged` |
| **Pilferage** | Physical count < system inventory | `Pilferage` |

### 5.2 Auto-Unsellable Timing

**Trigger:** Daily cron job at 11:50 PM IST marks items as unsellable when they cross their CX cutoff date

**Process:**
```
CX Cutoff Date Reached → 11:50 PM Cron Job → Auto-mark Unsellable → Disposition Decision
```

**Note:** The CX cutoff date = expiry_date - sellable_shelf_life_days. Items are NOT sellable to customers beyond this date even if not technically expired.

### 5.3 Disposition Paths

| Path | Criteria | Outcome |
|------|----------|---------|
| **RTV (Return to Vendor)** | Vendor agreement, quality defect | Credit from vendor |
| **Liquidation** | Near-expiry, discountable | Sold at reduced price |
| **Disposal** | Expired, damaged beyond use | Physical disposal |

### 5.4 FnV Dual Dispatch Impact

**Pilot Results (Chennai):**
| Metric | Improvement |
|--------|-------------|
| **Availability** | +6 percentage points |
| **Expiry Wastage** | -2.5 percentage points |

**Mechanism:**
- Two dispatch slots per day vs single daily dispatch
- Fresher inventory at POD
- Reduced shelf time before sale

---

## 6. Quality Metrics and Dashboards

### 6.1 Key Quality Metrics

| Metric | Definition |
|--------|------------|
| **Wastage CPO** | wastage_value / orders |
| **Wastage % of GMV** | (wastage_value / GMV) * 100 |
| **IGCC Rate** | Quality complaints / orders |
| **POD QC Adherence** | % returns properly QC'd |
| **FEFO Compliance** | % picks from earliest expiry batch |

### 6.2 Data Sources

| Table | Purpose |
|-------|---------|
| `analytics.public.im_wastage_damage_sub_disp` | Wastage by disposition |
| `analytics.public.im_wastage_report_sub_disp` | Detailed wastage reports |
| `analytics.public.MIM_WASTAGE_v1` | MIM wastage tracking |
| `tns_fna_fact_igcc` | Quality complaints |

### 6.3 Dashboards

| Dashboard | Platform | Purpose |
|-----------|----------|---------|
| **Wastage Marking** | Retool | Disposition categorization |
| **Mark Unsellable** | Retool | Category/storage filters |
| **RTV/Liquidation** | Retool | Return to vendor tracking |

---

## 7. Impact on Availability Issue Tree

### 7.1 Branch 5: Dark Store-Led

**Quality-Related Causes:**
- Expired items blocking shelf space
- Damaged inventory reducing sellable DOI
- Poor FEFO compliance leading to wastage

**Mitigation:**
- Stock replenishment tasks for FEFO adherence
- Auto-unsellable triggers
- POD QC for returns

### 7.2 Branch 7: Other Causes

**Quality-Related Causes:**
- Supplier quality issues (defective batches)
- Storage condition failures (temperature excursions)
- Handling damage during picking/delivery

**Mitigation:**
- Inwarding QC with rejection capability
- Cold chain monitoring
- High-value item verification

---

## 8. Integration Points

### 8.1 Systems Integration

| System | Integration |
|--------|-------------|
| **scm-task-manager** | FnV expiry configs, putaway tasks |
| **Catalog Service** | Shelf life master data |
| **ILS** | Batch/expiry tracking, location management |
| **IGCC** | Quality complaint categorization |

### 8.2 Config Platform Flags

| Config | Purpose |
|--------|---------|
| `FNV_EXPIRY_ENABLED_STORES` | FnV expiry management |
| `FEFO_ENABLED_STORES` | FEFO enforcement |
| `REPLENISHMENT_ENABLED_STORES` | Stock replenishment |
| `POD_QC_ENABLED_STORES` | Return QC at POD |

---

## 9. Key Document References

### Confluence
1. [Stock Replenishment Task Workflow](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4178805093)
2. [RTV, Liquidation & Wastage Management v2](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3786022404)
3. [IM Reverse QC 2.0 PRD](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/)

### Data Tables
- `analytics.public.im_wastage_damage_sub_disp`
- `analytics.public.im_wastage_report_sub_disp`
- `tns_fna_fact_igcc`

---

## Summary

Quality and freshness management is critical for Instamart's 10-minute grocery promise, especially for perishable categories. Key systems include:

**Strengths:**
- Robust FEFO enforcement with picker nudges
- Dynamic FnV expiry management
- POD QC for returns reducing repeat complaints
- Stock replenishment for freshness maintenance

**Key Metrics:**
- POD QC adherence: 84%
- FnV Dual Dispatch: +6pp availability, -2.5pp wastage
- Repeat IGCC reduction: 3.00% → 2.21%

**Relevance to Brain MVP:**
- Directly impacts Branch 5 (Dark store-led) and Branch 7 (Other causes)
- Quality issues contribute to customer complaints and availability perception
- Integration with RCA for quality-driven stockouts

---

*Document compiled from Glean research | December 2025*
*For Swiggy Brain Supply Chain Brain v0.1 MVP*
