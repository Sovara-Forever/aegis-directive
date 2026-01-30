'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  vehicleId?: string;
  location?: string;
}

interface LiveAlertsFeedProps {
  alerts: Alert[];
}

const LiveAlertsFeed = ({ alerts }: LiveAlertsFeedProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="BellIcon" size={20} className="text-slate-400" />
          <h3 className="font-semibold text-slate-50">Live Alerts</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return 'ExclamationTriangleIcon';
      case 'warning': return 'ExclamationCircleIcon';
      case 'info': return 'InformationCircleIcon';
      default: return 'BellIcon';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-400 bg-red-500/10';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10';
      case 'info': return 'text-blue-400 bg-blue-500/10';
      default: return 'text-slate-400 bg-slate-700';
    }
  };

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="BellIcon" size={20} className="text-slate-50" />
          <h3 className="font-semibold text-slate-50">Live Alerts</h3>
        </div>
        <div className="flex items-center space-x-1 text-xs text-success">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-start space-x-3 p-3 rounded-lg border border-slate-700 hover:bg-slate-700/50 transition-smooth"
          >
            <div className={`p-1.5 rounded-full ${getAlertColor(alert.type)}`}>
              <Icon name={getAlertIcon(alert.type) as any} size={16} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-slate-50 truncate">
                  {alert.title}
                </h4>
                <span className="text-xs text-slate-400 ml-2">
                  {alert.timestamp}
                </span>
              </div>
              
              <p className="text-xs text-slate-400 mb-2">
                {alert.message}
              </p>
              
              {(alert.vehicleId || alert.location) && (
                <div className="flex items-center space-x-4 text-xs">
                  {alert.vehicleId && (
                    <span className="text-[#0066CC]">#{alert.vehicleId}</span>
                  )}
                  {alert.location && (
                    <span className="text-slate-400">{alert.location}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <button className="w-full text-sm text-[#0066CC] hover:text-[#0052A3] font-medium transition-smooth">
          View All Alerts
        </button>
      </div>
    </div>
  );
};

export default LiveAlertsFeed;