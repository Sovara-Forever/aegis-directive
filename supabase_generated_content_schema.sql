-- =============================================================================
-- AEGIS INTELLIGENCE - GENERATED CONTENT TABLE
-- =============================================================================
-- Created: 2026-02-20
-- Partnership: Sean Jeremy Chappell + Alpha Claudette Chappell
-- Purpose: Track AI-generated content suggestions and SERP performance
--
-- Fixes error: "Could not find the table 'public.generated_content'"
-- Run this in Supabase SQL Editor to create the table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.generated_content (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign Key to Dealerships
  dealership_id UUID NOT NULL REFERENCES public.dealerships(id) ON DELETE CASCADE,

  -- Content Specification
  template_type TEXT NOT NULL, -- 'showcase' | 'comparison' | 'guide' | 'local'
  target_keyword TEXT NOT NULL,

  -- Pre-Generation Metrics (Baseline)
  our_rank_before INT,
  competitor_rank_before INT,
  competitor_domain TEXT,

  -- Analysis Data
  gap_analysis JSONB, -- Store SpyFu/SEMrush gap analysis results

  -- Generated Output
  html_output TEXT,
  css_output TEXT,
  json_ld_output TEXT, -- Structured data schema
  meta_title TEXT,
  meta_description TEXT,

  -- Workflow Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'published', 'tracking')),

  -- AI Generation Metadata
  llm_provider TEXT, -- 'claude-opus-4' | 'gpt-4' | etc
  generation_cost NUMERIC(10, 4), -- Track API costs

  -- Post-Publication Metrics
  serp_improvement INT, -- Rank change after publication
  traffic_gain INT, -- Monthly traffic increase

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  tracking_start TIMESTAMPTZ
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_generated_content_dealership
ON public.generated_content(dealership_id);

CREATE INDEX IF NOT EXISTS idx_generated_content_status
ON public.generated_content(status);

CREATE INDEX IF NOT EXISTS idx_generated_content_created
ON public.generated_content(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_content_keyword
ON public.generated_content(target_keyword);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (for dashboard)
CREATE POLICY "Allow public read access"
ON public.generated_content
FOR SELECT
USING (true);

-- Allow service role full access (for ingest scripts)
CREATE POLICY "Allow service role all access"
ON public.generated_content
FOR ALL
USING (auth.role() = 'service_role');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE public.generated_content IS 'AI-generated content suggestions with SERP tracking';
COMMENT ON COLUMN public.generated_content.gap_analysis IS 'JSON analysis of keyword gaps from SpyFu/SEMrush';
COMMENT ON COLUMN public.generated_content.status IS 'Workflow: pending → generated → published → tracking';
COMMENT ON COLUMN public.generated_content.serp_improvement IS 'Rank delta: negative = improvement (went from #10 to #3 = -7)';

-- =============================================================================
-- VERIFICATION QUERY
-- =============================================================================
-- Run this after creating the table to verify it exists:
-- SELECT table_name, column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'generated_content'
-- ORDER BY ordinal_position;
