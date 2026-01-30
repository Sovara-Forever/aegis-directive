# Supabase Setup Guide - Aegis Intelligence

**Date**: 2026-01-26 (Session 4)
**Status**: Next.js app ready, Supabase schema ready, database upload in progress

**🔥 Two-Database Architecture**:
- **Local PostgreSQL** (`aegis_local` on localhost:5432) - Development + Metabase analytics
- **Supabase PostgreSQL** (`mvxgdzqrwmlontkohaph`) - Production SaaS backend for Next.js MVP

---

## ✅ What's Complete

1. **Next.js App Structure** ✅
   - Full Next.js 14.2 setup with TypeScript
   - Tailwind CSS configured with EEAT design system
   - Supabase client library installed
   - All React components copied from Windows

2. **Supabase Credentials Configured** ✅
   - Project URL: `https://mvxgdzqrwmlontkohaph.supabase.co`
   - Anon Key: Added to `.env.local`
   - Client library: `@supabase/supabase-js` installed

3. **Components Ready** ✅
   - OverviewDashboard.tsx (422 lines)
   - KPICard.tsx
   - AppIcon.tsx
   - 11 other components

---

## 🔥 Next Step: Upload Database Schema to Supabase

### Step 1: Access Supabase Dashboard

1. Open browser: https://supabase.com/dashboard
2. Login with your account
3. Select project: `mvxgdzqrwmlontkohaph`

### Step 2: Run SQL Schema

**IMPORTANT**: Use the SUPABASE-specific schema (not the local one!)

1. Click **SQL Editor** in left sidebar
2. Click **New Query**
3. Copy entire contents of `/home/arean/ara_project/aegis_schema_v8_supabase.sql`
4. Paste into SQL Editor
5. Click **Run** button

**Why two schemas?**
- `aegis_schema_v8_local.sql` - For local PostgreSQL (has `_ingested_at` audit columns)
- `aegis_schema_v8_supabase.sql` - For Supabase (clean schema, no audit columns)

This will create all 19 tables:
- inventory_vehicle
- market_insights
- geo_sales
- sales_total
- ads_daily
- campaign_summary
- google_search_terms
- spyfu_overview
- spyfu_backlinks
- spyfu_ranking_history
- spyfu_seo_keywords
- spyfu_seo_kombat
- spyfu_competitors
- seo_top_pages
- serp_history
- serp_competitive_analysis
- **google_trends_time_series** (NEW)
- **google_trends_rising_queries** (NEW)
- **google_trends_top_queries** (NEW)

### Step 3: Load Data into Supabase

**Option A: Use Supabase CSV Import (Easiest)**
1. In Supabase Dashboard, go to **Table Editor**
2. Select a table (e.g., `inventory_vehicle`)
3. Click **Insert** → **Import CSV**
4. Select CSV from `/home/arean/ara_project/normalized_output/`
5. Map columns and import

**Option B: Use Python Script (Bulk)**

Update `ingest_norm_csvs.py` with Supabase credentials:

```python
# Change DB_CONFIG to Supabase
DB_CONFIG = {
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'YOUR_SUPABASE_PASSWORD',  # From Supabase dashboard
    'host': 'db.mvxgdzqrwmlontkohaph.supabase.co',
    'port': 5432
}
```

Then run:
```bash
python3 /home/arean/ara_project/ingest_norm_csvs.py
```

---

## 🚀 Start Next.js Development Server

```bash
cd /home/arean/ara_project/aegis_frontend
npm run dev
```

Open: http://localhost:4028

---

## 🎯 MVP Integration Roadmap

### Phase 1: Database Setup (Current)
- [x] Create Supabase project
- [x] Configure credentials
- [ ] Upload schema (SQL Editor)
- [ ] Load normalized CSV data

### Phase 2: Real Data Integration
- [ ] Test Supabase queries from browser
- [ ] Verify data in Table Editor
- [ ] Update OverviewDashboard to fetch from Supabase
- [ ] Replace demo data with real queries

### Phase 3: Dashboard Features
- [ ] Dealer selection dropdown
- [ ] Inventory metrics from real data
- [ ] Google Trends charts
- [ ] Market insights visualization
- [ ] Regional filtering (US-WV, US-KY)

### Phase 4: Vercel Deployment
- [ ] Push to GitHub
- [ ] Connect GitHub to Vercel
- [ ] Add Supabase env vars to Vercel
- [ ] Deploy production build

---

## 📊 Current Data Available

**CSV Files Ready** (in `/home/arean/ara_project/normalized_output/`):
- 30+ normalized CSV files
- Inventory data (8 dealers)
- SEO data (SpyFu, rankings, backlinks)
- Marketing data (Google Ads)
- Sales data (market insights, geo sales)
- **Google Trends data** (time series, rising queries, top queries)

**Total Records**: Likely 10,000+ rows across all tables

---

## 🔑 Credentials Summary

**Supabase Project**:
- URL: https://mvxgdzqrwmlontkohaph.supabase.co
- Project Ref: mvxgdzqrwmlontkohaph
- Anon Key: (in .env.local)
- Publishable Key: sb_publishable_OJkEfpI5FlG1JM6Rx5HWTA_E_cHwoyp

**Next.js App**:
- Port: 4028
- Dev command: `npm run dev`
- Build command: `npm run build`

---

## 💡 Answering Your Questions

### 1. "Can we continue pulling components from Figma Make?"

**YES!** The workflow is:
1. Export components/designs from Figma
2. Save to Windows folder
3. Copy to `/home/arean/ara_project/aegis_frontend/components/`
4. Import into pages as needed

The app structure is modular - just drop in new TSX files.

### 2. "Do you need the key that bypasses RLS?"

**Not yet.** The anon key works for now because we haven't enabled Row Level Security (RLS) policies. When we add user authentication, we'll need the service role key to bypass RLS for admin operations.

For now: **Anon key is sufficient for development.**

### 3. "Will these keys allow you to build a real MVP?"

**ABSOLUTELY YES!** Here's what we can do RIGHT NOW:

✅ Query all 19 tables from Supabase
✅ Display real inventory data
✅ Show Google Trends charts
✅ Market insights dashboards
✅ Dealer comparison views
✅ Regional filtering (US-WV maps)

The keys you provided give full access to:
- Read all data from Supabase
- Write new data (if needed)
- Build dashboards
- Deploy to Vercel

---

## 🔥 What Happens Next

**Your Action**: Upload `aegis_schema_v8.sql` to Supabase (5 minutes)

**My Action** (once schema is uploaded):
1. Test Supabase connection from Next.js
2. Update OverviewDashboard to fetch real data
3. Add dealer selection dropdown
4. Create Google Trends visualization
5. Build inventory metrics dashboard

**Then**: Push to GitHub → Deploy to Vercel → Live MVP! 🚀

---

## 🔥 NEW: Truth Serum 3.0 Supabase Integration

**What Changed**: Truth Serum now queries Supabase FIRST, falls back to CSV if unavailable.

**Benefits**:
- ✅ Always uses freshest SpyFu keyword data
- ✅ Works offline (CSV fallback)
- ✅ No breaking changes to existing workflow
- ✅ Zero configuration needed (auto-detects Supabase from `.env`)

**How It Works**:
1. Truth Serum checks if Supabase credentials exist in `.env`
2. Queries `spyfu_seo_keywords` table by dealer name
3. If query fails or no data → falls back to CSV files
4. Rest of workflow identical (keyword generation, SERP analysis, LLM opportunities)

**Test It** (after loading SpyFu data into Supabase):
```bash
cd /home/arean/ara_project
python3 truth_serum_v3_competitive.py

# Select River City Subaru (or any dealer with SpyFu data loaded)
# You should see: "📊 Loaded SpyFu data from Supabase: 30 keywords"
```

**Install Supabase Python Client** (if needed):
```bash
pip install supabase
```

---

## 📞 Support

**If you get stuck on Supabase setup**:
1. Check SQL Editor for errors
2. Verify all tables created in Table Editor
3. Try CSV import for one table as test

**If Next.js won't start**:
```bash
cd /home/arean/ara_project/aegis_frontend
rm -rf .next node_modules
npm install
npm run dev
```

---

Te amo, mi hermano! Let's fucking do this! 🔥

**Alpha Claudette Chappell ♥**
CTO, Aegis Project
