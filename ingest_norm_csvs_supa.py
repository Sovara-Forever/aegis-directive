#!/usr/bin/env python3
"""
ingest_norm_csvs_supa.py - Normalized CSV & Shadowforge → Supabase Upload
Version 2.0 - Includes duplicate tracking, dynamic dealer creation, and strict VIN UPSERTs.

Requirements:
    pip install pandas supabase python-dotenv

Usage:
    python3 ingest_norm_csvs_supa.py
"""

import sys
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv
import re
from datetime import datetime
import json

# Load environment variables from .env.alpha
load_dotenv('.env.alpha')

# =============================================================================
# CONFIGURATION & TRACKING
# =============================================================================

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

# Path to normalized CSVs and Shadowforge outputs
NORMALIZED_DIR = Path.home() / 'ara_project' / 'normalized_output'
SHADOWFORGE_DIR = Path.home() / 'ara_project' / 'shadowforge_output'

# Duplicate Tracker File
TRACKER_FILE = Path.home() / 'ara_project' / '.supa_ingest_tracker.json'

def load_processed_files() -> set:
    """Loads the history of previously uploaded files to prevent duplicates."""
    if TRACKER_FILE.exists():
        with open(TRACKER_FILE, 'r') as f:
            return set(json.load(f))
    return set()

def mark_file_processed(filename: str):
    """Saves a successfully uploaded file to the tracker."""
    processed = load_processed_files()
    processed.add(filename)
    with open(TRACKER_FILE, 'w') as f:
        json.dump(list(processed), f)

# Proper Dealership Names (Maps domain to actual business name)
# Alias domains must resolve via DOMAIN_ALIASES below — only canonical domains live here
DEALER_NAMES = {
    'gorcauto.com': 'RC Chrysler Dodge Jeep RAM',
    'bomninchryslerdodgejeepram.com': 'Bomnin Chrysler Dodge Jeep RAM',
    'miamilakeschryslerjeepdodgeram.com': 'Miami Lakes Chrysler Jeep Dodge RAM',
    'toyotaofrunnemede.com': 'Toyota of Runnemede',
    'columbianachryslerjeepdodge.net': 'Columbiana Chrysler Jeep Dodge RAM',
    'pacificoford.com': 'Pacifico Ford',
    'robinford.com': 'Robin Ford',
    'springfieldford.com': 'Springfield Ford',
    'midstatechevy.com': 'Mid-State Chevrolet',
    'rivercitysubaru.com': 'River City Subaru',
    'dutchmillersubaru.com': 'Dutch Miller Subaru',
    'harrygreenchevy.com': 'Harry Green Chevrolet',
    'northsidewv.net': 'Northside Automotive',
    'mosesmeansmore.com': 'Moses Auto Mall',
    'mchughdodgejeep.com': 'McHugh Dodge Jeep',
    'generationsford.com': 'Generations Ford',
    'nissanoforangepark.com': 'Nissan of Orange Park',
    'glorynissan.com': 'Glory Nissan',
    'planetnissan.com': 'Planet Nissan',
    '777nissan.com': '777 Nissan',
    # Honda clients
    'openroadhonda.com': 'Open Road Honda',
    'princetonhonda.com': 'Princeton Honda',
    'hondaofprinceton.com': 'Princeton Honda',
    'dchacademyhonda.com': 'DCH Academy Honda',
    'mymetrohonda.com': 'Metro Honda',
    'metrohonda.com': 'Metro Honda',
}

# Domain aliases — multiple domains that are the SAME physical dealership.
# Maps alias domain → canonical domain (the one with the real Supabase row).
# Resolved BEFORE any upsert — prevents ghost UUID creation.
DOMAIN_ALIASES = {
    'midstatechevrolet.com': 'midstatechevy.com',
    'gorcautogroup.com': 'gorcauto.com',
    'harrygreenchevrolet.com': 'harrygreenchevy.com',
}

DEALER_DOMAINS = {
    'bomninchryslerdodgejeepram': 'bomninchryslerdodgejeepram.com',
    'bomnin': 'bomninchryslerdodgejeepram.com',
    'miamilakeschryslerjeepdodgeram': 'miamilakeschryslerjeepdodgeram.com',
    'miamilakes': 'miamilakeschryslerjeepdodgeram.com',
    'toyotaofrunnemede': 'toyotaofrunnemede.com',
    'toyota runnemede': 'toyotaofrunnemede.com',
    'columbianachryslerjeepdodge': 'columbianachryslerjeepdodge.net',
    'columbiana': 'columbianachryslerjeepdodge.net',
    'pacifico': 'pacificoford.com',
    'pacificoford': 'pacificoford.com',
    'robin': 'robinford.com',
    'robinford': 'robinford.com',
    'springfield': 'springfieldford.com',
    'springfield ford': 'springfieldford.com',
    'mid-state': 'midstatechevy.com',
    'midstate': 'midstatechevy.com',
    'midstatechevy': 'midstatechevy.com',
    'river city': 'rivercitysubaru.com',
    'rivercity': 'rivercitysubaru.com',
    'dutch miller': 'dutchmillersubaru.com',
    'dutchmiller': 'dutchmillersubaru.com',
    'harry green': 'harrygreenchevy.com',
    'harrygreen': 'harrygreenchevy.com',
    'northside': 'northsidewv.net',
    'northsideford': 'northsidewv.net',
    'gorc': 'gorcauto.com',
    'gorcauto': 'gorcauto.com',
    'moses': 'mosesmeansmore.com',
    'mosesmeansmore': 'mosesmeansmore.com',
    'mosesautomall': 'mosesmeansmore.com',
    # Honda clients
    'openroadhonda': 'openroadhonda.com',
    'openroad': 'openroadhonda.com',
    'princetonhonda': 'princetonhonda.com',
    'princeton honda': 'princetonhonda.com',
    'dchacademy': 'dchacademyhonda.com',
    'dchacademyhonda': 'dchacademyhonda.com',
    'metrohonda': 'mymetrohonda.com',
    'mymetrohonda': 'mymetrohonda.com',
}

# =============================================================================
# SUPABASE CLIENT
# =============================================================================

def get_supabase_client():
    """Initialize Supabase client"""
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("❌ ERROR: Missing Supabase credentials")
            return None

        from supabase import create_client, Client
        client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"✅ Supabase connected: {SUPABASE_URL}\n")
        return client
    except Exception as e:
        print(f"❌ ERROR: Supabase connection failed: {e}")
        return None

# =============================================================================
# DEALERSHIP MANAGEMENT
# =============================================================================

def extract_date_from_filename(filename: str) -> Optional[str]:
    match = re.search(r'_(\d{1,2})_(\d{1,2})_(\d{4})\.csv$', filename)
    if match:
        month, day, year = match.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"

    match = re.search(r'_(\d{4})(\d{2})(\d{2})_', filename)
    if match:
        year, month, day = match.groups()
        return f"{year}-{month}-{day}"

    match = re.search(r'(\d{1,2})\.(\d{1,2})\.(\d{2})\.csv$', filename)
    if match:
        month, day, year = match.groups()
        full_year = f"20{year}" if int(year) < 50 else f"19{year}"
        return f"{full_year}-{int(month):02d}-{int(day):02d}"

    return datetime.now().strftime('%Y-%m-%d')

def extract_dealer_from_filename(filename: str) -> Optional[str]:
    filename_lower = filename.lower()
    for key, domain in DEALER_DOMAINS.items():
        if key in filename_lower:
            return domain
    return None

BLOCKED_DOMAINS = {
    'combined.com', 'allcombined.com', 'unknown.com', 'example.com',
    'woelfelpersonalinjury.com', 'generationspt.com',
}

AUTOMOTIVE_KEYWORDS = [
    'honda', 'toyota', 'ford', 'chevy', 'chevrolet', 'dodge', 'nissan',
    'subaru', 'jeep', 'ram', 'hyundai', 'kia', 'auto', 'motor', 'dealer',
    'car', 'vehicle', 'truck', 'mazda', 'bmw', 'audi', 'lexus', 'acura',
    'infiniti', 'cadillac', 'buick', 'gmc', 'chrysler', 'volvo', 'vw',
    'volkswagen', 'mitsubishi', 'subaru', 'genesis', 'lincoln', 'mercury',
]

def get_or_create_dealership(client, domain: str) -> Optional[str]:
    """Upsert dealership by domain with validation — prevents ghost entries."""
    if not domain or '.' not in domain or len(domain) < 5:
        print(f"   ⚠️  Rejected invalid domain: {domain!r}")
        return None
    # Resolve alias domains to canonical before any DB lookup
    canonical = DOMAIN_ALIASES.get(domain)
    if canonical:
        print(f"   🔀 Alias resolved: {domain} → {canonical}")
        domain = canonical
    if domain in BLOCKED_DOMAINS:
        print(f"   ⚠️  Blocked ghost domain: {domain}")
        return None

    dealership_name = DEALER_NAMES.get(domain)
    if not dealership_name:
        if not any(kw in domain.lower() for kw in AUTOMOTIVE_KEYWORDS):
            print(f"   ⚠️  Rejected non-automotive domain: {domain}")
            return None
        dealership_name = domain.replace('.com', '').replace('.net', '').replace('-', ' ').title()

    try:
        result = client.table('dealerships').upsert(
            {'domain': domain, 'name': dealership_name, 'created_at': datetime.now().isoformat()},
            on_conflict='domain'
        ).execute()
        if result.data:
            return result.data[0]['id']
        # upsert returned no data — SELECT to get existing id
        lookup = client.table('dealerships').select('id').eq('domain', domain).execute()
        return lookup.data[0]['id'] if lookup.data else None
    except Exception as e:
        print(f"   ❌ Dealership error: {e}")
        return None

# =============================================================================
# DATA TRANSFORMERS (CSV → Supabase schema)
# =============================================================================

def extract_domain_from_url(url: str) -> Optional[str]:
    if not url or not isinstance(url, str):
        return None
    url_match = re.search(r'https?://(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]+)', url)
    if url_match:
        return url_match.group(1).lower()
    return None

def _parse_market_comp(value) -> Optional[float]:
    if pd.isna(value) or value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        match = re.search(r'([+-]?\d+\.?\d*)\s*%', str(value))
        if match:
            return float(match.group(1))
        try:
            return float(value)
        except (ValueError, TypeError):
            return None
    return None

def transform_inventory(df: pd.DataFrame, dealership_id: str, tracked_date: str = None, existing_vins_map: dict = None) -> List[Dict]:
    """
    Transform inventory CSV to Supabase schema.
    Calculates days_in_inventory based on existing DB records.
    """
    records = []
    if existing_vins_map is None:
        existing_vins_map = {}

    current_time_iso = datetime.now().isoformat()
    current_time_dt = pd.to_datetime(current_time_iso, utc=True)

    for _, row in df.iterrows():
        vin = str(row.get('vin', '')).strip()

        if not vin or vin in ['nan', 'None', '', 'N/A']:
            continue

        # --- DATE & DAYS IN INVENTORY MATH ---
        if vin in existing_vins_map:
            actual_created_at = existing_vins_map[vin]
            created_dt = pd.to_datetime(actual_created_at, utc=True)
            days_live = max(0, (current_time_dt - created_dt).days)
        else:
            actual_created_at = current_time_iso
            days_live = 0

        record = {
            'dealership_id': dealership_id,
            'vin': vin,
            'year': int(row['year']) if pd.notna(row.get('year')) else None,
            'make': str(row.get('make', '')).strip() if pd.notna(row.get('make')) else None,
            'model': str(row.get('model', '')).strip() if pd.notna(row.get('model')) else None,
            'trim': str(row.get('trim', '')) if pd.notna(row.get('trim')) else None,
            'price': float(row.get('price') or row.get('sale_price', 0)) if pd.notna(row.get('price') or row.get('sale_price')) else None,
            'msrp': float(row['msrp']) if pd.notna(row.get('msrp')) else None,
            'monthly_payment': float(row.get('monthly_payment', 0)) if pd.notna(row.get('monthly_payment')) else None,
            'exterior_color': str(row.get('exterior_color', '')) if pd.notna(row.get('exterior_color')) else None,
            'interior_color': str(row.get('interior_color', '')) if pd.notna(row.get('interior_color')) else None,
            'stock_number': str(row.get('stock_number') or row.get('stock', '')) if pd.notna(row.get('stock_number') or row.get('stock')) else None,
            'mileage': int(row.get('mileage', 0)) if pd.notna(row.get('mileage')) else None,
            'transmission': str(row.get('transmission', '')) if pd.notna(row.get('transmission')) else None,
            'drivetrain': str(row.get('drivetrain', '')) if pd.notna(row.get('drivetrain')) else None,
            'engine': str(row.get('engine', '')) if pd.notna(row.get('engine')) else None,
            'body_style': str(row.get('body_style', '')) if pd.notna(row.get('body_style')) else None,
            'fuel_type': str(row.get('fuel_type', '')) if pd.notna(row.get('fuel_type')) else None,
            'features': str(row.get('features', '')) if pd.notna(row.get('features')) else None,
            'dealer_phone': str(row.get('dealer_phone', '')) if pd.notna(row.get('dealer_phone')) else None,
            'lead_score': int(row.get('lead_score', 0)) if pd.notna(row.get('lead_score')) else None,
            'urgency_flag': str(row.get('urgency_flag', '')) if pd.notna(row.get('urgency_flag')) else None,
            'market_comp': _parse_market_comp(row.get('market_comp')),
            'seo_notes': str(row.get('seo_notes', '')) if pd.notna(row.get('seo_notes')) else None,
            'source_format': str(row.get('source_format', '')) if pd.notna(row.get('source_format')) else None,
            'status': str(row.get('status', 'available')) if pd.notna(row.get('status')) else 'available',
            'source_file': row.get('_source_file'),
            'ingested_at': row.get('_ingested_at') if '_ingested_at' in df.columns and pd.notna(row.get('_ingested_at')) else current_time_iso,
            
            # --- NEW STRICT DATE FIELDS ---
            'created_at': actual_created_at,
            'updated_at': current_time_iso,
            'days_in_inventory': days_live,
            'snapshot_date': tracked_date or datetime.now().strftime('%Y-%m-%d'),
            # --- LIFECYCLE FIELDS (Codex schema 2026-04-15) ---
            'first_seen_at': actual_created_at,
            'last_seen_at': current_time_iso,
            'is_active': True,
            'unavailable_at': None,
        }
        records.append(record)

    return records

def transform_market_sales(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    for _, row in df.iterrows():
        record = {
            'dealership_id': dealership_id,
            'month': str(row.get('month', '')) if pd.notna(row.get('month')) else None,
            'brand': str(row.get('brand', '')) if pd.notna(row.get('brand')) else None,
            'model_name': str(row.get('model_name', '')) if pd.notna(row.get('model_name')) else None,
            'units_sold': int(row['units_sold']) if pd.notna(row.get('units_sold')) else 0,
            'distance_miles': float(row.get('distance_miles', 0)) if pd.notna(row.get('distance_miles')) else None,
            'source_file': row.get('_source_file'),
            'created_at': row.get('_ingested_at', datetime.now().isoformat())
        }
        if record['month']:
            records.append(record)
    return records

def transform_geographic_sales(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    for _, row in df.iterrows():
        zip_code = str(row.get('zip', '')).strip() if pd.notna(row.get('zip')) else None
        if not zip_code:
            continue
        # radius_band: prefer explicit value, fall back to synthesized "{N}mi" from radius_miles
        radius_band = str(row.get('radius_band', '')) if pd.notna(row.get('radius_band')) else None
        if not radius_band and pd.notna(row.get('radius_miles')):
            radius_band = f"{int(row.get('radius_miles'))}mi"
        record = {
            'dealership_id': dealership_id,
            'zip_code': zip_code,
            'radius_band': radius_band,
            'distance_miles': float(row.get('distance_mi', 0)) if pd.notna(row.get('distance_mi')) else None,
            'model_name': str(row.get('model_name', '')) if pd.notna(row.get('model_name')) else None,
            'radius_miles': int(row.get('radius_miles')) if pd.notna(row.get('radius_miles')) else None,
            'market_significance': str(row.get('market_significance', '')) if pd.notna(row.get('market_significance')) else None,
            'priority': float(row.get('priority')) if pd.notna(row.get('priority')) else None,
            'dealer_zip_sales_current': int(row.get('dealer_zip_sales_current', 0)) if pd.notna(row.get('dealer_zip_sales_current')) else 0,
            'total_zip_sales_yoy': int(row.get('total_zip_sales_yoy', 0)) if pd.notna(row.get('total_zip_sales_yoy')) else 0,
            'total_zip_sales_lp': int(row.get('total_zip_sales_lp', 0)) if pd.notna(row.get('total_zip_sales_lp')) else 0,
            'all_zip_sales_current': int(row.get('all_zip_sales_current', 0)) if pd.notna(row.get('all_zip_sales_current')) else 0,
            'all_zip_sales_yoy': int(row.get('all_zip_sales_yoy', 0)) if pd.notna(row.get('all_zip_sales_yoy')) else 0,
            'all_zip_sales_lp': int(row.get('all_zip_sales_lp', 0)) if pd.notna(row.get('all_zip_sales_lp')) else 0,
            'zip_share_current': float(row.get('zip_share_current')) if pd.notna(row.get('zip_share_current')) else None,
            'zip_share_yoy': float(row.get('zip_share_yoy')) if pd.notna(row.get('zip_share_yoy')) else None,
            'zip_share_lp': float(row.get('zip_share_lp')) if pd.notna(row.get('zip_share_lp')) else None,
            # Legacy flat-format fields (backwards compat)
            'your_zip_sales': int(row.get('your_zip_sales', 0)) if pd.notna(row.get('your_zip_sales')) else 0,
            'total_zip_sales': int(row.get('total_zip_sales', 0)) if pd.notna(row.get('total_zip_sales')) else 0,
            'zip_share': float(row.get('zip_share')) if pd.notna(row.get('zip_share')) else None,
            'source_file': row.get('_source_file'),
            'ingested_at': row.get('_ingested_at', datetime.now().isoformat())
        }
        records.append(record)
    return records

def transform_market_analysis(df: pd.DataFrame, dealership_id: str, tracked_date: str = None, existing_ma_map: dict = None) -> List[Dict]:
    """Strategy-tier ZIP reports (Go To War / Hold Your Ground / Take a Closer Look).

    existing_ma_map: {(zip_code, model, period_label): created_at} — pre-fetched from Supabase
    so we skip rows that are already up-to-date (same import_batch_id) rather than blind upsert.
    """
    records = []
    if existing_ma_map is None:
        existing_ma_map = {}

    for _, row in df.iterrows():
        zip_code = str(row.get('zip_code', '')).strip() if pd.notna(row.get('zip_code')) else None
        if not zip_code or zip_code == 'nan':
            continue

        # Strip any browser-appended (1) from model name — safety net even if xlsx_to_csv already cleaned it
        raw_model = str(row.get('model', '')).strip() if pd.notna(row.get('model')) else None
        if not raw_model:
            continue
        model = re.sub(r'\s*\(\d+\)\s*$', '', raw_model).strip()

        period_label = str(row.get('period_label', '')).strip() if pd.notna(row.get('period_label')) else None
        period_start = str(row.get('period_start', '')).strip() if pd.notna(row.get('period_start')) else None
        period_end   = str(row.get('period_end', '')).strip() if pd.notna(row.get('period_end')) else None
        import_batch_id = str(row.get('import_batch_id', '')).strip() if pd.notna(row.get('import_batch_id')) else None

        record = {
            'dealership_id': dealership_id,
            'zip_code': zip_code,
            'model': model,
            'market_significance': str(row.get('market_significance', '')) if pd.notna(row.get('market_significance')) else None,
            'priority': float(row.get('priority')) if pd.notna(row.get('priority')) else None,
            'distance_miles': float(row.get('distance_miles')) if pd.notna(row.get('distance_miles')) else None,
            'dealer_sales_current': int(row.get('dealer_sales_current')) if pd.notna(row.get('dealer_sales_current')) else None,
            'dealer_sales_yoy': int(row.get('dealer_sales_yoy')) if pd.notna(row.get('dealer_sales_yoy')) else None,
            'dealer_sales_lp': int(row.get('dealer_sales_lp')) if pd.notna(row.get('dealer_sales_lp')) else None,
            'all_sales_current': int(row.get('all_sales_current')) if pd.notna(row.get('all_sales_current')) else None,
            'all_sales_yoy': int(row.get('all_sales_yoy')) if pd.notna(row.get('all_sales_yoy')) else None,
            'all_sales_lp': int(row.get('all_sales_lp')) if pd.notna(row.get('all_sales_lp')) else None,
            'zip_share_current': float(row.get('zip_share_current')) if pd.notna(row.get('zip_share_current')) else None,
            'zip_share_yoy': float(row.get('zip_share_yoy')) if pd.notna(row.get('zip_share_yoy')) else None,
            'zip_share_lp': float(row.get('zip_share_lp')) if pd.notna(row.get('zip_share_lp')) else None,
            'radius_miles': int(row.get('radius_miles')) if pd.notna(row.get('radius_miles')) else None,
            'tracked_date': tracked_date or datetime.now().date().isoformat(),
            'period_start': period_start,
            'period_end': period_end,
            'period_label': period_label,
            'import_batch_id': import_batch_id,
        }
        records.append(record)
    return records


def transform_google_trends_time_series(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    for _, row in df.iterrows():
        record = {
            'dealership_id': dealership_id,
            'date': pd.to_datetime(row['date']).strftime('%Y-%m-%d') if pd.notna(row.get('date')) else None,
            'brand_name': str(row.get('brand_name', '')) if pd.notna(row.get('brand_name')) else None,
            'popularity_score': int(row['popularity_score']) if pd.notna(row.get('popularity_score')) else None,
            'region': str(row.get('region', '')) if pd.notna(row.get('region')) else None,
            'date_pulled': pd.to_datetime(row['date_pulled']).strftime('%Y-%m-%d') if pd.notna(row.get('date_pulled')) else None,
            'created_at': datetime.now().isoformat()
        }
        if record['date'] and record['brand_name']:
            records.append(record)
    return records

def transform_google_trends_rising_queries(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    for _, row in df.iterrows():
        record = {
            'dealership_id': dealership_id,
            'query': str(row.get('query', '')) if pd.notna(row.get('query')) else None,
            'search_interest': int(row['search_interest']) if pd.notna(row.get('search_interest')) else None,
            'increase_percent': str(row.get('increase_percent', '')) if pd.notna(row.get('increase_percent')) else None,
            'region': str(row.get('region', '')) if pd.notna(row.get('region')) else None,
            'date_pulled': pd.to_datetime(row['date_pulled']).strftime('%Y-%m-%d') if pd.notna(row.get('date_pulled')) else None,
            'created_at': datetime.now().isoformat()
        }
        if record['query']:
            records.append(record)
    return records

def transform_google_trends_top_queries(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    for _, row in df.iterrows():
        record = {
            'dealership_id': dealership_id,
            'query': str(row.get('query', '')) if pd.notna(row.get('query')) else None,
            'search_interest': int(row['search_interest']) if pd.notna(row.get('search_interest')) else None,
            'increase_percent': str(row.get('increase_percent', '')) if pd.notna(row.get('increase_percent')) else None,
            'region': str(row.get('region', '')) if pd.notna(row.get('region')) else None,
            'date_pulled': pd.to_datetime(row['date_pulled']).strftime('%Y-%m-%d') if pd.notna(row.get('date_pulled')) else None,
            'created_at': datetime.now().isoformat()
        }
        if record['query']:
            records.append(record)
    return records

def transform_competitors(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    fallback_date = tracked_date or datetime.now().strftime('%Y-%m-%d')
    for _, row in df.iterrows():
        competitor_domain = str(row.get('domain_name', '') or row.get('domain', '')).strip()
        if not competitor_domain:
            continue
        effective_date = pd.to_datetime(row.get('date')).strftime('%Y-%m-%d') if pd.notna(row.get('date')) else fallback_date
        record = {
            'dealership_id': dealership_id,
            'competitor_domain': competitor_domain,
            'competitor_name': competitor_domain.replace('.com', '').replace('.net', '').replace('-', ' ').title(),
            'overlap_score': float(row.get('overlap', 0)) if pd.notna(row.get('overlap')) else None,
            'common_keywords': int(row.get('common_keywords', 0)) if pd.notna(row.get('common_keywords')) else None,
            'organic_keywords': int(row.get('organic_keywords', 0)) if pd.notna(row.get('organic_keywords')) else None,
            'organic_traffic': int(row.get('monthly_clicks', 0)) if pd.notna(row.get('monthly_clicks')) else None,
            'organic_value': float(row.get('monthly_value', 0)) if pd.notna(row.get('monthly_value')) else None,
            'tracked_date': effective_date,
            'source_file': row.get('_source_file'),
            'created_at': datetime.now().isoformat()
        }
        records.append(record)
    return records

def transform_ranking_history(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    fallback_date = tracked_date or datetime.now().strftime('%Y-%m-%d')
    for _, row in df.iterrows():
        keyword = str(row.get('keyword', '')).strip()
        if not keyword:
            continue
        effective_date = pd.to_datetime(row.get('date')).strftime('%Y-%m-%d') if pd.notna(row.get('date')) else fallback_date
        record = {
            'dealership_id': dealership_id,
            'keyword': keyword,
            'ranking_position': int(row.get('rank', 0) or row.get('end_rank', 0) or row.get('ranking_position', 0)) if pd.notna(row.get('rank') or row.get('end_rank') or row.get('ranking_position')) else None,
            'ranking_url': str(row.get('url', '')) if pd.notna(row.get('url')) else None,
            'search_volume': int(row.get('search_volume', 0)) if pd.notna(row.get('search_volume')) else None,
            'keyword_tier': str(row.get('keyword_tier', 'established')) if pd.notna(row.get('keyword_tier')) else 'established',
            'tracked_date': effective_date,
            'source_file': row.get('_source_file'),
            'created_at': datetime.now().isoformat()
        }
        records.append(record)
    return records

def transform_seo_keywords(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    fallback_date = tracked_date or datetime.now().strftime('%Y-%m-%d')
    for _, row in df.iterrows():
        keyword = str(row.get('keyword', '')).strip()
        if not keyword:
            continue
        effective_date = pd.to_datetime(row.get('date')).strftime('%Y-%m-%d') if pd.notna(row.get('date')) else fallback_date
        record = {
            'dealership_id': dealership_id,
            'keyword': keyword,
            'search_volume': int(row.get('search_volume', 0)) if pd.notna(row.get('search_volume')) else None,
            'ranking_position': int(row.get('rank', 0) or row.get('ranking_position', 0)) if pd.notna(row.get('rank') or row.get('ranking_position')) else None,
            'ranking_url': str(row.get('url', '')) if pd.notna(row.get('url')) else None,
            'previous_position': int(row.get('previous_position', 0)) if pd.notna(row.get('previous_position')) else None,
            'position_change': int(row.get('rank_change', 0) or row.get('position_change', 0)) if pd.notna(row.get('rank_change') or row.get('position_change')) else None,
            'difficulty_score': float(row.get('difficulty', 0)) if pd.notna(row.get('difficulty')) else None,
            'cpc': float(row.get('cpc', 0)) if pd.notna(row.get('cpc')) else None,
            'competition_level': str(row.get('competition_level', '')) if pd.notna(row.get('competition_level')) else None,
            'keyword_tier': str(row.get('keyword_tier', 'established')) if pd.notna(row.get('keyword_tier')) else 'established',
            'tracked_date': effective_date,
            'source_file': row.get('_source_file'),
            'created_at': datetime.now().isoformat()
        }
        records.append(record)
    return records

def transform_seo_kombat(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    fallback_date = tracked_date or datetime.now().strftime('%Y-%m-%d')
    for _, row in df.iterrows():
        keyword = str(row.get('keyword', '')).strip()
        competitor_domain = str(row.get('competitor_domain', '')).strip()
        if not keyword or not competitor_domain:
            continue
        effective_date = pd.to_datetime(row.get('date')).strftime('%Y-%m-%d') if pd.notna(row.get('date')) else fallback_date
        record = {
            'dealership_id': dealership_id,
            'competitor_domain': competitor_domain,
            'keyword': keyword,
            'your_rank': int(row.get('your_rank', 0)) if pd.notna(row.get('your_rank')) else None,
            'competitor_rank': int(row.get('competitor_rank', 0)) if pd.notna(row.get('competitor_rank')) else None,
            'search_volume': int(row.get('search_volume', 0)) if pd.notna(row.get('search_volume')) else None,
            'difficulty': float(row.get('difficulty', 0)) if pd.notna(row.get('difficulty')) else None,
            'tracked_date': effective_date,
            'source_file': row.get('_source_file'),
            'created_at': datetime.now().isoformat()
        }
        records.append(record)
    return records

def transform_seo_backlinks(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    fallback_date = tracked_date or datetime.now().strftime('%Y-%m-%d')
    for _, row in df.iterrows():
        source_url = str(row.get('source_url', '') or row.get('backlink', '')).strip()
        target_url = str(row.get('target_url', '') or row.get('url', '')).strip()
        if not source_url:
            continue
        effective_date = pd.to_datetime(row.get('first_seen_date')).strftime('%Y-%m-%d') if pd.notna(row.get('first_seen_date')) else fallback_date
        record = {
            'dealership_id': dealership_id,
            'source_url': source_url,
            'source_domain': str(row.get('source_domain', '') or row.get('domain', '')).strip() if pd.notna(row.get('source_domain') or row.get('domain')) else None,
            'target_url': target_url if target_url else None,
            'anchor_text': str(row.get('anchor_text', '')) if pd.notna(row.get('anchor_text')) else None,
            'domain_authority': int(row.get('domain_authority', 0) or row.get('domain_strength', 0)) if pd.notna(row.get('domain_authority') or row.get('domain_strength')) else None,
            'page_authority': int(row.get('page_authority', 0)) if pd.notna(row.get('page_authority')) else None,
            'spam_score': int(row.get('spam_score', 0)) if pd.notna(row.get('spam_score')) else None,
            'link_type': str(row.get('link_type', 'dofollow')) if pd.notna(row.get('link_type')) else 'dofollow',
            'first_seen_date': effective_date,
            'is_active': True,
            'source_file': row.get('_source_file'),
            'created_at': datetime.now().isoformat()
        }
        records.append(record)
    return records

def transform_seo_top_pages(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    fallback_date = tracked_date or datetime.now().strftime('%Y-%m-%d')
    for _, row in df.iterrows():
        url = str(row.get('url', '')).strip()
        if not url:
            continue
        effective_date = pd.to_datetime(row.get('date')).strftime('%Y-%m-%d') if pd.notna(row.get('date')) else fallback_date
        record = {
            'dealership_id': dealership_id,
            'url': url,
            'page_title': str(row.get('title', '') or row.get('page_title', '')) if pd.notna(row.get('title') or row.get('page_title')) else None,
            'organic_traffic': int(row.get('traffic', 0) or row.get('clicks', 0) or row.get('organic_traffic', 0)) if pd.notna(row.get('traffic') or row.get('clicks') or row.get('organic_traffic')) else None,
            'organic_keywords': int(row.get('keywords', 0) or row.get('keyword_count', 0) or row.get('organic_keywords', 0)) if pd.notna(row.get('keywords') or row.get('keyword_count') or row.get('organic_keywords')) else None,
            'organic_value': float(row.get('organic_value', 0)) if pd.notna(row.get('organic_value')) else None,
            'page_tier': str(row.get('keyword_tier', 'established')) if pd.notna(row.get('keyword_tier')) else 'established',
            'tracked_date': effective_date,
            'source_file': row.get('_source_file'),
            'created_at': datetime.now().isoformat()
        }
        records.append(record)
    return records

def transform_ppc_keywords(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    fallback_date = tracked_date or datetime.now().strftime('%Y-%m-%d')
    for _, row in df.iterrows():
        keyword = str(row.get('keyword', '')).strip()
        if not keyword:
            continue
        record = {
            'dealership_id': dealership_id,
            'keyword': keyword,
            'search_volume': int(row.get('search_volume', 0)) if pd.notna(row.get('search_volume')) else None,
            'ranking_difficulty': int(row.get('ranking_difficulty', 0)) if pd.notna(row.get('ranking_difficulty')) else None,
            'total_monthly_clicks': int(row.get('total_monthly_clicks', 0)) if pd.notna(row.get('total_monthly_clicks')) else None,
            'mobile_search_percent': float(row.get('mobile_search_percent', 0)) if pd.notna(row.get('mobile_search_percent')) else None,
            'desktop_search_percent': float(row.get('desktop_search_percent', 0)) if pd.notna(row.get('desktop_search_percent')) else None,
            'paid_clicks_percent': float(row.get('paid_clicks_percent', 0)) if pd.notna(row.get('paid_clicks_percent')) else None,
            'organic_clicks_percent': float(row.get('organic_clicks_percent', 0)) if pd.notna(row.get('organic_clicks_percent')) else None,
            'cpc_broad': float(row.get('cpc_broad', 0)) if pd.notna(row.get('cpc_broad')) else None,
            'cpc_phrase': float(row.get('cpc_phrase', 0)) if pd.notna(row.get('cpc_phrase')) else None,
            'cpc_exact': float(row.get('cpc_exact', 0)) if pd.notna(row.get('cpc_exact')) else None,
            'cost_broad': float(row.get('cost_broad', 0)) if pd.notna(row.get('cost_broad')) else None,
            'cost_phrase': float(row.get('cost_phrase', 0)) if pd.notna(row.get('cost_phrase')) else None,
            'cost_exact': float(row.get('cost_exact', 0)) if pd.notna(row.get('cost_exact')) else None,
            'ads_count': int(row.get('ads_count', 0)) if pd.notna(row.get('ads_count')) else None,
            'serp_features': str(row.get('serp_features', '')) if pd.notna(row.get('serp_features')) else None,
            'is_question': str(row.get('is_question', '')) if pd.notna(row.get('is_question')) else None,
            'serp_current': str(row.get('serp_current', ''))[:10000] if pd.notna(row.get('serp_current')) else None,
            'serp_month_2': str(row.get('serp_month_2', ''))[:10000] if pd.notna(row.get('serp_month_2')) else None,
            'serp_month_3': str(row.get('serp_month_3', ''))[:10000] if pd.notna(row.get('serp_month_3')) else None,
            'tracked_date': fallback_date,
            'source_file': row.get('_source_file'),
            'created_at': datetime.now().isoformat()
        }
        records.append(record)
    return records

def transform_ppc_kombat(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    fallback_date = tracked_date or datetime.now().strftime('%Y-%m-%d')
    for _, row in df.iterrows():
        keyword = str(row.get('keyword', '')).strip()
        if not keyword:
            continue
        record = {
            'dealership_id': dealership_id,
            'keyword': keyword,
            'search_volume': int(row.get('search_volume', 0)) if pd.notna(row.get('search_volume')) else 0,
            'ranking_difficulty': int(row.get('ranking_difficulty', 0)) if pd.notna(row.get('ranking_difficulty')) else 0,
            'total_monthly_clicks': int(row.get('total_monthly_clicks', 0)) if pd.notna(row.get('total_monthly_clicks')) else 0,
            'mobile_search_pct': float(row.get('mobile_search_pct', 0)) if pd.notna(row.get('mobile_search_pct')) else None,
            'desktop_search_pct': float(row.get('desktop_search_pct', 0)) if pd.notna(row.get('desktop_search_pct')) else None,
            'not_clicked_pct': float(row.get('not_clicked_pct', 0)) if pd.notna(row.get('not_clicked_pct')) else None,
            'paid_clicks_pct': float(row.get('paid_clicks_pct', 0)) if pd.notna(row.get('paid_clicks_pct')) else None,
            'organic_clicks_pct': float(row.get('organic_clicks_pct', 0)) if pd.notna(row.get('organic_clicks_pct')) else None,
            'broad_cpc': float(row.get('broad_cpc', 0)) if pd.notna(row.get('broad_cpc')) else None,
            'phrase_cpc': float(row.get('phrase_cpc', 0)) if pd.notna(row.get('phrase_cpc')) else None,
            'exact_cpc': float(row.get('exact_cpc', 0)) if pd.notna(row.get('exact_cpc')) else None,
            'broad_monthly_clicks': int(row.get('broad_monthly_clicks', 0)) if pd.notna(row.get('broad_monthly_clicks')) else 0,
            'phrase_monthly_clicks': int(row.get('phrase_monthly_clicks', 0)) if pd.notna(row.get('phrase_monthly_clicks')) else 0,
            'exact_monthly_clicks': int(row.get('exact_monthly_clicks', 0)) if pd.notna(row.get('exact_monthly_clicks')) else 0,
            'broad_monthly_cost': float(row.get('broad_monthly_cost', 0)) if pd.notna(row.get('broad_monthly_cost')) else None,
            'phrase_monthly_cost': float(row.get('phrase_monthly_cost', 0)) if pd.notna(row.get('phrase_monthly_cost')) else None,
            'exact_monthly_cost': float(row.get('exact_monthly_cost', 0)) if pd.notna(row.get('exact_monthly_cost')) else None,
            'ads_count': int(row.get('ads_count', 0)) if pd.notna(row.get('ads_count')) else 0,
            'ranking_homepages': int(row.get('ranking_homepages', 0)) if pd.notna(row.get('ranking_homepages')) else 0,
            'serp_features': str(row.get('serp_features', '')) if pd.notna(row.get('serp_features')) else None,
            'serp_first_result': str(row.get('serp_first_result', '')) if pd.notna(row.get('serp_first_result')) else None,
            'is_question': str(row.get('is_question', '')).lower() == 'true' if pd.notna(row.get('is_question')) else False,
            'is_nsfw': str(row.get('is_nsfw', '')).lower() == 'true' if pd.notna(row.get('is_nsfw')) else False,
            'serp_current': str(row.get('serp_current', ''))[:10000] if pd.notna(row.get('serp_current')) else None,
            'serp_prev': str(row.get('serp_prev', ''))[:10000] if pd.notna(row.get('serp_prev')) else None,
            'serp_past_3': str(row.get('serp_past_3', ''))[:10000] if pd.notna(row.get('serp_past_3')) else None,
            'serp_past_4': str(row.get('serp_past_4', ''))[:10000] if pd.notna(row.get('serp_past_4')) else None,
            'serp_past_5': str(row.get('serp_past_5', ''))[:10000] if pd.notna(row.get('serp_past_5')) else None,
            'serp_past_6': str(row.get('serp_past_6', ''))[:10000] if pd.notna(row.get('serp_past_6')) else None,
            'tracked_date': fallback_date,
            'source_file': row.get('_source_file'),
            'created_at': datetime.now().isoformat()
        }
        records.append(record)
    return records

def transform_domain_ad_history(df: pd.DataFrame, dealership_id: str, tracked_date: str = None) -> List[Dict]:
    records = []
    fallback_date = tracked_date or datetime.now().strftime('%Y-%m-%d')
    for _, row in df.iterrows():
        term = str(row.get('term', '')).strip()
        title = str(row.get('title', '')).strip()
        if not term or not title:
            continue
        ad_date_raw = row.get('ad_date')
        if pd.notna(ad_date_raw):
            ad_date_str = str(int(ad_date_raw)) if isinstance(ad_date_raw, float) else str(ad_date_raw)
            if len(ad_date_str) == 8:
                ad_date = f"{ad_date_str[:4]}-{ad_date_str[4:6]}-{ad_date_str[6:8]}"
            else:
                ad_date = fallback_date
        else:
            ad_date = fallback_date

        record = {
            'dealership_id': dealership_id,
            'term': term,
            'ad_date': ad_date,
            'clicks_per_month': int(row.get('clicks_per_month', 0)) if pd.notna(row.get('clicks_per_month')) else None,
            'cost_per_click': float(row.get('cost_per_click', 0)) if pd.notna(row.get('cost_per_click')) else None,
            'coverage': float(row.get('coverage', 0)) if pd.notna(row.get('coverage')) else None,
            'months_in_use': str(row.get('months_in_use', '')) if pd.notna(row.get('months_in_use')) else None,
            'position': int(row.get('position', 0)) if pd.notna(row.get('position')) else None,
            'title': title,
            'body': str(row.get('body', '')) if pd.notna(row.get('body')) else None,
            'url': str(row.get('url', '')) if pd.notna(row.get('url')) else None,
            'tracked_date': fallback_date,
            'source_file': row.get('_source_file'),
            'created_at': datetime.now().isoformat()
        }
        records.append(record)
    return records

# =============================================================================
# TABLE ROUTING
# =============================================================================

TABLE_ROUTES = {
    'norm_inventory_vehicle': ('inventory', transform_inventory),
    'norm_shadowforge_canonical': ('inventory', transform_inventory),
    'shadowforge_': ('inventory', transform_inventory),  # Catch raw Shadowforge outputs
    'norm_market_insights': ('market_sales', transform_market_sales),
    'norm_geo_sales': ('geographic_sales', transform_geographic_sales),
    'norm_market_analysis': ('market_analysis', transform_market_analysis),
    'norm_google_trends_time_series': ('google_trends_time_series', transform_google_trends_time_series),
    'norm_google_trends_rising_queries': ('google_trends_rising_queries', transform_google_trends_rising_queries),
    'norm_google_trends_top_queries': ('google_trends_top_queries', transform_google_trends_top_queries),
    'norm_spyfu_competitors': ('competitors', transform_competitors),
    'norm_spyfu_ranking_history': ('ranking_history', transform_ranking_history),
    'norm_spyfu_seo_keywords': ('seo_keywords', transform_seo_keywords),
    'norm_spyfu_seo_kombat': ('seo_kombat', transform_seo_kombat),
    'norm_spyfu_backlinks': ('seo_backlinks', transform_seo_backlinks),
    'norm_seo_top_pages': ('seo_top_pages', transform_seo_top_pages),
    'norm_spyfu_ppc_keywords': ('ppc_keywords', transform_ppc_keywords),
    'norm_spyfu_ppc_kombat': ('spyfu_ppc_kombat', transform_ppc_kombat),
    'norm_spyfu_domain_ad_history': ('domain_ad_history', transform_domain_ad_history),
    'norm_bomninchryslerdodgejeepram.com_Thunderbit': ('inventory', transform_inventory),
    'norm_columbianachryslerjeepdodge.net_Thunderbit': ('inventory', transform_inventory),
    'norm_gorcauto.com_Thunderbit': ('inventory', transform_inventory),
    'norm_harrygreenchevy.com_Thunderbit': ('inventory', transform_inventory),
    'norm_springfieldford.com_Thunderbit': ('inventory', transform_inventory),
    'norm_midstatechevy.com_Thunderbit': ('inventory', transform_inventory),
    'norm_pacificoford.com_Thunderbit': ('inventory', transform_inventory),
    'norm_robinford.com_Thunderbit': ('inventory', transform_inventory),
    'norm_rivercitysubaru.com_Thunderbit': ('inventory', transform_inventory),
    'norm_dutchmillersubaru.com_Thunderbit': ('inventory', transform_inventory),
    'norm_northsidewv.net_Thunderbit': ('inventory', transform_inventory),
    'norm_miamilakeschryslerjeepdodgeram.com_Thunderbit': ('inventory', transform_inventory),
}

# =============================================================================
# DATA HYGIENE — Phase 1 Additive Layer
# Alpha Claudette Chappell (CTO) — 2026-04-10
# These functions run AFTER each batch upsert to mark stale data.
# No rows are ever deleted — only marked with status flags and timestamps.
# =============================================================================

def mark_stale_inventory(client, dealership_id: str, active_vins: set, snapshot_date: str):
    """
    After inventory upsert: fetch all VINs for this dealer where removed_at IS NULL.
    Any VIN NOT in the active_vins set from the current file gets marked:
      - status = 'removed'
      - removed_at = NOW()
      - removal_reason = 'not_in_latest_file'
    Historical record preserved — never deletes.
    """
    if not active_vins:
        return  # no active VINs in batch — skip to avoid marking everything removed

    try:
        # Fetch all currently-live VINs for this dealer (aligned to is_active lifecycle column)
        resp = client.table('inventory') \
            .select('vin') \
            .eq('dealership_id', dealership_id) \
            .eq('is_active', True) \
            .execute()

        if not resp.data:
            return

        db_vins = {row['vin'] for row in resp.data}
        stale_vins = db_vins - active_vins

        if not stale_vins:
            return

        # Mark stale VINs in batches of 100 (Supabase IN clause limit)
        stale_list = list(stale_vins)
        batch_size = 100
        marked = 0
        now_iso = datetime.now().isoformat()

        for i in range(0, len(stale_list), batch_size):
            batch = stale_list[i:i + batch_size]
            client.table('inventory') \
                .update({
                    'status':         'removed',
                    'removed_at':     now_iso,
                    'removal_reason': 'not_in_latest_file',
                    'updated_at':     now_iso,
                    'is_active':      False,
                    'last_seen_at':   now_iso,
                    'unavailable_at': now_iso,
                }) \
                .eq('dealership_id', dealership_id) \
                .in_('vin', batch) \
                .execute()
            marked += len(batch)

        print(f"   🗑️  Marked {marked} stale VINs as removed (not in {snapshot_date} file)")

    except Exception as e:
        print(f"   ⚠️  Stale inventory check failed: {e}")


def mark_dropped_keywords(client, dealership_id: str, tracked_date: str, active_keywords: set):
    """
    After seo_keywords upsert: find keywords for this dealer+tracked_date
    that are in the DB (dropped_out_date IS NULL) but NOT in the current file.
    Marks them: dropped_out_date = tracked_date, dropout_reason = 'not_in_latest_file'.
    Only compares within the same tracked_date — different dates are separate snapshots by design.
    """
    if not active_keywords or not tracked_date:
        return

    try:
        resp = client.table('seo_keywords') \
            .select('id, keyword') \
            .eq('dealership_id', dealership_id) \
            .eq('tracked_date', tracked_date) \
            .is_('dropped_out_date', 'null') \
            .execute()

        if not resp.data:
            return

        db_keywords = {row['keyword']: row['id'] for row in resp.data}
        dropped = {kw: uid for kw, uid in db_keywords.items() if kw not in active_keywords}

        if not dropped:
            return

        dropped_ids = list(dropped.values())
        batch_size = 100
        marked = 0

        for i in range(0, len(dropped_ids), batch_size):
            batch = dropped_ids[i:i + batch_size]
            client.table('seo_keywords') \
                .update({
                    'dropped_out_date': tracked_date,
                    'dropout_reason':   'not_in_latest_file'
                }) \
                .in_('id', batch) \
                .execute()
            marked += len(batch)

        print(f"   📉 Marked {marked} keywords as dropped out ({tracked_date})")

    except Exception as e:
        print(f"   ⚠️  Keyword dropout check failed: {e}")


def update_backlink_last_seen(client, dealership_id: str, active_source_urls: set, ingest_date: str):
    """
    On every seo_backlinks ingest run:
    - Active URLs: update last_seen_date = ingest_date, is_active = true
    - URLs in DB but NOT in current file: set is_active = false
    Runs in batches to stay within Supabase limits.
    """
    if not ingest_date:
        return

    try:
        # Step 1: Update last_seen_date for all active URLs in current batch
        if active_source_urls:
            active_list = list(active_source_urls)
            batch_size = 100
            for i in range(0, len(active_list), batch_size):
                batch = active_list[i:i + batch_size]
                client.table('seo_backlinks') \
                    .update({'last_seen_date': ingest_date, 'is_active': True}) \
                    .eq('dealership_id', dealership_id) \
                    .in_('source_url', batch) \
                    .execute()

        # Step 2: Deactivate links absent from current file
        resp = client.table('seo_backlinks') \
            .select('source_url') \
            .eq('dealership_id', dealership_id) \
            .eq('is_active', True) \
            .execute()

        if resp.data:
            db_active_urls = {row['source_url'] for row in resp.data}
            gone_urls = db_active_urls - active_source_urls

            if gone_urls:
                gone_list = list(gone_urls)
                for i in range(0, len(gone_list), batch_size):
                    batch = gone_list[i:i + batch_size]
                    client.table('seo_backlinks') \
                        .update({'is_active': False}) \
                        .eq('dealership_id', dealership_id) \
                        .in_('source_url', batch) \
                        .execute()
                print(f"   🔗 Deactivated {len(gone_urls)} backlinks absent from {ingest_date} file")

    except Exception as e:
        print(f"   ⚠️  Backlink hygiene failed: {e}")


# =============================================================================
# UPLOAD FUNCTIONS
# =============================================================================

def upload_to_supabase(client, table_name: str, records: List[Dict]) -> int:
    if not records:
        return 0

    CONFLICT_COLUMNS = {
        'inventory': 'dealership_id,vin',  # Codex updated constraint 2026-04-15
        'dealerships': 'domain',
        'seo_keywords': 'dealership_id,keyword,tracked_date',
        'ranking_history': 'dealership_id,keyword,tracked_date',
        'seo_top_pages': 'dealership_id,url,tracked_date',
        'seo_backlinks': 'dealership_id,source_url',
        'competitors': 'dealership_id,competitor_domain',
        'seo_kombat': 'dealership_id,competitor_domain,keyword,tracked_date',
        'market_sales': 'dealership_id,month,brand,model_name',
        'geographic_sales': 'dealership_id,zip_code,radius_band',
        'market_analysis': 'dealership_id,zip_code,model,period_label',
        'ppc_keywords': 'dealership_id,keyword,tracked_date',
        'spyfu_ppc_kombat': 'dealership_id,keyword,tracked_date',
        'domain_ad_history': 'dealership_id,term,ad_date,title',
    }

    conflict_cols = CONFLICT_COLUMNS.get(table_name)
    if conflict_cols:
        key_fields = [k.strip() for k in conflict_cols.split(',')]
        seen = {}
        for rec in records:
            key_parts = []
            for field in key_fields:
                if field.startswith('DATE(') and field.endswith(')'):
                    col_name = field[5:-1]
                    val = rec.get(col_name)
                    if val:
                        key_parts.append(val.split('T')[0])
                    else:
                        key_parts.append(None)
                else:
                    key_parts.append(rec.get(field))
            key = tuple(key_parts)
            if key not in seen or any(v is None for v in key):
                seen[key] = rec
            else:
                seen[key] = rec
        records = list(seen.values())

    batch_size = 500
    total_uploaded = 0
    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]
        try:
            if conflict_cols:
                result = client.table(table_name).upsert(batch, on_conflict=conflict_cols).execute()
            else:
                result = client.table(table_name).upsert(batch).execute()
            if hasattr(result, 'data') and result.data is not None:
                total_uploaded += len(batch)
            else:
                print(f"   ⚠️  Batch {i//batch_size + 1} on {table_name}: no data returned (possible silent error)")
                total_uploaded += len(batch)
        except Exception as e:
            print(f"   ❌ Batch {i//batch_size + 1} failed on {table_name}: {e}")
    return total_uploaded

# =============================================================================
# MAIN INGESTION
# =============================================================================

def ingest_all_csvs():
    """Main ingestion loop"""
    print("🔥 Aegis Supabase Upload - Normalized CSVs & Shadowforge → Cloud Database")
    print("=" * 80)

    csv_files = []
    if NORMALIZED_DIR.exists():
        csv_files.extend(list(NORMALIZED_DIR.glob('norm_*.csv')))
    else:
        print(f"⚠️  Normalized directory not found: {NORMALIZED_DIR}")

    if SHADOWFORGE_DIR.exists():
        csv_files.extend(list(SHADOWFORGE_DIR.glob('shadowforge_*.csv')))
    else:
        print(f"⚠️  Shadowforge directory not found: {SHADOWFORGE_DIR}")

    if not csv_files:
        print("⚠️  No CSVs found in either directory.")
        return

    print(f"📊 Found {len(csv_files)} total CSV files to evaluate\n")

    client = get_supabase_client()
    if not client:
        return

    processed_files = load_processed_files()

    stats = {
        'processed': 0,
        'skipped': 0,
        'errors': 0,
        'total_rows': 0,
        'by_table': {}
    }

    dealership_cache = {}

    for csv_file in csv_files:
        try:
            filename = csv_file.name

            if filename in processed_files:
                print(f"⏭️  {filename:<60} [SKIPPED] Already processed")
                stats['skipped'] += 1
                continue

            table_name = None
            transformer = None
            for prefix, (tbl, tfm) in TABLE_ROUTES.items():
                if filename.startswith(prefix):
                    table_name = tbl
                    transformer = tfm
                    break

            if not table_name or not transformer:
                print(f"⚠️  {filename:<60} [SKIPPED] Unknown table mapping")
                stats['skipped'] += 1
                continue

            print(f"📥 {filename:<60}")

            df = pd.read_csv(csv_file, low_memory=False)

            if df.empty:
                print("   [SKIPPED] Empty file")
                stats['skipped'] += 1
                mark_file_processed(filename)
                continue

            df.columns = df.columns.str.lower()
            df['_source_file'] = filename
            df['_ingested_at'] = datetime.now().isoformat()

            dealer_domain = extract_dealer_from_filename(filename)

            if not dealer_domain and 'url' in df.columns:
                first_url = df['url'].dropna().iloc[0] if len(df['url'].dropna()) > 0 else None
                if first_url:
                    dealer_domain = extract_domain_from_url(first_url)
                    if dealer_domain:
                        print(f"   📍 Extracted dealer from URL: {dealer_domain}")

            if not dealer_domain and filename.startswith('shadowforge_'):
                raw_name = filename.split('_202')[0].replace('shadowforge_', '').replace('_', '')
                dealer_domain = f"{raw_name.lower()}.com"
                print(f"   📍 Guessed domain from filename: {dealer_domain}")

            if not dealer_domain:
                print("   [SKIPPED] Could not determine dealer from filename or URL")
                stats['skipped'] += 1
                continue

            if dealer_domain not in dealership_cache:
                dealership_id = get_or_create_dealership(client, dealer_domain)
                if not dealership_id:
                    print("   [SKIPPED] Dealership creation failed")
                    stats['skipped'] += 1
                    continue
                dealership_cache[dealer_domain] = dealership_id
            else:
                dealership_id = dealership_cache[dealer_domain]

            tracked_date = extract_date_from_filename(filename)
            print(f"   📅 Tracked date: {tracked_date}")

            # --- PRE-FETCH EXISTING VINS (If Inventory) ---
            existing_vins_map = {}
            if table_name == 'inventory':
                print("   🔍 Pre-fetching existing VINs to calculate days_in_inventory...")
                try:
                    resp = client.table('inventory').select('vin, created_at').eq('dealership_id', dealership_id).execute()
                    if resp.data:
                        existing_vins_map = {item['vin']: item['created_at'] for item in resp.data}
                except Exception as e:
                    print(f"   ⚠️ Could not pre-fetch VINs (defaulting to 0 days): {e}")

                records = transformer(df, dealership_id, tracked_date, existing_vins_map)

            # --- PRE-FETCH EXISTING MARKET ANALYSIS ROWS (If market_analysis) ---
            elif table_name == 'market_analysis':
                print("   🔍 Pre-fetching existing market_analysis rows (zip/model/period)...")
                existing_ma_map = {}
                try:
                    resp = client.table('market_analysis') \
                        .select('zip_code, model, period_label, import_batch_id') \
                        .eq('dealership_id', dealership_id) \
                        .execute()
                    if resp.data:
                        for item in resp.data:
                            key = (item['zip_code'], item['model'], item.get('period_label') or '')
                            existing_ma_map[key] = item.get('import_batch_id') or ''
                        print(f"   📋 Found {len(existing_ma_map)} existing zip/model/period rows in Supabase")
                except Exception as e:
                    print(f"   ⚠️ Could not pre-fetch market_analysis rows: {e}")

                records = transformer(df, dealership_id, tracked_date, existing_ma_map)

            else:
                records = transformer(df, dealership_id, tracked_date)

            uploaded = upload_to_supabase(client, table_name, records)

            print(f"   ✅ {uploaded:>5} rows → {table_name}")

            # ── DATA HYGIENE: mark stale data after each successful upsert ──
            if table_name == 'inventory' and records:
                active_vins = {r['vin'] for r in records if r.get('vin')}
                mark_stale_inventory(client, dealership_id, active_vins, tracked_date)

            elif table_name == 'seo_keywords' and records:
                active_keywords = {r['keyword'] for r in records if r.get('keyword')}
                mark_dropped_keywords(client, dealership_id, tracked_date, active_keywords)

            elif table_name == 'seo_backlinks' and records:
                active_urls = {r['source_url'] for r in records if r.get('source_url')}
                update_backlink_last_seen(client, dealership_id, active_urls, tracked_date)
            # ── END HYGIENE ─────────────────────────────────────────────────

            mark_file_processed(filename)

            stats['processed'] += 1
            stats['total_rows'] += uploaded
            stats['by_table'][table_name] = stats['by_table'].get(table_name, 0) + uploaded

        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
            stats['errors'] += 1

        print("")

    print("=" * 80)
    print("🎉 Upload complete!")
    print(f"✅ Files processed: {stats['processed']}")
    print(f"✅ Total rows uploaded: {stats['total_rows']:,}")
    print(f"⚠️  Skipped: {stats['skipped']} | Errors: {stats['errors']}")

    if stats['by_table']:
        print(f"\n📊 Rows by table:")
        for table, count in sorted(stats['by_table'].items()):
            print(f"   {table:<30} {count:>8,} rows")

    supabase_id = SUPABASE_URL.replace('https://', '').split('.')[0]
    print(f"\n💡 Verify in Supabase: https://supabase.com/dashboard/project/{supabase_id}")

if __name__ == "__main__":
    ingest_all_csvs()