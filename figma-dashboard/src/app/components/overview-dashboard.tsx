import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { KPICard } from './kpi-card';
import { DollarSign, TrendingUp, Target, Percent } from 'lucide-react';

interface OverviewDashboardProps {
  selectedDealership: string;
}

interface Projections {
  newVehicleSales: number;
  usedVehicleSales: number;
  cpoVehicleSales: number;
  totalROCount: number;
  averageROProfit: number;
  marketingExpense: number;
  closeRate: number;
}

interface TrendData {
  weeklyAvg: number;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  actualDOL?: number;
  goalDOL?: number;
}

interface InventoryTrend {
  newTrend: TrendData;
  usedTrend: TrendData;
  cpoTrend: TrendData;
  totalCount: number;
  latestSnapshotDate?: string;
}

export function OverviewDashboard({ selectedDealership }: OverviewDashboardProps) {
  const [projections, setProjections] = useState<Projections>({
    newVehicleSales: 100,
    usedVehicleSales: 50,
    cpoVehicleSales: 10,
    totalROCount: 180,
    averageROProfit: 125,
    marketingExpense: 8500,
    closeRate: 15
  });

  const [inventoryTrend, setInventoryTrend] = useState<InventoryTrend>({
    newTrend: { weeklyAvg: 0, source: 'loading', confidence: 'low' },
    usedTrend: { weeklyAvg: 0, source: 'loading', confidence: 'low' },
    cpoTrend: { weeklyAvg: 0, source: 'loading', confidence: 'low' },
    totalCount: 0
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventoryTrends();
  }, [selectedDealership]);

  // Helper: Match vehicle condition
  function matchesCondition(vehicle: any, condition: 'new' | 'used' | 'cpo'): boolean {
    const mileage = vehicle.mileage || 0;
    const trim = (vehicle.trim || '').toLowerCase();
    const modelName = (vehicle.model_name || '').toLowerCase();

    if (condition === 'new') {
      return mileage < 100 && !trim.includes('certified') && !modelName.includes('certified');
    } else if (condition === 'cpo') {
      return trim.includes('certified') || modelName.includes('certified');
    } else { // 'used'
      return mileage >= 100 && !trim.includes('certified') && !modelName.includes('certified');
    }
  }

  // Helper: Group inventory snapshots by date
  function groupByDate(snapshots: any[]): any[][] {
    const grouped = new Map<string, any[]>();

    snapshots.forEach(vehicle => {
      const date = vehicle.ingested_at ? new Date(vehicle.ingested_at).toDateString() : 'unknown';
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(vehicle);
    });

    return Array.from(grouped.values());
  }

  // Tier 1: Real sales from market_sales table
  async function calculateTier1_RealSales(dealershipId: string, condition: 'new' | 'used' | 'cpo'): Promise<TrendData | null> {
    try {
      const { data: marketData, error } = await supabase
        .from('market_sales')
        .select('units_sold, month, model_name')
        .eq('dealership_id', dealershipId);

      if (error || !marketData || marketData.length === 0) {
        return null;
      }

      const uniqueMonths = new Set(marketData.map(d => d.month)).size;
      if (uniqueMonths === 0) return null;

      const totalSales = marketData
        .filter(d => {
          const modelName = (d.model_name || '').toLowerCase();
          if (condition === 'new') {
            return !modelName.includes('used') && !modelName.includes('certified');
          } else if (condition === 'cpo') {
            return modelName.includes('certified');
          } else {
            return modelName.includes('used') && !modelName.includes('certified');
          }
        })
        .reduce((sum, d) => sum + (d.units_sold || 0), 0);

      const weeklyAvg = Math.floor((totalSales / uniqueMonths / 30) * 7);

      return {
        weeklyAvg,
        source: 'market_sales',
        confidence: 'high'
      };
    } catch (err) {
      console.error('Tier 1 calculation error:', err);
      return null;
    }
  }

  // Tier 2: Inventory delta turn rate
  async function calculateTier2_InventoryDelta(dealershipId: string, condition: 'new' | 'used' | 'cpo', allInventory: any[]): Promise<TrendData | null> {
    try {
      if (!allInventory || allInventory.length === 0) return null;

      const snapshots = groupByDate(allInventory);

      if (snapshots.length < 2) return null;

      const latest = snapshots[0].filter(v => matchesCondition(v, condition));
      const previous = snapshots[1].filter(v => matchesCondition(v, condition));

      const soldVINs = previous
        .map(v => v.vin)
        .filter(vin => !latest.some(v2 => v2.vin === vin));

      const soldCount = soldVINs.length;

      if (soldCount === 0) return null;

      const weeklyTurn = Math.floor((soldCount / 45) * 7);
      const actualDOL = Math.floor((latest.length / soldCount) * 7);

      return {
        weeklyAvg: weeklyTurn,
        source: 'inventory_delta',
        confidence: 'medium',
        actualDOL,
        goalDOL: 45
      };
    } catch (err) {
      console.error('Tier 2 calculation error:', err);
      return null;
    }
  }

  // Tier 3: Simple count fallback (45-day DOL)
  function calculateTier3_SimpleCount(inventory: any[], condition: 'new' | 'used' | 'cpo'): TrendData {
    const count = inventory.filter(v => matchesCondition(v, condition)).length;
    const weeklyAvg = Math.floor((count / 45) * 7);

    return {
      weeklyAvg,
      source: 'inventory_count',
      confidence: 'low',
      goalDOL: 45
    };
  }

  async function loadInventoryTrends() {
    try {
      setLoading(true);

      // Get dealership ID
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealerships')
        .select('id')
        .eq('name', selectedDealership)
        .single();

      if (dealerError || !dealerData) {
        console.error('Dealership not found:', dealerError);
        setLoading(false);
        return;
      }

      const dId = dealerData.id;

      // Fetch inventory with timestamps for delta calculation
      const { data: invData, error: invError } = await supabase
        .from('inventory')
        .select('*')
        .eq('dealership_id', dId)
        .order('ingested_at', { ascending: false });

      if (invError) throw invError;

      const inventory = invData || [];

      // Calculate trends using 3-tier logic
      let newTrend: TrendData;
      let usedTrend: TrendData;
      let cpoTrend: TrendData;

      // Try Tier 1: Real sales data
      const newTier1 = await calculateTier1_RealSales(dId, 'new');
      const usedTier1 = await calculateTier1_RealSales(dId, 'used');
      const cpoTier1 = await calculateTier1_RealSales(dId, 'cpo');

      // Try Tier 2: Inventory delta (if Tier 1 failed)
      const newTier2 = !newTier1 ? await calculateTier2_InventoryDelta(dId, 'new', inventory) : null;
      const usedTier2 = !usedTier1 ? await calculateTier2_InventoryDelta(dId, 'used', inventory) : null;
      const cpoTier2 = !cpoTier1 ? await calculateTier2_InventoryDelta(dId, 'cpo', inventory) : null;

      // Fall back to Tier 3: Simple count
      newTrend = newTier1 || newTier2 || calculateTier3_SimpleCount(inventory, 'new');
      usedTrend = usedTier1 || usedTier2 || calculateTier3_SimpleCount(inventory, 'used');
      cpoTrend = cpoTier1 || cpoTier2 || calculateTier3_SimpleCount(inventory, 'cpo');

      console.log('Reality Check - New:', newTrend.source, newTrend.confidence);
      console.log('Reality Check - Used:', usedTrend.source, usedTrend.confidence);
      console.log('Reality Check - CPO:', cpoTrend.source, cpoTrend.confidence);

      // Get latest snapshot date
      const latestSnapshotDate = inventory.length > 0 && inventory[0].ingested_at
        ? new Date(inventory[0].ingested_at).toLocaleDateString()
        : undefined;

      setInventoryTrend({
        newTrend,
        usedTrend,
        cpoTrend,
        totalCount: inventory.length,
        latestSnapshotDate
      });

    } catch (error) {
      console.error('Error loading inventory trends:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (field: keyof Projections, value: number) => {
    setProjections(prev => ({ ...prev, [field]: value }));
  };

  // Calculate metrics
  const avgNewPrice = 35000;
  const avgUsedPrice = 22000;
  const avgCPOPrice = 28000;

  const totalSalesRevenue =
    (projections.newVehicleSales * avgNewPrice) +
    (projections.usedVehicleSales * avgUsedPrice) +
    (projections.cpoVehicleSales * avgCPOPrice);

  const totalRORevenue = projections.totalROCount * projections.averageROProfit;
  const totalRevenue = totalSalesRevenue + totalRORevenue;

  const totalUnits = projections.newVehicleSales + projections.usedVehicleSales + projections.cpoVehicleSales;
  const cpa = totalUnits > 0 ? projections.marketingExpense / totalUnits : 0;

  const totalTrend = inventoryTrend.newTrend.weeklyAvg + inventoryTrend.usedTrend.weeklyAvg + inventoryTrend.cpoTrend.weeklyAvg;
  const goalCompletionProbability = totalTrend > 0 ? Math.min(100, (totalTrend / totalUnits) * 100) : 50;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-semibold mb-2" style={{ fontSize: '36px', color: '#F1F5F9' }}>
          Overview Dashboard
        </h1>
        <p style={{ fontSize: '18px', color: '#94A3B8' }}>
          Reality-check goals against inventory trends for {selectedDealership}
        </p>
      </div>

      {/* Input Forms */}
      <div className="rounded-xl p-6" style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
        <h2 className="text-xl font-semibold mb-6" style={{ color: '#F1F5F9' }}>
          Sales & Marketing Projections
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              New Vehicle Sales (units)
            </label>
            <input
              type="number"
              value={projections.newVehicleSales || ''}
              onChange={(e) => handleInputChange('newVehicleSales', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                backgroundColor: '#0F172A',
                color: '#F1F5F9',
                border: '1px solid #334155'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              Used Vehicle Sales (units)
            </label>
            <input
              type="number"
              value={projections.usedVehicleSales || ''}
              onChange={(e) => handleInputChange('usedVehicleSales', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                backgroundColor: '#0F172A',
                color: '#F1F5F9',
                border: '1px solid #334155'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              CPO Vehicle Sales (units)
            </label>
            <input
              type="number"
              value={projections.cpoVehicleSales || ''}
              onChange={(e) => handleInputChange('cpoVehicleSales', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                backgroundColor: '#0F172A',
                color: '#F1F5F9',
                border: '1px solid #334155'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              Total RO Count
            </label>
            <input
              type="number"
              value={projections.totalROCount || ''}
              onChange={(e) => handleInputChange('totalROCount', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                backgroundColor: '#0F172A',
                color: '#F1F5F9',
                border: '1px solid #334155'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              Avg RO Profit ($)
            </label>
            <input
              type="number"
              value={projections.averageROProfit || ''}
              onChange={(e) => handleInputChange('averageROProfit', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                backgroundColor: '#0F172A',
                color: '#F1F5F9',
                border: '1px solid #334155'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              Marketing Expense ($)
            </label>
            <input
              type="number"
              value={projections.marketingExpense || ''}
              onChange={(e) => handleInputChange('marketingExpense', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                backgroundColor: '#0F172A',
                color: '#F1F5F9',
                border: '1px solid #334155'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
              Close Rate (%)
            </label>
            <input
              type="number"
              value={projections.closeRate || ''}
              onChange={(e) => handleInputChange('closeRate', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 rounded-lg"
              style={{
                backgroundColor: '#0F172A',
                color: '#F1F5F9',
                border: '1px solid #334155'
              }}
              placeholder="15"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          metric="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          sub="Sales + RO Revenue"
          change="Monthly projection"
          variant="success"
          trend="neutral"
          icon={DollarSign}
        />
        <KPICard
          metric="Total Sales"
          value={`${totalUnits} Units`}
          sub="New + Used + CPO"
          change={`${totalTrend}/week trending`}
          variant="info"
          trend="neutral"
          icon={Target}
        />
        <KPICard
          metric="CPA"
          value={`$${cpa.toFixed(0)}`}
          sub="Cost Per Acquisition"
          change={`${totalUnits} unit goal`}
          variant="warning"
          trend="neutral"
          icon={TrendingUp}
        />
        <KPICard
          metric="Goal Probability"
          value={`${goalCompletionProbability.toFixed(0)}%`}
          sub="Based on inventory turn"
          change={loading ? "Loading..." : "From Supabase data"}
          variant="info"
          trend="neutral"
          icon={Percent}
        />
      </div>

      {/* Reality Check Table */}
      <div className="rounded-xl p-6" style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold" style={{ color: '#F1F5F9' }}>
            Reality Check: Goals vs. Inventory Trends
          </h3>
          <div className="text-sm" style={{ color: '#94A3B8' }}>
            Data as of: {new Date().toLocaleDateString()}
            {inventoryTrend.latestSnapshotDate && (
              <span className="ml-2">
                (Latest snapshot: {inventoryTrend.latestSnapshotDate})
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th className="text-left p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                  Category
                </th>
                <th className="text-right p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                  Goal (Monthly)
                </th>
                <th className="text-right p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                  Trending (Weekly)
                </th>
                <th className="text-right p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                  Gap
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td className="p-3" style={{ fontSize: '14px', color: '#F1F5F9' }}>New Vehicles</td>
                <td className="p-3 text-right" style={{ fontSize: '14px', color: '#F1F5F9' }}>{projections.newVehicleSales}</td>
                <td className="p-3 text-right" style={{ fontSize: '14px', color: '#0EA5E9' }}>
                  {inventoryTrend.newTrend.weeklyAvg}/week
                  <span className="text-xs ml-2" style={{ color: '#94A3B8' }}>
                    ({inventoryTrend.newTrend.source} - {inventoryTrend.newTrend.confidence})
                  </span>
                </td>
                <td className="p-3 text-right" style={{ fontSize: '14px', color: projections.newVehicleSales > inventoryTrend.newTrend.weeklyAvg * 4 ? '#EF4444' : '#10B981' }}>
                  {projections.newVehicleSales - (inventoryTrend.newTrend.weeklyAvg * 4)} units
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <td className="p-3" style={{ fontSize: '14px', color: '#F1F5F9' }}>Used Vehicles</td>
                <td className="p-3 text-right" style={{ fontSize: '14px', color: '#F1F5F9' }}>{projections.usedVehicleSales}</td>
                <td className="p-3 text-right" style={{ fontSize: '14px', color: '#0EA5E9' }}>
                  {inventoryTrend.usedTrend.weeklyAvg}/week
                  <span className="text-xs ml-2" style={{ color: '#94A3B8' }}>
                    ({inventoryTrend.usedTrend.source} - {inventoryTrend.usedTrend.confidence})
                  </span>
                </td>
                <td className="p-3 text-right" style={{ fontSize: '14px', color: projections.usedVehicleSales > inventoryTrend.usedTrend.weeklyAvg * 4 ? '#EF4444' : '#10B981' }}>
                  {projections.usedVehicleSales - (inventoryTrend.usedTrend.weeklyAvg * 4)} units
                </td>
              </tr>
              <tr>
                <td className="p-3" style={{ fontSize: '14px', color: '#F1F5F9' }}>CPO Vehicles</td>
                <td className="p-3 text-right" style={{ fontSize: '14px', color: '#F1F5F9' }}>{projections.cpoVehicleSales}</td>
                <td className="p-3 text-right" style={{ fontSize: '14px', color: '#0EA5E9' }}>
                  {inventoryTrend.cpoTrend.weeklyAvg}/week
                  <span className="text-xs ml-2" style={{ color: '#94A3B8' }}>
                    ({inventoryTrend.cpoTrend.source} - {inventoryTrend.cpoTrend.confidence})
                  </span>
                </td>
                <td className="p-3 text-right" style={{ fontSize: '14px', color: projections.cpoVehicleSales > inventoryTrend.cpoTrend.weeklyAvg * 4 ? '#EF4444' : '#10B981' }}>
                  {projections.cpoVehicleSales - (inventoryTrend.cpoTrend.weeklyAvg * 4)} units
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#0F172A', border: '1px solid #334155' }}>
          <p style={{ fontSize: '14px', color: '#94A3B8' }}>
            <strong style={{ color: '#F1F5F9' }}>Current Inventory:</strong> {inventoryTrend.totalCount} vehicles in stock
          </p>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>
            <strong style={{ color: '#F1F5F9' }}>3-Tier Reality Check Logic:</strong> Attempts real sales data first (high confidence),
            then inventory delta with 45-day DOL (medium confidence), finally simple count with 45-day DOL (low confidence fallback).
            {loading && ' Loading latest data...'}
          </p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-6" style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: '#F1F5F9' }}>Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ color: '#94A3B8' }}>New Vehicle Sales</span>
              <span className="font-semibold" style={{ color: '#F1F5F9' }}>
                ${(projections.newVehicleSales * avgNewPrice).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#94A3B8' }}>Used Vehicle Sales</span>
              <span className="font-semibold" style={{ color: '#F1F5F9' }}>
                ${(projections.usedVehicleSales * avgUsedPrice).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#94A3B8' }}>CPO Vehicle Sales</span>
              <span className="font-semibold" style={{ color: '#F1F5F9' }}>
                ${(projections.cpoVehicleSales * avgCPOPrice).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#94A3B8' }}>Service Department (RO)</span>
              <span className="font-semibold" style={{ color: '#F1F5F9' }}>
                ${totalRORevenue.toLocaleString()}
              </span>
            </div>
            <div className="border-t pt-4 flex justify-between items-center" style={{ borderColor: '#334155' }}>
              <span className="font-semibold" style={{ color: '#F1F5F9' }}>Total Revenue</span>
              <span className="text-2xl font-bold" style={{ color: '#10B981' }}>
                ${totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
          <h3 className="text-xl font-semibold mb-4" style={{ color: '#F1F5F9' }}>Inventory Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span style={{ color: '#94A3B8' }}>Current Inventory</span>
              <span className="font-semibold" style={{ color: '#F1F5F9' }}>
                {inventoryTrend.totalCount} units
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#94A3B8' }}>Projected Sales (Monthly)</span>
              <span className="font-semibold" style={{ color: '#F1F5F9' }}>
                {totalUnits} units
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span style={{ color: '#94A3B8' }}>Weekly Turn Rate</span>
              <span className="font-semibold" style={{ color: '#F1F5F9' }}>
                {totalTrend} units/week
              </span>
            </div>
            <div className="border-t pt-4" style={{ borderColor: '#334155' }}>
              <div className="text-sm mb-2" style={{ color: '#94A3B8' }}>Goal Completion Probability</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-full h-2" style={{ backgroundColor: '#0F172A' }}>
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${goalCompletionProbability}%`,
                      backgroundColor: '#10B981'
                    }}
                  ></div>
                </div>
                <span className="font-semibold" style={{ color: '#F1F5F9' }}>
                  {goalCompletionProbability.toFixed(0)}%
                </span>
              </div>
              <div className="text-xs mt-1" style={{ color: '#64748B' }}>
                Probability of meeting goals based on trending
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
