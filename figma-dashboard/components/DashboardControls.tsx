'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface DashboardControlsProps {
  onDateRangeChange?: (range: string) => void;
  onRegionChange?: (region: string) => void;
  onRefreshIntervalChange?: (interval: number) => void;
}

const DashboardControls = ({ 
  onDateRangeChange, 
  onRegionChange, 
  onRefreshIntervalChange 
}: DashboardControlsProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [dateRange, setDateRange] = useState('24h');
  const [region, setRegion] = useState('global');
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center space-x-4">
          <div className="h-8 bg-muted rounded w-32 animate-pulse" />
          <div className="h-8 bg-muted rounded w-24 animate-pulse" />
          <div className="h-8 bg-muted rounded w-20 animate-pulse" />
        </div>
      </div>
    );
  }

  const handleDateRangeChange = (newRange: string) => {
    setDateRange(newRange);
    onDateRangeChange?.(newRange);
  };

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    onRegionChange?.(newRegion);
  };

  const handleRefreshIntervalChange = (newInterval: number) => {
    setRefreshInterval(newInterval);
    onRefreshIntervalChange?.(newInterval);
  };

  const dateRangeOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  const regionOptions = [
    { value: 'global', label: 'Global' },
    { value: 'north-america', label: 'North America' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia-pacific', label: 'Asia Pacific' }
  ];

  const refreshOptions = [
    { value: 5, label: '5 min' },
    { value: 10, label: '10 min' },
    { value: 15, label: '15 min' }
  ];

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <div className="flex flex-wrap items-center gap-4">
        {/* Date Range Selector */}
        <div className="flex items-center space-x-2">
          <Icon name="CalendarIcon" size={16} className="text-muted-foreground" />
          <select
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
            className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Region Filter */}
        <div className="flex items-center space-x-2">
          <Icon name="GlobeAltIcon" size={16} className="text-muted-foreground" />
          <select
            value={region}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {regionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Auto Refresh Toggle */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-smooth ${
              isAutoRefresh 
                ? 'bg-success text-success-foreground' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <Icon name="ArrowPathIcon" size={16} />
            <span>Auto Refresh</span>
          </button>
          
          {isAutoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => handleRefreshIntervalChange(Number(e.target.value))}
              className="bg-muted border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {refreshOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Manual Refresh */}
        <button className="flex items-center space-x-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-smooth">
          <Icon name="ArrowPathIcon" size={16} />
          <span>Refresh Now</span>
        </button>

        {/* Last Updated */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground ml-auto">
          <Icon name="ClockIcon" size={14} />
          <span>Last updated: 2 min ago</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardControls;