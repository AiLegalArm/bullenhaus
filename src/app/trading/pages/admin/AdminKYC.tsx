import React, { useEffect, useState } from 'react';
import { UserX, Check, Search, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

export const AdminKYC = () => {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error('Admin session expired');
      const response = await fetch('/api/kyc', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to load KYC queue');
      setQueue(result.queue || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load KYC queue');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, email: string) => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error('Admin session expired');
      const response = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'approve', userId: id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'KYC approval failed');
      toast.success(`KYC Approved for ${email}`);
      fetchQueue();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'KYC approval failed');
    }
  };

  const handleReject = async (id: string, email: string) => {
    if(!confirm('Reject KYC?')) return;
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session?.access_token) throw new Error('Admin session expired');
      const response = await fetch('/api/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'reject', userId: id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'KYC rejection failed');
      toast.success(`KYC Rejected for ${email}`);
      fetchQueue();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'KYC rejection failed');
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider">KYC Review Queue</h2>
          <p className="text-sm text-slate-500">Approve or reject pending identity verifications.</p>
        </div>
        <div className="flex items-center gap-3">
        <button onClick={fetchQueue} className="p-2 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search request ID..." 
            className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-rose-500/50 w-64 transition-all"
          />
        </div>
        </div>
      </div>
      
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5">
              <th className="px-6 py-4">Request ID</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Submission Date</th>
              <th className="px-6 py-4">Documents</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {queue.map(item => (
              <tr key={item.id} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-mono text-slate-400 text-xs">{item.id.substring(0,8)}...</td>
                <td className="px-6 py-4 font-bold text-white">{item.email}</td>
                <td className="px-6 py-4 text-slate-400">{new Date(item.updated_at || item.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {(item.documents || []).length === 0 ? (
                      <span className="text-xs text-rose-400">No files</span>
                    ) : item.documents.map((doc: any) => (
                      <a key={doc.path} href={doc.url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:text-white hover:border-rose-500/40">
                        <FileText size={12} /> {doc.name}
                      </a>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-500">
                      Pending
                   </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleApprove(item.id, item.email)} className="p-2 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"><Check size={16} /></button>
                    <button onClick={() => handleReject(item.id, item.email)} className="p-2 border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><UserX size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500 text-sm">
                  No pending KYC requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
