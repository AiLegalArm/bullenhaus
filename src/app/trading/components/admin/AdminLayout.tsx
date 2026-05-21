import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  History, 
  Settings, 
  Globe, 
  LogOut, 
  Menu, 
  X,
  LayoutDashboard,
  BarChart2
} from 'lucide-react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const AdminSidebarItem = ({ icon: Icon, label, to, active }: any) => (
  <Link to={to}>
    <motion.div
      whileHover={{ x: 4 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200",
        active ? "bg-rose-500/10 text-rose-500" : "text-slate-400 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon size={20} />
      <span className="font-bold text-xs tracking-wider uppercase">{label}</span>
    </motion.div>
  </Link>
);

const AdminSidebar = ({ onClose }: any) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="w-64 h-full bg-[#050505] border-r border-rose-500/10 flex flex-col p-4 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-800 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.4)]">
           <ShieldCheck size={20} className="text-white" />
        </div>
        <div>
           <p className="text-xs font-black tracking-[0.2em] text-white">ADMIN</p>
           <p className="text-[8px] font-bold text-rose-500/50 tracking-[0.1em] uppercase">Control System</p>
        </div>
      </div>

      <nav className="flex-1 min-h-0 space-y-2 overflow-y-auto">
        <AdminSidebarItem icon={LayoutDashboard} label="Overview" to="/admin" active={currentPath === '/admin'} />
        <AdminSidebarItem icon={Users} label="User Manager" to="/admin/users" active={currentPath === '/admin/users'} />
        <AdminSidebarItem icon={ShieldCheck} label="KYC Queue" to="/admin/kyc" active={currentPath === '/admin/kyc'} />
        <AdminSidebarItem icon={History} label="Deposits" to="/admin/deposits" active={currentPath === '/admin/deposits'} />
        <AdminSidebarItem icon={History} label="Withdrawals" to="/admin/withdrawals" active={currentPath === '/admin/withdrawals'} />
        <AdminSidebarItem icon={BarChart2} label="Market Control" to="/admin/market-control" active={currentPath === '/admin/market-control'} />
        <AdminSidebarItem icon={History} label="Transactions" to="/admin/transactions" active={currentPath === '/admin/transactions'} />
        <AdminSidebarItem icon={Globe} label="CRM Sync" to="/admin/crm-sync" active={currentPath === '/admin/crm-sync'} />
        <AdminSidebarItem icon={Settings} label="System Config" to="/admin/settings" active={currentPath === '/admin/settings'} />
      </nav>

      <div className="mt-auto border-t border-rose-500/10 pt-4">
         <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-white transition-all">
            <LogOut size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Back to App</span>
         </Link>
      </div>
    </div>
  );
};

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role } = useAuth();

  // Redundant check for safety, but App.tsx / ProtectedRoute should handle this
  if (role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-[#020202] text-slate-300 font-sans selection:bg-rose-500/30">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        {/* Mobile Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
              />
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-64 z-50 md:hidden"
              >
                <AdminSidebar onClose={() => setSidebarOpen(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <header className="h-16 border-b border-rose-500/10 bg-[#050505]/50 backdrop-blur-md flex items-center justify-between px-6 z-30">
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-slate-400 hover:text-white md:hidden"
                >
                  <Menu size={20} />
                </button>
                <h2 className="text-sm font-black tracking-widest text-white uppercase flex items-center gap-2">
                   <Activity size={16} className="text-rose-500" />
                   System Status: <span className="text-emerald-500">Operational</span>
                </h2>
             </div>
             
             <div className="flex items-center gap-4 text-[10px] font-bold">
                <div className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded border border-rose-500/20 uppercase tracking-tighter">
                   Version 2.4.0-BETA
                </div>
             </div>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.03),transparent)]">
            <React.Suspense fallback={<div className="flex h-full w-full items-center justify-center min-h-[400px]"><div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" /></div>}>
              <Outlet />
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
