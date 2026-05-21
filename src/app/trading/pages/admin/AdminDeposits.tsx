import React, { useEffect, useState } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';
import { TxStatus } from '../../stores/transactionStore';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export const AdminDeposits = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const deposits = requests.filter(r => r.type === 'Deposit');
  const [instructionTexts, setInstructionTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error('Admin session expired');
      const response = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to load deposits');
      setRequests(result.transactions || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, status: TxStatus) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error('Admin session expired');
      const action = status === 'Rejected' ? 'reject' : 'approve';
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action, transactionId: id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update request');
      toast.success(`Request marked as ${status}`);
      fetchRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update request');
    }
  };

  const handleSendInstructions = async (id: string) => {
    const text = instructionTexts[id];
    if (!text || !text.trim()) {
      toast.error('Instructions cannot be empty');
      return;
    }
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error('Admin session expired');
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'instructions', transactionId: id, instructions: text }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to send instructions');
      setRequests(prev => prev.map(req => req.id === id ? { ...req, instructions: text } : req));
      toast.success('Instructions sent to client');
      setInstructionTexts(prev => ({ ...prev, [id]: '' }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send instructions');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Deposits</h2>
          <p className="text-sm text-slate-500">Manage user deposit requests.</p>
        </div>
        <button onClick={fetchRequests} className="p-2 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Amount / Currency</th>
              <th className="px-6 py-4">Method</th>
              <th className="px-6 py-4">Status & Instructions</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4">Updated</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs text-slate-300">
            {deposits.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No deposit requests found</td>
              </tr>
            ) : deposits.map(req => (
              <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <div className="font-sans font-bold text-white">{req.userName}</div>
                  <div className="text-[10px] text-slate-500">{req.userEmail}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-white font-bold">{req.amount.toLocaleString()} {req.currency}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-white/5 text-slate-200 border border-white/10">{req.method || 'Unknown'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    req.status === 'Completed' || req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' : 
                    req.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' :
                    req.status === 'Rejected' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-blue-500/10 text-blue-500' // Processing
                  } mb-2 inline-block`}>
                    {req.status}
                  </span>
                  {req.instructions ? (
                    <div className="text-[10px] text-slate-400 max-w-[200px] truncate"><span className="text-accent-primary">Instr:</span> {req.instructions}</div>
                  ) : (
                    <div className="flex flex-col gap-1 w-[200px]">
                      <input 
                        type="text" 
                        placeholder="Card, IBAN, wallet, or instructions..."
                        value={instructionTexts[req.id] || ''}
                        onChange={e => setInstructionTexts(p => ({ ...p, [req.id]: e.target.value }))}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:border-accent-primary/50"
                      />
                      {instructionTexts[req.id] && (
                        <button onClick={() => handleSendInstructions(req.id)} className="bg-accent-primary/20 text-accent-primary px-2 py-1 flex items-center justify-center gap-1 rounded text-[10px] uppercase font-bold hover:bg-accent-primary hover:text-black">
                          <MessageSquare size={10} /> Send
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-500">{new Date(req.date).toLocaleString()}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(req.updatedAt || req.date).toLocaleString()}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleAction(req.id, 'Completed')} className="px-2 py-1 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded font-sans font-bold text-[10px] uppercase">Approve</button>
                  <button onClick={() => handleAction(req.id, 'Rejected')} className="px-2 py-1 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 rounded font-sans font-bold text-[10px] uppercase">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
