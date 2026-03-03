-- ============================================================================
-- AEGIS INTELLIGENCE: GEO + CONTENT DEPLOYMENT
-- Partnership: Sean Jeremy Chappell + Alpha Claudette Chappell
-- ============================================================================
-- COLUMN TRUTH: dealerships=latitude/longitude, geographic_regions=lat/lng
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. GEOGRAPHIC_REGIONS PostGIS (lat/lng)
ALTER TABLE geographic_regions
    ADD COLUMN IF NOT EXISTS center_point GEOGRAPHY(Point, 4326),
    ADD COLUMN IF NOT EXISTS county_fips TEXT,
    ADD COLUMN IF NOT EXISTS county_weights JSONB,
    ADD COLUMN IF NOT EXISTS is_multi_county BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_geo_center ON geographic_regions USING GIST (center_point);

CREATE OR REPLACE FUNCTION update_geo_center() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.center_point := ST_MakePoint(NEW.lng, NEW.lat)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS geo_center_trig ON geographic_regions;
CREATE TRIGGER geo_center_trig BEFORE INSERT OR UPDATE OF lat, lng ON geographic_regions
    FOR EACH ROW EXECUTE FUNCTION update_geo_center();

-- 2. DEALERSHIPS PostGIS (latitude/longitude)
ALTER TABLE dealerships ADD COLUMN IF NOT EXISTS location_point GEOGRAPHY(Point, 4326);
CREATE INDEX IF NOT EXISTS idx_dealer_loc ON dealerships USING GIST (location_point);

CREATE OR REPLACE FUNCTION update_dealer_loc() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location_point := ST_MakePoint(NEW.longitude, NEW.latitude)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dealer_loc_trig ON dealerships;
CREATE TRIGGER dealer_loc_trig BEFORE INSERT OR UPDATE OF latitude, longitude ON dealerships
    FOR EACH ROW EXECUTE FUNCTION update_dealer_loc();

UPDATE dealerships SET location_point = ST_MakePoint(longitude, latitude)::geography
WHERE latitude IS NOT NULL AND longitude IS NOT NULL AND location_point IS NULL;

-- 3. RADIUS FUNCTIONS
CREATE OR REPLACE FUNCTION get_zips_in_radius(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_miles DOUBLE PRECISION)
RETURNS TABLE (zip_code TEXT, city TEXT, county TEXT, state TEXT, population INTEGER, dist NUMERIC) LANGUAGE SQL AS $$
    SELECT zip_code, city, county, state, population,
        (ST_Distance(center_point, ST_MakePoint(p_lng, p_lat)::geography) / 1609.34)::NUMERIC
    FROM geographic_regions WHERE center_point IS NOT NULL
        AND ST_DWithin(center_point, ST_MakePoint(p_lng, p_lat)::geography, p_miles * 1609.34) ORDER BY 6;
$$;

CREATE OR REPLACE FUNCTION get_counties_in_radius(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_miles DOUBLE PRECISION)
RETURNS TABLE (county_fips TEXT, county TEXT, state TEXT, zips BIGINT, pop BIGINT, pct NUMERIC) LANGUAGE SQL AS $$
    WITH s AS (SELECT county_fips, county, state, COUNT(DISTINCT zip_code) zc, SUM(population) p
        FROM geographic_regions WHERE center_point IS NOT NULL AND county IS NOT NULL
            AND ST_DWithin(center_point, ST_MakePoint(p_lng, p_lat)::geography, p_miles * 1609.34)
        GROUP BY county_fips, county, state), t AS (SELECT SUM(p) g FROM s)
    SELECT s.county_fips, s.county, s.state, s.zc, s.p, ROUND(s.p::NUMERIC / NULLIF(t.g, 0) * 100, 2)
    FROM s CROSS JOIN t ORDER BY s.p DESC;
$$;

CREATE OR REPLACE FUNCTION get_zips_geojson(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_miles DOUBLE PRECISION)
RETURNS JSONB LANGUAGE SQL AS $$
    SELECT jsonb_build_object('type', 'FeatureCollection', 'features',
        COALESCE(jsonb_agg(jsonb_build_object('type', 'Feature',
            'properties', jsonb_build_object('zip', zip_code, 'city', city, 'pop', population),
            'geometry', jsonb_build_object('type', 'Point', 'coordinates', ARRAY[lng, lat])
        )), '[]'::jsonb))
    FROM geographic_regions WHERE center_point IS NOT NULL AND lat IS NOT NULL
        AND ST_DWithin(center_point, ST_MakePoint(p_lng, p_lat)::geography, p_miles * 1609.34);
$$;

CREATE OR REPLACE FUNCTION get_aegis_targets(p_id UUID, p_type TEXT, p_miles DOUBLE PRECISION DEFAULT 50)
RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE lat DOUBLE PRECISION; lng DOUBLE PRECISION; r JSONB;
BEGIN
    SELECT latitude, longitude INTO lat, lng FROM dealerships WHERE id = p_id;
    IF lat IS NULL THEN RETURN '{"error":"no coords"}'::jsonb; END IF;
    CASE p_type
        WHEN 'conquest' THEN SELECT jsonb_build_object('product','conquest','hec',true,
            'counties',(SELECT jsonb_agg(jsonb_build_object('fips',county_fips,'name',county,'pct',pct))
                FROM get_counties_in_radius(lat, lng, p_miles) WHERE pct >= 5)) INTO r;
        WHEN 'connect' THEN SELECT jsonb_build_object('product','connect',
            'zips',(SELECT jsonb_agg(jsonb_build_object('zip',zip_code,'city',city,'pop',population))
                FROM get_zips_in_radius(lat, lng, p_miles) WHERE population >= 500)) INTO r;
        ELSE SELECT jsonb_build_object('product','content','geojson',get_zips_geojson(lat, lng, p_miles)) INTO r;
    END CASE;
    RETURN r;
END; $$;

-- 4. GENERATED_CONTENT TABLE
CREATE TABLE IF NOT EXISTS generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dealership_id UUID NOT NULL REFERENCES dealerships(id) ON DELETE CASCADE,
    template_type TEXT NOT NULL, target_keyword TEXT NOT NULL,
    our_rank_before INT, competitor_rank_before INT, competitor_domain TEXT,
    gap_analysis JSONB, html_output TEXT, css_output TEXT, json_ld_output TEXT,
    meta_title TEXT, meta_description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','generated','published','tracking')),
    llm_provider TEXT, generation_cost NUMERIC(10,4), serp_improvement INT, traffic_gain INT,
    created_at TIMESTAMPTZ DEFAULT NOW(), published_at TIMESTAMPTZ, tracking_start TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_gc_dealer ON generated_content(dealership_id);
CREATE INDEX IF NOT EXISTS idx_gc_status ON generated_content(status);
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gc_read" ON generated_content FOR SELECT USING (true);
CREATE POLICY "gc_write" ON generated_content FOR ALL USING (auth.role() = 'service_role');

-- VERIFY
SELECT 'PostGIS' AS c, PostGIS_Version() AS v UNION ALL
SELECT 'geo_regions', (SELECT COUNT(*)::TEXT FROM geographic_regions) UNION ALL
SELECT 'gen_content', CASE WHEN EXISTS(SELECT 1 FROM generated_content LIMIT 1) THEN 'HAS DATA' ELSE 'EMPTY' END;
