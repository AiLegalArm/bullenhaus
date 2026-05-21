import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, TrendingUp, History, PieChart, Download, Upload, ShieldCheck, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTradingStore } from '../../stores/tradingStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { supabase } from '../../lib/supabase';
import { useWalletSync } from '../../hooks/useWalletSync';

import { TransferModal } from './TransferModal';

export const Portfolio: React.FC = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState<'deposit' | 'withdraw'>('deposit');
  const [serverRequests, setServerRequests] = useState<any[]>([]);
  useWalletSync();
  const wallet = useTradingStore(s => s.wallet);
  const requests = useTransactionStore(s => s.requests);
  const holdings = useMemo(() => wallet.balance > 0 ? [{
    name: 'USD',
    description: 'Account Wallet',
    balance: wallet.balance,
    value: wallet.balance,
    allocation: 100,
  }] : [], [wallet.balance]);

  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session?.access_token) return;
        const response = await fetch('/api/transactions?scope=mine', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!response.ok) return;
        const result = await response.json();
        setServerRequests(result.transactions || []);
      } catch {
        setServerRequests([]);
      }
    };
    loadTransactions();
    const interval = window.setInterval(loadTransactions, 30000);
    return () => window.clearInterval(interval);
  }, []);

  const requestSource = serverRequests.length > 0 ? serverRequests : requests;
  const transactions = [...requestSource]
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      type: r.type,
      method: r.method,
      instructions: r.instructions,
      asset: r.currency,
      amount: r.type === 'Deposit' ? `+${r.amount.toLocaleString()}` : `-${r.amount.toLocaleString()}`,
      status: r.status,
      time: new Date(r.date).toLocaleDateString()
    }));

  const openTransferModal = (type: 'deposit' | 'withdraw') => {
    setTransferType(type);
    setTransferModalOpen(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500 relative">
      <TransferModal 
        isOpen={transferModalOpen} 
        onClose={() => setTransferModalOpen(false)} 
        type={transferType} 
      />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
            <Wallet className="text-accent-primary" size={28} />
            Wallet & Portfolio
          </h2>
          <p className="text-sm text-slate-400 mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-accent-secondary" />
            Portfolio data from your account wallet
          </p>
        </div>
        <div className="flex gap-3 relative z-10">
          <button 
            onClick={() => openTransferModal('deposit')}
            className="px-6 py-2.5 bg-accent-secondary/10 border border-accent-secondary/30 rounded-xl text-xs font-bold text-accent-secondary flex items-center gap-2 hover:bg-accent-secondary hover:text-black transition-all shadow-neon-emerald"
          >
            <Download size={14} /> Deposit
          </button>
          <button 
            onClick={() => openTransferModal('withdraw')}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <Upload size={14} /> Withdraw
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Balances & Chart */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Balance */}
            <div className="glass-card p-6 border-accent-primary/20 md:col-span-2 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-3xl pointer-events-none" />
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Estimated Balance</p>
               <div className="flex items-baseline gap-4 mb-4">
                  <h3 className="text-4xl font-bold text-white tracking-tight">${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
               </div>
               <div className="flex items-center gap-6 mt-6">
                  <div>
                     <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">Available Margin</p>
                     <p className="text-white font-mono font-bold">${Math.max(0, wallet.balance - wallet.marginUsed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div>
                     <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider mb-1">In Positions</p>
                     <p className="text-white font-mono font-bold">${wallet.marginUsed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
               </div>
            </div>

            {/* PNL Today */}
            <div className="glass-card p-6 border-accent-secondary/20 flex flex-col justify-center">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Realized P&L</p>
               <h3 className="text-2xl font-bold text-accent-secondary drop-shadow-[0_0_8px_rgba(0,230,118,0.3)]">${wallet.realizedPnL.toLocaleString()}</h3>
               <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-slate-400">
                  <Activity size={12} className="text-accent-secondary" />
                  Live wallet data
               </div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="glass-card p-6 holo-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Portfolio Performance</h3>
            </div>
            <div className="h-[300px] w-full rounded-xl border border-white/5 bg-black/20 flex flex-col items-center justify-center text-center px-6">
              <Activity size={26} className="text-slate-600 mb-4" />
              <p className="text-sm font-bold text-slate-300">Portfolio history is not available yet.</p>
              <p className="text-xs text-slate-500 mt-2 max-w-md">
                This section will show performance after real historical portfolio records are available from the backend.
              </p>
            </div>
          </div>

          {/* Holdings List */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Asset Holdings</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
                  <tr>
                    <th className="text-left pb-4 font-bold">Asset</th>
                    <th className="text-right pb-4 font-bold">Balance</th>
                    <th className="text-right pb-4 font-bold">Value (USD)</th>
                    <th className="text-right pb-4 font-bold">Allocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {holdings.length > 0 ? holdings.map((asset) => (
                    <tr key={asset.name} className="group hover:bg-white/5 transition-all">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-bg border border-white/10 flex items-center justify-center font-bold text-white text-xs">$</div>
                          <div>
                            <p className="font-bold text-white text-sm group-hover:text-accent-primary transition-colors">{asset.name}</p>
                            <p className="text-[10px] text-slate-500">{asset.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right font-mono text-sm text-slate-300">{asset.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-4 text-right font-mono text-sm text-white font-bold">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="py-4 text-right text-xs text-accent-primary">{asset.allocation}%</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-sm text-slate-500">
                        No balances found. Deposit funds to start trading.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Allocation Pie Chart */}
          <div className="glass-card p-6 text-center">
             <div className="flex items-center gap-3 mb-6">
               <PieChart className="text-accent-primary" size={20} />
               <h3 className="text-sm font-bold text-white uppercase tracking-widest">Allocation Matrix</h3>
             </div>
             
             <div className="h-[220px] w-full rounded-xl border border-white/5 bg-black/20 flex flex-col items-center justify-center px-4">
               {holdings.length > 0 ? (
                 <>
                   <span className="text-[10px] text-slate-500 uppercase tracking-widest">Total Value</span>
                   <span className="text-2xl font-bold text-white mt-2">${wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                   <span className="text-xs text-slate-500 mt-2">100% USD wallet balance</span>
                 </>
               ) : (
                 <>
                   <span className="text-sm font-bold text-slate-300">No allocation data</span>
                   <span className="text-xs text-slate-500 mt-2">Add real funds to see account allocation.</span>
                 </>
               )}
             </div>

             <div className="grid grid-cols-2 gap-4 mt-4">
               {holdings.map(asset => (
                 <div key={asset.name} className="flex justify-between items-center bg-[#111] p-2 rounded-lg border border-white/5">
                   <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full shadow-neon-blue bg-accent-primary" />
                     <span className="text-xs font-bold text-slate-300">{asset.name}</span>
                   </div>
                   <span className="text-xs font-mono">{asset.allocation}%</span>
                 </div>
               ))}
             </div>
          </div>

          {/* Transaction History */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                 <History className="text-accent-secondary" size={20} />
                 <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t('transactions')}</h3>
              </div>
              <button onClick={() => navigate('/transactions')} className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors">View All</button>
            </div>

            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="text-center text-slate-500 text-xs py-4">No transactions</div>
              ) : transactions.map(tx => (
                <div key={tx.id} className="flex flex-col p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        tx.type === 'Deposit' ? 'bg-accent-secondary/10 text-accent-secondary' :
                        tx.type === 'Withdrawal' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-accent-primary/10 text-accent-primary'
                      }`}>
                        {tx.type === 'Deposit' ? <Upload size={14} /> : 
                         tx.type === 'Withdrawal' ? <Download size={14} /> : 
                         <TrendingUp size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">{tx.type} {tx.asset}</p>
                        <p className="text-[10px] text-slate-400">{tx.time} {tx.method ? ` - ${tx.method}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold font-mono ${
                        tx.amount.startsWith('+') ? 'text-accent-secondary' : 
                        tx.amount.startsWith('-') ? 'text-white' : 'text-accent-primary'
                      }`}>{tx.amount}</p>
                      <p className="text-[10px] text-slate-500">{tx.status}</p>
                    </div>
                  </div>
                  {tx.instructions && (
                    <div className="mt-3 pt-3 border-t border-white/5 text-xs text-slate-300 bg-black/20 p-2 rounded-lg border border-white/5">
                      <span className="text-[10px] font-bold text-accent-primary uppercase tracking-widest block mb-1">Instructions</span>
                      {tx.instructions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
