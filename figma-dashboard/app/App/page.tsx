import type { Metadata } from 'next';
import OverviewDashboard from './components/OverviewDashboard';

export const metadata: Metadata = {
  title: 'Overview Dashboard - Aegis Intelligence',
  description: 'Aegis Intelligence automotive dealership analytics dashboard - Track sales projections, marketing ROI, and inventory performance.',
};

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0F172A] p-6">
      <OverviewDashboard />
    </div>
  );
}