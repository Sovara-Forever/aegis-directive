import { AlertTriangle, DollarSign, XCircle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { IntelCard } from './intel-card';

const wasteItems = [
  {
    category: 'SEM Broad Match',
    amount: 8500,
    type: 'danger',
    description: 'Overly generic targeting with low conversion',
    action: 'Stop immediately',
  },
  {
    category: 'Facebook Generic Ads',
    amount: 1500,
    type: 'danger',
    description: 'Poor placement targeting, low quality traffic',
    action: 'Stop immediately',
  },
  {
    category: 'Display Network',
    amount: 500,
    type: 'danger',
    description: 'Minimal attribution, brand safety concerns',
    action: 'Stop immediately',
  },
  {
    category: 'Lotlinx/Geofencing',
    amount: 5000,
    type: 'warning',
    description: 'Needs attribution validation',
    action: 'Investigate & optimize',
  },
];

const reinvestmentPlan = [
  {
    title: 'Power Pages SEO Content',
    budget: 7500,
    impact: '+10,500 organic clicks/mo',
    roi: '14x',
    type: 'success',
  },
  {
    title: 'Vehicle Listing Ads (VLA)',
    budget: 2000,
    impact: 'Better-qualified leads',
    roi: '8x',
    type: 'success',
  },
  {
    title: 'Smart SEM Targeting',
    budget: 1000,
    impact: 'High-intent keywords only',
    roi: '6x',
    type: 'info',
  },
];

export function WasteAudit() {
  const totalWaste = wasteItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={36} style={{ color: '#EF4444' }} />
          <h1 className="font-semibold" style={{ fontSize: '36px', color: '#F1F5F9' }}>
            ${totalWaste.toLocaleString()}/month Digital Waste Identified
          </h1>
        </div>
        <p style={{ fontSize: '18px', color: '#94A3B8' }}>
          Potential immediate savings + reallocation to organic conquest
        </p>
      </div>

      {/* Sankey-style Flow Visualization */}
      <div className="rounded-xl p-8 mb-8" style={{ backgroundColor: '#1E293B' }}>
        <h3 className="mb-6 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
          Current Spend Flow Analysis
        </h3>
        
        <div className="space-y-6">
          {/* Total Spend Source */}
          <div className="flex items-center gap-4">
            <div 
              className="px-6 py-4 rounded-lg flex-shrink-0"
              style={{ backgroundColor: '#0066CC', minWidth: '200px' }}
            >
              <div style={{ fontSize: '14px', color: '#E6F2FF' }}>Total Monthly Spend</div>
              <div className="font-bold" style={{ fontSize: '24px', color: '#F1F5F9' }}>
                ~$22,000
              </div>
            </div>
          </div>

          {/* Waste Flows */}
          <div className="ml-8 space-y-3">
            <div className="flex items-center gap-4">
              <div 
                className="h-1 flex-1 rounded"
                style={{ backgroundColor: '#EF4444', maxWidth: '400px' }}
              />
              <div 
                className="px-4 py-3 rounded-lg flex-1"
                style={{ backgroundColor: '#EF444420', border: '1px solid #EF4444' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    SEM Broad Match
                  </span>
                  <span className="font-bold" style={{ fontSize: '16px', color: '#EF4444' }}>
                    $8,500 waste
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                  Overly generic targeting
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div 
                className="h-1 flex-1 rounded"
                style={{ backgroundColor: '#EF4444', maxWidth: '200px' }}
              />
              <div 
                className="px-4 py-3 rounded-lg flex-1"
                style={{ backgroundColor: '#EF444420', border: '1px solid #EF4444' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    Facebook Generic + Display
                  </span>
                  <span className="font-bold" style={{ fontSize: '16px', color: '#EF4444' }}>
                    $2,000 waste
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                  Poor placement, low quality
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div 
                className="h-1 flex-1 rounded"
                style={{ backgroundColor: '#F59E0B', maxWidth: '300px' }}
              />
              <div 
                className="px-4 py-3 rounded-lg flex-1"
                style={{ backgroundColor: '#F59E0B20', border: '1px solid #F59E0B' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    Lotlinx/Geofencing
                  </span>
                  <span className="font-bold" style={{ fontSize: '16px', color: '#F59E0B' }}>
                    $5,000 validate
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                  Needs attribution analysis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div 
                className="h-1 flex-1 rounded"
                style={{ backgroundColor: '#10B981', maxWidth: '500px' }}
              />
              <div 
                className="px-4 py-3 rounded-lg flex-1"
                style={{ backgroundColor: '#10B98120', border: '1px solid #10B981' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    Reallocate to Organic
                  </span>
                  <span className="font-bold" style={{ fontSize: '16px', color: '#10B981' }}>
                    $10,500 opportunity
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                  Power Pages + VLA
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Waste Detail Cards */}
      <div className="mb-8">
        <h3 className="mb-4 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
          Detailed Waste Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wasteItems.map((item, index) => {
            const iconMap = {
              danger: XCircle,
              warning: AlertCircle,
            };
            const colorMap = {
              danger: '#EF4444',
              warning: '#F59E0B',
            };
            const Icon = iconMap[item.type as keyof typeof iconMap];
            const color = colorMap[item.type as keyof typeof colorMap];

            return (
              <div
                key={index}
                className="rounded-lg p-4"
                style={{
                  backgroundColor: '#1E293B',
                  border: `1px solid ${color}40`,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <Icon size={20} style={{ color, flexShrink: 0, marginTop: '2px' }} />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                      {item.category}
                    </h4>
                    <p style={{ fontSize: '14px', color: '#94A3B8' }}>
                      {item.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ fontSize: '18px', color }}>
                      ${item.amount.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>per month</div>
                  </div>
                </div>
                <div 
                  className="px-3 py-1.5 rounded"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <span className="font-medium" style={{ fontSize: '12px', color }}>
                    {item.action}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reinvestment Plan */}
      <div className="rounded-xl p-6 mb-8" style={{ backgroundColor: '#1E293B' }}>
        <h3 className="mb-6 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
          Smart Reinvestment Strategy
        </h3>
        <div className="space-y-4">
          {reinvestmentPlan.map((plan, index) => {
            const iconMap = {
              success: CheckCircle,
              info: Info,
            };
            const colorMap = {
              success: '#10B981',
              info: '#0EA5E9',
            };
            const Icon = iconMap[plan.type as keyof typeof iconMap];
            const color = colorMap[plan.type as keyof typeof colorMap];

            return (
              <div
                key={index}
                className="rounded-lg p-5"
                style={{
                  backgroundColor: '#0F172A',
                  border: `2px solid ${color}40`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Icon size={24} style={{ color }} />
                    <h4 className="font-semibold" style={{ fontSize: '18px', color: '#F1F5F9' }}>
                      {plan.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ fontSize: '20px', color }}>
                      ${plan.budget.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#94A3B8' }}>monthly invest</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span style={{ fontSize: '14px', color: '#94A3B8' }}>Expected Impact: </span>
                    <span className="font-medium" style={{ fontSize: '14px', color: '#F1F5F9' }}>
                      {plan.impact}
                    </span>
                  </div>
                  <div 
                    className="px-3 py-1 rounded"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <span className="font-bold" style={{ fontSize: '14px', color }}>
                      {plan.roi} ROI
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div 
          className="mt-6 p-6 rounded-lg"
          style={{ backgroundColor: '#10B98110', border: '2px solid #10B981' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1" style={{ fontSize: '18px', color: '#F1F5F9' }}>
                Total Reallocation Potential
              </h4>
              <p style={{ fontSize: '14px', color: '#94A3B8' }}>
                Stop waste, reinvest in high-ROI channels
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold" style={{ fontSize: '30px', color: '#10B981' }}>
                $10,500
              </div>
              <div style={{ fontSize: '14px', color: '#94A3B8' }}>per month</div>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Insights - Expandable Cards */}
      <div className="mb-8">
        <h3 className="mb-4 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
          Intelligence Insights
        </h3>
        <div className="space-y-3">
          <IntelCard
            title="Vulnerable Market Position"
            severity="critical"
            summary="Low rankings on high-intent keywords expose Mid-State to competitor conquest"
            details="Currently ranking #95 for 'chevrolet dealers near me' (42.8K monthly searches) represents a massive opportunity gap. Competitors are capturing this traffic while Mid-State remains virtually invisible. This vulnerability allows Harry Green and Northside to intercept shoppers actively searching for your dealership type."
            recommendation="Deploy 15 geo-targeted Power Pages within 30 days focusing on dealer + location combinations. Expected lift: +8,500 organic clicks/month, reducing dependency on paid SEM."
          />
          
          <IntelCard
            title="Iron Curtain Defense Gap"
            severity="high"
            summary="Weak branded content allows competitors to rank for your dealership terms"
            details="While Mid-State owns #1 for exact brand match 'midstate chevy', variations like 'mid state chevrolet flatwoods' and 'chevy dealer sutton wv' show competitor pages in top 10. This 'Iron Curtain' breach means shoppers looking specifically for you are seeing competitor options first."
            recommendation="Implement comprehensive branded content strategy with 8-10 branded term variations. Create location-specific pages for Sutton, Flatwoods, and surrounding communities. Expected impact: Lock down all branded variations in top 3 positions within 60 days."
          />

          <IntelCard
            title="Attribution Blind Spots"
            severity="medium"
            summary="$5,000/month spend on Lotlinx and geofencing lacks clear attribution"
            details="Current vendor reporting shows 'impressions' and 'engagement' but fails to connect to actual showroom visits or sales. Without proper attribution, this spend could be pure waste or highly effective - there's no way to know. Industry data suggests 60-70% of geofencing claims are inflated."
            recommendation="Implement 90-day attribution audit with unique phone numbers and promo codes tied to Lotlinx campaigns. If attribution remains unclear after 90 days, reallocate $5K to proven channels (Power Pages + VLA). Conservative estimate: This reallocation could generate 12-15 additional sales annually."
          />
        </div>
      </div>
    </div>
  );
}