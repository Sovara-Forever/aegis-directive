"""
aegis_schema.py â Aegis Data Schema & Normalization Module
Version: 9.0 (MASTER: 16 Schemas - PPC Kombat + Full SERP Alignment)
Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
"""

import pandas as pd
import numpy as np
import re
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional

# =============================================================================
# NORMALIZATION UTILS
# =============================================================================

NULL_MARKERS = ['NAN', 'nan', 'NaN', '--', '', ' ', 'N/A', 'n/a', '#N/A', 'null', 'NULL', 'None']

def is_null(val: Any) -> bool:
    if pd.isna(val): return True
    if isinstance(val, str) and val.strip() in NULL_MARKERS: return True
    return False

def normalize_int(val: Any) -> int:
    if is_null(val): return 0
    if isinstance(val, str):
        val = val.replace(',', '').split('.')[0].strip()
        if val == '': return 0
    try: return int(float(val))
    except: return 0

def normalize_float(val: Any) -> Optional[float]:
    if is_null(val): return None
    if isinstance(val, str):
        val = val.replace(',', '').replace('$', '').replace('%', '').strip()
        if val == '': return None
    try: return float(val)
    except: return None

def normalize_cost(val: Any) -> float:
    if is_null(val): return 0.0
    if isinstance(val, str):
        val = re.sub(r'[^0-9.\-]', '', val)
        if val == '' or val == '.': return 0.0
    try: return float(val)
    except: return 0.0

def normalize_string(val: Any) -> Optional[str]:
    if is_null(val): return None
    return str(val).strip()

def normalize_date(val: Any) -> Optional[str]:
    if is_null(val): return None
    if isinstance(val, str):
        val = val.strip()
        if re.match(r'^\d{4}-\d{2}-\d{2}$', val): return val
        for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d', '%m-%d-%Y']:
            try: return datetime.strptime(val, fmt).strftime('%Y-%m-%d')
            except ValueError: continue
    try: return pd.to_datetime(val).strftime('%Y-%m-%d')
    except: return None

def normalize_zip(val: Any) -> Optional[str]:
    if is_null(val): return None
    val = str(val).strip().strip('"').strip("'")
    val = re.sub(r'[^0-9]', '', val)
    if val == '': return None
    if len(val) <= 5: return val.zfill(5)
    return val

# =============================================================================
# SCHEMA DEFINITIONS (15 SCHEMAS TOTAL)
# =============================================================================

SCHEMAS: Dict[str, Dict[str, Any]] = {
    # --- 1. INVENTORY (ENHANCED) ---
    'inventory_vehicle': {
        'name': 'inventory_vehicle',
        'primary_key': ['vin'],
        'columns': [
            {'name': 'year', 'type': 'int', 'required': True},
            {'name': 'make', 'type': 'string', 'required': False},
            {'name': 'model', 'type': 'string', 'required': True},
            {'name': 'trim', 'type': 'string', 'required': False},
            {'name': 'vin', 'type': 'string', 'required': True},
            {'name': 'stock_number', 'type': 'string', 'required': False},
            {'name': 'price', 'type': 'float', 'required': False},
            {'name': 'msrp', 'type': 'float', 'required': False},
            {'name': 'savings', 'type': 'float', 'required': False},
            {'name': 'mileage', 'type': 'int', 'required': False},
            {'name': 'exterior_color', 'type': 'string', 'required': False},
            {'name': 'interior_color', 'type': 'string', 'required': False},
            {'name': 'transmission', 'type': 'string', 'required': False},
            {'name': 'drivetrain', 'type': 'string', 'required': False},
            {'name': 'engine', 'type': 'string', 'required': False},
            {'name': 'status', 'type': 'string', 'required': False},
            {'name': 'dealer', 'type': 'string', 'required': False},
            {'name': 'url', 'type': 'string', 'required': False},
            {'name': 'image_url', 'type': 'string', 'required': False},
            {'name': '_make_model_combined', 'type': 'string', 'required': False},
        ],
        'column_map': {
            'VIN': 'vin', 'Stock Number': 'stock_number', 'Year': 'year',
            'Make': 'make', 'Model': 'model', 'Trim': 'trim',
            'Price': 'price', 'MSRP': 'msrp', 'Savings': 'savings',
            'Mileage': 'mileage', 'Exterior Color': 'exterior_color',
            'Interior Color': 'interior_color',
            'Vehicle Name': '_make_model_combined', 'Vehicle name': '_make_model_combined',
            'Final Price (USD)': 'price', 'Internet Price': 'price', 'Selling Price': 'price',
            'MSRP (USD)': 'msrp', 'Retail Price': 'msrp',
            'Vehicle URL': 'url', 'Vehicle Url': 'url', 'Vehicle Image': 'image_url',
            'vin-row': 'vin', 'stock-row': 'stock_number', 'title-top': 'year',
            'title-bottom': '_make_model_combined', 'price 3': 'price', 'price': 'msrp',
            'price 2': 'savings', 'hit-link href': 'url', 'hit-link src': 'image_url',
        }
    },

    # --- 2. MARKET INSIGHTS ---
    'market_insights': {
        'name': 'market_insights',
        'primary_key': ['dealership_name', 'month', 'brand', 'model_name'],
        'columns': [
            {'name': 'dealership_name', 'type': 'string', 'required': True},
            {'name': 'month', 'type': 'string', 'required': True},
            {'name': 'brand', 'type': 'string', 'required': True},
            {'name': 'model_name', 'type': 'string', 'required': True},
            {'name': 'units_sold', 'type': 'int', 'required': True},
            {'name': 'distance_miles', 'type': 'float', 'required': True},
        ],
        'column_map': {
            'Dealership Name': 'dealership_name', 'Month': 'month', 'Brand': 'brand',
            'Model Name': 'model_name', 'Units Sold': 'units_sold', 'Distance from Reference': 'distance_miles'
        }
    },

    # --- 3. GEO SALES ---
    'geo_sales': {
        'name': 'geo_sales',
        'primary_key': ['zip', 'radius_band'],
        'columns': [
            {'name': 'zip', 'type': 'string', 'required': True},
            {'name': 'radius_band', 'type': 'string', 'required': True},
            {'name': 'distance_mi', 'type': 'float', 'required': True},
            {'name': 'your_zip_sales', 'type': 'int', 'required': True},
            {'name': 'total_zip_sales', 'type': 'int', 'required': True},
            {'name': 'zip_share', 'type': 'float', 'required': False},
        ],
        'column_map': {
            'ZIP': 'zip', 'Name': 'radius_band', 'Distance (mi)': 'distance_mi',
            'Your ZIP Sales': 'your_zip_sales', 'Total ZIP Sales': 'total_zip_sales',
            'ZIP Share': 'zip_share',
        }
    },

    # --- 4. SALES TOTAL ---
    'sales_total': {
        'name': 'sales_total',
        'primary_key': ['brand', 'model', 'month'],
        'columns': [
            {'name': 'brand', 'type': 'string', 'required': True},
            {'name': 'model', 'type': 'string', 'required': True},
            {'name': 'month', 'type': 'string', 'required': True},
            {'name': 'units_sold', 'type': 'int', 'required': True},
        ],
        'column_map': {
            'Brand': 'brand', 'Model': 'model', 'Month': 'month', 'Units Sold': 'units_sold'
        }
    },

    # --- 5. ADS DAILY ---
    'ads_daily': {
        'name': 'ads_daily',
        'primary_key': ['date', 'campaign_id'],
        'columns': [
            {'name': 'date', 'type': 'date', 'required': True},
            {'name': 'campaign_id', 'type': 'int', 'required': True},
            {'name': 'impressions', 'type': 'int', 'required': True},
            {'name': 'clicks', 'type': 'int', 'required': True},
            {'name': 'cost', 'type': 'float', 'required': True},
        ],
        'column_map': {
            'Date': 'date', 'Campaign_ID': 'campaign_id', 'Impressions': 'impressions',
            'Clicks': 'clicks', 'Cost': 'cost',
        }
    },

    # --- 6. CAMPAIGN SUMMARY ---
    'campaign_summary': {
        'name': 'campaign_summary',
        'columns': [
            {'name': 'campaign', 'type': 'string', 'required': True},
            {'name': 'device', 'type': 'string', 'required': True},
            {'name': 'network', 'type': 'string', 'required': True},
            {'name': 'impressions', 'type': 'int', 'required': True},
            {'name': 'clicks', 'type': 'int', 'required': True},
            {'name': 'cost', 'type': 'float', 'required': True},
        ],
        'column_map': {
            'Campaign': 'campaign', 'Device': 'device', 'Network (with search partners)': 'network',
            'Impr.': 'impressions', 'Clicks': 'clicks', 'Cost': 'cost',
        }
    },

    # --- 7. GOOGLE SEARCH TERMS ---
    'google_search_terms': {
        'name': 'google_search_terms',
        'skip_header_rows': 2,
        'columns': [
            {'name': 'search_term', 'type': 'string', 'required': True},
            {'name': 'match_type', 'type': 'string', 'required': False},
        ],
        'column_map': {
            'Search term': 'search_term', 'Added/Excluded': 'match_type'
        }
    },

    # --- 8. SPYFU OVERVIEW ---
    'spyfu_overview': {
        'name': 'spyfu_overview',
        'columns': [
            {'name': 'term', 'type': 'string', 'required': True},
            {'name': 'monthly_searches', 'type': 'int', 'required': False},
            {'name': 'ranking_difficulty', 'type': 'int', 'required': False},
        ],
        'column_map': {
            'Term': 'term', 'MonthlySearches': 'monthly_searches', 'RankingDifficulty': 'ranking_difficulty'
        }
    },

    # --- 9. SPYFU BACKLINKS ---
    'spyfu_backlinks': {
        'name': 'spyfu_backlinks',
        'columns': [
            {'name': 'backlink', 'type': 'string', 'required': True},
            {'name': 'domain', 'type': 'string', 'required': True},
            {'name': 'domain_strength', 'type': 'int', 'required': False},
        ],
        'column_map': {
            'Backlink': 'backlink', 'Backlink Domain': 'domain', 'Domain Strength': 'domain_strength',
        }
    },

    # --- 10. SPYFU RANKING HISTORY ---
    'spyfu_ranking_history': {
        'name': 'spyfu_ranking_history',
        'columns': [
            {'name': 'keyword', 'type': 'string', 'required': True},
            {'name': 'start_rank', 'type': 'int', 'required': False},
            {'name': 'end_rank', 'type': 'int', 'required': False},
            {'name': 'rank_change', 'type': 'int', 'required': False},
            {'name': 'search_volume', 'type': 'int', 'required': False},
            {'name': 'end_clicks', 'type': 'int', 'required': False},
            {'name': 'clicks_change', 'type': 'int', 'required': False},
        ],
        'column_map': {
            'Keyword': 'keyword', 'StartRank': 'start_rank', 'EndRank': 'end_rank',
            'RankChange': 'rank_change', 'SearchVolume': 'search_volume',
            'EndClicks': 'end_clicks', 'ClicksChange': 'clicks_change'
        }
    },

    # --- 11. SPYFU SEO KEYWORDS ---
    'spyfu_seo_keywords': {
        'name': 'spyfu_seo_keywords',
        'columns': [
            {'name': 'keyword', 'type': 'string', 'required': True},
            {'name': 'rank', 'type': 'int', 'required': False},
            {'name': 'rank_change', 'type': 'int', 'required': False},
            {'name': 'top_rank', 'type': 'int', 'required': False},
            {'name': 'search_volume', 'type': 'int', 'required': False},
            {'name': 'difficulty', 'type': 'int', 'required': False},
            {'name': 'seo_clicks', 'type': 'int', 'required': False},
            {'name': 'seo_clicks_change', 'type': 'int', 'required': False},
            {'name': 'total_monthly_clicks', 'type': 'int', 'required': False},
            {'name': 'percent_mobile', 'type': 'float', 'required': False},
            {'name': 'percent_desktop', 'type': 'float', 'required': False},
            {'name': 'percent_paid', 'type': 'float', 'required': False},
            {'name': 'percent_organic', 'type': 'float', 'required': False},
            {'name': 'url', 'type': 'string', 'required': False},
            {'name': 'cpc', 'type': 'float', 'required': False},
        ],
        'column_map': {
            'Keyword': 'keyword', 'Rank': 'top_rank', 'Your Rank': 'rank', 'Your Rank Change': 'rank_change',
            'Search Volume': 'search_volume', 'Ranking Difficulty': 'difficulty',
            'SEO Clicks': 'seo_clicks', 'SEO Clicks Change': 'seo_clicks_change',
            'Total Monthly Clicks': 'total_monthly_clicks',
            'Mobile Search Percent': 'percent_mobile', 'Desktop Search Percent': 'percent_desktop',
            'Paid Clicks Percent': 'percent_paid', 'Organic Clicks Percent': 'percent_organic',
            'Your URL': 'url', 'Broad Cost Per Click': 'cpc'
        }
    },

    # --- 12. SPYFU SEO KOMBAT ---
    'spyfu_seo_kombat': {
        'name': 'spyfu_seo_kombat',
        'columns': [
            {'name': 'keyword', 'type': 'string', 'required': True},
            {'name': 'search_volume', 'type': 'int', 'required': False},
            {'name': 'total_clicks', 'type': 'int', 'required': False},
            {'name': 'is_question', 'type': 'string', 'required': False},
        ],
        'column_map': {
            'Keyword': 'keyword', 'Search Volume': 'search_volume',
            'Total Monthly Clicks': 'total_clicks', 'Is Question?': 'is_question'
        }
    },

    # --- 13. SPYFU COMPETITORS ---
    'spyfu_competitors': {
        'name': 'spyfu_competitors',
        'primary_key': ['domain_name'],
        'columns': [
            {'name': 'domain_name', 'type': 'string', 'required': True},
            {'name': 'overlap', 'type': 'float', 'required': False},
            {'name': 'common_keywords', 'type': 'int', 'required': False},
            {'name': 'monthly_clicks', 'type': 'int', 'required': False},
            {'name': 'monthly_value', 'type': 'float', 'required': False},
        ],
        'column_map': {
            'Domain Name': 'domain_name', 'Overlap': 'overlap',
            'Common Keywords': 'common_keywords',
            'Monthly Clicks': 'monthly_clicks', 'Monthly Value of Clicks': 'monthly_value'
        }
    },

    # --- 14. SEO TOP PAGES ---
    'seo_top_pages': {
        'name': 'seo_top_pages',
        'columns': [
            {'name': 'title', 'type': 'string', 'required': False},
            {'name': 'url', 'type': 'string', 'required': True},
            {'name': 'keyword', 'type': 'string', 'required': False},
            {'name': 'rank', 'type': 'int', 'required': False},
            {'name': 'search_volume', 'type': 'int', 'required': False},
            {'name': 'clicks', 'type': 'int', 'required': False},
            {'name': 'keyword_count', 'type': 'int', 'required': False},
        ],
        'column_map': {
            'title': 'title', 'url': 'url', 'keyword': 'keyword', 'rank': 'rank',
            'search_volume': 'search_volume', 'clicks': 'clicks', 'keyword_count': 'keyword_count',
            'Title': 'title', 'Url': 'url', 'Top KW': 'keyword', 'Top KW Position': 'rank',
            'Top KW Search Volume': 'search_volume', 'Top KW Clicks': 'clicks', 'Est Monthly SEO Clicks': 'clicks',
            'Keyword Count': 'keyword_count'
        }
    },

    # --- 15. SPYFU PPC KOMBAT (30-Column Competitive PPC Intelligence) ---
    'spyfu_ppc_kombat': {
        'name': 'spyfu_ppc_kombat',
        'primary_key': ['keyword'],
        'columns': [
            {'name': 'keyword', 'type': 'string', 'required': True},
            {'name': 'search_volume', 'type': 'int', 'required': False},
            {'name': 'ranking_difficulty', 'type': 'int', 'required': False},
            {'name': 'total_monthly_clicks', 'type': 'int', 'required': False},
            {'name': 'mobile_search_pct', 'type': 'float', 'required': False},
            {'name': 'desktop_search_pct', 'type': 'float', 'required': False},
            {'name': 'not_clicked_pct', 'type': 'float', 'required': False},
            {'name': 'paid_clicks_pct', 'type': 'float', 'required': False},
            {'name': 'organic_clicks_pct', 'type': 'float', 'required': False},
            {'name': 'broad_cpc', 'type': 'float', 'required': False},
            {'name': 'phrase_cpc', 'type': 'float', 'required': False},
            {'name': 'exact_cpc', 'type': 'float', 'required': False},
            {'name': 'broad_monthly_clicks', 'type': 'int', 'required': False},
            {'name': 'phrase_monthly_clicks', 'type': 'int', 'required': False},
            {'name': 'exact_monthly_clicks', 'type': 'int', 'required': False},
            {'name': 'broad_monthly_cost', 'type': 'float', 'required': False},
            {'name': 'phrase_monthly_cost', 'type': 'float', 'required': False},
            {'name': 'exact_monthly_cost', 'type': 'float', 'required': False},
            {'name': 'ads_count', 'type': 'int', 'required': False},
            {'name': 'ranking_homepages', 'type': 'int', 'required': False},
            {'name': 'serp_features', 'type': 'string', 'required': False},
            {'name': 'serp_first_result', 'type': 'string', 'required': False},
            {'name': 'is_question', 'type': 'string', 'required': False},
            {'name': 'is_nsfw', 'type': 'string', 'required': False},
            {'name': 'serp_current', 'type': 'string', 'required': False},
            {'name': 'serp_prev', 'type': 'string', 'required': False},
            {'name': 'serp_past_3', 'type': 'string', 'required': False},
            {'name': 'serp_past_4', 'type': 'string', 'required': False},
            {'name': 'serp_past_5', 'type': 'string', 'required': False},
            {'name': 'serp_past_6', 'type': 'string', 'required': False},
        ],
        'column_map': {
            'Keyword': 'keyword',
            'Search Volume': 'search_volume',
            'Ranking Difficulty': 'ranking_difficulty',
            'Total Monthly Clicks': 'total_monthly_clicks',
            'Mobile Search Percent': 'mobile_search_pct',
            'Desktop Search Percent': 'desktop_search_pct',
            'Searches Not Clicked Percent': 'not_clicked_pct',
            'Paid Clicks Percent': 'paid_clicks_pct',
            'Organic Clicks Percent': 'organic_clicks_pct',
            'Broad Cost Per Click': 'broad_cpc',
            'Phrase Cost Per Click': 'phrase_cpc',
            'Exact Cost Per Click': 'exact_cpc',
            'Broad Monthly Clicks': 'broad_monthly_clicks',
            'Phrase Monthly Clicks': 'phrase_monthly_clicks',
            'Exact Monthly Clicks': 'exact_monthly_clicks',
            'Broad Monthly Cost': 'broad_monthly_cost',
            'Phrase Monthly Cost': 'phrase_monthly_cost',
            'Exact Monthly Cost': 'exact_monthly_cost',
            'Ads': 'ads_count',
            'Number of Ranking Homepages': 'ranking_homepages',
            'SERP Features CSV': 'serp_features',
            'SERP First Result': 'serp_first_result',
            'Is Question?': 'is_question',
            'Is Not Safe For Work?': 'is_nsfw',
            'Current SERP (1)': 'serp_current',
            'Previous SERP (2)': 'serp_prev',
            'Past SERP (3)': 'serp_past_3',
            'Past SERP (4)': 'serp_past_4',
            'Past SERP (5)': 'serp_past_5',
            'Past SERP (6)': 'serp_past_6',
        }
    },

    # --- 16. SERP HISTORY (FULLY ALIGNED WITH SUPABASE DDL) ---
    'serp_history': {
        'name': 'serp_history',
        'primary_key': ['date', 'keyword'],
        'columns': [
            {'name': 'date', 'type': 'date', 'required': True},
            {'name': 'keyword', 'type': 'string', 'required': True},
            {'name': 'our_position', 'type': 'string', 'required': True},
            {'name': 'top1_domain', 'type': 'string', 'required': False},
            {'name': 'top2_domain', 'type': 'string', 'required': False},
            {'name': 'top3_domain', 'type': 'string', 'required': False},
            {'name': 'zero_click', 'type': 'string', 'required': False},
            {'name': 'zero_click_owner', 'type': 'string', 'required': False},
            {'name': 'notes', 'type': 'string', 'required': False},
        ],
        'column_map': {
            # Core fields
            'date': 'date', 'Date': 'date',
            'keyword': 'keyword', 'Keyword': 'keyword', 'Search Term': 'keyword',
            'our_position': 'our_position', 'Our Position': 'our_position',
            'Position': 'our_position', 'our position': 'our_position', 'Rank': 'our_position',

            # Competitor domains
            'top1_domain': 'top1_domain', 'Top 1 Domain': 'top1_domain', 'top 1 domain': 'top1_domain',
            'Top1': 'top1_domain', '#1': 'top1_domain', '#1 Domain': 'top1_domain',
            'top2_domain': 'top2_domain', 'Top 2 Domain': 'top2_domain', 'top 2 domain': 'top2_domain',
            'Top2': 'top2_domain', '#2': 'top2_domain',
            'top3_domain': 'top3_domain', 'Top 3 Domain': 'top3_domain', 'top 3 domain': 'top3_domain',
            'Top3': 'top3_domain', '#3': 'top3_domain',

            # Zero-click fields
            'zero_click': 'zero_click', 'Zero Click': 'zero_click', 'Featured Snippet': 'zero_click',
            'zero click type': 'zero_click',
            'zero_click_owner': 'zero_click_owner', 'Zero Click Owner': 'zero_click_owner',
            'Snippet Owner': 'zero_click_owner', 'Claimed By': 'zero_click_owner',

            # Notes
            'notes': 'notes', 'Notes': 'notes', 'Note': 'notes',
        }
    },
}

# =============================================================================
# SCHEMA DETECTION
# =============================================================================

def detect_schema(df: pd.DataFrame, filename: str = '') -> str:
    cols = [str(c).lower().strip() for c in df.columns]
    fname = filename.lower()

    # Filename overrides
    if 'ranking_history' in fname: return 'spyfu_ranking_history'
    if 'seo_keywords' in fname: return 'spyfu_seo_keywords'
    if 'backlink' in fname: return 'spyfu_backlinks'
    if 'competitor' in fname: return 'spyfu_competitors'
    if 'ppc' in fname and 'kombat' in fname: return 'spyfu_ppc_kombat'
    if 'kombat' in fname: return 'spyfu_seo_kombat'
    if 'toppages' in fname or 'top_pages' in fname: return 'seo_top_pages'
    if 'serp' in fname or 'serp_history' in fname: return 'serp_history'

    # Content-based detection
    if any(x in cols for x in ['vin', 'vin-row', 'vehicle identification number']): return 'inventory_vehicle'
    if 'dealership name' in cols and 'units sold' in cols: return 'market_insights'
    if 'campaign_id' in cols: return 'ads_daily'
    if 'search term' in cols and ('added/excluded' in cols or 'match type' in cols): return 'google_search_terms'
    if 'device' in cols and 'network' in cols: return 'campaign_summary'
    if 'radius_band' in cols or ('zip' in cols and 'distance (mi)' in cols): return 'geo_sales'
    if 'term' in cols and 'monthlysearches' in cols: return 'spyfu_overview'

    # SERP History specific
    if ('date' in cols and 'keyword' in cols and 'our_position' in cols and
        any(t in cols for t in ['top1_domain', 'top 1 domain', 'top1', '#1'])):
        return 'serp_history'

    return 'unknown'

# =============================================================================
# DERIVED METRICS & LINEAGE
# =============================================================================

def add_derived_metrics(df: pd.DataFrame, schema_name: str) -> pd.DataFrame:
    df = df.copy()

    if schema_name == 'inventory_vehicle':
        combined_cols = [c for c in df.columns if 'make_model_combined' in str(c).lower()]
        if combined_cols:
            combined_col = combined_cols[0]
            def parse_vehicle(val):
                if is_null(val): return None, None, None
                val = str(val).strip()
                year_match = re.search(r'\b(20\d{2})\b', val)
                year = int(year_match.group(1)) if year_match else None
                val = re.sub(r'\b20\d{2}\b', '', val).strip()
                val = re.sub(r'^(New|Used|Certified|CPO)\s+', '', val, flags=re.IGNORECASE).strip()
                parts = val.split(' ', 1)
                make = parts[0] if parts else None
                model = parts[1] if len(parts) > 1 else None
                return year, make, model

            if 'year' not in df.columns or df['year'].isnull().all():
                parsed = df[combined_col].apply(parse_vehicle)
                df['year'] = parsed.apply(lambda x: x[0])
                df['make'] = parsed.apply(lambda x: x[1])
                df['model'] = parsed.apply(lambda x: x[2])

        if 'image_url' in df.columns:
            df['image_url'] = df['image_url'].astype(str).apply(
                lambda x: x.split(',')[0].strip().strip('"') if ',' in x else x
            )

    return df

def add_lineage(df: pd.DataFrame, source_file: str) -> pd.DataFrame:
    df = df.copy()
    df['_source_file'] = source_file
    df['_ingested_at'] = datetime.utcnow().isoformat()
    return df

# =============================================================================
# MAIN NORMALIZATION FUNCTION
# =============================================================================

def normalize_csv(df: pd.DataFrame, schema: Dict[str, Any], source_file: str, add_derived: bool = True) -> pd.DataFrame:
    df = df.copy()

    # Skip header rows if specified
    skip_rows = schema.get('skip_header_rows', 0)
    if skip_rows > 0:
        df = df.iloc[skip_rows:].reset_index(drop=True)
    elif len(df) > 0 and len(df.columns) > 0:
        first_cell = str(df.iloc[0, 0])
        if "report" in first_cell.lower() or "generated" in first_cell.lower():
            df = df.iloc[2:].reset_index(drop=True)

    # Column renaming
    column_map = schema.get('column_map', {})
    df_cols_lower = {c.lower().strip(): c for c in df.columns}
    actual_map = {df_cols_lower.get(k.lower().strip()): v for k, v in column_map.items() if k.lower().strip() in df_cols_lower}
    df = df.rename(columns=actual_map)

    # Type conversion
    for col_def in schema['columns']:
        col_name = col_def['name']
        if col_name not in df.columns:
            continue
        series = df[col_name]
        if isinstance(series, pd.DataFrame):
            series = series.iloc[:, -1]

        if col_def['type'] == 'int':
            df[col_name] = series.apply(normalize_int)
        elif col_def['type'] == 'float':
            df[col_name] = series.apply(normalize_float)
        elif col_def['type'] == 'date':
            df[col_name] = series.apply(normalize_date)
        elif col_def['type'] == 'string':
            if col_name in ['zip', 'zip_code']:
                df[col_name] = series.apply(normalize_zip)
            else:
                df[col_name] = series.apply(normalize_string)

    # Add lineage and derived metrics
    df = add_lineage(df, source_file)
    if add_derived:
        df = add_derived_metrics(df, schema['name'])

    # Strict column filtering
    schema_cols = [c['name'] for c in schema['columns']]
    system_cols = [c for c in df.columns if str(c).startswith('_')]
    keep_cols = list(dict.fromkeys(schema_cols + system_cols))

    return df[[c for c in keep_cols if c in df.columns]]