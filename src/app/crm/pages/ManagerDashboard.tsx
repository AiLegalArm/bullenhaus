import React from "react";
import { Users, TrendingUp, AlertTriangle, PlayCircle, BarChart2, ShieldAlert } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Button } from "../components/ui/Button";
import { useI18n } from "../lib/i18n";

const teamPerformance = [
  { name: "Team Alpha", conversion: 18.2, volume: 1.2, alert: false },
  { name: "Team Beta", conversion: 14.5, volume: 0.8, alert: false },
  { name: "Team Gamma", conversion: 11.0, volume: 0.5, alert: true },
];

const callVolume = [
  { time: "08:00", volume: 120 },
  { time: "12:00", volume: 450 },
  { time: "16:00", volume: 380 },
  { time: "20:00", volume: 150 },
];

export function ManagerDashboard() {
  const { t } = useI18n();
  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-glass-border pb-4 mb-6">
        <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('managerTitle')}</h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('managerSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-6 shadow-2xl hover:border-aura-gold/20 transition-colors">
          <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40">Team FTD Volume</div>
          <div className="mt-1 text-2xl font-light tracking-tight text-aura-gold">$2.4M</div>
          <div className="mt-2 text-[10px] text-aura-emerald flex items-center gap-1">+12% vs last month</div>
        </div>
        <div className="rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-6 shadow-2xl hover:border-aura-gold/20 transition-colors">
          <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40">Avg Conversion Rate</div>
          <div className="mt-1 text-2xl font-light tracking-tight text-aura-platinum">14.6%</div>
          <div className="mt-2 text-[10px] text-aura-emerald flex items-center gap-1">+2.1% improvement</div>
        </div>
        <div className="rounded-xl border border-aura-ruby/30 bg-gradient-to-b from-aura-ruby/5 to-transparent p-6 shadow-2xl relative overflow-hidden group cursor-pointer hover:border-aura-ruby transition-colors">
          <div className="text-[10px] uppercase tracking-[0.2em] text-aura-ruby">Escalated Calls</div>
          <div className="mt-1 text-2xl font-light tracking-tight text-aura-ruby">4 Active</div>
          <div className="mt-2 text-[10px] text-aura-platinum/50">Requires urgent review</div>
          <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-110 transition-transform"><AlertTriangle className="w-8 h-8 text-aura-ruby" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-xl border border-glass-border bg-[#121214] p-8 flex flex-col overflow-x-auto min-h-[400px]">
          <div className="mb-6 flex justify-between items-center">
            <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">Team Standings</h3>
            <Button variant="outline" size="sm">Download Report</Button>
          </div>
          
          <table className="w-full text-left min-w-[400px]">
            <thead>
              <tr className="border-b border-glass-border text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 uppercase">
                <th className="pb-4">Team</th>
                <th className="pb-4">FTD Volume</th>
                <th className="pb-4">Conversion</th>
                <th className="pb-4 text-right">AI Score</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {teamPerformance.map((team, idx) => (
                <tr key={idx} className={`border-b border-glass-border border-opacity-50 hover:bg-white/5 transition-colors ${team.alert ? 'bg-aura-ruby/5 border-aura-ruby/20' : ''}`}>
                  <td className="py-4 font-medium text-aura-platinum flex items-center gap-2">
                    {team.name}
                    {team.alert && <ShieldAlert className="w-3.5 h-3.5 text-aura-ruby ml-1" />}
                  </td>
                  <td className="py-4 font-mono">${team.volume}M</td>
                  <td className="py-4 font-mono">{team.conversion}%</td>
                  <td className={`py-4 text-right font-mono ${team.alert ? 'text-aura-ruby' : 'text-aura-emerald'}`}>9{8 - idx}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-8 pt-6 border-t border-glass-border">
             <h3 className="text-[10px] uppercase tracking-widest font-bold text-aura-platinum/60 mb-6 flex items-center gap-2">
               <BarChart2 className="w-4 h-4" /> Today's Call Volume Trend
             </h3>
             <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={callVolume}>
                    <defs>
                      <linearGradient id="colorVolTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} contentStyle={{ backgroundColor: '#121214', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Area type="monotone" dataKey="volume" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorVolTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="rounded-xl border border-aura-gold/20 bg-gradient-to-br from-aura-gold/10 to-transparent p-6 backdrop-blur-md">
              <div className="text-[10px] text-aura-gold font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <PlayCircle className="w-4 h-4" /> AI TEAM INSIGHTS
              </div>
              <div className="rounded border-l-2 border-l-aura-gold bg-black/40 p-4 border border-glass-border">
                <div className="text-[10px] font-bold text-aura-platinum uppercase tracking-wider">Coaching Opportunity</div>
                <p className="mt-2 text-xs text-aura-platinum/80 leading-relaxed mb-4">
                  Team Gamma is struggling with objection handling on the new tech sector index. AI suggests a 15-minute training drill based on Team Alpha's successful scripts.
                </p>
                <Button variant="primary" size="sm" className="w-full">Schedule Drill</Button>
              </div>
           </div>
           
           <div className="rounded-xl border border-glass-border bg-[#121214] p-6">
             <div className="mb-4">
               <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">Live Escalations</h3>
             </div>
             <div className="space-y-3">
                 <div className="p-3 rounded bg-aura-ruby/5 border-l-2 border-aura-ruby cursor-pointer hover:bg-aura-ruby/10 transition-colors">
                   <div className="flex justify-between items-start mb-1">
                     <span className="text-xs font-medium text-aura-platinum">Client #8423</span>
                     <span className="text-[10px] text-aura-ruby uppercase tracking-widest font-bold">Live</span>
                   </div>
                   <div className="text-[10px] text-aura-platinum/60 leading-relaxed">Agent Victor L. requested supervisor takeover. KYC failure risk.</div>
                 </div>
                 <div className="p-3 rounded bg-white/5 border-l-2 border-aura-platinum/30 cursor-pointer hover:bg-white/10 transition-colors">
                   <div className="flex justify-between items-start mb-1">
                     <span className="text-xs font-medium text-aura-platinum">Client #9112</span>
                     <span className="text-[10px] text-aura-platinum/40 uppercase tracking-widest">Pending</span>
                   </div>
                   <div className="text-[10px] text-aura-platinum/60 leading-relaxed">Withdrawal approval delay &gt; 48h.</div>
                 </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
