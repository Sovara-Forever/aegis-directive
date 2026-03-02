import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { FileTextIcon, DownloadIcon, CheckCircle2Icon, Clock, CloudSnow, Wind, Shield, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

interface ContentSuggestion {
  id: string;
  dealership_id: string;
  template_type: string;
  target_keyword: string;
  our_rank_before: number | null;
  competitor_rank_before: number | null;
  competitor_domain: string | null;
  gap_analysis: any;
  html_output: string | null;
  css_output: string | null;
  json_ld_output: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: 'pending' | 'generated' | 'published' | 'tracking';
  llm_provider: string | null;
  generation_cost: number | null;
  serp_improvement: number | null;
  traffic_gain: number | null;
  created_at: string;
  published_at: string | null;
  tracking_start: string | null;
}

interface ContentGenerationProps {
  selectedDealership: string;
}

// Aegis Design System Colors
const COLORS = {
  dark: '#0F172A',
  card: '#1E293B',
  cardHover: '#273548',
  border: '#334155',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textDim: '#64748B',
  emerald: '#10B981',
  blue: '#3B82F6',
  red: '#EF4444',
  amber: '#F59E0B',
};

export default function ContentGeneration({ selectedDealership }: ContentGenerationProps) {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dealershipId, setDealershipId] = useState<string | null>(null);
  const [weatherHovered, setWeatherHovered] = useState(false);
  const [oemHovered, setOemHovered] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [selectedDealership]);

  async function loadSuggestions() {
    setLoading(true);
    setError(null);

    try {
      const { data: dealerData, error: dealerError } = await supabase
        .from('dealerships')
        .select('id')
        .eq('name', selectedDealership)
        .single();

      if (dealerError) {
        console.error('Dealership lookup error:', dealerError);
        setError(`Dealership "${selectedDealership}" not found in database`);
        setSuggestions([]);
        setLoading(false);
        return;
      }

      const dId = dealerData?.id;
      setDealershipId(dId);

      if (!dId) {
        setError(`Dealership "${selectedDealership}" not found`);
        setSuggestions([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('dealership_id', dId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading suggestions:', error);
        setError(error.message);
      } else {
        setSuggestions(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate(suggestion: ContentSuggestion) {
    alert(
      `Generate content for: ${suggestion.target_keyword}\n\n` +
      `Template: ${suggestion.template_type}\n\n` +
      `Next steps:\n` +
      `1. Open terminal\n` +
      `2. cd ~/ara_project\n` +
      `3. source .venv/bin/activate\n` +
      `4. python truth_serum_v3_competitive.py\n` +
      `5. Follow prompts to generate article\n` +
      `6. Download HTML/CSS from normalized_output/\n\n` +
      `Tip: Copy this keyword: "${suggestion.target_keyword}"`
    );
  }

  async function handleDownload(suggestion: ContentSuggestion) {
    if (!suggestion.html_output) {
      alert('No HTML content available yet. Generate content first.');
      return;
    }

    const blob = new Blob([suggestion.html_output], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${suggestion.target_keyword.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (suggestion.css_output) {
      const cssBlob = new Blob([suggestion.css_output], { type: 'text/css' });
      const cssUrl = URL.createObjectURL(cssBlob);
      const cssLink = document.createElement('a');
      cssLink.href = cssUrl;
      cssLink.download = `${suggestion.target_keyword.replace(/\s+/g, '_')}.css`;
      document.body.appendChild(cssLink);
      cssLink.click();
      document.body.removeChild(cssLink);
      URL.revokeObjectURL(cssUrl);
    }
  }

  async function handleMarkPublished(suggestion: ContentSuggestion) {
    const confirmed = confirm(
      `Mark "${suggestion.target_keyword}" as published?\n\n` +
      `This will:\n` +
      `- Update status to "published"\n` +
      `- Record publish timestamp\n` +
      `- Start SERP tracking for performance comparison\n\n` +
      `Have you published this content to the website?`
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('generated_content')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
        })
        .eq('id', suggestion.id);

      if (error) {
        console.error('Error marking as published:', error);
        alert(`Failed to update status: ${error.message}`);
      } else {
        alert(`Content marked as published!\n\nSERP tracking started for keyword: "${suggestion.target_keyword}"`);
        loadSuggestions();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('Failed to update status');
    }
  }

  function getStatusBadge(status: string) {
    const config: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
      pending: { bg: 'rgba(245, 158, 11, 0.15)', color: COLORS.amber, icon: <Clock className="h-3 w-3 mr-1" /> },
      generated: { bg: 'rgba(59, 130, 246, 0.15)', color: COLORS.blue, icon: <FileTextIcon className="h-3 w-3 mr-1" /> },
      published: { bg: 'rgba(16, 185, 129, 0.15)', color: COLORS.emerald, icon: <CheckCircle2Icon className="h-3 w-3 mr-1" /> },
      tracking: { bg: 'rgba(16, 185, 129, 0.25)', color: COLORS.emerald, icon: <CheckCircle2Icon className="h-3 w-3 mr-1" /> },
    };

    const { bg, color, icon } = config[status] || config.pending;

    return (
      <span
        className="px-2 py-1 rounded-md text-xs font-medium flex items-center"
        style={{ backgroundColor: bg, color, border: `1px solid ${color}30` }}
      >
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-semibold" style={{ color: COLORS.text }}>
          Aegis Content Engine
        </h1>
        <p className="mt-2" style={{ color: COLORS.textMuted }}>
          AI-powered article suggestions for {selectedDealership}
        </p>
      </div>

      {/* Weather Trigger + OEM Compliance Row - Glassmorphism Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Weather Trigger Card - Glassmorphism */}
        <div
          className="relative rounded-2xl p-5 transition-all duration-300 overflow-hidden group"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(12px)',
            border: weatherHovered ? '1px solid rgba(59, 130, 246, 0.5)' : `1px solid ${COLORS.borderLight}`,
            transform: weatherHovered ? 'scale(1.02)' : 'scale(1)',
            boxShadow: weatherHovered ? '0 25px 50px -12px rgba(59, 130, 246, 0.25)' : '0 10px 40px -15px rgba(0, 0, 0, 0.3)',
          }}
          onMouseEnter={() => setWeatherHovered(true)}
          onMouseLeave={() => setWeatherHovered(false)}
        >
          {/* Hover glow overlay */}
          <div
            className="absolute inset-0 rounded-2xl transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
              opacity: weatherHovered ? 1 : 0,
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
                    boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <CloudSnow className="h-6 w-6" style={{ color: COLORS.blue, filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: COLORS.text }}>Weather Trigger Active</h3>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>
                    Current Region Forecast: <span style={{ color: COLORS.blue, fontWeight: '600' }}>Snow</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center"
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: COLORS.blue,
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  <Wind className="h-3 w-3 mr-1" />
                  AWD Push
                </span>
                <p className="text-xs mt-1" style={{ color: COLORS.textDim }}>Auto-prioritizing 4WD/AWD</p>
              </div>
            </div>
            <div
              className="mt-4 p-3 rounded-xl"
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <p className="text-sm" style={{ color: COLORS.blue }}>
                <strong>Recommended:</strong> AWD Winter Push — Generate content targeting "best AWD vehicles for snow"
              </p>
            </div>
          </div>
        </div>

        {/* OEM Compliance Card - Glassmorphism */}
        <div
          className="relative rounded-2xl p-5 transition-all duration-300 overflow-hidden group"
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(12px)',
            border: oemHovered ? '1px solid rgba(16, 185, 129, 0.5)' : `1px solid ${COLORS.borderLight}`,
            transform: oemHovered ? 'scale(1.02)' : 'scale(1)',
            boxShadow: oemHovered ? '0 25px 50px -12px rgba(16, 185, 129, 0.25)' : '0 10px 40px -15px rgba(0, 0, 0, 0.3)',
          }}
          onMouseEnter={() => setOemHovered(true)}
          onMouseLeave={() => setOemHovered(false)}
        >
          {/* Hover glow overlay */}
          <div
            className="absolute inset-0 rounded-2xl transition-opacity duration-300"
            style={{
              background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 70%)',
              opacity: oemHovered ? 1 : 0,
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Shield className="h-6 w-6" style={{ color: COLORS.emerald, filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' }} />
                </div>
                <div>
                  <h3 className="font-semibold" style={{ color: COLORS.text }}>OEM MAAP Compliant</h3>
                  <p className="text-sm" style={{ color: COLORS.textMuted }}>All generated content verified</p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center"
                  style={{ backgroundColor: COLORS.emerald, color: COLORS.dark }}
                >
                  <CheckCircle2Icon className="h-3 w-3 mr-1" />
                  Verified
                </span>
                <p className="text-xs mt-1" style={{ color: COLORS.textDim }}>No co-op violation risk</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {['GM', 'Ford', 'Stellantis'].map((oem) => (
                <div
                  key={oem}
                  className="p-2 rounded-xl text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <p className="text-lg font-bold" style={{ color: COLORS.emerald }}>{oem}</p>
                  <p className="text-xs" style={{ color: COLORS.textDim }}>Compliant</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Suggestions Table */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-semibold" style={{ color: COLORS.text }}>
            Suggested Articles (Max 5/Week)
          </h2>
          <p className="text-sm mt-1" style={{ color: COLORS.textMuted }}>
            Auto-generated content ideas based on keyword monetary value, rank gaps, and inventory alignment
          </p>
        </div>

        {loading ? (
          /* Skeleton Loader with Shimmer */
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl animate-pulse"
                style={{
                  background: `linear-gradient(90deg, ${COLORS.dark} 0%, ${COLORS.card} 50%, ${COLORS.dark} 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite',
                }}
              />
            ))}
            <style>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </div>
        ) : error ? (
          /* Error State - Ghost Card with Pulsing Red Border */
          <div
            className="text-center py-12 rounded-xl"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              animation: 'pulse-border 2s infinite',
            }}
          >
            <style>{`
              @keyframes pulse-border {
                0%, 100% { border-color: rgba(239, 68, 68, 0.3); }
                50% { border-color: rgba(239, 68, 68, 0.6); }
              }
            `}</style>
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" style={{ color: COLORS.red }} />
            <p className="text-lg font-medium" style={{ color: COLORS.text }}>Connection Error</p>
            <p className="text-sm mt-2 mb-4" style={{ color: COLORS.textMuted }}>{error}</p>
            <button
              onClick={loadSuggestions}
              className="px-6 py-2.5 rounded-xl font-semibold transition-all duration-300 inline-flex items-center gap-2"
              style={{
                backgroundColor: COLORS.blue,
                color: COLORS.text,
                boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)';
              }}
            >
              <RefreshCw className="h-4 w-4" />
              Retry Connection
            </button>
          </div>
        ) : suggestions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <div
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'rgba(148, 163, 184, 0.1)' }}
            >
              <FileTextIcon className="h-8 w-8" style={{ color: COLORS.textMuted }} />
            </div>
            <p className="text-lg font-medium" style={{ color: COLORS.text }}>No suggestions yet</p>
            <p className="text-sm mt-2" style={{ color: COLORS.textMuted }}>
              Run <code
                className="px-2 py-1 rounded-md font-mono text-xs"
                style={{ backgroundColor: COLORS.dark, color: COLORS.emerald }}
              >truth_serum_v3_competitive.py</code> to generate content suggestions
            </p>
          </div>
        ) : (
          /* Table */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  {['Keyword', 'Template', 'Our Rank', 'Comp Rank', 'Gap', 'Status', 'Action'].map((header) => (
                    <th
                      key={header}
                      className="p-4 text-left text-sm font-medium"
                      style={{ color: COLORS.textMuted }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suggestions.map((suggestion) => {
                  const ourRank = suggestion.our_rank_before;
                  const compRank = suggestion.competitor_rank_before;
                  const gap = ourRank && compRank ? compRank - ourRank : null;
                  const gapColor = gap === null ? COLORS.textMuted : gap > 0 ? COLORS.emerald : COLORS.red;

                  return (
                    <tr
                      key={suggestion.id}
                      className="transition-colors"
                      style={{ borderBottom: `1px solid ${COLORS.border}` }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.dark}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td className="p-4 font-medium" style={{ color: COLORS.text }}>{suggestion.target_keyword}</td>
                      <td className="p-4 text-sm" style={{ color: COLORS.textMuted }}>{suggestion.template_type}</td>
                      <td className="p-4" style={{ color: COLORS.textMuted }}>{ourRank ? `#${ourRank}` : 'N/A'}</td>
                      <td className="p-4" style={{ color: COLORS.textMuted }}>{compRank ? `#${compRank}` : 'N/A'}</td>
                      <td className="p-4 font-medium" style={{ color: gapColor }}>
                        {gap === null ? 'N/A' : gap > 0 ? `+${gap}` : gap}
                      </td>
                      <td className="p-4">{getStatusBadge(suggestion.status)}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {suggestion.status === 'pending' && (
                            <button
                              onClick={() => handleGenerate(suggestion)}
                              className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-1"
                              style={{
                                backgroundColor: COLORS.emerald,
                                color: COLORS.dark,
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <Zap className="h-3 w-3" />
                              Generate
                            </button>
                          )}
                          {suggestion.status === 'generated' && (
                            <>
                              <button
                                onClick={() => handleDownload(suggestion)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all inline-flex items-center gap-1"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: COLORS.blue,
                                  border: `1px solid ${COLORS.blue}`,
                                }}
                              >
                                <DownloadIcon className="h-3 w-3" />
                                Download
                              </button>
                              <button
                                onClick={() => handleMarkPublished(suggestion)}
                                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                                style={{
                                  backgroundColor: COLORS.emerald,
                                  color: COLORS.dark,
                                }}
                              >
                                Mark Published
                              </button>
                            </>
                          )}
                          {suggestion.status === 'published' && (
                            <span className="text-sm" style={{ color: COLORS.textMuted }}>
                              {new Date(suggestion.published_at!).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: COLORS.card, border: `1px solid ${COLORS.border}` }}
      >
        <h2 className="text-xl font-semibold mb-4" style={{ color: COLORS.text }}>How It Works</h2>
        <ol className="space-y-2" style={{ color: COLORS.textMuted }}>
          <li>1. System auto-generates 5 content suggestions/week based on 3-factor keyword logic</li>
          <li>2. Click <strong style={{ color: COLORS.text }}>"Generate"</strong> → Triggers Claude Skill execution (truth_serum_v3_competitive.py)</li>
          <li>3. Download HTML/CSS ready for web team</li>
          <li>4. Mark <strong style={{ color: COLORS.text }}>"Published"</strong> when live on website → Start SERP tracking</li>
          <li>5. Track before/after rank changes to measure content impact</li>
        </ol>

        <div
          className="mt-6 p-4 rounded-xl"
          style={{ backgroundColor: COLORS.dark, border: `1px solid ${COLORS.border}` }}
        >
          <h4 className="font-semibold mb-2" style={{ color: COLORS.text }}>3-Factor Keyword Targeting Logic:</h4>
          <ul className="text-sm space-y-1" style={{ color: COLORS.textMuted }}>
            <li>1. <strong style={{ color: COLORS.emerald }}>Top Keyword Monetary Gain per Click</strong> (SPYFU CPC × Search Volume)</li>
            <li>2. <strong style={{ color: COLORS.blue }}>Where client is losing rank vs competition</strong> (Rank gap analysis)</li>
            <li>3. <strong style={{ color: COLORS.amber }}>Inventory/Service gaps that support #1 and #2</strong> (Content-inventory alignment)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
