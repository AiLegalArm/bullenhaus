import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, AlertCircle, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { crmService } from '../../services/crmService';
import { getAttribution } from '../../hooks/useAttribution';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: name,
          }
        }
      });

      if (error) throw error;

      if (data.session?.access_token) {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
          body: JSON.stringify({ action: 'ensureProfile', displayName: name }),
        });
      }
      
      try {
        const attribution = getAttribution();
        const token = data.session?.access_token;
        const externalTraderId = data.user?.id;
        if (!externalTraderId) {
          throw new Error('Registration completed without a Supabase user id.');
        }

        await crmService.registerClient({
          external_trader_id: externalTraderId,
          full_name: name,
          email,
          account: {
            external_account_id: `ACC-${externalTraderId}`,
            platform: 'Bullenhaus',
            account_type: 'real',
            currency: 'USD',
            balance: 0,
            equity: 0,
            leverage: 100,
          },
          ...(attribution ? { attribution } : {}),
        }, token);
      } catch (crmError) {
        console.error('Failed to register in CRM:', crmError);
      }

      if (data.session) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="glass-card p-8 w-full text-center relative overflow-hidden holo-border">
        <div className="w-16 h-16 mx-auto bg-accent-secondary/10 rounded-full flex items-center justify-center mb-6 shadow-neon-emerald">
           <UserPlus size={24} className="text-accent-secondary" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Clearance Pending</h2>
        <p className="text-sm text-slate-400 mb-6">
          Your elite operator application has been submitted. Check your comms (email) to verify your identity before accessing the terminal.
        </p>
        <Link to="/auth/login" className="inline-block px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all uppercase tracking-wider">
          Return to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card p-8 w-full relative overflow-hidden holo-border">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-tertiary to-transparent opacity-50" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Operator Application</h2>
        <p className="text-sm text-slate-400 mt-1">Apply for access to the BULLENHAUS terminal.</p>
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

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={16} className="text-accent-primary/50" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 transition-all"
              placeholder="Neon Trader"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Secure Email</label>
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

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Passphrase</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={16} className="text-accent-primary/50" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#111] border border-white/5 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/50 transition-all"
              placeholder="Min. 8 characters"
              required
              minLength={8}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 mt-6 bg-accent-primary/10 border border-accent-primary/30 rounded-xl text-sm font-bold text-accent-primary hover:bg-accent-primary hover:text-black shadow-neon-gold hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
          ) : (
            <>
              Submit Application <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center border-t border-white/5 pt-6">
        <p className="text-xs text-slate-400">
          Existing operator? <Link to="/auth/login" className="font-bold text-accent-primary hover:text-white transition-colors ml-1 uppercase tracking-wider">Initialize</Link>
        </p>
      </div>
    </div>
  );
};
