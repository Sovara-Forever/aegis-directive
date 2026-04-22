/**
 * Aegis Directive - Main Application
 * Auth-gated. Jackie (client) → conquest map only. Sean (admin) → full access.
 *
 * Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
 */

import { useState, useEffect } from "react";
import { Sidebar } from "./components/sidebar";
import { ExecutiveOverview } from "./components/executive-overview";
import { CompetitorInsights } from "./components/competitor-insights";
import { WasteAudit } from "./components/waste-audit";
import ContentGeneration from "./components/content-generation";
import { ContentPipeline } from "./components/content-pipeline";
import { ROIProjector } from "./components/roi-projector";
import { OverviewDashboard } from "./components/overview-dashboard";
import { ConquestMap } from "./components/conquest-map";
import { LoginScreen } from "./components/login-modal";
import { Menu } from "lucide-react";
import { useAuth } from "../lib/auth";

export default function App() {
  const { user, profile, loading, signOut } = useAuth();
  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDealership, setSelectedDealership] = useState("Mid-State Chevrolet");
  const [selectedTimeFrame, setSelectedTimeFrame] = useState("last_30_days");
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const isClient = profile?.role === 'client';

  // Client users go straight to the conquest map and stay there
  useEffect(() => {
    if (isClient) {
      setActivePage("map");
      // Lock dealership to their assigned one if available
      if (profile?.dealership_name) {
        setSelectedDealership(profile.dealership_name);
      }
    }
  }, [isClient, profile?.dealership_name]);

  const handleCustomRangeChange = (startDate: Date | null, endDate: Date | null) => {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);
  };

  // Loading state — brief spinner while session resolves
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0F172A' }}
      >
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: '#10B981' }}
        />
      </div>
    );
  }

  // Not authenticated — show login screen
  if (!user) {
    return <LoginScreen onAuthenticated={() => {}} />;
  }

  const renderPage = () => {
    // Client role: conquest map only, no other routes accessible
    if (isClient) {
      return <ConquestMap selectedDealership={selectedDealership} />;
    }

    switch (activePage) {
      case "overview":
        return <OverviewDashboard selectedDealership={selectedDealership} selectedTimeFrame={selectedTimeFrame} />;
      case "executive":
        return <ExecutiveOverview selectedDealership={selectedDealership} />;
      case "map":
        return <ConquestMap selectedDealership={selectedDealership} />;
      case "competitor":
        return <CompetitorInsights />;
      case "waste":
        return <WasteAudit />;
      case "content":
        return <ContentPipeline selectedDealership={selectedDealership} />;
      case "roi":
        return <ROIProjector />;
      case "data":
        return (
          <div>
            <h1 className="font-semibold mb-4" style={{ fontSize: "36px", color: "#F1F5F9" }}>
              Data Sources
            </h1>
            <div className="rounded-xl p-6" style={{ backgroundColor: "#1E293B" }}>
              <p style={{ fontSize: "16px", color: "#94A3B8" }}>
                Connected data sources and integrations will be configured here.
              </p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div>
            <h1 className="font-semibold mb-4" style={{ fontSize: "36px", color: "#F1F5F9" }}>
              Settings
            </h1>
            <div className="rounded-xl p-6" style={{ backgroundColor: "#1E293B" }}>
              <p style={{ fontSize: "16px", color: "#94A3B8" }}>
                Dashboard settings and preferences will be managed here.
              </p>
            </div>
          </div>
        );
      default:
        return <ExecutiveOverview selectedDealership={selectedDealership} />;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#0F172A",
        fontFamily: "Inter, -apple-system, system-ui, sans-serif",
      }}
    >
      {/* Mobile Menu Button */}
      {!isClient && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg"
          style={{ backgroundColor: "#1E293B", color: "#F1F5F9" }}
        >
          <Menu size={24} />
        </button>
      )}

      {/* Sidebar — admin only */}
      {!isClient && (
        <div className={`${sidebarOpen ? "block" : "hidden"} lg:block`}>
          <Sidebar
            activePage={activePage}
            onNavigate={(page) => {
              setActivePage(page);
              setSidebarOpen(false);
            }}
            selectedDealership={selectedDealership}
            onDealershipChange={setSelectedDealership}
            selectedTimeFrame={selectedTimeFrame}
            onTimeFrameChange={setSelectedTimeFrame}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
            onCustomRangeChange={handleCustomRangeChange}
            onSignOut={signOut}
            userEmail={user.email}
            userRole={profile?.role ?? 'admin'}
          />
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && !isClient && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Client: full-screen conquest map with sign-out */}
      {isClient && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-3">
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            {user.email}
          </span>
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              backgroundColor: '#1E293B',
              color: '#94A3B8',
              border: '1px solid #334155',
            }}
          >
            Sign out
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className={isClient ? "min-h-screen" : "lg:pl-60 min-h-screen"}>
        <div className={isClient ? "p-4 md:p-8" : "p-4 md:p-8 max-w-7xl"}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
