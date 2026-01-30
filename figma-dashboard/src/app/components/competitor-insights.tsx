import { TrendingUp, MapPin } from 'lucide-react';

const competitors = [
  {
    name: 'Mid-State Chevrolet',
    isYou: true,
    sales: '121 units/mo',
    inventory: '306 units • $15.5M value',
    seo: '#1 branded • #6 "chevy suv"',
    share: 15.5,
  },
  {
    name: 'Harry Green Chevrolet',
    distance: '~35 mi',
    sales: 'Est. 90-110 units/mo',
    strength: '#1 "chevy dealer clarksburg wv"',
    gap: 'Weak generic SUV terms',
    opportunity: 'Conquest with Equinox/Trax pages',
    share: 12.0,
  },
  {
    name: 'Northside Chevrolet GMC',
    distance: '~42 mi',
    sales: 'Est. 100+ units/mo',
    strength: 'GMC truck content',
    gap: 'Missing broad Chevy searches',
    opportunity: 'Target "gm dealers near me" overflow',
    share: 13.5,
  },
];

const keywordBattle = [
  {
    keyword: 'chevrolet dealers near me',
    midstate: 95,
    harry: 12,
    northside: 18,
    jenkins: 45,
  },
  {
    keyword: 'chevy suv',
    midstate: 6,
    harry: 32,
    northside: 28,
    jenkins: null,
  },
  {
    keyword: 'chevy dealer clarksburg',
    midstate: 8,
    harry: 1,
    northside: 15,
    jenkins: null,
  },
  {
    keyword: 'gm dealers near me',
    midstate: 42,
    harry: 28,
    northside: 3,
    jenkins: null,
  },
  {
    keyword: 'chevy silverado flatwoods',
    midstate: 2,
    harry: 18,
    northside: 22,
    jenkins: null,
  },
];

function getRankColor(rank: number | null) {
  if (rank === null) return '#334155';
  if (rank <= 3) return '#10B981';
  if (rank <= 10) return '#F59E0B';
  if (rank <= 20) return '#F97316';
  return '#EF4444';
}

export function CompetitorInsights() {
  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-semibold mb-2" style={{ fontSize: '36px', color: '#F1F5F9' }}>
          50-Mile Competitive Landscape
        </h1>
        <div className="flex gap-4 mt-4">
          <select 
            className="px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
              fontSize: '14px'
            }}
          >
            <option>Radius: 50 mi</option>
            <option>Radius: 25 mi</option>
            <option>Radius: 100 mi</option>
          </select>
          <select 
            className="px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
              fontSize: '14px'
            }}
          >
            <option>Brand: Chevrolet + Cross-Shop</option>
            <option>Brand: Chevrolet Only</option>
            <option>Brand: All Brands</option>
          </select>
          <select 
            className="px-4 py-2 rounded-lg"
            style={{ 
              backgroundColor: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
              fontSize: '14px'
            }}
          >
            <option>View: Sales</option>
            <option>View: Inventory</option>
            <option>View: SEO</option>
            <option>View: Pricing</option>
          </select>
        </div>
      </div>

      {/* Competitor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {competitors.map((competitor, index) => (
          <div
            key={index}
            className="rounded-xl p-6"
            style={{
              backgroundColor: '#1E293B',
              border: competitor.isYou ? '2px solid #0066CC' : '1px solid #334155',
              boxShadow: competitor.isYou ? '0 0 20px rgba(0, 102, 204, 0.2)' : '0 1px 3px rgba(0,0,0,0.3)',
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold mb-1" style={{ fontSize: '18px', color: '#F1F5F9' }}>
                  {competitor.name}
                  {competitor.isYou && (
                    <span 
                      className="ml-2 px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: '#0066CC20', color: '#0066CC' }}
                    >
                      You
                    </span>
                  )}
                </h3>
                {competitor.distance && (
                  <div className="flex items-center gap-1">
                    <MapPin size={14} style={{ color: '#94A3B8' }} />
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {competitor.distance}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-4">
              <div>
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sales</span>
                <p className="font-medium" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                  {competitor.sales}
                </p>
              </div>
              
              {competitor.isYou && competitor.inventory && (
                <div>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Inventory</span>
                  <p className="font-medium" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    {competitor.inventory}
                  </p>
                </div>
              )}

              {competitor.isYou && competitor.seo && (
                <div>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>SEO Position</span>
                  <p className="font-medium" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                    {competitor.seo}
                  </p>
                </div>
              )}

              {!competitor.isYou && competitor.strength && (
                <div>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Strength</span>
                  <p className="font-medium" style={{ fontSize: '14px', color: '#10B981' }}>
                    {competitor.strength}
                  </p>
                </div>
              )}

              {!competitor.isYou && competitor.gap && (
                <div>
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>Gap</span>
                  <p className="font-medium" style={{ fontSize: '14px', color: '#F59E0B' }}>
                    {competitor.gap}
                  </p>
                </div>
              )}
            </div>

            {/* Market Share Gauge */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Market Share</span>
                <span className="font-semibold" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                  {competitor.share}%
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ backgroundColor: '#334155' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${competitor.share * 5}%`, // Scale for visual
                    backgroundColor: competitor.isYou ? '#0066CC' : '#94A3B8',
                  }}
                />
              </div>
            </div>

            {/* Opportunity Badge */}
            {!competitor.isYou && competitor.opportunity && (
              <div 
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#10B98110' }}
              >
                <p style={{ fontSize: '12px', color: '#10B981', fontWeight: '500' }}>
                  💡 {competitor.opportunity}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Keyword Battle Map */}
      <div className="rounded-xl p-6" style={{ backgroundColor: '#1E293B' }}>
        <h3 className="mb-6 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
          Keyword Battle Map
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '2px solid #334155' }}>
                <th className="text-left p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                  Keyword
                </th>
                <th className="text-center p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                  Mid-State
                </th>
                <th className="text-center p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                  Harry Green
                </th>
                <th className="text-center p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                  Northside
                </th>
                <th className="text-center p-3" style={{ fontSize: '14px', color: '#94A3B8', fontWeight: '500' }}>
                  Jenkins Subaru
                </th>
              </tr>
            </thead>
            <tbody>
              {keywordBattle.map((row, index) => (
                <tr 
                  key={index}
                  style={{ 
                    borderBottom: index !== keywordBattle.length - 1 ? '1px solid #334155' : 'none'
                  }}
                >
                  <td className="p-3" style={{ fontSize: '14px', color: '#F1F5F9' }}>
                    {row.keyword}
                  </td>
                  <td className="p-3 text-center">
                    <span 
                      className="inline-block px-3 py-1 rounded font-medium"
                      style={{ 
                        backgroundColor: `${getRankColor(row.midstate)}20`,
                        color: getRankColor(row.midstate),
                        fontSize: '14px'
                      }}
                    >
                      {row.midstate ? `#${row.midstate}` : '—'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span 
                      className="inline-block px-3 py-1 rounded font-medium"
                      style={{ 
                        backgroundColor: `${getRankColor(row.harry)}20`,
                        color: getRankColor(row.harry),
                        fontSize: '14px'
                      }}
                    >
                      {row.harry ? `#${row.harry}` : '—'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span 
                      className="inline-block px-3 py-1 rounded font-medium"
                      style={{ 
                        backgroundColor: `${getRankColor(row.northside)}20`,
                        color: getRankColor(row.northside),
                        fontSize: '14px'
                      }}
                    >
                      {row.northside ? `#${row.northside}` : '—'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span 
                      className="inline-block px-3 py-1 rounded font-medium"
                      style={{ 
                        backgroundColor: `${getRankColor(row.jenkins)}20`,
                        color: getRankColor(row.jenkins),
                        fontSize: '14px'
                      }}
                    >
                      {row.jenkins ? `#${row.jenkins}` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex gap-6 mt-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10B981' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>#1-3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F59E0B' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>#4-10</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#F97316' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>#11-20</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#EF4444' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>#21+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
