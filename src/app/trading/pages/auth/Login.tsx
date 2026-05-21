import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      const token = data.session?.access_token;
      let target = '/dashboard';
      if (token) {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'ensureProfile' }),
        }).catch(() => null);
        const { data: profile } = await supabase.from('users').select('role').eq('id', data.user.id).single();
        if (profile?.role === 'ADMIN') target = '/admin';
      }
      navigate(target, { replace: true });
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-8 w-full relative overflow-hidden holo-border">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-primary to-transparent opacity-50" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Access Terminal</h2>
        <p className="text-sm text-slate-400 mt-1">Authenticate to enter the elite trading ecosystem.</p>
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

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Identity</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={16} className="text-accent-primary/50" />
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 transition-all"
              placeholder="Username or Operator Email"
              required
            />
          </div>
        </div>

        <div>
           <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Passphrase</label>
            <Link to="/auth/forgot-password" className="text-xs font-bold text-accent-primary hover:text-white transition-colors">Forgot?</Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={16} className="text-accent-primary/50" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 transition-all"
              placeholder="••••••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-4 bg-gradient-to-r from-accent-primary to-yellow-600 rounded-xl text-sm font-bold text-black shadow-neon-gold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <>
              Connect Protocol <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-white/5 pt-6">
        <p className="text-xs text-slate-400">
          Unregistered operator? <Link to="/auth/register" className="font-bold text-accent-primary hover:text-white transition-colors ml-1 uppercase tracking-wider">Apply Here</Link>
        </p>
      </div>
    </div>
  );
};
