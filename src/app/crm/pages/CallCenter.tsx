import React, { useState, useEffect } from "react";
import { Phone, PhoneOutgoing, PhoneIncoming, Clock, Mic, MicOff, Settings2, PlayCircle, BarChart2, Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { useI18n } from "../lib/i18n";

const callVolume = [
  { time: "08:00", volume: 12 },
  { time: "09:00", volume: 45 },
  { time: "10:00", volume: 68 },
  { time: "11:00", volume: 82 },
  { time: "12:00", volume: 55 },
  { time: "13:00", volume: 48 },
  { time: "14:00", volume: 70 },
  { time: "15:00", volume: 90 },
];

export function CallCenter() {
  const { t } = useI18n();
  const [isEndCallModalOpen, setIsEndCallModalOpen] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isEndCallModalOpen) {
      setIsAiProcessing(true);
      timer = setTimeout(() => {
        setIsAiProcessing(false);
      }, 1500);
    }
    return () => clearTimeout(timer);
  }, [isEndCallModalOpen]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
           <div className="bg-aura-emerald/10 text-aura-emerald border border-aura-emerald/20 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-aura-emerald animate-pulse"></span>
             {t('readyDialer')}
           </div>
           <div className="text-aura-platinum/30 text-[10px] font-bold uppercase tracking-widest">
             {t('queueLeads')}
           </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm">
            <Settings2 className="w-3.5 h-3.5" /> {t('dialerSettings')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Active Call Workspace (Agent View) */}
        <div className="xl:col-span-2 rounded-xl border border-glass-border bg-[#121214] p-8 flex flex-col justify-between relative overflow-hidden min-h-[500px]">
          {/* subtle glow in corner */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-aura-gold/5 blur-[80px] pointer-events-none rounded-full" />

          <div>
             <div className="flex items-center justify-between mb-8 border-b border-glass-border pb-4">
               <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60">{t('activeCall').toUpperCase()}</h3>
               <div className="flex items-center gap-2 text-aura-platinum/60 font-mono text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-aura-ruby animate-pulse mr-1"></span>
                  04:22
               </div>
             </div>

             <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-10">
               <div className="w-20 h-20 shrink-0 rounded-full bg-black/40 border-2 border-aura-gold flex items-center justify-center text-2xl font-display text-aura-gold shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                 VL
               </div>
               <div>
                  <h2 className="text-2xl sm:text-3xl font-medium text-aura-platinum mb-2">Victor Lebedev</h2>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium uppercase tracking-wider">
                    <span className="text-aura-gold-light tracking-widest">Platinum VIP</span>
                    <span className="text-aura-platinum/30 hidden sm:inline">•</span>
                    <span className="text-aura-platinum/70 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> +41 79 123 45 67</span>
                  </div>
               </div>
             </div>

             {/* AI Script / Next Best Action */}
             <div className="rounded border border-aura-gold/20 bg-gradient-to-br from-aura-gold/10 to-transparent p-6 backdrop-blur-md mt-10">
                <div className="text-[10px] text-aura-gold font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" /> {t('aiRecommendedApproach').toUpperCase()}
                </div>
                <div className="rounded bg-black/40 p-4 border border-glass-border">
                  <p className="text-aura-platinum/90 text-xs sm:text-sm leading-relaxed mb-4">
                    Victor responded poorly to aggressive sales last week. <strong>Focus on security and market stability.</strong> Propose the new Swiss algorithmic index.
                    Mention the recent 4% drop in tech stocks as a transition opportunity.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary" size="sm">
                      Send Index Brochure
                    </Button>
                    <Button variant="secondary" size="sm">
                      Offer Analyst Call
                    </Button>
                  </div>
                </div>
             </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-glass-border relative z-10">
             <button className="w-12 h-12 rounded border border-white/5 bg-black/40 hover:bg-white/10 flex items-center justify-center text-aura-platinum hover:text-aura-gold transition-colors backdrop-blur-sm shadow-lg">
               <MicOff className="w-5 h-5" />
             </button>
             <button 
               className="w-14 h-14 rounded bg-aura-ruby text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-[0_0_20px_rgba(251,113,133,0.3)]"
               onClick={() => setIsEndCallModalOpen(true)}
             >
               <Phone className="w-6 h-6 rotate-[135deg]" />
             </button>
             <button className="w-12 h-12 rounded border border-white/5 bg-black/40 hover:bg-white/10 flex items-center justify-center text-aura-platinum hover:text-aura-gold transition-colors backdrop-blur-sm shadow-lg">
               <Settings2 className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Manager/Queue Sidebar */}
        <div className="space-y-6">
           <div className="rounded-xl border border-glass-border bg-[#121214] p-6">
             <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 mb-4 uppercase">{t('callQueue')}</h3>
             <div className="space-y-3">
               <QueueItem name="Sarah Jenkins" time="15:00" type="Follow-up" />
               <QueueItem name="Mikhail I." time="15:15" type="Margin Call" alert />
               <QueueItem name="David Wu" time="15:30" type="Welcome Call" />
               <QueueItem name="Emma Schmidt" time="16:00" type="Risk Alert" alert />
             </div>
           </div>

           <div className="rounded-xl border border-glass-border bg-[#121214] p-6">
             <h3 className="text-[10px] uppercase tracking-widest font-bold text-aura-platinum/60 mb-4 flex items-center gap-2">
               <BarChart2 className="w-4 h-4 text-aura-gold" /> Pulse
             </h3>
             <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={callVolume}>
                    <defs>
                      <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="volume" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#colorVol)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
           </div>
        </div>

      </div>

      <Modal
        isOpen={isEndCallModalOpen}
        onClose={() => setIsEndCallModalOpen(false)}
        title={t('wrapUpCall')}
        subtitle="Victor Lebedev (04:25)"
      >
        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); setIsEndCallModalOpen(false); }}>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">{t('callOutcome')}</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="border border-glass-border bg-black/40 hover:bg-white/5 p-3 rounded cursor-pointer transition-colors flex items-center gap-2">
                 <input type="radio" name="outcome" className="accent-aura-gold" defaultChecked />
                 <span className="text-sm">Interested / FTD</span>
              </label>
              <label className="border border-glass-border bg-black/40 hover:bg-white/5 p-3 rounded cursor-pointer transition-colors flex items-center gap-2">
                 <input type="radio" name="outcome" className="accent-aura-gold" />
                 <span className="text-sm">Call Back</span>
              </label>
              <label className="border border-glass-border bg-black/40 hover:bg-white/5 p-3 rounded cursor-pointer transition-colors flex items-center gap-2">
                 <input type="radio" name="outcome" className="accent-aura-gold" />
                 <span className="text-sm">Not Interested</span>
              </label>
              <label className="border border-glass-border bg-black/40 hover:bg-white/5 p-3 rounded cursor-pointer transition-colors flex items-center gap-2">
                 <input type="radio" name="outcome" className="accent-aura-gold" />
                 <span className="text-sm">No Answer</span>
              </label>
            </div>
          </div>

          <div>
             <label className="block text-[10px] uppercase tracking-widest text-aura-platinum/50 mb-2">{t('aiSummaryNotes')}</label>
             {isAiProcessing ? (
               <div className="w-full bg-black/40 border border-glass-border rounded px-4 py-6 border-l-2 border-l-aura-gold/50 flex flex-col items-center justify-center gap-3 relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-aura-gold/5 to-transparent animate-[shimmer_2s_infinite]"></div>
                 <Sparkles className="w-5 h-5 text-aura-gold animate-pulse" />
                 <span className="text-[10px] uppercase tracking-widest text-aura-platinum/60 font-mono animate-pulse">AI processing transcript...</span>
               </div>
             ) : (
               <textarea 
                 className="w-full bg-black/40 border border-glass-border rounded px-4 py-3 text-sm text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors h-24 shadow-inner" 
                 defaultValue="Victor showed interest in the Swiss algorithmic index. Wants a follow-up email with the brochure and historical performance docs. Advised to call back next Tuesday."
               />
             )}
          </div>

          <div className="pt-4 border-t border-glass-border flex justify-end gap-3 flex-col sm:flex-row">
            <Button type="button" variant="ghost" onClick={() => setIsEndCallModalOpen(false)}>{t('cancel')}</Button>
            <Button type="submit" variant="primary" disabled={isAiProcessing}>{t('saveNextLead')}</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

function QueueItem({ name, time, type, alert }: any) {
  return (
    <div className={`p-3 rounded bg-black/40 border-l-2 flex items-center justify-between transition-colors hover:bg-white/5 ${alert ? 'border-aura-ruby' : 'border-aura-emerald'}`}>
      <div>
        <div className="text-xs font-medium text-aura-platinum">{name}</div>
        <div className={`text-[9px] uppercase tracking-wider mt-1 ${alert ? 'text-aura-ruby' : 'text-aura-platinum/40'}`}>
          {type}
        </div>
      </div>
      <div className="text-[10px] font-mono font-bold text-aura-platinum/70">
         {time}
      </div>
    </div>
  )
}
