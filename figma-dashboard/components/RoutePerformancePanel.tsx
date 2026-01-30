'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';

interface SEOMetric {
  id: string;
  name: string;
  activeVehicles: number;
  avgDelay: number;
  onTimeRate: number;
  criticalIssues: number;
  status: 'optimal' | 'warning' | 'critical';
}

const SEOPerformancePanel = () => {
  const mockSEO: SEOMetric[] = [
    {
      id: 'SEO-001',
      name: 'West Virginia Market',
      activeVehicles: 24,
      avgDelay: 2.5,
      onTimeRate: 87,
      criticalIssues: 1,
      status: 'warning'
    },
    {
      id: 'SEO-002',
      name: 'Charleston Metro',
      activeVehicles: 18,
      avgDelay: 0.8,
      onTimeRate: 94,
      criticalIssues: 0,
      status: 'optimal'
    },
    {
      id: 'SEO-003',
      name: 'Regional Network',
      activeVehicles: 31,
      avgDelay: 4.2,
      onTimeRate: 76,
      criticalIssues: 3,
      status: 'critical'
    },
    {
      id: 'SEO-004',
      name: 'Southern Gateway',
      activeVehicles: 15,
      avgDelay: 1.5,
      onTimeRate: 91,
      criticalIssues: 0,
      status: 'optimal'
    }
  ];

  const getStatusColor = (status: SEOMetric['status']) => {
    switch (status) {
      case 'optimal': return 'text-success';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: SEOMetric['status']) => {
    switch (status) {
      case 'optimal': return 'CheckCircleIcon';
      case 'warning': return 'ExclamationTriangleIcon';
      case 'critical': return 'XCircleIcon';
      default: return 'QuestionMarkCircleIcon';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">SEO Performance</h2>
        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-smooth">
          <Icon name="ArrowPathIcon" size={16} />
        </button>
      </div>

      {/* SEO Metrics */}
      <div className="space-y-4">
        {mockSEO.map((seo) => (
          <div key={seo.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-foreground">{seo.name}</h3>
                <p className="text-xs text-muted-foreground">{seo.id}</p>
              </div>
              <div className={`flex items-center space-x-1 ${getStatusColor(seo.status)}`}>
                <Icon name={getStatusIcon(seo.status) as any} size={16} />
                <span className="text-xs font-medium capitalize">{seo.status}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-muted-foreground">Active Vehicles</div>
                <div className="text-lg font-semibold text-foreground">{seo.activeVehicles}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Avg Delay</div>
                <div className="text-lg font-semibold text-foreground">{seo.avgDelay}h</div>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">On-Time Rate</span>
                <span className="text-foreground font-medium">{seo.onTimeRate}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    seo.onTimeRate >= 90 ? 'bg-success' : 
                    seo.onTimeRate >= 80 ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{ width: `${seo.onTimeRate}%` }}
                ></div>
              </div>
            </div>

            {seo.criticalIssues > 0 && (
              <div className="flex items-center space-x-2 p-2 bg-destructive/10 rounded-lg">
                <Icon name="ExclamationTriangleIcon" size={14} className="text-destructive" />
                <span className="text-xs text-destructive font-medium">
                  {seo.criticalIssues} critical issue{seo.criticalIssues > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Optimization Recommendations */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-medium text-foreground mb-3 flex items-center space-x-2">
          <Icon name="LightBulbIcon" size={16} className="text-warning" />
          <span>Optimization Recommendations</span>
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-primary/5 rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-sm font-medium text-foreground">Improve Regional Network SEO</div>
              <div className="text-xs text-muted-foreground mt-1">
                Consider keyword optimization to reduce 4.2h average response time
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-warning/5 rounded-lg">
            <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-sm font-medium text-foreground">Market Trend Alert</div>
              <div className="text-xs text-muted-foreground mt-1">
                Seasonal demand affecting West Virginia market through Thursday
              </div>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-success/5 rounded-lg">
            <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <div className="text-sm font-medium text-foreground">Visibility Optimization</div>
              <div className="text-xs text-muted-foreground mt-1">
                Charleston Metro has 15% available capacity for urgent campaigns
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="font-medium text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-2">
          <button className="flex items-center justify-between p-3 text-left hover:bg-muted rounded-lg transition-smooth">
            <div className="flex items-center space-x-3">
              <Icon name="MapIcon" size={16} className="text-primary" />
              <span className="text-sm text-foreground">View SEO Map</span>
            </div>
            <Icon name="ChevronRightIcon" size={14} className="text-muted-foreground" />
          </button>
          
          <button className="flex items-center justify-between p-3 text-left hover:bg-muted rounded-lg transition-smooth">
            <div className="flex items-center space-x-3">
              <Icon name="ClockIcon" size={16} className="text-warning" />
              <span className="text-sm text-foreground">Schedule Analysis</span>
            </div>
            <Icon name="ChevronRightIcon" size={14} className="text-muted-foreground" />
          </button>
          
          <button className="flex items-center justify-between p-3 text-left hover:bg-muted rounded-lg transition-smooth">
            <div className="flex items-center space-x-3">
              <Icon name="ExclamationTriangleIcon" size={16} className="text-destructive" />
              <span className="text-sm text-foreground">Critical Issues</span>
            </div>
            <Icon name="ChevronRightIcon" size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SEOPerformancePanel;