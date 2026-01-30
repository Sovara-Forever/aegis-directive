'use client';

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';

const LiveDataIndicator = () => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate occasional connection issues
      setIsLive(Math.random() > 0.1);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex items-center space-x-3 px-4 py-2 bg-card rounded-lg border border-border">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-success animate-pulse' : 'bg-warning'}`}></div>
        <span className="text-sm font-medium text-foreground">
          {isLive ? 'Live' : 'Reconnecting...'}
        </span>
      </div>
      
      <div className="h-4 w-px bg-border"></div>
      
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Icon name="ClockIcon" size={14} />
        <span className="text-xs">
          Last update: {formatTime(lastUpdate)}
        </span>
      </div>
      
      <button 
        className="p-1 hover:bg-muted rounded transition-smooth"
        title="Refresh data"
      >
        <Icon name="ArrowPathIcon" size={14} />
      </button>
    </div>
  );
};

export default LiveDataIndicator;