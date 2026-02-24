# Pod Ops Team Persona

## Overview

**Mission**: Run pod operations on the ground. Own pod-level inwarding and putaway, pod capacity and space, pod enable/closure, and pod manpower. Fix store-level execution issues that block availability even when upstream supply is healthy.

**Operating Level**: Pod level, Pod × SKU, or Cluster of pods (fixes local execution issues)

**Key Central Team Contacts**:
- Srikanth Reddy
- Sonal Goswami
- Karun Sangal
- Srinath K C
- Samanth (Samy)
- Sumanth Krishna

---

## Organizational Structure

| Level | Role | Responsibility |
|-------|------|----------------|
| **Central POD Ops** | Central Team | End-to-end responsibility for all POD activities across India; SOP creation; decision making |
| **Store Manager (SM)** | POD Level | In-charge of the POD; process improvements; new product launches; staff performance |
| **Assistant Store Manager (ASM)** | POD Level | Supports SM; present in larger PODs |
| **Loaders** | POD Staff | Manifest receiving; unloading vehicles; placing items in racks |
| **Pickers** | POD Staff | Order picking; packing; quality verification; billing |

---

## Key Responsibilities

### A. Inwarding & Putaway

| Activity | Description | Owner |
|----------|-------------|-------|
| **LPN-Based Unloading** | Scan incoming LPNs from warehouses; smart reconciliation flags missing items | Loaders |
| **Quality Check (QC)** | Inspect incoming inventory for MRP deviation (90% threshold), expiry, batch ID, condition | Loaders |
| **GRN Approval** | Store manager confirms goods receipt | SM |
| **Express Putaway** | Add new location during putaway process | Loaders |
| **Guided Putaway** | System suggests pre-assigned locations based on zone type, capacity, FEFO | Loaders |

**Key Metric**: Inwarding TAT (Turnaround Time) Adherence

### B. Pod Capacity & Space Management

| Dimension | Description |
|-----------|-------------|
| **Active Order Capacity** | Max concurrent orders being picked |
| **MFR Capacity** | Max orders awaiting DE pickup (pigeonhole capacity) |
| **Storage Capacity** | Volumetric capacity by rack type (Chiller, Freezer, Ambient) |
| **Manpower Capacity** | Number of active pickers available |

**Space Constraints**:
- Rack utilization > 95% triggers inwarding block
- Volume allocation split between "Strategy-led" and "Performance-led" items
- Pod-level volume tracking by rack type for assortment planning
- Location master maintenance with LBH (Length/Breadth/Height) attributes

### C. Pod Enable/Disable & Closure Management

| Trigger | Action |
|---------|--------|
| **Pod Closure** | Temporarily disable pod for maintenance, manpower shortage, or holidays |
| **Holiday Slots** | Bulk upload via KMS for scheduled closures |
| **Active Order Breach** | Config-based; different thresholds for different PODs |
| **Capacity Max-Out** | Graceful Degradation (GD) feature triggers unserviceability |
| **Scheduled Maintenance** | 2AM-6AM closures for GST inventory updates |

### D. Manpower Management

| Role | Management |
|------|------------|
| **Picker Roster** | Scheduling pickers per shift; handling attrition |
| **Picker States** | Idle (not logged in), Free (available), Busy (working) |
| **Picker Assignment** | Optimal picker selection for jobs |
| **Flexi Manpower** | Cross-utilization across workflows (inwarding/picking) |

**Common Challenge**: High picker attrition requiring frequent onboarding and training

### E. Quality Control (Store QC)

- QC on returned items: sellable vs unsellable categorization
- Re-inventorization of good items
- FSSAI compliance and hygiene standards
- Temperature monitoring for cold chain

---

## Systems & Tools

| System | Purpose |
|--------|---------|
| **MIM Dashboard** | Master Inventory Management; rack management; inventory corrections |
| **IM Store Manager Dashboard** | Unified landing page for SM |
| **Picker Admin** | Picker management and assignment |
| **IM Retail App** | LPN visibility; manifest checking; loader workflows |
| **Movement Planning Portal** | Warehouse-to-pod inventory transfers |
| **KMS** | Holiday slot management; FSSAI license tracking |
| **Picker App** | Order picking; QR scanning; job assignment |
| **Loader App** | Unloading jobs; LPN scanning; putaway tasks |
| **HRMS** | Attendance; shift management; payroll |
| **Slack** | Alert notifications; escalations |
| **Grafana/EagleEye** | Monitoring dashboards |
| **Retool** | Cycle count flows; operational tasks |

### Key Config Parameters

- `ACTIVE_ORDER_COUNT_BREACH` - Per-pod capacity limits
- `LPN_UNLOADING_V1_AND_V2_ENABLED_STORES`
- `KILL_INSTAMART_CONFIG` / `KILL_STORE_CONFIG` - Pod enable/disable
- `REPLENISHMENT_ENABLED_STORES`
- Holiday slot bulk upload access

---

## Key Metrics

### Availability Metrics

| Metric | Description |
|--------|-------------|
| **Pod Availability** | Primary & Customer availability % |
| **FTR (First Time Right)** | Orders fulfilled correctly on first attempt |
| **VDC (Virtual Delivery Compliance)** | Item accuracy in orders |
| **M+W (Missing + Wrong)** | Missing/wrong item rate |

### Operational Metrics

| Metric | Description |
|--------|-------------|
| **Inwarding TAT** | Time to complete inwarding from vehicle arrival |
| **Putaway Completion Time** | Time from QC to rack placement |
| **O2MFR** | Order to Marked For Ready (picking efficiency) |
| **Picking Time/Order** | Average picking duration |
| **Pod DOH/DOI** | Days of Inventory at pod level |
| **Storage Utilization** | Rack capacity usage % |
| **Picker Productivity** | Orders per picker per hour |

### Unserviceability Metrics

| Metric | Description |
|--------|-------------|
| **Pod Ops Unserviceability %** | Store unable to process orders due to picker/capacity constraints |
| **Capacity Max-Out** | Orders exceed pod limit |
| **Active Order Breach** | Too many concurrent orders |

---

## Common Issues Handled

| Issue Type | Description | Root Cause |
|------------|-------------|------------|
| **Slow Putaway** | Inventory received but not available for sale | Manpower shortage; training gaps |
| **Space Full** | Cannot accept new inventory | Rack utilization > threshold |
| **Pod Capped** | Inbound capacity reached | Space constraints; slow putaway |
| **Pod Disabled/Closed** | Pod not accepting orders | Maintenance; manpower; holidays |
| **Picker Unavailability** | Cannot process orders | Attrition; rostering gaps |
| **Equipment Failure** | Freezer/AC malfunction | Infrastructure issues |
| **Inventory Mismatch** | System vs physical discrepancy | PR issues; pilferage; inwarding errors |

### SOP Breaches

- Paper bags sent despite "no bag" selection
- Ice cream delivered without gel packs (training gap)
- Items marked FTR but not actually available (metrics gaming)
- Loaders not scanning paper bags

---

## RCA Branch Mapping

### Pod Ops-Owned Waterfall Codes

These are the actual `final_reason` values from `analytics.public.sku_wise_availability_rca_with_reasons_v7`:

| Waterfall Code | `final_reason` | Description | Pod Ops Action |
|----------------|----------------|-------------|----------------|
| `instock_8` | `POD Cap Missed` | POD capacity full, couldn't receive | Clear space, expedite putaway |
| `instock_11` | `pod_Space Issue_cold` | Cold storage (freezer/chiller) at POD full | Optimize cold chain allocation |
| `instock_14` | `Putaway_delay` | Inwarding to shelf delayed at POD | Increase putaway manpower |

### RCA Branch: B1 - POD Ops Throughput & Capacity

| Sub-Branch | Waterfall Code | Description |
|------------|----------------|-------------|
| **B1.1** POD Missed Qty | `POD Cap Missed` | POD capacity full |
| **B1.2** Inwarding Delays | `Putaway_delay` | Slow putaway at POD |
| **B1.3** POD Space Constraints | `pod_Space Issue_cold` | Cold storage full |

**Attribution**: Pod Ops issues account for ~0.8% of the availability gap (Branch B1).

### Related Codes (Owned by Config/Product Support)

POD closures and disable flags are tracked separately:

| Waterfall Code | `final_reason` | Description | Owner |
|----------------|----------------|-------------|-------|
| `oos_0`, `instock_0` | `pod_inactive` | POD is disabled in system | Config |
| `oos_1` | `disabled_pod` | Movement to POD is blocked | Config |

### Shared Ownership Cases

When `ai_owner = "Pod Ops / Planning"`:
- **Pod Ops handles**: Pod execution, space, manpower
- **Planning handles**: Movement settings, DOH cutoffs, allocation

---

## Stakeholder Interactions

| Stakeholder | Interaction |
|-------------|-------------|
| **Planning Team** | Movement plans; replenishment scheduling; DOH settings |
| **Warehouse Ops** | Manifest coordination; LPN dispatch; fill rate issues |
| **Procurement** | PO alignment for DSD; local buying |
| **Category Team** | Assortment decisions; tiering |
| **DE Ops** | Handover coordination; MFR pickup |
| **Product Support** | Config changes; system issues; ticket resolution |
| **LnD** | Training materials; SOP communication |
| **Finance** | Budget for partitions; equipment |
| **Infra** | Rack installation; equipment maintenance |

---

## SOPs & Playbooks

### Diagnosis SOP for Pod Ops Issues

1. **Identify** chronic pods with repeated low availability for SKUs/brands
2. **Check** pod capacity and space flags during breach window
3. **Review** inbound/putaway lag for impacted pods
4. **Verify** pod active/enable status and any closures affecting movement
5. **Examine** manpower availability and picker roster
6. **Decide** store-level actions: clear backlog, increase manpower, change space allocation

### Standard Operating Procedures

| SOP | Purpose |
|-----|---------|
| **Inwarding SOP** | LPN scan → QC → GRN → Putaway |
| **Picking SOP** | Job assignment → Navigate to location → Scan → Pack → MFR |
| **Holiday Slot SOP** | Bulk upload via KMS (restricted access - ~20 central team members) |
| **Cycle Count SOP** | Physical count → Discrepancy logging → Adjustment |
| **QC Returns SOP** | Inspect returned items → Categorize sellable/unsellable → Re-inward or dispose |
| **Equipment Failure SOP** | Report → Escalate → Alternative arrangement |

---

## Key Data Sources

| Data Source | Purpose |
|-------------|---------|
| `analytics.public.im_store_slot_week_level_dataset` | Pod-slot level metrics |
| `analytics.public.im_del_ops_hyperchronic_pod_slots_rxt` | Chronic pod identification |
| `scm-inventory-location` | Inventory at location level |
| `dash-scm-task-manager-task` | Inwarding/picking tasks |
| `scm-capacity-controller` | Pod capacity constraints |
| `dash-serviceability` | Pod availability status |

---

## Agent Integration

**When to route to Pod Ops**:
- RCA points to "pod capped", "slow putaway", "space full", "pod disabled"
- Pattern is localized to specific pods (not city-wide)
- Upstream supply (warehouse, planning) is healthy

**Key Signals to Surface**:
- Pod capacity utilization %
- Putaway TAT vs benchmark
- Active/enable status
- Manpower availability
- Space constraints by rack type

**Key Differentiator**: Pod Ops handles execution bottlenecks at the store level, even when upstream supply is healthy. They are the last mile of inventory availability before the customer.

**Action Verbs**: Clear, Escalate, Adjust, Coordinate, Verify, Enable
