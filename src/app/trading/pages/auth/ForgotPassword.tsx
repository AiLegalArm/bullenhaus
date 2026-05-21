import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during password reset.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card p-8 w-full text-center relative overflow-hidden holo-border">
        <div className="w-16 h-16 mx-auto bg-accent-secondary/10 rounded-full flex items-center justify-center mb-6 shadow-neon-emerald">
           <ShieldCheck size={24} className="text-accent-secondary" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Decryption Sent</h2>
        <p className="text-sm text-slate-400 mb-6">
          A secure link to re-establish your passphrase has been dispatched to your email.
        </p>
        <Link to="/auth/login" className="inline-block px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-wider">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 w-full relative overflow-hidden holo-border">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Recover Access</h2>
        <p className="text-sm text-slate-400 mt-1">Initiate protocol to regain terminal clearance.</p>
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
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Verified Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={16} className="text-accent-primary/50" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 transition-all"
              placeholder="operator@bullenhaus.com"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Deploy Reset Link <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-white/5 pt-6">
        <Link to="/auth/login" className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider">
          Cancel Sequence
        </Link>
      </div>
    </div>
  );
};
