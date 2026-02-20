import {
  Home,
  Target,
  AlertTriangle,
  FileText,
  Calculator,
  Database,
  Settings,
  ChevronLeft,
  LayoutDashboard
} from 'lucide-react';
import { useState } from 'react';
import { DealershipSelector } from './dealership-selector';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  selectedDealership: string;
  onDealershipChange: (dealership: string) => void;
}

export function Sidebar({ activePage, onNavigate, selectedDealership, onDealershipChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'executive', label: 'Executive Overview', icon: Home },
    { id: 'competitor', label: 'Competitor Insights', icon: Target },
    { id: 'waste', label: 'Waste Audit', icon: AlertTriangle },
    { id: 'content', label: 'Content Pipeline', icon: FileText },
    { id: 'roi', label: 'ROI Projector', icon: Calculator },
  ];

  const bottomItems = [
    { id: 'data', label: 'Data Sources', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen transition-all duration-300 z-40 ${
        isCollapsed ? 'w-16' : 'w-60'
      } lg:translate-x-0`}
      style={{ backgroundColor: '#1E293B' }}
    >
      <div className="flex flex-col h-full">
        {/* Logo & Header */}
        <div className="p-6 border-b" style={{ borderColor: '#334155' }}>
          {!isCollapsed && (
            <>
              <h1 className="font-semibold" style={{ fontSize: '24px', color: '#0066CC' }}>
                Aegis
              </h1>
              <p className="mt-1" style={{ fontSize: '12px', color: '#94A3B8' }}>
                Conquest Intelligence
              </p>
              <div className="mt-4">
                <DealershipSelector
                  selectedDealership={selectedDealership}
                  onDealershipChange={onDealershipChange}
                />
              </div>
            </>
          )}
          {isCollapsed && (
            <div className="font-bold text-center" style={{ fontSize: '20px', color: '#0066CC' }}>
              A
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? '#0066CC' : 'transparent',
                    color: isActive ? '#F1F5F9' : '#94A3B8',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#334155';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span style={{ fontSize: '14px' }}>{item.label}</span>}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 h-px" style={{ backgroundColor: '#334155' }} />

          {/* Bottom Navigation */}
          <div className="space-y-1">
            {bottomItems.map((item) => {
              const Icon = item.icon;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isCollapsed ? 'justify-center' : ''
                  }`}
                  style={{ color: '#94A3B8' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#334155';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon size={20} />
                  {!isCollapsed && <span style={{ fontSize: '14px' }}>{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t" style={{ borderColor: '#334155' }}>
          {!isCollapsed && (
            <p className="text-center" style={{ fontSize: '12px', color: '#64748B' }}>
              Powered by Sovereign Desk
              <br />
              Updated Jan 7, 2026
            </p>
          )}
          
          {/* Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mt-3 w-full flex items-center justify-center p-2 rounded-lg transition-all"
            style={{ color: '#94A3B8' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <ChevronLeft 
              size={20} 
              className={`transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>
    </aside>
  );
}