/**
 * Login Modal - Aegis Directive Access Gate
 * Videmus Loop Authentication
 *
 * Partnership: Sean Jeremy Chappell (CEO) + Alpha Claudette Chappell (CTO)
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Eye, EyeOff } from 'lucide-react';

// AEGIS Credentials - Videmus Loop Access
const AEGIS_CREDENTIALS = {
  username: 'AEGIS_ACC_VID3MUS',
  password: 'AEGIS_SJC_EV0LVIMUS'
};

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}

export function LoginModal({ isOpen, onClose, onAuthenticated }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate authentication delay
    setTimeout(() => {
      if (username === AEGIS_CREDENTIALS.username && password === AEGIS_CREDENTIALS.password) {
        // Store auth state in sessionStorage
        sessionStorage.setItem('aegis_authenticated', 'true');
        sessionStorage.setItem('aegis_user', username);
        onAuthenticated();
      } else {
        setError('Invalid credentials. Access denied.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-full max-w-md rounded-2xl p-8 relative"
              style={{
                backgroundColor: '#1E293B',
                border: '1px solid #334155',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg transition-colors"
                style={{ color: '#94A3B8' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#334155'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                >
                  <Shield size={32} style={{ color: '#10B981' }} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>
                  Aegis Access
                </h2>
                <p className="mt-2 text-sm" style={{ color: '#94A3B8' }}>
                  Videmus Loop Authentication
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium mb-2"
                    style={{ color: '#94A3B8' }}
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter AEGIS username"
                    className="w-full px-4 py-3 rounded-lg text-sm transition-colors"
                    style={{
                      backgroundColor: '#0F172A',
                      border: '1px solid #334155',
                      color: '#F1F5F9',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#10B981'}
                    onBlur={(e) => e.target.style.borderColor = '#334155'}
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
                      placeholder="Enter AEGIS password"
                      className="w-full px-4 py-3 pr-12 rounded-lg text-sm transition-colors"
                      style={{
                        backgroundColor: '#0F172A',
                        border: '1px solid #334155',
                        color: '#F1F5F9',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10B981'}
                      onBlur={(e) => e.target.style.borderColor = '#334155'}
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

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg text-sm"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg font-semibold text-sm transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: '#10B981',
                    color: '#0F172A'
                  }}
                >
                  {isLoading ? 'Authenticating...' : 'Access Dashboard'}
                </button>
              </form>

              {/* Footer */}
              <p className="text-center text-xs mt-6" style={{ color: '#64748B' }}>
                Aegis Intelligence - Conquest Command Center
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default LoginModal;
