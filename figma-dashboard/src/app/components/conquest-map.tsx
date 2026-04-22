/**
 * Conquest Map Component - Aegis Intelligence
 * 50-mile radius competitive territory visualization
 *
 * Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
 * Created: 2026-02-25
 */

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, Polygon, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../../../lib/supabase';
import { MapPin, Target, Users, Car, ChevronDown, AlertTriangle, Zap } from 'lucide-react';

// Fix Leaflet default marker icon issue with bundlers
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom marker icons
const createCustomIcon = (color: string, isSelected: boolean = false) => {
  const size = isSelected ? 40 : 28;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      <path fill="${color}" stroke="#0F172A" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      ${isSelected ? '<circle cx="12" cy="9" r="3" fill="#0F172A"/>' : ''}
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// Colors from Aegis design system
const COLORS = {
  emerald: '#10B981',
  emeraldLight: 'rgba(16, 185, 129, 0.15)',
  blue: '#0EA5E9',
  amber: '#F59E0B',
  red: '#EF4444',
  slate: '#94A3B8',
  dark: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
};

interface Dealership {
  id: string;
  name: string;
  domain?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude: number;
  longitude: number;
  inventory_count?: number;
  has_sales_data?: boolean;
}

interface GeographicRegion {
  id: string;
  zip_code: string;
  city?: string;
  county?: string;
  state?: string;
  lat?: number;
  lng?: number;
  population?: number;
  primary_dealer_id?: string;
  distance_miles?: number;
}

interface ConquestMapProps {
  selectedDealership: string;
}

// Component to recenter map when selection changes
function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.5 });
  }, [center, zoom, map]);
  return null;
}

// Convert GeoJSON coordinates [lng, lat] → Leaflet [lat, lng] format
// Handles both Polygon and MultiPolygon geometry types
function convertCoords(coords: any): any {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return [];
  try {
    const first = coords[0];
    if (!Array.isArray(first) || first.length === 0) return [];
    const second = first[0];
    if (!Array.isArray(second)) return [];
    if (Array.isArray(second[0])) {
      // MultiPolygon: coords[i][0] are outer rings
      return coords.map((poly: any) =>
        poly[0].map((coord: number[]) => [coord[1], coord[0]] as [number, number])
      );
    } else {
      // Polygon: coords[0] is the outer ring
      return first.map((coord: number[]) => [coord[1], coord[0]] as [number, number]);
    }
  } catch {
    return [];
  }
}

export function ConquestMap({ selectedDealership }: ConquestMapProps) {
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [regions, setRegions] = useState<GeographicRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [radiusMiles, setRadiusMiles] = useState(50);
  const [showRegions, setShowRegions] = useState(false);
  const [showVulnerability, setShowVulnerability] = useState(false);
  const [showStrategyLayer, setShowStrategyLayer] = useState(false);
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});
  const [zipGeoJSON, setZipGeoJSON] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [marketAnalysis, setMarketAnalysis] = useState<any[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelInventoryCounts, setModelInventoryCounts] = useState<Record<string, number>>({});

  // Fetch dealerships and their inventory counts
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch dealerships with geocoding
        const { data: dealerData, error: dealerError } = await supabase
          .from('dealerships')
          .select('id, name, domain, address, city, state, zip_code, latitude, longitude')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (dealerError) throw dealerError;

        // Fetch inventory counts per dealership (+ model for scorecard rollup)
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .select('dealership_id, model')
          .eq('is_active', true);

        // Build counts locally so enrichedDealers has correct values immediately
        const localCounts: Record<string, number> = {};
        if (!invError && invData) {
          invData.forEach((inv: { dealership_id: string; model: string }) => {
            localCounts[inv.dealership_id] = (localCounts[inv.dealership_id] || 0) + 1;
          });
          setInventoryCounts(localCounts);
        }

        // Check which dealers have sales data (market_sales)
        const { data: salesData } = await supabase
          .from('market_sales')
          .select('dealership_id')
          .limit(1000);

        const dealersWithSales = new Set(salesData?.map((s: { dealership_id: string }) => s.dealership_id) || []);

        const enrichedDealers = (dealerData || []).map((d: Dealership) => ({
          ...d,
          inventory_count: localCounts[d.id] || 0,
          has_sales_data: dealersWithSales.has(d.id),
        }));

        setDealerships(enrichedDealers);

        // Fetch geographic regions for selected dealer
        const selectedDealer = enrichedDealers.find(
          (d: Dealership) => d.name.trim() === selectedDealership.trim()
        );
        if (selectedDealer) {
          // Fix: distance_miles is NULL for all rows — use Haversine client-side filter
          const { data: regionData } = await supabase
            .from('geographic_regions')
            .select('*')
            .eq('primary_dealer_id', selectedDealer.id)
            .order('zip_code', { ascending: true });

          if (regionData) {
            const R = 3959;
            const filtered = regionData.filter((r: any) => {
              if (!r.lat || !r.lng) return false;
              const dLat = ((r.lat - selectedDealer.latitude) * Math.PI) / 180;
              const dLon = ((r.lng - selectedDealer.longitude) * Math.PI) / 180;
              const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((selectedDealer.latitude * Math.PI) / 180) *
                  Math.cos((r.lat * Math.PI) / 180) *
                  Math.sin(dLon / 2) *
                  Math.sin(dLon / 2);
              return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusMiles;
            });
            setRegions(filtered);
          } else {
            setRegions([]);
          }

          // Fetch ZIP GeoJSON with conquest scoring
          const { data: geoData, error: geoError } = await supabase.rpc(
            'get_zip_conquest_geojson',
            {
              our_dealer_id: selectedDealer.id,
              radius_miles: radiusMiles,
            }
          );

          if (geoError) {
            console.error('[ConquestMap] RPC ERROR:', geoError.message, geoError.details);
          } else if (geoData) {
            console.log(
              '[ConquestMap] RPC features:', geoData.features?.length ?? 0,
              geoData.features?.[0]?.geometry
                ? JSON.stringify(geoData.features[0].geometry).slice(0, 200)
                : 'NO_GEOMETRY'
            );
            setZipGeoJSON(geoData);
          } else {
            console.warn('[ConquestMap] RPC returned null/undefined');
          }

          // Fetch market analysis strategy tiers for this dealer
          const { data: maData } = await supabase
            .from('market_analysis')
            .select('zip_code, model, market_significance, priority, zip_share_current, dealer_sales_current, all_sales_current')
            .eq('dealership_id', selectedDealer.id);

          if (maData) {
            setMarketAnalysis(maData);
            const models = [...new Set(maData.map((d: any) => d.model).filter(Boolean))].sort() as string[];
            setAvailableModels(models);
          }

          // Build per-model inventory counts for this dealer (scorecard rollup)
          if (!invError && invData) {
            const localModelCounts: Record<string, number> = {};
            invData
              .filter((inv: { dealership_id: string; model: string }) => inv.dealership_id === selectedDealer.id)
              .forEach((inv: { dealership_id: string; model: string }) => {
                if (inv.model) {
                  localModelCounts[inv.model] = (localModelCounts[inv.model] || 0) + 1;
                }
              });
            setModelInventoryCounts(localModelCounts);
          }
        }
      } catch (error) {
        console.error('Error loading map data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedDealership, radiusMiles]);

  // Find selected dealer
  const selectedDealer = useMemo(() => {
    return dealerships.find((d) => d.name.trim() === selectedDealership.trim());
  }, [dealerships, selectedDealership]);

  // Calculate competitors within radius
  const competitorsInRadius = useMemo(() => {
    if (!selectedDealer) return [];

    return dealerships.filter((d) => {
      if (d.id === selectedDealer.id) return false;

      // Calculate distance using Haversine formula
      const R = 3959; // Earth radius in miles
      const dLat = ((d.latitude - selectedDealer.latitude) * Math.PI) / 180;
      const dLon = ((d.longitude - selectedDealer.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((selectedDealer.latitude * Math.PI) / 180) *
          Math.cos((d.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= radiusMiles;
    });
  }, [dealerships, selectedDealer, radiusMiles]);

  // Calculate vulnerable zones - competitors with inventory but no sales tracking
  const vulnerableCompetitors = useMemo(() => {
    const result = competitorsInRadius.filter((d) => {
      const invCount = inventoryCounts[d.id] || 0;
      // Any inventory + no sales data = vulnerable
      return invCount > 0 && !d.has_sales_data;
    }).map((d) => ({
      ...d,
      vulnerability_score: Math.min(100, Math.round((inventoryCounts[d.id] || 0) / 2)),
      conquest_opportunity: inventoryCounts[d.id] > 100 ? 'High'
      : inventoryCounts[d.id] > 30 ? 'Medium'
      : 'Low',
    }));
    console.log('[ConquestMap] Vulnerability debug:', {
      totalCompetitors: competitorsInRadius.length,
      withHighInventory: competitorsInRadius.filter(d => (inventoryCounts[d.id] || 0) > 20).length,
      withoutSalesData: competitorsInRadius.filter(d => !d.has_sales_data).length,
      vulnerable: result.length,
      sampleCounts: competitorsInRadius.slice(0, 5).map(d => ({
        name: d.name,
        inv: inventoryCounts[d.id] || 0,
        hasSales: d.has_sales_data,
      })),
    });
    return result;
  }, [competitorsInRadius, inventoryCounts]);

  // Filter market analysis by selected model
  const filteredAnalysis = useMemo(() => {
    if (selectedModel === 'all') return marketAnalysis;
    return marketAnalysis.filter((d) => d.model === selectedModel);
  }, [marketAnalysis, selectedModel]);

  // Market totals from market_analysis for Territory Stats
  const marketTotals = useMemo(() => {
    const dealerSales = filteredAnalysis.reduce(
      (sum: number, row: any) => sum + (row.dealer_sales_current || 0), 0
    );
    const allSales = filteredAnalysis.reduce(
      (sum: number, row: any) => sum + (row.all_sales_current || 0), 0
    );
    const goToWarCount = filteredAnalysis.filter(
      (row: any) => row.market_significance === 'Go To War'
    ).length;
    const holdGroundCount = filteredAnalysis.filter(
      (row: any) => row.market_significance === 'Hold Your Ground'
    ).length;
    return { dealerSales, allSales, goToWarCount, holdGroundCount };
  }, [filteredAnalysis]);

  // Per-model aggregated scorecard data from market_analysis (all models, not filtered)
  const modelScorecards = useMemo(() => {
    if (!marketAnalysis?.length) return [];
    const byModel: Record<string, {
      model: string;
      dealerSales: number;
      allSales: number;
      avgShareSum: number;
      zipCount: number;
      goToWarZips: number;
      holdGroundZips: number;
      closerLookZips: number;
      topTier: string;
    }> = {};

    marketAnalysis.forEach((row: any) => {
      if (!row.model) return;
      if (!byModel[row.model]) {
        byModel[row.model] = {
          model: row.model,
          dealerSales: 0,
          allSales: 0,
          avgShareSum: 0,
          zipCount: 0,
          goToWarZips: 0,
          holdGroundZips: 0,
          closerLookZips: 0,
          topTier: row.market_significance || '',
        };
      }
      const m = byModel[row.model];
      m.dealerSales += row.dealer_sales_current || 0;
      m.allSales += row.all_sales_current || 0;
      m.avgShareSum += row.zip_share_current || 0;
      m.zipCount += 1;
      if (row.market_significance === 'Go To War') m.goToWarZips += 1;
      if (row.market_significance === 'Hold Your Ground') m.holdGroundZips += 1;
      if (row.market_significance === 'Take a Closer Look') m.closerLookZips += 1;
    });

    return Object.values(byModel)
      .map(m => {
        // Dominant tier = most ZIPs. Tiebreak: Go To War > Hold Your Ground > Take a Closer Look
        let topTier = 'Take a Closer Look';
        let maxCount = m.closerLookZips;
        if (m.goToWarZips > maxCount) { topTier = 'Go To War'; maxCount = m.goToWarZips; }
        if (m.holdGroundZips > maxCount) { topTier = 'Hold Your Ground'; maxCount = m.holdGroundZips; }
        // If Go To War ties Hold Your Ground, Go To War wins (needs attention)
        if (m.goToWarZips === m.holdGroundZips && m.goToWarZips > 0 && m.goToWarZips >= m.closerLookZips) {
          topTier = 'Go To War';
        }
        return {
          ...m,
          topTier,
          avgShare: m.zipCount > 0 ? m.avgShareSum / m.zipCount : 0,
          inventoryCount: Object.entries(modelInventoryCounts).reduce((found, [key, count]) => {
            if (key.toLowerCase() === m.model.toLowerCase()) return count;
            return found;
          }, 0),
        };
      })
      .sort((a, b) => b.dealerSales - a.dealerSales);
  }, [marketAnalysis, modelInventoryCounts]);

  // ZIP → strategy tier lookup map
  // When "All Models" selected: color = highest-priority model's tier; tooltip lists all models
  const zipSignificance = useMemo(() => {
    const map: Record<string, {
      significance: string;
      priority: number;
      share: number;
      dealerSales: number;
      allSales: number;
      allModels?: Array<{ model: string; significance: string; priority: number; share: number }>;
    }> = {};

    if (selectedModel !== 'all') {
      // Single model — straight passthrough
      filteredAnalysis.forEach((row: any) => {
        map[row.zip_code] = {
          significance: row.market_significance,
          priority: row.priority || 0,
          share: row.zip_share_current || 0,
          dealerSales: row.dealer_sales_current || 0,
          allSales: row.all_sales_current || 0,
        };
      });
    } else {
      // All Models — group by ZIP, pick highest-priority row for color, keep all for tooltip
      const byZip: Record<string, any[]> = {};
      filteredAnalysis.forEach((row: any) => {
        if (!byZip[row.zip_code]) byZip[row.zip_code] = [];
        byZip[row.zip_code].push(row);
      });
      Object.entries(byZip).forEach(([zip, rows]) => {
        const winner = rows.reduce((best, r) => (r.priority || 0) > (best.priority || 0) ? r : best, rows[0]);
        map[zip] = {
          significance: winner.market_significance,
          priority: winner.priority || 0,
          share: winner.zip_share_current || 0,
          dealerSales: winner.dealer_sales_current || 0,
          allSales: winner.all_sales_current || 0,
          allModels: rows
            .sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0))
            .slice(0, 3)
            .map((r: any) => ({
              model: r.model,
              significance: r.market_significance,
              priority: r.priority || 0,
              share: r.zip_share_current || 0,
            })),
        };
      });
    }

    return map;
  }, [filteredAnalysis, selectedModel]);

  // Map center and zoom
  const mapCenter: [number, number] = selectedDealer
    ? [selectedDealer.latitude, selectedDealer.longitude]
    : [38.4, -82.4]; // Default to WV area

  const mapZoom = radiusMiles <= 25 ? 10 : radiusMiles <= 50 ? 9 : 8;
  const radiusMeters = radiusMiles * 1609.34;

  // Radius options
  const radiusOptions = [
    { value: 10, label: '10 mi' },
    { value: 15, label: '15 mi' },
    { value: 25, label: '25 mi' },
    { value: 50, label: '50 mi' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" style={{ backgroundColor: COLORS.card }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: COLORS.emerald }} />
          <p style={{ color: COLORS.textMuted }}>Loading conquest territory...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-semibold mb-2" style={{ fontSize: '36px', color: COLORS.text }}>
            Conquest Territory
          </h1>
          <p style={{ fontSize: '18px', color: COLORS.textMuted }}>
            {selectedDealership} • {radiusMiles}-mile radius • {competitorsInRadius.length} competitors
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {/* Radius Selector */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '14px', color: COLORS.textMuted }}>Radius:</span>
            <div className="relative">
              <select
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="px-4 py-2 rounded-lg appearance-none pr-8"
                style={{
                  backgroundColor: COLORS.card,
                  color: COLORS.text,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: '14px',
                }}
              >
                {radiusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: COLORS.textMuted }}
              />
            </div>
          </div>

          {/* Region Toggle */}
          <button
            onClick={() => setShowRegions(!showRegions)}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{
              backgroundColor: showRegions ? COLORS.emerald : COLORS.card,
              color: showRegions ? COLORS.dark : COLORS.textMuted,
              border: `1px solid ${COLORS.border}`,
              fontSize: '14px',
            }}
          >
            <Users size={16} />
            ZIP Regions
          </button>

          {/* Vulnerability Toggle */}
          <button
            onClick={() => setShowVulnerability(!showVulnerability)}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{
              backgroundColor: showVulnerability ? COLORS.red : COLORS.card,
              color: showVulnerability ? '#FFFFFF' : COLORS.textMuted,
              border: `1px solid ${showVulnerability ? COLORS.red : COLORS.border}`,
              fontSize: '14px',
            }}
          >
            <AlertTriangle size={16} />
            Vulnerability
          </button>

          {/* Strategy Layer Toggle — only shown when market_analysis data is loaded */}
          {availableModels.length > 0 && (
            <button
              onClick={() => setShowStrategyLayer(!showStrategyLayer)}
              className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              style={{
                backgroundColor: showStrategyLayer ? COLORS.blue : COLORS.card,
                color: showStrategyLayer ? '#FFFFFF' : COLORS.textMuted,
                border: `1px solid ${showStrategyLayer ? COLORS.blue : COLORS.border}`,
                fontSize: '14px',
              }}
            >
              <Target size={16} />
              Strategy
            </button>
          )}

          {/* Model Selector — only shown when market_analysis data is loaded */}
          {availableModels.length > 0 && (
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-4 py-2 rounded-lg appearance-none pr-8"
                style={{
                  backgroundColor: COLORS.card,
                  color: COLORS.text,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: '14px',
                }}
              >
                <option value="all">All Models</option>
                {availableModels.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: COLORS.textMuted }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
        <div style={{ height: '600px', width: '100%' }}>
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            {/* Dark theme map tiles - CartoDB Dark Matter */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Recenter on selection change */}
            <MapRecenter center={mapCenter} zoom={mapZoom} />

            {/* 50-mile radius circle */}
            {selectedDealer && (
              <Circle
                center={[selectedDealer.latitude, selectedDealer.longitude]}
                radius={radiusMeters}
                pathOptions={{
                  color: COLORS.emerald,
                  fillColor: COLORS.emerald,
                  fillOpacity: 0.08,
                  weight: 2,
                  dashArray: '10, 5',
                }}
              />
            )}

            {/* Selected dealership marker */}
            {selectedDealer && (
              <Marker
                position={[selectedDealer.latitude, selectedDealer.longitude]}
                icon={createCustomIcon(COLORS.emerald, true)}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <h3 className="font-bold text-lg mb-1" style={{ color: COLORS.dark }}>
                      {selectedDealer.name}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: COLORS.slate }}>
                      {selectedDealer.address && `${selectedDealer.address}, `}
                      {selectedDealer.city}, {selectedDealer.state} {selectedDealer.zip_code}
                    </p>
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#1E293B' }}>
                      <Car size={14} style={{ color: COLORS.emerald }} />
                      <span>
                        {inventoryCounts[selectedDealer.id] || 0} vehicles in stock
                      </span>
                    </div>
                    {selectedDealer.has_sales_data && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Target size={14} style={{ color: COLORS.blue }} />
                        <span style={{ color: COLORS.blue }}>Autoflyte sales data available</span>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Competitor markers */}
            {competitorsInRadius.map((dealer) => (
              <Marker
                key={dealer.id}
                position={[dealer.latitude, dealer.longitude]}
                icon={createCustomIcon(dealer.has_sales_data ? COLORS.blue : COLORS.amber, false)}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <h3 className="font-bold mb-1" style={{ color: COLORS.dark }}>
                      {dealer.name}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: COLORS.slate }}>
                      {dealer.city}, {dealer.state}
                    </p>
                    <div className="flex items-center gap-2 text-sm" style={{ color: '#1E293B' }}>
                      <Car size={14} style={{ color: (inventoryCounts[dealer.id] || 0) > 0 ? COLORS.amber : COLORS.slate }} />
                      <span>
                        {(inventoryCounts[dealer.id] || 0) > 0
                          ? `${inventoryCounts[dealer.id]} vehicles tracked`
                          : dealer.has_sales_data ? 'Autoflyte tracked' : 'Untracked competitor'}
                      </span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Vulnerability Overlays - Prime Conquest Targets */}
            {showVulnerability && vulnerableCompetitors.map((dealer) => (
              <Circle
                key={`vuln-${dealer.id}`}
                center={[dealer.latitude, dealer.longitude]}
                radius={8000} // ~5 mile radius for vulnerability zone
                pathOptions={{
                  color: COLORS.red,
                  fillColor: COLORS.red,
                  fillOpacity: 0.25,
                  weight: 2,
                  dashArray: '5, 5',
                }}
              >
                <Popup>
                  <div style={{ minWidth: '220px' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={16} style={{ color: COLORS.red }} />
                      <span className="font-bold" style={{ color: COLORS.red }}>Prime Conquest Target</span>
                    </div>
                    <h3 className="font-bold mb-1" style={{ color: COLORS.dark }}>
                      {dealer.name}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: COLORS.slate }}>
                      {dealer.city}, {dealer.state}
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Inventory:</span>
                        <span className="font-semibold">{inventoryCounts[dealer.id] || 0} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sales Data:</span>
                        <span style={{ color: COLORS.red }}>No tracking</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Opportunity:</span>
                        <span className="font-semibold" style={{ color: COLORS.emerald }}>{dealer.conquest_opportunity}</span>
                      </div>
                    </div>
                    <button
                      className="w-full mt-3 py-2 rounded text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ backgroundColor: COLORS.emerald, color: COLORS.dark }}
                      onClick={() => alert(`Generate localized SEO content for ${dealer.city}, ${dealer.state}\n\nTarget: "${dealer.city} car dealership" keywords\nFocus: GMB optimization + local landing pages`)}
                    >
                      <Zap size={14} />
                      Generate Local Content
                    </button>
                  </div>
                </Popup>
              </Circle>
            ))}

            {/* ZIP Code Polygons with Conquest Scoring */}
            {showRegions && zipGeoJSON && zipGeoJSON.features && zipGeoJSON.features.map((feature: any) => {
              const props = feature.properties;
              if (!feature.geometry || !feature.geometry.coordinates) return null;
              const coords = feature.geometry.coordinates;

              // Get color based on conquest score
              const getZipColor = () => {
                if (props.conquest_score === 'hot') return COLORS.red;
                if (props.conquest_score === 'warm') return COLORS.amber;
                return COLORS.emerald;
              };

              const positions = convertCoords(coords);
              if (!positions || positions.length === 0) return null;

              const zipColor = getZipColor();
              // When strategy layer is active, step back to border-only — no fill collision
              const conquestFillOpacity = showStrategyLayer ? 0 : 0.15;
              const conquestWeight = showStrategyLayer ? 1 : 1;
              const conquestOpacity = showStrategyLayer ? 0.35 : 0.6;

              return (
                <Polygon
                  key={feature.id}
                  positions={positions}
                  pathOptions={{
                    color: zipColor,
                    fillColor: zipColor,
                    fillOpacity: conquestFillOpacity,
                    weight: conquestWeight,
                    opacity: conquestOpacity,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div style={{ minWidth: '180px', padding: '8px' }}>
                      <div className="font-bold mb-1" style={{ color: COLORS.dark, fontSize: '14px' }}>
                        ZIP {props.zip_code}
                      </div>
                      <div className="text-xs mb-2" style={{ color: COLORS.slate }}>
                        {props.city}, {props.county} County
                      </div>
                      <div className="space-y-1" style={{ fontSize: '11px' }}>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.slate }}>Population:</span>
                          <span className="font-semibold">{props.population?.toLocaleString() || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.slate }}>Competitors:</span>
                          <span className="font-semibold">{props.competitor_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.slate }}>Total Inventory:</span>
                          <span className="font-semibold">{props.total_inventory || 0} units</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.slate }}>Vulnerable Dealers:</span>
                          <span className="font-semibold" style={{ color: COLORS.red }}>
                            {props.vulnerable_dealers || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: COLORS.slate }}>Distance:</span>
                          <span className="font-semibold">{props.distance_miles} mi</span>
                        </div>
                      </div>
                      <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: props.conquest_score === 'hot' ? 'rgba(239, 68, 68, 0.2)' :
                                           props.conquest_score === 'warm' ? 'rgba(245, 158, 11, 0.2)' :
                                           'rgba(16, 185, 129, 0.2)',
                            color: zipColor
                          }}
                        >
                          {props.conquest_score === 'hot' ? '🔥 Hot Zone' :
                           props.conquest_score === 'warm' ? '⚠️ Warm Zone' :
                           '✅ Low Threat'}
                        </span>
                      </div>
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}

            {/* Strategy Layer — Market Significance Tiers from market_analysis table */}
            {showStrategyLayer && zipGeoJSON && zipGeoJSON.features && zipGeoJSON.features.map((feature: any) => {
              const zipCode = feature.properties?.zip_code;
              const sig = zipSignificance[zipCode];
              if (!sig) return null;
              if (!feature.geometry || !feature.geometry.coordinates) return null;

              const getStrategyColor = () => {
                switch (sig.significance) {
                  case 'Go To War':          return COLORS.red;
                  case 'Hold Your Ground':   return COLORS.emerald;
                  case 'Take a Closer Look': return COLORS.amber;
                  default:                   return COLORS.slate;
                }
              };

              const positions = convertCoords(feature.geometry.coordinates);
              if (!positions || positions.length === 0) return null;

              const stratColor = getStrategyColor();

              return (
                <Polygon
                  key={`strat-${zipCode}`}
                  positions={positions}
                  pathOptions={{
                    color: stratColor,
                    fillColor: stratColor,
                    fillOpacity: 0.22,
                    weight: 1.5,
                    opacity: 0.7,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div style={{ minWidth: '200px', padding: '8px' }}>
                      <div className="font-bold mb-1" style={{ color: COLORS.dark, fontSize: '14px' }}>
                        ZIP {zipCode} — {selectedModel === 'all' ? 'All Models' : selectedModel}
                      </div>
                      {sig.allModels ? (
                        // Composite view: top 3 models by priority
                        <div className="space-y-2" style={{ fontSize: '11px' }}>
                          {sig.allModels.map((m) => {
                            const mColor = m.significance === 'Go To War' ? COLORS.red :
                                           m.significance === 'Hold Your Ground' ? COLORS.emerald : COLORS.amber;
                            return (
                              <div key={m.model} style={{ borderLeft: `3px solid ${mColor}`, paddingLeft: '6px' }}>
                                <div className="font-semibold" style={{ color: COLORS.dark }}>{m.model}</div>
                                <div className="flex justify-between">
                                  <span style={{ color: COLORS.slate }}>
                                    {m.significance === 'Go To War' ? '🔴' :
                                     m.significance === 'Hold Your Ground' ? '🟢' : '🟡'} {m.significance}
                                  </span>
                                  <span style={{ color: COLORS.slate }}>P{m.priority} · {m.share.toFixed(1)}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        // Single model view
                        <div className="space-y-1" style={{ fontSize: '11px' }}>
                          <div className="flex justify-between">
                            <span style={{ color: COLORS.slate }}>Strategy:</span>
                            <span className="font-semibold" style={{ color: stratColor }}>
                              {sig.significance === 'Go To War' ? '🔴 Go To War' :
                               sig.significance === 'Hold Your Ground' ? '🟢 Hold Your Ground' :
                               '🟡 Take a Closer Look'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: COLORS.slate }}>Priority:</span>
                            <span className="font-semibold">{sig.priority}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: COLORS.slate }}>Dealer Sales:</span>
                            <span className="font-semibold">{sig.dealerSales}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: COLORS.slate }}>Market Sales:</span>
                            <span className="font-semibold">{sig.allSales}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: COLORS.slate }}>ZIP Share:</span>
                            <span className="font-semibold">{sig.share.toFixed(1)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}

            {/* Circle fallback — ZIPs with strategy data but no polygon geometry */}
            {showStrategyLayer && regions.map((region) => {
              const sig = zipSignificance[region.zip_code];
              if (!sig || !region.lat || !region.lng) return null;
              const hasPolygon = zipGeoJSON?.features?.some(
                (f: any) => f.properties?.zip_code === region.zip_code && f.geometry
              );
              if (hasPolygon) return null;
              const circleColor = sig.significance === 'Go To War' ? COLORS.red
                : sig.significance === 'Hold Your Ground' ? COLORS.emerald
                : COLORS.amber;
              return (
                <Circle
                  key={`strat-circle-${region.zip_code}`}
                  center={[region.lat, region.lng]}
                  radius={3000}
                  pathOptions={{
                    color: circleColor,
                    fillColor: circleColor,
                    fillOpacity: 0.25,
                    weight: 1.5,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                    <div style={{ padding: '4px' }}>
                      <div className="font-bold" style={{ color: COLORS.dark, fontSize: '13px' }}>
                        ZIP {region.zip_code}
                      </div>
                      <div style={{ fontSize: '11px', color: circleColor }}>
                        {sig.significance}
                      </div>
                    </div>
                  </Tooltip>
                </Circle>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Prime Conquest Targets Card - Shows when vulnerability is enabled */}
      {showVulnerability && vulnerableCompetitors.length > 0 && (
        <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: `1px solid ${COLORS.red}` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}>
              <AlertTriangle size={20} style={{ color: COLORS.red }} />
            </div>
            <div>
              <h4 className="font-semibold" style={{ fontSize: '16px', color: COLORS.text }}>
                Prime Conquest Targets Detected
              </h4>
              <p style={{ fontSize: '13px', color: COLORS.textMuted }}>
                {vulnerableCompetitors.length} competitors with high inventory but no sales tracking
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {vulnerableCompetitors.slice(0, 6).map((dealer) => (
              <div
                key={dealer.id}
                className="p-3 rounded-lg"
                style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm truncate" style={{ color: COLORS.text, maxWidth: '150px' }}>
                    {dealer.name}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: dealer.conquest_opportunity === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: dealer.conquest_opportunity === 'High' ? COLORS.red : COLORS.amber
                    }}
                  >
                    {dealer.conquest_opportunity}
                  </span>
                </div>
                <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
                  {dealer.city}, {dealer.state} • {inventoryCounts[dealer.id] || 0} units
                </p>
                <button
                  className="w-full py-1.5 rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: COLORS.emerald, border: `1px solid ${COLORS.emerald}` }}
                  onClick={() => alert(`Generate localized SEO content for ${dealer.city}, ${dealer.state}\n\nTarget: "${dealer.city} car dealership" keywords\nFocus: GMB optimization + local landing pages`)}
                >
                  <Zap size={12} />
                  Generate Content
                </button>
              </div>
            ))}
          </div>
          {vulnerableCompetitors.length > 6 && (
            <p className="text-center mt-3 text-sm" style={{ color: COLORS.textMuted }}>
              +{vulnerableCompetitors.length - 6} more targets on map
            </p>
          )}
        </div>
      )}

      {/* Legend & Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Legend */}
        <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.card }}>
          <h4 className="font-semibold mb-3" style={{ fontSize: '14px', color: COLORS.text }}>
            Legend
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.emerald }} />
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Your Dealership</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.blue }} />
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Competitor (Sales Data)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS.amber }} />
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Competitor (Inventory Only)</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  border: `2px dashed ${COLORS.emerald}`,
                  backgroundColor: COLORS.emeraldLight,
                }}
              />
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>{radiusMiles}-Mile Conquest Radius</span>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{
                  border: `2px dashed ${COLORS.red}`,
                  backgroundColor: 'rgba(239, 68, 68, 0.25)',
                }}
              />
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Vulnerability Zone</span>
            </div>
            {showStrategyLayer && (
              <>
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: '11px', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategy Tiers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.22)', border: `1.5px solid ${COLORS.red}` }} />
                  <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Go To War</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.22)', border: `1.5px solid ${COLORS.emerald}` }} />
                  <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Hold Your Ground</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(245, 158, 11, 0.22)', border: `1.5px solid ${COLORS.amber}` }} />
                  <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Take a Closer Look</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Territory Stats */}
        <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.card }}>
          <h4 className="font-semibold mb-3" style={{ fontSize: '14px', color: COLORS.text }}>
            Territory Stats
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Competitors in Range</span>
              <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.text }}>
                {competitorsInRadius.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>ZIP Codes Covered</span>
              <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.text }}>
                {regions.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Your Inventory</span>
              <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.emerald }}>
                {selectedDealer ? inventoryCounts[selectedDealer.id] || 0 : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Competitor Inventory</span>
              <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.amber }}>
                {competitorsInRadius.reduce((sum, d) => sum + (inventoryCounts[d.id] || 0), 0)}
              </span>
            </div>
            {marketTotals.dealerSales > 0 && (
              <>
                <div className="flex justify-between">
                  <span style={{ fontSize: '13px', color: COLORS.textMuted }}>
                    Dealer Sales{selectedModel !== 'all' ? ` (${selectedModel})` : ''}
                  </span>
                  <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.emerald }}>
                    {marketTotals.dealerSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Market Sales</span>
                  <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.text }}>
                    {marketTotals.allSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Go To War ZIPs</span>
                  <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.red }}>
                    {marketTotals.goToWarCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Hold Your Ground</span>
                  <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.emerald }}>
                    {marketTotals.holdGroundCount}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Data Sources */}
        <div className="rounded-xl p-4" style={{ backgroundColor: COLORS.card }}>
          <h4 className="font-semibold mb-3" style={{ fontSize: '14px', color: COLORS.text }}>
            Data Sources
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.emerald }} />
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Inventory (Live)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.blue }} />
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Autoflyte Edge Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.slate }} />
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Census Demographics</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.border, color: COLORS.textMuted }}>
                Soon
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.slate }} />
              <span style={{ fontSize: '13px', color: COLORS.textMuted }}>Traffic API</span>
              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: COLORS.border, color: COLORS.textMuted }}>
                Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Intelligence Scorecards */}
      {modelScorecards.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-4" style={{ fontSize: '16px', color: COLORS.text }}>
            Model Intelligence — {selectedDealership}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelScorecards.map((m) => {
              const tierColor = m.topTier === 'Go To War' ? COLORS.red
                : m.topTier === 'Hold Your Ground' ? COLORS.emerald
                : COLORS.amber;
              const tierIcon = m.topTier === 'Go To War' ? '🔴'
                : m.topTier === 'Hold Your Ground' ? '🟢' : '🟡';
              const shareDisplay = m.allSales > 0
                ? ((m.dealerSales / m.allSales) * 100).toFixed(1)
                : (m.avgShare * 100).toFixed(1);
              return (
                <div key={m.model} className="rounded-xl p-4"
                  style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold" style={{ fontSize: '15px', color: COLORS.text }}>
                      {m.model}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-semibold"
                      style={{ backgroundColor: `${tierColor}22`, color: tierColor, border: `1px solid ${tierColor}44` }}>
                      {tierIcon} {m.topTier || 'N/A'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Dealer Sales</span>
                      <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.emerald }}>
                        {m.dealerSales.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Market Sales</span>
                      <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.text }}>
                        {m.allSales.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Market Share</span>
                      <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.blue }}>
                        {shareDisplay}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: '12px', color: COLORS.textMuted }}>ZIPs Tracked</span>
                      <span className="font-semibold" style={{ fontSize: '13px', color: COLORS.text }}>
                        {m.zipCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ fontSize: '12px', color: COLORS.textMuted }}>Live Inventory</span>
                      <span className="font-semibold" style={{ fontSize: '13px', color: m.inventoryCount > 0 ? COLORS.amber : COLORS.red }}>
                        {m.inventoryCount > 0 ? m.inventoryCount.toLocaleString() : 'No stock'}
                      </span>
                    </div>
                    {(m.goToWarZips > 0 || m.holdGroundZips > 0 || m.closerLookZips > 0) && (
                      <div className="flex gap-3 pt-1" style={{ borderTop: `1px solid ${COLORS.border}` }}>
                        {m.goToWarZips > 0 && (
                          <span style={{ fontSize: '11px', color: COLORS.red }}>
                            🔴 {m.goToWarZips} conquest
                          </span>
                        )}
                        {m.holdGroundZips > 0 && (
                          <span style={{ fontSize: '11px', color: COLORS.emerald }}>
                            🟢 {m.holdGroundZips} hold
                          </span>
                        )}
                        {m.closerLookZips > 0 && (
                          <span style={{ fontSize: '11px', color: COLORS.amber }}>
                            🟡 {m.closerLookZips} watch
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ZIP Regions Table (expandable) */}
      {showRegions && regions.length > 0 && (
        <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: COLORS.card }}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold" style={{ fontSize: '16px', color: COLORS.text }}>
              Covered ZIP Codes ({regions.length})
            </h4>
            <button
              onClick={() => {
                const header = 'County,City,ZIP Code';
                const rows = regions.map(r =>
                  `${r.county || ''},${r.city || ''},${r.zip_code}`
                );
                const csv = [header, ...rows].join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedDealership.replace(/[^a-zA-Z0-9]/g, '_')}_${radiusMiles}mi_zips.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: COLORS.emerald,
                border: `1px solid ${COLORS.emerald}`,
              }}
            >
              ↓ Export CSV
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {regions.map((region) => (
              <div
                key={region.id}
                className="px-3 py-2 rounded text-center"
                style={{
                  backgroundColor: COLORS.dark,
                  border: `1px solid ${COLORS.border}`,
                }}
              >
                <span className="font-mono" style={{ fontSize: '13px', color: COLORS.text }}>
                  {region.zip_code}
                </span>
                {region.city && (
                  <span className="block truncate" style={{ fontSize: '11px', color: COLORS.textMuted }}>
                    {region.city}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConquestMap;
