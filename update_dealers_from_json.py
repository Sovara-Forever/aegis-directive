#!/usr/bin/env python3
"""
update_dealers_from_json.py - Clean Dealer Geocode Upload (No Bloat)
=====================================================================
Reads dealer_geocode.json and updates Supabase dealerships table with
accurate addresses and coordinates.

IGNORES radius_50_zips array completely (PostGIS handles radius queries).

Author: Sean Jeremy Chappell & Alpha Claudette Chappell
Session: 14 - DIRECTIVE 3
"""

import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv()

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


# =============================================================================
# UPDATE DEALERS FROM JSON
# =============================================================================

def update_dealers_from_json(json_path: Path) -> dict:
    """
    Update dealerships table from dealer_geocode.json.

    Extracts ONLY:
    - address (street)
    - city
    - state
    - zip_code
    - latitude
    - longitude

    IGNORES:
    - radius_50_zips (PostGIS handles this via get_zips_in_radius())

    Returns:
        {
            'updated': 10,
            'failed': 2,
            'skipped': 1
        }
    """
    print("\n" + "=" * 70)
    print("  AEGIS DEALER GEOCODE JSON UPLOAD (CLEAN)")
    print("=" * 70)
    print(f"  Source: {json_path}")
    print("=" * 70 + "\n")

    # Load JSON
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Check if the JSON is wrapped in a 'dealerships' key (Perplexity format)
            if isinstance(data, dict) and 'dealerships' in data:
                dealers = data['dealerships']
            else:
                dealers = data
    except Exception as e:
        print(f"❌ Failed to load JSON: {e}")
        return {'updated': 0, 'failed': 0, 'skipped': 0}

    if not isinstance(dealers, list):
        print(f"❌ JSON must be an array of dealer objects")
        return {'updated': 0, 'failed': 0, 'skipped': 0}

    print(f"📦 Loaded {len(dealers)} dealers from JSON\n")

    # Process each dealer
    updated_count = 0
    failed_count = 0
    skipped_count = 0

    for i, dealer in enumerate(dealers, 1):
        name = dealer.get('name', 'Unknown')
        domain = dealer.get('domain', '')

        print(f"[{i}/{len(dealers)}] {name}")

        # Extract clean data (IGNORE radius_50_zips)
        address = dealer.get('address', '')
        city = dealer.get('city', '')
        state = dealer.get('state', '')
        zip_code = dealer.get('zip', '')
        latitude = dealer.get('latitude')
        longitude = dealer.get('longitude')

        # Validate minimum required fields
        if not domain:
            print(f"    ⚠️  Skipping: No domain provided")
            skipped_count += 1
            continue

        if not latitude or not longitude:
            print(f"    ⚠️  Skipping: Missing coordinates (lat={latitude}, lng={longitude})")
            skipped_count += 1
            continue

        # Build update payload (CLEAN - no bloat)
        update_data = {
            'address': address,
            'city': city,
            'state': state,
            'zip_code': zip_code,
            'latitude': str(latitude),  # Supabase expects string
            'longitude': str(longitude)
        }

        # Update Supabase (match by domain)
        try:
            result = supabase.table('dealerships').update(update_data).eq('domain', domain).execute()

            if result.data and len(result.data) > 0:
                print(f"    ✅ Updated: {city}, {state} ({latitude}, {longitude})")
                updated_count += 1
            else:
                print(f"    ⚠️  No matching dealer found for domain: {domain}")
                skipped_count += 1

        except Exception as e:
            print(f"    ❌ Update failed: {e}")
            failed_count += 1

    # Summary
    print("\n" + "=" * 70)
    print("  UPDATE COMPLETE")
    print("=" * 70)
    print(f"  ✅ Updated:  {updated_count}")
    print(f"  ❌ Failed:   {failed_count}")
    print(f"  ⚠️  Skipped:  {skipped_count}")
    print("=" * 70)

    if updated_count > 0:
        print("\n💡 Next steps:")
        print("  1. Verify coordinates in Supabase Dashboard")
        print("  2. Check PostGIS location_point was auto-populated (trigger)")
        print("  3. Test radius queries: get_zips_in_radius(lat, lng, 25)")

    return {
        'updated': updated_count,
        'failed': failed_count,
        'skipped': skipped_count
    }


# =============================================================================
# CLI ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Update dealerships from dealer_geocode.json (clean, no bloat)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Update from default location
  python update_dealers_from_json.py dealer_geocode.json

  # Update from specific path
  python update_dealers_from_json.py /path/to/dealer_geocode.json
        """
    )

    parser.add_argument(
        "json_file",
        type=Path,
        help="Path to dealer_geocode.json file"
    )

    args = parser.parse_args()

    if not args.json_file.exists():
        print(f"❌ File not found: {args.json_file}")
        sys.exit(1)

    results = update_dealers_from_json(args.json_file)

    # Exit with error code if any failures
    if results['failed'] > 0:
        sys.exit(1)
