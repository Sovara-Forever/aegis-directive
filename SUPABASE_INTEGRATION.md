# Supabase Integration & Validation Guide
**Aegis Directive Dashboard**  
**Version**: 1.0  
**Last Updated**: January 21, 2026

---

## Current Status

✅ **Supabase Connected**: Backend infrastructure is live  
✅ **KV Store Available**: `kv_store_5d792c3b` table operational  
✅ **Edge Functions**: Hono server running at `/make-server-5d792c3b/*`  
⚠️ **Data Layer**: Needs implementation (see recommendations below)

---

## Database Schema Design

### Existing Table: `serp_history`

**Status**: ✅ **PRODUCTION READY** (DDL matches aegis_schema.py v8.0)

```sql
CREATE TABLE serp_history (
  date DATE NOT NULL,
  keyword TEXT NOT NULL,
  our_position TEXT NOT NULL,
  top1_domain TEXT,
  top2_domain TEXT,
  top3_domain TEXT,
  zero_click TEXT,
  zero_click_owner TEXT,
  notes TEXT,
  PRIMARY KEY (date, keyword)
);

-- Performance indexes
CREATE INDEX idx_serp_date ON serp_history(date DESC);
CREATE INDEX idx_serp_keyword ON serp_history(keyword);
CREATE INDEX idx_serp_position ON serp_history(our_position);
CREATE INDEX idx_serp_top_domains ON serp_history(top1_domain, top2_domain, top3_domain);
```

### Proposed Tables (Phase 2)

Based on aegis_schema.py's 15 schemas, recommend creating these additional tables:

#### 1. `inventory_vehicle` (High Priority)
```sql
CREATE TABLE inventory_vehicle (
  vin TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  make TEXT,
  model TEXT NOT NULL,
  trim TEXT,
  stock_number TEXT,
  price NUMERIC,
  msrp NUMERIC,
  savings NUMERIC,
  mileage INTEGER,
  exterior_color TEXT,
  interior_color TEXT,
  transmission TEXT,
  drivetrain TEXT,
  engine TEXT,
  status TEXT,
  dealer TEXT,
  url TEXT,
  image_url TEXT,
  _source_file TEXT,
  _ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_dealer ON inventory_vehicle(dealer);
CREATE INDEX idx_inventory_year_make_model ON inventory_vehicle(year, make, model);
CREATE INDEX idx_inventory_status ON inventory_vehicle(status);
```

#### 2. `spyfu_competitors` (High Priority)
```sql
CREATE TABLE spyfu_competitors (
  domain_name TEXT PRIMARY KEY,
  overlap NUMERIC,
  common_keywords INTEGER,
  monthly_clicks INTEGER,
  monthly_value NUMERIC,
  _source_file TEXT,
  _ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_competitors_overlap ON spyfu_competitors(overlap DESC);
```

#### 3. `ads_daily` (Medium Priority)
```sql
CREATE TABLE ads_daily (
  date DATE NOT NULL,
  campaign_id INTEGER NOT NULL,
  impressions INTEGER NOT NULL,
  clicks INTEGER NOT NULL,
  cost NUMERIC NOT NULL,
  _source_file TEXT,
  _ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (date, campaign_id)
);

CREATE INDEX idx_ads_date ON ads_daily(date DESC);
CREATE INDEX idx_ads_campaign ON ads_daily(campaign_id);
```

#### 4. `market_insights` (Medium Priority)
```sql
CREATE TABLE market_insights (
  dealership_name TEXT NOT NULL,
  month TEXT NOT NULL,
  brand TEXT NOT NULL,
  model_name TEXT NOT NULL,
  units_sold INTEGER NOT NULL,
  distance_miles NUMERIC NOT NULL,
  _source_file TEXT,
  _ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (dealership_name, month, brand, model_name)
);

CREATE INDEX idx_market_month ON market_insights(month);
CREATE INDEX idx_market_brand ON market_insights(brand);
```

**Note**: The remaining 11 schemas can be added incrementally based on data availability.

---

## Views (Production Ready)

### v_serp_latest_rankings
```sql
CREATE VIEW v_serp_latest_rankings AS
SELECT * 
FROM serp_history
WHERE date = (SELECT MAX(date) FROM serp_history);
```

### v_serp_top3_count
```sql
CREATE VIEW v_serp_top3_count AS
SELECT 
  date,
  COUNT(*) FILTER (WHERE our_position IN ('1', '2', '3')) AS top3_count,
  COUNT(*) FILTER (WHERE our_position::int <= 10) AS page1_count,
  COUNT(*) FILTER (WHERE our_position = 'Not in top 20') AS unranked_count,
  COUNT(*) AS total_keywords
FROM serp_history
GROUP BY date
ORDER BY date DESC;
```

### v_serp_competitor_dominance
```sql
CREATE VIEW v_serp_competitor_dominance AS
SELECT 
  domain,
  COUNT(*) AS appearances_in_top3,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM v_serp_latest_rankings), 2) AS market_share_pct
FROM (
  SELECT top1_domain AS domain FROM v_serp_latest_rankings WHERE top1_domain IS NOT NULL
  UNION ALL
  SELECT top2_domain FROM v_serp_latest_rankings WHERE top2_domain IS NOT NULL
  UNION ALL
  SELECT top3_domain FROM v_serp_latest_rankings WHERE top3_domain IS NOT NULL
) AS top_domains
GROUP BY domain
ORDER BY appearances_in_top3 DESC
LIMIT 20;
```

### v_serp_rank_distribution
```sql
CREATE VIEW v_serp_rank_distribution AS
SELECT 
  date,
  COUNT(*) FILTER (WHERE our_position IN ('1', '2', '3')) AS top3,
  COUNT(*) FILTER (WHERE our_position::int BETWEEN 4 AND 10) AS pos_4_10,
  COUNT(*) FILTER (WHERE our_position::int BETWEEN 11 AND 20) AS pos_11_20,
  COUNT(*) FILTER (WHERE our_position = 'Not in top 20') AS unranked
FROM serp_history
WHERE date >= CURRENT_DATE - 90
  AND our_position ~ '^[0-9]+$|^Not in top 20$'
GROUP BY date
ORDER BY date DESC;
```

### v_serp_zero_click_analysis
```sql
CREATE VIEW v_serp_zero_click_analysis AS
SELECT 
  zero_click_owner,
  zero_click AS type,
  COUNT(*) AS zero_click_count,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM v_serp_latest_rankings WHERE zero_click IS NOT NULL), 0), 2) AS pct_of_zero_clicks
FROM v_serp_latest_rankings
WHERE zero_click IS NOT NULL
GROUP BY zero_click_owner, zero_click
ORDER BY zero_click_count DESC;
```

---

## KV Store Structure

### Current Implementation
Using the pre-existing `kv_store_5d792c3b` table with `key TEXT PRIMARY KEY, value JSONB`.

### Recommended Key Naming Convention

#### KPI Metrics (Auto-Updated by Pipeline)
```
kpi:serp:top3_count          → 87
kpi:serp:page1_count         → 142
kpi:serp:unranked_count      → 23
kpi:serp:zero_click_pct      → 34.5
kpi:serp:avg_position        → 5.2
kpi:serp:total_keywords      → 250

kpi:inventory:total_units    → 342
kpi:inventory:avg_days_lot   → 28
kpi:inventory:avg_price      → 42350

kpi:competitor:top_domain    → "example.com"
kpi:competitor:market_share  → 18.3
```

#### Refresh Timestamps
```
refresh:serp:last_run        → "2026-01-21T14:30:00Z"
refresh:inventory:last_run   → "2026-01-21T08:00:00Z"
refresh:ads:last_run         → "2026-01-20T23:00:00Z"

dealer:midstate:last_checked → "2026-01-21T14:30:00Z"
dealer:competitor1:last_checked → "2026-01-21T12:00:00Z"
```

#### ROI Calculator Defaults
```
roi:defaults → {
  "traffic_value_per_visit": 12.50,
  "conversion_rate": 0.025,
  "avg_vehicle_profit": 2800,
  "cost_per_click": 3.20,
  "avg_close_rate": 0.18
}
```

#### Feature Flags & Config
```
config:dashboard:refresh_interval → 21600  (6 hours in seconds)
config:alerts:rank_drop_threshold → 5
config:alerts:enabled             → true

feature:realtime_updates          → false
feature:multi_location            → false
```

---

## Edge Function Routes (To Implement)

### Current Status
✅ **Health Check**: `GET /make-server-5d792c3b/health`  
⚠️ **Data Routes**: Need implementation

### Recommended Endpoints

See full TypeScript examples in the main SUPABASE_INTEGRATION.md file.

Key endpoints to implement:
1. `GET /make-server-5d792c3b/kpis` - Aggregated KPI metrics
2. `GET /make-server-5d792c3b/ranking-changes?days=7` - Top rank movers
3. `GET /make-server-5d792c3b/competitor-dominance` - Competitor analysis
4. `POST /make-server-5d792c3b/refresh-trigger` - Webhook for Make.com
5. `POST /make-server-5d792c3b/update-kpis` - Batch KPI updates

---

## Testing Checklist

### Phase 1: Core Validation
- [ ] Verify `serp_history` table exists with correct schema
- [ ] Test all 5 views return data without errors
- [ ] Confirm KV store accepts and retrieves values
- [ ] Test edge function health check endpoint
- [ ] Upload sample SERP data via supabase_serp_uploader.py
- [ ] Verify data appears in views and KV store

### Phase 2: Frontend Integration
- [ ] Test KPI fetch in Executive Overview component
- [ ] Implement data freshness badge
- [ ] Test competitor data fetch in Competitor Insights
- [ ] Add loading states and error handling
- [ ] Test refresh intervals (6 hours recommended)

### Phase 3: Edge Functions
- [ ] Implement `/kpis` endpoint
- [ ] Implement `/ranking-changes` endpoint
- [ ] Implement `/competitor-dominance` endpoint
- [ ] Add authentication/API key validation
- [ ] Test CORS configuration
- [ ] Add error logging

### Phase 4: Automation
- [ ] Set up Make.com scenario for daily SERP refresh
- [ ] Configure webhook to `/refresh-trigger`
- [ ] Test KPI auto-update trigger function
- [ ] Schedule weekly report generation

---

## Next Steps (Priority Order)

### Immediate (Week 1)
1. ✅ **Validate serp_history table** - Ensure DDL matches schema
2. ✅ **Create all 5 views** - Deploy SQL to Supabase
3. ⚠️ **Test data upload** - Run supabase_serp_uploader.py with sample data
4. ⚠️ **Implement `/kpis` endpoint** - Add to server/index.tsx
5. ⚠️ **Connect Executive Overview** - Fetch live KPIs in dashboard

### Short-Term (Week 2-3)
6. Create `inventory_vehicle` table
7. Implement `/ranking-changes` endpoint
8. Add data freshness badge to all pages
9. Set up Make.com daily refresh scenario
10. Deploy KPI auto-update trigger function

### Mid-Term (Month 1-2)
11. Create remaining high-priority tables (competitors, ads_daily)
12. Implement real-time rank change alerts (Supabase Realtime)
13. Build Metabase dashboards with SQL cards
14. Add authentication/API key middleware to edge functions
15. Expand to 5+ competitor dealers

### Long-Term (Month 3+)
16. Migrate all 15 schemas from aegis_schema.py
17. Implement multi-location support
18. Build ROI calculator with live Supabase data
19. Add ML-based predictions for rank changes
20. White-label version for other dealerships

---

**Full documentation with code examples**: See SUPABASE_INTEGRATION.md in repo root

**GitHub Repo**: https://github.com/Sovara-Forever/aegis-directive  
**Notion Docs**: https://www.notion.so/2efa99eec1a881d0b5c4f380bc98ac44

**Last Updated**: January 21, 2026  
**Maintained By**: AegisDirective / Sean