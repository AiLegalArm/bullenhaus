import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowDownRight, Activity, Percent, Database, Zap, Users, Shield, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { useClients } from "../hooks/useClients";
import { useI18n } from "../lib/i18n";

const currentData = [
  { time: "00:00", volume: 4000, marginLevel: 80, liquidations: 0 },
  { time: "04:00", volume: 3000, marginLevel: 75, liquidations: 1 },
  { time: "08:00", volume: 8000, marginLevel: 60, liquidations: 4 },
  { time: "12:00", volume: 12000, marginLevel: 45, liquidations: 12 },
  { time: "16:00", volume: 15000, marginLevel: 42, liquidations: 18 },
  { time: "20:00", volume: 9000, marginLevel: 55, liquidations: 2 },
];

function MeasuredChart({
  className,
  children,
}: {
  className: string;
  children: (size: { width: number; height: number }) => React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const updateSize = () => {
      const rect = node.getBoundingClientRect();
      setSize({
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {size.width > 1 && size.height > 1 ? children(size) : null}
    </div>
  );
}

export function TradingIntelligence() {
  const { t } = useI18n();
  const { clients, loading, error, refetch } = useClients(1, 100, "");

  // Filter clients that have an external trading ID (synced from trading platform)
  const tradingClients = clients.filter(c => c.externalTradingId);

  // Sort by registration date descending to show newest first
  const sortedClients = [...tradingClients].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Dynamic metrics calculation
  const totalVolume = tradingClients.reduce((sum, c) => sum + Number(c.totalBalance || 0), 0);
  const totalTraders = tradingClients.length;
  const pendingKyc = tradingClients.filter(c => c.kycStatus === "PENDING").length;
  const criticalRisk = tradingClients.filter(c => c.riskScore === "CRITICAL").length;

  const formattedVolume = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(totalVolume);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="border-b border-glass-border pb-4 mb-6 flex justify-between items-end">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('tradingTitle')}</h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('tradingSubtitle')}</p>
        </div>
        <button 
          onClick={() => refetch()}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono text-aura-gold/60 hover:text-aura-gold transition-colors pb-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> {t('refreshFeed')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard title={t('totalTradingAum')} value={formattedVolume} change={`from ${totalTraders} accounts`} trend="up" icon={<Database className="w-5 h-5" />} />
        <MetricCard title={t('syncedTraders')} value={totalTraders.toString()} change="Platform registrations" trend="up" icon={<Users className="w-5 h-5" />} />
        <MetricCard title={t('pendingKycReviews')} value={pendingKyc.toString()} change="Requires verification" trend="down" icon={<Percent className="w-5 h-5" />} warning={pendingKyc > 0} />
        <MetricCard title={t('criticalChurnRisks')} value={criticalRisk.toString()} change="Requires immediate action" trend="down" icon={<Zap className="w-5 h-5" />} error={criticalRisk > 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Intelligence Chart */}
        <div className="glass-panel p-8 rounded-2xl xl:col-span-2 min-h-[400px] flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60">{t('platformExposure').toUpperCase()}</h3>
            <div className="text-[10px] text-aura-gold border border-aura-gold/30 px-3 py-1 rounded-full uppercase">REAL-TIME FEED</div>
          </div>
          
          <MeasuredChart className="flex-1 w-full mt-4 min-h-[280px]">
             {({ width, height }) => (
                <ComposedChart width={width} height={height} data={currentData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                  <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(26,26,28,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#E5E4E2' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }} />
                  <Bar yAxisId="left" dataKey="volume" name="Traded Volume" fill="#0A1128" radius={[4, 4, 0, 0]} stroke="#048A81" strokeWidth={1} />
                  <Line yAxisId="right" type="monotone" dataKey="marginLevel" name="Avg Margin Level" stroke="#D4AF37" strokeWidth={2} dot={{ fill: '#D4AF37', r: 4 }} />
                </ComposedChart>
             )}
          </MeasuredChart>
        </div>

        {/* AI Insight & Warnings */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-aura-gold/20 bg-gradient-to-br from-aura-gold/10 to-transparent p-6 backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-aura-gold" />
              <h3 className="text-xs font-bold tracking-widest text-aura-gold uppercase">AI CORE ALERTS</h3>
            </div>
            
            <div className="rounded-lg bg-black/40 p-4 border border-glass-border">
              <div className="text-[10px] font-bold text-aura-ruby uppercase tracking-tighter">Action Required</div>
              <p className="mt-1 text-xs text-aura-platinum/80 leading-relaxed">
                Margin calls are accelerating in the XAU/USD pairs due to unexpected volatility spikes. <strong>42 VIP clients</strong> are currently below 80% margin level.
              </p>
              <div className="mt-3 flex gap-2">
                <button className="bg-aura-gold text-black text-[9px] font-bold px-3 py-1 rounded uppercase">Initiate Auto-Close</button>
                <button className="border border-white/10 text-[9px] px-3 py-1 rounded hover:bg-white/5 uppercase">Ignore</button>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-[10px] font-bold tracking-widest text-aura-platinum/30 uppercase mb-4">Top Liquidations (MTD)</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-glass-border pb-4">
                <span className="text-xs font-medium text-aura-platinum/70">ETH/USD Longs</span>
                <span className="text-xs font-mono text-aura-ruby">-$1.2M</span>
              </div>
              <div className="flex justify-between items-center border-b border-glass-border pb-4">
                <span className="text-xs font-medium text-aura-platinum/70">XAU/USD Shorts</span>
                <span className="text-xs font-mono text-aura-ruby">-$840K</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-xs font-medium text-aura-platinum/70">GBP/JPY Longs</span>
                <span className="text-xs font-mono text-aura-ruby">-$320K</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Trading Registrations */}
      <div className="glass-panel p-8 rounded-2xl">
        <div className="mb-6">
          <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">{t('recentTradingRegistrations')}</h3>
          <p className="text-[10px] text-aura-platinum/40 mt-1 uppercase tracking-widest font-mono">Clients synchronized from external trading platform Trade-V2</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-aura-platinum/30">
            <RefreshCw className="w-5 h-5 animate-spin mr-3 text-aura-gold" />
            <span className="text-xs uppercase tracking-widest font-mono">Synchronizing feed…</span>
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 bg-aura-ruby/10 border border-aura-ruby/20 rounded p-4 text-xs text-aura-ruby">
            <XCircle className="w-4 h-4 shrink-0" /> Failed to load trading registrations: {error}
          </div>
        ) : sortedClients.length === 0 ? (
          <div className="text-center py-12 text-aura-platinum/25 border border-dashed border-white/5 rounded-xl bg-black/10">
            <Users className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <div className="text-xs uppercase tracking-widest font-mono">No trading registrations found</div>
            <p className="text-[10px] text-aura-platinum/40 mt-1">Register a client via Trade-V2 or the /register-client endpoint to populate this feed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border text-[9px] uppercase tracking-widest text-aura-platinum/40 font-mono">
                  <th className="pb-3 font-semibold">Client</th>
                  <th className="pb-3 font-semibold">Trading ID</th>
                  <th className="pb-3 font-semibold">Balance</th>
                  <th className="pb-3 font-semibold">Tier</th>
                  <th className="pb-3 font-semibold">KYC Status</th>
                  <th className="pb-3 font-semibold">Risk Score</th>
                  <th className="pb-3 font-semibold text-right">Synced At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-aura-platinum/80">
                {sortedClients.map(vip => {
                  const clientName = `${vip.firstName} ${vip.lastName}`;
                  const balance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(vip.totalBalance) || 0);
                  const isPendingKyc = vip.kycStatus === 'PENDING';
                  const isVerifiedKyc = vip.kycStatus === 'VERIFIED';
                  const isRejectedKyc = vip.kycStatus === 'REJECTED';

                  return (
                    <tr key={vip.id} className="hover:bg-white/3 transition-colors group">
                      <td className="py-3.5 pr-4">
                        <div className="font-medium text-aura-platinum">{clientName}</div>
                        <div className="text-[10px] text-aura-platinum/40 font-mono mt-0.5">{vip.email}</div>
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-[11px] text-aura-gold/80">
                        {vip.externalTradingId || "N/A"}
                      </td>
                      <td className="py-3.5 pr-4 font-mono font-medium">
                        {balance}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-aura-platinum/60">
                          {vip.tier || "Silver"}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-mono font-bold ${
                          isVerifiedKyc ? 'text-aura-emerald' : 
                          isRejectedKyc ? 'text-aura-ruby' : 
                          'text-aura-gold'
                        }`}>
                          {isVerifiedKyc && <ShieldCheck className="w-3 h-3" />}
                          {isRejectedKyc && <XCircle className="w-3 h-3" />}
                          {isPendingKyc && <Clock className="w-3 h-3" />}
                          {vip.kycStatus}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className={`text-[9px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                          vip.riskScore === 'LOW' ? 'bg-aura-emerald/10 text-aura-emerald border border-aura-emerald/20' : 
                          vip.riskScore === 'MEDIUM' ? 'bg-aura-gold/10 text-aura-gold border border-aura-gold/20' : 
                          'bg-aura-ruby/10 text-aura-ruby border border-aura-ruby/20'
                        }`}>
                          {vip.riskScore}
                        </span>
                      </td>
                      <td className="py-3.5 text-right text-aura-platinum/40 font-mono text-[10px]">
                        {new Date(vip.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

function MetricCard({ title, value, change, trend, icon, warning, error }: any) {
  let colorClass = "text-aura-platinum";
  
  if (warning) {
    colorClass = "text-aura-gold";
  }
  if (error) {
    colorClass = "text-aura-ruby";
  }

  return (
    <div className={`rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-6 shadow-2xl`}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40">
        {title}
      </div>
      <div className={`mt-1 text-2xl font-light tracking-tight ${colorClass}`}>
        {value}
      </div>
      <div className={`mt-2 text-[10px] ${error || warning ? 'text-aura-ruby' : 'text-aura-emerald'}`}>
        {change}
      </div>
    </div>
  )
}
