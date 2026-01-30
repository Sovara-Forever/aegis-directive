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

#### 1. KPIs Endpoint
```typescript
// GET /make-server-5d792c3b/kpis
app.get('/make-server-5d792c3b/kpis', async (c) => {
  const keys = [
    'kpi:serp:top3_count',
    'kpi:serp:page1_count',
    'kpi:serp:unranked_count',
    'kpi:serp:zero_click_pct',
    'kpi:serp:avg_position',
    'kpi:serp:total_keywords'
  ];
  
  const values = await kv.mget(keys);
  
  return c.json({
    serp: {
      top3_count: parseInt(values[0]?.value || '0'),
      page1_count: parseInt(values[1]?.value || '0'),
      unranked_count: parseInt(values[2]?.value || '0'),
      zero_click_pct: parseFloat(values[3]?.value || '0'),
      avg_position: parseFloat(values[4]?.value || '0'),
      total_keywords: parseInt(values[5]?.value || '0')
    }
  });
});
```

#### 2. Ranking Changes Endpoint
```typescript
// GET /make-server-5d792c3b/ranking-changes?days=7
app.get('/make-server-5d792c3b/ranking-changes', async (c) => {
  const days = parseInt(c.req.query('days') || '7');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data, error } = await supabase.rpc('get_ranking_changes', { 
    days_back: days 
  });
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(data);
});
```

#### 3. Competitor Dominance Endpoint
```typescript
// GET /make-server-5d792c3b/competitor-dominance
app.get('/make-server-5d792c3b/competitor-dominance', async (c) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data, error } = await supabase
    .from('v_serp_competitor_dominance')
    .select('*')
    .limit(20);
  
  if (error) {
    return c.json({ error: error.message }, 500);
  }
  
  return c.json(data);
});
```

#### 4. Refresh Trigger (Webhook for Make.com)
```typescript
// POST /make-server-5d792c3b/refresh-trigger
app.post('/make-server-5d792c3b/refresh-trigger', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  
  // Validate webhook secret
  if (apiKey !== Deno.env.get('WEBHOOK_SECRET')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  const { data_source } = body;
  
  // Update last refresh timestamp
  await kv.set(`refresh:${data_source}:last_run`, new Date().toISOString());
  
  return c.json({ 
    status: 'success', 
    message: `Refresh triggered for ${data_source}`,
    timestamp: new Date().toISOString()
  });
});
```

#### 5. Update KPIs Endpoint (Called by Pipeline)
```typescript
// POST /make-server-5d792c3b/update-kpis
app.post('/make-server-5d792c3b/update-kpis', async (c) => {
  const apiKey = c.req.header('X-API-Key');
  
  if (apiKey !== Deno.env.get('WEBHOOK_SECRET')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  const body = await c.req.json();
  const { category, metrics } = body;
  
  // Batch update KPIs
  const updates = Object.entries(metrics).map(([key, value]) => ({
    key: `kpi:${category}:${key}`,
    value: String(value)
  }));
  
  await kv.mset(updates);
  
  return c.json({ 
    status: 'success', 
    updated: updates.length 
  });
});
```

---

## Frontend Integration Examples

### 1. Fetch KPIs in Executive Overview

```typescript
// src/app/components/executive-overview.tsx
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export function ExecutiveOverview() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        // Option 1: Fetch from edge function
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-5d792c3b/kpis`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          }
        );
        const data = await response.json();
        setKpis(data.serp);
        
        // Option 2: Direct KV store access
        // const { data: kvData } = await supabase
        //   .from('kv_store_5d792c3b')
        //   .select('key, value')
        //   .in('key', ['kpi:serp:top3_count', 'kpi:serp:page1_count']);
        
      } catch (error) {
        console.error('Error fetching KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
    
    // Refresh every 6 hours
    const interval = setInterval(fetchKPIs, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <KPICard
        title="Top 3 Rankings"
        value={kpis?.top3_count || 0}
        trend="+12%"
        icon={<TrendingUp />}
      />
      <KPICard
        title="Page 1 Rankings"
        value={kpis?.page1_count || 0}
        trend="+8%"
        icon={<Target />}
      />
      <KPICard
        title="Unranked Keywords"
        value={kpis?.unranked_count || 0}
        trend="-3%"
        icon={<AlertTriangle />}
      />
    </div>
  );
}
```

### 2. Real-Time Data Freshness Badge

```typescript
// src/app/components/data-freshness-badge.tsx
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function DataFreshnessBadge() {
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [status, setStatus] = useState<'fresh' | 'stale' | 'unknown'>('unknown');

  useEffect(() => {
    const checkFreshness = async () => {
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );
      
      const { data } = await supabase
        .from('kv_store_5d792c3b')
        .select('value')
        .eq('key', 'refresh:serp:last_run')
        .single();

      if (data?.value) {
        const refreshTime = new Date(data.value);
        setLastRefresh(refreshTime);
        
        const hoursSince = (Date.now() - refreshTime.getTime()) / (1000 * 60 * 60);
        setStatus(hoursSince < 24 ? 'fresh' : 'stale');
      }
    };

    checkFreshness();
    const interval = setInterval(checkFreshness, 5 * 60 * 1000); // Check every 5 min
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    fresh: { icon: CheckCircle, color: '#10B981', text: 'Data Fresh' },
    stale: { icon: AlertCircle, color: '#F59E0B', text: 'Data Stale' },
    unknown: { icon: Clock, color: '#64748B', text: 'Checking...' }
  };

  const { icon: Icon, color, text } = statusConfig[status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color }}>
      <Icon size={16} />
      <span style={{ fontSize: '14px' }}>
        {text}
        {lastRefresh && ` (${lastRefresh.toLocaleString()})`}
      </span>
    </div>
  );
}
```

### 3. Query SERP History Directly

```typescript
// src/app/components/competitor-insights.tsx
const fetchCompetitorData = async () => {
  const supabase = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey
  );

  // Get latest rankings
  const { data: latest } = await supabase
    .from('v_serp_latest_rankings')
    .select('*')
    .order('our_position', { ascending: true })
    .limit(50);

  // Get competitor dominance
  const { data: competitors } = await supabase
    .from('v_serp_competitor_dominance')
    .select('*');

  setCompetitorData({ latest, competitors });
};
```

---

## Database Functions (Custom SQL)

### get_ranking_changes (RPC Function)
```sql
CREATE OR REPLACE FUNCTION get_ranking_changes(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  keyword TEXT,
  current_rank TEXT,
  previous_rank TEXT,
  rank_change INTEGER,
  top1_domain TEXT,
  zero_click TEXT
) AS $$
WITH recent AS (
  SELECT DISTINCT date 
  FROM serp_history 
  ORDER BY date DESC 
  LIMIT days_back
),
latest AS (
  SELECT * 
  FROM serp_history 
  WHERE date = (SELECT MAX(date) FROM recent)
),
previous AS (
  SELECT * 
  FROM serp_history 
  WHERE date = (SELECT MIN(date) FROM recent)
)
SELECT 
  l.keyword,
  l.our_position AS current_rank,
  p.our_position AS previous_rank,
  CASE 
    WHEN p.our_position ~ '^[0-9]+$' AND l.our_position ~ '^[0-9]+$' 
    THEN p.our_position::int - l.our_position::int
    ELSE NULL
  END AS rank_change,
  l.top1_domain,
  l.zero_click
FROM latest l
LEFT JOIN previous p ON l.keyword = p.keyword
WHERE l.our_position ~ '^[0-9]+$' AND p.our_position ~ '^[0-9]+$'
ORDER BY ABS(COALESCE(p.our_position::int - l.our_position::int, 0)) DESC
LIMIT 20;
$$ LANGUAGE SQL STABLE;
```

### update_kpi_store (Trigger Function)
```sql
-- Auto-update KV store when serp_history is updated
CREATE OR REPLACE FUNCTION update_kpi_store_on_serp_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run on the latest date
  IF NEW.date = (SELECT MAX(date) FROM serp_history) THEN
    -- Update top3_count
    INSERT INTO kv_store_5d792c3b (key, value)
    SELECT 
      'kpi:serp:top3_count',
      COUNT(*) FILTER (WHERE our_position IN ('1', '2', '3'))::TEXT
    FROM serp_history
    WHERE date = NEW.date
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    -- Update page1_count
    INSERT INTO kv_store_5d792c3b (key, value)
    SELECT 
      'kpi:serp:page1_count',
      COUNT(*) FILTER (WHERE our_position::int <= 10)::TEXT
    FROM serp_history
    WHERE date = NEW.date AND our_position ~ '^[0-9]+$'
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    -- Update unranked_count
    INSERT INTO kv_store_5d792c3b (key, value)
    SELECT 
      'kpi:serp:unranked_count',
      COUNT(*) FILTER (WHERE our_position = 'Not in top 20')::TEXT
    FROM serp_history
    WHERE date = NEW.date
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    
    -- Update zero_click_pct
    INSERT INTO kv_store_5d792c3b (key, value)
    SELECT 
      'kpi:serp:zero_click_pct',
      ROUND(COUNT(*) FILTER (WHERE zero_click IS NOT NULL) * 100.0 / COUNT(*), 2)::TEXT
    FROM serp_history
    WHERE date = NEW.date
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_kpi_store
AFTER INSERT OR UPDATE ON serp_history
FOR EACH ROW
EXECUTE FUNCTION update_kpi_store_on_serp_insert();
```

---

## Data Pipeline Integration

### Current Flow (Python → Supabase)

```python
# supabase_serp_uploader.py (already exists in your pipeline)
import pandas as pd
from supabase import create_client, Client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

# Read normalized CSV
df = pd.read_csv('normalized_output/serp_history.csv')

# Batch upsert (using composite PK: date + keyword)
records = df.to_dict('records')
supabase.table('serp_history').upsert(records).execute()

print(f"✅ Uploaded {len(records)} SERP records")
```

### Recommended: Add KPI Update Step

```python
# After uploading to serp_history, update KV store
from datetime import date

latest_date = df['date'].max()
latest_data = df[df['date'] == latest_date]

# Calculate KPIs
top3_count = len(latest_data[latest_data['our_position'].isin(['1', '2', '3'])])
page1_count = len(latest_data[latest_data['our_position'].astype(str).str.isdigit() & 
                               (latest_data['our_position'].astype(int) <= 10)])
unranked_count = len(latest_data[latest_data['our_position'] == 'Not in top 20'])
zero_click_pct = round((latest_data['zero_click'].notna().sum() / len(latest_data)) * 100, 2)

# Update KV store
kpis = {
    'kpi:serp:top3_count': str(top3_count),
    'kpi:serp:page1_count': str(page1_count),
    'kpi:serp:unranked_count': str(unranked_count),
    'kpi:serp:zero_click_pct': str(zero_click_pct),
    'refresh:serp:last_run': date.today().isoformat()
}

for key, value in kpis.items():
    supabase.table('kv_store_5d792c3b').upsert({
        'key': key, 
        'value': value
    }).execute()

print(f"✅ Updated {len(kpis)} KPIs in KV store")
```

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

## Environment Variables Required

### Supabase (Already Configured)
```
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

### New (For Webhooks)
```
WEBHOOK_SECRET=<generate-strong-secret>
```

### Make.com Integration
```
MAKE_WEBHOOK_URL=https://hook.us1.make.com/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

---

## Performance Optimization

### Index Strategy
- **serp_history**: 4 indexes already defined (date, keyword, position, top_domains)
- **Composite Index**: Consider adding `(date DESC, our_position)` for trend queries

### Query Optimization
- **Materialized Views**: For expensive aggregations (refresh daily)
- **Partitioning**: Consider monthly partitioning if serp_history exceeds 1M rows
- **Connection Pooling**: Use Supabase Pooler for high-traffic scenarios

### Caching Strategy
- **KV Store**: Acts as cache for expensive calculations
- **Frontend**: React Query with 6-hour stale time
- **CDN**: Cache static dashboard assets

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

## Support & Documentation

- **GitHub Repo**: https://github.com/Sovara-Forever/aegis-directive
- **Notion Docs**: https://www.notion.so/2efa99eec1a881d0b5c4f380bc98ac44
- **Supabase Dashboard**: *(project-specific URL)*
- **Figma Dashboard**: *(deployed URL)*

---

**Last Updated**: January 21, 2026  
**Maintained By**: AegisDirective / Sean
