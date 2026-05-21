import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passphrases do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update protocol keys.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card p-8 w-full text-center relative overflow-hidden holo-border">
        <div className="w-16 h-16 mx-auto bg-accent-secondary/10 rounded-full flex items-center justify-center mb-6 shadow-neon-emerald">
           <CheckCircle size={24} className="text-accent-secondary" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Protocol Restored</h2>
        <p className="text-sm text-slate-400 mb-6">
          Your security keys have been updated. Redirecting to terminal entrance...
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 w-full relative overflow-hidden holo-border">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-50" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Update Passphrase</h2>
        <p className="text-sm text-slate-400 mt-1">Re-establish your terminal encryption keys.</p>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-6 p-4 rounded-xl bg-accent-quaternary/10 border border-accent-quaternary/30 flex items-start gap-3"
        >
          <AlertCircle className="text-accent-quaternary shrink-0 mt-0.5" size={16} />
          <p className="text-xs text-accent-quaternary">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Passphrase</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={16} className="text-accent-primary/50" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent-primary/50 transition-all"
              placeholder="••••••••••••"
              required
              minLength={8}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Keys</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={16} className="text-accent-primary/50" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent-primary/50 transition-all"
              placeholder="••••••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-6 bg-accent-primary/10 border border-accent-primary/30 rounded-xl text-sm font-bold text-accent-primary hover:bg-accent-primary hover:text-black shadow-neon-gold active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
          ) : (
            <>
              Confirm Reconfiguration <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
