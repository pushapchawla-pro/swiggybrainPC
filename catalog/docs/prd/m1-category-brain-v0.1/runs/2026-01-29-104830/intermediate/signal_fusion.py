#!/usr/bin/env python3
"""
Signal Fusion Layer for Category Brain v0.1
Combines internal search signals with Google Trends to compute emerging_score
"""

import json
import csv
from datetime import datetime
from pathlib import Path

RUN_DIR = Path("/Users/sidhant.panda/workspaces/root-workspace/swiggy-brain/catalog/docs/prd/m1-category-brain-v0.1/runs/2026-01-29-104830")

def load_snowflake_data():
    """Load internal search metrics from Snowflake"""
    data = {}
    with open(RUN_DIR / "evidence/snowflake/search_metrics.csv") as f:
        reader = csv.DictReader(f)
        for row in reader:
            term = row['SEARCH_STRING'].lower()
            data[term] = {
                'search_string': row['SEARCH_STRING'],
                'l1_category': row['L1_CATEGORY'],
                'l2_category': row['L2_CATEGORY'],
                'current_week_volume': int(row['CURRENT_WEEK_VOLUME']),
                'prev_week_volume': int(row['PREV_WEEK_VOLUME']),
                'wow_growth_pct': float(row['WOW_GROWTH_PCT']) if row['WOW_GROWTH_PCT'] else 0,
                'zero_result_rate': float(row['ZERO_RESULT_RATE']) if row['ZERO_RESULT_RATE'] else 0,
            }
    return data

def load_google_trends():
    """Load Google Trends data"""
    data = {}
    with open(RUN_DIR / "evidence/google_trends/terms_queried.csv") as f:
        reader = csv.DictReader(f)
        for row in reader:
            term = row['term'].lower()
            data[term] = {
                'google_interest': int(row['current_interest']),
                'google_mom_growth': float(row['mom_growth_pct']) if row['mom_growth_pct'] else 0,
            }
    return data

def load_availability_rca():
    """Load availability RCA summary by L2 category"""
    data = {}
    with open(RUN_DIR / "evidence/databricks/availability_rca.csv") as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            l2 = row['L2'].lower() if row.get('L2') else ''
            if l2 not in data:
                data[l2] = {
                    'avg_availability': float(row['avg_availability_pct']) if row['avg_availability_pct'] else 0,
                    'top_reason': row['FINAL_REASON'],
                    'sku_count': int(row['sku_count']),
                }
    return data

def normalize_score(value, min_val, max_val):
    """Normalize value to 0-100 scale"""
    if max_val == min_val:
        return 50
    return max(0, min(100, ((value - min_val) / (max_val - min_val)) * 100))

def compute_emerging_score(internal_data, trends_data, availability_data):
    """
    Compute emerging_score for each term

    Formula:
    emerging_score = 0.5 * internal_growth_normalized +
                     0.3 * google_interest_normalized +
                     0.2 * (100 - zero_result_rate_normalized)

    With confidence based on signal alignment
    """
    results = []

    # Get all WoW growth values for normalization
    wow_values = [d['wow_growth_pct'] for d in internal_data.values()]
    wow_min, wow_max = min(wow_values), max(wow_values)

    for term, internal in internal_data.items():
        # Get Google Trends data if available
        trends = trends_data.get(term, {'google_interest': 0, 'google_mom_growth': 0})

        # Get availability for this L2 category
        l2_key = internal['l2_category'].lower() if internal['l2_category'] else ''
        availability = availability_data.get(l2_key, {'avg_availability': 80, 'top_reason': 'Unknown'})

        # Normalize internal growth (0-100)
        internal_growth_norm = normalize_score(internal['wow_growth_pct'], wow_min, wow_max)

        # Google interest is already 0-100
        google_interest_norm = trends['google_interest']

        # Zero result rate contribution (lower is better)
        zero_result_score = 100 - (internal['zero_result_rate'] * 100)

        # Compute emerging_score
        # Weight: 50% internal growth, 30% google interest, 20% search success rate
        emerging_score = (
            0.50 * internal_growth_norm +
            0.30 * google_interest_norm +
            0.20 * zero_result_score
        )

        # Determine confidence based on signal alignment
        has_google_data = trends['google_interest'] > 0
        signals_aligned = (internal['wow_growth_pct'] > 0 and trends['google_mom_growth'] > 0) or \
                         (internal['wow_growth_pct'] < 0 and trends['google_mom_growth'] < 0)

        if has_google_data and signals_aligned:
            confidence = 'high'
        elif has_google_data or internal['current_week_volume'] > 2000:
            confidence = 'medium'
        else:
            confidence = 'low'

        # Flag supply-side vs demand-side
        if availability['avg_availability'] < 70:
            opportunity_type = 'supply_constrained'
        elif internal['wow_growth_pct'] > 50:
            opportunity_type = 'demand_surge'
        else:
            opportunity_type = 'stable_growth'

        results.append({
            'search_string': internal['search_string'],
            'l1_category': internal['l1_category'],
            'l2_category': internal['l2_category'],
            'emerging_score': round(emerging_score, 2),
            'confidence': confidence,
            'opportunity_type': opportunity_type,
            # Internal signals
            'internal_volume': internal['current_week_volume'],
            'internal_wow_growth': internal['wow_growth_pct'],
            'zero_result_rate': internal['zero_result_rate'],
            # Google signals
            'google_interest': trends['google_interest'],
            'google_mom_growth': trends['google_mom_growth'],
            # Availability
            'category_availability': availability['avg_availability'],
            'top_oos_reason': availability['top_reason'],
            # Normalized scores (for transparency)
            'internal_growth_norm': round(internal_growth_norm, 2),
            'google_interest_norm': round(google_interest_norm, 2),
            'zero_result_norm': round(zero_result_score, 2),
        })

    # Sort by emerging_score descending
    results.sort(key=lambda x: x['emerging_score'], reverse=True)

    return results

def main():
    print("=" * 60)
    print("Signal Fusion - Category Brain v0.1")
    print("=" * 60)

    # Load data
    print("Loading Snowflake search data...")
    internal_data = load_snowflake_data()
    print(f"  Loaded {len(internal_data)} terms")

    print("Loading Google Trends data...")
    trends_data = load_google_trends()
    print(f"  Loaded {len(trends_data)} terms")

    print("Loading availability RCA...")
    availability_data = load_availability_rca()
    print(f"  Loaded {len(availability_data)} L2 categories")

    # Compute emerging scores
    print("\nComputing emerging_score...")
    results = compute_emerging_score(internal_data, trends_data, availability_data)

    # Save results
    output_path = RUN_DIR / "intermediate/signal_fusion.json"
    with open(output_path, 'w') as f:
        json.dump({
            'computed_at': datetime.now().isoformat(),
            'total_terms': len(results),
            'formula': 'emerging_score = 0.5*internal_growth_norm + 0.3*google_interest_norm + 0.2*zero_result_score',
            'confidence_distribution': {
                'high': len([r for r in results if r['confidence'] == 'high']),
                'medium': len([r for r in results if r['confidence'] == 'medium']),
                'low': len([r for r in results if r['confidence'] == 'low']),
            },
            'results': results
        }, f, indent=2)

    # Save ranked CSV
    csv_path = RUN_DIR / "intermediate/ranked_terms.csv"
    with open(csv_path, 'w', newline='') as f:
        fieldnames = ['search_string', 'l1_category', 'l2_category', 'emerging_score', 'confidence',
                      'opportunity_type', 'internal_volume', 'internal_wow_growth', 'google_interest',
                      'category_availability', 'top_oos_reason']
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(results)

    # Print top 15
    print("\nTop 15 Emerging Terms:")
    print("-" * 100)
    print(f"{'Rank':<5} {'Term':<25} {'Score':<8} {'Conf':<8} {'WoW%':<8} {'Volume':<8} {'Type'}")
    print("-" * 100)
    for i, r in enumerate(results[:15], 1):
        print(f"{i:<5} {r['search_string'][:24]:<25} {r['emerging_score']:<8.1f} {r['confidence']:<8} "
              f"{r['internal_wow_growth']:<8.0f} {r['internal_volume']:<8} {r['opportunity_type']}")

    print(f"\nSaved to: {output_path}")
    print(f"CSV: {csv_path}")

if __name__ == "__main__":
    main()
