#!/usr/bin/env python3
"""
Google Trends Data Fetcher for Category Brain v0.1
Fetches trend data for Personal Care search terms from India
"""

import json
import time
import csv
from datetime import datetime
from pytrends.request import TrendReq

# Top search terms from Snowflake with high WoW growth
TERMS_TO_QUERY = [
    # High growth terms (>100% WoW)
    "soap paper",
    "shampoo sachets",
    "pantyliners",
    "beard colour",
    "mehndi",
    "gift set",
    "lifebuoy soap",
    "pregnancy test",
    "face wash",
    "body lotion",
    # High volume baseline terms
    "condom",
    "shampoo",
    "toothbrush",
    "toothpaste",
    "coconut oil",
    "handwash",
    "sunscreen",
    "perfume",
    "lipstick",
    "sanitary pads",
]

def fetch_google_trends():
    """Fetch Google Trends data for terms with rate limiting"""

    pytrends = TrendReq(hl='en-IN', tz=330)  # India timezone

    results = []
    errors = []

    # Process in batches of 5 (pytrends limit)
    batch_size = 5
    delay_seconds = 30  # ADR-002: 30s delay for rate limiting

    for i in range(0, len(TERMS_TO_QUERY), batch_size):
        batch = TERMS_TO_QUERY[i:i+batch_size]
        print(f"Processing batch {i//batch_size + 1}: {batch}")

        try:
            # Build payload for India
            pytrends.build_payload(batch, cat=0, timeframe='today 3-m', geo='IN')

            # Get interest over time
            interest_df = pytrends.interest_over_time()

            if not interest_df.empty:
                # Get latest values and calculate growth
                for term in batch:
                    if term in interest_df.columns:
                        values = interest_df[term].values
                        latest = int(values[-1])
                        month_ago = int(values[-4]) if len(values) >= 4 else latest
                        week_ago = int(values[-1]) if len(values) >= 1 else latest

                        # Calculate growth
                        wow_growth = ((latest - week_ago) / max(week_ago, 1)) * 100 if week_ago > 0 else 0
                        mom_growth = ((latest - month_ago) / max(month_ago, 1)) * 100 if month_ago > 0 else 0

                        results.append({
                            'term': term,
                            'current_interest': latest,
                            'week_ago_interest': week_ago,
                            'month_ago_interest': month_ago,
                            'wow_growth_pct': round(wow_growth, 2),
                            'mom_growth_pct': round(mom_growth, 2),
                            'geo': 'IN',
                            'fetched_at': datetime.now().isoformat()
                        })
                        print(f"  {term}: {latest}/100 (MoM: {mom_growth:.1f}%)")

            # Rate limit delay
            if i + batch_size < len(TERMS_TO_QUERY):
                print(f"  Waiting {delay_seconds}s for rate limiting...")
                time.sleep(delay_seconds)

        except Exception as e:
            print(f"  Error with batch: {str(e)}")
            errors.append({'batch': batch, 'error': str(e)})
            time.sleep(delay_seconds)  # Wait before retry

    return results, errors

if __name__ == "__main__":
    print("=" * 60)
    print("Google Trends Fetcher - Category Brain v0.1")
    print("=" * 60)
    print(f"Terms to query: {len(TERMS_TO_QUERY)}")
    print(f"Geo: India (IN)")
    print(f"Timeframe: Last 3 months")
    print()

    results, errors = fetch_google_trends()

    # Save results
    output_dir = "/Users/sidhant.panda/workspaces/root-workspace/swiggy-brain/catalog/docs/prd/m1-category-brain-v0.1/runs/2026-01-29-104830/evidence/google_trends"

    with open(f"{output_dir}/raw_responses.json", 'w') as f:
        json.dump({'results': results, 'errors': errors, 'fetched_at': datetime.now().isoformat()}, f, indent=2)

    with open(f"{output_dir}/terms_queried.csv", 'w', newline='') as f:
        if results:
            writer = csv.DictWriter(f, fieldnames=results[0].keys())
            writer.writeheader()
            writer.writerows(results)

    print()
    print("=" * 60)
    print(f"Complete! Fetched {len(results)} terms, {len(errors)} errors")
    print(f"Results saved to {output_dir}")
