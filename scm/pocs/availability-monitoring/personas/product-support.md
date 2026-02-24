# Product Support / SCM Product Team Persona

## Overview

**Mission**: Ensure accurate system configuration and operational controls that maintain optimal SKU availability, minimize false OOS events, and support business operations through correct tagging, tiering, and Control Room rule management.

**Operating Level**: System / Catalog Configuration level (manages rules and configs affecting availability)

**Note**: This is not a standalone team but a set of responsibilities distributed across SCM Engineering, Product Operations, Analytics, and Category Management. The core function is configuration management for availability.

**Key Contacts**: Vaibhav Juneja (IAS/Control Room), Parag Jain (SCM Inventory EM), Tapan Ghia (CR Policy), Vinothkumar Nagarajan (Product Support)

---

## Key Responsibilities

| Responsibility | Description |
|----------------|-------------|
| **Control Room Rule Management** | Set inventory thresholds at SKU/SPIN/Category/Store level for OOS determination |
| **SKU Tiering Config** | Configure SKU tiers (A, MLT, MnE, Bradman) for availability prioritization |
| **Holiday Slot Configuration** | Define time windows when items should NOT be available |
| **Manual OOS Override** | Handle overridden_oos flag for quality issues, damaged stock |
| **System Integration** | Ensure IAS-ILS sync, listing service validation, DAX connectivity |
| **Feature Flags** | Manage availability-related feature flags in Config Platform |

### Control Room Rule Types

| Rule Type | Description | Default |
|-----------|-------------|---------|
| **Inventory Threshold** | Qty threshold below which item marked OOS | 0 (OOS when inventory = 0) |
| **OOS Override** | Force item to OOS regardless of inventory | false |
| **Custom Threshold** | Higher thresholds (1-5) for flash sales buffer | Per-SKU config |

**Rule Resources**: Rules can be configured on four resource types: SKU, SPIN, CategoryId, StoreId

---

## Systems & Tools

| System | Purpose |
|--------|---------|
| **SCM Control Room (CR)** | Rule configuration for availability thresholds (Retool Dashboard) |
| **MIM Dashboard** | Store manager dashboard for inventory, tasks, metrics |
| **IM Store Manager Dashboard** | Consolidated store metrics (Retool-based) |
| **Config Platform (CP)** | Feature flags, business line configs (cp.swiggyops.de) |
| **KMS / kms-apis-rock** | FC (Dark Store) management, entity config, business hours |
| **scm-inventory-availability (IAS)** | Core availability service, rule evaluation |
| **scm-access-control** | User authorization for dashboards |

### Key Dashboards

- **CR Rule Management Dashboard**: Create/edit/disable Control Room rules
- **Availability Audit Dashboard**: Check rule execution for specific SKUs
- **IAS On-Call Dashboard**: Monitor availability service health

---

## Key Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| **OOS Count SDLW Comparison** | OOS items vs same day last week | Alert if >2-3x increase |
| **Inventory But OOS Count** | Items with inventory but marked OOS | Alert if >0.5% |
| **OOS Override Percentage** | % of items manually marked OOS | Warning >0.3%, Critical >0.6% |
| **Zero Price Count** | SKUs with zero price | Alert on deviation from SDLW |
| **CR Rule Processing Failure** | Failed rule evaluations | Warning >0.5/min, Critical >1/min |
| **CR Rule Latency** | Create/Get rules latency | Warning >500ms, Critical >1000ms |

---

## Common Issues Handled

| Issue Type | Description | Resolution |
|------------|-------------|------------|
| **Incorrect Tiering** | SKUs assigned wrong tier leading to suboptimal allocation | Review tiering config, update ERP |
| **Control Room Misconfiguration** | Rules not rolled back after flash sales (causing wastage) | Disable/update rules in CR dashboard |
| **Holiday Slot Misconfig** | Items unavailable during intended selling windows | Fix CMS_SLOTS configuration |
| **Manual OOS Not Reverted** | overridden_oos flag left true after issue resolved | Clear override flag |
| **Flash Sale Config Issues** | High thresholds not set before flash sales (causing FTRs) | Pre-configure rules before sale |
| **Integration Errors** | DAX connectivity failures, ILS-IAS sync lag | Debug via IAS logs, escalate to engineering |

---

## RCA Branch Mapping

### Product Support/Config-Owned Waterfall Codes

These are the actual `final_reason` values from `analytics.public.sku_wise_availability_rca_with_reasons_v7`:

| Waterfall Code | `final_reason` | Description | Product Support Action |
|----------------|----------------|-------------|------------------------|
| `oos_0` | `pod_inactive` | POD is disabled in system | Verify POD status, re-enable if appropriate |
| `oos_1` | `disabled_pod` | Movement to this POD is blocked | Check movement block reason |
| `instock_0` | `pod_inactive` | POD is disabled (WH has stock) | Re-enable POD if closure resolved |
| `instock_2` | `movement_blocked_list` | Movement explicitly blocked for this POD | Review and remove block |

### RCA Branch: B4 - Inventory Hygiene & Freshness (Config)

| Sub-Branch | Waterfall Code | Description |
|------------|----------------|-------------|
| **B4.1** POD Inactive | `pod_inactive` | POD disabled in system |
| **B4.2** Movement Blocked | `disabled_pod`, `movement_blocked_list` | Movement to POD blocked |

**Important Note**: Control Room misconfigurations, tiering errors, and holiday slot issues do not have dedicated waterfall codes in the current taxonomy. They affect availability but are tracked through:
- `overridden_oos` flag in `DASH_SCM_INVENTORY_AVAILABILITY` table (not a waterfall code)
- Rule evaluation logs in `SCM_CONTROL_ROOL_RULES_EVENT` (not a waterfall code)
- Holiday slots in `CMS_SLOTS` table (not a waterfall code)

### Conceptual Issues Without Dedicated Waterfall Codes

| Issue | How to Detect | Action |
|-------|---------------|--------|
| **Control Room Misconfiguration** | Query `DASH_SCM_INVENTORY_AVAILABILITY` for active rules | Update/disable rules in CR dashboard |
| **SKU Mis-Tiering** | Check assortment tier in ERP Region Sheets | Coordinate with Category Management |
| **Holiday Slot Error** | Query `CMS_SLOTS` for time-based blocks | Fix CMS configuration |
| **Manual OOS Override Stale** | Check `overridden_oos = true` with `sellable > 0` | Clear override flag |
| **System Integration Error** | Check IAS logs for sync failures | Escalate to SCM Engineering |

**Branch Description**: The issue is due to POD being disabled or movement being blocked. Control Room and tiering issues require separate diagnosis outside the waterfall attribution.

---

## Stakeholder Interactions

| Stakeholder | Interaction Type |
|-------------|------------------|
| **Pod Ops / Store Managers** | Report availability issues, request OOS overrides, MIM dashboard access |
| **Category Managers** | SKU tiering decisions, assortment strategy, flash sale configuration |
| **Analytics Team** | Availability RCA, threshold analysis, Bradman SKU monitoring |
| **SCM Engineering** | Technical troubleshooting, rule evaluation issues, system integrations |
| **Planning & Procurement** | PO-related availability issues, vendor fill rate impacts |
| **IT / Access Support** | Dashboard access provisioning, user onboarding |

---

## SOPs & Playbooks

### Diagnosis SOP for Config-Led Issues

1. **Check** if SKU has active Control Room rule overriding default behavior
2. **Validate** rule configuration - is threshold correct? Is rule enabled?
3. **Check** holiday slots - is item blocked by time-based config?
4. **Verify** overridden_oos flag - is manual override still active?
5. **Review** tiering config - is SKU in correct tier for the pod?
6. **Check** IAS logs for rule evaluation errors or sync issues
7. **If flash sale related**: Verify pre/post sale rule lifecycle
8. **Escalate** to SCM Engineering if system integration issues

### Control Room Rule Management Playbook

1. Identify SKU with unexpected availability behavior
2. Query rule execution: Check `DASH_SCM_INVENTORY_AVAILABILITY` for rule_id
3. Review rule history: Check `SCM_CONTROL_ROOL_RULES_EVENT` for recent changes
4. If rule misconfigured: Update via CR Rule Management Dashboard
5. If flash sale rule: Ensure rollback scheduled or manual disable post-sale
6. Document rule change with reason and requestedBy

### Key Debugging Queries

```sql
-- Check rule executed for a SKU
SELECT * FROM DASH_ERP_ENGG.DASH_ERP_ENGG_DDB.DASH_SCM_INVENTORY_AVAILABILITY
WHERE sku = '{SKU_ID}';

-- Check rule configuration history
SELECT * FROM "STREAMS"."PUBLIC"."SCM_CONTROL_ROOL_RULES_EVENT"
WHERE resourcetype = 'sku' AND RESOURCEID = 'sku-{SKU_ID}'
ORDER BY updatedat DESC LIMIT 100;

-- Check holiday slots
SELECT * FROM "CDC"."CDC_DDB"."CMS_SLOTS"
WHERE hashkey = 'INSTAMART#SKU#{SKU_ID}';

-- Check inventory but OOS items
SELECT * FROM prod.dash_erp_engg.dash_scm_inventory_availability
WHERE sellable > 0 AND in_stock = false;
```

---

## Key Data Tables

| Table | Purpose |
|-------|---------|
| `DASH_ERP_ENGG.DASH_ERP_ENGG_DDB.DASH_SCM_INVENTORY_AVAILABILITY` | Availability state (in_stock, overridden_oos, rule_id) |
| `STREAMS.PUBLIC.SCM_CONTROL_ROOL_RULES_EVENT` | Rule history (requestedBy, enabled, threshold) |
| `CDC.CDC_DDB.CMS_SLOTS` | Holiday slots, time-based visibility |
| `prod.dash_erp_engg.dash_scm_inventory_availability` | Real-time availability state |

---

## Documentation References

| Document | Purpose | Link |
|----------|---------|------|
| **IAS On-Call Guidelines** | Alert resolution runbook | Confluence |
| **Debugging Doc SCM Control Room** | Rule verification, availability audit | Confluence |
| **Rule and Item Availability Audit** | Table schema, SQL queries for RCA | Confluence |
| **SCM Control Room Overview** | System architecture and flows | Confluence |

---

## Known Gaps

1. **No automated rule lifecycle management** for flash sales (manual enable/disable required)
2. **No formalized config change SOP** with approval workflow
3. **Scheduled rule automation not available** (confirmed by Vaibhav Juneja)
4. **Config error rate not explicitly tracked** as a metric

---

## Agent Integration

**When to route to Product Support**:
- Reason codes: `pod_inactive` (oos_0, instock_0), `disabled_pod` (oos_1), `movement_blocked_list` (instock_2)
- Pattern indicates POD-level config issue (POD disabled or movement blocked)
- Items with inventory showing as OOS due to `overridden_oos` flag (check `DASH_SCM_INVENTORY_AVAILABILITY`)
- Control Room rule issues (check `SCM_CONTROL_ROOL_RULES_EVENT`)
- Flash sale aftermath issues (rules not rolled back)

**Key Signals to Surface**:
- Active Control Room rules for SKU
- Rule history (recent changes)
- overridden_oos flag status
- Holiday slot configuration
- IAS rule evaluation logs

**Action Verbs**: Check, Validate, Review, Update, Disable, Escalate, Debug
