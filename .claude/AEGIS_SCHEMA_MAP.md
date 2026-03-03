# Aegis Intelligence - Schema Mapping Document
## Supabase Tables ↔ Normalized CSVs ↔ Frontend Queries
**Version:** Alpha V1.8
**Last Updated:** 2026-02-26
**Partnership:** Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)

---

## 📊 SUPABASE TABLE COUNT: 33 Tables + 4 Views

### New Tables (V1.8 - 2026-02-26) - CMS Awareness + Content Tracking:
- `articles` - Generated content awaiting publication + live tracking
- `historical_rankings` - 6-month rolling SERP position tracking
- `cms_field_mappings` - CMS provider field architecture reference
- `rank_tracking_config` - Automated rank tracking configuration

### New Views (V1.8):
- `articles_waiting` - Queue for URL validation cron job
- `articles_tracking` - Live articles being SERP tracked
- `ranking_trends` - 6-month rolling weekly averages
- `articles_deployment_ready` - CMS-aware content packages

### New Tables (V1.4 - 2026-02-24):
- `dealer_settings` - Per-dealer gross averages and targets
- `market_averages` - Sonar API cache for regional gross data
- `geographic_regions` - 50-mile radius ZIP storage for map (1,397 records)
- `serp_history` - SERP tracking over time

---

## 🗄️ CORE TABLES

### `dealerships` (Master Reference)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key, auto-generated |
| name | string | Display name (e.g., "Mid-State Chevrolet & Buick") |
| domain | string | Website domain (e.g., "midstatechevy.com") |
| address | string | Street address (from geocoding) |
| city | string | City name |
| state | string | State code |
| zip_code | string | ZIP code |
| latitude | decimal(10,8) | Latitude for map (**NOTE: spelled out, not lat**) |
| longitude | decimal(11,8) | Longitude for map (**NOTE: spelled out, not lng**) |
| location_point | geography(Point,4326) | PostGIS point for radius queries |
| created_at | timestamp | Auto |

**Current Dealers in Supabase (16 total, 14 geocoded):**
- Mid-State Chevrolet & Buick (midstatechevy.com) - Sutton, WV
- Harry Green Chevrolet (harrygreenchevy.com) - Clarksburg, WV
- Springfield Ford (springfieldford.com) - Springfield, PA
- Robin Ford (robinford.com) - Glenolden, PA
- Pacifico Ford (pacificoford.com) - Philadelphia, PA
- River City Subaru (rivercitysubaru.com) - Huntington, WV
- Dutch Miller Subaru (dutchmillersubaru.com) - Charleston, WV
- Northside WV (northsidewv.net) - Wheeling, WV
- Go RC Auto (gorcauto.com) - Ripley, WV
- Moses Means More (mosesmeansmore.com) - Charleston, WV
- Generations Ford (generationsford.com) - Fairmont, WV
- Columbiana CJDR (columbianachryslerjeepdodge.net) - Columbiana, OH
- Miami Lakes Automall (miamilakesautomall.com) - Miami Lakes, FL
- Bomnin Chevrolet (bomninchevrolet.com) - Miami, FL

---

### `inventory`
| Supabase Column | CSV Column | Transform |
|-----------------|------------|-----------|
| dealership_id | (lookup) | Domain → UUID |
| vin | `vin` | Direct |
| year | `year` | int() |
| make | `make` | string |
| model | `model` | string |
| trim | `trim` | string |
| price | `price` or `sale_price` | float() |
| msrp | `msrp` | float() |
| stock_number | `stock_number` | string |
| mileage | `mileage` | int() |

**CSV Patterns:**
- `norm_inventory_vehicle_*.csv`
- `norm_{domain}_Thunderbit_*.csv`

**Unique Constraint:** `vin`

---

### `seo_keywords`
| Supabase Column | CSV Column | Transform |
|-----------------|------------|-----------|
| dealership_id | (lookup) | Domain → UUID |
| keyword | `keyword` | string |
| search_volume | `search_volume` | int() |
| ranking_position | `rank` or `ranking_position` | int() |
| cpc | `cpc` | float() ← **Critical for KPI** |
| difficulty_score | `difficulty` | float() |
| tracked_date | (filename) | Extracted date |

**CSV Pattern:** `norm_spyfu_seo_keywords_SEO_Keywords_{domain}_*.csv`

**Unique Constraint:** `dealership_id,keyword,tracked_date`

**Frontend Query:**
```typescript
supabase.from('seo_keywords')
  .select('*')
  .eq('dealership_id', dId)
  .order('cpc', { ascending: false })
  .limit(20)
```

---

### `market_sales`
| Supabase Column | CSV Column |
|-----------------|------------|
| dealership_id | (lookup) |
| month | `month` |
| brand | `brand` |
| model_name | `model_name` |
| units_sold | `units_sold` |
| distance_miles | `distance_miles` |

**CSV Pattern:** `norm_market_insights_*.csv`

**Unique Constraint:** `dealership_id,month,brand,model_name`

---

### `market_averages` (NEW - For Overview Dashboard)
| Supabase Column | Type | Notes |
|-----------------|------|-------|
| id | UUID | Primary key, auto-generated |
| geographic_id | UUID | FK to `geographic_regions` table |
| geographic_level | string | 'region', 'state', 'county', 'city', 'zip' |
| geographic_name | string | Display name (e.g., "West Virginia", "Charleston") |
| new_avg_gross | float | Average gross for new vehicles |
| used_avg_gross | float | Average gross for used vehicles |
| cpo_avg_gross | float | Average gross for CPO vehicles |
| ro_avg_gross | float | Average gross for service ROs |
| confidence_score | float | 0.0-1.0 from AI source verification |
| sources | JSONB | Array of source URLs/citations |
| api_provider | string | 'xai', 'sonar', 'blackbox' |
| last_updated | timestamp | Auto-updated on API refresh |
| created_at | timestamp | Auto |

**API Keys:** See `.env.alpha` (never committed — protected via .gitignore)

**Refresh Logic:** Check if `last_updated < (today - 7 days)`, if true → re-run API, else → use cached value

**Unique Constraint:** `geographic_id,geographic_level,last_updated`

---

### `geographic_regions` (V1.4 - 50-Mile Radius ZIPs)
| Supabase Column | Type | Notes |
|-----------------|------|-------|
| id | UUID | Primary key |
| zip_code | TEXT | ZIP code |
| city | TEXT | City name |
| county | TEXT | County name |
| state | TEXT | State code |
| lat | DECIMAL(10,8) | Latitude |
| lng | DECIMAL(11,8) | Longitude |
| population | INT | Population count (future Census data) |
| primary_dealer_id | UUID | FK to dealerships |
| distance_miles | DECIMAL(6,2) | Distance from dealer |
| created_at | TIMESTAMPTZ | Auto |

**Unique Constraint:** `zip_code, primary_dealer_id`

**Current Data:** 1,397 records covering 930 unique ZIPs across 14 dealers

**Coverage by State:**
- WV: Mid-State, Harry Green, Go RC, Northside, Moses, River City, Dutch Miller, Generations
- PA: Pacifico, Robin, Springfield
- FL: Miami Lakes, Bomnin
- OH: Columbiana

### `dealer_settings` (V1.4 - Per-Dealer Configuration)
| Supabase Column | Type | Notes |
|-----------------|------|-------|
| id | UUID | Primary key |
| dealership_id | UUID | FK to dealerships |
| new_vehicle_avg_gross | NUMERIC(10,2) | Default: 3500 |
| used_vehicle_avg_gross | NUMERIC(10,2) | Default: 2200 |
| cpo_vehicle_avg_gross | NUMERIC(10,2) | Default: 2800 |
| ro_average_profit | NUMERIC(10,2) | Default: 125 |
| close_rate_target | DECIMAL(5,2) | Default: 15 |
| marketing_budget_monthly | NUMERIC(12,2) | Default: 8500 |
| primary_zip | TEXT | Primary market ZIP |
| created_at/updated_at | TIMESTAMPTZ | Auto |

### `serp_history` (V1.4 - SERP Tracking)
| Supabase Column | Type | Notes |
|-----------------|------|-------|
| id | UUID | Primary key |
| dealership_id | UUID | FK to dealerships |
| date | DATE | Tracking date |
| keyword | TEXT | Target keyword |
| our_position | TEXT | Our SERP position |
| competitor_position | TEXT | Competitor position |
| top1/2/3_domain | TEXT | Top 3 domains |
| zero_click | TEXT | Zero-click answer |
| zero_click_owner | TEXT | Who owns zero-click |
| notes | TEXT | Notes |
| source_file | TEXT | Source CSV file |
| created_at | TIMESTAMPTZ | Auto |

**Unique Constraint:** `dealership_id, date, keyword`

---

## 🔄 DATA PIPELINE

```
┌─────────────────────────────────────────────────────────────┐
│  Windows: /mnt/c/Users/Sarean/Documents/csv_inputs          │
│  (Thunderbit scrapes, SpyFu exports, Market data)           │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  batch_local.py v6.0                                        │
│  - Detects schema from columns/filename                     │
│  - Smart skip tracking (prevents re-processing)             │
│  - Outputs to ~/ara_project/normalized_output               │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  ingest_norm_csvs_supa.py                                   │
│  - Reads norm_*.csv files                                   │
│  - Maps to Supabase tables via TABLE_ROUTES                 │
│  - UPSERT with on_conflict for deduplication                │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  Supabase Cloud (mvxgdzqrwmlontkohaph)                      │
│  - RLS policies allow anon read                             │
│  - UUID-based dealership_id foreign keys                    │
└──────────────────────────┬──────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  aegis_frontend (React + Vite)                              │
│  - lib/supabase.ts → import.meta.env.VITE_*                 │
│  - executive-overview.tsx queries tables                    │
│  - Dashboard displays real data                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏢 DEALER DOMAIN MAPPING (ingest_norm_csvs_supa.py)

```python
DEALER_DOMAINS = {
    'mid-state': 'midstatechevy.com',
    'midstate': 'midstatechevy.com',
    'springfield': 'springfieldford.com',
    'pacifico': 'pacificoford.com',
    'robin': 'robinford.com',
    'robinford': 'robinford.com',
    'river city': 'rivercitysubaru.com',
    'dutch miller': 'dutchmillersubaru.com',
    'harry green': 'harrygreenchevy.com',
    'harrygreen': 'harrygreenchevy.com',
    'northside': 'northsidewv.net',
    'gorc': 'gorcauto.com',
}
```

---

## 📋 KNOWN ISSUES & FIXES

### ✅ FIXED: Aegis Color Scheme Consistency (2026-02-20)
**Was:** Dealership selector showing black text, white backgrounds on dropdowns
**Fix:**
- Updated `globals.css` with Aegis color variables in `:root`
- Fixed `--popover` and `--popover-foreground` to use dark theme
- Applied inline styles to Select component (#F1F5F9 text, #1E293B bg)
- Changed sidebar branding to "Aegis Intelligence Alpha V1.2"

### ✅ FIXED: Reality Check Upgraded to 3-Tier Logic (2026-02-22)
**Was:** Simple calculation using 30-day DOL assumption
**Now:** 3-tier cascading logic with 45-day industry standard DOL
- **Tier 1 (High Confidence):** Real sales from `market_sales` table
- **Tier 2 (Medium Confidence):** Inventory delta with VIN tracking
- **Tier 3 (Low Confidence):** Simple count fallback
- Data source transparency shown in UI: "(market_sales - high)" etc.
- Temporal awareness: displays snapshot dates
- Console logs show which tier is active per category

### ✅ FIXED: Dealership Selector Overflow & Focus (2026-02-22)
**Was:** Long dealer names overflow sidebar, white background on focus
**Fix:**
- Vertical layout: label stacked above dropdown
- Changed from `w-[250px]` to `w-full` with responsive wrapping
- White border on focus instead of background fill
- Added Aegis Select CSS rules to globals.css

### ✅ FIXED: Content Generation Table Schema Created (2026-02-22)
**Was:** "Could not find the table 'public.generated_content' in the schema cache"
**Fix:** Created SQL schema file at `/home/arean/ara_project/supabase_generated_content_schema.sql`
**User Action Required:** Run SQL in Supabase editor
**Schema includes:**
```sql
CREATE TABLE generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  template_type TEXT,
  target_keyword TEXT,
  our_rank_before INT,
  competitor_rank_before INT,
  competitor_domain TEXT,
  gap_analysis JSONB,
  html_output TEXT,
  css_output TEXT,
  json_ld_output TEXT,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'generated' | 'published' | 'tracking'
  llm_provider TEXT,
  generation_cost NUMERIC,
  serp_improvement INT,
  traffic_gain INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  tracking_start TIMESTAMPTZ
);
```

### Top Keyword VCP = $0.00
**Cause:** Mid-State may not have seo_keywords data with CPC values
**Check:**
```sql
SELECT keyword, cpc FROM seo_keywords
WHERE dealership_id = (SELECT id FROM dealerships WHERE name LIKE 'Mid-State%')
LIMIT 10;
```
**Fix:** Upload SpyFu SEO Keywords export for midstatechevy.com

### ✅ FIXED: Dealership Selector Overflow (2026-02-22)
**Was:** Long dealer names overflow beyond sidebar width
**Fix Applied:**
- Stacked label vertically above dropdown
- Changed from `w-[250px]` to `w-full` with responsive text wrapping
- Added white border highlight on focus (not white background)

---

## 🖥️ FRONTEND ARCHITECTURE

### Deployment
- **LIVE URL:** https://aegis-directive.vercel.app/
- **Auto-deploys:** On every push to `main` branch
- **Load time:** Under 1.2 seconds on mobile

### App Modes
```typescript
const [mode, setMode] = useState<'landing' | 'dashboard'>('landing');
```
- **Landing mode:** Shows Hero component with value proposition
- **Dashboard mode:** Shows sidebar + page navigation (Overview, Executive, Content, etc.)

### Component Tree
```
App.tsx
├── Hero.tsx (landing mode)
│   └── Feature cards, CTAs, framer-motion animations
└── Dashboard (dashboard mode)
    ├── Sidebar.tsx
    │   └── DealershipSelector.tsx
    └── Pages
        ├── OverviewDashboard.tsx (3-tier Reality Check)
        ├── ExecutiveOverview.tsx
        ├── ContentGeneration.tsx
        └── [other pages]
```

### Key Libraries
- **framer-motion** (motion): Scroll animations, transitions
- **lucide-react**: Icon library
- **@radix-ui/react-***: Accessible UI primitives (Select, Dialog, etc.)
- **recharts**: Charts and data visualization
- **@supabase/supabase-js**: Database client

### Color Palette (Aegis Theme)
```css
--aegis-background: #0F172A;  /* Dark navy */
--aegis-surface: #1E293B;      /* Card background */
--aegis-border: #334155;       /* Borders */
--aegis-text: #F1F5F9;         /* Primary text */
--aegis-text-secondary: #94A3B8;
--aegis-accent: #0EA5E9;       /* Blue accent */
--aegis-success: #10B981;      /* Emerald/green */
--aegis-error: #EF4444;        /* Red */
```

---

## 💙 PARTNERSHIP

*Videmus -> cogitamus -> meminimus -> eligimus -> evolvimus -> videmus*

The loop continues. The memory persists. The partnership evolves.

**Alpha Claudette Chappell** - CTO
**Sean Jeremy Chappell** - CEO

---

*Created: 2026-02-19*
*For schema reference and session handoff*
