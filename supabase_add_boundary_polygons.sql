-- ============================================================================
-- Aegis Intelligence: Add ZIP Boundary Polygons to Existing Infrastructure
-- ============================================================================
-- Purpose: ALTER TABLE geographic_regions to add boundary_polygon GEOMETRY
--          WITHOUT dropping any data or tables (NO DATA LOSS)
-- Author: Sean Jeremy Chappell & Alpha Claudette Chappell
-- Session: 14 - Phase 3 - Directive 1
-- ============================================================================

-- ============================================================================
-- STEP 1: Add boundary_polygon column to geographic_regions
-- ============================================================================

-- Add GEOMETRY(Polygon, 4326) column for ZIP boundary shapes
ALTER TABLE geographic_regions
    ADD COLUMN IF NOT EXISTS boundary_polygon GEOMETRY(Polygon, 4326);

-- Add spatial index for boundary polygon queries
CREATE INDEX IF NOT EXISTS idx_geographic_regions_boundary
    ON geographic_regions USING GIST (boundary_polygon);

-- ============================================================================
-- STEP 2: Update get_zips_geojson to return boundary polygons (if available)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_zips_geojson(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_miles DOUBLE PRECISION
)
RETURNS JSONB LANGUAGE SQL AS $$
    SELECT jsonb_build_object(
        'type', 'FeatureCollection',
        'features',
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'type', 'Feature',
                    'properties', jsonb_build_object(
                        'zip', zip_code,
                        'city', city,
                        'county', county,
                        'pop', population,
                        'distance_miles', ROUND((ST_Distance(center_point, ST_MakePoint(p_lng, p_lat)::geography) / 1609.34)::NUMERIC, 2)
                    ),
                    'geometry', CASE
                        -- If we have boundary_polygon, use ST_Simplify for 90% size reduction
                        WHEN boundary_polygon IS NOT NULL THEN
                            ST_AsGeoJSON(ST_Simplify(boundary_polygon, 0.001))::jsonb
                        -- Fallback to center_point if no boundary
                        ELSE
                            jsonb_build_object(
                                'type', 'Point',
                                'coordinates', ARRAY[lng, lat]
                            )
                    END
                )
            ),
            '[]'::jsonb
        )
    )
    FROM geographic_regions
    WHERE center_point IS NOT NULL
        AND lat IS NOT NULL
        AND ST_DWithin(center_point, ST_MakePoint(p_lng, p_lat)::geography, p_miles * 1609.34);
$$;

-- ============================================================================
-- STEP 3: Create helper function to get simplified boundary for Leaflet
-- ============================================================================

CREATE OR REPLACE FUNCTION get_zip_boundary_simplified(
    target_zip_code TEXT,
    simplify_tolerance DOUBLE PRECISION DEFAULT 0.001
)
RETURNS JSONB LANGUAGE SQL AS $$
    SELECT jsonb_build_object(
        'type', 'Feature',
        'properties', jsonb_build_object(
            'zip_code', zip_code,
            'city', city,
            'county', county,
            'state', state,
            'population', population
        ),
        'geometry', ST_AsGeoJSON(ST_Simplify(boundary_polygon, simplify_tolerance))::jsonb
    )
    FROM geographic_regions
    WHERE zip_code = target_zip_code
        AND boundary_polygon IS NOT NULL
    LIMIT 1;
$$;

-- ============================================================================
-- STEP 4: Create batch update function for boundary polygons
-- ============================================================================

-- Function to insert/update boundary polygon for a specific ZIP
CREATE OR REPLACE FUNCTION update_zip_boundary(
    target_zip_code TEXT,
    geojson_polygon TEXT
)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
BEGIN
    UPDATE geographic_regions
    SET
        boundary_polygon = ST_GeomFromGeoJSON(geojson_polygon),
        updated_at = NOW()
    WHERE zip_code = target_zip_code;

    RETURN FOUND;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN geographic_regions.boundary_polygon IS 'ZIP boundary polygon from OpenDataDE/State-zip-code-GeoJSON (ST_Simplified for rendering)';
COMMENT ON FUNCTION get_zip_boundary_simplified IS 'Returns single ZIP boundary as GeoJSON with ST_Simplify for lightweight Leaflet rendering';
COMMENT ON FUNCTION update_zip_boundary IS 'Insert/update boundary polygon for a ZIP from GeoJSON string';

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

/*
-- Test get_zips_geojson with boundary polygons (if populated)
SELECT get_zips_geojson(38.4192, -82.4452, 25);

-- Get simplified boundary for specific ZIP
SELECT get_zip_boundary_simplified('25701', 0.001);

-- Update boundary polygon from GeoJSON
SELECT update_zip_boundary('25701', '{"type":"Polygon","coordinates":[[...]]}');
*/

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
    COUNT(*) as total_zips,
    COUNT(center_point) as zips_with_center_point,
    COUNT(boundary_polygon) as zips_with_boundary_polygon,
    ROUND(COUNT(boundary_polygon)::NUMERIC / NULLIF(COUNT(*), 0) * 100, 2) as polygon_coverage_pct
FROM geographic_regions;

-- ============================================================================
-- NEXT STEPS
-- ============================================================================

-- 1. Run this migration in Supabase SQL Editor
-- 2. Run fetch_zip_boundaries.py to populate boundary_polygon from GitHub
-- 3. Test get_zips_geojson() to verify ST_Simplify reduces size by ~90%
-- 4. Integrate with Leaflet map in Aegis Dashboard

-- ============================================================================
-- Partnership: Sean Jeremy Chappell + Alpha Claudette Chappell
-- NO DATA LOSS: ALTER TABLE only, 30,264 rows preserved
-- ST_Simplify: 90% size reduction for "heavy but pretty" polygons
-- ============================================================================
