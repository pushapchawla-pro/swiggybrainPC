# Phase 1: Detection Results — Bangalore (30 days)

## G11: Config Flags Blocking Sellable Stock

**Query**: SKUs where WH_STOCK > 5, avail < 10%, ERP_ISSUE = 1, for >= 3 days.

**Result**: 50 rows returned (LIMIT 50). All from **BLR ECOM2**.

### Top 10 SKUs

| ITEM_CODE | Product | Affected PODs | Days | Avg WH Stock | OOS Sessions | Avail % |
|-----------|---------|---------------|------|-------------|-------------|---------|
| 459082 | Diacraft Shubh Labh Chakri Door Sticker | 90 | 29 | 17.2 | 10.6M | 0.0% |
| 196263 | Oye Happy Best-Tea Mug | 90 | 29 | 10.0 | 10.6M | 0.0% |
| 341365 | Oye Happy Traditional Karwa Chauth Thali | 90 | 29 | 8.5 | 10.5M | 0.0% |
| 991856 | Oye Happy Fancy Aluminium Dandiya | 90 | 29 | 12.6 | 10.5M | 0.0% |
| 77878 | Korean Finger Heart Ceramic Mug | 89 | 29 | 18.0 | 10.4M | 0.0% |
| 668578 | Meme Flip Phone | 89 | 29 | 88.3 | 10.4M | 0.0% |
| 346598 | Mad Over Print Mustache | 89 | 29 | 49.8 | 10.4M | 0.0% |
| 492429 | Mad Over Print #BFF Band | 89 | 29 | 44.0 | 10.4M | 0.0% |
| 588843 | Mad Over Print Neon Friendship Band | 89 | 29 | 73.9 | 10.4M | 0.0% |
| 71966 | Archies Photoframe "Love Board" | 89 | 29 | 42.3 | 10.4M | 0.0% |

**Key**: All ERP_ISSUE flag (not ERP_TEMP_DISABLE or OTB_BLOCK). Zero pods with good availability. Predominantly gifting/seasonal items at BLR ECOM2.

---

## C4: Vendor-Wide Low Fillrate

**Query**: Vendors with >= 5 SKUs below 50% QFR_60DAYS in RCA_FILE_WH.

**Result**: 30 vendors. All from **BLR ECOM2** (RCA_FILE_WH data limitation).

### Top 10 Vendors

| Vendor | Total SKUs | SKU-Pod-Day Obs <50% QFR | Avg QFR 60d | Vendor Avail % |
|--------|-----------|--------------------------|-------------|---------------|
| HUL | 1,323 | 188,275 | 0.44 | 91.52% |
| Merhaki Foods | 1,170 | 145,646 | 0.02 | 86.26% |
| Kuber Mart | 714 | 122,890 | 0.05 | 66.25% |
| Khushi Export | 578 | 122,883 | 0.07 | 89.57% |
| (NULL vendor) | 31,278 | 121,162 | 0.00 | 53.15% |
| Value-One Retail | 865 | 116,490 | 0.00 | 94.89% |
| Page Industries | 602 | 112,459 | 0.23 | 90.18% |
| YBJ Fashions | 458 | 112,058 | 0.09 | 90.28% |
| Pepe Jeans | 528 | 111,902 | 0.02 | 90.19% |
| Bianca Home | 544 | 108,999 | 0.03 | 92.44% |

> **⚠ Column Clarification**: "SKU-Pod-Day Obs <50% QFR" counts are **SKU × pod × day observations** where QFR_60DAYS < 50%, NOT distinct SKU counts. For example, HUL has 1,323 distinct SKUs but 188,275 observations because each SKU is counted once per pod per day it appeared with low fillrate. This inflated appearance is expected given the query aggregation level.

**Caveat**: RCA_FILE_WH only covers BLR ECOM2 for Bangalore. Cross-validated in Phase 3 using avail_rca_v7 which confirmed the issue is city-wide.

---

## B3: MOQ/MOV Starving Long-Tail SKUs

**Query**: SKUs with PO flag=0 for >= 80% of 30 days AND >= 10 days zero stock.

**Result**: 50 SKUs. All blocked 100% of 19 observed days. Spans all 5 warehouses.

### Constraint Distribution

| Primary Constraint | Count (~) | Notable Examples |
|--------------------|-----------|-----------------|
| Not a PO Raising Day | ~30 | Supreme Harvest Salt (RR=280), NOICE Coconut Water (RR=230), Tide (RR=67) |
| MOQ Constraint | ~7 | Cadbury Chocobakes (19/19 MOQ days), Munch Max Brownie, Red Rock Deli |
| Case_Size_Constraint | ~7 | Madhur Sugar (RR=44), Lay's Red Chilli (RR=37), Snapin Chilli Flakes |
| MOV Constraint | ~3 | D-Klog Drain Cleaner (19/19 MOV days), Bindu Fizz Jeera |
| Combined | ~3 | NOICE Bhakarwadi (Case_Size + Not PO Day) |

**Key**: NOICE (Swiggy private label) has 12 of 50 blocked SKUs. Supreme Harvest Salt at RR=280 blocked for all 19 days.

---

## C5: PO-Size Bias — Cross-WH Vendor Fillrate Spread (Tier 2.3)

**Query**: Vendors with >= 3 SKUs at >= 2 WHs, with fillrate spread >= 30pp between best and worst WH.

**Data Source**: `TEMP.PUBLIC.ars_uploaded_archives4` (latest date snapshot, Bangalore).

**Result**: Only 2 vendors detected. C5 is NOT a structural pattern at city level.

| Vendor | WHs | Best WH | Worst WH | Spread | Breakdown |
|--------|-----|---------|----------|--------|-----------|
| Bhawar Sales Corp | 2 | 93% (BLR ECOM2, 14 SKUs) | 43% (BLR IM1, 15 SKUs) | 50pp | Similar SKU count but very different fillrate |
| Mars Cosmetics | 2 | 98% (BLR ECOM2, 20 SKUs) | 58% (BLR IM1, 91 SKUs) | 40pp | Worse fillrate at higher scale |

**Key**: Only 2 of all Bangalore vendors show significant cross-WH fillrate differential. This does not constitute a structural pattern. Individual vendor follow-up may be warranted (especially Bhawar Sales at BLR IM1) but not as a systemic intervention.

---

## E8: Pod Allocation Bias (Later Reclassified as WH→Pod Distribution Bottleneck)

**Query**: SKUs with stddev > 10pp and worst pod 15pp below mean across pods in same WH.

**Result**: 30 SKUs. All show 0→100% spread. Mostly BLR ECOM2 (28) + BLR COLDSTAR (2).

### Top 5 SKUs

| ITEM_CODE | Product | Pods | Mean Avail | StdDev | Worst | Best | OOS Sessions |
|-----------|---------|------|-----------|--------|-------|------|-------------|
| 224247 | Amul Greek Feta Cheese | 89 | 19.7 | 31.4 | 0.0 | 100.0 | 9.9M |
| 882459 | Odonil Gel Pocket Air Freshener | 90 | 16.3 | 32.7 | 0.0 | 100.0 | 9.9M |
| 23349 | Unibic Cashew Cookies Sugar Free | 90 | 16.2 | 29.5 | 0.0 | 100.0 | 9.8M |
| 19274 | Odonil Room Air Freshener Combo | 90 | 15.5 | 26.9 | 0.0 | 100.0 | 9.7M |
| 950631 | Sweet Karam Coffee Kanthari Chips | 90 | 15.8 | 35.2 | 0.0 | 100.0 | 9.7M |

**Key**: Binary distribution — pods either have it 100% or 0%. Spans all categories (dairy, beverages, snacks, household).
