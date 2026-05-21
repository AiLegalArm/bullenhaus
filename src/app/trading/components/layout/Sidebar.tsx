import React from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Repeat,
  Briefcase,
  Wallet,
  History,
  Trophy,
  Users,
  Users2,
  Bell,
  ShieldCheck,
  UserCircle,
  Settings,
  LifeBuoy,
  LogOut,
  Globe,
  Moon,
  GraduationCap,
  Terminal,
  X,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { ProTraderCard, SentimentGauge } from './SidebarWidgets';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  alert?: number;
  to?: string;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, alert, to, onClick }: SidebarItemProps) => {
  const content = (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
        active ? "bg-accent-primary/10 text-accent-primary" : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={cn("transition-colors", active ? "text-accent-primary" : "group-hover:text-slate-100")} />
        <span className="font-medium text-sm tracking-wide">{label}</span>
      </div>
      {alert && (
        <span className="bg-accent-primary text-[10px] text-black px-1.5 py-0.5 rounded-full font-bold">
          {alert}
        </span>
      )}
    </motion.div>
  );

  return to ? <Link to={to} className="block" onClick={onClick}>{content}</Link> : content;
};

export const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, role } = useAuth();
  const currentPath = location.pathname;

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  return (
    <aside className="w-64 h-full border-r border-border-glass bg-surface-bg flex flex-col p-4">
      <div className="flex flex-col items-center gap-2 mb-8 pr-4 relative min-h-[100px] justify-center">
        {onClose && (
           <button onClick={onClose} className="absolute right-0 top-0 md:hidden p-2 text-slate-400 hover:text-white z-10">
              <X size={20} />
           </button>
        )}
        <img 
          src="/logo.png" 
          alt="Bullenhaus Logo" 
          className="w-full max-w-[160px] h-auto object-contain mt-2"
          onError={(e) => {
            // Hide broken image
            e.currentTarget.style.display = 'none';
            // Show fallback
            const fallback = document.getElementById('logo-fallback');
            if(fallback) fallback.style.display = 'flex';
          }}
        />
        <div id="logo-fallback" className="hidden flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-primary to-yellow-600 flex items-center justify-center shadow-neon-gold mt-2">
            <TrendingUp size={24} className="text-black" />
          </div>
          <div className="text-center mt-2">
            <p className="text-xl font-bold tracking-[0.2em] text-white">BULLENHAUS</p>
            <p className="text-[7px] font-bold text-slate-500 tracking-[0.3em] uppercase">Trade. Invest. Grow.</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto custom-scrollbar pr-2">
        <SidebarItem icon={LayoutDashboard} label={t('dashboard')} to="/dashboard" active={currentPath === '/dashboard'} onClick={onClose} />
        <SidebarItem icon={BarChart3} label={t('markets')} to="/markets" active={currentPath === '/markets'} onClick={onClose} />
        <SidebarItem icon={Repeat} label={t('trade')} to="/trade" active={currentPath === '/trade'} onClick={onClose} />
        <SidebarItem icon={Briefcase} label={t('portfolio')} to="/portfolio" active={currentPath === '/portfolio'} onClick={onClose} />
        <SidebarItem icon={Wallet} label={t('wallet')} to="/portfolio" active={currentPath === '/portfolio'} onClick={onClose} />
        <SidebarItem icon={History} label={t('transactions')} to="/transactions" active={currentPath === '/transactions'} onClick={onClose} />
        
        <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('growth', { defaultValue: 'Growth' })}</div>
        <SidebarItem icon={Trophy} label={t('rewards')} to="/gamification" active={currentPath === '/gamification'} onClick={onClose} />
        <SidebarItem icon={Users2} label={t('referrals')} to="/referrals" active={currentPath === '/referrals'} onClick={onClose} />
        <SidebarItem icon={Bell} label={t('notifications')} to="/notifications" active={currentPath === '/notifications'} onClick={onClose} />

        <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('account', { defaultValue: 'Account' })}</div>
        <SidebarItem icon={ShieldCheck} label={t('kyc')} to="/kyc" active={currentPath === '/kyc'} onClick={onClose} />
        <SidebarItem icon={UserCircle} label={t('profile')} to="/settings" active={currentPath === '/settings'} onClick={onClose} />
        <SidebarItem icon={Settings} label={t('settings')} to="/settings" active={currentPath === '/settings'} onClick={onClose} />
        <SidebarItem icon={LifeBuoy} label={t('help')} to="/support" active={currentPath === '/support'} onClick={onClose} />

        {role === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2 px-4 text-[10px] font-bold text-rose-500 uppercase tracking-widest">System</div>
            <SidebarItem icon={Terminal} label={t('admin')} to="/admin" active={currentPath.startsWith('/admin')} onClick={onClose} />
          </>
        )}
        
        <div className="pt-6">
          <ProTraderCard />
          <SentimentGauge />
        </div>
      </nav>

      <div className="mt-auto pt-4 border-t border-border-glass">
        <div className="flex items-center justify-between px-2 mb-6">
          <div 
            onClick={() => {
              const nextLang = i18n.language === 'en' ? 'de' : 'en';
              i18n.changeLanguage(nextLang);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all"
          >
             <Globe size={14} className="text-slate-400" />
             <span className="text-[10px] font-bold text-slate-300 uppercase">{i18n.language}</span>
             <ChevronRight size={10} className="rotate-90 text-slate-500" />
          </div>
        </div>

        <div onClick={handleLogout} className="flex items-center justify-between px-2 text-slate-500 hover:text-white cursor-pointer transition-colors group">
          <div className="flex items-center gap-2">
            <LogOut size={16} className="group-hover:text-accent-quaternary transition-colors" />
            <span className="text-xs font-medium">{t('logout')}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
