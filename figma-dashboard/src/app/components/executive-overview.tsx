import { KPICard } from './kpi-card';
import { Package, DollarSign, TrendingUp, Search } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';

const inventoryData = [
  { model: 'Silverado 1500', stock: 71, velocity: 8.5 },
  { model: 'Silverado 2500', stock: 58, velocity: 6.2 },
  { model: 'Equinox', stock: 37, velocity: 9.8 },
  { model: 'Trax', stock: 33, velocity: 7.4 },
  { model: 'Silverado 3500', stock: 17, velocity: 4.1 },
];

const seoKeywords = [
  { keyword: 'chevrolet dealers near me', rank: 95, clicks: 42800, status: 'danger' },
  { keyword: 'chevy suv', rank: 6, clicks: 2800, status: 'success' },
  { keyword: 'midstate chevy', rank: 1, clicks: 320, status: 'success' },
  { keyword: 'flatwoods chevrolet', rank: 2, clicks: 180, status: 'success' },
  { keyword: 'chevy silverado near me', rank: 28, clicks: 5200, status: 'warning' },
];

export function ExecutiveOverview() {
  const [activeTab, setActiveTab] = useState('inventory');

  const tabs = [
    { id: 'inventory', label: 'Inventory Velocity' },
    { id: 'seo', label: 'SEO Performance' },
    { id: 'competitor', label: 'Competitor Gaps' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-semibold mb-2" style={{ fontSize: '36px', color: '#F1F5F9' }}>
          Mid-State Chevrolet • Flatwoods, WV
        </h1>
        <p style={{ fontSize: '18px', color: '#94A3B8' }}>
          50-Mile Conquest Dashboard • Last refresh: 2 min ago
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <KPICard
          metric="Live Inventory"
          value="306"
          sub="vehicles in stock"
          change="+12 this week"
          variant="info"
          icon={Package}
        />
        <KPICard
          metric="Monthly Sales"
          value="121"
          sub="new units (avg)"
          change="+8.3% MoM"
          variant="success"
          icon={DollarSign}
        />
        <KPICard
          metric="Local Market Share"
          value="15.5%"
          sub="50-mi radius"
          change="+2.1%"
          variant="success"
          icon={TrendingUp}
        />
        <KPICard
          metric="Est. SEO Traffic"
          value="~81K"
          sub="monthly clicks"
          change="+15.7%"
          variant="warning"
          icon={Search}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b" style={{ borderColor: '#334155' }}>
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="pb-3 relative transition-colors"
              style={{
                fontSize: '16px',
                color: activeTab === tab.id ? '#F1F5F9' : '#94A3B8',
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div
                  className="absolute bottom-0 left-0 right-0"
                  style={{
                    height: '3px',
                    backgroundColor: '#0066CC',
                  }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Section */}
      {activeTab === 'inventory' && (
        <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: '#1E293B' }}>
          <h3 className="mb-6 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
            Top Models by Stock vs Velocity
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={inventoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="model" 
                stroke="#94A3B8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="left"
                stroke="#94A3B8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#94A3B8"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1E293B', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#F1F5F9'
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="stock" 
                fill="#0EA5E9" 
                name="Stock Count"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right"
                dataKey="velocity" 
                fill="#10B981" 
                name="Sales/Week"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="rounded-xl p-6" style={{ backgroundColor: '#1E293B' }}>
          <h3 className="mb-6 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
            SEO Keyword Rankings
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th className="text-left p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                    Keyword
                  </th>
                  <th className="text-left p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                    Your Rank
                  </th>
                  <th className="text-left p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                    Est. Clicks
                  </th>
                  <th className="text-left p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                    Opportunity
                  </th>
                </tr>
              </thead>
              <tbody>
                {seoKeywords.map((keyword, index) => {
                  const statusColors = {
                    success: '#10B981',
                    warning: '#F59E0B',
                    danger: '#EF4444',
                  };
                  const statusLabels = {
                    success: '🟢 Strong hold',
                    warning: '🟡 Opportunity',
                    danger: '🔴 Massive leak',
                  };

                  return (
                    <tr 
                      key={index}
                      style={{ 
                        borderBottom: index !== seoKeywords.length - 1 ? '1px solid #334155' : 'none'
                      }}
                    >
                      <td className="p-3" style={{ fontSize: '14px', color: '#F1F5F9' }}>
                        {keyword.keyword}
                      </td>
                      <td className="p-3">
                        <span 
                          className="px-2 py-1 rounded"
                          style={{ 
                            fontSize: '14px',
                            backgroundColor: keyword.rank <= 10 ? '#10B98120' : keyword.rank <= 30 ? '#F59E0B20' : '#EF444420',
                            color: keyword.rank <= 10 ? '#10B981' : keyword.rank <= 30 ? '#F59E0B' : '#EF4444',
                          }}
                        >
                          #{keyword.rank}
                        </span>
                      </td>
                      <td className="p-3" style={{ fontSize: '14px', color: '#F1F5F9' }}>
                        {keyword.clicks.toLocaleString()}
                      </td>
                      <td className="p-3" style={{ fontSize: '14px', color: statusColors[keyword.status as keyof typeof statusColors] }}>
                        {statusLabels[keyword.status as keyof typeof statusLabels]}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'competitor' && (
        <div className="rounded-xl p-6" style={{ backgroundColor: '#1E293B' }}>
          <h3 className="mb-6 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
            Competitive Gap Analysis
          </h3>
          <div className="space-y-4">
            <div className="p-4 rounded-lg" style={{ backgroundColor: '#0F172A' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                  Harry Green Chevrolet
                </span>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>~35 mi</span>
              </div>
              <p className="mb-2" style={{ fontSize: '14px', color: '#94A3B8' }}>
                Est. 90-110 units/mo • #1 "chevy dealer clarksburg wv"
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded" style={{ backgroundColor: '#10B98120', color: '#10B981', fontSize: '12px' }}>
                  Opportunity: Conquest with Equinox/Trax pages
                </span>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: '#0F172A' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                  Northside Chevrolet GMC
                </span>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>~42 mi</span>
              </div>
              <p className="mb-2" style={{ fontSize: '14px', color: '#94A3B8' }}>
                Est. 100+ units/mo • Strong GMC truck content
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded" style={{ backgroundColor: '#10B98120', color: '#10B981', fontSize: '12px' }}>
                  Opportunity: Target "gm dealers near me" overflow
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
