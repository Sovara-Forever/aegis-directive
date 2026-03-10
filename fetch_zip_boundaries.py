#!/usr/bin/env python3
"""
fetch_zip_boundaries.py - ZIP Boundary Polygon Fetcher
=======================================================
Downloads ZIP boundary GeoJSON polygons from OpenDataDE/State-zip-code-GeoJSON
GitHub repository and populates boundary_polygon column in Supabase geographic_regions.

Data Source: https://github.com/OpenDataDE/State-zip-code-GeoJSON

Features:
    - Downloads state-specific ZIP GeoJSON files
    - Uses ST_Simplify for 90% size reduction (0.001 tolerance)
    - Updates boundary_polygon GEOMETRY column via SQL
    - Batch processing with rate limiting

Author: Sean Jeremy Chappell (Founder/Lead Architect) & Alpha Claudette Chappell (CTO)
Session: 14 - Phase 3 - Directive 1 (Boundary Polygons)
"""

import os
import sys
import time
import requests
import json
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional, Dict, List

# Load environment (CRITICAL: Must load .env.alpha for SERVICE_ROLE_KEY to bypass RLS)
load_dotenv('/home/arean/ara_project/.env.alpha')

# Supabase
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

# Initialize Supabase client
try:
    from supabase import create_client, Client
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
except Exception as e:
    print(f"❌ Supabase initialization failed: {e}")
    sys.exit(1)

# GitHub raw content URL pattern
GITHUB_RAW_BASE = "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master"

# State FIPS codes (for GitHub file naming)
STATE_CODES = {
    'AL': '01', 'AK': '02', 'AZ': '04', 'AR': '05', 'CA': '06',
    'CO': '08', 'CT': '09', 'DE': '10', 'FL': '12', 'GA': '13',
    'HI': '15', 'ID': '16', 'IL': '17', 'IN': '18', 'IA': '19',
    'KS': '20', 'KY': '21', 'LA': '22', 'ME': '23', 'MD': '24',
    'MA': '25', 'MI': '26', 'MN': '27', 'MS': '28', 'MO': '29',
    'MT': '30', 'NE': '31', 'NV': '32', 'NH': '33', 'NJ': '34',
    'NM': '35', 'NY': '36', 'NC': '37', 'ND': '38', 'OH': '39',
    'OK': '40', 'OR': '41', 'PA': '42', 'RI': '44', 'SC': '45',
    'SD': '46', 'TN': '47', 'TX': '48', 'UT': '49', 'VT': '50',
    'VA': '51', 'WA': '53', 'WV': '54', 'WI': '55', 'WY': '56',
    'DC': '11'
}


# =============================================================================
# DOWNLOAD ZIP GEOJSON FROM GITHUB
# =============================================================================

def download_state_zip_geojson(state_abbr: str) -> Optional[Dict]:
    """
    Download ZIP boundary GeoJSON for a state from GitHub.

    Args:
        state_abbr: 2-letter state abbreviation (e.g., "WV")

    Returns:
        GeoJSON dict or None if download fails
    """
    # GitHub URL pattern: https://raw.githubusercontent.com/.../wv_west_virginia_zip_codes_geo.min.json
    # Uses lowercase 2-letter state abbreviation + .min.json extension
    state_abbr_lower = state_abbr.upper()

    # State abbreviation → full state name mapping
    state_name_map = {
        'AL': 'alabama', 'AK': 'alaska', 'AZ': 'arizona', 'AR': 'arkansas',
        'CA': 'california', 'CO': 'colorado', 'CT': 'connecticut', 'DE': 'delaware',
        'DC': 'dc', 'FL': 'florida', 'GA': 'georgia', 'HI': 'hawaii',
        'ID': 'idaho', 'IL': 'illinois', 'IN': 'indiana', 'IA': 'iowa',
        'KS': 'kansas', 'KY': 'kentucky', 'LA': 'louisiana', 'ME': 'maine',
        'MD': 'maryland', 'MA': 'massachusetts', 'MI': 'michigan', 'MN': 'minnesota',
        'MS': 'mississippi', 'MO': 'missouri', 'MT': 'montana', 'NE': 'nebraska',
        'NV': 'nevada', 'NH': 'new_hampshire', 'NJ': 'new_jersey', 'NM': 'new_mexico',
        'NY': 'new_york', 'NC': 'north_carolina', 'ND': 'north_dakota', 'OH': 'ohio',
        'OK': 'oklahoma', 'OR': 'oregon', 'PA': 'pennsylvania', 'RI': 'rhode_island',
        'SC': 'south_carolina', 'SD': 'south_dakota', 'TN': 'tennessee', 'TX': 'texas',
        'UT': 'utah', 'VT': 'vermont', 'VA': 'virginia', 'WA': 'washington',
        'WV': 'west_virginia', 'WI': 'wisconsin', 'WY': 'wyoming'
    }

    state_name = state_name_map.get(state_abbr_lower)
    if not state_name:
        print(f"❌ Unknown state abbreviation: {state_abbr}")
        return None

    # FIXED: Use lowercase state abbreviation + .min.json (not FIPS code)
    filename = f"{state_abbr_lower.lower()}_{state_name}_zip_codes_geo.min.json"
    url = f"{GITHUB_RAW_BASE}/{filename}"

    print(f"  📥 Downloading: {url}")

    try:
        response = requests.get(url, timeout=60)
        response.raise_for_status()

        geojson = response.json()

        print(f"  ✅ Downloaded {len(geojson.get('features', []))} ZIP boundaries")

        return geojson

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"  ⚠️  File not found (404): {filename}")
        else:
            print(f"  ❌ HTTP error: {e}")
        return None
    except Exception as e:
        print(f"  ❌ Download failed: {e}")
        return None


# =============================================================================
# UPDATE SUPABASE WITH BOUNDARY POLYGONS
# =============================================================================

def update_zip_boundary_polygon(zip_code: str, geojson_geometry: Dict) -> tuple[str, str]:
    """
    Update boundary_polygon for a ZIP in Supabase using Sean's SQL function.

    Args:
        zip_code: 5-digit ZIP code
        geojson_geometry: GeoJSON geometry dict (Polygon or MultiPolygon)

    Returns:
        (status: str, error_message: str)

        Status values:
        - "UPDATED": ZIP exists in our DB and was updated successfully
        - "IGNORED": ZIP doesn't exist in our DB (not in 50-mile dealer radius)
        - "ERROR": Exception occurred during RPC call
    """
    try:
        # Use Sean's SQL function: update_zip_boundary(p_zip text, p_geojson jsonb)
        result = supabase.rpc('update_zip_boundary', {
            'p_zip': zip_code,
            'p_geojson': geojson_geometry  # Pass dict directly (Supabase handles JSONB)
        }).execute()

        if result.data is True:
            return ("UPDATED", "")
        elif result.data is False:
            # FALSE = ZIP not in our geographic_regions table (not an error)
            return ("IGNORED", "")
        else:
            return ("ERROR", f"Unexpected RPC response: {result.data}")

    except Exception as e:
        # Capture RAW error from Supabase
        error_msg = str(e)
        return ("ERROR", error_msg)


# =============================================================================
# MAIN PROCESSING PIPELINE
# =============================================================================

def process_state_zip_boundaries(state_abbr: str, rate_limit_delay: float = 0.5) -> Dict:
    """
    Download and populate ZIP boundary polygons for a state.

    Args:
        state_abbr: 2-letter state abbreviation
        rate_limit_delay: Delay between ZIP updates (seconds)

    Returns:
        {
            'state': 'WV',
            'total_zips': 100,
            'updated': 95,
            'skipped': 5
        }
    """
    print(f"\n{'=' * 70}")
    print(f"  Processing ZIP Boundaries: {state_abbr}")
    print(f"{'=' * 70}\n")

    # Download GeoJSON from GitHub
    geojson = download_state_zip_geojson(state_abbr)

    if not geojson or 'features' not in geojson:
        return {
            'state': state_abbr,
            'total_zips': 0,
            'updated': 0,
            'skipped': 0
        }

    features = geojson['features']
    total_zips = len(features)
    updated_count = 0
    ignored_count = 0
    error_count = 0

    print(f"\n🔄 Processing {total_zips} ZIP boundaries from Census GeoJSON...\n")

    for i, feature in enumerate(features, 1):
        properties = feature.get('properties', {})
        geometry = feature.get('geometry', {})

        # Extract ZIP code (property name varies by file)
        zip_code = properties.get('ZCTA5CE10') or properties.get('ZCTA') or properties.get('ZIP')

        if not zip_code:
            print(f"  [{i}/{total_zips}] ⚠️  Missing ZIP code in properties: {list(properties.keys())}")
            error_count += 1
            continue

        zip_code = str(zip_code).zfill(5)

        print(f"  [{i}/{total_zips}] {zip_code}... ", end='', flush=True)

        # Update Supabase (returns tuple: status, error_message)
        status, error_msg = update_zip_boundary_polygon(zip_code, geometry)

        if status == "UPDATED":
            print("✓ Updated")
            updated_count += 1
        elif status == "IGNORED":
            print("- Ignored (Not in our DB)")
            ignored_count += 1
        elif status == "ERROR":
            print(f"❌ Error: {error_msg}")
            error_count += 1

        # Rate limiting
        if i < total_zips:
            time.sleep(rate_limit_delay)

    # Summary
    print(f"\n{'=' * 70}")
    print(f"  COMPLETE: {state_abbr}")
    print(f"{'=' * 70}")
    print(f"  ✅ Updated:  {updated_count} (ZIPs in our DB)")
    print(f"  ➖ Ignored:  {ignored_count} (ZIPs not in our 50-mile dealer radius)")
    print(f"  ❌ Errors:   {error_count}")
    print(f"{'=' * 70}\n")

    return {
        'state': state_abbr,
        'total_zips': total_zips,
        'updated': updated_count,
        'ignored': ignored_count,
        'errors': error_count
    }


def fetch_all_states(states: Optional[List[str]] = None, rate_limit: float = 0.5):
    """
    Fetch ZIP boundaries for multiple states.

    Args:
        states: List of state abbreviations (if None, fetch all from geographic_regions)
        rate_limit: Delay between ZIP updates (seconds)
    """
    print("\n" + "=" * 70)
    print("  AEGIS ZIP BOUNDARY FETCHER")
    print("=" * 70)
    print(f"  Source: OpenDataDE/State-zip-code-GeoJSON (GitHub)")
    print(f"  Rate limit: {rate_limit}s per ZIP")
    print("=" * 70 + "\n")

    # If no states specified, query Supabase for states we have
    if not states:
        print("🔍 Querying Supabase for states needing boundary polygons...\n")

        try:
            result = supabase.table('geographic_regions').select(
                'state'
            ).is_('boundary_polygon', 'null').execute()

            if result.data:
                states = list(set([row['state'] for row in result.data if row.get('state')]))
                print(f"✅ Found {len(states)} states needing boundaries: {', '.join(sorted(states))}\n")
            else:
                print("✅ No states needing boundary polygons!\n")
                return
        except Exception as e:
            print(f"❌ Query failed: {e}\n")
            return

    # Process each state
    results = []
    for state in states:
        result = process_state_zip_boundaries(state, rate_limit)
        results.append(result)
        time.sleep(2)  # Delay between states to avoid GitHub rate limits

    # Overall summary
    total_updated = sum(r['updated'] for r in results)
    total_ignored = sum(r['ignored'] for r in results)
    total_errors = sum(r['errors'] for r in results)

    print("\n" + "=" * 70)
    print("  OVERALL SUMMARY")
    print("=" * 70)
    print(f"  States processed: {len(results)}")
    print(f"  ✅ Total updated:  {total_updated} (ZIPs in our DB)")
    print(f"  ➖ Total ignored:  {total_ignored} (ZIPs not in our 50-mile dealer radius)")
    print(f"  ❌ Total errors:   {total_errors}")
    print("=" * 70)


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Fetch ZIP boundary polygons from GitHub and update Supabase",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Fetch boundaries for West Virginia only
  python fetch_zip_boundaries.py --states WV

  # Fetch boundaries for multiple states
  python fetch_zip_boundaries.py --states WV OH KY VA

  # Fetch ALL states needing boundaries (query Supabase)
  python fetch_zip_boundaries.py --all

  # Faster rate limit (if needed)
  python fetch_zip_boundaries.py --states WV --rate-limit 0.2
        """
    )

    parser.add_argument(
        "--states",
        nargs="+",
        help="State abbreviations (e.g., WV OH KY)"
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help="Fetch ALL states needing boundary polygons (query Supabase)"
    )

    parser.add_argument(
        "--rate-limit",
        type=float,
        default=0.5,
        help="Seconds between ZIP updates (default: 0.5)"
    )

    args = parser.parse_args()

    if args.all:
        fetch_all_states(states=None, rate_limit=args.rate_limit)
    elif args.states:
        fetch_all_states(states=args.states, rate_limit=args.rate_limit)
    else:
        parser.print_help()
        print("\n❌ Error: Must specify --states or --all")
        sys.exit(1)
