import React, { useState } from 'react';
import { Save, Server, Shield, Globe } from 'lucide-react';
import { toast } from 'sonner';

export const AdminSettings = () => {
  const [mfa, setMfa] = useState(true);
  const [autoBan, setAutoBan] = useState(true);

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">System Configuration</h2>
        <p className="text-sm text-slate-500">Manage platform-wide settings, security policies, and environment overrides.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
               <Server size={18} className="text-rose-500" /> Platform Defaults
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Default Starting Balance</label>
                <div className="flex gap-2">
                   <input type="text" defaultValue="100000" className="flex-1 bg-[#111] border border-white/5 rounded-xl px-4 py-3 text-white font-mono" />
                   <button onClick={() => toast.success('Starting balance updated successfully')} className="px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black font-bold uppercase transition-all rounded-xl border border-emerald-500/20 text-xs">Save</button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                 <span className="text-sm text-white font-bold">Maintenance Mode</span>
                 <button onClick={() => toast.success('Maintenance Mode status flipped')} className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold text-xs uppercase tracking-wider rounded-lg border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all">Enable</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="glass-card p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2 mb-6">
                 <Shield size={18} className="text-emerald-500" /> Security Policies
              </h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-xl">
                    <div>
                       <p className="text-sm text-white font-bold">Require MFA for Admins</p>
                       <p className="text-[10px] text-slate-500 uppercase mt-1">Enforce hardware keys or TOTP</p>
                    </div>
                    <button onClick={() => { setMfa(!mfa); toast.success(`Require MFA ${!mfa ? 'Enabled' : 'Disabled'}`)}} className={`w-12 h-6 rounded-full relative transition-colors ${mfa ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                       <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${mfa ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-[#111] border border-white/5 rounded-xl">
                    <div>
                       <p className="text-sm text-white font-bold">Auto-Ban Flagged IPs</p>
                       <p className="text-[10px] text-slate-500 uppercase mt-1">Block VPNs and bad actors</p>
                    </div>
                    <button onClick={() => { setAutoBan(!autoBan); toast.success(`Auto-Ban ${!autoBan ? 'Enabled' : 'Disabled'}`)}} className={`w-12 h-6 rounded-full relative transition-colors ${autoBan ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                       <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${autoBan ? 'right-0.5' : 'left-0.5'}`} />
                    </button>                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
