'use client';

import React, { useState, useEffect } from 'react';
import KPICard from './KPICard';

// Interfaces for type safety
interface SalesProjections {
  newVehicleSales: number;
  usedVehicleSales: number;
  totalROCount: number;
  averageROProfit: number;
  marketingExpense: number;
}

interface HistoricalData {
  month: string;
  year: number;
  newVehicleSales: number;
  usedVehicleSales: number;
  totalROCount: number;
  averageROProfit: number;
  marketingExpense: number;
  timestamp: string;
}

interface CalculatedMetrics {
  totalSalesRevenue: number;
  totalRORevenue: number;
  totalRevenue: number;
  cpa: number;
  inventoryTurnRate: number;
  goalCompletionProbability: number;
}

const OverviewDashboard = () => {
  // Form state
  const [projections, setProjections] = useState<SalesProjections>({
    newVehicleSales: 0,
    usedVehicleSales: 0,
    totalROCount: 0,
    averageROProfit: 0,
    marketingExpense: 0
  });

  // Historical data state (simulated for MVP)
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);

  // Load demo data on mount
  useEffect(() => {
    // Simulate loading historical data (will be replaced with Supabase)
    const demoHistoricalData: HistoricalData[] = [
      {
        month: 'December',
        year: 2024,
        newVehicleSales: 45,
        usedVehicleSales: 32,
        totalROCount: 180,
        averageROProfit: 125,
        marketingExpense: 8500,
        timestamp: '2024-12-31T23:59:59Z'
      },
      {
        month: 'November',
        year: 2024,
        newVehicleSales: 38,
        usedVehicleSales: 28,
        totalROCount: 165,
        averageROProfit: 118,
        marketingExpense: 7200,
        timestamp: '2024-11-30T23:59:59Z'
      },
      {
        month: 'October',
        year: 2024,
        newVehicleSales: 42,
        usedVehicleSales: 35,
        totalROCount: 175,
        averageROProfit: 122,
        marketingExpense: 7800,
        timestamp: '2024-10-31T23:59:59Z'
      }
    ];
    setHistoricalData(demoHistoricalData);

    // Set default projections based on historical averages
    if (demoHistoricalData.length > 0) {
      const avgNew = Math.round(demoHistoricalData.reduce((sum, d) => sum + d.newVehicleSales, 0) / demoHistoricalData.length);
      const avgUsed = Math.round(demoHistoricalData.reduce((sum, d) => sum + d.usedVehicleSales, 0) / demoHistoricalData.length);
      const avgRO = Math.round(demoHistoricalData.reduce((sum, d) => sum + d.totalROCount, 0) / demoHistoricalData.length);
      const avgProfit = Math.round(demoHistoricalData.reduce((sum, d) => sum + d.averageROProfit, 0) / demoHistoricalData.length);
      const avgMarketing = Math.round(demoHistoricalData.reduce((sum, d) => sum + d.marketingExpense, 0) / demoHistoricalData.length);

      setProjections({
        newVehicleSales: avgNew,
        usedVehicleSales: avgUsed,
        totalROCount: avgRO,
        averageROProfit: avgProfit,
        marketingExpense: avgMarketing
      });
    }
  }, []);

  // Calculate metrics
  const calculateMetrics = (): CalculatedMetrics => {
    // Assume average vehicle prices (will be replaced with actual inventory data)
    const avgNewPrice = 35000;
    const avgUsedPrice = 22000;

    const totalSalesRevenue = (projections.newVehicleSales * avgNewPrice) + (projections.usedVehicleSales * avgUsedPrice);
    const totalRORevenue = projections.totalROCount * projections.averageROProfit;
    const totalRevenue = totalSalesRevenue + totalRORevenue;

    // Calculate CPA (Cost Per Acquisition)
    const totalUnits = projections.newVehicleSales + projections.usedVehicleSales;
    const cpa = totalUnits > 0 ? projections.marketingExpense / totalUnits : 0;

    // Calculate inventory turn rate (simplified - will use actual inventory data)
    const inventoryTurnRate = totalUnits > 0 ? (totalUnits / 50) * 12 : 0; // Assuming 50 units in inventory

    // Calculate goal completion probability (based on historical performance)
    let probability = 50; // Base probability
    if (historicalData.length > 0) {
      const recentAvg = historicalData.slice(0, 3).reduce((sum, d) => sum + d.newVehicleSales + d.usedVehicleSales, 0) / 3;
      const currentTotal = projections.newVehicleSales + projections.usedVehicleSales;
      probability = Math.min(100, Math.max(0, (currentTotal / recentAvg) * 50));
    }

    return {
      totalSalesRevenue,
      totalRORevenue,
      totalRevenue,
      cpa,
      inventoryTurnRate,
      goalCompletionProbability: probability
    };
  };

  const metrics = calculateMetrics();

  // Calculate MoM and YoY changes
  const calculateChange = (current: number, historical: number[]): { value: number; type: 'increase' | 'decrease' } => {
    if (historical.length === 0) return { value: 0, type: 'increase' };
    const previous = historical[0];
    const change = previous !== 0 ? ((current - previous) / previous) * 100 : 0;
    return {
      value: Math.abs(change),
      type: change >= 0 ? 'increase' : 'decrease'
    };
  };

  const historicalSales = historicalData.map(d => d.newVehicleSales + d.usedVehicleSales);
  const historicalRevenue = historicalData.map(d => (d.newVehicleSales * 35000) + (d.usedVehicleSales * 22000));
  const historicalCPA = historicalData.map(d => {
    const totalUnits = d.newVehicleSales + d.usedVehicleSales;
    return totalUnits > 0 ? d.marketingExpense / totalUnits : 0;
  });

  const salesChange = calculateChange(projections.newVehicleSales + projections.usedVehicleSales, historicalSales);
  const revenueChange = calculateChange(metrics.totalRevenue, historicalRevenue);
  const cpaChange = calculateChange(metrics.cpa, historicalCPA);

  // Handle input changes
  const handleInputChange = (field: keyof SalesProjections, value: number) => {
    setProjections(prev => ({ ...prev, [field]: value }));
  };

  // Save projections to history (will be replaced with Supabase)
  const handleSaveProjections = () => {
    const now = new Date();
    const newEntry: HistoricalData = {
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear(),
      ...projections,
      timestamp: now.toISOString()
    };
    setHistoricalData([newEntry, ...historicalData]);
    alert('Projections saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Overview Dashboard</h1>
        <p className="text-lg text-gray-400">Track sales projections, marketing ROI, and inventory performance</p>
      </div>

      {/* Input Forms */}
      <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
        <h2 className="text-xl font-semibold text-white mb-6">Sales & Marketing Projections</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* New Vehicle Sales */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Vehicle Sales (units)
            </label>
            <input
              type="number"
              value={projections.newVehicleSales || ''}
              onChange={(e) => handleInputChange('newVehicleSales', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Used Vehicle Sales */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Used Vehicle Sales (units)
            </label>
            <input
              type="number"
              value={projections.usedVehicleSales || ''}
              onChange={(e) => handleInputChange('usedVehicleSales', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Total RO Count */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total RO Count
            </label>
            <input
              type="number"
              value={projections.totalROCount || ''}
              onChange={(e) => handleInputChange('totalROCount', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Average RO Profit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Avg RO Profit ($)
            </label>
            <input
              type="number"
              value={projections.averageROProfit || ''}
              onChange={(e) => handleInputChange('averageROProfit', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
              placeholder="0"
            />
          </div>

          {/* Marketing Expense */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Marketing Expense ($)
            </label>
            <input
              type="number"
              value={projections.marketingExpense || ''}
              onChange={(e) => handleInputChange('marketingExpense', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 bg-[#0F172A] border border-[#334155] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent"
              placeholder="0"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveProjections}
            className="px-6 py-3 bg-[#0066CC] hover:bg-[#0052A3] text-white font-medium rounded-lg transition-colors"
          >
            Save Projections
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          change={revenueChange.value}
          changeType={revenueChange.type}
          icon="CurrencyDollarIcon"
          gradient="bg-gradient-to-br from-purple-600 to-purple-800"
          subtitle="Sales + RO Revenue"
        />
        <KPICard
          title="Total Sales"
          value={`${projections.newVehicleSales + projections.usedVehicleSales} Units`}
          change={salesChange.value}
          changeType={salesChange.type}
          icon="ShoppingCartIcon"
          gradient="bg-gradient-to-br from-pink-600 to-pink-800"
          subtitle="New + Used Vehicles"
        />
        <KPICard
          title="CPA"
          value={`$${metrics.cpa.toFixed(0)}`}
          change={cpaChange.value}
          changeType={cpaChange.type === 'increase' ? 'decrease' : 'increase'} // Lower CPA is better
          icon="ChartBarIcon"
          gradient="bg-gradient-to-br from-orange-600 to-orange-800"
          subtitle="Cost Per Acquisition"
        />
        <KPICard
          title="Goal Completion"
          value={`${metrics.goalCompletionProbability.toFixed(0)}%`}
          change={0}
          changeType="increase"
          icon="CheckCircleIcon"
          gradient="bg-gradient-to-br from-green-600 to-green-800"
          subtitle="Probability Based on History"
        />
      </div>

      {/* Revenue Breakdown & Inventory Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
          <h3 className="text-xl font-semibold text-white mb-4">Revenue Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">New Vehicle Sales</span>
              <span className="text-white font-semibold">
                ${(projections.newVehicleSales * 35000).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Used Vehicle Sales</span>
              <span className="text-white font-semibold">
                ${(projections.usedVehicleSales * 22000).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Service Department (RO)</span>
              <span className="text-white font-semibold">
                ${metrics.totalRORevenue.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-[#334155] pt-4 flex justify-between items-center">
              <span className="text-white font-semibold">Total Revenue</span>
              <span className="text-2xl font-bold text-[#10B981]">
                ${metrics.totalRevenue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Inventory Metrics */}
        <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
          <h3 className="text-xl font-semibold text-white mb-4">Inventory Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Inventory Turn Rate</span>
              <span className="text-white font-semibold">
                {metrics.inventoryTurnRate.toFixed(1)}x/year
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Current Inventory</span>
              <span className="text-white font-semibold">~50 units (demo data)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Projected Sales</span>
              <span className="text-white font-semibold">
                {projections.newVehicleSales + projections.usedVehicleSales} units
              </span>
            </div>
            <div className="border-t border-[#334155] pt-4">
              <div className="text-sm text-gray-400 mb-2">Market Conditions</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#0F172A] rounded-full h-2">
                  <div
                    className="bg-[#10B981] h-2 rounded-full transition-all"
                    style={{ width: `${metrics.goalCompletionProbability}%` }}
                  ></div>
                </div>
                <span className="text-white font-semibold">{metrics.goalCompletionProbability.toFixed(0)}%</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Probability of meeting goals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Data Table */}
      {historicalData.length > 0 && (
        <div className="bg-[#1E293B] rounded-xl p-6 border border-[#334155]">
          <h3 className="text-xl font-semibold text-white mb-4">Historical Projections</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Month</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">New Sales</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">Used Sales</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">RO Count</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">RO Profit</th>
                  <th className="text-right py-3 px-4 text-gray-300 font-medium">Marketing</th>
                </tr>
              </thead>
              <tbody>
                {historicalData.map((data, index) => (
                  <tr key={index} className="border-b border-[#334155] last:border-0 hover:bg-[#334155] transition-colors">
                    <td className="py-3 px-4 text-white">
                      {data.month} {data.year}
                    </td>
                    <td className="py-3 px-4 text-white text-right">{data.newVehicleSales}</td>
                    <td className="py-3 px-4 text-white text-right">{data.usedVehicleSales}</td>
                    <td className="py-3 px-4 text-white text-right">{data.totalROCount}</td>
                    <td className="py-3 px-4 text-white text-right">${data.averageROProfit}</td>
                    <td className="py-3 px-4 text-white text-right">${data.marketingExpense.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewDashboard;