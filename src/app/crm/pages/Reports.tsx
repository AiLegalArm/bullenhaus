import React, { useState } from "react";
import { BarChart2, PieChart, TrendingUp, DownloadCloud, Users, DollarSign, Activity, ChevronRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, PieChart as RechartsPie, Pie } from "recharts";
import { useI18n } from "../lib/i18n";

// FIX: Reports page was completely empty - now has actual content

const revenueData = [
  { month: "Jan", deposits: 2800000, withdrawals: 900000 },
  { month: "Feb", deposits: 3200000, withdrawals: 1100000 },
  { month: "Mar", deposits: 4100000, withdrawals: 1300000 },
  { month: "Apr", deposits: 3700000, withdrawals: 1050000 },
  { month: "May", deposits: 5200000, withdrawals: 1800000 },
  { month: "Jun", deposits: 4800000, withdrawals: 1400000 },
];

const agentData = [
  { name: "Alexander M.", calls: 142, conversions: 28, volume: 1240000 },
  { name: "Sarah J.", calls: 128, conversions: 22, volume: 980000 },
  { name: "Elena R.", calls: 115, conversions: 19, volume: 820000 },
  { name: "David W.", calls: 98, conversions: 12, volume: 540000 },
  { name: "Marcus L.", calls: 87, conversions: 9, volume: 380000 },
];

const churnReasons = [
  { name: "Market Volatility", value: 38, color: "#D4AF37" },
  { name: "Better Offer", value: 27, color: "#10B981" },
  { name: "Service Issues", value: 18, color: "#FB7185" },
  { name: "Account Frozen", value: 10, color: "#E5E5E5" },
  { name: "Other", value: 7, color: "#6B7280" },
];

type ReportType = 'revenue' | 'agents' | 'churn' | null;

export function Reports() {
  const { t } = useI18n();
  const [activeReport, setActiveReport] = useState<ReportType>(null);

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-glass-border pb-4 mb-6 flex justify-between items-end">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('reportsTitle')}</h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('reportsSubtitle')}</p>
        </div>
        <button className="border border-white/5 bg-white/5 hover:bg-white/10 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
          <DownloadCloud className="w-3.5 h-3.5" /> {t('exportPdf')}
        </button>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Deposits MTD", value: "$5.2M", change: "+18%", icon: <DollarSign className="w-4 h-4" />, up: true },
          { label: "Net Revenue MTD", value: "$842K", change: "+11%", icon: <TrendingUp className="w-4 h-4" />, up: true },
          { label: "Active Users", value: "1,248", change: "+5.2%", icon: <Users className="w-4 h-4" />, up: true },
          { label: "Churn Rate", value: "4.2%", change: "+0.8%", icon: <Activity className="w-4 h-4" />, up: false },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-5">
            <div className="text-aura-platinum/40 mb-2">{kpi.icon}</div>
            <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40 mb-1">{kpi.label}</div>
            <div className="text-xl font-light text-aura-gold">{kpi.value}</div>
            <div className={`text-[10px] mt-1 ${kpi.up ? 'text-aura-emerald' : 'text-aura-ruby'}`}>{kpi.change}</div>
          </div>
        ))}
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <ReportCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="Revenue Growth Report"
          description="Comprehensive breakdown of all incoming deposits vs withdrawals over the selected period."
          active={activeReport === 'revenue'}
          onClick={() => setActiveReport(activeReport === 'revenue' ? null : 'revenue')}
        />
        <ReportCard
          icon={<BarChart2 className="w-5 h-5" />}
          title="Agent Performance"
          description="Detailed metrics on calls, talk time, conversion rates, and total generated FTD volume per agent."
          active={activeReport === 'agents'}
          onClick={() => setActiveReport(activeReport === 'agents' ? null : 'agents')}
        />
        <ReportCard
          icon={<PieChart className="w-5 h-5" />}
          title="VIP Churn Analysis"
          description="AI-generated report on why VIP clients leave, featuring common indicators and retention effectiveness."
          active={activeReport === 'churn'}
          onClick={() => setActiveReport(activeReport === 'churn' ? null : 'churn')}
        />
      </div>

      {/* Dynamic Report Detail */}
      {activeReport === 'revenue' && (
        <div className="rounded-xl border border-aura-gold/20 bg-[#121214] p-8 animate-in fade-in">
          <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase mb-6">Capital Flow — 6 Months</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#048A81" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#048A81" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FB7185" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FB7185" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000000}M`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121214', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#E5E5E5' }}
                  formatter={(v: any) => [`$${(v / 1000000).toFixed(2)}M`]}
                />
                <Area type="monotone" dataKey="deposits" name="Deposits" stroke="#048A81" strokeWidth={2} fillOpacity={1} fill="url(#colorDep)" />
                <Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="#FB7185" strokeWidth={2} fillOpacity={1} fill="url(#colorWith)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeReport === 'agents' && (
        <div className="rounded-xl border border-aura-gold/20 bg-[#121214] p-8 animate-in fade-in overflow-x-auto">
          <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase mb-6">Agent Performance — Current Month</h3>
          <table className="w-full text-left min-w-[500px]">
            <thead>
              <tr className="border-b border-glass-border text-[10px] font-bold tracking-widest text-aura-platinum/40 uppercase">
                <th className="pb-4">Agent</th>
                <th className="pb-4">Calls</th>
                <th className="pb-4">Conversions</th>
                <th className="pb-4">Conv. Rate</th>
                <th className="pb-4 text-right">FTD Volume</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {agentData.map((agent, idx) => (
                <tr key={idx} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors">
                  <td className="py-3 font-medium text-aura-platinum">{agent.name}</td>
                  <td className="py-3 font-mono text-aura-platinum/70">{agent.calls}</td>
                  <td className="py-3 font-mono text-aura-platinum/70">{agent.conversions}</td>
                  <td className="py-3 font-mono">
                    <span className={`${(agent.conversions / agent.calls) > 0.15 ? 'text-aura-emerald' : 'text-aura-ruby'}`}>
                      {((agent.conversions / agent.calls) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 font-mono text-aura-gold text-right">
                    ${(agent.volume / 1000).toFixed(0)}K
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeReport === 'churn' && (
        <div className="rounded-xl border border-aura-gold/20 bg-[#121214] p-8 animate-in fade-in">
          <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase mb-6">VIP Churn Breakdown — Trailing 90 Days</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={churnReasons} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} strokeWidth={2} stroke="#050505">
                    {churnReasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121214', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(v: any) => [`${v}%`]}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {churnReasons.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="text-xs text-aura-platinum/70">{r.name}</span>
                  </div>
                  <span className="text-xs font-mono text-aura-platinum">{r.value}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 p-4 rounded border border-aura-gold/20 bg-aura-gold/5">
            <p className="text-[11px] text-aura-platinum/70 leading-relaxed">
              <strong className="text-aura-gold">AI Insight:</strong> Market Volatility is the #1 churn driver. Recommend proactive outreach during high-volatility periods with personalized risk management briefings for Tier-1 VIPs.
            </p>
          </div>
        </div>
      )}

      {!activeReport && (
        <div className="rounded border border-glass-border bg-[#121214] p-12 text-center">
          <p className="font-serif text-lg text-aura-platinum/40 italic">{t('selectReport')}</p>
        </div>
      )}
    </div>
  );
}

function ReportCard({ icon, title, description, active, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`rounded border bg-[#121214] p-6 group cursor-pointer transition-all duration-300 ${active ? 'border-aura-gold/50 bg-aura-gold/5' : 'border-glass-border hover:border-aura-gold/30'}`}
    >
      <div className={`h-10 w-10 rounded flex items-center justify-center mb-4 transition-colors ${active ? 'bg-aura-gold/20' : 'bg-white/5 group-hover:bg-aura-gold/10'}`}>
        <span className={`transition-colors ${active ? 'text-aura-gold' : 'text-aura-platinum group-hover:text-aura-gold'}`}>{icon}</span>
      </div>
      <h3 className={`text-sm font-medium mb-2 transition-colors ${active ? 'text-aura-gold' : 'text-aura-platinum'}`}>{title}</h3>
      <p className="text-xs text-aura-platinum/50 mb-4">{description}</p>
      <div className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${active ? 'text-aura-gold' : 'text-aura-platinum/30 group-hover:text-aura-gold'}`}>
        {active ? 'Hide Report' : 'View Report'} <ChevronRight className="w-3 h-3" />
      </div>
    </div>
  );
}
