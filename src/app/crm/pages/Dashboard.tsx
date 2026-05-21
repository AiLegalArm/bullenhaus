import { 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert,
  Activity,
  DollarSign
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const performanceData = [
  { name: "Mon", deposit: 4000, withdrawal: 2400 },
  { name: "Tue", deposit: 3000, withdrawal: 1398 },
  { name: "Wed", deposit: 9800, withdrawal: 2000 },
  { name: "Thu", deposit: 3908, withdrawal: 2780 },
  { name: "Fri", deposit: 4800, withdrawal: 1890 },
  { name: "Sat", deposit: 3800, withdrawal: 2390 },
  { name: "Sun", deposit: 4300, withdrawal: 3490 },
];

export function Dashboard() {
  return (
    <div className="space-y-8 pb-12">
      {/* Top AI Insight Banner */}
      <div className="rounded-2xl border border-aura-gold/20 bg-gradient-to-br from-aura-gold/10 to-transparent p-6 backdrop-blur-md flex items-start gap-4">
        <div className="p-3 bg-black/40 border border-glass-border rounded-xl shrink-0 mt-1">
          <Activity className="w-6 h-6 text-aura-gold" />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xs font-bold tracking-widest text-aura-gold">AI CORE INSIGHTS</h3>
          </div>
          <p className="text-aura-platinum/80 leading-relaxed text-sm">
            Net capital inflow remains strong at +18.4% this week. We have detected a 22% elevated churn risk among Tier-2 VIP clients in the European sector driven by recent market volatility. 
            Algorithm recommends immediate assignment of 14 high-risk VIP accounts to senior retention specialists. 
          </p>
          <div className="mt-4 flex gap-2">
            <button className="bg-aura-gold text-black text-[10px] font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-aura-gold-light transition duration-300">
              Execute AI Strategy
            </button>
            <button className="border border-white/10 text-[10px] font-bold px-4 py-2 rounded uppercase tracking-widest hover:bg-white/5 transition duration-300">
              View Risk Report
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard 
          title="Total AUM" 
          value="$42.5M" 
          change="+12.5%" 
          trend="up" 
          icon={<DollarSign className="w-5 h-5" />} 
          subtitle="Assets Under Management"
        />
        <KPICard 
          title="Active Traders" 
          value="1,248" 
          change="+5.2%" 
          trend="up" 
          icon={<Users className="w-5 h-5" />} 
          subtitle="Trailing 30 Days"
        />
        <KPICard 
          title="Net Revenue" 
          value="$842.1K" 
          change="-2.4%" 
          trend="down" 
          icon={<TrendingUp className="w-5 h-5" />} 
          subtitle="MTD Revenue"
        />
        <KPICard 
          title="Churn Risk Index" 
          value="High" 
          change="14 VIPs" 
          trend="down" 
          icon={<ShieldAlert className="w-5 h-5 text-aura-ruby" />} 
          subtitle="Requires attention"
          alert
        />
      </div>

      {/* Charts and Tables Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="glass-panel p-8 rounded-2xl xl:col-span-2 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60">CAPITAL FLOW</h3>
            </div>
            <div className="text-[10px] text-aura-gold border border-aura-gold/30 px-3 py-1 rounded-full uppercase">REAL-TIME FEED</div>
          </div>
          
          <div className="flex-1 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#048A81" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#048A81" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWithdrawal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D90429" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#D90429" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(26,26,28,0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#E5E4E2' }}
                />
                <Area type="monotone" dataKey="deposit" stroke="#048A81" strokeWidth={2} fillOpacity={1} fill="url(#colorDeposit)" />
                <Area type="monotone" dataKey="withdrawal" stroke="#D90429" strokeWidth={2} fillOpacity={1} fill="url(#colorWithdrawal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Call Center Performance */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <div className="mb-4">
            <h3 className="text-xs font-bold tracking-[0.2em] text-aura-platinum/60 uppercase">Manager Performance</h3>
            <span className="text-[10px] font-mono text-aura-platinum/30 uppercase mt-1 block">AI Assessed ROI</span>
          </div>

          <div className="space-y-3 flex-1">
            <PerformanceRow name="Alexander M." role="Senior VIP Mgr" score={98} trend="up" />
            <PerformanceRow name="Sarah J." role="Retention Spec." score={92} trend="up" />
            <PerformanceRow name="David W." role="Sales Agent" score={76} trend="down" />
            <PerformanceRow name="Elena R." role="VIP Mgr" score={85} trend="up" />
            <PerformanceRow name="Marcus L." role="Sales Agent" score={61} trend="down" warning />
          </div>

          <button className="w-full mt-6 py-2.5 glass-button rounded-xl text-sm font-medium text-aura-gold">
            View Complete Report
          </button>
        </div>

      </div>
    </div>
  );
}

function KPICard({ title, value, change, trend, icon, subtitle, alert }: any) {
  return (
    <div className={`rounded-xl border border-glass-border bg-gradient-to-b from-white/5 to-transparent p-6 shadow-2xl`}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-aura-platinum/40 flex items-center justify-between">
        {title}
      </div>
      <div className="mt-1 text-2xl font-light tracking-tight text-aura-gold">
        {value}
      </div>
      <div className={`mt-2 text-[10px] ${alert ? 'text-aura-ruby' : trend === 'up' ? 'text-aura-emerald' : 'text-aura-ruby'}`}>
        {change} {subtitle && <span className="text-aura-platinum/20 ml-1 font-normal tracking-normal">{subtitle}</span>}
      </div>
    </div>
  )
}

function PerformanceRow({ name, role, score, trend, warning }: any) {
  return (
    <div className={`flex items-center justify-between p-3 rounded border ${warning ? 'bg-white/[0.02] border-l-2 border-aura-ruby' : 'bg-white/[0.02] border-l-2 border-aura-emerald'} hover:bg-white/5 transition-colors`}>
      <div>
        <div className="text-xs font-medium">{name}</div>
        <div className="text-[9px] text-aura-platinum/40 tracking-wider uppercase mt-1">{role}</div>
      </div>
      <div className="flex flex-col items-end">
        <div className={`text-xs font-mono font-bold ${warning ? 'text-aura-ruby' : 'text-aura-emerald'}`}>
          {score}
        </div>
      </div>
    </div>
  )
}
