import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  metric: string;
  value: string;
  sub: string;
  change: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
  icon?: LucideIcon;
}

export function KPICard({ metric, value, sub, change, variant = 'info', icon: Icon }: KPICardProps) {
  const isPositive = change.startsWith('+');
  
  const variantColors = {
    info: '#0EA5E9',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  };

  const accentColor = variantColors[variant];

  return (
    <div
      className="rounded-xl p-6 transition-all hover:shadow-lg"
      style={{
        backgroundColor: '#1E293B',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.25)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.3)';
      }}
    >
      {/* Icon & Metric Label */}
      <div className="flex items-center justify-between mb-3">
        <span style={{ fontSize: '14px', color: '#94A3B8' }}>{metric}</span>
        {Icon && <Icon size={20} style={{ color: accentColor }} />}
      </div>

      {/* Large Value */}
      <div className="mb-2">
        <span 
          className="font-semibold" 
          style={{ fontSize: '36px', color: '#F1F5F9', lineHeight: '1.2' }}
        >
          {value}
        </span>
      </div>

      {/* Sub Label */}
      <div className="mb-3">
        <span style={{ fontSize: '14px', color: '#94A3B8' }}>{sub}</span>
      </div>

      {/* Change Indicator */}
      <div className="flex items-center gap-1.5">
        {isPositive ? (
          <ArrowUp size={16} style={{ color: '#10B981' }} />
        ) : (
          <ArrowDown size={16} style={{ color: '#EF4444' }} />
        )}
        <span 
          className="font-medium" 
          style={{ 
            fontSize: '14px', 
            color: isPositive ? '#10B981' : '#EF4444' 
          }}
        >
          {change}
        </span>
      </div>
    </div>
  );
}
