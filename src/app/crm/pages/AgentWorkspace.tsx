import React, { useState } from "react";
import { Phone, Clock, FileText, FastForward, PlayCircle, Plus, ChevronRight, MoreHorizontal, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { useLeads } from "../hooks/useLeads";
import { useI18n } from "../lib/i18n";

function LeadPipeline() {
  const { leads, meta, loading, error } = useLeads();

  const handleDragStart = (e: React.DragEvent) => {
    // Implement drag later
  };

  const stages = meta?.grouped || {
    'New Inquiries': [],
    'In Discussion': [],
    'Pending KYC': [],
    'Funded (FTD)': []
  };

  if (loading) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center p-12 border border-glass-border rounded-xl">
        <Loader2 className="w-8 h-8 text-aura-gold animate-spin" />
        <p className="text-sm font-mono tracking-widest uppercase mt-4 text-aura-platinum/60">Loading Pipeline...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 flex flex-col items-center justify-center p-12 border border-aura-ruby/30 rounded-xl bg-aura-ruby/5">
        <AlertCircle className="w-8 h-8 text-aura-ruby" />
        <p className="text-sm font-mono tracking-widest uppercase mt-4 text-aura-ruby">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-12">
       <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-bold tracking-[0.2em] text-aura-platinum/80 uppercase">Lead Pipeline</h3>
         <Button variant="outline" size="sm" className="h-8 text-[10px]">View Analytics <ChevronRight className="w-3 h-3 ml-1" /></Button>
       </div>
       
       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 overflow-x-auto pb-4 custom-scrollbar">
          {Object.entries(stages).map(([stage, stageLeads]) => {
            const leadsList = stageLeads as any[];
            return (
              <div key={stage} className="min-w-[280px]">
                 <div className="flex items-center justify-between mb-4 px-1">
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${
                       stage === 'Funded (FTD)' ? 'bg-aura-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                       stage === 'Pending KYC' ? 'bg-aura-warning shadow-[0_0_8px_rgba(234,179,8,0.5)]' :
                       stage === 'New Inquiries' ? 'bg-aura-platinum shadow-[0_0_8px_rgba(255,255,255,0.4)]' :
                       'bg-aura-gold shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                     }`} />
                     <h4 className="text-[10px] font-bold uppercase tracking-widest text-aura-platinum/60">{stage}</h4>
                   </div>
                   <span className="text-[10px] font-mono text-aura-platinum/40 bg-white/5 px-2 py-0.5 rounded">{leadsList.length}</span>
                 </div>
                 
                 <div className="space-y-3">
                   {leadsList.map((lead: any) => (
                     <div 
                       key={lead.id} 
                       className={`p-4 rounded-xl border bg-[#121214] hover:-translate-y-1 transition-transform cursor-pointer group shadow-sm hover:shadow-md
                         ${lead.stage === 'FUNDED' ? 'border-aura-emerald/30 hover:border-aura-emerald/50' :
                         lead.stage === 'PENDING_KYC' ? 'border-aura-warning/30 hover:border-aura-warning/50' :
                         'border-glass-border hover:border-aura-platinum/30'}
                       `}
                     >
                       <div className="flex items-start justify-between mb-3">
                          <div className="font-medium text-sm text-aura-platinum">{lead.firstName} {lead.lastName}</div>
                          <button className="text-aura-platinum/30 hover:text-aura-platinum opacity-0 group-hover:opacity-100 transition-opacity"><MoreHorizontal className="w-4 h-4" /></button>
                       </div>
                       <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
                          <div>
                            <div className="text-[8px] uppercase tracking-widest text-aura-platinum/40 mb-0.5 font-sans">Capacity</div>
                            <div className={lead.stage === 'FUNDED' ? 'text-aura-emerald' : 'text-aura-platinum'}>{lead.capacity || 'TBD'}</div>
                          </div>
                          <div>
                            <div className="text-[8px] uppercase tracking-widest text-aura-platinum/40 mb-0.5 font-sans">Time</div>
                            <div className="text-aura-platinum/70 flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> 2h ago</div>
                          </div>
                       </div>
                       <div className="flex justify-between items-center border-t border-glass-border pt-3">
                          <span className="text-[9px] uppercase tracking-widest text-aura-platinum/40">{lead.acquisitionSource?.leadSource || 'Unknown'}</span>
                          <div className="flex gap-1">
                            <button className="w-6 h-6 rounded bg-black/40 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-colors tooltip-trigger relative">
                              <FileText className="w-3 h-3 text-aura-platinum/60" />
                            </button>
                            <button className="w-6 h-6 rounded bg-black/40 border border-white/5 flex items-center justify-center hover:bg-white/10 hover:border-white/10 transition-colors tooltip-trigger relative">
                              <Phone className="w-3 h-3 text-aura-platinum/60" />
                            </button>
                          </div>
                       </div>
                     </div>
                   ))}
                   {leadsList.length === 0 && (
                     <div className="p-4 rounded-xl border border-dashed border-glass-border bg-transparent flex items-center justify-center h-24">
                       <span className="text-[10px] uppercase tracking-widest text-aura-platinum/30">Empty</span>
                     </div>
                   )}
                 </div>
              </div>
            )
          })}
       </div>
    </div>
  )
}

export function AgentWorkspace() {
  const { t } = useI18n();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-glass-border pb-4 mb-6 flex flex-col sm:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('agentTitle')}</h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('agentSubtitle')}</p>
        </div>
        <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
           <div className="flex gap-4">
             <div className="text-right">
               <div className="text-xl font-light text-aura-gold">4</div>
               <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">Calls Today</div>
             </div>
             <div className="text-right border-l border-glass-border pl-4">
               <div className="text-xl font-light text-aura-emerald">1</div>
               <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">FTD Today</div>
             </div>
           </div>
           <Button variant="secondary" size="icon" onClick={() => setIsTaskModalOpen(true)}>
             <Plus className="w-4 h-4" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Lead Panel */}
        <div className="xl:col-span-2 space-y-6">
          <div className="rounded-xl border border-glass-border bg-[#121214] p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-glass-border gap-4">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded border border-aura-gold/30 bg-black flex items-center justify-center text-lg font-display text-aura-gold">JL</div>
                 <div>
                   <h3 className="text-lg font-medium text-aura-platinum">James Layton</h3>
                   <div className="text-[10px] uppercase tracking-widest text-aura-emerald mt-1">High Potential Lead</div>
                 </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                 <Button variant="secondary" className="flex-1 sm:flex-auto">
                   <FileText className="w-3.5 h-3.5" /> Notes
                 </Button>
                 <Button variant="primary" className="flex-1 sm:flex-auto">
                   <Phone className="w-3.5 h-3.5 fill-black" /> Call Now
                 </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-sm">
               <div>
                  <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Source</div>
                  <div className="text-aura-platinum text-xs">Organic Webinar</div>
               </div>
               <div>
                  <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Timezone</div>
                  <div className="text-aura-platinum text-xs">GMT+1</div>
               </div>
               <div>
                  <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Capacity</div>
                  <div className="font-mono text-aura-gold text-xs">$25k - $50k</div>
               </div>
               <div>
                  <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">Last Touch</div>
                  <div className="text-aura-platinum text-xs">2 hrs ago</div>
               </div>
            </div>

            <div className="rounded border border-aura-gold/20 bg-gradient-to-br from-aura-gold/10 to-transparent p-6 backdrop-blur-md">
              <div className="text-[10px] text-aura-gold font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <PlayCircle className="w-4 h-4" /> AI NEXT BEST ACTION
              </div>
              <div className="rounded bg-black/40 p-4 border border-glass-border border-l-2 border-l-aura-gold">
                <p className="text-aura-platinum/90 text-xs leading-relaxed">
                  Call immediately. He just finished watching the Commodities Market Breakdown video. Start the conversation by asking his opinion on Gold's resistance level. Do not push for a deposit right away.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Queue */}
        <div className="space-y-6">
          <div className="rounded-xl border border-glass-border bg-[#121214] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">Task Queue</h3>
              <button 
                className="text-[10px] text-aura-gold hover:text-aura-gold-light uppercase tracking-widest font-bold transition-colors"
                onClick={() => setIsTaskModalOpen(true)}
              >
                + New
              </button>
            </div>
            
            <div className="space-y-3">
              {[
                { name: "James Layton", type: "Urgent Call", time: "Now", urgent: true },
                { name: "Michael T.", type: "Follow up", time: "in 2 hrs", urgent: false },
                { name: "Sarah W.", type: "Send Brochure", time: "in 4 hrs", urgent: false },
              ].map((task, i) => (
                <div key={i} className={`p-4 rounded border-l-2 flex justify-between items-center transition-colors hover:bg-white/5 ${task.urgent ? 'border-aura-ruby bg-aura-ruby/5' : 'border-aura-platinum/30 bg-[#0A0A0B]'}`}>
                  <div>
                    <div className="text-xs font-medium text-aura-platinum">{task.name}</div>
                    <div className={`text-[9px] uppercase tracking-widest mt-1 ${task.urgent ? 'text-aura-ruby' : 'text-aura-platinum/50'}`}>{task.type}</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-aura-platinum/50">
                    <Clock className="w-3 h-3" /> {task.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <LeadPipeline />

      <Modal 
        isOpen={isTaskModalOpen} 
        onClose={() => setIsTaskModalOpen(false)}
        title="Create Agent Task"
        subtitle="Schedule a follow-up or internal action"
      >
         <form className="space-y-4 text-sm" onSubmit={(e) => { e.preventDefault(); setIsTaskModalOpen(false); }}>
            <div>
               <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Lead / Client Name</label>
               <input type="text" className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors" placeholder="e.g. James Layton" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Task Type</label>
                 <select className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors appearance-none">
                    <option>Call</option>
                    <option>Email</option>
                    <option>Review Docs</option>
                 </select>
               </div>
               <div>
                 <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Time</label>
                 <select className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors appearance-none">
                    <option>Next 1 Hour</option>
                    <option>Today</option>
                    <option>Tomorrow</option>
                 </select>
               </div>
            </div>
            <div>
               <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">Notes</label>
               <textarea className="w-full bg-black/40 border border-glass-border rounded px-4 py-2 text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors" rows={3} placeholder="Add context..."></textarea>
            </div>
            <div className="pt-4 border-t border-glass-border flex justify-end gap-3 flex-col sm:flex-row">
               <Button type="button" variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
               <Button type="submit" variant="primary">Create Task</Button>
            </div>
         </form>
      </Modal>
    </div>
  )
}
