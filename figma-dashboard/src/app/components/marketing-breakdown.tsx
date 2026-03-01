/**
 * Marketing Breakdown Component - Aegis Intelligence
 * 14-segment pie chart with expandable details
 *
 * Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
 * Created: 2026-02-25
 */

import { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChevronDown, ChevronRight, Plus, Trash2, DollarSign } from 'lucide-react';

// 14 Marketing Segments with blue gradient colors (darkest to lightest)
const SEGMENT_CONFIG = [
  { id: 'traditional', name: 'Traditional Media', color: '#0C4A6E' },
  { id: 'seo', name: 'SEO/AIO/GEO', color: '#075985' },
  { id: 'sem', name: 'Paid SEM', color: '#0369A1' },
  { id: 'shopper', name: 'Shopper Journey Placements', color: '#0284C7' },
  { id: 'tradein', name: 'Trade-In Tools', color: '#0EA5E9' },
  { id: 'service', name: 'Service/Parts Budget', color: '#38BDF8' },
  { id: 'video', name: 'Video Pre-Roll', color: '#7DD3FC' },
  { id: 'social', name: 'Social Media', color: '#0D9488' },
  { id: 'ott', name: 'OTT/CTV', color: '#14B8A6' },
  { id: 'tv', name: 'Premium Online TV', color: '#2DD4BF' },
  { id: 'website', name: 'Website & Retail Tools', color: '#5EEAD4' },
  { id: 'platform', name: 'Platform Fees', color: '#6366F1' },
  { id: 'misc', name: 'Miscellaneous', color: '#818CF8' },
  { id: 'reserve', name: 'Reserve/Buffer', color: '#A5B4FC' },
];

interface MarketingEntry {
  id: string;
  type: string;
  amount: number;
  notes: string;
}

interface MarketingSegment {
  id: string;
  name: string;
  color: string;
  entries: MarketingEntry[];
}

interface MarketingBreakdownProps {
  totalBudget: number;
  onBudgetChange: (newTotal: number) => void;
}

export function MarketingBreakdown({ totalBudget, onBudgetChange }: MarketingBreakdownProps) {
  // Initialize segments with empty entries
  const [segments, setSegments] = useState<MarketingSegment[]>(
    SEGMENT_CONFIG.map(config => ({
      ...config,
      entries: []
    }))
  );

  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  const [showPieChart, setShowPieChart] = useState(true);
  const [showSegmentList, setShowSegmentList] = useState(false); // Collapsed by default

  // Calculate totals
  const segmentTotals = useMemo(() => {
    return segments.map(segment => ({
      ...segment,
      total: segment.entries.reduce((sum, entry) => sum + entry.amount, 0)
    }));
  }, [segments]);

  const allocatedTotal = useMemo(() => {
    return segmentTotals.reduce((sum, segment) => sum + segment.total, 0);
  }, [segmentTotals]);

  const unallocated = totalBudget - allocatedTotal;

  // Pie chart data - only segments with values
  const pieData = useMemo(() => {
    const withValues = segmentTotals
      .filter(s => s.total > 0)
      .map(s => ({
        name: s.name,
        value: s.total,
        color: s.color,
        id: s.id
      }));

    // Add unallocated if there is any
    if (unallocated > 0) {
      withValues.push({
        name: 'Unallocated',
        value: unallocated,
        color: '#334155',
        id: 'unallocated'
      });
    }

    return withValues;
  }, [segmentTotals, unallocated]);

  // Add entry to segment
  const addEntry = (segmentId: string) => {
    setSegments(prev => prev.map(segment => {
      if (segment.id === segmentId) {
        return {
          ...segment,
          entries: [
            ...segment.entries,
            {
              id: `${segmentId}-${Date.now()}`,
              type: '',
              amount: 0,
              notes: ''
            }
          ]
        };
      }
      return segment;
    }));
  };

  // Update entry
  const updateEntry = (segmentId: string, entryId: string, field: keyof MarketingEntry, value: string | number) => {
    setSegments(prev => prev.map(segment => {
      if (segment.id === segmentId) {
        return {
          ...segment,
          entries: segment.entries.map(entry => {
            if (entry.id === entryId) {
              return { ...entry, [field]: value };
            }
            return entry;
          })
        };
      }
      return segment;
    }));
  };

  // Remove entry
  const removeEntry = (segmentId: string, entryId: string) => {
    setSegments(prev => prev.map(segment => {
      if (segment.id === segmentId) {
        return {
          ...segment,
          entries: segment.entries.filter(entry => entry.id !== entryId)
        };
      }
      return segment;
    }));
  };

  // Custom tooltip for pie chart - handles Unassigned + shows Vendor/Amount/Note
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Handle Unassigned slice
      if (data.id === 'unallocated') {
        return (
          <div className="rounded-lg p-3 shadow-lg" style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
            <p className="font-semibold mb-1" style={{ color: '#64748B' }}>Unassigned</p>
            <p className="text-lg font-bold" style={{ color: '#F59E0B' }}>
              ${data.value.toLocaleString()}
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              {((data.value / totalBudget) * 100).toFixed(1)}% of budget remaining
            </p>
            <p className="text-xs mt-2" style={{ color: '#64748B' }}>
              Allocate to segments below
            </p>
          </div>
        );
      }

      // Handle assigned segments
      const segment = segmentTotals.find(s => s.id === data.id);
      const topEntries = segment?.entries
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return (
        <div className="rounded-lg p-3 shadow-lg" style={{ backgroundColor: '#1E293B', border: '1px solid #334155', maxWidth: '280px' }}>
          <p className="font-semibold mb-1" style={{ color: data.color }}>{data.name}</p>
          <p className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
            ${data.value.toLocaleString()}
          </p>
          <p className="text-xs" style={{ color: '#94A3B8' }}>
            {((data.value / totalBudget) * 100).toFixed(1)}% of budget
          </p>
          {topEntries && topEntries.length > 0 && (
            <div className="mt-2 pt-2 space-y-2" style={{ borderTop: '1px solid #334155' }}>
              {topEntries.map(entry => (
                <div key={entry.id} className="text-xs">
                  <p style={{ color: '#F1F5F9', fontWeight: '500' }}>
                    Vendor: {entry.type || 'Not specified'}
                  </p>
                  <p style={{ color: '#10B981' }}>
                    Amount: ${entry.amount.toLocaleString()}
                  </p>
                  {entry.notes && (
                    <p style={{ color: '#64748B', fontStyle: 'italic' }}>
                      Note: {entry.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {(!topEntries || topEntries.length === 0) && (
            <p className="text-xs mt-2" style={{ color: '#64748B' }}>
              No entries yet - expand segment to add
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl p-6" style={{ backgroundColor: '#1E293B', border: '1px solid #334155' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold" style={{ color: '#F1F5F9' }}>
            Marketing Budget Breakdown
          </h3>
          <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
            14 segments • ${allocatedTotal.toLocaleString()} allocated of ${totalBudget.toLocaleString()}
          </p>
        </div>
        <button
          onClick={() => setShowPieChart(!showPieChart)}
          className="px-4 py-2 rounded-lg text-sm transition-colors"
          style={{
            backgroundColor: showPieChart ? '#10B981' : '#0F172A',
            color: showPieChart ? '#0F172A' : '#94A3B8',
            border: '1px solid #334155'
          }}
        >
          {showPieChart ? 'Hide Chart' : 'Show Chart'}
        </button>
      </div>

      {/* Pie Chart */}
      {showPieChart && pieData.length > 0 && (
        <div className="mb-6" style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                onClick={(data) => {
                  if (data.id !== 'unallocated') {
                    setExpandedSegment(expandedSegment === data.id ? null : data.id);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#0F172A"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Unallocated Warning */}
      {unallocated > 0 && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: '#0F172A', border: '1px solid #F59E0B' }}>
          <DollarSign size={20} style={{ color: '#F59E0B' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#F59E0B' }}>
              ${unallocated.toLocaleString()} unallocated
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              Assign to segments below to complete your budget breakdown
            </p>
          </div>
        </div>
      )}

      {unallocated < 0 && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-3" style={{ backgroundColor: '#0F172A', border: '1px solid #EF4444' }}>
          <DollarSign size={20} style={{ color: '#EF4444' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#EF4444' }}>
              ${Math.abs(unallocated).toLocaleString()} over budget
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              Reduce segment amounts or increase total budget
            </p>
          </div>
        </div>
      )}

      {/* Segment List - Collapsed by Default */}
      <button
        onClick={() => setShowSegmentList(!showSegmentList)}
        className="w-full mb-4 px-4 py-3 rounded-lg flex items-center justify-between transition-colors"
        style={{ backgroundColor: '#0F172A', border: '1px solid #334155' }}
      >
        <div className="flex items-center gap-3">
          {showSegmentList ? (
            <ChevronDown size={20} style={{ color: '#10B981' }} />
          ) : (
            <ChevronRight size={20} style={{ color: '#94A3B8' }} />
          )}
          <span className="font-medium" style={{ color: '#F1F5F9' }}>
            {showSegmentList ? 'Hide' : 'Show'} 14 Marketing Segments
          </span>
        </div>
        <span className="text-sm" style={{ color: '#64748B' }}>
          {segmentTotals.filter(s => s.total > 0).length} active
        </span>
      </button>

      {showSegmentList && (
      <div className="space-y-2">
        {segmentTotals.map((segment) => (
          <div key={segment.id} className="rounded-lg overflow-hidden" style={{ border: '1px solid #334155' }}>
            {/* Segment Header */}
            <button
              onClick={() => setExpandedSegment(expandedSegment === segment.id ? null : segment.id)}
              className="w-full px-4 py-3 flex items-center justify-between transition-colors"
              style={{ backgroundColor: expandedSegment === segment.id ? '#0F172A' : 'transparent' }}
            >
              <div className="flex items-center gap-3">
                {expandedSegment === segment.id ? (
                  <ChevronDown size={18} style={{ color: '#94A3B8' }} />
                ) : (
                  <ChevronRight size={18} style={{ color: '#94A3B8' }} />
                )}
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                  {segment.name}
                </span>
                {segment.entries.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#334155', color: '#94A3B8' }}>
                    {segment.entries.length} {segment.entries.length === 1 ? 'entry' : 'entries'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold" style={{ color: segment.total > 0 ? '#10B981' : '#64748B' }}>
                  ${segment.total.toLocaleString()}
                </span>
                {totalBudget > 0 && segment.total > 0 && (
                  <span className="text-xs" style={{ color: '#64748B' }}>
                    {((segment.total / totalBudget) * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </button>

            {/* Segment Entries */}
            {expandedSegment === segment.id && (
              <div className="px-4 pb-4" style={{ backgroundColor: '#0F172A' }}>
                {segment.entries.length === 0 ? (
                  <p className="text-sm py-3" style={{ color: '#64748B' }}>
                    No entries yet. Click "Add Entry" to start tracking.
                  </p>
                ) : (
                  <div className="space-y-3 mb-3">
                    {segment.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3">
                        <input
                          type="text"
                          value={entry.type}
                          onChange={(e) => updateEntry(segment.id, entry.id, 'type', e.target.value)}
                          placeholder="Type/Vendor"
                          className="flex-1 px-3 py-2 rounded text-sm"
                          style={{
                            backgroundColor: '#1E293B',
                            color: '#F1F5F9',
                            border: '1px solid #334155'
                          }}
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#64748B' }}>$</span>
                          <input
                            type="number"
                            value={entry.amount || ''}
                            onChange={(e) => updateEntry(segment.id, entry.id, 'amount', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-28 pl-7 pr-3 py-2 rounded text-sm text-right"
                            style={{
                              backgroundColor: '#1E293B',
                              color: '#F1F5F9',
                              border: '1px solid #334155'
                            }}
                          />
                        </div>
                        <input
                          type="text"
                          value={entry.notes}
                          onChange={(e) => updateEntry(segment.id, entry.id, 'notes', e.target.value)}
                          placeholder="Notes"
                          className="w-32 px-3 py-2 rounded text-sm"
                          style={{
                            backgroundColor: '#1E293B',
                            color: '#F1F5F9',
                            border: '1px solid #334155'
                          }}
                        />
                        <button
                          onClick={() => removeEntry(segment.id, entry.id)}
                          className="p-2 rounded transition-colors hover:bg-red-900/30"
                          style={{ color: '#EF4444' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => addEntry(segment.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors"
                  style={{
                    backgroundColor: '#1E293B',
                    color: '#10B981',
                    border: '1px solid #334155'
                  }}
                >
                  <Plus size={16} />
                  Add Entry
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Summary Footer */}
      <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid #334155' }}>
        <div>
          <p className="text-sm" style={{ color: '#94A3B8' }}>Total Allocated</p>
          <p className="text-2xl font-bold" style={{ color: '#10B981' }}>
            ${allocatedTotal.toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm" style={{ color: '#94A3B8' }}>Budget</p>
          <p className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>
            ${totalBudget.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default MarketingBreakdown;
