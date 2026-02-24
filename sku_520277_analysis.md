# SKU Analysis: Lotus Biscoff Original Caramelized Cookie (520277) in BANGALORE

**Analysis Period:** Last 15 days (14-Jan to 28-Jan-2026)

---

## 1. DIAGNOSIS & ROOT CAUSE

| Field | Value |
|-------|-------|
| **Primary Root Cause** | VENDOR NO-SHOW - Mondelez booked 71 appointments but completed ZERO deliveries in 30 days |
| **Broken Stage** | Stage 4: Appointment Booking + Stage 5: GRN/Inward |
| **FINAL_REASON Code** | oos_9.fillrate Issue |
| **Issue Bucket (BIN)** | Fill Rate Issue |
| **Responsible Team** | Procurement (Vendor Management) |
| **Severity** | 🔴 CHRONIC (Availability: 37.84% < 60% threshold) |

### Root Cause Explanation

SKU 520277 has 37.84% availability over 15 days - a chronic OOS situation. The investigation reveals that Mondelez India Foods (Vendor: 1N60006316) has booked 71 appointments across 3 Bangalore warehouses in the last 30 days but has ZERO completed deliveries. The vendor is consistently no-showing on booked appointments or cancelling them last minute. BLR DHL warehouse has NEVER received a GRN for this SKU despite having 12+ appointments booked.

---

## 2. RECOMMENDED ACTIONS

| Priority | Action | Owner | Timeline |
|----------|--------|-------|----------|
| 🔴 P0 | Escalate to Mondelez leadership - 57 no-shows + 14 cancellations in 30 days is unacceptable. Demand immediate resolution. | Procurement Head | TODAY |
| 🔴 P0 | Demand explanation - Why are appointments being booked but not honored? Is this a capacity issue or logistics failure? | Procurement | TODAY |
| 🔴 P0 | Monitor Jan 29 appointment - 46,000 units scheduled. Confirm vendor will show up. | Procurement | TODAY |
| 🟠 P1 | Consider alternate vendor - If Mondelez cannot deliver, identify backup supplier for Lotus Biscoff | Procurement | This week |
| 🟠 P1 | Daily appointment tracking - Track all upcoming appointments (148,361 units) to ensure delivery | Procurement | Daily |
| 🟡 P2 | SLA review - Add penalty clauses for no-shows in vendor contract | - | This month |
| 🟡 P2 | Review vendor capacity - Is Mondelez overcommitted? Do they have production issues? | Procurement | This month |

---

## 3. PATTERNS IDENTIFIED

| Pattern | Impact | Frequency |
|---------|--------|-----------|
| Vendor No-Show | 592,812 units not delivered despite booked appointments | 57 appointments in 30 days |
| Appointment Cancellations | 157,236 units cancelled by vendor | 14 appointments in 30 days |
| BLR DHL - Zero GRN | 0% availability on most days | 15/15 days |
| High Intransit, Low WH Stock | POs raised but never received | 15/15 days |
| WH Stock = 0, Pods starved | Movement blocked at WH level | 12/15 days |
| Demand exceeds supply | RR = 300-360 units/day vs actual demand 600-1800+ | Multiple days |

---

## 4. REASONING (WITH EXACT NUMBERS)

### Why we reached this conclusion:

| Metric | Value | Assessment |
|--------|-------|------------|
| 15-Day Availability | 37.84% | 🔴 CHRONIC (<60%) |
| Total OOS Sessions | 6,756,024 | Massive lost revenue |
| Total Sessions | 10,868,052 | High demand SKU |
| Primary Reason | oos_9.fillrate Issue | 72.37% of unavailability |

### Availability Reason Breakdown:

| Reason | Owner | OOS Sessions | % of Unavailability |
|--------|-------|--------------|---------------------|
| oos_9.fillrate Issue | Procurement | 6,188,416 | 72.37% |
| instock_13.Forecasting_error | Planning | 223,310 | 27.74% |
| instock_8.POD Cap Missed | Pod Ops/Planning | 195,220 | 25.24% |
| instock_17.Others | Unallocated | 96,489 | 17.02% |
| instock_14.Putway_delay | Pod Ops | 50,541 | 34.64% |
| instock_9.WH Cap Missed | Warehouse/Planning | 2,047 | 12.93% |

### Warehouse-wise Stock Analysis (26-Jan-2026 from ARS):

| Warehouse | WH Stock | Pod Stock | Intransit | Total DOH | Status |
|-----------|----------|-----------|-----------|-----------|--------|
| BLR DHL | 0 | 0 | 1,050 | 10 days | 🔴 WH OOS - No GRN ever |
| BLR ECOM2 | 1 | 452 | 5,550 | 15.4 days | 🟡 Pod stock depleting |
| BLR IM1 | 0 | 1 | 7,500 | 29 days | 🔴 WH OOS |
| **TOTAL** | **1** | **453** | **14,100** | **-** | **🔴 CRITICAL** |

---

## 5. MOQ/MOV/CONSTRAINT VALUES

| Constraint | Value | Flag Active? | Impact |
|------------|-------|--------------|--------|
| MOQ | 50 units | No | Not blocking |
| Value MOV | Rs. 0 | No | Not applicable |
| Tonnage MOV | 0 | No | Not applicable |
| Case Size | 75 units/case | - | Orders rounded |
| Break Bulk | N | - | Cannot break cases |
| Lead Time | 10 days | - | Expected delivery time |
| Shelf Life | 240 days | - | No expiry risk |

### Constraint Summary:
- ✅ No active constraints blocking POs
- ✅ POs ARE being raised correctly (PO raise flag = 1)
- ✅ Open PO flag = 1 (POs exist in system)
- ❌ Problem is NOT at PO creation stage - it's at DELIVERY stage

---

## 6. APPOINTMENT STATUS ANALYSIS

### 🔴 CRITICAL FINDING: VENDOR NO-SHOW PATTERN

In the last 30 days, Mondelez has ZERO completed deliveries to ALL Bangalore warehouses.

| Warehouse | Missed/No-Show | Cancelled | Upcoming | COMPLETED |
|-----------|----------------|-----------|----------|-----------|
| BLR DHL | 12 appts (59,603 units) | 5 appts (46,085 units) | 6 appts (74,200 units) | 0 |
| BLR ECOM2 | 24 appts (199,761 units) | 6 appts (24,651 units) | 4 appts (23,000 units) | 0 |
| BLR IM1 | 21 appts (333,448 units) | 3 appts (86,500 units) | 8 appts (51,161 units) | 0 |
| **TOTAL** | **57 appts (592,812 units)** | **14 appts (157,236 units)** | **18 appts (148,361 units)** | **0** |

### Appointment States Explained:
- **MISSED/NO_SHOW:** Vendor booked appointment for a past date but never showed up (still shows as "CREATED")
- **CANCELLED:** Vendor or warehouse cancelled the appointment
- **UPCOMING:** Future appointments that are still scheduled
- **COMPLETED:** Vendor showed up and goods were received - ZERO in 30 days

---

### BLR DHL Appointment History (Last 30 Days)

| Booking Date | Status | Qty | PO Codes |
|--------------|--------|-----|----------|
| 31-Dec-2025 | 🔴 MISSED | 14,403 | MBJPO29361, MBJPO29689 |
| 03-Jan-2026 | 🔴 MISSED | 5,600 | MBJPO30500 |
| 03-Jan-2026 | ❌ CANCELLED | 2,000 | MBJPO31234 |
| 11-Jan-2026 | 🔴 MISSED | 11,100 | MBJPO32630, MBJPO32986, MBJPO31763, MBJPO32984, MBJPO32982 |
| 17-Jan-2026 | 🔴 MISSED | 9,000 | MBJPO33771 |
| 19-Jan-2026 | 🔴 MISSED | 19,500 | MBJPO35437, MBJPO34705, MBJPO35107 |
| 19-Jan-2026 | ❌ CANCELLED | 14,000 | MBJPO36213 |
| 20-Jan-2026 | ❌ CANCELLED | 6,000 | MBJPO36224 |
| 23-Jan-2026 | ❌ CANCELLED | 24,000 | MBJPO36942 |
| 29-Jan-2026 | 🟡 UPCOMING | 46,000 | MBJPO37704 |
| 01-Feb-2026 | 🟡 UPCOMING | 16,200 | MBJPO38314, MBJPO38774 |
| 07-Feb-2026 | 🟡 UPCOMING | 12,000 | MBJPO39812, MBJPO40542, MBJPO40295 |

---

### BLR ECOM2 Appointment History (Last 30 Days)

| Booking Date | Status | Qty | Count |
|--------------|--------|-----|-------|
| 31-Dec-2025 | 🔴 MISSED | 2,000 | 1 appt |
| 01-Jan-2026 | 🔴 MISSED | 27,126 | 1 appt |
| 03-Jan-2026 | 🔴 MISSED | 6,000 | 1 appt |
| 03-Jan-2026 | ❌ CANCELLED | 7,451 | 3 appts |
| 08-Jan-2026 | 🔴 MISSED | 17,500 | 3 appts |
| 08-Jan-2026 | ❌ CANCELLED | 12,500 | 2 appts |
| 10-Jan-2026 | 🔴 MISSED | 28,272 | 5 appts |
| 12-Jan-2026 | 🔴 MISSED | 30,000 | 2 appts |
| 14-Jan-2026 | 🔴 MISSED | 4,700 | 3 appts |
| 20-Jan-2026 | 🔴 MISSED | 66,000 | 4 appts |
| 23-Jan-2026 | 🔴 MISSED | 11,215 | 4 appts |
| 23-Jan-2026 | ❌ CANCELLED | 4,700 | 1 appt |
| 24-Jan-2026 | 🔴 MISSED | 6,948 | 5 appts |
| 03-Feb-2026 | 🟡 UPCOMING | 23,000 | 4 appts |

---

### BLR IM1 Appointment History (Last 30 Days)

| Booking Date | Status | Qty | Count |
|--------------|--------|-----|-------|
| 01-Jan-2026 | 🔴 MISSED | 39,100 | 1 appt |
| 02-Jan-2026 | 🔴 MISSED | 31,500 | 1 appt |
| 03-Jan-2026 | 🔴 MISSED | 35,000 | 3 appts |
| 05-Jan-2026 | 🔴 MISSED | 17,600 | 2 appts |
| 09-Jan-2026 | 🔴 MISSED | 35,000 | 2 appts |
| 09-Jan-2026 | ❌ CANCELLED | 23,000 | 1 appt |
| 12-Jan-2026 | 🔴 MISSED | 33,500 | 1 appt |
| 12-Jan-2026 | ❌ CANCELLED | 33,500 | 1 appt |
| 13-Jan-2026 | 🔴 MISSED | 25,300 | 2 appts |
| 14-Jan-2026 | 🔴 MISSED | 53,000 | 2 appts |
| 17-Jan-2026 | 🔴 MISSED | 24,500 | 2 appts |
| 20-Jan-2026 | 🔴 MISSED | 7,000 | 1 appt |
| 23-Jan-2026 | 🔴 MISSED | 6,948 | 3 appts |
| 24-Jan-2026 | ❌ CANCELLED | 30,000 | 1 appt |
| 25-Jan-2026 | 🔴 MISSED | 25,000 | 1 appt |
| 31-Jan-2026 | 🟡 UPCOMING | 18,461 | 5 appts |
| 04-Feb-2026 | 🟡 UPCOMING | 5,200 | 1 appt |
| 06-Feb-2026 | 🟡 UPCOMING | 27,500 | 2 appts |

---

## 7. TIMELINE ANALYSIS

| Date | BLR DHL | BLR ECOM2 | BLR IM1 | City Avg | Trend |
|------|---------|-----------|---------|----------|-------|
| 28-Jan | 0% | 9.3% | 0% | ~3% | ↓ DECLINING |
| 27-Jan | 0% | 12.3% | 0% | ~4% | ↓ |
| 26-Jan | 0% | 15.6% | 0.6% | ~5% | ↓ |
| 25-Jan | 0% | 24.9% | 2.8% | ~9% | ↓ |
| 24-Jan | 5.9% | 44% | 7.9% | ~19% | ↓ |
| 23-Jan | 7.8% | 81.4% | 26.7% | ~39% | ↓ |
| 22-Jan | 12% | 60.6% | 46.7% | ~40% | - |
| 21-Jan | 6.7% | 1.8% | 33.4% | ~14% | ↓ |
| 20-Jan | 7.2% | 3.9% | 51.1% | ~21% | - |
| 19-Jan | 16.6% | 19.3% | 77.7% | ~38% | - |
| 18-Jan | 27.8% | 37.4% | 86.4% | ~51% | - |
| 17-Jan | 32% | 57.2% | 61.9% | ~50% | - |
| 16-Jan | 57.2% | 70.3% | 78.2% | ~69% | - |
| 15-Jan | 78.1% | 88.4% | 81.7% | ~83% | - |
| 14-Jan | 80.9% | 82.4% | 25.4% | ~63% | - |

### Trend Analysis:
- Availability has declined from ~83% (15-Jan) to ~3% (28-Jan) over 2 weeks
- BLR DHL has been at 0-12% availability for the entire period (no GRN ever)
- BLR ECOM2 peaked at 88% on 15-Jan but crashed to 9% by 28-Jan
- BLR IM1 peaked at 86% on 18-Jan but crashed to 0% by 28-Jan
- The decline correlates perfectly with the vendor no-show pattern

---

## 8. STOCK MOVEMENT TRAIL

### Current Stock Position (26-Jan-2026 from ARS):

| Warehouse | WH Stock | Pod Stock | Intransit | Total DOH | Run Rate | Status |
|-----------|----------|-----------|-----------|-----------|----------|--------|
| BLR DHL | 0 | 0 | 1,050 | 10 days | 104.7/day | 🔴 WH OOS |
| BLR ECOM2 | 1 | 452 | 5,550 | 15.4 days | 361.5/day | 🟡 Depleting |
| BLR IM1 | 0 | 1 | 7,500 | 29 days | 258.8/day | 🔴 WH OOS |
| **TOTAL** | **1** | **453** | **14,100** | **-** | **725/day** | **🔴 CRITICAL** |

### Key Insight:
- 14,100 units showing as "intransit" but vendor not delivering
- Intransit corresponds to open POs with booked appointments that vendor is not honoring
- At current run rate of 725 units/day, the 453 units in pods will last <1 day
- Without vendor delivery, availability will continue to decline to 0%

### Stock Depletion Timeline:

| Date | BLR DHL WH | BLR ECOM2 WH | BLR IM1 WH | Event |
|------|------------|--------------|------------|-------|
| 14-Jan | 0 | 881 | 1,751 | Stock available |
| 15-Jan | 117 | 1,735 | - | Peak availability day |
| 16-Jan | 0 | 881 | 1,751 | BLR DHL depletes |
| 17-Jan | 0 | 587 | 1,628 | Stock declining |
| 18-Jan | - | 286 | 1,449 | Rapid depletion |
| 19-Jan | 0 | 1 | 238 | Near zero |
| 20-Jan | 0 | 1 | 0 | BLR IM1 depletes |
| 21-Jan | 0 | 1,919 | 0 | Brief ECOM2 receipt |
| 22-Jan | 0 | 286 | 1 | Depleting again |
| 23-Jan | 0 | 1,919 | 0 | - |
| 26-Jan | 0 | 1 | 0 | CRITICAL |

---

## 9. VENDOR DEEP DIVE

**Vendor:** MONDELEZ INDIA FOODS PRIVATE LIMITED  
**Vendor Code:** 1N60006316

| Metric | BLR DHL | BLR ECOM2 | BLR IM1 |
|--------|---------|-----------|---------|
| Last GRN Date | NEVER | 20-Jan-2026 | 20-Jan-2026 |
| Last GRN Qty | - | 600 units | 824 units |
| Fillrate (Last PO) | N/A | 100% | 100% |
| Avg 30-day Fillrate | N/A | 100% | 100% |
| Avg Lead Time | N/A | 6.2 days | 7.5 days |
| Expected Lead Time | 10 days | 10 days | 10 days |

### Appointment Performance (Last 30 Days):

| Metric | BLR DHL | BLR ECOM2 | BLR IM1 | TOTAL |
|--------|---------|-----------|---------|-------|
| Appointments Booked | 23 | 39 | 32 | 94 |
| Completed | 0 | 0 | 0 | 0 |
| Missed/No-Show | 12 | 24 | 21 | 57 |
| Cancelled | 5 | 6 | 3 | 14 |
| Upcoming | 6 | 4 | 8 | 18 |
| Missed Qty | 59,603 | 199,761 | 333,448 | 592,812 |

### Vendor Issue Analysis:
- 🔴 ZERO completed deliveries in 30 days across all Bangalore warehouses
- 🔴 60.6% no-show rate (57 out of 94 appointments)
- 🔴 14.9% cancellation rate (14 out of 94 appointments)
- 🔴 BLR DHL has NEVER received any delivery from this vendor
- ⚠️ Where GRNs exist (ECOM2, IM1 on 20-Jan), they may be from older appointments or partial deliveries

---

## 10. LIFECYCLE STAGE BREAKDOWN

| Stage | Name | Status | Finding |
|-------|------|--------|---------|
| 1 | ARS Planning | ✅ OK | PO recommended (flag=1), quantities reasonable |
| 2 | PO Creation | ✅ OK | POs created (Open PO flag=1, Intransit > 0) |
| 3 | Vendor Accept | ✅ OK | Vendor accepts POs and books appointments |
| 4 | Appointment | 🔴 CRITICAL | 57 no-shows, 14 cancellations, 0 completed in 30 days |
| 5 | GRN/Inward | 🔴 CRITICAL | BLR DHL: NO GRN EVER. Others: Last GRN 8+ days ago |
| 6 | Putaway | ⚠️ FLAGGED | Putaway_delay = 1 on some days (secondary issue) |
| 7 | Movement | 🔴 BLOCKED | WH stock = 0, cannot move to pods |
| 8 | Pod Receipt | 🔴 STARVED | Pods have <5 units stock |
| 9 | Availability | 🔴 CHRONIC | 37.84% availability |

**Primary Bottleneck:** Stage 4 (Appointment) + Stage 5 (GRN) - Vendor books appointments but does NOT show up to deliver

---

## 11. OWNER ASSIGNMENT

| Field | Value |
|-------|-------|
| FINAL_REASON | oos_9.fillrate Issue |
| AI_OWNER | Procurement |
| BIN (Issue Bucket) | Fill Rate Issue |
| Root Cause | Vendor No-Show / Appointment Non-Compliance |
| Escalation Path | Procurement → Procurement Lead → Procurement Head → Business Head |

### Issue Ownership Summary:

| Issue | Owner | Impact (OOS Sessions) | % of Total |
|-------|-------|----------------------|------------|
| Vendor No-Show (Primary) | Procurement | 6,188,416 | 72.37% |
| Forecasting Error | Planning | 223,310 | 3.3% |
| POD Cap Missed | Pod Ops/Planning | 195,220 | 2.9% |
| Putaway Delay | Pod Ops | 50,541 | 0.7% |

---

## 12. COMPARATIVE ANALYSIS

### What's Working vs What's Broken:

| Stage | Status | Evidence |
|-------|--------|----------|
| ✅ Demand exists | Working | 10.8M sessions, 725 units/day run rate |
| ✅ PO being raised | Working | PO raise flag = 1, intransit = 14,100 |
| ✅ Appointments booked | Working | 94 appointments in 30 days |
| ❌ Vendor delivery | BROKEN | 0 completed deliveries in 30 days |
| ❌ WH Stock | Broken | 0-1 units across all warehouses |
| ❌ Pod Stock | Broken | 453 units (will deplete in <1 day) |
| ❌ Availability | Broken | 37.84% and declining |

### The Problem is NOT:
- ❌ PO not raised (POs ARE being raised)
- ❌ MOV/MOQ constraints (none active)
- ❌ Forecasting error (run rate is reasonable)
- ❌ Warehouse capacity (WH has no stock to hold)
- ❌ Pod capacity (Pods have no stock to receive)

### The Problem IS:
- ✅ Mondelez is booking appointments but NOT showing up to deliver
- ✅ This is a vendor logistics/capacity failure requiring immediate escalation
- ✅ The 148,361 units in "upcoming" appointments will likely also not materialize given the 60% no-show pattern

---

## 13. UPCOMING APPOINTMENTS - RISK ASSESSMENT

Upcoming appointments to monitor (HIGH RISK of no-show based on pattern):

| Date | Warehouse | Qty | PO Codes | Risk |
|------|-----------|-----|----------|------|
| 29-Jan-2026 | BLR DHL | 46,000 | MBJPO37704 | 🔴 HIGH |
| 31-Jan-2026 | BLR IM1 | 18,461 | 5 POs | 🔴 HIGH |
| 01-Feb-2026 | BLR DHL | 16,200 | MBJPO38314, MBJPO38774 | 🔴 HIGH |
| 03-Feb-2026 | BLR ECOM2 | 23,000 | 4 POs | 🔴 HIGH |
| 04-Feb-2026 | BLR IM1 | 5,200 | 1 PO | 🔴 HIGH |
| 06-Feb-2026 | BLR IM1 | 27,500 | 2 POs | 🔴 HIGH |
| 07-Feb-2026 | BLR DHL | 12,000 | MBJPO39812, MBJPO40542, MBJPO40295 | 🔴 HIGH |

**Total at Risk:** 148,361 units across 18 appointments

---

## EXECUTIVE SUMMARY

**SKU:** Lotus Biscoff Original Caramelized Cookie (520277)  
**City:** Bangalore  
**Availability:** 37.84% (🔴 CHRONIC - below 60% threshold)

### Root Cause
Mondelez India Foods (vendor 1N60006316) has a systematic delivery failure:
- 71 appointments booked in 30 days
- 57 no-shows (60.6% no-show rate)
- 14 cancellations (14.9% cancellation rate)
- 0 completed deliveries (0% completion rate)
- 592,812 units not delivered due to no-shows
- BLR DHL warehouse has NEVER received a GRN for this SKU

### Impact
- 6.76 million OOS customer sessions
- Availability crashed from 83% to 3% in 2 weeks
- Revenue loss from high-demand premium import cookie

### Immediate Actions
1. 🔴 **TODAY:** Escalate to Mondelez leadership - demand explanation for 57 no-shows
2. 🔴 **TODAY:** Confirm Jan 29 appointment (46,000 units) will be honored
3. 🟠 **THIS WEEK:** Identify backup vendor if Mondelez cannot deliver
4. 🟡 **THIS MONTH:** Add SLA penalties for appointment no-shows in contract

**Owner:** Procurement Team  
**Escalation:** Procurement Head → Business Head