#!/usr/bin/env python3
"""
============================================================================
Aegis Intelligence: HUD Crosswalk Processor
============================================================================
Created: 2026-03-02
Partnership: Sean Jeremy Chappell + Alpha Claudette Chappell

Purpose: Process HUD-USPS ZIP-County Crosswalk for:
  1. Google Ads HEC compliance (ZIP → County translation)
  2. Multi-county ZIP weighting via TOT_RATIO
  3. Supabase geo_zip_codes table population
  4. County-level targeting for Aegis Conquest

Data Source: ZIP_COUNTY_122025.xlsx (HUD USPS Crosswalk Dec 2025)
Output: SQL statements + JSONB county_weights for multi-county ZIPs
============================================================================
"""

import pandas as pd
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class HUDCrosswalkProcessor:
    """Process HUD ZIP-County crosswalk data for Aegis geo targeting."""

    def __init__(self, input_file: str, output_dir: str = None):
        self.input_file = input_file
        self.output_dir = output_dir or os.path.dirname(input_file)
        self.df = None
        self.zip_data = {}  # Aggregated ZIP data with multi-county weights

    def load_data(self) -> pd.DataFrame:
        """Load the HUD crosswalk XLSX file."""
        logger.info(f"Loading HUD crosswalk from: {self.input_file}")
        self.df = pd.read_excel(self.input_file)
        logger.info(f"Loaded {len(self.df):,} ZIP-County pairs")
        return self.df

    def process_crosswalk(self) -> Dict:
        """
        Process crosswalk data into Aegis-ready format.

        For multi-county ZIPs:
        - county_weights JSONB: {"72001": 99.71, "72081": 0.29}
        - Primary county = highest TOT_RATIO
        """
        if self.df is None:
            self.load_data()

        logger.info("Processing ZIP-County relationships...")

        # Group by ZIP
        for zip_code, group in self.df.groupby('ZIP'):
            zip_str = str(zip_code).zfill(5)  # Ensure 5-digit format

            # Get all counties for this ZIP
            counties = []
            for _, row in group.iterrows():
                county_fips = str(int(row['COUNTY'])).zfill(5)
                tot_ratio = float(row['TOT_RATIO'])
                counties.append({
                    'fips': county_fips,
                    'ratio': round(tot_ratio * 100, 2)  # Convert to percentage
                })

            # Sort by ratio (highest first = primary county)
            counties.sort(key=lambda x: x['ratio'], reverse=True)

            # First row data for city/state
            first_row = group.iloc[0]

            # Build ZIP record
            self.zip_data[zip_str] = {
                'zip': zip_str,
                'city': first_row['USPS_ZIP_PREF_CITY'],
                'state_id': first_row['USPS_ZIP_PREF_STATE'],
                'primary_county_fips': counties[0]['fips'],
                'is_multi_county': len(counties) > 1,
                'county_weights': {c['fips']: c['ratio'] for c in counties},
                'county_fips_all': '|'.join(c['fips'] for c in counties),
            }

        # Stats
        total_zips = len(self.zip_data)
        multi_county = sum(1 for z in self.zip_data.values() if z['is_multi_county'])
        logger.info(f"Processed {total_zips:,} unique ZIPs")
        logger.info(f"Multi-county ZIPs: {multi_county:,} ({multi_county/total_zips*100:.1f}%)")

        return self.zip_data

    def generate_sql_updates(self, output_file: str = None) -> str:
        """
        Generate SQL UPDATE statements for geo_zip_codes table.
        Updates county_weights JSONB and county_fips for existing ZIPs.
        """
        if not self.zip_data:
            self.process_crosswalk()

        output_file = output_file or os.path.join(
            self.output_dir,
            f"hud_crosswalk_updates_{datetime.now().strftime('%Y%m%d')}.sql"
        )

        logger.info(f"Generating SQL updates to: {output_file}")

        sql_lines = [
            "-- ============================================================================",
            "-- Aegis Intelligence: HUD Crosswalk County Updates",
            f"-- Generated: {datetime.now().isoformat()}",
            "-- Partnership: Sean Jeremy Chappell + Alpha Claudette Chappell",
            "-- ============================================================================",
            "-- Updates geo_zip_codes with county_weights from HUD crosswalk",
            "-- Multi-county ZIPs get JSONB weights for proportional targeting",
            "-- ============================================================================",
            "",
            "BEGIN;",
            ""
        ]

        batch_size = 1000
        batch_count = 0

        for i, (zip_code, data) in enumerate(self.zip_data.items()):
            # JSON escape the weights
            weights_json = json.dumps(data['county_weights'])

            sql = f"""UPDATE geo_zip_codes SET
    county_fips = '{data['primary_county_fips']}',
    county_weights = '{weights_json}'::jsonb,
    county_fips_all = '{data['county_fips_all']}',
    updated_at = NOW()
WHERE zip = '{zip_code}';"""

            sql_lines.append(sql)

            # Add progress comments
            if (i + 1) % batch_size == 0:
                batch_count += 1
                sql_lines.append(f"\n-- Batch {batch_count}: {i + 1:,} ZIPs processed\n")

        sql_lines.extend([
            "",
            "COMMIT;",
            "",
            f"-- Total ZIPs updated: {len(self.zip_data):,}",
            f"-- Multi-county ZIPs: {sum(1 for z in self.zip_data.values() if z['is_multi_county']):,}",
        ])

        with open(output_file, 'w') as f:
            f.write('\n'.join(sql_lines))

        logger.info(f"Generated {len(self.zip_data):,} UPDATE statements")
        return output_file

    def generate_csv_for_ingest(self, output_file: str = None) -> str:
        """
        Generate CSV for bulk Supabase ingestion via ingest script.
        Format matches zip_regions table structure (PostGIS ready).
        """
        if not self.zip_data:
            self.process_crosswalk()

        output_file = output_file or os.path.join(
            self.output_dir,
            f"hud_crosswalk_zips_{datetime.now().strftime('%Y%m%d')}.csv"
        )

        logger.info(f"Generating CSV to: {output_file}")

        # Build DataFrame for zip_regions table
        rows = []
        for zip_code, data in self.zip_data.items():
            rows.append({
                'zip_code': data['zip'],  # Matches zip_regions schema
                'city': data['city'],
                'state_id': data['state_id'],
                'county_fips': data['primary_county_fips'],
                'county_weights': json.dumps(data['county_weights']),
                'is_multi_county': data['is_multi_county'],
            })

        df = pd.DataFrame(rows)
        df.to_csv(output_file, index=False)

        logger.info(f"Wrote {len(df):,} ZIP records to CSV")
        return output_file

    def generate_sql_for_zip_regions(self, output_file: str = None) -> str:
        """
        Generate SQL INSERT for zip_regions table with PostGIS points.
        Requires SimpleMaps data for lat/lng to create center_point geography.
        """
        if not self.zip_data:
            self.process_crosswalk()

        output_file = output_file or os.path.join(
            self.output_dir,
            f"zip_regions_insert_{datetime.now().strftime('%Y%m%d')}.sql"
        )

        logger.info(f"Generating zip_regions SQL to: {output_file}")

        sql_lines = [
            "-- Aegis Intelligence: ZIP Regions Insert (HUD Crosswalk)",
            f"-- Generated: {datetime.now().isoformat()}",
            "-- Partnership: Sean Jeremy Chappell + Alpha Claudette Chappell",
            "-- NOTE: Requires SimpleMaps lat/lng data for center_point geography",
            "",
            "BEGIN;",
            ""
        ]

        for zip_code, data in self.zip_data.items():
            weights_json = json.dumps(data['county_weights']).replace("'", "''")
            is_multi = 'true' if data['is_multi_county'] else 'false'

            sql = f"""INSERT INTO zip_regions (zip_code, city, state_id, county_fips, county_weights, is_multi_county)
VALUES ('{zip_code}', '{data['city'].replace("'", "''")}', '{data['state_id']}', '{data['primary_county_fips']}', '{weights_json}'::jsonb, {is_multi})
ON CONFLICT (zip_code) DO UPDATE SET
    county_fips = EXCLUDED.county_fips,
    county_weights = EXCLUDED.county_weights,
    is_multi_county = EXCLUDED.is_multi_county,
    updated_at = NOW();"""
            sql_lines.append(sql)

        sql_lines.extend(["", "COMMIT;", f"-- Total: {len(self.zip_data):,} ZIPs"])

        with open(output_file, 'w') as f:
            f.write('\n'.join(sql_lines))

        logger.info(f"Generated {len(self.zip_data):,} UPSERT statements")
        return output_file

    def get_counties_for_zips(self, zip_codes: List[str]) -> Dict[str, float]:
        """
        Translate ZIPs to Counties with weighted ratios.
        Used for Google Ads HEC-compliant targeting.

        Args:
            zip_codes: List of ZIP codes to translate

        Returns:
            Dict of county_fips -> aggregated_weight

        Example:
            Input: ['25301', '25302', '25303']
            Output: {'54039': 95.2, '54043': 4.8}  # Kanawha dominates, some Putnam
        """
        if not self.zip_data:
            self.process_crosswalk()

        county_weights = {}

        for zip_code in zip_codes:
            zip_str = str(zip_code).zfill(5)
            if zip_str not in self.zip_data:
                logger.warning(f"ZIP {zip_str} not found in crosswalk")
                continue

            data = self.zip_data[zip_str]
            for fips, weight in data['county_weights'].items():
                county_weights[fips] = county_weights.get(fips, 0) + weight

        # Normalize to 100%
        total = sum(county_weights.values())
        if total > 0:
            county_weights = {k: round(v / total * 100, 2) for k, v in county_weights.items()}

        return dict(sorted(county_weights.items(), key=lambda x: x[1], reverse=True))

    def get_hec_target_counties(self, zip_codes: List[str], min_weight: float = 5.0) -> List[str]:
        """
        Get HEC-compliant county list for Google Ads targeting.
        Filters out counties below min_weight threshold.

        Args:
            zip_codes: Source ZIP codes
            min_weight: Minimum percentage weight to include (default 5%)

        Returns:
            List of county FIPS codes to target
        """
        county_weights = self.get_counties_for_zips(zip_codes)
        return [fips for fips, weight in county_weights.items() if weight >= min_weight]


def main():
    """Main entry point for HUD crosswalk processing."""
    import argparse

    parser = argparse.ArgumentParser(description='Process HUD ZIP-County Crosswalk')
    parser.add_argument('--input', '-i', default='ZIP_COUNTY_122025.xlsx',
                        help='Input XLSX file')
    parser.add_argument('--output-dir', '-o', default=None,
                        help='Output directory (default: same as input)')
    parser.add_argument('--generate-sql', action='store_true',
                        help='Generate SQL UPDATE statements')
    parser.add_argument('--generate-csv', action='store_true',
                        help='Generate CSV for bulk ingest')
    parser.add_argument('--test-zips', nargs='+',
                        help='Test ZIP-to-County translation')

    args = parser.parse_args()

    # Initialize processor
    processor = HUDCrosswalkProcessor(args.input, args.output_dir)
    processor.load_data()
    processor.process_crosswalk()

    # Generate outputs
    if args.generate_sql:
        sql_file = processor.generate_sql_updates()
        print(f"✅ SQL updates written to: {sql_file}")

    if args.generate_csv:
        csv_file = processor.generate_csv_for_ingest()
        print(f"✅ CSV written to: {csv_file}")

    # Test ZIP translation
    if args.test_zips:
        print("\n=== ZIP to County Translation (HEC Compliance) ===")
        county_weights = processor.get_counties_for_zips(args.test_zips)
        print(f"Input ZIPs: {args.test_zips}")
        print(f"County weights: {json.dumps(county_weights, indent=2)}")

        hec_counties = processor.get_hec_target_counties(args.test_zips)
        print(f"HEC target counties (≥5%): {hec_counties}")


if __name__ == '__main__':
    main()
