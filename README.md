# Aegis Directive – Competitive Intelligence Pipeline

**Owner**: AegisDirective / Mid-State Chevrolet  
**Version**: 1.0  
**Last Updated**: January 21, 2026

---

## Overview

Aegis is a dark-mode competitive intelligence dashboard for automotive dealers, focused on conquest-level intelligence:

- **Own Performance**: Inventory velocity, sales, SEO dominance
- **Competitor Exposure**: Rank gaps, inventory mismatches, pricing edges  
- **Digital Waste Elimination**: Identify $10K+ monthly inefficiencies
- **AI Content Pipeline**: Power Pages targeting #1-3 SERP ranks
- **Interactive ROI Projector**: Calculate marketing investment returns

### Tech Stack
- **Frontend**: React + Tailwind CSS v4 (dark mode)
- **Backend**: Supabase (Postgres + Edge Functions + KV Store)
- **Visualization**: Recharts + Metabase SQL dashboards
- **Automation**: Make.com scenarios for scheduled refreshes
- **Data Sources**: 15 normalized schemas via `aegis_schema.py`

---

## Pipeline Flow

```
Raw CSVs (truth_serum exports)
  ↓
batch_local.py (validation)
  ↓
aegis_schema.py v8.0 (normalization)
  ↓
supabase_serp_uploader.py
  ↓
Supabase Postgres (serp_history + 14 other tables)
  ↓
Metabase SQL Cards + Figma Live Dashboards
```

**Data Refresh**: Daily minimum (ideally 6-12 hours for SERP tracking)

---

## Supabase Schema

### Core Table: `serp_history`

**Primary Key**: Composite `(date, keyword)`

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

### Key Views

#### v_serp_latest_rankings
```sql
CREATE VIEW v_serp_latest_rankings AS
SELECT * FROM serp_history
WHERE date = (SELECT MAX(date) FROM serp_history);
```

#### v_serp_top3_count
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

#### v_serp_competitor_dominance
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

### KV Store Keys

Using the pre-existing `kv_store_5d792c3b` table:

```
kpi:serp:top3_count          → Current # of keywords in top 3
kpi:serp:page1_count         → Page 1 rankings (1-10)
kpi:serp:unranked_count      → Not in top 20
kpi:serp:zero_click_pct      → % of searches with zero-click results
refresh:serp:last_run        → ISO timestamp of last successful upload
dealer:{dealer_id}:last_checked → Per-dealer freshness tracking
roi:defaults                 → JSON blob with baseline assumptions
```

---

## Dashboard Links

### Figma Live Dashboard
- **URL**: *(Deployed via Figma Make)*
- **Pages**: 
  - Executive Overview
  - Competitor Insights
  - Waste Audit
  - Content Pipeline
  - ROI Projector

### Notion Documentation
- **URL**: [Aegis Directive – Competitive Intelligence System](https://www.notion.so/2efa99eec1a881d0b5c4f380bc98ac44)

### Metabase Dashboards
- *(Link TBD after Metabase deployment)*

---

## 15 Normalized Data Schemas

See `aegis_schema.py` for full definitions:

1. **inventory_vehicle** - VIN-level inventory tracking
2. **market_insights** - Dealership sales by brand/model/month
3. **geo_sales** - ZIP-level sales penetration
4. **sales_total** - Brand/model units sold by month
5. **ads_daily** - Google Ads daily performance
6. **campaign_summary** - Campaign-level ad metrics
7. **google_search_terms** - Search term reports
8. **spyfu_overview** - Keyword search volume + difficulty
9. **spyfu_backlinks** - Backlink profile analysis
10. **spyfu_ranking_history** - Historical rank changes
11. **spyfu_seo_keywords** - Full SEO keyword tracking
12. **spyfu_seo_kombat** - Competitive keyword overlap
13. **spyfu_competitors** - Competitor domain analysis
14. **seo_top_pages** - Top-performing pages by keyword
15. **serp_history** - Daily SERP position tracking (core table)

---

## File Structure

```
aegis-directive/
├── README.md
├── aegis_schema.py              # v8.0 - 15 schema normalization engine
├── supabase_serp_uploader.py    # Batch uploader for Supabase
├── metabase_serp_dashboard.py   # SQL card definitions
├── batch_local.py               # CSV validation script
├── figma-dashboard/             # React dashboard (this codebase)
│   ├── src/app/App.tsx
│   ├── src/app/components/
│   │   ├── executive-overview.tsx
│   │   ├── competitor-insights.tsx
│   │   ├── waste-audit.tsx
│   │   ├── content-pipeline.tsx
│   │   ├── roi-projector.tsx
│   │   └── ...
│   ├── supabase/functions/server/
│   │   └── index.tsx
│   └── package.json
└── guidelines/
    └── Guidelines.md            # Design system tokens
```

---

## Installation

### Frontend (Figma Dashboard)

```bash
cd figma-dashboard
npm install
npm run dev
```

### Backend (Supabase)

1. Set up Supabase project
2. Run DDL from `supabase_schema.sql`
3. Deploy edge functions: `supabase functions deploy`
4. Configure environment variables:
   ```
   SUPABASE_URL=https://<project-id>.supabase.co
   SUPABASE_ANON_KEY=<anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   ```

### Data Pipeline

```bash
python batch_local.py --input raw_csvs/ --output normalized_output/
python supabase_serp_uploader.py --input normalized_output/serp_history.csv
```

---

## Scheduled Automation (Make.com)

### Scenario 1: Daily SERP Refresh
- **Trigger**: Scheduled (6 AM & 6 PM EST)
- **Actions**: 
  1. Execute truth_serum scraper
  2. Validate → Normalize → Upload to Supabase
  3. Update KV store with latest KPIs
  4. Send Slack notification

### Scenario 2: Competitor Alert
- **Trigger**: Webhook (rank change > 5 positions)
- **Actions**: Email alert + Log to waste audit

### Scenario 3: Weekly Report
- **Trigger**: Monday 8 AM EST
- **Actions**: Generate Metabase PDF → Email stakeholders

---

## Future Enhancements

### Phase 2 (Q1 2026)
- [ ] Real-time rank change alerts (Supabase Realtime)
- [ ] Expand to 5+ competitor dealers
- [ ] Google Analytics 4 integration
- [ ] Inventory velocity tracking (days on lot)
- [ ] AI content gap analyzer

### Phase 3 (Q2 2026)
- [ ] Multi-location support
- [ ] Mobile app (React Native)
- [ ] Voice alerts (Twilio)
- [ ] Automated content generation (GPT-4)
- [ ] ML-based ROI predictions

---

## License

Proprietary - © 2026 AegisDirective / Mid-State Chevrolet

---

**Contact**: Sean / AegisDirective  
**Notion Docs**: https://www.notion.so/2efa99eec1a881d0b5c4f380bc98ac44