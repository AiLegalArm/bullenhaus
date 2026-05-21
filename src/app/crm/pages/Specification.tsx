import { FileText, Shield, Zap, Target } from "lucide-react";

export function Specification() {
  return (
    <div className="space-y-12 pb-16 max-w-5xl mx-auto">
      
      {/* Header section */}
      <div className="text-center space-y-6 py-12 border-b border-glass-border">
        <h1 className="text-4xl md:text-5xl font-serif font-light italic tracking-tight text-aura-gold">Aura Enterprise CRM</h1>
        <p className="text-sm font-bold tracking-[0.2em] text-aura-platinum/60 mx-auto uppercase">
          Luxury AI-Powered Command Center Specification
        </p>
      </div>

      {/* 1. Product Concept */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold tracking-[0.2em] text-aura-platinum/80 uppercase flex items-center gap-3">
          <Target className="w-5 h-5 text-aura-gold" />
          1. Product Concept
        </h2>
        <div className="rounded-xl border border-glass-border bg-[#121214] p-8 space-y-4 text-aura-platinum/80 leading-relaxed text-sm">
          <p>
            <strong className="text-aura-platinum font-bold">AURA</strong> is not a generic CRM; it is an exclusive, luxury command center designed for high-end Trading Platforms, Private Banking sectors, and VIP Managers. The core philosophy is to minimize visual noise while maximizing intelligence density.
          </p>
          <ul className="list-disc pl-5 space-y-3 mt-4 text-xs">
            <li><strong className="text-aura-platinum font-bold">Aesthetic:</strong> Premium Dark Interface with Glassmorphism, deep graphite/navy backgrounds, and champagne gold accents.</li>
            <li><strong className="text-aura-platinum font-bold">AI-First:</strong> AI is not an add-on; it is the core engine analyzing capital flow, predicting churn, and scoring leads.</li>
            <li><strong className="text-aura-platinum font-bold">Executive Focus:</strong> Built for quick ingestion of complex data by Directors and seamless execution by VIP Agents.</li>
          </ul>
        </div>
      </section>

      {/* 2. Information Architecture */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold tracking-[0.2em] text-aura-platinum/80 uppercase flex items-center gap-3">
          <FileText className="w-5 h-5 text-aura-gold" />
          2. Information Architecture
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <IACard 
            title="Core CRM" 
            items={["Leads & Funnel", "Client Database", "VIP Segmentation", "Tasks & Follow-ups", "Retention Risk Matrix"]}
          />
          <IACard 
            title="Call Center" 
            items={["Live Agent Workspace", "Predictive Dialer Queue", "Manager Monitoring", "Escalation Hub"]}
          />
          <IACard 
            title="AI Intelligence" 
            items={["Client Summary Generation", "Churn Prediction Alerts", "Next Best Action (NBA)", "Call Script Generation"]}
          />
          <IACard 
            title="Admin & Security" 
            items={["Role-Based Access Control", "Audit Logs", "Integration Hub", "Platform Settings"]}
          />
        </div>
      </section>

      {/* 3. Role-Based UX */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold tracking-[0.2em] text-aura-platinum/80 uppercase flex items-center gap-3">
          <Shield className="w-5 h-5 text-aura-gold" />
          3. Role-Based UX & Permissions
        </h2>
        <div className="rounded border border-glass-border bg-[#121214] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0A0A0B] border-b border-glass-border">
              <tr>
                <th className="p-4 font-bold text-aura-platinum/40 uppercase tracking-[0.2em] text-[10px]">Role</th>
                <th className="p-4 font-bold text-aura-platinum/40 uppercase tracking-[0.2em] text-[10px]">UX Focus</th>
                <th className="p-4 font-bold text-aura-platinum/40 uppercase tracking-[0.2em] text-[10px]">Key Modules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-glass-border">
              <RoleRow 
                role="System Admin" 
                ux="Technical, configuration-heavy, dense data tables." 
                modules="Settings, Audit Logs, RBAC, Integrations"
              />
              <RoleRow 
                role="Director" 
                ux="High-level dashboard, VIP metrics, minimalist charts." 
                modules="Executive Dashboard, Total Revenue, Risk Alerts"
              />
              <RoleRow 
                role="Manager" 
                ux="Supervision, real-time agent monitoring, workflow routing." 
                modules="Team Dashboard, Call Center Monitor, Escalations"
              />
              <RoleRow 
                role="Agent / VIP Mgr" 
                ux="Action-oriented, fast client cards, AI script suggestions." 
                modules="Agent Workspace, Assigned Leads, Tasks"
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. AI Features Spec */}
      <section className="space-y-6">
        <h2 className="text-sm font-bold tracking-[0.2em] text-aura-platinum/80 uppercase flex items-center gap-3">
          <Zap className="w-5 h-5 text-aura-gold" />
          4. AI Features Specification
        </h2>
        <div className="space-y-4">
          <AIFeature 
            name="AI Churn Risk Prediction" 
            desc="Analyzes drop in login frequency, withdrawal patterns, and unread messages to flag VIPs with a risk score (0-100%)."
          />
          <AIFeature 
            name="AI Next Best Action (NBA)" 
            desc="Recommends the agent's next move directly in the client card (e.g., 'Offer 5% bonus to match competitor X')."
          />
          <AIFeature 
            name="Executive Summary Briefs" 
            desc="Daily generated text summaries for the Director, highlighting anomalies or major deposits without needing to read charts."
          />
          <AIFeature 
            name="Call Sentiment & Compliance Analysis" 
            desc="Transcribes calls in real-time and alerts managers if agents promise unauthorized ROI."
          />
        </div>
      </section>

    </div>
  );
}

function IACard({ title, items }: { title: string, items: string[] }) {
  return (
    <div className="rounded border border-glass-border bg-[#121214] p-6">
      <h3 className="font-serif text-lg font-light italic tracking-tight text-aura-platinum mb-4 border-b border-glass-border pb-2">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3 text-xs text-aura-platinum/60 font-mono">
            <span className="w-1 h-1 rounded-full bg-aura-gold/50"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function RoleRow({ role, ux, modules }: { role: string, ux: string, modules: string }) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="p-4 font-bold text-aura-gold text-[11px] uppercase tracking-wider">{role}</td>
      <td className="p-4 text-aura-platinum/70 text-xs">{ux}</td>
      <td className="p-4 text-aura-platinum/50 text-[10px] uppercase font-bold tracking-wider">{modules}</td>
    </tr>
  )
}

function AIFeature({ name, desc }: { name: string, desc: string }) {
  return (
    <div className="rounded border border-glass-border bg-[#121214] p-5 border-l-2 border-l-aura-emerald flex flex-col gap-1">
      <h4 className="font-bold text-[11px] uppercase tracking-widest text-aura-platinum">{name}</h4>
      <p className="text-xs text-aura-platinum/50 mt-1">{desc}</p>
    </div>
  )
}
