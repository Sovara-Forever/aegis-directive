'use client';

import React, { useState, useEffect } from 'react';
import ShipmentFilters from './ShipmentFilters';
import ShipmentsTable from './ShipmentsTable';
import SEOPerformancePanel from './RoutePerformancePanel';
import DisruptionAlerts from './DisruptionAlerts';

interface FilterState {
  status: string;
  priority: string;
  dateRange: string;
}

const RealTimeTrackingInteractive = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    priority: 'all',
    dateRange: 'all'
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const handleSearchChange = (search: string) => {
    setSearchTerm(search);
  };

  if (!isHydrated) {
    return (
      <div>
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="h-32 bg-muted rounded mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-96 bg-muted rounded"></div>
            </div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <ShipmentFilters 
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
      />

      {/* Main Dashboard Table Section */}
      <div className="mb-6">
        <ShipmentsTable 
          searchTerm={searchTerm}
          filters={filters}
        />
      </div>

      {/* SEO Performance Panel - moved below table */}
      <div className="mb-6">
        <SEOPerformancePanel />
      </div>

      {/* Disruption Alerts */}
      <DisruptionAlerts />
    </div>
  );
};

export default RealTimeTrackingInteractive;