import React from 'react';
import { motion } from 'motion/react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthLayout: React.FC = () => {
  const { session, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) {
    return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/trade/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] p-4 relative">
      {/* Dynamic Background Effects (Aura style) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent-primary/5 via-background to-background" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary/10 rounded-full blur-[120px] pointer-events-none" />
      {/* No full-screen dark overlay */}

      {/* Content Wrapper */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-[420px] z-10"
      >
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Bullenhaus Logo" className="h-20 object-contain drop-shadow-2xl" />
        </div>
        <div className="relative">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
};
