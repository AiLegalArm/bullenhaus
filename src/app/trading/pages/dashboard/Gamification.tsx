import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Shield, Zap, Medal, Star, ChevronRight, Activity, TrendingUp, Award, Crown, CheckCircle2, Lock } from 'lucide-react';
import { useUserStore } from '../../stores/userStore';
import { useAuth } from '../../contexts/AuthContext';
import { useTradingStore } from '../../stores/tradingStore';

const badges = [
  { id: 1, name: 'First Blood', description: 'Complete your first virtual trade', icon: Zap, unlocked: true, color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/30' },
  { id: 2, name: 'Bull Rider', description: 'Achieve 3 consecutive profitable long positions', icon: TrendingUp, unlocked: true, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10', border: 'border-accent-secondary/30' },
  { id: 3, name: 'Risk Manager', description: 'Use Stop Loss successfully in 10 trades', icon: Shield, unlocked: true, color: 'text-accent-quaternary', bg: 'bg-accent-quaternary/10', border: 'border-accent-quaternary/30' },
  { id: 4, name: 'Whale Apprentice', description: 'Manage a portfolio over $50k account value', icon: Crown, unlocked: false, color: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/10' },
  { id: 5, name: 'Sniper', description: 'Hit take-profit exact target 5 times', icon: Award, unlocked: false, color: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/10' },
  { id: 6, name: 'Diamond Hands', description: 'Hold a winning position for more than 72 hours', icon: Medal, unlocked: false, color: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/10' },
];

export const Gamification: React.FC = () => {
  const { profile } = useUserStore();
  const { user } = useAuth();
  const { wallet, positions } = useTradingStore();
  const displayName = profile?.display_name || profile?.full_name || profile?.username || user?.email || 'User';
  const roleName = profile?.role || 'LITE';

  // Calculate real stats
  const totalTrades = positions.length;
  const closedPositions = positions.filter(p => p.status === 'closed');
  const winningTrades = closedPositions.filter(p => p.unrealizedPnL > 0).length;
  const winRate = closedPositions.length > 0 ? (winningTrades / closedPositions.length) * 100 : 0;
  
  const totalPnL = wallet.realizedPnL;
  const isPnLPositive = totalPnL >= 0;
  
  const userXP = totalTrades * 100 + (totalPnL > 0 ? totalPnL / 10 : 0);

  const badges = [
    { id: 1, name: 'First Blood', description: 'Complete your first virtual trade', icon: Zap, unlocked: totalTrades >= 1, color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/30' },
    { id: 2, name: 'Profitable', description: 'Achieve a winning trade', icon: TrendingUp, unlocked: winningTrades >= 1, color: 'text-accent-secondary', bg: 'bg-accent-secondary/10', border: 'border-accent-secondary/30' },
    { id: 3, name: 'Risk Manager', description: 'Set a Stop Loss', icon: Shield, unlocked: positions.some(p => p.stopLoss !== null), color: 'text-accent-quaternary', bg: 'bg-accent-quaternary/10', border: 'border-accent-quaternary/30' },
    { id: 4, name: 'Whale Apprentice', description: 'Manage a portfolio over $50k value', icon: Crown, unlocked: wallet.balance >= 50000, color: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/10' },
    { id: 5, name: 'Active Trader', description: 'Execute 5 trades', icon: Award, unlocked: totalTrades >= 5, color: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/10' },
    { id: 6, name: 'Target Reached', description: 'Set a limit order', icon: Medal, unlocked: false, color: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/10' },
  ];

  const unlockedCount = badges.filter(b => b.unlocked).length;

  const leaderboard = [
    { rank: 1, name: displayName, level: roleName, score: Math.round(userXP), pnl: `${isPnLPositive ? '+' : ''}$${totalPnL.toFixed(2)}`, isCurrentUser: true }
  ];

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <Trophy className="text-accent-primary" size={28} />
            Trader Progression
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
            Elite Status & Achievements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Status & Progress */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="glass-card p-8 border-accent-primary/20 relative overflow-hidden holo-border">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-secondary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
              {/* Rank Insignia */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] flex flex-col items-center justify-center border-2 border-accent-primary/50 shadow-[0_0_30px_rgba(212,175,55,0.2)] group-hover:scale-105 transition-transform duration-500">
                  <Crown size={48} className="text-accent-primary drop-shadow-[0_0_15px_rgba(212,175,55,0.8)] mb-2" />
                  <span className="text-[10px] font-bold text-accent-primary/70 uppercase tracking-widest">Elite Tier</span>
                </div>
                <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-surface-bg border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
                  <Star size={16} className="text-white drop-shadow-md" />
                </div>
              </div>

              {/* Stats & Progress */}
              <div className="flex-1 w-full text-center md:text-left">
                <p className="text-[10px] font-bold text-accent-primary/70 uppercase tracking-[0.2em] mb-1">Current Status</p>
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-6">
                  <h3 className="text-4xl font-bold text-white tracking-tight uppercase">{roleName}</h3>
                  <span className="text-sm font-bold text-slate-400">Total XP: {Math.round(userXP).toLocaleString()}</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Level Progress</span>
                    <span className="text-xs font-bold text-accent-primary glows-text">{Math.round(userXP).toLocaleString()} / 100,000 XP</span>
                  </div>
                  
                  <div className="h-3 w-full bg-[#111] rounded-full overflow-hidden border border-white/5 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (userXP / 100000) * 100)}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full relative shadow-[0_0_15px_rgba(212,175,55,0.8)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/50 via-accent-primary to-yellow-300" />
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
                    </motion.div>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">KYC Status: {profile?.kyc_status || 'UNVERIFIED'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
               <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Trades</p>
                 <p className="text-xl font-bold text-white font-mono">{totalTrades}</p>
               </div>
               <div className="bg-[#111] border border-accent-secondary/20 rounded-xl p-4 text-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-accent-secondary/5" />
                 <p className="text-[10px] font-bold text-accent-secondary uppercase tracking-widest mb-1 relative z-10">Win Rate</p>
                 <p className="text-xl font-bold text-accent-secondary font-mono relative z-10 shadow-neon-emerald drop-shadow-md">{winRate.toFixed(1)}%</p>
               </div>
               <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Realized PNL</p>
                 <p className={`text-xl font-bold font-mono ${isPnLPositive ? 'text-accent-secondary' : 'text-orange-500'}`}>
                   {isPnLPositive ? '+' : ''}${totalPnL.toFixed(2)}
                 </p>
               </div>
               <div className="bg-[#111] border border-white/10 rounded-xl p-4 text-center">
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Badges</p>
                 <p className="text-xl font-bold text-white font-mono">{unlockedCount} / {badges.length}</p>
               </div>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Achievements & Badges</h3>
              <button className="text-[10px] font-bold text-accent-primary hover:text-white transition-colors uppercase tracking-widest">View All</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge, i) => {
                const Icon = badge.icon;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={badge.id} 
                    className={`p-4 rounded-xl border relative overflow-hidden group ${badge.border} ${badge.unlocked ? 'bg-surface-bg' : 'bg-[#0a0a0a]'}`}
                  >
                    {!badge.unlocked && (
                      <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                        <Lock className="text-slate-400" size={24} />
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-lg ${badge.bg} flex items-center justify-center mb-4 ${!badge.unlocked && 'opacity-50'}`}>
                      <Icon size={24} className={badge.color} />
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`text-sm font-bold ${badge.unlocked ? 'text-white' : 'text-slate-400'}`}>{badge.name}</h4>
                      {badge.unlocked && <CheckCircle2 size={12} className={badge.color} />}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{badge.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Global Leaderboard */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="glass-card p-6 flex flex-col h-full min-h-[500px]">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <Activity className="text-accent-primary" size={20} />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">Global Ranking</h3>
               </div>
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">Pre-Season 1</span>
             </div>

             <div className="space-y-4 flex-1">
               {leaderboard.map((user, i) => (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1 }}
                   key={user.rank}
                   className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                     user.isCurrentUser 
                     ? 'bg-accent-primary/10 border-accent-primary/30 shadow-neon-gold' 
                     : 'bg-[#111] border-white/5 hover:border-white/20'
                   }`}
                 >
                   <div className="flex items-center gap-4">
                     <span className={`text-sm font-bold font-mono w-4 text-center ${
                       i === 0 ? 'text-accent-primary' :
                       i === 1 ? 'text-slate-300' :
                       i === 2 ? 'text-orange-400' : 'text-slate-600'
                     }`}>
                       #{user.rank}
                     </span>
                     <div>
                       <p className={`text-sm font-bold ${user.isCurrentUser ? 'text-accent-primary' : 'text-white'}`}>
                         {user.name} {user.isCurrentUser && '(You)'}
                       </p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.level}</p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-xs font-bold font-mono text-white mb-0.5">{user.score.toLocaleString()} XP</p>
                     <p className="text-[10px] font-bold text-accent-secondary">{user.pnl}</p>
                   </div>
                 </motion.div>
               ))}
             </div>

             <button className="w-full mt-6 py-3 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all text-center uppercase tracking-widest">
               Load More
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
