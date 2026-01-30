import { Calculator, TrendingUp, DollarSign, Download, Phone } from 'lucide-react';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ROIProjector() {
  const [wasteCut, setWasteCut] = useState(8500);
  const [pagesDeploy, setPagesDeploy] = useState(50);
  const [conversion, setConversion] = useState(3.0);
  const [closeRate, setCloseRate] = useState(3.2);
  const [profitPerVehicle, setProfitPerVehicle] = useState(3000);

  // Calculations
  const monthlySavings = wasteCut;
  const newClicks = pagesDeploy * 210; // avg 210 clicks/page/mo
  const leads = (newClicks * conversion) / 100;
  const sales = (leads * closeRate) / 100;
  const monthlyProfit = sales * profitPerVehicle;
  const annualProfit = monthlyProfit * 12;
  const annualSavings = monthlySavings * 12;
  const aegisCost = 60000; // annual cost estimate
  const netAnnualProfit = annualProfit + annualSavings - aegisCost;
  const roi = ((netAnnualProfit / aegisCost) * 100).toFixed(0);

  // Chart data
  const projectionData = [
    { month: 'Jan', statusQuo: 145000, withAegis: 165000 },
    { month: 'Feb', statusQuo: 145000, withAegis: 175000 },
    { month: 'Mar', statusQuo: 145000, withAegis: 190000 },
    { month: 'Apr', statusQuo: 145000, withAegis: 210000 },
    { month: 'May', statusQuo: 145000, withAegis: 235000 },
    { month: 'Jun', statusQuo: 145000, withAegis: 265000 },
    { month: 'Jul', statusQuo: 145000, withAegis: 300000 },
    { month: 'Aug', statusQuo: 145000, withAegis: 340000 },
    { month: 'Sep', statusQuo: 145000, withAegis: 385000 },
    { month: 'Oct', statusQuo: 145000, withAegis: 435000 },
    { month: 'Nov', statusQuo: 145000, withAegis: 490000 },
    { month: 'Dec', statusQuo: 145000, withAegis: 550000 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calculator size={36} style={{ color: '#0066CC' }} />
          <h1 className="font-semibold" style={{ fontSize: '36px', color: '#F1F5F9' }}>
            Aegis Impact Simulation
          </h1>
        </div>
        <p style={{ fontSize: '18px', color: '#94A3B8' }}>
          Interactive ROI calculator - adjust assumptions to see potential outcomes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Controls */}
        <div className="lg:col-span-1">
          <div 
            className="rounded-xl p-6 sticky top-8"
            style={{ backgroundColor: '#1E293B' }}
          >
            <h3 className="mb-6 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
              Your Assumptions
            </h3>

            <div className="space-y-6">
              {/* Waste Cut Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ fontSize: '14px', color: '#94A3B8' }}>
                    Monthly Waste to Cut
                  </label>
                  <span className="font-semibold" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    ${wasteCut.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10500"
                  step="500"
                  value={wasteCut}
                  onChange={(e) => setWasteCut(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: '#0066CC' }}
                />
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: '12px', color: '#64748B' }}>$0</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>$10,500</span>
                </div>
              </div>

              {/* Pages Deploy Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ fontSize: '14px', color: '#94A3B8' }}>
                    Power Pages to Deploy
                  </label>
                  <span className="font-semibold" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    {pagesDeploy}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={pagesDeploy}
                  onChange={(e) => setPagesDeploy(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: '#0066CC' }}
                />
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: '12px', color: '#64748B' }}>0</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>100</span>
                </div>
              </div>

              {/* Conversion Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ fontSize: '14px', color: '#94A3B8' }}>
                    Click-to-Lead %
                  </label>
                  <span className="font-semibold" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    {conversion.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.1"
                  value={conversion}
                  onChange={(e) => setConversion(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: '#0066CC' }}
                />
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: '12px', color: '#64748B' }}>1%</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>8%</span>
                </div>
              </div>

              {/* Close Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ fontSize: '14px', color: '#94A3B8' }}>
                    Lead-to-Sale %
                  </label>
                  <span className="font-semibold" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    {closeRate.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={closeRate}
                  onChange={(e) => setCloseRate(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: '#0066CC' }}
                />
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: '12px', color: '#64748B' }}>1%</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>10%</span>
                </div>
              </div>

              {/* Profit Per Vehicle */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ fontSize: '14px', color: '#94A3B8' }}>
                    Profit Per Vehicle
                  </label>
                  <span className="font-semibold" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    ${profitPerVehicle.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="6000"
                  step="100"
                  value={profitPerVehicle}
                  onChange={(e) => setProfitPerVehicle(Number(e.target.value))}
                  className="w-full"
                  style={{ accentColor: '#0066CC' }}
                />
                <div className="flex justify-between mt-1">
                  <span style={{ fontSize: '12px', color: '#64748B' }}>$1,000</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>$6,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Big Number Result */}
          <div 
            className="rounded-xl p-8 text-center"
            style={{ 
              backgroundColor: '#1E293B',
              border: '2px solid #10B981'
            }}
          >
            <div style={{ fontSize: '14px', color: '#94A3B8', marginBottom: '8px' }}>
              Projected Net Annual Profit
            </div>
            <div className="font-bold mb-2" style={{ fontSize: '48px', color: '#10B981' }}>
              ${netAnnualProfit.toLocaleString()}
            </div>
            <div className="flex items-center justify-center gap-4">
              <div 
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#10B98120' }}
              >
                <span className="font-semibold" style={{ fontSize: '18px', color: '#10B981' }}>
                  {roi}% ROI
                </span>
              </div>
              <div 
                className="px-4 py-2 rounded-lg"
                style={{ backgroundColor: '#0EA5E920' }}
              >
                <span className="font-semibold" style={{ fontSize: '18px', color: '#0EA5E9' }}>
                  {(sales * 12).toFixed(0)} sales/year
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div 
            className="rounded-xl p-6"
            style={{ backgroundColor: '#1E293B' }}
          >
            <h3 className="mb-4 font-semibold" style={{ fontSize: '18px', color: '#F1F5F9' }}>
              Profit Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#0F172A' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#94A3B8' }}>SEO Traffic Lift</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    {newClicks.toLocaleString()} clicks → {leads.toFixed(0)} leads → {sales.toFixed(1)} sales/mo
                  </div>
                </div>
                <div className="font-bold" style={{ fontSize: '20px', color: '#10B981' }}>
                  +${annualProfit.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#0F172A' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#94A3B8' }}>Waste Savings</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    ${wasteCut.toLocaleString()}/mo eliminated
                  </div>
                </div>
                <div className="font-bold" style={{ fontSize: '20px', color: '#10B981' }}>
                  +${annualSavings.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: '#0F172A' }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#94A3B8' }}>Aegis Cost</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    Platform + content generation
                  </div>
                </div>
                <div className="font-bold" style={{ fontSize: '20px', color: '#EF4444' }}>
                  -${aegisCost.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Projection Chart */}
          <div 
            className="rounded-xl p-6"
            style={{ backgroundColor: '#1E293B' }}
          >
            <h3 className="mb-6 font-semibold" style={{ fontSize: '18px', color: '#F1F5F9' }}>
              Cumulative Profit Projection
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="month" 
                  stroke="#94A3B8"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#94A3B8"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1E293B', 
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#F1F5F9'
                  }}
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="statusQuo" 
                  stroke="#94A3B8" 
                  strokeWidth={2}
                  name="Status Quo"
                  strokeDasharray="5 5"
                />
                <Line 
                  type="monotone" 
                  dataKey="withAegis" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  name="With Aegis"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Sensitivity Note */}
          <div 
            className="rounded-xl p-6"
            style={{ 
              backgroundColor: '#0EA5E920',
              border: '1px solid #0EA5E9'
            }}
          >
            <div className="flex items-start gap-3">
              <TrendingUp size={24} style={{ color: '#0EA5E9', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 className="font-semibold mb-2" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                  Sensitivity Analysis
                </h4>
                <p style={{ fontSize: '14px', color: '#94A3B8' }}>
                  Even in worst-case scenarios (50% click assumptions, 2% conversion), 
                  Aegis still delivers <span style={{ color: '#10B981', fontWeight: '600' }}>5X+ ROI</span>. 
                  Conservative estimates assume no market share gain from competitors.
                </p>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex gap-4">
            <button
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all"
              style={{ backgroundColor: '#10B981', color: '#F1F5F9', fontSize: '16px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10B981';
              }}
            >
              <Download size={20} />
              Download Full Report
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-semibold transition-all"
              style={{ 
                backgroundColor: '#0066CC', 
                color: '#F1F5F9',
                fontSize: '16px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0052A3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#0066CC';
              }}
            >
              <Phone size={20} />
              Schedule Strategy Call
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
