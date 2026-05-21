import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  PhoneCall, 
  Sparkles, 
  Settings, 
  ShieldCheck,
  TrendingUp,
  FileText,
  LogOut,
  Menu,
  X,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  Database
} from "lucide-react";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useI18n } from "../lib/i18n";

const getNavForRole = (role: string, t: (key: string) => string) => {
  switch (role) {
    case 'director':
      return [
        { name: t('navDirectorDashboard'), href: '/', icon: LayoutDashboard },
        { name: t('navVipClients'), href: '/clients', icon: Users },
        { name: t('navTrading'), href: '/trading', icon: TrendingUp },
        { name: t('navCallCenter'), href: '/call-center', icon: PhoneCall },
        { name: t('navAdvertisers'), href: '/advertisers', icon: Megaphone },
        { name: t('navData'), href: '/data-management', icon: Database },
        { name: t('navSpec'), href: '/spec', icon: FileText },
        { name: t('navReports'), href: '/reports', icon: FileText },
      ];
    case 'admin':
      return [
        { name: t('navAdminPanel'), href: '/', icon: Settings },
        { name: t('navAdvertisers'), href: '/advertisers', icon: Megaphone },
        { name: t('navData'), href: '/data-management', icon: Database },
        { name: t('navSpec'), href: '/spec', icon: FileText },
      ];
    case 'manager':
      return [
        { name: t('navManagerDashboard'), href: '/', icon: LayoutDashboard },
        { name: t('navTeamPipeline'), href: '/clients', icon: Users },
        { name: t('navCallCenter'), href: '/call-center', icon: PhoneCall },
        { name: t('navReports'), href: '/reports', icon: FileText },
        { name: t('navSpec'), href: '/spec', icon: FileText },
      ];
    case 'agent':
      return [
        { name: t('navAgentWorkspace'), href: '/', icon: LayoutDashboard },
        { name: t('navActiveDialer'), href: '/call-center', icon: PhoneCall },
        { name: t('navMyLeads'), href: '/clients', icon: Users },
        { name: t('navSpec'), href: '/spec', icon: FileText },
      ];
    default:
      return [];
  }
}

export function Layout({ children, role, onLogout }: { children: ReactNode, role: string, onLogout: () => void }) {
  const { t, locale, toggleLocale } = useI18n();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ id: number, message: string, type: 'alert' | 'success'} | null>(null);
  
  const navigation = getNavForRole(role, t);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Simulate WebSocket Events
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setToast({ id: Date.now(), message: "ALERT: Alexander R. triggered Margin Call", type: 'alert' });
    }, 15000);

    const timer2 = setTimeout(() => {
      setToast({ id: Date.now(), message: "SUCCESS: $50,000 FTD processed for Elena Volkov", type: 'success' });
    }, 45000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const SidebarContent = () => (
    <>
      <div className="flex h-20 items-center px-8 shrink-0 justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-aura-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]"></div>
          <span className="text-xs font-bold tracking-[0.3em] text-aura-gold">AURA</span>
        </div>
        <button className="md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <X className="w-5 h-5 text-aura-platinum/50" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-6 relative z-10 custom-scrollbar">
        <div>
          <div className="mb-2 px-4 text-[10px] font-bold tracking-widest text-aura-platinum/30 uppercase">{t('commandCenter')}</div>
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={clsx(
                    "flex items-center gap-4 px-4 py-3 rounded text-sm transition-colors",
                    isActive 
                      ? "bg-white/5 text-aura-gold border-l-2 border-aura-gold/50" 
                      : "text-aura-platinum/50 hover:bg-white/5 hover:text-aura-platinum border-l-2 border-transparent"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-6 border-t border-glass-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-gradient-to-tr from-aura-gold to-aura-gold-light p-[1px]">
              <div className="h-full w-full rounded bg-sidebar-bg flex items-center justify-center">
                <span className="text-[10px] font-bold text-aura-gold uppercase">{role.substring(0, 2)}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider uppercase">{role}</div>
              <div className="text-[9px] uppercase tracking-widest text-aura-gold">{t('auraAccount')}</div>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-aura-platinum/30 hover:text-aura-ruby transition-colors relative group">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-aura-black text-aura-platinum flex font-sans selection:bg-aura-gold/30">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded bg-[#121214] border shadow-2xl backdrop-blur-md min-w-[320px] max-w-lg
              ${toast.type === 'alert' 
                ? 'border-aura-ruby/50 shadow-[0_10px_40px_rgba(225,29,72,0.15)]' 
                : 'border-aura-emerald/50 shadow-[0_10px_40px_rgba(16,185,129,0.1)]'
              }
            `}
          >
             {toast.type === 'alert' ? (
                <AlertTriangle className="w-5 h-5 text-aura-ruby shrink-0" />
             ) : (
                <CheckCircle2 className="w-5 h-5 text-aura-emerald shrink-0" />
             )}
             <span className="text-xs font-mono font-medium">{toast.message}</span>
             <button onClick={() => setToast(null)} className="ml-auto text-aura-platinum/50 hover:text-aura-platinum">
               <X className="w-4 h-4" />
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="w-72 bg-[#0A0A0B] border-r border-glass-border flex-col shrink-0 relative overflow-hidden hidden md:flex">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0A0A0B] border-r border-glass-border flex flex-col md:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative h-screen overflow-hidden bg-gradient-to-br from-[#050505] to-[#0A0A0B]">
        {/* Global Command/Alert Bar */}
        <div className="h-8 bg-[#0A0A0B] border-b border-glass-border flex items-center justify-between px-6 shrink-0 relative z-30 overflow-hidden">
          <div className="flex items-center gap-4 text-[9px] uppercase tracking-widest font-mono text-aura-platinum/40">
             <span className="flex items-center gap-1.5"><BellRing className="w-3 h-3 text-aura-platinum/30" /> {t('systemStatusOnline')}</span>
             <span className="hidden sm:inline">|</span>
             <span className="hidden sm:inline">LATENCY: 12MS</span>
             <span className="hidden md:inline">|</span>
             <span className="hidden md:inline">{t('tradingEngineConnected')}</span>
          </div>
          <div className="text-[9px] uppercase tracking-widest font-mono text-aura-platinum/40 flex items-center gap-3">
             <span>{t('secureSessionActive')}</span>
          </div>
        </div>

        {/* Header */}
        <header className="h-16 md:h-20 border-b border-glass-border bg-black/20 backdrop-blur-md px-6 md:px-10 flex items-center justify-between shrink-0 relative z-20">
          <div className="flex items-center gap-4">
             <button className="md:hidden p-2 -ml-2 text-aura-platinum/50 hover:text-aura-platinum" onClick={() => setMobileMenuOpen(true)}>
               <Menu className="w-5 h-5" />
             </button>
             <h1 className="font-serif text-xl md:text-2xl font-light italic tracking-tight hidden sm:block">
               {navigation.find(n => n.href === location.pathname)?.name || t('commandCenter')}
             </h1>
          </div>
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aura-emerald opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-aura-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              </span>
              <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-aura-emerald">{t('aiCoreActive')}</span>
            </div>
            <button
              type="button"
              onClick={toggleLocale}
              className="rounded border border-white/10 bg-black/30 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-aura-platinum/60 hover:text-aura-gold hover:border-aura-gold/30"
              title={t('switchLanguage')}
            >
              {locale === 'en' ? 'DE' : 'EN'}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative z-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4 pb-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
