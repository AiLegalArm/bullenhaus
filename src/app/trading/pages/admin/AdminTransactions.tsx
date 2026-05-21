import React, { useEffect, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export const AdminTransactions = () => {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session?.access_token) throw new Error('Admin session expired');
        const response = await fetch('/api/transactions', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to load transactions');
        setRequests(result.transactions || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load transactions');
      }
    };
    fetchTransactions();
  }, []);

  const allTxs = requests.map(req => ({
      id: req.id.slice(0, 8),
      user: req.userName,
      type: req.type,
      amount: `$${req.amount.toLocaleString()}`,
      status: req.status,
      date: new Date(req.date).toLocaleString()
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return 'text-emerald-500';
      case 'Pending':
        return 'text-amber-500';
      case 'Processing':
        return 'text-blue-500';
      case 'Rejected':
        return 'text-rose-500';
      default:
        return 'text-slate-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Approved':
        return <CheckCircle2 size={14} className="text-emerald-500"/>;
      case 'Processing':
         return <Clock size={14} className="text-blue-500"/>;
      case 'Rejected':
         return <AlertCircle size={14} className="text-rose-500"/>;
      default:
        return <Clock size={14} className="text-amber-500"/>;
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Global Transactions</h2>
          <p className="text-sm text-slate-500">Monitor all deposits, withdrawals, and fee collections.</p>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search TXID or user..." 
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50 w-64 transition-all"
          />
        </div>
      </div>
      
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5">
              <th className="px-6 py-4">TXID</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs text-slate-300">
            {allTxs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                  No real transactions found.
                </td>
              </tr>
            ) : allTxs.map((tx, idx) => (
              <tr key={tx.id + idx} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 text-slate-500">{tx.id}</td>
                <td className="px-6 py-4 font-sans font-bold text-white">{tx.user}</td>
                <td className="px-6 py-4">
                  <div className={`flex items-center gap-2 ${tx.type === 'Deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.type === 'Deposit' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    <span className="font-sans font-bold text-xs uppercase">{tx.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-white font-bold">{tx.amount}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {getStatusIcon(tx.status)}
                    <span className={getStatusColor(tx.status)}>{tx.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-500">{tx.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
