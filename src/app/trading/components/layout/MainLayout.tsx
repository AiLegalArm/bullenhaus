import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Bell, Search, Globe, ArrowRight, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useUserStore } from '../../stores/userStore';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('common');
  const { user } = useAuth();
  const { profile, fetchProfile } = useUserStore();

  useEffect(() => {
    if (user) {
      // @ts-ignore
      fetchProfile(user.id, user.email);
    }
  }, [user, fetchProfile]);

  const notifications: Array<{ id: string; title: string; message: string; time: string }> = [];

  const displayName = profile?.display_name || profile?.full_name || profile?.username || user?.email || 'User';
  const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;

  return (
    <div className="flex h-screen bg-surface-bg font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
           className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
           onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:inset-auto md:translate-x-0 md:w-auto transition-transform duration-300 ease-in-out h-full`}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Cinematic Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-border-glass bg-surface-bg/50 backdrop-blur-xl z-20">
          <div className="flex-1 flex items-center gap-4 max-w-xl">
             <button 
               className="md:hidden p-2 text-slate-400 hover:text-white"
               onClick={() => setIsMobileMenuOpen(true)}
             >
               <Menu size={24} />
             </button>
            <div className="relative group w-full hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={t('search') + "..."} 
                className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent-primary/30 focus:bg-white/10 transition-all font-mono placeholder:font-sans"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    navigate(`/markets?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
                    e.currentTarget.value = '';
                  }
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-[10px] text-slate-500">/</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-row items-center gap-1">
              <button 
                onClick={() => {
                  const nextLang = i18n.language === 'en' ? 'de' : 'en';
                  i18n.changeLanguage(nextLang);
                  toast.success(`Language changed to ${nextLang.toUpperCase()}`);
                }}
                className="p-2 cursor-pointer text-slate-400 hover:text-accent-primary transition-colors rounded-lg hover:bg-white/5 font-bold text-xs uppercase"
              >
                <Globe size={16} className="inline-block mr-1"/>
                {i18n.language}
              </button>
              
              {/* Notification Center */}
              <div className="relative">
                <button 
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-2 cursor-pointer text-slate-400 hover:text-accent-primary transition-colors relative rounded-lg hover:bg-white/5"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent-primary rounded-full border-2 border-surface-bg shadow-neon-gold" />
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-80 glass-card p-4 shadow-2xl z-50 holo-border origin-top-right"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest">System Alerts</h4>
                        <span 
                          onClick={() => {
                             toast.success('All notifications marked as read', { icon: '✓' });
                             setNotificationsOpen(false);
                          }}
                          className="text-[10px] font-bold text-accent-primary hover:text-white cursor-pointer transition-colors"
                        >
                          Mark All Read
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500 border border-white/5 rounded-xl">
                            No real notifications yet.
                          </div>
                        ) : notifications.map((notif, i) => (
                          <motion.div 
                            key={notif.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/5 transition-all group"
                          >
                            <div className="mt-0.5 p-1.5 rounded-lg border flex-shrink-0 bg-accent-primary/10 border-accent-primary/20 text-accent-primary">
                              <Bell size={14} />
                            </div>
                            <div className="flex-1">
                              <h5 className="text-xs font-bold text-white mb-0.5">{notif.title}</h5>
                              <p className="text-[10px] text-slate-400">{notif.message}</p>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{notif.time}</span>
                          </motion.div>
                        ))}
                      </div>

                      <button 
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate('/notifications');
                        }}
                        className="w-full mt-4 py-2 text-xs font-bold text-slate-400 hover:text-white border border-white/5 rounded-lg hover:bg-white/5 transition-all flex items-center justify-center gap-2 group"
                      >
                        View Log <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 mx-2" />

            <div 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 pl-2 cursor-pointer group"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-none mb-1 group-hover:text-accent-primary transition-colors">{displayName}</p>
                <div className="flex items-center justify-end gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${profile?.kyc_status === 'VERIFIED' ? 'bg-accent-secondary shadow-neon-emerald' : 'bg-orange-500 shadow-neon-gold'}`} />
                  <p className="text-[9px] font-bold text-accent-secondary uppercase tracking-tighter">
                    {profile?.role || 'LITE'} • {profile?.kyc_status || 'UNVERIFIED'}
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="w-10 h-10 rounded-xl border border-white/10 p-0.5 overflow-hidden group-hover:border-accent-primary transition-colors group-hover:shadow-neon-gold">
                   <img src={avatarUrl} alt="avatar" className="w-full h-full rounded-lg bg-[#111]" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          {/* Background Ambient Lights */}
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-accent-primary/20 blur-[150px] rounded-full pointer-events-none z-[-1]" />
          <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-accent-secondary/10 blur-[150px] rounded-full pointer-events-none z-[-1]" />
          
          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
