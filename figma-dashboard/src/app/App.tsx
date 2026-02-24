/**
 * Aegis Directive - Main Application
 * Landing page + Dashboard with global dealer state
 *
 * Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
 */

import { useState } from "react";
import { Sidebar } from "./components/sidebar";
import { ExecutiveOverview } from "./components/executive-overview";
import { CompetitorInsights } from "./components/competitor-insights";
import { WasteAudit } from "./components/waste-audit";
import ContentGeneration from "./components/content-generation";
import { ROIProjector } from "./components/roi-projector";
import { OverviewDashboard } from "./components/overview-dashboard";
import { Hero } from "./components/hero";
import { Menu } from "lucide-react";

export default function App() {
  const [mode, setMode] = useState<'landing' | 'dashboard'>('landing');
  const [activePage, setActivePage] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDealership, setSelectedDealership] = useState("Mid-State Chevrolet & Buick");

  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return <OverviewDashboard selectedDealership={selectedDealership} />;
      case "executive":
        return <ExecutiveOverview selectedDealership={selectedDealership} />;
      case "competitor":
        return <CompetitorInsights />;
      case "waste":
        return <WasteAudit />;
      case "content":
        return <ContentGeneration selectedDealership={selectedDealership} />;
      case "roi":
        return <ROIProjector />;
      case "data":
        return (
          <div>
            <h1
              className="font-semibold mb-4"
              style={{ fontSize: "36px", color: "#F1F5F9" }}
            >
              Data Sources
            </h1>
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: "#1E293B" }}
            >
              <p style={{ fontSize: "16px", color: "#94A3B8" }}>
                Connected data sources and integrations will be
                configured here.
              </p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div>
            <h1
              className="font-semibold mb-4"
              style={{ fontSize: "36px", color: "#F1F5F9" }}
            >
              Settings
            </h1>
            <div
              className="rounded-xl p-6"
              style={{ backgroundColor: "#1E293B" }}
            >
              <p style={{ fontSize: "16px", color: "#94A3B8" }}>
                Dashboard settings and preferences will be
                managed here.
              </p>
            </div>
          </div>
        );
      default:
        return <ExecutiveOverview selectedDealership={selectedDealership} />;
    }
  };

  // Show Hero landing page first
  if (mode === 'landing') {
    return <Hero onEnterDashboard={() => setMode('dashboard')} />;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "#0F172A",
        fontFamily:
          "Inter, -apple-system, system-ui, sans-serif",
      }}
    >
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg"
        style={{ backgroundColor: "#1E293B", color: "#F1F5F9" }}
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "block" : "hidden"} lg:block`}
      >
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            setActivePage(page);
            setSidebarOpen(false);
          }}
          selectedDealership={selectedDealership}
          onDealershipChange={setSelectedDealership}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:pl-60 min-h-screen">
        <div className="p-4 md:p-8 max-w-7xl">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}