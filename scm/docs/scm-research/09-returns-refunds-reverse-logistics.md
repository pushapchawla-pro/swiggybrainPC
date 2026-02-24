# Swiggy Instamart Returns, Refunds & Reverse Logistics: Deep-Dive Research

## Executive Summary

This document covers the reverse logistics flow at Swiggy Instamart, including return order creation, DE assignment, POD quality checks, refund triggers, and inventory re-inventorization. Understanding this flow is critical for availability issue tree Branch 5 (Dark store-led) and Branch 7 (Other causes).

**Key Statistics:**
- ~0.5% of orders involve returns (projected 0.8% with "easy returns")
- Rs 1.5 average inventory value returned to pod
- 10% of returns are incorrect/lesser quantity
- ~₹20 crore/month Purchase Returns (PR) PAN India

---

## 1. Return Order Lifecycle

### 1.1 Return Order Creation

**Trigger Points:**
| Source | Scenario |
|--------|----------|
| **CRM (OneView)** | Customer complaint → agent creates return |
| **Self-Service** | Customer initiates return via app (limited categories) |
| **Auto-Return** | System-triggered for quality issues |

**Return Order States:**
```
CREATED → ASSIGNED → PICKED_UP → POD_RECEIVED → QC_COMPLETED → CLOSED
                ↓
           AUTO_CANCELLED (120 min timeout)
```

### 1.2 Return Order Data Model

**Key Fields:**
| Field | Description |
|-------|-------------|
| `return_order_id` | Unique identifier |
| `parent_order_id` | Original order reference |
| `items` | List of items to return |
| `return_type` | Full/Partial return |
| `refund_status` | Pending/Processed/Failed |
| `qc_status` | Pending/Passed/Failed |

### 1.3 Return SLAs

| Metric | SLA | Owner |
|--------|-----|-------|
| **Assignment** | 45 min | Heimdall |
| **Pickup** | 120 min | Trip Manager |
| **POD QC** | Same day | Store Manager |
| **Refund Processing** | Post-QC | instamart-post-order |

---

## 2. DE Assignment and Pickup

### 2.1 Assignment Logic

**Standard Flow:**
```
Return Order Created
       ↓
Heimdall evaluates available DEs
       ↓
Trip Manager assigns closest available DE
       ↓
DE receives return task notification
```

**Trusted DE Routing:**
| Condition | Action |
|-----------|--------|
| High-value items | Route to trusted DE cohort |
| Fraud-prone areas | Mandatory trusted DE |
| Repeat returners | Enhanced verification |

### 2.2 DE Task Workflow

**Steps:**
1. DE receives return task assignment
2. Navigate to customer location
3. Collect return items from customer
4. Capture image of items received
5. Transport to POD
6. Hand over to Store Manager

### 2.3 Assignment Challenges

**DE Stress Impact:**
- Assignment delays during high-demand periods
- Auto-cancellation after 120 min without pickup
- Result: Refund triggered but no item pickup

**Non-Terminal Order Issue:**
- Return order not closed properly
- Revenue leakage: Refund + Lost inventory
- Tracking: ff-watchdog monitors for auto-cancellation

---

## 3. POD Quality Check (QC)

### 3.1 QC Process

**Store Manager Workflow:**
```
DE Arrives at POD
       ↓
SM receives return handover
       ↓
Visual inspection of items
       ↓
Quantity verification
       ↓
Quality assessment
       ↓
Decision: Re-inventorize vs Unsellable
```

### 3.2 QC Decision Matrix

| Condition | Decision | Inventory Action |
|-----------|----------|------------------|
| Item in good condition | Re-inventorize | Add to Sellable bucket |
| Minor damage | Re-inventorize (discounted) | Add to Sellable (reduced MRP) |
| Expired | Unsellable | Move to Expired bucket |
| Damaged | Unsellable | Move to Damaged bucket |
| Wrong item | Unsellable | Move to Pilferage bucket |

### 3.3 Image-Based QC

**AI-Led QC:**
- Automated image analysis for standard cases
- Confidence scoring for decisions
- Escalation to agent for low-confidence

**Agent-Assisted QC:**
- Manual review for complex cases
- Training data for AI model improvement

### 3.4 QC Metrics

| Metric | Before | After |
|--------|--------|-------|
| **POD QC Adherence** | 77% | 84% |
| **Repeat IGCC Rate** | 3.00% | 2.21% |
| **CPO Impact** | - | Rs 0.76 savings |

---

## 4. Refund Processing

### 4.1 Refund Triggers

| Trigger | Timing | Condition |
|---------|--------|-----------|
| **Post-Pickup** | After DE picks up | Standard returns |
| **Immediate** | At order creation | Trust-based (high NPS customers) |
| **Post-QC** | After POD QC | High-value items |

### 4.2 Refund Types

| Type | Description |
|------|-------------|
| **Full Refund** | All items returned |
| **Partial Refund** | Subset of items returned |
| **Item-Level** | Per-item refund calculation |

### 4.3 Refund Flow

```
QC Decision Made
       ↓
instamart-post-order calculates refund
       ↓
Payment gateway processes refund
       ↓
Customer notified
       ↓
Return order closed
```

### 4.4 Refund Challenges

**Revenue Leakage Scenarios:**
| Scenario | Impact |
|----------|--------|
| Auto-cancellation | Refund issued, no item pickup |
| Non-terminal orders | Refund stuck, inventory not updated |
| DE no-show | Customer refunded, item not collected |

---

## 5. Inventory Re-inventorization

### 5.1 Re-inventorization Flow

**Post-QC for Good Items:**
```
QC Decision: Re-inventorize
       ↓
ILS receives inventory update
       ↓
Create new batch (or add to existing)
       ↓
Assign to appropriate location
       ↓
Update sellable quantity
```

### 5.2 Batch Assignment Logic

| Condition | Batch Action |
|-----------|--------------|
| Same expiry exists | Add to existing batch |
| New expiry | Create new batch |
| MRP changed | Create new batch (different MRP) |

### 5.3 Location Assignment

**FEFO Consideration:**
- Returned items may have earlier expiry
- System evaluates against current picking location
- May trigger location swap for FEFO compliance

### 5.4 Inventory Impact

| Metric | Impact |
|--------|--------|
| **DOI Increase** | Returned items add to inventory |
| **Wastage Risk** | Near-expiry returns may waste |
| **Availability** | Re-inventorized items become available |

---

## 6. Purchase Returns (PR) - Warehouse to POD

### 6.1 PR Overview

**Definition:** Items marked as missing or damaged during warehouse-to-POD transfer

**Volume:** ~₹20 crore/month (PAN India)

### 6.2 PR Root Causes

| Cause | Description |
|-------|-------------|
| **Wrong POD delivery** | LPNs shipped to incorrect POD |
| **Missed putaway** | Items not found during inwarding |
| **Lack of traceability** | No verification of actual shipment |
| **Manual errors** | Incorrect manifest selection |
| **Fraudulent marking** | PODs exploiting system gaps |

### 6.3 PR Reduction Initiatives

**LPN-Based Unloading (2024-2025):**
- Real-time LPN visibility before arrival
- Smart reconciliation flags missing LPNs
- Handshake between warehouse and PODs
- Impact: ₹1.2 lakh+ daily savings

**Central PR Approval Tool:**
- Careful review before approving PRs
- Instructions to inward pending material
- Reduced fraudulent/erroneous returns

**Manifest-Agnostic Inwarding:**
- Auto-identifies manifest from LPN scan
- Eliminates manual selection errors
- Reduces PR for new items

### 6.4 PR Workflow

```
Loader marks items missing during QC
       ↓
Store Manager raises PR via system
       ↓
Central team reviews for genuineness
       ↓
If Rejected: POD instructed to locate material
If Approved: Warehouse credited, POD debited
```

---

## 7. Systems and Integration

### 7.1 Core Systems

| System | Role |
|--------|------|
| **instamart-post-order** | Return order creation, refund triggers |
| **Trip Manager** | DE assignment, task status |
| **Heimdall** | Return order SLA (45 min) |
| **ff-watchdog** | Auto-cancellation (120 min) |
| **uoms** | Return order cart flow |
| **ILS** | Re-inventorization, batch management |
| **TnS** | Fraud detection for returns |

### 7.2 Integration Flow

```
CRM/App → instamart-post-order → Trip Manager → DE App
                                       ↓
                                 POD (IM Retail)
                                       ↓
                                     ILS
```

### 7.3 Data Sources

| Table | Purpose |
|-------|---------|
| `instamart-post-order` | Return orders, refunds |
| `Trip Manager tables` | DE assignment, status |
| `ILS tables` | Re-inventorization batches |
| `analytics.return_order_metrics` | Return analytics |

---

## 8. Fraud Detection

### 8.1 Return Fraud Types

| Type | Description |
|------|-------------|
| **Empty box** | Customer returns empty packaging |
| **Wrong item** | Different item returned |
| **Partial return** | Fewer items than claimed |
| **Serial returner** | Pattern of excessive returns |

### 8.2 Detection Mechanisms

**TnS Integration:**
- Fraud segment scoring for return orders
- Historical pattern analysis
- Real-time risk assessment

**Trusted DE Routing:**
- High-risk returns to verified DEs
- Enhanced pickup verification
- Image-based evidence collection

### 8.3 Prevention Measures

| Measure | Implementation |
|---------|----------------|
| Image capture | Mandatory at pickup |
| Weight verification | For applicable categories |
| Trusted DE | For high-value/high-risk |
| Return limits | Per customer thresholds |

---

## 9. Metrics and Dashboards

### 9.1 Key Metrics

| Metric | Definition |
|--------|------------|
| **Return Rate** | Returns / Orders |
| **Return Value** | Total value of returned items |
| **Re-inventorization Rate** | Re-inventorized / Total returns |
| **Refund TAT** | Time from return to refund |
| **QC Adherence** | % returns properly QC'd |

### 9.2 Tracking Dimensions

- By category (FnV, FMCG, etc.)
- By return reason (quality, wrong item, etc.)
- By customer segment (new, repeat, etc.)
- By POD and city

### 9.3 Dashboards

| Dashboard | Platform | Purpose |
|-----------|----------|---------|
| **Return Analytics** | Databricks | Return trends, patterns |
| **QC Tracking** | Retool | POD QC adherence |
| **PR Approval** | MIM | Purchase returns management |

---

## 10. RTV (Return to Vendor) Management

### 10.1 RTV Overview

**Definition:** Process of returning unsellable inventory back to suppliers for credit or replacement.

**Volume:** Significant portion of ~₹20 crore/month reverse logistics flow

### 10.2 RTV Workflow

```
Unsellable Inventory Identified
       ↓
Move to RTV_reserved bucket
       ↓
Batch RTV items by supplier
       ↓
Create RTV shipment
       ↓
Supplier pickup/dispatch
       ↓
Move to RTV_shipped bucket
       ↓
Credit note from supplier
```

### 10.3 RTV Eligibility Criteria

| Criteria | Requirement |
|----------|-------------|
| **Supplier Agreement** | RTV clause in contract |
| **Condition** | Manufacturing defect, not handling damage |
| **Expiry** | Within RTV window (varies by category) |
| **Documentation** | QC evidence, images |

### 10.4 RTV vs Liquidation Decision

| Factor | RTV | Liquidation |
|--------|-----|-------------|
| **Condition** | Defective but returnable | Near-expiry but sellable |
| **Credit** | Full credit from supplier | Partial recovery via discount sale |
| **Timeline** | Longer (supplier pickup) | Shorter (local sale) |
| **Preference** | Higher value items | Lower value/perishables |

**Liquidation Process Details:**

| Parameter | Value |
|-----------|-------|
| **Daily Task Limit** | 900 SKUs per day |
| **Value Cap** | Rs 10 lakhs per day |
| **Offer Window** | 9:00 PM - 11:59 PM IST |
| **FnV Special Rule** | Must liquidate before expiry, not after |
| **Discount Range** | 30-70% based on remaining shelf life |

**Liquidation Workflow:**
```
Unsellable Inventory (near-expiry)
       ↓
Move to Liquidation_reserved bucket
       ↓
Generate discounted price offers
       ↓
Publish to liquidation channel (9-11:59 PM)
       ↓
Customer purchase OR no sale
       ↓
If sold: Deduct from Liquidation_reserved
If unsold: Move to Disposed (next cycle)
```

### 10.5 RTV Automation

**Current State:**
- Manual identification of RTV-eligible items
- Batch processing via MIM dashboard
- Supplier notification via Vendor Portal

**Planned Improvements:**
- Auto-flagging of RTV candidates based on defect patterns
- Automated supplier claim generation
- RTV SLA tracking with escalations

### 10.6 RTV Data Sources

| Table | Purpose |
|-------|---------|
| `ILS inventory tables` | RTV_reserved, RTV_shipped buckets |
| `scm-invoicing` | Credit note tracking |
| `Vendor Portal` | Supplier RTV claim status |

---

## 11. Impact on Availability Issue Tree

### 11.1 Branch 5: Dark Store-Led

**Return-Related Causes:**
- Re-inventorized items increasing DOI
- Near-expiry returns causing wastage
- Storage space consumed by return processing

**Mitigation:**
- Quick QC turnaround
- Appropriate disposition decisions
- FEFO-compliant re-inventorization

### 10.2 Branch 7: Other Causes

**Return-Related Causes:**
- PR disputes affecting inventory records
- Non-terminal orders causing inventory mismatch
- Fraudulent returns impacting stock accuracy

**Mitigation:**
- LPN-based traceability
- Central PR approval
- Fraud detection integration

---

## 12. Key Document References

### Confluence
1. [IM Reverse QC 2.0 PRD](https://swiggy.atlassian.net/wiki/spaces/DASH/)
2. [Return Order Workflow](https://swiggy.atlassian.net/wiki/spaces/SII/)
3. [PR Approval Process](https://swiggy.atlassian.net/wiki/spaces/DASH/)

### Systems
- instamart-post-order service
- Trip Manager
- ff-watchdog
- ILS (Inventory Location Service)

---

## Summary

Returns and reverse logistics significantly impact inventory accuracy and availability at Instamart. Key aspects:

**Strengths:**
- Structured return order lifecycle
- POD QC improving re-inventorization quality
- LPN-based traceability reducing PR fraud
- Fraud detection integration

**Challenges:**
- Non-terminal orders causing revenue leakage
- DE stress leading to auto-cancellations
- Near-expiry returns contributing to wastage

**Key Metrics:**
- ~0.5% return rate (projected 0.8%)
- Rs 1.5 average return value
- ₹1.2 lakh+ daily savings from LPN unloading
- POD QC adherence: 84%

**Relevance to Brain MVP:**
- Returns impact inventory accuracy (Branch 5, 7)
- PR tracking critical for warehouse-POD reconciliation
- Re-inventorization affects available stock

---

*Document compiled from Glean research | December 2025*
*For Swiggy Brain Supply Chain Brain v0.1 MVP*
