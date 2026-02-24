# Swiggy Instamart Network Configuration and Serviceability: Deep-Dive Research

## Executive Summary

This document provides comprehensive documentation on Swiggy Instamart's network configuration and serviceability architecture, covering pod network structure, serviceability rules, customer-pod assignment algorithms, capacity constraints, and geospatial systems.

---

## 1. Pod Network Structure

### 1.1 Pod Types and Tiers

| Type | Description |
|------|-------------|
| **Regular IM Pods** | Standard dark stores serving local areas |
| **Mega Pods** | Large-format stores with extended coverage (6-6.5 km) |
| **Buffer Pods** | Launched in Tier 1 cities for overflow demand |
| **New Pods** | Recently launched with special onboarding |
| **Relocation Pods** | Existing pods moved to new locations |

### 1.2 City Tiers

| Tier | Description |
|------|-------------|
| **Tier 1** | Major metros (Bangalore, Mumbai, Delhi, Hyderabad) |
| **Tier 2/3** | Secondary markets with growing presence |
| **4XL and above** | Large pods requiring 6 km serviceability radius |

### 1.3 Pod Onboarding Prerequisites

1. FSSAI License Number configured in KMS
2. Invoice Identifier setup
3. Express putaway enabled
4. Pod added to FEFO configs (Tier 1)
5. Control Room configuration updated
6. FNV Master enablement (if applicable)
7. Discovery and serviceability thresholds configured

---

## 2. Serviceability Rules and Logic

### 2.1 Distance-Based Serviceability (Legacy)

**Distance Calculation:**
- **Primary**: Cached Google 4-Wheeler (G4W) distances at L8 geohash (~19m accuracy)
- **Fallback**: OpenStreetMap (OSM) Mean Shortest Fastest
- **Cache Hit Rate**: ~97%

**Key Distance Parameters:**

| Parameter | Regular Pod | Mega Pod |
|-----------|-------------|----------|
| **Last Mile (LM)** | 4 km | 6-6.5 km |
| **DDE LM** | Up to 6 km | Up to 6 km |
| **Discovery LM** | Configurable | Configurable |

**Serviceability Decision Flow:**
```
1. dash-orderability calls central-address-service for nearby pods
2. dash-serviceability evaluates each pod:
   ├── Distance checks (LM threshold)
   ├── Predicted SLA compliance
   ├── Banner factor capacity state
   ├── Time-based constraints
   └── Blackzone exclusions
3. Returns prioritized list sorted by distance
```

### 2.2 Polygon-Based Serviceability (Isolines) - LIVE

**Status:** Live in Kolkata (Dec 11, 2025), rolling out to other cities

**Why Polygon-Based:**
- Inconsistent serviceability from distance fluctuations
- Need to exclude specific areas (blackzones)
- More granular control over service boundaries

**Polygon Types:**

| Layer | Purpose |
|-------|---------|
| `ISOLINES_IM` | Primary serviceability boundaries |
| `ISOLINES_IM_SECONDARY` | Extended coverage, BL-specific |
| `INSTAMART_BLACKZONES` | Excluded areas |

**Polygon Generation Methods:**
- **Isochrone**: Based on p2p delivery time model
- **Isodistance**: Based on routing distance (GeoApify)
- **Hybrid**: Intersection of time and distance
- **Manual**: Ops can edit for edge cases

**Configuration:**
```
fetch.serviceability.polygon.enabled = true (application level)
STORES_ENABLED_FOR_POLYGON_SERVICEABILITY = [pod_ids] (city level)
```

**Performance Requirements:**
- P99 latency increase < 10ms
- Concurrent polygon fetching via CompletableFuture
- Circuit breaker for Regions service
- Fallback to distance-based if unavailable

---

## 3. Mega Pod vs Regular Pod Differences

| Aspect | Regular Pod | Mega Pod |
|--------|-------------|----------|
| **Coverage Radius** | 4 km | 6-6.5 km |
| **SKU Selection** | 2,000-3,000 | 5,000+ |
| **Storage Capacity** | Standard | 2-3x larger |
| **Priority** | Standard | Primary (<4km) + Secondary (4-6.5km) |
| **DDE Allocation** | Standard | Higher count for longer distances |

---

## 4. Customer-to-Pod Assignment Algorithms

### 4.1 Discovery Phase

```
Nearby Pod Identification:
1. Haversine distance filter (up to 7 km - reduced from 8 km)
2. Pod discovery LM threshold check
3. Operational status validation (open hours, not disabled)
```

### 4.2 Primary Pod Selection

**Priority Ranking:**
1. **Distance**: Closest pod with available inventory
2. **Serviceability**: Must pass all checks
3. **Capacity**: Pod not in "Full" banner factor state
4. **Polygon**: Customer within primary polygon (new system)

**Special Cases:**
- **Society Stores**: Society pod = primary; nearest regular = secondary
- **New Pod Launch**: H3-based demand redistribution

### 4.3 Secondary Pod Logic

**When Primary Unavailable:**
- Evaluate pods within secondary LM threshold
- Consider mega pods with extended coverage
- Use secondary serviceability polygons
- Apply shared DE banner factor checks

### 4.4 Customer Redistribution (New Pod Launch)

```python
for each customer_hex:
    current_pod = get_historical_preference(customer_hex)
    new_pods_nearby = get_pods_with_lower_distance(customer_hex)

    if new_pods_nearby:
        reassign_customer(customer_hex, new_pods_nearby[0])  # Lowest LM wins
    elif current_pod_closed:
        reassign_customer(customer_hex, nearest_alternative_pod)
```

---

## 5. Capacity Constraints and Banner Factor

### 5.1 Banner Factor Definition

```
Banner Factor (BF) = Active Demand / Active Supply
```

### 5.2 Banner Factor Levels

| Level | Scope |
|-------|-------|
| **Zone-Level** | All demand/supply in delivery zone |
| **Service Line (SL1, SL2)** | Segmented by business line |
| **Cohort-Level** | By DE type (dde_im_v2, base_food, base) |
| **Pod-Level** | Specific to IM pod |

### 5.3 DE Cohorts

| Cohort | Business Lines | LM Range |
|--------|---------------|----------|
| `dde_im_v2` | Instamart only | 0-X km |
| `base_food` | Food only | 0-infinity |
| `base` | All | 0-infinity |

### 5.4 Pod-Level Banner Factor Calculation

```
Pod BF = (Assigned Orders to DDE + Unassigned Orders in 0-X km) / Active DDEs tagged to pod
```

**Refresh Rate**: Every 15 seconds

### 5.5 Selective Dipping Strategy

**Stages:**
1. Stage 1: Use only DDEs (dedicated fleet)
2. Stage 2: Add buffer SDEs when pod BF > 1.0
3. Stage 3: Full zone shared fleet when severe stress

**Configuration:**
```
IM_SELECTIVE_DIPPING_START_POD_BANNER_FACTOR = 1.0
IM_BUFFER_SDE_COUNT_PER_POD = X (per city/zone)
IM_BUFFER_SDE_FOOD_STOP_BANNER_FACTOR = 1.5
```

### 5.6 Capacity State Transitions

| State | Description | Impact |
|-------|-------------|--------|
| `NOT_FULL` | BF below threshold | Normal serviceability |
| `FULL` | BF above threshold | Degradation, backup pods |

---

## 6. Unserviceability Reasons Breakdown

| Reason | Value | Description | Solution |
|--------|-------|-------------|----------|
| `LAST_MILE` | 0 | Beyond LM threshold | Expand network |
| `MAX_SLA` | 1 | Predicted time exceeds max | Increase DE capacity |
| `ITEMS_EXCEED` | 2 | Order exceeds limits | Rare for IM |
| `RAIN` | 3 | Rain mode active | Weather-dependent |
| `BANNER_FACTOR` | - | Zone/pod at capacity | Hire more DEs |
| `BLACKZONE` | - | Customer in excluded area | Polygon adjustment |

---

## 7. Network Expansion Criteria

### 7.1 Pod Launch Decision Framework

**Demand Indicators:**
1. High session counts from unserviceable areas
2. Poor conversion due to elevated delivery times
3. Geographic gaps >4km from existing pods
4. Competitor-served areas not covered

**Supply Indicators:**
1. Sustained high banner factor (>2.0)
2. pSLA consistently above targets
3. Minimum 350 orders/day projected

**Operational Readiness:**
1. Suitable real estate location
2. Ability to hire 15-25 DDEs
3. Supplier capacity for stocking
4. 10-minute delivery promise viability

### 7.2 New Pod Demand Forecasting

**Pipeline Stages:**
1. Historical Data Collection
2. Feature Engineering
3. TFT Model Training
4. Prediction Generation
5. New Pod Logic (H3 analysis)
6. Demand Redistribution
7. Split-Cart Adjustment
8. Production Deployment

**Capacity Planning:**
- Minimum: 350 orders/day for new pods
- Absolute minimum: 200 orders/day
- Growth rates: 3.5% split-cart (new), 15% (mega)

---

## 8. Geospatial Systems (H3 Hexagonal Indexing)

### 8.1 H3 Framework

**What is H3:**
- Hierarchical hexagonal geospatial indexing
- Multiple resolution levels (L1-L15)
- Used for customer-to-pod mapping

**IM Usage:**
- Customer Location Mapping
- Demand Aggregation
- Pod Assignment
- Network Planning

**Resolution Levels:**

| Level | Area | Use Case |
|-------|------|----------|
| L7 | ~1.22 km² | Broader zone analysis |
| L8 | ~0.17 km² | Primary caching level |

### 8.2 Tile38 Geospatial Database

**Infrastructure:**
- Service: regions-geo-stores-1-core
- Database: Tile38
- Performance: PIP checks in 8-10ms p99

**Layers:**

| Layer ID | Description |
|----------|-------------|
| `MARKET_PLACE_ID_SWIGGY_IN::BUSINESS_LINE_INSTAMART::STORE_ADDRESS` | Pod addresses |
| `ISOLINES_IM` | Primary polygons |
| `ISOLINES_IM_SECONDARY` | Secondary polygons |
| `INSTAMART_BLACKZONES` | Exclusion zones |

**API Operations:**
- Intersects API: Point-in-polygon checks
- Index/Delete/Get: CRUD on polygons
- Bulk Operations: Batch processing

---

## 9. Key Technical Challenges

### 9.1 Distance Calculation Accuracy

**Problem**: Google API expensive; OSM less accurate

**Solution:**
- L8 geohash caching (97% hit rate)
- Async cache filling on Swiggy Home Page
- Real-time Google calls at cart

**Future**: Polygon-based eliminates distance dependency

### 9.2 Serviceability Consistency

**Problem**: Distance-based fluctuates due to:
- Google distance changes
- Cache staleness
- Edge cases at boundary

**Solution**: Polygon-based provides:
- Deterministic boundaries
- No fluctuation unless polygon updated
- Visual coverage maps for customers

### 9.3 Blackzone Management

**Problem**: No exclusion ability in distance-based system

**Solution**: Dedicated blackzone polygon layer with:
- Time-based constraints
- Reason codes for communication
- Easy ops management via dashboard

### 9.4 New Pod Ramp-Up

**Challenge**: Forecasting demand with no history

**Solution:**
- City/zone patterns for new pods
- H3-based customer reassignment
- Conservative thresholds (350 orders min)
- Dynamic adjustment after first week

### 9.5 Multi-Pod Coordination

**Challenge**: Optimal assignment when equidistant

**Current Logic:**
1. Distance tie-break: Exact distance
2. Availability: Pod with more SKUs
3. Capacity: Lower banner factor
4. Polygon: Primary > secondary

---

## 10. Network Optimization Insights

### 10.1 Coverage Optimization

**Current Metrics:**
- Average pod: 4 km radius (~50 km² area)
- Mega pod: 6 km radius (~113 km² area)
- Target: 90%+ coverage in Tier 1 cities

**Gaps Identified:**
- Areas >4km from nearest pod with demand
- Competitor-served areas not covered
- High-density residential just outside coverage

### 10.2 Efficiency Improvements

**Google API Cost Reduction:**
- Moving to polygon PIP eliminates distance calls
- IM Google cost = 80% of pre-order serviceability spend
- Estimated savings: ~$1,080/month from radius optimization

**Serviceability Performance:**
- Target: <20ms P99 for polygon fetch
- Fallback: Distance-based (graceful degradation)

### 10.3 Demand-Supply Matching

**Strategies:**
1. Pod-Level BF Monitoring: Real-time stress tracking
2. Buffer SDE Allocation: Shared DEs to stressed pods
3. Selective Dipping: Progressive shared fleet usage

---

## 11. Key Document References

### Confluence Documentation
1. [IM Consistent and Simplified Serviceability: Isolines](https://swiggy.atlassian.net/wiki/spaces/SP/pages/4862869629)
2. [Support Isolines and Blackzone Polygons](https://swiggy.atlassian.net/wiki/spaces/MAPS/pages/4903403566)
3. [Locality Capacity Factor LLD](https://swiggy.atlassian.net/wiki/spaces/DECAP/pages/4079781141)
4. [IM Serviceability Distance Calculation Strategy](https://swiggy.atlassian.net/wiki/spaces/MAPS/pages/4095967277)
5. [dash-serviceability Service Documentation](https://swiggy.atlassian.net/wiki/spaces/SP/pages/4456481154)
6. [Enabling a pod on MIM Stack](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/3632857456)
7. [Priority Order Management / BF Modification](https://swiggy.atlassian.net/wiki/spaces/DECAP/pages/4807525450)
8. [Black Zones for IM - HLD](https://swiggy.atlassian.net/wiki/spaces/SP/pages/4803625087)

### GitHub Repositories
9. dash-serviceability
10. delivery-auto-assign
11. regions-crud-service
12. del-banner-go
13. im-discovery-service

### Data Sources
14. `analytics.public.im_parent_order_fact`
15. `data_science.ds_storefront.im_pod_hr_demand_forecasting`
16. `streams.public.li_cx_subzone_data`

---

## Summary

Swiggy Instamart's network configuration and serviceability has evolved from distance-based to polygon-based systems. Key initiatives include:

- **Polygon serviceability (Isolines)**: LIVE in Kolkata (Dec 11, 2025), deterministic coverage
- **Priority-adjusted banner factor** for fair capacity allocation
- **Enhanced demand forecasting** for new pod launches
- **Cost optimization** through strategic distance calculation

The system balances customer experience (fast delivery), operational efficiency (DE utilization), and network expansion (strategic pod placement) through comprehensive metrics and real-time capacity monitoring.

---

*Document compiled from Glean research across internal sources | December 2025*
