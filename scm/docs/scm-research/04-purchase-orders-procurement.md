# Swiggy Instamart Purchase Orders and Procurement: Deep-Dive Research

## Executive Summary

This document provides comprehensive documentation on Swiggy Instamart's Purchase Order (PO) and Procurement processes, including DSD POs, Movement Planning POs, supplier management, fill rate tracking, and key challenges.

---

## 1. PO Types and Classification Logic

### 1.1 PO Classification Summary

| PO Type | Source | Destination | Trigger | Logistics |
|---------|--------|-------------|---------|-----------|
| **DSD (Direct Store Delivery)** | External Supplier | POD | Operations | Supplier-managed |
| **Movement Planning** | Swiggy Warehouse | POD | Analytics/Planning | Swiggy-managed |
| **OTB (Open to Buy)** | Supplier | Warehouse | Planned | Supplier-managed |
| **ADHOC** | Supplier | Warehouse | Unplanned | Supplier-managed |

### 1.2 Classification Logic

```
IF supplier is NOT a warehouse → DSD PO
IF source is warehouse AND job definition matches movement planning → Movement Planning PO
```

### 1.3 PO Number Format

- **DSD/WH PO**: `YYYYMMDD-STOREID-SUPPLIERID-SEQUENCE`
- **Movement Planning**: `YYYYMMDD-STOREID-SUPPLIERID`

**Note**: The `IM#` prefix has been removed from PO numbers. Format now uses lowercase store-id and supplier-id with a sequence number suffix.

---

## 2. DSD PO Workflow End-to-End

### 2.1 Step-by-Step Process

```
Step 1: File Upload (MIM Dashboard)
├── Contains: POD ID, Supplier Name, SKU, Quantity, Delivery Date, Cost, MRP
└── Metadata validation

Step 2: Job Submission
├── SubmitJob API request with File URL, Job Definition
└── Scan Reporting parses and validates file

Step 3: Order Type Classification
└── If supplier is not a warehouse → classified as DSD PO

Step 4: PO Creation
├── CreatePurchaseOrder RPC initiated
├── Persisted in: scm-procurement-po, scm-procurement-po-details
└── PO Number Format: YYYYMMDD-STOREID-SUPPLIERID

Step 5: Lifecycle Handling
├── Reminder Service manages PO activation and expiration
└── Typical expiry: 90 days from creation (7776000 seconds)

Step 6: File Generation
├── PDF and XML versions created
└── Files uploaded to S3 bucket

Step 7: Supplier Communication
├── Databricks job (runs every 30 minutes) scans new DSD POs
├── Scan Communication fetches PO files from S3
└── Sends PO (PDF/XML) to supplier via email
```

### 2.2 Email Template Includes

- PO details
- Delivery expectations
- Shelf life requirements (90%)

---

## 3. OTB and ADHOC Warehouse PO Workflow

### 3.1 Overview

OTB (Open to Buy) and ADHOC POs are raised by Swiggy warehouses to external suppliers/vendors. Unlike Movement Planning (Warehouse → POD), these POs bring inventory INTO the warehouse from external sources.

| PO Type | Use Case | Trigger |
|---------|----------|---------|
| **OTB** | Planned inventory replenishment | Scheduled/forecasted demand |
| **ADHOC** | Unplanned/emergency purchases | Stockouts, unexpected demand |

### 3.2 Key Finding: Manual Process with Human-in-the-Loop

- **OTB/ADHOC POs are NOT automated** (unlike Movement Planning)
- Operations team manually uploads files via MIM Dashboard
- Quantity recommendations may come from analytics, but PO creation is manual

### 3.3 Step-by-Step Workflow

```
Step 1: File Upload (MIM Dashboard)
├── Operations team uploads CSV/Excel file
├── Contains: Warehouse ID, Supplier ID, SKU, Quantity, Cost, MRP
└── File types: OTB Upload or ADHOC PO Upload

Step 2: Job Submission
├── MIM Dashboard calls SubmitJob API
└── Triggers scm-operations-batch-job

Step 3: PO Processing (scm-operations-batch-job)
├── Validates file format and data
├── Calls scm-procurement CreatePurchaseOrderFromOrderLineItems API
└── Handles enrichments and PO splitting

Step 4: PO Creation (scm-procurement)
├── Enriches PO data (supplier, warehouse, item, contract, tax, brand)
├── Splits POs by BrandCompanyId or BuyingPartyId
├── Creates PO in DRAFT state
├── Persisted in: scm-procurement-po, scm-procurement-po-details
└── PO Number Format: YYYYMMDD-STOREID-SUPPLIERID

Step 5: Vinculum Sync
├── Calls Vinculum API to create PO in warehouse WMS
├── On success: Updates PO state to CONFIRMED
└── Vinculum manages warehouse picking/dispatch

Step 6: Vendor Communication
├── PO PDF generated and sent to vendor via email
└── Vendor delivers goods to warehouse
```

### 3.4 Key Systems Involved

| System | Role |
|--------|------|
| **MIM Dashboard** | File upload interface for operations team |
| **scm-operations-batch-job** | Validates and processes uploaded files |
| **scm-procurement** | PO creation, enrichment, state management |
| **Vinculum** | Third-party WMS for warehouse operations |
| **scm-consumers** | Bulk upload, cancel, short close support |
| **scm-supplier-master** | Supplier data and city profile management |
| **scm-inbound-operations** | Audit capabilities, loader unloading flow |
| **Scan Reporting** | File parsing and validation service |

### 3.5 Automation Coverage

- **OTB/ADHOC**: ~100% manual (file upload driven)
- **Movement Planning**: ~45% automation coverage (per IM SCM QA Weekly TRM Metrics)
- Remaining ~55% requires manual intervention (new SKUs, special orders, exceptions)

### 3.6 Key Differences from Other PO Types

| Aspect | OTB/ADHOC | DSD | Movement Planning |
|--------|-----------|-----|-------------------|
| **Flow** | Supplier → Warehouse | Supplier → POD | Warehouse → POD |
| **Trigger** | Manual file upload | Manual file upload | Analytics-driven batch |
| **Vinculum Sync** | Yes (creates PO in WMS) | No | Yes (for tracking) |
| **Automation** | Manual | Manual | ~45% automated |

### 3.7 Data Sources

- `scm-procurement-po`: PO records with source type (OTB/ADHOC)
- MIM Dashboard upload logs: File upload history
- scm-operations-batch-job logs: Processing and validation details
- Vinculum: Warehouse-side PO state and GRN data

---

## 4. Movement Planning PO Workflow

### 4.1 Step-by-Step Process

```
Step 1: Input & Trigger
├── File uploaded via MIM Dashboard
├── Contains: Source (Warehouse), Destination POD, SKU details
└── SubmitJob API triggered

Step 2: File Processing & Classification
├── Scan Reporting validates and parses file
└── Classified as Movement Planning if source is warehouse

Step 3: PO Creation
├── CreatePurchaseOrder RPC triggers
└── Written to scm-procurement-po tables

Step 4: Lifecycle and System Sync
├── Reminder Service schedules expiration events
└── PO synced with Vinculum for warehouse tracking
```

### 4.2 Key Difference from DSD

- Integrates with Vinculum for warehouse operations
- No vendor email communication required
- Analytics-driven triggers vs manual DSD

### 4.3 Automated PO Logic

**Automation Methods:**

| Method | Trigger | Coverage | Description |
|--------|---------|----------|-------------|
| **Batch Jobs** | Scheduled (daily/hourly) | Movement Planning | Analytics-driven replenishment from warehouse to POD |
| **MIM File Upload** | Manual trigger | DSD/Movement | Bulk PO creation via file upload |
| **API-Triggered** | System event | Real-time | Programmatic PO creation based on inventory thresholds |

**Automated PO Triggers:**
- **DOH Threshold**: When Days-on-Hand falls below configured threshold (e.g., <3 days)
- **Forecast-Driven**: DS pipeline generates quantity recommendations for next-day demand
- **Safety Stock Breach**: When inventory drops below safety stock level
- **Replenishment Cycle**: Regular scheduled replenishment for high-velocity SKUs

**Automation Coverage:**
- ~45% of Movement Planning POs are automated (per IM SCM QA Weekly TRM Metrics)
- ~55% require manual intervention (new SKUs, special orders, exceptions)
- DSD POs remain largely manual due to supplier coordination requirements

**Recent Enhancements (2024-2025):**
- **PO Splitter**: New DAG `IM_MP_PO_Splitter` for floor-level splitting in warehouses
- **Seller Derivation Logic**: Automatic determination of appropriate seller for each PO
- **Idempotency Check**: Added for Movement Planning POs to prevent duplicates (CMR-154715)

**Brain MVP Opportunity:**
AI agents can trigger POs by:
1. Detecting availability anomalies before DOH threshold breach
2. Recommending emergency POs for high-demand events
3. Bypassing MOQ constraints via POD clubbing suggestions
4. Alerting procurement teams to stuck/delayed POs

**Data Sources:**
- `scm-procurement-po`: PO creation logs with trigger source
- `movement-planning` Databricks tables: Quantity recommendations
- `analytics_adhoc.po_automation_metrics`: Automation coverage tracking

---

## 5. Supplier Tiers and Management

### 5.1 Supplier Categories

| Type | Description | Example |
|------|-------------|---------|
| **Primary** | Main/preferred suppliers | Nestle for Maggi |
| **Secondary** | Backup providers | Alternative distributor |

### 5.2 Supplier vs. Seller Distinction

| Role | Direction | Description |
|------|-----------|-------------|
| **Supplier** | Upstream (Producer) | Provides products to Swiggy |
| **Seller** | Downstream (Consumer) | Lists products on Instamart |

### 5.3 Supplier Onboarding Data

- Contact details (email, phone)
- Tax details (GST, PAN)
- Address information
- FSSAI certificates for food categories
- Communication email IDs for RTV/Liquidation/PR
- OTP validation requirements

---

## 6. Procurement Constraints (MOQ/MOV)

### 6.1 Load Constraints Impact

| Constraint | Description |
|------------|-------------|
| **Case Size** | Minimum case quantity |
| **MOQ (Minimum Order Quantity)** | Minimum units per order |
| **MOV (Minimum Order Value)** | Minimum order value |
| **Tonnage** | Weight constraints |

**Impact**: Higher constraint % = more availability impact as POs won't get raised

### 6.2 Replenishment Frequency

```
Metric = (Count of PO raising days in week) / 7
Higher frequency = Lower working capital requirement
```

**Constraint Impact**: ~7-8% of cases where automated planning doesn't apply

### 6.3 MOQ/MOV Workarounds

**PO Clubbing Solution:**
- Day-level validation aggregates same-day POs before validating MOQ/MOV limits
- Multiple PODs can be clubbed to meet minimum thresholds
- Centralized MOQ/MOV validation logic ensures consistent enforcement

**Implementation Details:**
- `CreateFCAppt` API includes day-level checks for MOV/MOQ-enabled POs
- Validation aggregates all same-day purchase orders before limit check
- Source: [CreateFCAppt - MOV/MOQ day level checks](https://github.com/swiggy-private/scm-procurement/pull/853)

---

## 7. Fill Rate Tracking (Summary)

> **Detailed Reference**: See `10-supplier-performance-fill-rate.md` for comprehensive fill rate metrics, supplier scoring, booking portal integration, and improvement initiatives.

### 7.1 Key Fill Rate Metrics

| Metric | Formula | Use Case |
|--------|---------|----------|
| **UFR** | Qty received / Qty requested | Volume tracking |
| **LFR** | 100% filled lines / Total lines | SKU-level fulfillment |
| **NZFR** | 1 - (Zero fill lines / Total) | Supplier engagement |
| **OTIF** | Fill=100% AND on-time | Primary SLA metric |

### 7.2 Procurement-Specific Fill Rate Issues

| Issue | Impact on PO |
|-------|--------------|
| Low fill rate | Repeat POs needed, availability gaps |
| MOQ/MOV blocking | POs can't be raised (~7-8% of cases) |
| System sync failures | Duplicate POs inflate metrics by ~1.7% |
| Vinculum failures | Warehouse fill rate degradation |

### 7.3 Causes Relevant to Procurement

1. MOQ/MOV constraints preventing order placement
2. PO sync failures between MIM and Vinculum
3. Duplicate PO creation during retries
4. Supplier capacity constraints (see doc 10 for supplier performance)

---

## 8. Invoice and Payment Processes

### 8.1 DSD Invoice Process

```
Flow:
1. Gatepass Initiation (Security guard via IM Retail App)
2. SM Approval (DSD requires manual; WH auto-approves)
3. Invoice Details Entry (invoice number, total amount, freight)
4. Item Digitization (scan items, expiry, quantity, cost, QC)
5. OTP Validation (driver OTP for RTV approval)
6. Invoice Creation (OPEN state)
7. Document Generation (PDF to S3)
```

### 8.2 Invoice Digitization with AI

**Problem**: Manual entry for DSD invoices (30-40 line items) takes 20+ minutes

**Solution**: AWS Textract + LLM (GPT-4)
- Extracts summary and item details from PDF
- Fuzzy matches invoice items to PO items
- SM reviews and corrects extracted data
- Reduces manual effort significantly

### 8.3 Warehouse Invoice Process (Vinculum Callback)

```
Flow:
1. PO created in both MIM and Vinculum
2. Warehouse receives goods, creates invoice in Vinculum
3. Vinculum sends callback to MIM via HAProxy
4. Callback triggers:
   ├── Invoice draft state creation
   ├── Inwarding job creation
   └── Task generation for putaway
```

**Callback Endpoint**: `https://externalha-mimvin.in-west.swig.gy/inwarding/api/v1/invoiceDetails`

### 8.4 Key Tables

- `scm-procurement-invoice`
- `scm-procurement-invoice-details`

---

## 9. Key Challenges in Procurement

### 9.1 System-Level Challenges

| Challenge | Description | Impact |
|-----------|-------------|--------|
| **Data Sync Issues** | PO states inconsistent between Vinculum and MIM | Duplicate POs during retries |
| **Vinculum Latency** | APIs experiencing up to **600 seconds** (10 min) timeouts | Movement planning delays, catalog sync disruption |
| **Duplicate POs** | Idempotency checks now implemented (Nov 2025) | Previously caused multiple POs |
| **Master Data Quality** | Incorrect brand company mappings | Blocks go-live |
| **Invoice Callback Delays** | Vinculum callbacks delayed by hours | Inwarding and GRN delays |

**Recent Incidents (2024-2025):**
| Date | Incident | Impact | Resolution |
|------|----------|--------|------------|
| 2025-12-11 | [Delayed Invoice Callbacks from Vinculum](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5405999105) | 3-hour delay in invoice callbacks | Vinculum-side fix |
| 2025-07-24 | [Incorrect MRP Inwarding](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4798644247) | Data quality issues | Increased batch job concurrency |
| 2025-04-28 | [Vinculum APIs high latencies](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4611408146) | Up to 600s latency on vendorCreate | API connection fixes |

### 9.2 Duplicate PO Solution

**Implemented**: Hash-based idempotency with DynamoDB (November 2025)

**Hash Generation:**
- Algorithm: SHA256 with Base64 encoding
- Fields used: `StoreId`, `SupplierId`, `DeliveryDate`, `SkuDetails`
- Primary key format: `PO_IDEM#<SHA256-Base64-Hash>`

**Configuration:**
- 30-day TTL for automatic cleanup
- "Skip Duplicate Check" flag for override scenarios (e.g., B2B sales, certain Movement Planning POs)

**Source**: [po_idempotency.go](https://github.com/swiggy-private/scm-procurement/blob/master/internal/app/procurement/service/po_idempotency/po_idempotency.go)

### 9.3 Operational Challenges

| Challenge | Impact |
|-----------|--------|
| **DSD Invoice Digitization** | 20+ minutes per invoice |
| **RTV Identification** | Manual identification leads to missed opportunities |
| **Gatepass Management** | Security → SM coordination required |
| **Paper Trail Issues** | Shipment disputes from lack of documentation |
| **Email Automation Delays** | 30-minute lag in PO to vendor |

### 9.4 Capacity and Planning Issues

| Challenge | Impact |
|-----------|--------|
| **PO Expiry** | ~4K POs expire nightly |
| **Warehouse Capacity** | POD partitions disrupt picking |
| **Fill Rate Variability** | 25-30% swings disable automated planning |

### 9.5 Compliance and Documentation

| Challenge | Impact |
|-----------|--------|
| **License Management (Gamma)** | 3-4 month lead time for licenses |
| **Audit Trail** | Signed delivery challan often missing |
| **GRN Documentation** | Paper trail disputes with vendors |

### 9.6 Technical Debt

| Challenge | Impact |
|-----------|--------|
| **Vinculum Lock-in** | Critical dependency |
| **CDC Data Sync Lag** | Affects real-time operations |
| **Multiple Source Systems** | PO data across 24+ systems |
| **Batch Job Failures** | OOM for large datasets |

---

## 10. Key Document References

### Core Documentation
1. [DSD and Movement Planning PO](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4626547115)
2. [SCM Procurement Terminology](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4639916695)
3. [OTB PO Workflows](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/5228527685)
4. [Invoice Digitization LLD](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4766499080)
5. [DSD PO AutoEmailer](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4650762389)

### Technical Implementation
6. [PO Idempotency Solution](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4901961782)
7. [PO State Inconsistency](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4998201909)
8. [Movement Planning Portal](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4701618453)
9. [Vendor Portal](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4250173888)
10. [Movement Planning DSD PO](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/5083858402)
11. [PO systems <> Inbound systems interactions](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/5340070111)
12. [Manifest agnostic inwarding](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4650697585)

### GitHub References
13. [po_idempotency.go](https://github.com/swiggy-private/scm-procurement/blob/master/internal/app/procurement/service/po_idempotency/po_idempotency.go)
14. [CreateFCAppt - MOV/MOQ day level checks](https://github.com/swiggy-private/scm-procurement/pull/853)
15. [IM SCM QA Weekly TRM Metrics](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/5036048463)

### Operational Guides
16. [Procurement Prod Testing SOP](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/5083891298)
17. [ProdSupport Debugging Steps](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3447816311)

### Incident Reports (RCAs)
18. [2025-04-28 - Vinculum APIs high latencies](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4611408146)
19. [2025-07-24 - Incorrect MRP Inwarding](https://swiggy.atlassian.net/wiki/spaces/SII/pages/4798644247)
20. [2025-12-11 - Delayed Invoice Callbacks](https://swiggy.atlassian.net/wiki/spaces/SII/pages/5405999105)

### Planning and Automation
21. [Instamart PO Planning](https://swiggy.atlassian.net/wiki/spaces/DSmfpdriver/pages/3757769187)
22. [RTV Automation](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4598497291)

### Related Documents
23. [Supplier Performance & Fill Rate (doc 10)](10-supplier-performance-fill-rate.md) - Detailed fill rate metrics, supplier scoring, booking portal

---

*Document verified and enhanced via Glean research | December 2025*
*For Swiggy Brain Supply Chain Brain v0.1 MVP*
