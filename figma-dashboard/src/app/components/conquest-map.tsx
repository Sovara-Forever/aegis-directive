/**
 * Conquest Map Component - Aegis Intelligence
 * 50-mile radius competitive territory visualization
 *
 * Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
 * Created: 2026-02-25
 */

import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { supabase } from '../../../lib/supabase';
import { MapPin, Target, Users, Package, ChevronDown } from 'lucide-react';

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

export function ConquestMap({ selectedDealership }: ConquestMapProps) {
  const [dealerships, setDealerships] = useState<Dealership[]>([]);
  const [regions, setRegions] = useState<GeographicRegion[]>([]);
  const [loading, setLoading] = useState(true);
  const [radiusMiles, setRadiusMiles] = useState(50);
  const [showRegions, setShowRegions] = useState(false);
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});

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

        // Fetch inventory counts per dealership
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .select('dealership_id');

        if (!invError && invData) {
          const counts: Record<string, number> = {};
          invData.forEach((inv: { dealership_id: string }) => {
            counts[inv.dealership_id] = (counts[inv.dealership_id] || 0) + 1;
          });
          setInventoryCounts(counts);
        }

        // Check which dealers have sales data (market_sales)
        const { data: salesData } = await supabase
          .from('market_sales')
          .select('dealership_id')
          .limit(1000);

        const dealersWithSales = new Set(salesData?.map((s: { dealership_id: string }) => s.dealership_id) || []);

        // Enrich dealership data
        const enrichedDealers = (dealerData || []).map((d: Dealership) => ({
          ...d,
          inventory_count: inventoryCounts[d.id] || 0,
          has_sales_data: dealersWithSales.has(d.id),
        }));

        setDealerships(enrichedDealers);

        // Fetch geographic regions for selected dealer
        const selectedDealer = enrichedDealers.find(
          (d: Dealership) => d.name === selectedDealership
        );
        if (selectedDealer) {
          const { data: regionData } = await supabase
            .from('geographic_regions')
            .select('*')
            .eq('primary_dealer_id', selectedDealer.id)
            .order('distance_miles', { ascending: true });

          setRegions(regionData || []);
        }
      } catch (error) {
        console.error('Error loading map data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedDealership]);

  // Find selected dealer
  const selectedDealer = useMemo(() => {
    return dealerships.find((d) => d.name === selectedDealership);
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

  // Map center and zoom
  const mapCenter: [number, number] = selectedDealer
    ? [selectedDealer.latitude, selectedDealer.longitude]
    : [38.4, -82.4]; // Default to WV area

  const mapZoom = radiusMiles <= 25 ? 10 : radiusMiles <= 50 ? 9 : 8;
  const radiusMeters = radiusMiles * 1609.34;

  // Radius options
  const radiusOptions = [
    { value: 25, label: '25 mi' },
    { value: 50, label: '50 mi' },
    { value: 100, label: '100 mi' },
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
            <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${COLORS.border}` }}>
              {radiusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRadiusMiles(opt.value)}
                  className="px-4 py-2 transition-colors"
                  style={{
                    backgroundColor: radiusMiles === opt.value ? COLORS.emerald : COLORS.card,
                    color: radiusMiles === opt.value ? COLORS.dark : COLORS.textMuted,
                    fontSize: '14px',
                    fontWeight: radiusMiles === opt.value ? '600' : '400',
                  }}
                >
                  {opt.label}
                </button>
              ))}
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
                    <div className="flex items-center gap-2 text-sm">
                      <Package size={14} style={{ color: COLORS.emerald }} />
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
                    <div className="flex items-center gap-2 text-sm">
                      <Package size={14} />
                      <span>{inventoryCounts[dealer.id] || 0} vehicles</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

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

      {/* ZIP Regions Table (expandable) */}
      {showRegions && regions.length > 0 && (
        <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: COLORS.card }}>
          <h4 className="font-semibold mb-4" style={{ fontSize: '16px', color: COLORS.text }}>
            Covered ZIP Codes ({regions.length})
          </h4>
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
