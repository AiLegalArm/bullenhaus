import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthLayout: React.FC = () => {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) {
    return <Navigate to={role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-surface-bg relative flex flex-col justify-center items-center p-4 overflow-hidden">
      {/* Background Cinematic Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-accent-primary/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-accent-tertiary/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Brand Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center mb-10"
        >
          <img 
            src="/logo.png" 
            alt="Bullenhaus Logo" 
            className="w-full max-w-[240px] h-auto object-contain"
            onError={(e) => {
              // Hide broken image
              e.currentTarget.style.display = 'none';
              // Show fallback
              const fallback = document.getElementById('auth-logo-fallback');
              if(fallback) fallback.style.display = 'flex';
            }}
          />
          
          <div id="auth-logo-fallback" className="hidden flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-primary to-yellow-600 flex items-center justify-center shadow-neon-gold mb-4">
              <TrendingUp size={32} className="text-black" />
            </div>
            <h1 className="text-3xl font-bold tracking-[0.2em] text-white">BULLENHAUS</h1>
            <p className="text-[10px] font-bold text-accent-primary tracking-[0.3em] uppercase mt-2">Trade. Invest. Grow.</p>
          </div>
        </motion.div>

        {/* Content Wrapper */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          <Outlet />
        </motion.div>
      </div>

      {/* Footer Text */}
      <div className="absolute bottom-6 text-center z-10">
        <p className="text-xs text-slate-500 tracking-wider">
          &copy; {new Date().getFullYear()} BULLENHAUS INC. ELITE TRADING TERMINAL
        </p>
      </div>
    </div>
  );
};
