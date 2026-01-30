import { FileText, Plus, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const pipelineData = {
  draft: [
    { title: '2026 Chevy Silverado Flatwoods WV', eta: 'Jan 9', target: '#3-5' },
    { title: 'Best SUV Deals Near Charleston', eta: 'Jan 12', target: '#5-8' },
    { title: 'Chevy Equinox vs Honda CR-V', eta: 'Jan 15', target: '#8-12' },
    { title: 'Used Trucks Flatwoods WV', eta: 'Jan 18', target: '#2-4' },
    { title: 'Chevy Trax Review 2026', eta: 'Jan 20', target: '#6-10' },
  ],
  published: [
    { title: 'Chevy SUV Comparison', rank: 6, clicks: 2800 },
    { title: 'Silverado 1500 Specs', rank: 12, clicks: 1200 },
    { title: 'Best Chevy Dealer Flatwoods', rank: 3, clicks: 850 },
    { title: '2025 Equinox Review', rank: 8, clicks: 1500 },
    { title: 'Chevy Financing Options', rank: 15, clicks: 680 },
  ],
  top10: [
    { title: 'Midstate Chevy', rank: 1, clicks: 320 },
    { title: 'Flatwoods Chevrolet', rank: 2, clicks: 180 },
    { title: 'Best Chevy Dealer Flatwoods', rank: 3, clicks: 850 },
    { title: 'Chevy SUV', rank: 6, clicks: 2800 },
    { title: 'New Silverado Flatwoods', rank: 4, clicks: 420 },
  ],
};

export function ContentPipeline() {
  const [showGenerator, setShowGenerator] = useState(false);
  const [formData, setFormData] = useState({
    keyword: '',
    model: '',
    type: 'showcase',
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-semibold mb-2" style={{ fontSize: '36px', color: '#F1F5F9' }}>
            AI Power Page Factory
          </h1>
          <p style={{ fontSize: '18px', color: '#94A3B8' }}>
            Automated SEO content targeting #1-3 rankings
          </p>
        </div>
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all"
          style={{ backgroundColor: '#10B981', color: '#F1F5F9', fontSize: '16px' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#10B981';
          }}
        >
          <Plus size={20} />
          Generate New Power Page
        </button>
      </div>

      {/* Generator Form */}
      {showGenerator && (
        <div 
          className="rounded-xl p-6 mb-8"
          style={{ 
            backgroundColor: '#1E293B',
            border: '2px solid #10B981'
          }}
        >
          <h3 className="mb-4 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
            New Power Page Generator
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block mb-2" style={{ fontSize: '14px', color: '#94A3B8' }}>
                Target Keyword
              </label>
              <input
                type="text"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                placeholder="e.g., 2026 chevy silverado flatwoods"
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F1F5F9',
                  border: '1px solid #334155',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: '14px', color: '#94A3B8' }}>
                Model/Category
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F1F5F9',
                  border: '1px solid #334155',
                  fontSize: '14px',
                }}
              >
                <option value="">Select model...</option>
                <option value="silverado">Silverado 1500</option>
                <option value="silverado2500">Silverado 2500</option>
                <option value="equinox">Equinox</option>
                <option value="trax">Trax</option>
                <option value="general">General/Location</option>
              </select>
            </div>
            <div>
              <label className="block mb-2" style={{ fontSize: '14px', color: '#94A3B8' }}>
                Content Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: '#0F172A',
                  color: '#F1F5F9',
                  border: '1px solid #334155',
                  fontSize: '14px',
                }}
              >
                <option value="showcase">Showcase Page</option>
                <option value="comparison">Comparison Guide</option>
                <option value="guide">Buyer's Guide</option>
                <option value="local">Local Landing Page</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="px-6 py-2 rounded-lg font-medium transition-all"
              style={{ backgroundColor: '#10B981', color: '#F1F5F9', fontSize: '14px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#10B981';
              }}
            >
              Generate & Publish
            </button>
            <button
              className="px-6 py-2 rounded-lg font-medium transition-all"
              style={{ 
                backgroundColor: 'transparent', 
                color: '#F1F5F9',
                border: '1px solid #334155',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#334155';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Save as Draft
            </button>
            <button
              onClick={() => setShowGenerator(false)}
              className="px-6 py-2 rounded-lg font-medium transition-all"
              style={{ 
                backgroundColor: 'transparent', 
                color: '#94A3B8',
                fontSize: '14px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Draft Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={20} style={{ color: '#F59E0B' }} />
              <h3 className="font-semibold" style={{ fontSize: '18px', color: '#F1F5F9' }}>
                Draft
              </h3>
            </div>
            <span 
              className="px-2 py-1 rounded"
              style={{ 
                backgroundColor: '#F59E0B20',
                color: '#F59E0B',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {pipelineData.draft.length}
            </span>
          </div>
          <div className="space-y-3">
            {pipelineData.draft.map((item, index) => (
              <div
                key={index}
                className="rounded-lg p-4"
                style={{ 
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155'
                }}
              >
                <h4 className="font-medium mb-2" style={{ fontSize: '14px', color: '#F1F5F9' }}>
                  {item.title}
                </h4>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                    ETA: {item.eta}
                  </span>
                  <span 
                    className="px-2 py-0.5 rounded"
                    style={{ 
                      backgroundColor: '#F59E0B20',
                      color: '#F59E0B',
                      fontSize: '12px'
                    }}
                  >
                    Target: {item.target}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Published Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText size={20} style={{ color: '#0EA5E9' }} />
              <h3 className="font-semibold" style={{ fontSize: '18px', color: '#F1F5F9' }}>
                Published
              </h3>
            </div>
            <span 
              className="px-2 py-1 rounded"
              style={{ 
                backgroundColor: '#0EA5E920',
                color: '#0EA5E9',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {pipelineData.published.length}
            </span>
          </div>
          <div className="space-y-3">
            {pipelineData.published.map((item, index) => (
              <div
                key={index}
                className="rounded-lg p-4"
                style={{ 
                  backgroundColor: '#1E293B',
                  border: '1px solid #334155'
                }}
              >
                <h4 className="font-medium mb-2" style={{ fontSize: '14px', color: '#F1F5F9' }}>
                  {item.title}
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-0.5 rounded"
                      style={{ 
                        backgroundColor: item.rank <= 10 ? '#10B98120' : '#F59E0B20',
                        color: item.rank <= 10 ? '#10B981' : '#F59E0B',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                    >
                      #{item.rank}
                    </span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      {item.clicks}/mo
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={20} style={{ color: '#10B981' }} />
              <h3 className="font-semibold" style={{ fontSize: '18px', color: '#F1F5F9' }}>
                Top 10 Rankings
              </h3>
            </div>
            <span 
              className="px-2 py-1 rounded"
              style={{ 
                backgroundColor: '#10B98120',
                color: '#10B981',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              {pipelineData.top10.length}
            </span>
          </div>
          <div className="space-y-3">
            {pipelineData.top10.map((item, index) => (
              <div
                key={index}
                className="rounded-lg p-4"
                style={{ 
                  backgroundColor: '#1E293B',
                  border: item.rank <= 3 ? '2px solid #10B981' : '1px solid #334155'
                }}
              >
                <h4 className="font-medium mb-2" style={{ fontSize: '14px', color: '#F1F5F9' }}>
                  {item.title}
                </h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="px-2 py-0.5 rounded font-bold"
                      style={{ 
                        backgroundColor: '#10B98120',
                        color: '#10B981',
                        fontSize: '14px'
                      }}
                    >
                      #{item.rank}
                    </span>
                    <span className="font-medium" style={{ fontSize: '12px', color: '#10B981' }}>
                      {item.clicks}/mo
                    </span>
                  </div>
                  {item.rank <= 3 && (
                    <CheckCircle size={16} style={{ color: '#10B981' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div 
        className="mt-8 rounded-xl p-6"
        style={{ backgroundColor: '#1E293B' }}
      >
        <h3 className="mb-4 font-semibold" style={{ fontSize: '20px', color: '#F1F5F9' }}>
          Pipeline Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
              Total Pages
            </div>
            <div className="font-bold" style={{ fontSize: '30px', color: '#F1F5F9' }}>
              55
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
              Avg. Rank
            </div>
            <div className="font-bold" style={{ fontSize: '30px', color: '#10B981' }}>
              8.2
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
              Monthly Clicks
            </div>
            <div className="font-bold" style={{ fontSize: '30px', color: '#0EA5E9' }}>
              12.4K
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>
              Est. Traffic Value
            </div>
            <div className="font-bold" style={{ fontSize: '30px', color: '#F59E0B' }}>
              $18.2K
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
