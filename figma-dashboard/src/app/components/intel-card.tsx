import { ChevronDown, Shield } from 'lucide-react';
import { useState } from 'react';

interface IntelCardProps {
  title: string;
  severity: 'critical' | 'high' | 'medium';
  summary: string;
  details: string;
  recommendation: string;
}

export function IntelCard({ title, severity, summary, details, recommendation }: IntelCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const severityColors = {
    critical: '#EF4444',
    high: '#F59E0B',
    medium: '#0EA5E9',
  };

  const severityLabels = {
    critical: '🔴 Critical',
    high: '🟡 High',
    medium: '🔵 Medium',
  };

  const color = severityColors[severity];

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{
        backgroundColor: '#1E293B',
        border: `1px solid ${color}40`,
      }}
    >
      {/* Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between text-left transition-colors"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0F172A';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div className="flex items-start gap-3 flex-1">
          <Shield size={20} style={{ color, flexShrink: 0, marginTop: '2px' }} />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-semibold" style={{ fontSize: '16px', color: '#F1F5F9' }}>
                {title}
              </h4>
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {severityLabels[severity]}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#94A3B8' }}>{summary}</p>
          </div>
        </div>
        <ChevronDown
          size={20}
          style={{ color: '#94A3B8', flexShrink: 0 }}
          className={`transition-transform ml-3 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div
          className="px-4 pb-4 space-y-3"
          style={{ borderTop: `1px solid ${color}20` }}
        >
          <div className="pt-3">
            <h5 className="font-medium mb-2" style={{ fontSize: '14px', color: '#F1F5F9' }}>
              Details
            </h5>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6' }}>
              {details}
            </p>
          </div>

          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: '#10B98110', border: '1px solid #10B981' }}
          >
            <h5 className="font-medium mb-1" style={{ fontSize: '14px', color: '#10B981' }}>
              💡 Recommended Action
            </h5>
            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6' }}>
              {recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
