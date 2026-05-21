import React from 'react';
import { Users, Activity, ShieldAlert, Server, Globe2, AlertTriangle, Database, Zap, Bell, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTransactionStore } from '../../stores/transactionStore';

const crmLogs: any[] = [];

export const AdminOverview = () => {
  const { notifications, markNotificationRead, requests } = useTransactionStore();
  
  const pendingDeposits = requests.filter(r => r.type === 'Deposit' && r.status === 'Pending').length;
  const pendingWithdrawals = requests.filter(r => r.type === 'Withdrawal' && r.status === 'Pending').length;

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">System Overview</h2>
          <p className="text-sm text-slate-500 font-mono flex items-center gap-2 mt-1">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             NODE_STATUS: STABLE | 0 ERRORS DETECTED
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Active Sessions', value: '1', change: 'Current user', icon: Users, color: 'text-blue-400' },
          { label: 'Pending Deposits', value: pendingDeposits.toString(), change: 'Action Required', icon: Activity, color: 'text-accent-primary' },
          { label: 'Pending Withdrawals', value: pendingWithdrawals.toString(), change: 'Action Required', icon: ShieldAlert, color: 'text-orange-500' },
          { label: 'Server Load', value: 'Normal', change: 'Nominal', icon: Server, color: 'text-emerald-500' }
        ].map((metric, i) => (
          <div key={i} className="glass-card p-6 border-white/5 group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-xl bg-white/5 ${metric.color}`}>
                <metric.icon size={20} />
              </div>
            </div>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{metric.label}</h4>
            <p className="text-2xl font-bold font-mono text-white mb-2">{metric.value}</p>
            <p className="text-[10px] font-bold text-slate-400">{metric.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="glass-card p-6 min-h-[300px] flex flex-col justify-center items-center text-center">
             <CheckCircle2 size={48} className="text-emerald-500/20 mb-4" />
             <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2">Systems Nominal</h3>
             <p className="text-[10px] text-slate-400">All infrastructure systems operating within normal parameters.</p>
          </div>

          <div className="glass-card p-6 min-h-[300px] relative overflow-hidden flex flex-col justify-center items-center">
             <Globe2 size={120} className="text-white/5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
             <div className="relative z-10 w-full">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest text-left mb-6">Global Node Activity</h3>
                <div className="grid grid-cols-3 gap-4">
                   {['EU_WEST_1', 'US_EAST_2', 'AP_SOUTHEAST_1'].map((node, i) => (
                      <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{node}</p>
                         <p className="text-emerald-500 text-sm font-mono font-bold">STABLE</p>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
           <div className="glass-card p-6 border-blue-500/20">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Bell size={18} className="text-blue-500" /> Admin Notifications ({notifications.filter(n => !n.read).length})
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                 {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500">No new notifications</p>
                 ) : notifications.map(notif => (
                    <div key={notif.id} className={`p-4 border rounded-xl cursor-pointer transition-colors ${notif.read ? 'bg-white/5 border-white/10' : 'bg-blue-500/10 border-blue-500/20'}`} onClick={() => markNotificationRead(notif.id)}>
                       <p className="text-xs font-bold text-white mb-1">{notif.message}</p>
                       <p className="text-[10px] text-slate-400 font-mono">{new Date(notif.date).toLocaleString()}</p>
                    </div>
                 ))}
              </div>
           </div>

           <div className="glass-card flex flex-col h-[400px]">
              <div className="p-6 border-b border-white/5">
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <Zap size={18} className="text-rose-500" /> Event Stream
                 </h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-2">
                 {crmLogs.map(log => (
                    <div key={log.id} className="p-2 hover:bg-white/5 transition-colors border-b border-white/5">
                       <span className="text-slate-600">{log.time}</span>
                       <p className={`font-bold ${log.status === 'OK' ? 'text-emerald-500' : 'text-rose-500'}`}>[{log.event}]</p>
                       <p className="text-slate-400 mt-1">{log.details}</p>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
