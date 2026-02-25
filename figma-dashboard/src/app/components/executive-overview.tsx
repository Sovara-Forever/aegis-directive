import { KPICard } from './kpi-card';
import { Package, DollarSign, TrendingUp, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface InventoryVehicle {
  id: string;
  dealership_id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price?: number;
  msrp?: number;
  savings?: number;
}

interface KeywordRanking {
  id: string;
  dealership_id: string;
  keyword: string;
  search_volume?: number;
  ranking_position?: number;
  ranking_url?: string;
  cpc?: number;
  difficulty_score?: number;
  tracked_date?: string;
}

interface ExecutiveOverviewProps {
  selectedDealership: string;
}

export function ExecutiveOverview({ selectedDealership }: ExecutiveOverviewProps) {
  const [activeTab, setActiveTab] = useState('inventory');
  const [inventory, setInventory] = useState<InventoryVehicle[]>([]);
  const [keywords, setKeywords] = useState<KeywordRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealershipId, setDealershipId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Step 1: Look up dealership UUID from name
        const { data: dealerData, error: dealerError } = await supabase
          .from('dealerships')
          .select('id')
          .eq('name', selectedDealership)
          .single();

        if (dealerError) {
          console.error('Dealership lookup error:', dealerError);
          setInventory([]);
          setKeywords([]);
          setLoading(false);
          return;
        }

        const dId = dealerData?.id;
        setDealershipId(dId);

        if (!dId) {
          console.error('Dealership not found:', selectedDealership);
          setInventory([]);
          setKeywords([]);
          setLoading(false);
          return;
        }

        // Step 2: Fetch inventory for selected dealership (UUID schema)
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .select('*')
          .eq('dealership_id', dId);

        if (invError) throw invError;
        setInventory(invData || []);

        // Step 3: Fetch keyword rankings for dealership (from seo_keywords table with CPC)
        const { data: kwData, error: kwError } = await supabase
          .from('seo_keywords')
          .select('*')
          .eq('dealership_id', dId)
          .order('cpc', { ascending: false })
          .limit(20);

        if (kwError) throw kwError;
        setKeywords(kwData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedDealership]);

  // Calculate inventory velocity (top 5 models by count)
  const inventoryByModel = inventory
    .reduce((acc: Record<string, { model: string; stock: number; avgPrice: number; totalPrice: number }>, vehicle) => {
      const key = `${vehicle.make} ${vehicle.model}`;
      if (!acc[key]) {
        acc[key] = { model: key, stock: 0, avgPrice: 0, totalPrice: 0 };
      }
      acc[key].stock++;
      acc[key].totalPrice += vehicle.price || 0;
      acc[key].avgPrice = acc[key].totalPrice / acc[key].stock;
      return acc;
    }, {});

  const inventoryData = Object.values(inventoryByModel)
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)
    .map(m => ({
      model: m.model,
      stock: m.stock,
      velocity: parseFloat((m.stock / 30 * 7).toFixed(1))  // Estimate: velocity = stock/30 days * 7
    }));

  // Position-based CTR estimates for organic search
  const getCTR = (rank: number) => {
    if (rank === 0 || rank > 100) return 0.001;
    if (rank === 1) return 0.30;
    if (rank <= 3) return 0.15;
    if (rank <= 10) return 0.05;
    if (rank <= 30) return 0.01;
    return 0.001;
  };

  // Map keywords for display with CPC-based traffic value
  const seoKeywords = keywords.slice(0, 5).map(kw => {
    const rank = kw.ranking_position || 100;
    const volume = kw.search_volume || 0;
    const cpc = kw.cpc || 2.50;  // Default $2.50 if missing
    const ctr = getCTR(rank);
    const estClicks = Math.round(volume * ctr);
    const trafficValue = estClicks * cpc;

    return {
      keyword: kw.keyword,
      rank,
      searchVolume: volume,
      cpc,
      estClicks,
      trafficValue,
      status: rank <= 10 ? 'success' : rank <= 30 ? 'warning' : 'danger',
    };
  });

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
          {selectedDealership}
        </h1>
        <p style={{ fontSize: '18px', color: '#94A3B8' }}>
          50-Mile Conquest Dashboard {loading ? '• Loading...' : `• ${inventory.length} vehicles in stock`}
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <KPICard
          metric="Live Inventory"
          value={loading ? "..." : inventory.length.toString()}
          sub="vehicles in stock"
          change={loading ? "" : `${selectedDealership}`}
          variant="info"
          trend="neutral"
          icon={Package}
        />
        <KPICard
          metric="Top Keyword VCP"
          value={loading ? "..." : keywords.length > 0 ? `$${keywords[0].cpc?.toFixed(2) || '0.00'}` : "$0.00"}
          sub="value per click (SEO potential)"
          change={loading ? "" : keywords.length > 0 ? keywords[0].keyword : "No data"}
          variant="success"
          trend="neutral"
          icon={DollarSign}
        />
        <KPICard
          metric="Market Metrics"
          value="Coming Soon"
          sub="sales data integration"
          change="MAP data ready"
          variant="success"
          trend="neutral"
          icon={TrendingUp}
        />
        <KPICard
          metric="Est. SEO Value"
          value={loading ? "..." : `$${Math.round(keywords.reduce((sum, k) => sum + ((k.search_volume || 0) * 0.05 * (k.cpc || 2.50)), 0)).toLocaleString()}`}
          sub="monthly traffic value"
          change={loading ? "" : `${keywords.length} keywords tracked`}
          variant="warning"
          trend="neutral"
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
                    backgroundColor: '#10B981',
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
                    CPC
                  </th>
                  <th className="text-left p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                    Traffic Value
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
                        ${keyword.cpc.toFixed(2)}
                      </td>
                      <td className="p-3" style={{ fontSize: '14px', color: '#10B981' }}>
                        ${keyword.trafficValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}/mo
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
