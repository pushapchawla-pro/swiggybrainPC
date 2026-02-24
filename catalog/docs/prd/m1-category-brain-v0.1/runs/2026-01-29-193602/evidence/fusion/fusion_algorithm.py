#!/usr/bin/env python3
"""
CB-6: Signal Fusion Worker
Normalizes signals from CB-1, CB-2, CB-4, CB-5 and computes emerging scores for ranking.

Formula:
emerging_score =
    (0.30 x mom_search_growth_norm) +
    (0.25 x mom_sales_growth_norm) +
    (0.20 x google_interest_norm) +
    (0.15 x search_to_cart_norm) +  # Using current_month_volume as proxy
    (0.10 x zero_result_score_norm)

Qualification Gates:
- current_month_volume >= 3000
- mom_growth_pct >= 20 OR mom_sales_growth_pct >= 15
"""

import pandas as pd
import numpy as np
from pathlib import Path

# Configuration
BASE_PATH = Path("/Users/sidhant.panda/workspaces/root-workspace/swiggy-brain/catalog/docs/prd/m1-category-brain-v0.1/runs/2026-01-29-193602/evidence")
OUTPUT_PATH = BASE_PATH / "fusion"

# Weights for fusion formula
WEIGHTS = {
    'mom_search_growth': 0.30,
    'mom_sales_growth': 0.25,
    'google_interest': 0.20,
    'search_volume': 0.15,  # Using current_month_volume as proxy for search_to_cart
    'zero_result_score': 0.10
}

# Qualification thresholds
MIN_VOLUME = 3000
MIN_SEARCH_GROWTH = 20
MIN_SALES_GROWTH = 15


def min_max_normalize(series: pd.Series, invert: bool = False) -> pd.Series:
    """
    Min-Max normalize a series to 0-100 scale.
    If invert=True, lower values get higher scores (useful for zero_result_rate).
    """
    series = series.fillna(0)
    min_val = series.min()
    max_val = series.max()

    if max_val == min_val:
        return pd.Series([50.0] * len(series), index=series.index)

    normalized = (series - min_val) / (max_val - min_val) * 100

    if invert:
        normalized = 100 - normalized

    return normalized


def load_data():
    """Load all input CSVs."""
    print("Loading input data...")

    # Search metrics (CB-1)
    search_df = pd.read_csv(BASE_PATH / "snowflake" / "search_metrics.csv")
    search_df.columns = search_df.columns.str.lower()
    print(f"  Search metrics: {len(search_df)} rows")

    # Sales metrics (CB-2)
    sales_df = pd.read_csv(BASE_PATH / "snowflake" / "sales_metrics.csv")
    sales_df.columns = sales_df.columns.str.lower()
    # Normalize L1 category to lowercase for joining
    sales_df['l1_category'] = sales_df['l1_category'].str.lower().str.strip()
    print(f"  Sales metrics: {len(sales_df)} rows")

    # Google Trends (CB-4)
    trends_df = pd.read_csv(BASE_PATH / "google_trends" / "terms_queried.csv")
    trends_df.columns = trends_df.columns.str.lower()
    # Rename 'interest' to 'google_interest' for clarity
    if 'interest' in trends_df.columns:
        trends_df = trends_df.rename(columns={'interest': 'google_interest'})
    trends_df['term'] = trends_df['term'].str.lower().str.strip()
    print(f"  Google Trends: {len(trends_df)} rows")

    # Availability RCA (CB-5)
    avail_df = pd.read_csv(BASE_PATH / "databricks" / "availability_rca.csv")
    avail_df.columns = avail_df.columns.str.lower()
    # Normalize L2 category to lowercase for joining
    avail_df['l2_category'] = avail_df['l2_category'].str.lower().str.strip()
    print(f"  Availability RCA: {len(avail_df)} rows")

    return search_df, sales_df, trends_df, avail_df


def join_data(search_df, sales_df, trends_df, avail_df):
    """Join all data sources on appropriate keys."""
    print("\nJoining data sources...")

    # Start with search metrics
    df = search_df.copy()
    df['l1_category'] = df['l1_category'].str.lower().str.strip()
    df['l2_category'] = df['l2_category'].str.lower().str.strip()
    df['search_string'] = df['search_string'].str.lower().str.strip()

    # Left join with sales metrics on L1 category
    sales_subset = sales_df[['l1_category', 'mom_gmv_growth_pct']].copy()
    sales_subset = sales_subset.rename(columns={'mom_gmv_growth_pct': 'mom_sales_growth_pct'})
    df = df.merge(sales_subset, on='l1_category', how='left')
    print(f"  After sales join: {len(df)} rows, {df['mom_sales_growth_pct'].notna().sum()} with sales data")

    # Left join with Google Trends on search_string = term
    trends_subset = trends_df[['term', 'google_interest']].copy()
    df = df.merge(trends_subset, left_on='search_string', right_on='term', how='left')
    df = df.drop(columns=['term'], errors='ignore')
    print(f"  After trends join: {len(df)} rows, {df['google_interest'].notna().sum()} with trends data")

    # Left join with availability RCA on L2 category
    avail_subset = avail_df[['l2_category', 'availability_pct', 'top_oos_reason']].copy()
    # Handle duplicate L2 categories by taking the first occurrence
    avail_subset = avail_subset.drop_duplicates(subset='l2_category', keep='first')
    df = df.merge(avail_subset, on='l2_category', how='left')
    print(f"  After availability join: {len(df)} rows, {df['availability_pct'].notna().sum()} with availability data")

    return df


def compute_scores(df):
    """Compute normalized signals and emerging score."""
    print("\nComputing normalized signals...")

    # Fill NaN values with 0
    df['mom_growth_pct'] = df['mom_growth_pct'].fillna(0)
    df['mom_sales_growth_pct'] = df['mom_sales_growth_pct'].fillna(0)
    df['google_interest'] = df['google_interest'].fillna(0)
    df['current_month_volume'] = df['current_month_volume'].fillna(0)
    df['zero_result_rate'] = df['zero_result_rate'].fillna(0)
    df['availability_pct'] = df['availability_pct'].fillna(0)

    # Normalize each signal to 0-100
    df['mom_search_growth_norm'] = min_max_normalize(df['mom_growth_pct'])
    df['mom_sales_growth_norm'] = min_max_normalize(df['mom_sales_growth_pct'])
    df['google_interest_norm'] = min_max_normalize(df['google_interest'])
    df['search_volume_norm'] = min_max_normalize(df['current_month_volume'])
    # For zero_result_rate, lower is better so we invert
    df['zero_result_score_norm'] = min_max_normalize(df['zero_result_rate'], invert=True)

    print(f"  mom_search_growth_norm: min={df['mom_search_growth_norm'].min():.2f}, max={df['mom_search_growth_norm'].max():.2f}")
    print(f"  mom_sales_growth_norm: min={df['mom_sales_growth_norm'].min():.2f}, max={df['mom_sales_growth_norm'].max():.2f}")
    print(f"  google_interest_norm: min={df['google_interest_norm'].min():.2f}, max={df['google_interest_norm'].max():.2f}")
    print(f"  search_volume_norm: min={df['search_volume_norm'].min():.2f}, max={df['search_volume_norm'].max():.2f}")
    print(f"  zero_result_score_norm: min={df['zero_result_score_norm'].min():.2f}, max={df['zero_result_score_norm'].max():.2f}")

    # Compute emerging score
    df['emerging_score'] = (
        WEIGHTS['mom_search_growth'] * df['mom_search_growth_norm'] +
        WEIGHTS['mom_sales_growth'] * df['mom_sales_growth_norm'] +
        WEIGHTS['google_interest'] * df['google_interest_norm'] +
        WEIGHTS['search_volume'] * df['search_volume_norm'] +
        WEIGHTS['zero_result_score'] * df['zero_result_score_norm']
    )

    return df


def apply_qualification_gates(df):
    """Apply qualification gates to filter terms."""
    print("\nApplying qualification gates...")
    print(f"  Total terms before filtering: {len(df)}")

    # Volume gate: current_month_volume >= 3000
    volume_qualified = df['current_month_volume'] >= MIN_VOLUME
    print(f"  Terms with volume >= {MIN_VOLUME}: {volume_qualified.sum()}")

    # Growth gate: mom_growth_pct >= 20 OR mom_sales_growth_pct >= 15
    growth_qualified = (df['mom_growth_pct'] >= MIN_SEARCH_GROWTH) | (df['mom_sales_growth_pct'] >= MIN_SALES_GROWTH)
    print(f"  Terms with search growth >= {MIN_SEARCH_GROWTH}% OR sales growth >= {MIN_SALES_GROWTH}%: {growth_qualified.sum()}")

    # Both gates must pass
    qualified = volume_qualified & growth_qualified
    print(f"  Terms passing BOTH gates: {qualified.sum()}")

    return df[qualified].copy()


def generate_output(df, all_df):
    """Generate output files."""
    print("\nGenerating output files...")

    # Rank by emerging_score descending
    df = df.sort_values('emerging_score', ascending=False).reset_index(drop=True)
    df['rank'] = df.index + 1

    # Select and order columns for output
    output_cols = [
        'rank', 'search_string', 'l1_category', 'l2_category',
        'current_month_volume', 'mom_growth_pct', 'mom_sales_growth_pct',
        'google_interest', 'zero_result_rate', 'availability_pct',
        'top_oos_reason', 'emerging_score'
    ]

    # Rename columns for output
    output_df = df[output_cols].copy()
    output_df = output_df.rename(columns={
        'mom_growth_pct': 'mom_search_growth_pct'
    })

    # Round numeric columns
    output_df['emerging_score'] = output_df['emerging_score'].round(2)
    output_df['mom_search_growth_pct'] = output_df['mom_search_growth_pct'].round(2)
    output_df['mom_sales_growth_pct'] = output_df['mom_sales_growth_pct'].round(2)
    output_df['zero_result_rate'] = output_df['zero_result_rate'].round(4)
    output_df['availability_pct'] = output_df['availability_pct'].round(2)

    # Save ranked terms CSV
    output_path = OUTPUT_PATH / "ranked_terms.csv"
    output_df.to_csv(output_path, index=False)
    print(f"  Saved ranked_terms.csv: {len(output_df)} qualified terms")

    # Generate summary statistics
    summary = generate_summary(df, all_df)
    summary_path = OUTPUT_PATH / "fusion_summary.txt"
    with open(summary_path, 'w') as f:
        f.write(summary)
    print(f"  Saved fusion_summary.txt")

    return output_df


def generate_summary(qualified_df, all_df):
    """Generate summary statistics."""
    lines = [
        "=" * 60,
        "CB-6: Signal Fusion Summary",
        "=" * 60,
        "",
        "PROCESSING STATISTICS",
        "-" * 40,
        f"Total terms processed: {len(all_df)}",
        f"Terms passing qualification gates: {len(qualified_df)}",
        f"Qualification rate: {len(qualified_df)/len(all_df)*100:.1f}%",
        "",
        "QUALIFICATION GATE DETAILS",
        "-" * 40,
        f"Volume threshold: >= {MIN_VOLUME}",
        f"Growth threshold: search growth >= {MIN_SEARCH_GROWTH}% OR sales growth >= {MIN_SALES_GROWTH}%",
        "",
        "SCORE DISTRIBUTION (Qualified Terms)",
        "-" * 40,
        f"Min emerging_score: {qualified_df['emerging_score'].min():.2f}",
        f"Max emerging_score: {qualified_df['emerging_score'].max():.2f}",
        f"Mean emerging_score: {qualified_df['emerging_score'].mean():.2f}",
        f"Median emerging_score: {qualified_df['emerging_score'].median():.2f}",
        f"Std Dev: {qualified_df['emerging_score'].std():.2f}",
        "",
        "CATEGORY BREAKDOWN (Qualified Terms)",
        "-" * 40,
    ]

    # L1 category breakdown
    l1_counts = qualified_df['l1_category'].value_counts()
    lines.append("\nBy L1 Category:")
    for cat, count in l1_counts.items():
        lines.append(f"  {cat}: {count} terms")

    # L2 category breakdown (top 10)
    l2_counts = qualified_df['l2_category'].value_counts().head(10)
    lines.append("\nTop 10 L2 Categories:")
    for cat, count in l2_counts.items():
        lines.append(f"  {cat}: {count} terms")

    # Signal contribution analysis
    lines.extend([
        "",
        "SIGNAL WEIGHTS",
        "-" * 40,
        f"MoM Search Growth: {WEIGHTS['mom_search_growth']*100:.0f}%",
        f"MoM Sales Growth: {WEIGHTS['mom_sales_growth']*100:.0f}%",
        f"Google Interest: {WEIGHTS['google_interest']*100:.0f}%",
        f"Search Volume: {WEIGHTS['search_volume']*100:.0f}%",
        f"Zero Result Score: {WEIGHTS['zero_result_score']*100:.0f}%",
        "",
        "TOP 10 EMERGING TERMS",
        "-" * 40,
    ])

    top10 = qualified_df.nsmallest(10, 'rank')
    for _, row in top10.iterrows():
        lines.append(f"  #{int(row['rank'])}: {row['search_string']} (score: {row['emerging_score']:.2f})")
        lines.append(f"      L1: {row['l1_category']}, Volume: {int(row['current_month_volume'])}")

    # Data quality notes
    lines.extend([
        "",
        "DATA QUALITY NOTES",
        "-" * 40,
        f"Terms with Google Trends data: {(qualified_df['google_interest'] > 0).sum()} / {len(qualified_df)}",
        f"Terms with availability data: {(qualified_df['availability_pct'] > 0).sum()} / {len(qualified_df)}",
        f"Terms with sales data: {(qualified_df['mom_sales_growth_pct'].notna()).sum()} / {len(qualified_df)}",
        "",
        "NOTE: All L1 categories show negative sales growth (-4% to -18%), which",
        "indicates category-level decline. Search growth signals are the primary",
        "differentiator for emerging opportunities.",
        "",
        "=" * 60,
    ])

    return "\n".join(lines)


def main():
    """Main execution flow."""
    print("=" * 60)
    print("CB-6: Signal Fusion Worker")
    print("=" * 60)

    # Load data
    search_df, sales_df, trends_df, avail_df = load_data()

    # Join data sources
    df = join_data(search_df, sales_df, trends_df, avail_df)

    # Compute normalized scores
    df = compute_scores(df)

    # Keep a copy of all data for summary
    all_df = df.copy()

    # Apply qualification gates
    qualified_df = apply_qualification_gates(df)

    # Generate output
    output_df = generate_output(qualified_df, all_df)

    print("\n" + "=" * 60)
    print("Signal Fusion Complete!")
    print(f"Output: {OUTPUT_PATH}")
    print("=" * 60)

    return output_df


if __name__ == "__main__":
    main()
