import React, { useState } from "react";
import { Shield, Building2, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { apiLogin, authStorage } from "../lib/auth";
import { useI18n } from "../lib/i18n";

export function Login({ onLogin }: { onLogin: (role: string) => void }) {
  const { t, locale, toggleLocale } = useI18n();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      await apiLogin(email, password);
      const role = authStorage.getRole();
      if (role) onLogin(role);
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aura-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-aura-gold blur-[150px] opacity-10 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-aura-emerald blur-[150px] opacity-10 mix-blend-screen pointer-events-none" />
      <button
        type="button"
        onClick={toggleLocale}
        className="absolute right-5 top-5 z-20 rounded border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-aura-platinum/60 hover:text-aura-gold hover:border-aura-gold/30"
      >
        {locale === "en" ? "DE" : "EN"}
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121214]/80 p-8 shadow-2xl backdrop-blur-xl relative z-10"
      >
        {/* Logo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-12 w-12 rounded bg-gradient-to-br from-[#121214] to-[#0A0A0B] border border-aura-gold/30 flex items-center justify-center mb-6 shadow-inner">
            <Building2 className="w-6 h-6 text-aura-gold" />
          </div>
          <h1 className="font-serif text-3xl font-light italic tracking-tight text-aura-platinum mb-2">
            {t('loginTitle')}
          </h1>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 uppercase">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-5 flex items-center gap-3 rounded border border-aura-ruby/30 bg-aura-ruby/5 px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 text-aura-ruby shrink-0" />
              <span className="text-xs text-aura-ruby">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-aura-platinum/40 mb-2">
              {t('loginEmail')}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@auracrm.com"
              className="w-full bg-black/40 border border-glass-border rounded px-4 py-3 text-sm text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors placeholder:text-aura-platinum/20"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-aura-platinum/40 mb-2">
              {t('loginPassword')}
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                placeholder="••••••••••"
                className="w-full bg-black/40 border border-glass-border rounded px-4 py-3 pr-11 text-sm text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors placeholder:text-aura-platinum/20"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-platinum/30 hover:text-aura-platinum/60 transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full mt-2 flex items-center justify-center gap-2 bg-aura-gold text-black font-bold text-[10px] uppercase tracking-widest py-3.5 rounded border border-aura-gold-light/20 hover:bg-aura-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,175,55,0.15)]"
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('loginLoading')}</>
              : <><Shield className="w-3.5 h-3.5" /> {t('loginButton')}</>
            }
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] text-aura-platinum/30">
          Protected by Aura Security Protocol v2 · Session encrypted end-to-end
        </p>
      </motion.div>
    </div>
  );
}
