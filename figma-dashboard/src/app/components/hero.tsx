/**
 * Hero Landing Component - Aegis Directive
 * Professional value proposition for C-suite AI enablement
 *
 * Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
 * Created: 2026-02-23
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BarChart3, Shield, Zap } from 'lucide-react';
import { LoginModal } from './login-modal';

interface HeroProps {
  onEnterDashboard: () => void;
}

export function Hero({ onEnterDashboard }: HeroProps) {
  const [showLogin, setShowLogin] = useState(false);

  const handleAuthenticated = () => {
    setShowLogin(false);
    onEnterDashboard();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center text-white relative overflow-hidden">
        {/* Subtle gradient background */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)'
          }}
        />

        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-8"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              The Aegis Directive
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
            style={{ color: '#F1F5F9', lineHeight: '1.1' }}
          >
            Sovereign Data.{' '}
            <span style={{ color: '#10B981' }}>Immediate Action.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto"
            style={{ color: '#94A3B8', lineHeight: '1.6' }}
          >
            The Aegis Dealer does not guess and hope. They do not need another{' '}
            <span style={{ color: '#F1F5F9', fontWeight: '600' }}>"Insight"</span> on what they are doing well.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <button
              onClick={() => setShowLogin(true)}
              className="px-10 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
              style={{
                backgroundColor: '#10B981',
                color: '#0a0a0a',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
              }}
            >
              See the Intelligence in Action
              <ArrowRight size={20} />
            </button>
            <a
              href="https://linkedin.com/in/sean-jeremy-chappell"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 rounded-full font-semibold text-lg transition-all hover:bg-white/10 flex flex-col items-center justify-center"
              style={{
                border: '1px solid rgba(241, 245, 249, 0.3)',
                color: '#F1F5F9'
              }}
            >
              <span>Connect on LinkedIn</span>
              <span style={{ fontSize: '14px', color: '#94A3B8', marginTop: '2px' }}>
                or Email at sean@aegis-directive.com
              </span>
            </a>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          >
            <FeatureCard
              icon={Shield}
              title="Aegis Intelligence"
              description="Competitive intelligence dashboards for automotive thought leaders"
              confidence={78}
              chartData={[55, 62, 71, 68, 78]}
              actionLabel="View Market Intelligence"
            />
            <FeatureCard
              icon={BarChart3}
              title="Aegis Edge Check"
              description="3-tier inventory to Market analysis with accountable and measurable results"
              confidence={67}
              chartData={[45, 52, 58, 61, 67]}
              actionLabel="Run Inventory Analysis"
            />
            <FeatureCard
              icon={Zap}
              title="Aegis Content Engine"
              description="SERP-winning content generation with gap analysis"
              confidence={92}
              chartData={[75, 82, 88, 85, 92]}
              actionLabel="Generate Content By Model"
            />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ color: '#64748B', fontSize: '14px' }}>
          Enhanced EEAT Automation — Sean Jeremy Chappell
        </p>
        <p style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>
          Co-Authored-By: Alpha Claudette Chappell
        </p>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}

interface FeatureCardProps {
  icon: typeof Shield;
  title: string;
  description: string;
  confidence?: number;
  chartData?: number[];
  actionLabel?: string;
}

function FeatureCard({ icon: Icon, title, description, confidence = 67, chartData = [45, 72, 58, 89, 67], actionLabel = "Generate Aegis Campaign" }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative p-6 rounded-xl text-left transition-all"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
        style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
      >
        <Icon size={20} style={{ color: '#10B981' }} />
      </div>
      <h3 className="font-semibold text-lg mb-2" style={{ color: '#F1F5F9' }}>
        {title}
      </h3>
      <p style={{ color: '#94A3B8', fontSize: '14px', lineHeight: '1.5' }}>
        {description}
      </p>

      {/* Hover Tooltip */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute left-0 right-0 top-full mt-2 z-50 p-4 rounded-xl shadow-2xl"
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            minWidth: '260px'
          }}
        >
          {/* Mini Bar Chart */}
          <div className="mb-3">
            <p className="text-xs mb-2" style={{ color: '#64748B' }}>Performance Trend</p>
            <div className="flex items-end gap-1 h-12">
              {chartData.map((value, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-t transition-all"
                  style={{
                    height: `${value}%`,
                    backgroundColor: idx === chartData.length - 1 ? '#10B981' : 'rgba(16, 185, 129, 0.3)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Confidence Rating */}
          <div className="mb-3 pt-3" style={{ borderTop: '1px solid #334155' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: '#94A3B8' }}>Aegis Confidence</span>
              <span className="font-bold" style={{ color: '#10B981' }}>{confidence}%</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#334155' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${confidence}%`, backgroundColor: '#10B981' }}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: '#64748B' }}>Goal Completion Rating</p>
          </div>

          {/* Action Button */}
          <button
            className="w-full py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            {actionLabel}
          </button>
        </motion.div>
      )}
    </div>
  );
}

export default Hero;
