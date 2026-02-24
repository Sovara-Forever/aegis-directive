/**
 * Hero Landing Component - Aegis Directive
 * Professional value proposition for C-suite AI enablement
 *
 * Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
 * Created: 2026-02-23
 */

import { motion } from 'motion/react';
import { ArrowRight, BarChart3, Shield, Zap } from 'lucide-react';

interface HeroProps {
  onEnterDashboard: () => void;
}

export function Hero({ onEnterDashboard }: HeroProps) {
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
            The AI Purchase That{' '}
            <span style={{ color: '#10B981' }}>Actually Moves the P&L</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto"
            style={{ color: '#94A3B8', lineHeight: '1.6' }}
          >
            I help C-suite leaders turn Gemini 3.1 Pro, NotebookLM + Gems into permanent
            retention & adoption infrastructure — the same systems I used to deliver{' '}
            <span style={{ color: '#F1F5F9', fontWeight: '600' }}>95%+ client retention</span> and{' '}
            <span style={{ color: '#F1F5F9', fontWeight: '600' }}>$2.4M portfolio growth</span>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <button
              onClick={onEnterDashboard}
              className="px-10 py-4 rounded-full font-semibold text-lg transition-all flex items-center justify-center gap-2 hover:scale-105"
              style={{
                backgroundColor: '#10B981',
                color: '#0a0a0a',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
              }}
            >
              See the Dashboard in Action
              <ArrowRight size={20} />
            </button>
            <a
              href="https://linkedin.com/in/sean-jeremy-chappell"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 rounded-full font-semibold text-lg transition-all hover:bg-white/10"
              style={{
                border: '1px solid rgba(241, 245, 249, 0.3)',
                color: '#F1F5F9'
              }}
            >
              Connect on LinkedIn
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
              description="Competitive intelligence dashboards for automotive dealerships"
            />
            <FeatureCard
              icon={BarChart3}
              title="Reality Check"
              description="3-tier inventory analysis with 45-day DOL industry standard"
            />
            <FeatureCard
              icon={Zap}
              title="AI Content Engine"
              description="SERP-winning content generation with gap analysis"
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
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  return (
    <div
      className="p-6 rounded-xl text-left transition-all hover:scale-105"
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}
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
    </div>
  );
}

export default Hero;
