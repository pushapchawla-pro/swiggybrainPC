# 3D Warehouse Simulation Dashboard with AI-Powered Analytics

## Objective
Build an interactive 3D visualization of Instamart mother warehouse operations with real-time KPIs and integrated natural language Q&A powered by the IM Data Analytics skill.

---

## Executive Summary

| Dimension | Details |
|-----------|---------|
| **Primary Users** | Warehouse managers, Planning team, Procurement, Operations leadership |
| **Data Sources** | 21 Snowflake tables across 7 schemas (Vinculum, CMS, Analytics, CDC, TEMP, KMS, ERP) |
| **Key Tables** | `sku_wise_availability_rca_with_reasons_v7`, `scm_fc_inbound_appointment`, `RCA_FILE_WH`, `ars_uploaded_archives4` |
| **Refresh Rate** | Daily batch (2-3 hour CDC lag from Vinculum) |
| **Primary System** | Vinculum WMS (third-party, being replaced with in-house) |

---

## Task Graph & Orchestration

### Task Dependency Graph

```
                                    Phase 1: Foundation
                                    ═══════════════════

                                    ┌──────────────────┐
                                    │   TASK #1        │
                                    │ Project Scaffold │
                                    │ (Available NOW)  │
                                    └────────┬─────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
            ┌───────────────┐       ┌───────────────┐       ┌───────────────┐
            │   TASK #2     │       │   TASK #4     │       │               │
            │ 3D Scene      │       │ FastAPI +     │       │               │
            │ (8 zones)     │       │ Snowflake     │       │               │
            └───────┬───────┘       └───────┬───────┘       │               │
                    │                       │                │               │
                    ▼                       │                │               │
            ┌───────────────┐               │                │               │
            │   TASK #3     │               │                │               │
            │ Interactions  │               │                │               │
            │ & Camera      │               │                │               │
            └───────┬───────┘               │                │               │
                    │                       │                │               │
                    │         ┌─────────────┴─────────────┐  │               │
                    │         │                           │  │               │
                    │         ▼                           ▼  │               │
                    │ ┌───────────────┐           ┌───────────────┐         │
                    │ │   TASK #5     │           │   TASK #9     │         │
                    │ │ KPI Queries   │           │ SKU Lifecycle │         │
                    │ │ (8 zones SQL) │           │ Query Service │         │
                    │ └───────┬───────┘           └───────┬───────┘         │
                    │         │                           │                  │
                    │         ▼                           │                  │
                    │ ┌───────────────┐                   │                  │
                    │ │   TASK #6     │                   │                  │
                    │ │ KPI Endpoints │                   │                  │
                    │ │ + Caching     │                   │                  │
                    │ └───────┬───────┘                   │                  │
                    │         │                           │                  │
                    │         ├───────────────────────────┤                  │
                    │         │                           │                  │
                    │         ▼                           │                  │
                    │ ┌───────────────┐                   │                  │
                    │ │   TASK #11    │                   │                  │
                    │ │ AI Query +    │                   │                  │
                    │ │ Claude API    │                   │                  │
                    │ └───────┬───────┘                   │                  │
                    │         │                           │                  │
                    └─────────┼───────────────────────────┘                  │
                              │                                              │
                              ▼                                              │
                      ┌───────────────┐                                      │
                      │   TASK #7     │◄─────────────────────────────────────┘
                      │ Frontend ↔    │
                      │ Backend       │
                      └───────┬───────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
   ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
   │   TASK #8     │  │   TASK #10    │  │   TASK #12    │
   │ KPI Panel     │  │ SKU Tracer UI │  │ Chat Interface│
   │ Component     │  │ (Timeline)    │  │ Component     │
   └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
           │                  │                  │
           ▼                  │                  │
   ┌───────────────┐          │                  │
   │   TASK #13    │          │                  │
   │ Snapshots     │          │                  │
   └───────┬───────┘          │                  │
           │                  │                  │
           └──────────────────┼──────────────────┘
                              │
                              ▼
                      ┌───────────────┐
                      │   TASK #14    │
                      │ Animations &  │
                      │ Polish        │
                      └───────┬───────┘
                              │
                              ▼
                      ┌───────────────┐
                      │   TASK #15    │
                      │ Documentation │
                      │ & Deployment  │
                      └───────────────┘
```

### Execution Phases

| Phase | Tasks | Parallelism | Duration Estimate |
|-------|-------|-------------|-------------------|
| **Phase 1** | #1 (Scaffold) | Sequential | Day 1 |
| **Phase 2** | #2, #4 (3D Scene, Backend) | **Parallel** | Day 1-2 |
| **Phase 3** | #3, #5, #9 (Interactions, SQL, SKU Service) | **Parallel** | Day 2-3 |
| **Phase 4** | #6, #11 (Endpoints, AI Query) | **Parallel** | Day 3-4 |
| **Phase 5** | #7 (Connect FE↔BE) | Sequential | Day 4-5 |
| **Phase 6** | #8, #10, #12 (UI Components) | **Parallel** | Day 5-7 |
| **Phase 7** | #13 (Snapshots) | Sequential | Day 7-8 |
| **Phase 8** | #14 (Polish) | Sequential | Day 8-9 |
| **Phase 9** | #15 (Deploy) | Sequential | Day 9-10 |

### Current Task Status

```
#1  [pending] Create project scaffold           ← AVAILABLE NOW
#2  [pending] Build 3D scene                    [blocked by: #1]
#3  [pending] Zone interactions                 [blocked by: #2]
#4  [pending] FastAPI + Snowflake               [blocked by: #1]
#5  [pending] KPI queries                       [blocked by: #4]
#6  [pending] KPI endpoints                     [blocked by: #5]
#7  [pending] Connect FE↔BE                     [blocked by: #3, #6]
#8  [pending] KPI panel component               [blocked by: #7]
#9  [pending] SKU lifecycle service             [blocked by: #4]
#10 [pending] SKU Tracer UI                     [blocked by: #7, #9]
#11 [pending] AI query endpoint                 [blocked by: #6]
#12 [pending] Chat interface                    [blocked by: #7, #11]
#13 [pending] Snapshots                         [blocked by: #8]
#14 [pending] Animations & polish               [blocked by: #8, #10, #12]
#15 [pending] Docs & deployment                 [blocked by: #14]
```

---

## Orchestrator-Controlled Execution Model

This project uses the **task-management skill** for orchestrated execution with parallel workers.

### How to Execute

```
ORCHESTRATOR DISPATCH LOOP:

1. TaskList() → Find available tasks (pending, not blocked, no owner)

2. Dispatch workers for available tasks:
   - Single task: Task({ name: "w1", prompt: "Execute task #X..." })
   - Multiple parallel: Send multiple Task() calls in ONE message

3. Worker executes ONE task:
   - Claim: TaskUpdate({ taskId, owner, status: "in_progress" })
   - Implement
   - Complete: TaskUpdate({ taskId, status: "completed" })
   - Return: SUCCESS or BLOCKED

4. Orchestrator verifies result, checks for rework

5. Repeat until all tasks completed
```

### Worker Dispatch Template

```
Task({
  subagent_type: "general-purpose",
  name: "worker-1",
  prompt: `Execute task #${TASK_ID}: ${SUBJECT}

## Task Details
${DESCRIPTION}

## Instructions
1. Claim: TaskUpdate({ taskId: "${TASK_ID}", owner: "worker-1", status: "in_progress" })
2. Implement the work described above
3. Commit changes: git commit -m "feat: ${SUBJECT}"
4. Complete: TaskUpdate({ taskId: "${TASK_ID}", status: "completed" })
5. Return: SUCCESS or BLOCKED with reason

Do NOT look for more tasks. Complete this one task and return.`
})
```

### Parallel Dispatch Example

When multiple independent tasks are available:

```
// After Task #1 completes, both #2 and #4 become available
// Dispatch both in ONE message for parallel execution:

Task({ name: "frontend-worker", prompt: "Execute task #2: Build 3D scene..." })
Task({ name: "backend-worker", prompt: "Execute task #4: Setup FastAPI..." })
```

---

## Warehouse Process Model (Research Summary)

### End-to-End Flow: Inward → Outward

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                        INSTAMART MOTHER WAREHOUSE OPERATIONS                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  INBOUND FLOW                                                                           │
│  ═══════════                                                                            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐│
│  │APPOINTMENT│──▶│ GATEPASS │──▶│   DOCK   │──▶│   QC     │──▶│   GRN    │──▶│PUTAWAY ││
│  │ BOOKING  │   │ & ENTRY  │   │ RECEIVING│   │  (AQR)   │   │ CREATION │   │TO SHELF││
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └────────┘│
│       │              │              │              │              │              │      │
│   Portal         Security       Unloading      Quality       System         Location   │
│   Booking        Vehicle        Doc Check      Inspection    PO Match       Assignment │
│   Slot Mgmt      Dock Assign    PO-Invoice     Visual/Qty    Qty Verify     FEFO Logic │
│                                 Mapping        Expiry/Temp   GRN Generate   Rack/Bin   │
│                                                                                         │
│  STORAGE & INVENTORY                                                                    │
│  ══════════════════                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │  ZONES: AMB | CHI (2-8°C) | FRZ (-18°C) | PHR | FRS | HVL | QAR | STG | RTV     │  │
│  │  LOCATION: Zone-Aisle-Rack-Shelf-Bin (e.g., AMB-A01-R05-S03-B02)                 │  │
│  │  TRACKING: Vinculum WMS + MIM + ILS + IAS                                        │  │
│  │  ROTATION: FEFO (First Expiry First Out)                                         │  │
│  │  AUDIT: Cycle counts, reconciliation                                             │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│  OUTBOUND FLOW                                                                          │
│  ════════════                                                                           │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────┐│
│  │ MOVEMENT │──▶│  PICKING │──▶│ STAGING  │──▶│   LPN    │──▶│ VEHICLE  │──▶│DISPATCH││
│  │ PLANNING │   │          │   │          │   │ CREATION │   │ LOADING  │   │ TO POD ││
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └────────┘│
│       │              │              │              │              │              │      │
│   DOH Trigger    Pick List      Consolidate   Container      Route Plan     Dispatch   │
│   Demand Agg     FEFO Logic     By POD        Tracking       Load Verify    Tracking   │
│   PO Creation    Location Nav   Org Items     Traceability   Capacity       In-Transit │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 8 Warehouse Zones to Visualize

| Zone | Code | Process Stage | Key KPIs | Data Source |
|------|------|---------------|----------|-------------|
| 1. Dock/Receiving | DOCK | Inbound Stage 1-3 | Appointments, Fill Rate, No-shows | `scm_fc_inbound_appointment` |
| 2. QC Area | QAR | Inbound Stage 4 | AQR Pass Rate, Rejections | `INBOUND`, `INBOUNDDETAIL` |
| 3. Staging (Inbound) | STG-IN | Inbound Stage 5 | Pending Putaway, Wait Time | `sku_wise_availability_rca` (PENDINGPUTWAYQTY) |
| 4. Ambient Storage | AMB | Storage | Stock, DOH, Utilization | `RCA_FILE_WH` (WH_STOCK_QTY) |
| 5. Cold Storage | CHI/FRZ | Storage | Temp Compliance, Stock | `RCA_FILE_WH` |
| 6. Picking Area | PICK | Outbound Stage 1 | Pick Accuracy, FEFO Compliance | Movement Planning tables |
| 7. Staging (Outbound) | STG-OUT | Outbound Stage 2-3 | LPNs Ready, POD Grouping | `vinculum_dispatch_cdc` |
| 8. Dispatch Bay | DISP | Outbound Stage 4 | Vehicles, Dispatch TAT | `vinculum_dispatch_cdc` |

### Zone-Level Issue Flags (from RCA Table)

Each zone can display issue flags from `sku_wise_availability_rca_with_reasons_v7`:

| Zone | Relevant Issue Flags | Signal Meaning |
|------|---------------------|----------------|
| **Dock** | `WH_FILLRATE_ISSUE`, `WH_LAST_PO_FILLRATE_ISSUE` | Vendor under-delivery |
| **Staging-In** | `PUTAWAY_DELAY` | Stock stuck in staging > 24h |
| **Storage** | `STOCK_ISSUE`, `STOCK_SUFFICENCY_ISSUE2` | Low/no stock |
| **Picking** | `MOVEMENT_RR_NOT_GENERATED`, `MOVEMENT_RR_BLOCKED` | Movement plan issues |
| **Staging-Out** | `WH_CAPACITY_ISSUE2`, `PLANNING_ISSUE` | Outbound capacity exceeded |
| **Dispatch** | `MOVEMENT_DESIGN_ISSUE` | Movement execution failure |

### Issue Owner Mapping (AI_OWNER)

| AI_OWNER | Typical Issues | Zones Affected |
|----------|----------------|----------------|
| **Procurement** | Fillrate < 80%, No PO raised, MOV/MOQ constraints | Dock |
| **Warehouse** | Putaway delay, WH capacity, Outbound fillrate | Staging-In, Dispatch |
| **Planning** | Forecasting error, Movement RR issues | Picking, Staging-Out |
| **Pod Ops** | Pod capacity, Space issues | (downstream) |
| **Catalog** | ERP disabled, Vendor code missing | System-wide |
| **Business** | Pod inactive, OTB block | System-wide |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Three.js)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   3D Warehouse  │  │   KPI Panels    │  │   SKU Tracer    │  │  AI Chat    │ │
│  │   Scene         │  │   (Per Zone)    │  │   (Lifecycle)   │  │  Interface  │ │
│  │   - 8 zones     │  │   - Real-time   │  │   - Journey     │  │  - NL Query │ │
│  │   - Click/hover │  │   - Color coded │  │   - Stages      │  │  - Context  │ │
│  │   - Animations  │  │   - Thresholds  │  │   - Timeline    │  │  - Results  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │ REST API / WebSocket
┌────────────────────────────────────┴────────────────────────────────────────────┐
│                              BACKEND (FastAPI)                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │  KPI Aggregator │  │  SKU Tracker    │  │  Query Engine   │  │  Cache      │ │
│  │  Service        │  │  Service        │  │  (Claude API)   │  │  (Redis)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└────────────────────────────────────┬────────────────────────────────────────────┘
                                     │
┌────────────────────────────────────┴────────────────────────────────────────────┐
│                              DATA LAYER                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │  Snowflake Tables                                                           ││
│  │  - sku_wise_availability_rca_with_reasons_v7  (Availability & RCA)         ││
│  │  - scm_fc_inbound_appointment                  (Appointments)               ││
│  │  - RCA_FILE_WH / INBOUND                       (GRN/Fillrate)              ││
│  │  - ars_uploaded_archives4                      (Demand Planning)           ││
│  │  - PO / LOCATION                               (PO Status)                 ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Snowflake Queries by Zone

### Zone 1: Dock/Receiving KPIs

```sql
-- Table: CDC.CDC_DDB.scm_fc_inbound_appointment
SELECT
    COUNT(DISTINCT PK) as total_appointments,
    SUM(CASE WHEN APPT_STATE = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN APPT_STATE = 'NO_SHOW' THEN 1 ELSE 0 END) as no_shows,
    SUM(CASE WHEN APPT_STATE = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled,
    SUM(CASE WHEN APPT_STATE = 'CREATED' THEN 1 ELSE 0 END) as pending,
    SUM(BOOKED_QTY) as total_booked_qty
FROM CDC.CDC_DDB.scm_fc_inbound_appointment
WHERE SK != 'fc_inbound_appointment'  -- Filter metadata row
  AND TRY_CAST(DATE AS DATE) = CURRENT_DATE
  AND PARSE_JSON(FC):name::STRING = :warehouse_name;
```

### Zone 2: QC Area KPIs

```sql
-- Tables: VINCULUM.SWIGGY_GAMMA.INBOUND, INBOUNDDETAIL
SELECT
    COUNT(DISTINCT i.INBOUNDCODE) as total_grns,
    SUM(id.RCVDQTY) as total_received_qty,
    SUM(id.EXPECTEDQTY) as total_expected_qty,
    SUM(id.RCVDQTY) * 100.0 / NULLIF(SUM(id.EXPECTEDQTY), 0) as fillrate_pct,
    COUNT(CASE WHEN i.STATUS = '4' THEN 1 END) as completed_grns
FROM VINCULUM.SWIGGY_GAMMA.INBOUND i
JOIN VINCULUM.SWIGGY_GAMMA.INBOUNDDETAIL id ON i.INBOUNDCODE = id.INBOUNDCODE
JOIN VINCULUM.SWIGGY_GAMMA.LOCATION l ON i.LOCCODE = l.LOCCODE
WHERE i.INBOUNDDATE = CURRENT_DATE
  AND l.LOCNAME = :warehouse_name;
```

### Zone 3: Staging (Inbound) - Putaway KPIs

```sql
-- Table: ANALYTICS.PUBLIC.sku_wise_availability_rca_with_reasons_v7
SELECT
    SUM(PENDINGPUTWAYQTY) as total_pending_putaway,
    COUNT(DISTINCT ITEM_CODE) as skus_in_staging,
    SUM(CASE WHEN PUTAWAY_DELAY = 1 THEN 1 ELSE 0 END) as skus_with_delay,
    SUM(CASE WHEN PUTAWAY_DELAY = 1 THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(COUNT(DISTINCT ITEM_CODE), 0) as delay_pct
FROM ANALYTICS.PUBLIC.sku_wise_availability_rca_with_reasons_v7
WHERE DT = CURRENT_DATE - 1
  AND WH_NAME = :warehouse_name
  AND PENDINGPUTWAYQTY > 0;
```

### Zone 4-5: Storage KPIs (Ambient + Cold)

```sql
-- Table: TEMP.PUBLIC.RCA_FILE_WH
SELECT
    SUM(WH_STOCK_QTY) as total_stock_units,
    COUNT(DISTINCT SKU) as total_skus,
    AVG(CASE WHEN FINAL_RR > 0 THEN WH_STOCK_QTY / FINAL_RR END) as avg_doh,
    COUNT(CASE WHEN WH_DOH <= 1 THEN 1 END) as critical_doh_skus,
    COUNT(CASE WHEN WH_DOH > 1 AND WH_DOH <= 3 THEN 1 END) as low_doh_skus,
    COUNT(CASE WHEN WH_DOH > 3 AND WH_DOH <= 7 THEN 1 END) as healthy_doh_skus,
    COUNT(CASE WHEN WH_DOH > 7 THEN 1 END) as excess_doh_skus,
    COUNT(CASE WHEN WH_STOCK_QTY = 0 THEN 1 END) as oos_skus,
    COUNT(CASE WHEN WH_STOCK_QTY = 0 THEN 1 END) * 100.0 /
        NULLIF(COUNT(DISTINCT SKU), 0) as oos_pct
FROM TEMP.PUBLIC.RCA_FILE_WH
WHERE WHNAME = :warehouse_name
  AND UPDATED_TIME >= CURRENT_DATE - 1;
```

### Zone 6: Picking Area KPIs

```sql
-- Tables: ANALYTICS.PUBLIC.sku_wise_availability_rca_with_reasons_v7
SELECT
    SUM(CASE WHEN MOVEMENT_RR_NOT_GENERATED = 1 THEN 1 ELSE 0 END) as movement_rr_not_generated,
    SUM(CASE WHEN MOVEMENT_RR_BLOCKED = 1 THEN 1 ELSE 0 END) as movement_blocked,
    SUM(CASE WHEN MOVEMENT_DESIGN_ISSUE = 1 THEN 1 ELSE 0 END) as movement_design_issues,
    SUM(CASE WHEN PLANNING_ISSUE = 1 THEN 1 ELSE 0 END) as planning_issues,
    SUM(TRANSFER_QTY) as total_transfer_qty,
    SUM(INTRANSIT_QTY) as total_intransit_qty,
    COUNT(DISTINCT STORE_ID) as pods_being_served
FROM ANALYTICS.PUBLIC.sku_wise_availability_rca_with_reasons_v7
WHERE DT = CURRENT_DATE - 1
  AND WH_NAME = :warehouse_name;
```

### Zone 7-8: Staging (Outbound) & Dispatch KPIs

```sql
SELECT
    SUM(CASE WHEN WH_CAPACITY_ISSUE2 = 1 THEN 1 ELSE 0 END) as wh_capacity_issues,
    SUM(CASE WHEN FINAL_REASON LIKE '%wh_ob_Fillrate%' THEN 1 ELSE 0 END) as outbound_fillrate_issues,
    COUNT(DISTINCT STORE_ID) as pods_with_demand,
    SUM(MOVEMENT_RR) as total_movement_demand
FROM ANALYTICS.PUBLIC.sku_wise_availability_rca_with_reasons_v7
WHERE DT = CURRENT_DATE - 1
  AND WH_NAME = :warehouse_name;
```

### Warehouse-Level Summary (Dashboard Header)

```sql
SELECT
    WH_NAME,
    SUM(AVAIL_SESSIONS) * 100.0 / SUM(TOTAL_SESSIONS) as availability_pct,
    SUM(NON_AVAIL_SESSIONS) as total_oos_sessions,
    SUM(CASE WHEN STOCK_ISSUE = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) as procurement_oos,
    SUM(CASE WHEN PUTAWAY_DELAY = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) as warehouse_oos,
    SUM(CASE WHEN PLANNING_ISSUE = 1 OR MOVEMENT_DESIGN_ISSUE = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) as planning_oos,
    SUM(CASE WHEN POD_CAPACITY_ISSUE2 = 1 OR SPACE_ISSUE = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) as pod_ops_oos,
    SUM(CASE WHEN ERP_ISSUE = 1 OR ERP_TEMP_DISABLE = 1 THEN NON_AVAIL_SESSIONS ELSE 0 END) as catalog_oos
FROM ANALYTICS.PUBLIC.sku_wise_availability_rca_with_reasons_v7
WHERE DT = CURRENT_DATE - 1
  AND WH_NAME = :warehouse_name
GROUP BY WH_NAME;
```

---

## Key Thresholds for Color Coding

| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| **Availability %** | >= 95% | 80-95% | < 80% |
| **DOH** | 3-7 days | 1-3 or >10 days | < 1 day |
| **Fillrate (QFR)** | >= 80% | 50-80% | < 50% |
| **Putaway Delay %** | < 5% | 5-15% | > 15% |
| **Appointments Completed %** | >= 90% | 70-90% | < 70% |

---

## SKU Lifecycle Journey Query

```sql
WITH sku_journey AS (
    -- Stage 1: ARS/Demand Planning
    SELECT 'ARS_RECOMMENDATION' as stage, "Date" as event_date,
           "PO raise flag" as status, "PO Qty adjusted" as quantity
    FROM TEMP.DAILY_ARCHIVES.ars_uploaded_archives4
    WHERE "SPIN" = :sku_id AND "WH_CD" = :warehouse_code

    UNION ALL

    -- Stage 2-3: PO Created
    SELECT 'PO_CREATED' as stage, PODATE as event_date,
           STATUS as status, POQTY as quantity
    FROM TEMP.PUBLIC.PO
    WHERE SKU = :sku_id AND LOCATION = :warehouse_code

    UNION ALL

    -- Stage 4: Appointment
    SELECT 'APPOINTMENT' as stage, booking_date as event_date,
           appt_state as status, NULL as quantity
    FROM CDC.CDC_DDB.scm_fc_inbound_appointment a
    JOIN TEMP.PUBLIC.PO p ON a.po_code = p.POCODE
    WHERE p.SKU = :sku_id

    UNION ALL

    -- Stage 5: GRN
    SELECT 'GRN_COMPLETED' as stage, "Last GRN date" as event_date,
           'COMPLETED' as status, "GRN Qty" as quantity
    FROM TEMP.PUBLIC.RCA_FILE_WH
    WHERE "SKU ID" = :sku_id AND "WH Name" = :warehouse_name

    UNION ALL

    -- Current State
    SELECT 'CURRENT_STATE' as stage, DATE as event_date,
           CASE WHEN WH_STOCK_QTY > 0 THEN 'IN_STOCK' ELSE 'OOS' END as status,
           WH_STOCK_QTY as quantity
    FROM ANALYTICS.PUBLIC.sku_wise_availability_rca_with_reasons_v7
    WHERE sku = :sku_id AND wh_name = :warehouse_name
    ORDER BY DATE DESC LIMIT 1
)
SELECT * FROM sku_journey ORDER BY event_date;
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | UI framework |
| 3D | Three.js via @react-three/fiber | 3D visualization |
| State | Zustand | Client state management |
| Charts | Recharts | 2D KPI charts |
| Backend | FastAPI (Python) | API server |
| Database | Snowflake | Data warehouse |
| AI | Claude API (Anthropic) | Natural language queries |
| Cache | Redis (optional) | Query caching |
| Hosting | Vercel + Cloud Run | Deployment |

---

## Scope Decisions (Confirmed)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Warehouse Support** | Multi-warehouse with switcher | Dropdown to switch between warehouses (BLR IM1, IM2, IM3, IM4, etc.) |
| **Data Freshness** | Accept lag, show timestamp | Display "Last sync: X hours ago" prominently |
| **Incident Snapshots** | Include in v1 | Capture and compare warehouse state over time |

---

## Available Skills for Implementation

The following skills are available in `.claude/skills/`:

| Skill | Usage |
|-------|-------|
| **im-data-analytics** | SQL generation for availability RCA, SKU lifecycle, and warehouse KPIs |
| **snowflake-connector** | Execute SQL queries against Snowflake with SSO authentication |
| **task-management** | Orchestrate parallel workers with task dependencies |

### Using IM Data Analytics Skill

For AI chat integration, load the skill context to help generate correct SQL:

```python
# backend/app/routers/query.py
from anthropic import Anthropic

# Load IM Data Analytics skill for SQL generation context
skill_context = open(".claude/skills/im-data-analytics/SKILL.md").read()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    system=skill_context,
    messages=[{"role": "user", "content": user_question}]
)
```

---

## Next Steps

1. **Start Task #1**: Create project scaffold (only available task)
2. After #1 completes, dispatch **#2 and #4 in parallel**
3. Continue following the task graph

To begin execution:
```
TaskUpdate({ taskId: "1", owner: "lead", status: "in_progress" })
```
