'use client';

import React, { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface DisruptionAlert {
  id: string;
  type: 'weather' | 'traffic' | 'port' | 'mechanical' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedRoutes: string[];
  estimatedImpact: string;
  timestamp: string;
  isActive: boolean;
}

const DisruptionAlerts = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');

  const mockAlerts: DisruptionAlert[] = [
    {
      id: 'ALT-001',
      type: 'weather',
      severity: 'high',
      title: 'Severe Storm Warning',
      description: 'Major storm system affecting Pacific Northwest region with high winds and heavy precipitation expected through Thursday.',
      affectedRoutes: ['West Coast Express', 'Northern Gateway'],
      estimatedImpact: '6-12 hour delays',
      timestamp: '2024-11-19 03:30',
      isActive: true
    },
    {
      id: 'ALT-002',
      type: 'port',
      severity: 'critical',
      title: 'Port of Los Angeles Congestion',
      description: 'Severe congestion at Port of Los Angeles due to equipment failure. Container processing delays expected.',
      affectedRoutes: ['West Coast Express', 'Southern Gateway'],
      estimatedImpact: '24-48 hour delays',
      timestamp: '2024-11-19 02:15',
      isActive: true
    },
    {
      id: 'ALT-003',
      type: 'traffic',
      severity: 'medium',
      title: 'Interstate 95 Construction',
      description: 'Lane closures on I-95 between Baltimore and Philadelphia causing significant traffic delays.',
      affectedRoutes: ['East Coast Corridor'],
      estimatedImpact: '2-4 hour delays',
      timestamp: '2024-11-19 01:45',
      isActive: true
    },
    {
      id: 'ALT-004',
      type: 'mechanical',
      severity: 'low',
      title: 'Vehicle Breakdown Resolved',
      description: 'Truck breakdown on Route 40 has been resolved. Traffic flow returning to normal.',
      affectedRoutes: ['Central Hub Network'],
      estimatedImpact: 'Minimal impact',
      timestamp: '2024-11-18 22:30',
      isActive: false
    }
  ];

  const getSeverityColor = (severity: DisruptionAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: DisruptionAlert['type']) => {
    switch (type) {
      case 'weather': return 'CloudIcon';
      case 'traffic': return 'ExclamationTriangleIcon';
      case 'port': return 'BuildingOfficeIcon';
      case 'mechanical': return 'WrenchScrewdriverIcon';
      case 'security': return 'ShieldExclamationIcon';
      default: return 'InformationCircleIcon';
    }
  };

  const filteredAlerts = mockAlerts.filter(alert => 
    activeTab === 'active' ? alert.isActive : !alert.isActive
  );

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Disruption Alerts</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 px-2 py-1 bg-destructive/10 text-destructive rounded-lg">
              <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">
                {mockAlerts.filter(a => a.isActive).length} Active
              </span>
            </div>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-smooth">
              <Icon name="ArrowPathIcon" size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-4 bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-smooth ${
              activeTab === 'active' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Alerts ({mockAlerts.filter(a => a.isActive).length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-smooth ${
              activeTab === 'resolved' ?'bg-card text-foreground shadow-sm' :'text-muted-foreground hover:text-foreground'
            }`}
          >
            Resolved ({mockAlerts.filter(a => !a.isActive).length})
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredAlerts.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className="p-6 hover:bg-muted/50 transition-smooth">
                <div className="flex items-start space-x-4">
                  {/* Severity Indicator */}
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`}></div>
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Icon name={getTypeIcon(alert.type) as any} size={16} className="text-muted-foreground" />
                        <h3 className="text-sm font-medium text-foreground">{alert.title}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                          alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                          alert.severity === 'medium'? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center space-x-1">
                        <Icon name="MapPinIcon" size={12} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Affected Routes:</span>
                        <span className="text-foreground font-medium">
                          {alert.affectedRoutes.join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Icon name="ClockIcon" size={12} className="text-muted-foreground" />
                        <span className="text-muted-foreground">Impact:</span>
                        <span className="text-foreground font-medium">{alert.estimatedImpact}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {alert.isActive && (
                      <div className="flex items-center space-x-2 mt-3">
                        <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-smooth">
                          View Details
                        </button>
                        <button className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted transition-smooth">
                          Acknowledge
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Icon 
              name={activeTab === 'active' ? 'CheckCircleIcon' : 'ClockIcon'} 
              size={48} 
              className="mx-auto text-muted-foreground mb-4" 
            />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {activeTab === 'active' ? 'No Active Alerts' : 'No Resolved Alerts'}
            </h3>
            <p className="text-muted-foreground">
              {activeTab === 'active' ?'All systems are operating normally.' :'No recently resolved alerts to display.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredAlerts.length > 0 && (
        <div className="px-6 py-3 border-t border-border bg-muted/25">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Last updated: {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
            <button className="text-primary hover:text-primary/80 transition-smooth">
              View All Alerts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisruptionAlerts;