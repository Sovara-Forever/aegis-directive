'use client';

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Icon from '@/components/ui/AppIcon';
import 'leaflet/dist/leaflet.css';

interface VehiclePin {
  id: string;
  lat: number;
  lng: number;
  status: 'on-time' | 'delayed' | 'critical';
  vehicleId: string;
  origin: string;
  destination: string;
  eta: string;
}

interface GlobalMapProps {
  vehicles: VehiclePin[];
  onPinClick?: (vehicle: VehiclePin) => void;
}

const GlobalMap = ({ vehicles, onPinClick }: GlobalMapProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedPin, setSelectedPin] = useState<VehiclePin | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="w-full h-96 bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center">
          <Icon name="MapIcon" size={48} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-time': return '#3b82f6'; // Blue
      case 'delayed': return '#ef4444'; // Red
      case 'critical': return '#ef4444'; // Red
      default: return '#6b7280';
    }
  };

  const createCustomIcon = (status: string) => {
    const color = getStatusColor(status);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
  };

  const handlePinClick = (vehicle: VehiclePin) => {
    setSelectedPin(vehicle);
    onPinClick?.(vehicle);
  };

  // Charleston, WV coordinates
  const charlestonCenter: [number, number] = [38.3498, -81.6326];

  return (
    <div className="relative w-full h-96 bg-card rounded-xl overflow-hidden border border-border">
      <MapContainer
        center={charlestonCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={[vehicle.lat, vehicle.lng]}
            icon={createCustomIcon(vehicle.status)}
            eventHandlers={{
              click: () => handlePinClick(vehicle)
            }}
          >
            <Popup>
              <div className="text-sm">
                <h4 className="font-semibold mb-1">{vehicle.origin}</h4>
                <p className="text-xs text-gray-600">ID: {vehicle.vehicleId}</p>
                <p className="text-xs text-gray-600">{vehicle.eta}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-gray-900/95 backdrop-blur-sm rounded-lg p-3 shadow-lg z-[1000]">
        <h4 className="text-sm font-semibold mb-2 text-white">Dealership Status</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-xs text-gray-300">My Dealership</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-xs text-gray-300">Competitors</span>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {selectedPin && (
        <div className="absolute top-4 left-4 bg-gray-900 rounded-lg p-4 shadow-lg max-w-xs z-[1000]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-white">{selectedPin.origin}</h4>
            <button
              onClick={() => setSelectedPin(null)}
              className="text-gray-400 hover:text-gray-200"
            >
              <Icon name="XMarkIcon" size={16} />
            </button>
          </div>
          <div className="space-y-1 text-xs text-gray-300">
            <p><span className="font-medium">ID:</span> {selectedPin.vehicleId}</p>
            <p><span className="font-medium">Location:</span> {selectedPin.destination}</p>
            <p><span className="font-medium">Status:</span> {selectedPin.eta}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalMap;