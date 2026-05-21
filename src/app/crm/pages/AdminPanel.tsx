import React, { useState } from "react";
import { Users, Shield, Database, Settings, Search, Edit2, Lock } from "lucide-react";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { useI18n } from "../lib/i18n";

const mockUsers = [
  { id: 1, name: "Julian Devereaux", role: "director", status: "Active", lastLogin: "Just now" },
  { id: 2, name: "Alexander K.", role: "admin", status: "Active", lastLogin: "10 mins ago" },
  { id: 3, name: "Sarah Jenkins", role: "manager", status: "Active", lastLogin: "1 hour ago" },
  { id: 4, name: "Victor L.", role: "agent", status: "Suspended", lastLogin: "2 days ago" },
];

export function AdminPanel() {
  const { t } = useI18n();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [auditLogDetail, setAuditLogDetail] = useState<any>(null);

  const mockAuditLogs = [
    { id: 1, time: "10:42 AM", msg: "Multiple failed logins - IP 192.168.1.5", type: "warn", details: "Detected 5 failed login attempts within 2 minutes for user V.L. Account automatically locked for 15 minutes." },
    { id: 2, time: "09:15 AM", msg: "API Key Rotated", type: "info", details: "Stripe production API key was rotated successfully by Alexander K." },
    { id: 3, time: "Yesterday", msg: "Role changed for User #42", type: "info", details: "User #42 (Sarah J.) promoted from Agent to Manager by Julian D." },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('adminTitle')}</h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('adminSubtitle')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="rounded-xl border border-glass-border bg-[#121214] p-6 text-center">
            <Users className="w-6 h-6 text-aura-gold mx-auto mb-3" />
            <div className="text-xl font-light text-aura-platinum tracking-tight">142</div>
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mt-1">{t('activeUsers')}</div>
         </div>
         <div className="rounded-xl border border-glass-border bg-[#121214] p-6 text-center">
            <Shield className="w-6 h-6 text-aura-emerald mx-auto mb-3" />
            <div className="text-xl font-light text-aura-platinum tracking-tight">0</div>
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mt-1">{t('securityBreaches')}</div>
         </div>
         <div className="rounded-xl border border-glass-border bg-[#121214] p-6 text-center">
            <Database className="w-6 h-6 text-aura-gold mx-auto mb-3" />
            <div className="text-xl font-light text-aura-platinum tracking-tight">99.9%</div>
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mt-1">{t('systemUptime')}</div>
         </div>
         <div className="rounded-xl border border-glass-border bg-[#121214] p-6 text-center">
            <Settings className="w-6 h-6 text-aura-gold mx-auto mb-3" />
            <div className="text-xl font-light text-aura-platinum tracking-tight">v4.2.1</div>
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mt-1">Aura Platform</div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-glass-border bg-[#121214] p-8 overflow-x-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">{t('userAccounts')}</h3>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
              <input 
                type="text" 
                placeholder={t('searchUsers')}
                className="w-full sm:w-auto bg-black/40 border border-glass-border rounded pl-9 pr-4 py-1.5 flex items-center gap-2 text-xs text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors"
              />
            </div>
          </div>

          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b border-glass-border text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 uppercase">
                <th className="pb-4 border-b border-glass-border">{t('name')}</th>
                <th className="pb-4 border-b border-glass-border">{t('role')}</th>
                <th className="pb-4 border-b border-glass-border">{t('status')}</th>
                <th className="pb-4 border-b border-glass-border">{t('lastLogin')}</th>
                <th className="pb-4 border-b border-glass-border text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {mockUsers.map(user => (
                <tr key={user.id} className="border-b border-glass-border border-opacity-50 hover:bg-white/5 transition-colors group">
                  <td className="py-4 font-medium text-aura-platinum">{user.name}</td>
                  <td className="py-4 text-aura-platinum/70 uppercase text-[10px] tracking-widest">{user.role}</td>
                  <td className="py-4">
                    <Badge variant={user.status === 'Active' ? 'success' : 'danger'}>
                      {user.status}
                    </Badge>
                  </td>
                  <td className="py-4 text-aura-platinum/40 text-xs font-mono">{user.lastLogin}</td>
                  <td className="py-4 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="p-1.5 hover:bg-white/10 rounded text-aura-platinum/50 hover:text-aura-gold transition-colors" onClick={() => setEditingUser(user)}><Edit2 className="w-3.5 h-3.5"/></button>
                     <button className="p-1.5 hover:bg-white/10 rounded text-aura-platinum/50 hover:text-aura-ruby transition-colors"><Lock className="w-3.5 h-3.5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-6">
           <div className="rounded-xl border border-glass-border bg-[#121214] p-6">
             <div className="mb-4">
               <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">{t('securityAuditLog')}</h3>
             </div>
             <div className="space-y-3">
               {mockAuditLogs.map((log) => (
                 <div 
                   key={log.id} 
                   onClick={() => setAuditLogDetail(log)}
                   className={`p-4 rounded bg-black/40 border-l-2 cursor-pointer transition-colors hover:bg-white/5 ${log.type === 'warn' ? 'border-aura-ruby' : 'border-aura-gold/50'}`}
                 >
                   <div className="text-[10px] font-mono text-aura-platinum/40 mb-1">{log.time}</div>
                   <div className="text-xs text-aura-platinum/80">{log.msg}</div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User Profile"
        subtitle={editingUser?.name}
      >
         <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setEditingUser(null); }}>
             <div className="space-y-4">
                <div>
                   <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Full Name</label>
                   <input type="text" defaultValue={editingUser?.name} className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors" />
                </div>
                <div>
                   <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Role</label>
                   <select defaultValue={editingUser?.role} className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors appearance-none">
                      <option value="admin">Admin</option>
                      <option value="director">Director</option>
                      <option value="manager">Manager</option>
                      <option value="agent">Agent</option>
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Account Status</label>
                   <select defaultValue={editingUser?.status} className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors appearance-none">
                      <option value="Active">Active</option>
                      <option value="Suspended">Suspended</option>
                   </select>
                </div>
             </div>
             <div className="pt-4 border-t border-glass-border flex justify-between items-center sm:flex-row flex-col gap-4">
                <Button variant="danger" type="button" size="sm" onClick={() => setEditingUser(null)}>Revoke Access</Button>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="ghost" type="button" className="flex-1 sm:flex-auto" onClick={() => setEditingUser(null)}>Cancel</Button>
                    <Button variant="primary" type="submit" className="flex-1 sm:flex-auto">Save Changes</Button>
                </div>
             </div>
         </form>
      </Modal>

      <Modal
        isOpen={!!auditLogDetail}
        onClose={() => setAuditLogDetail(null)}
        title="Audit Log Entry"
        subtitle={auditLogDetail?.time}
      >
        <div className="space-y-6">
          <div className={`p-4 rounded border ${auditLogDetail?.type === 'warn' ? 'bg-aura-ruby/5 border-aura-ruby/30 text-aura-ruby' : 'bg-aura-gold/5 border-aura-gold/30 text-aura-gold'}`}>
             <h4 className="font-bold mb-2 flex items-center justify-between">
                {auditLogDetail?.msg}
                <Badge variant={auditLogDetail?.type === 'warn' ? 'danger' : 'warning'}>{auditLogDetail?.type}</Badge>
             </h4>
             <p className="text-sm opacity-90 leading-relaxed font-mono">{auditLogDetail?.details}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-black/40 p-3 rounded border border-glass-border">
                <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">IP Address</div>
                <div className="font-mono text-[10px]">192.168.1.xxx</div>
             </div>
             <div className="bg-black/40 p-3 rounded border border-glass-border">
                <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">User Agent</div>
                <div className="font-mono text-[10px] truncate" title="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...">Mozilla/5.0...</div>
             </div>
          </div>
          <div className="pt-4 border-t border-glass-border flex justify-end">
            <Button variant="secondary" onClick={() => setAuditLogDetail(null)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
