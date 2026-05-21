import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { User, Mail, Camera, Save, AlertCircle, Shield, Smartphone, Key, Lock, Languages, History } from 'lucide-react';
import { motion } from 'motion/react';
import { useUserStore } from '../../stores/userStore';

export const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { profile, updateProfile: updateUserStore } = useUserStore();
  const { t, i18n } = useTranslation('common');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
     if (profile) {
        setFullName(profile.display_name || profile.full_name || profile.username || user?.user_metadata?.full_name || '');
        setAvatarUrl(profile.avatar_url || user?.user_metadata?.avatar_url || '');
     }
  }, [profile, user]);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      // Also update auth meta
      const { error } = await supabase.auth.updateUser({
        data: { display_name: fullName, avatar_url: avatarUrl }
      });
      if (error) throw error;

      await updateUserStore({ display_name: fullName, avatar_url: avatarUrl });
      
      setMessage({ type: 'success', text: 'Terminal identity updated.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const generateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em]">{t('operatorProfile')}</h2>
          <p className="text-sm text-accent-primary font-bold mt-1 tracking-widest uppercase opacity-70">
            {t('clearanceLevel', { level: profile?.role || 'Elite' })} • {profile?.kyc_status || 'Unverified'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary/10 border border-accent-primary/20 rounded-lg text-[10px] font-bold text-accent-primary uppercase tracking-widest">
          <Shield size={12} /> Encrypted Session
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Identity Section */}
          <div className="glass-card p-8 holo-border relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
              <User size={20} className="text-accent-primary" />
              {t('identityConfig')}
            </h3>

            <div className="flex flex-col md:flex-row gap-8 relative z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={generateAvatar}>
                  <div className="w-32 h-32 rounded-full border-4 border-[#111] overflow-hidden shadow-neon-gold p-1 bg-gradient-to-br from-accent-primary to-yellow-600">
                    <img 
                      src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                      alt="Avatar" 
                      className="w-full h-full rounded-full bg-[#050505] object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera className="text-white mb-1" size={24} />
                     <span className="text-[10px] font-bold text-white uppercase tracking-wider">{t('cycleAvatar')}</span>
                  </div>
                </div>
              </div>

              <form onSubmit={updateProfile} className="flex-1 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('displayName')}</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#111] border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-accent-primary/50"
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={loading} className="px-8 py-3 bg-accent-primary/10 border border-accent-primary/30 rounded-xl text-xs font-bold text-accent-primary hover:bg-accent-primary hover:text-black shadow-neon-gold transition-all flex items-center gap-2">
                    {t('updateProtocol')} <Save size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Localization Section */}
          <div className="glass-card p-8 holo-border">
             <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <Languages size={20} className="text-accent-secondary" />
                {t('localizationUnits')}
             </h3>
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => changeLanguage('en')}
                  className={`p-4 rounded-xl border transition-all text-left ${i18n.language === 'en' ? 'bg-accent-secondary/10 border-accent-secondary/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                >
                   <p className="text-xs font-bold text-white mb-1">English (Global)</p>
                   <p className="text-[10px] text-slate-500 uppercase">Standard market terminology</p>
                </button>
                <button 
                  onClick={() => changeLanguage('de')}
                  className={`p-4 rounded-xl border transition-all text-left ${i18n.language === 'de' ? 'bg-accent-secondary/10 border-accent-secondary/50' : 'bg-white/5 border-white/5 hover:border-white/10'}`}
                >
                   <p className="text-xs font-bold text-white mb-1">Deutsch (German)</p>
                   <p className="text-[10px] text-slate-500 uppercase">Vollständige Lokalisierung</p>
                </button>
             </div>
          </div>

          {/* Security Section (Briefly) */}
          <div className="glass-card p-8 holo-border">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <Shield size={20} className="text-accent-secondary" />
              {t('advancedSecurity')}
            </h3>
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent-secondary/10 flex items-center justify-center text-accent-secondary">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{t('twoFactor')}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Secondary validation required</p>
                  </div>
                </div>
                <button 
                  onClick={() => setMfaEnabled(!mfaEnabled)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${mfaEnabled ? 'bg-accent-secondary' : 'bg-white/10'}`}
                >
                  <motion.div 
                    animate={{ x: mfaEnabled ? 26 : 2 }}
                    className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg"
                  />
                </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="glass-card p-6 border-accent-tertiary/20">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-accent-tertiary/20 flex items-center justify-center text-accent-tertiary shadow-neon-blue">
                    <History size={20} />
                 </div>
                 <h4 className="text-sm font-bold text-white uppercase tracking-widest">{t('entryHistory')}</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 italic">Last Session</span>
                    <span className="text-slate-300 font-mono">12m ago</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

