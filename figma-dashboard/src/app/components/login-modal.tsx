/**
 * LoginScreen — Aegis Intelligence Auth Gate
 * Real Supabase email + password. No sign-up. Admin-created users only.
 *
 * Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginScreenProps {
  onAuthenticated: () => void;
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      setError('Invalid email or password.');
      setIsLoading(false);
      return;
    }

    // Session is now active — RLS will apply on all subsequent queries
    onAuthenticated();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0F172A' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
            >
              <Shield size={32} style={{ color: '#10B981' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>
              Aegis Intelligence
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#94A3B8' }}>
              Conquest Command Center
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: '#94A3B8' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg text-sm"
                style={{
                  backgroundColor: '#0F172A',
                  border: '1px solid #334155',
                  color: '#F1F5F9',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#10B981')}
                onBlur={(e) => (e.target.style.borderColor = '#334155')}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: '#94A3B8' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-12 rounded-lg text-sm"
                  style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #334155',
                    color: '#F1F5F9',
                    outline: 'none',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#10B981')}
                  onBlur={(e) => (e.target.style.borderColor = '#334155')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: '#64748B' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#EF4444',
                }}
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#10B981', color: '#0F172A' }}
            >
              {isLoading ? 'Signing in...' : 'Access Dashboard'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: '#334155' }}>
            Access is by invitation only
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginScreen;
