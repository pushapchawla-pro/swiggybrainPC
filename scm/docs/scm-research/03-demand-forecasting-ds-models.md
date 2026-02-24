# Swiggy Instamart Demand Forecasting and Data Science Models: Deep-Dive Research

## Executive Summary

Swiggy Instamart operates a comprehensive ML-driven forecasting infrastructure designed to predict demand at multiple granularities - from pod-hour level order prediction to SKU-level demand forecasting. This document covers the complete forecasting architecture, models, and improvement initiatives.

---

## 1. Overview of Forecasting Architecture

### Strategic Context

The forecasting system supports critical business functions:
- **DE (Delivery Executive) capacity planning** at pod-hour level
- **Movement planning** from warehouse to pod
- **Inventory optimization** and replenishment
- **Raider (picker) planning** for operational efficiency

### Core Pipeline Architecture

```
10-Stage Sequential Pipeline:

1. Training Data Collection
       ↓
2. Feature Engineering
       ↓
3. TFT Model Training
       ↓
4. Prediction Generation
       ↓
5. Prediction Processing
       ↓
6. New Pod Logic
       ↓
7. Demand Redistribution
       ↓
8. Surplus Distribution
       ↓
9. Split-Cart Adjustment
       ↓
10. Production Deployment
```

---

## 2. TFT (Temporal Fusion Transformer) Model Details

### 2.1 Model Architecture

The core forecasting engine uses **Temporal Fusion Transformers (TFT)**, a state-of-the-art deep learning architecture for multivariate time series forecasting.

### 2.2 Key Model Parameters

```python
dataset_parameters = {
    "time_idx": "dt_idx",
    "target": "orders",
    "group_ids": ["store_id", "hr"],
    "min_encoder_length": 7,
    "max_encoder_length": 14,
    "min_prediction_length": 1,
    "max_prediction_length": 14,
    "static_categoricals": ["store_id", "city_name", "hr", "slot", "group_id"],
    "time_varying_known_categoricals": ["dow"],
    "time_varying_unknown_reals": ["availability", "serv"] + marketing_spend_actual,
    "time_varying_known_reals": marketing_spend_planned,
    "allow_missing_timesteps": True
}
```

### 2.3 Model Configuration

| Parameter | Value |
|-----------|-------|
| **Encoder Length** | 7-14 days |
| **Prediction Length** | 1-14 days |
| **Quantiles** | [0.4, 0.5, 0.6, 0.7, 0.8] |
| **Hidden Size** | 16 |
| **Attention Heads** | 4 |
| **Learning Rate** | 0.001 |

### 2.4 Training Strategy

- **Non-traditional setup**: Trains on Train+Val, validates on Val (patience kept low)
- **Typical epochs**: ~12 with early stopping (max cap at 15)
- **Minimum timesteps**: 1+7 = 8 days of data per store

### 2.5 Key Model Capabilities

1. **Quantile Regression**: Predicts uncertainty intervals (crucial for capacity planning)
2. **Variable Selection Networks**: Handles different input types intelligently
3. **Attention Mechanisms**: Learns complex interactions between features
4. **Missing Data Handling**: Can handle stores with incomplete historical data

### 2.6 Performance Impact

- **MAPE Improvement**: 1.5-1.6 percentage points
- **From**: 20.2% → **To**: ~18.6% at pod-hour level
- **Launch Date**: TFT pan-India rollout August 15, 2025 (replaced ML-based OPD model from April 2024)

### 2.7 TimeGEN-1 Exploration

A next-generation forecasting model is being evaluated:

| Attribute | Detail |
|-----------|--------|
| **Source** | Azure AI Catalog (Nixtla) |
| **JIRA** | GA-13 |
| **Purpose** | SKU-level forecasting with zero-shot capabilities |
| **Status** | Onboarding in progress |
| **Advantage** | No training required; foundation model approach |

---

## 3. Movement Planning Forecasting

### 3.1 Overview

Movement planning converts demand forecasts into actionable inventory transfer plans from warehouses to pods.

### 3.2 FnV (Fruits & Vegetables) Movement Planning Pipeline

**Stage 0: Data Preparation**
- Integrates city/store/SKU mappings, sales data, availability
- Computes time-series features and predicted run-rates
- Handles liquidation adjustments for perishables

**Stage 1: Error Profile Preparation**
- Computes forecast errors at store_id x item_code x slot level
- Calculates APE and AE
- Applies percentile capping and decay-weighted bias correction

**Stage 2: Movement Plan Generation**
- Uses **PuLP optimization** with HiGHS solver
- Runs per-city linear programming optimization
- Applies capacity and cold-storage constraints
- Generates final movement plans with QC checks

### 3.3 Key Improvements (2024-2025)

| Metric | Improvement |
|--------|-------------|
| **Runtime Reduction** | 50% (1h 44min → 35min) |
| **Cost Savings** | ~Rs 10 lakhs/month |
| **Reliability** | Eliminated frequent failures |

### 3.4 FnV Dual Dispatch Pilot (Chennai)

- Two dispatch slots per day vs single daily dispatch
- **Impact**: +6pp availability, -2.5pp expiry wastage

---

## 4. PSLA (Promised Service Level Agreement) Prediction

### 4.1 Model Purpose

The IM PSLA model predicts delivery time components:
- O2A (Order to Accept)
- FM (First Mile)
- O2MPR (Order to Market Place Ready)
- Service Time
- LM (Last Mile)
- R2D (Rider to Delivery)
- O2D (Order to Delivery)
- O2R (Order to Rider)

### 4.2 Architecture

- **Platform**: DSP (Data Science Platform) runtime
- **Features**: Near real-time features from RILL platform stored in Redis

### 4.3 Input Signals

| Signal Type | Examples |
|-------------|----------|
| **Assignment-based** | Soft assignment counts, DE availability |
| **Store-level** | Banner factor, engaged/idle pickers |
| **Order characteristics** | Item count, weight, bill amount |
| **Temporal** | Hour, day of week, slot |
| **External** | Rain flag, demand/supply ratios |

### 4.4 Model Default Values

```
banner_factor: 0.7
engaged_pickers: 4
rain_flag: 0
idle_pickers: 1
supply: 28
demand: 18
bill_amount: 200
order_total_quantity: 3
order_item_count: 3
order_total_weight: 1800
```

---

## 5. Feature Engineering Approaches

### 5.1 Feature Categories

**1. Lag Features**
- Historical patterns at 7, 14, 21, 28, 35 days
- Windowing functions partitioned by store and hour
- Captures cyclical patterns and seasonal trends

**2. Rolling Averages**
- 7-day, 14-day averages
- Range-based approach for consistent lookback
- Smooths noise while capturing medium-term patterns

**3. Seasonal Features**
- Day of week (DOW)
- Hour of day
- Week of month (WOM)
- Day of month (DOM)
- Same day-of-week from previous weeks

**4. Operational Metrics**
- **Availability**: Available minutes / total open minutes per store-hour
- **Serviceability**: % of sessions resulting in serviceable areas
- **PSLA**: Predicted delivery time accuracy

**5. External Data**
- Marketing spend (actual and planned)
- Discounting data
- Store operational hours

### 5.2 Anomaly Handling

**IQR-Based Detection and Imputation:**
1. Calculate Q1, Q3, and IQR for each store-hour-day
2. Flag values outside 1.5x IQR bounds
3. Replace anomalous values with average of last 2-3 non-anomalous values
4. Prevents festivals/outages from skewing training

### 5.3 Data Sources

| Table | Data |
|-------|------|
| `prod.dsp_delta.instamart_o2d` | PSLA data |
| `analytics.public.im_parent_order_fact` | Historical orders |
| `analytics.public.session_serviceability_d1` | Serviceability |
| `analytics.public.pr_hr_level_avl` | Pod hour-level availability |
| `SWIGGYKMS.SWIGGY_KMS.STORES` | Store master |

### 5.4 Promotional & Campaign Demand Planning

**Overview:**
Marketing campaigns, promotions, and external events significantly impact demand patterns. The forecasting system incorporates these signals but has gaps in coverage.

**Marketing Spend Integration:**

The TFT model includes marketing spend as time-varying features:
- `marketing_spend_actual`: Historical marketing investments (known reals)
- `marketing_spend_planned`: Future campaign budgets (known future reals)
- Granularity: Pod-day level, aggregated from campaign data

**Surplus Distribution Logic:**

When promotional demand creates excess inventory:
1. Promotional uplift calculated at category/SKU level
2. Surplus redistributed across pods based on capacity
3. Near-expiry promotional items prioritized for liquidation
4. Movement planning adjusted for promotional periods

**External Event Handling:**

| Event Type | Current Handling | Gap |
|------------|------------------|-----|
| **IPL Matches** | Manual uplift adjustment | 20.1% MAPE vs 17.5% normal |
| **Festivals** | Historical pattern matching | Timing variability issues |
| **City Events** | Not systematically captured | Local demand spikes missed |
| **Weather** | Rain flag only | Temperature, humidity not used |

**Key Challenges:**
- External event signals not systematically incorporated
- IPL showed significant MAPE degradation (20.1% vs 17.5%)
- Festival timing variability hard to model
- Local events (concerts, exhibitions) not captured

**Planned Improvements:**
- Integration of marketing calendar data
- Cricket match schedule as explicit feature
- Weather pattern expansion beyond rain flag
- City-level marketing spend granularity

---

## 6. Model Accuracy and Performance Metrics

### 6.1 Production Performance (Pod-Hour Level OPD)

| Metric | Value |
|--------|-------|
| **Overall MAPE** | ~18.6% (baseline post-TFT) |
| **Current MAPE** | 17.5% at pod-hour level |
| **MAPE Improvement** | 1.5-1.6 pp from baseline |
| **Target** | <16% for current week (not yet achieved) |

### 6.2 Multi-Level WAPE Tracking (December 2025 Actuals)

| Level | WAPE | Notes |
|-------|------|-------|
| **Pan-India** | 5.5-10.2% | Target: 5.0% |
| **City-Day** | 5.6-6.1% | Bangalore: 6.1%, Chennai: 5.6-5.8% |
| **Pod-Day Overall** | ~8% | Dec 16-17: 8.02-8.17% |
| **Pod-Day (OPD≥500)** | **4.80%** | High-volume pods |
| **Pod-Day (OPD<500)** | **22.12%** | Low-volume pods ⚠️ |
| **Pod-Hour Overall** | ~15% | Dec 16-17: 14.84-15.01% |
| **Pod-Hour (OPD≥500)** | **4.52%** | High-volume pods |

> **Critical Insight**: Low-volume pods (OPD<500) have **4.6x worse forecasting accuracy** than high-volume pods (22.12% vs 4.80%). This is a key driver of availability issues at smaller dark stores and validates the need for volume-aware forecasting strategies.

### 6.3 Real-Time Monitoring Examples

**Dec 17, 2024:**
- Actual Orders: 103,206
- Forecast Orders: 100,540
- Pod-Day WAPE: 8.00%
- Pod-Hour WAPE: 15.02%

### 6.4 Performance by Segment

| Segment | Pod-Day WAPE |
|---------|--------------|
| **OPD >= 500** | 4-6% (better accuracy) |
| **OPD < 500** | 20-100%+ (high variability) |

### 6.5 Production Table

Final forecasts written to `data_science.ds_storefront.im_pod_hr_demand_forecasting`:
- `store_id`, `new_store`, `date`, `hr`
- `order_forecast` (primary orders)
- `total_deliveries` (including split-cart)
- `updated_at_ist`

---

## 7. Challenges in Forecasting

### 7.1 Operational Challenges

| Challenge | Solution |
|-----------|----------|
| **New Pod Handling** | City-level patterns + minimum thresholds (350 orders/day) |
| **Pod Openings/Closures** | H3 geospatial demand redistribution |
| **Late-Night Hours** | % contribution from last week anchoring |
| **Split-Cart Orders** | Pod-type specific rates (3.5% new, 15% mega) |

### 7.2 Data Quality Challenges

| Challenge | Impact |
|-----------|--------|
| **Feature Defaulting** | Critical - caused Sept 2025 incident |
| **Sparse Data at Scale** | SKU-level forecasting difficult |
| **Data Lag** | CDC table dependencies |

### 7.3 Model Challenges

| Challenge | Status |
|-----------|--------|
| **Next Week Forecasting** | "Forecasts off and not usable" |
| **External Events** | IPL showed 20.1% vs 17.5% MAPE |
| **Model Degradation** | Continuous monitoring needed |

### 7.4 Technical Challenges

| Challenge | Approach |
|-----------|----------|
| **Computational Scale** | TFT chosen over Prophet for efficiency |
| **Infrastructure** | Serverless migration for reliability |

---

## 8. Improvement Initiatives

### 8.1 Recently Completed (2025)

| Initiative | Impact |
|------------|--------|
| **TFT Model Deployment** | 1.5-1.6pp MAPE reduction |
| **Movement Planning Portal** | 50% runtime reduction, Rs 10L/month savings |
| **FnV Dual Dispatch** | +6pp availability, -2.5pp wastage |

### 8.2 In Progress

| Initiative | Description |
|------------|-------------|
| **TimeGEN-1 Model** | Transformer-based, zero-shot forecasting (see Section 2.7) |
| **SKU-Level Forecasting** | TFT extensions for key categories |
| **Feedback Loops** | Stock-outs → Forecasting retraining |
| **Demand Attribution Pipeline** | Completed - correlates sessions → orders → SKU sales (GitHub PR #226) |
| **Promise Intelligence Layer** | End-to-end AI layer combining TFT forecasts + movement planning + PSLA + 3PL routing |

### 8.3 Planned (Next 12-24 Months)

1. **Stock Intelligence Dashboard**: Unified forecasting + inventory metrics (pilot active)
2. **Demand-Driven Storefront**: Feed low-inventory SKUs to rankers (integrates with search/ranking + dynamic pricing)
3. **Dynamic Pricing Integration**: Stock signals to pricing engine
4. **Autonomous Ordering Loops**: Human-to-machine supervision transition (being integrated with demand forecasting)
5. **GenAI Knowledge Graphs**: Automated product enrichment for search/personalization/pricing

### 8.4 Future Exploration

- Weather patterns
- Local events (currently manual)
- Cricket match schedules
- Traffic patterns
- Competitor promotions
- City-level marketing spend granularity

---

## 9. Key Document References

### Core Documentation
1. [IM POD-HR demand forecasting](https://swiggy.atlassian.net/wiki/spaces/~71202025aeda350d6c46c49a584e710e73c287/pages/4753752783)
2. [AI-Native Intelligence for Swiggy Instamart](https://docs.google.com/document/d/1110blKM9CCGPdhWN7XbGRkdhiq1-8HcZrsPJpfpmtM8)

### Movement Planning
3. [Movement Planning Portal](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4701618453)
4. [DSD and Movement Planning Purchase Order](https://swiggy.atlassian.net/wiki/spaces/SPAP/pages/4626547115)

### PSLA and Model Performance
5. [Showing Elevated PSLA to Users - Incident Report](https://swiggy.atlassian.net/wiki/spaces/DP/pages/5009965057)
6. [IM pod unserviceability due to higher PSLA](https://swiggy.atlassian.net/wiki/spaces/DP/pages/4154982622)

### Inventory and Replenishment
7. [Stock Replenishment Task Workflow](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4178805093)
8. [LLD: Stock Replenishment](https://swiggy.atlassian.net/wiki/spaces/DASH/pages/4186243147)

### Model Improvement
9. [TimeGEN-1 Model Onboarding Request](https://swiggy.atlassian.net/browse/GA-13)
10. [Mid Term Demand Forecasting - Instamart](https://swiggy.atlassian.net/wiki/spaces/DSmfpdriver/pages/3898736717)

---

## Key Insights and Recommendations

### Strengths
1. Production-grade TFT implementation with demonstrated MAPE improvements
2. Multi-granularity forecasting: Pod-hour, pod-day, city-day levels
3. Comprehensive feature engineering with operational metrics
4. Automated production pipeline with quality checks

### Critical Gaps
1. Next-week forecasting accuracy needs improvement
2. SKU-level forecasting limited by data sparsity
3. External event signals not systematically incorporated
4. Feedback loops from stock-outs are manual

### Strategic Opportunities
1. TimeGEN-1 for far-future forecasting
2. Stock Intelligence Dashboard for unified metrics
3. Dynamic pricing integration
4. Autonomous ordering for stable categories

---

*Document compiled from Glean research across 50+ internal sources | December 2025*
*Last verified: December 22, 2025 - TFT timeline corrected, WAPE actuals updated, missing initiatives added*
