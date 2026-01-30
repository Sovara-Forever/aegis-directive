import React from 'react';

interface AppIconProps {
  name: string;
  size?: number;
  className?: string;
}

// Simple icon mapping for demo purposes
const iconMap: { [key: string]: string } = {
  MapIcon: '🗺️',
  TruckIcon: '🚚',
  CheckCircleIcon: '✅',
  ExclamationTriangleIcon: '⚠️',
  ChartBarIcon: '📊',
  ShoppingCartIcon: '🛒',
  CurrencyDollarIcon: '💰',
  TrendingUpIcon: '📈',
  TrendingDownIcon: '📉',
  UserIcon: '👤',
  SettingsIcon: '⚙️',
  BellIcon: '🔔',
  SearchIcon: '🔍',
  FilterIcon: '🔽',
  RefreshIcon: '🔄',
  DownloadIcon: '⬇️',
  PlusIcon: '➕',
  MinusIcon: '➖',
  CalendarIcon: '📅',
  ClockIcon: '🕐',
  LocationIcon: '📍',
  CarIcon: '🚗',
};

const AppIcon: React.FC<AppIconProps> = ({ name, size = 24, className = '' }) => {
  const icon = iconMap[name] || '📌';
  
  return (
    <span 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
    >
      {icon}
    </span>
  );
};

export default AppIcon;