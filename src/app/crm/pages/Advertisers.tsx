import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/auth";
import { motion, AnimatePresence } from "motion/react";
import {
  Megaphone, Tag, Users, DollarSign, TrendingUp,
  Plus, ChevronRight, RefreshCw, CheckCircle2,
  XCircle, Hash, Activity, Layers
} from "lucide-react";

interface Advertiser {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  codes: ReferralCode[];
}

interface ReferralCode {
  id: string;
  code: string;
  advertiserId: string;
  campaignName: string | null;
  createdAt: string;
}

interface AdvertiserStats {
  advertiser: { id: string; name: string; isActive: boolean; description?: string | null };
  codes: ReferralCode[];
  leads?: number;
  clients?: number;
  totalRegistrations?: number;
  totalDeposits: number;
  depositVolume?: number;
  totalVolume?: number;
  activeTraders: number;
}

function StatCard({ icon: Icon, label, value, sub, color = "gold" }: {
  icon: any; label: string; value: string | number; sub?: string; color?: "gold" | "emerald" | "blue" | "ruby";
}) {
  const colors = {
    gold:    { ring: "border-aura-gold/20",   icon: "text-aura-gold",    glow: "shadow-[0_0_20px_rgba(212,175,55,0.06)]"  },
    emerald: { ring: "border-aura-emerald/20",icon: "text-aura-emerald", glow: "shadow-[0_0_20px_rgba(16,185,129,0.06)]" },
    blue:    { ring: "border-blue-400/20",     icon: "text-blue-400",     glow: "shadow-[0_0_20px_rgba(96,165,250,0.06)]"  },
    ruby:    { ring: "border-aura-ruby/20",    icon: "text-aura-ruby",    glow: "shadow-[0_0_20px_rgba(225,29,72,0.06)]"   },
  };
  const c = colors[color];
  return (
    <div className={`bg-black/30 border ${c.ring} rounded p-5 ${c.glow} flex items-center gap-4`}>
      <div className={`${c.icon} opacity-80`}><Icon className="w-5 h-5" /></div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-aura-platinum/40 font-mono mb-0.5">{label}</div>
        <div className="text-xl font-bold tracking-tight">{value}</div>
        {sub && <div className="text-[10px] text-aura-platinum/30 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function AddAdvertiserModal({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await apiFetch("/api/v1/advertisers", {
        method: "POST",
        body: JSON.stringify({ name, description: desc || undefined }),
      });
      if (res.ok) { onDone(); }
      else { const d = await res.json(); setErr(d.message || "Failed"); }
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0C0C0D] border border-glass-border rounded-lg p-8 w-full max-w-md shadow-2xl">
        <div className="text-xs uppercase tracking-widest font-mono text-aura-gold mb-6">New Advertiser</div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-aura-platinum/40 block mb-1.5">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required minLength={2}
              className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-sm text-aura-platinum focus:outline-none focus:border-aura-gold/50 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-aura-platinum/40 block mb-1.5">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-sm text-aura-platinum focus:outline-none focus:border-aura-gold/50 transition-colors" />
          </div>
          {err && <div className="text-xs text-aura-ruby">{err}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded border border-white/10 text-sm text-aura-platinum/50 hover:border-white/20 hover:text-aura-platinum transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded bg-aura-gold/10 border border-aura-gold/30 text-sm text-aura-gold hover:bg-aura-gold/20 transition-colors disabled:opacity-50">
              {loading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function AddCodeModal({ advertiserId, onDone, onClose }: { advertiserId: string; onDone: () => void; onClose: () => void }) {
  const [code, setCode] = useState("");
  const [campaign, setCampaign] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await apiFetch(`/api/v1/advertisers/${advertiserId}/codes`, {
        method: "POST",
        body: JSON.stringify({ code, campaignName: campaign || undefined }),
      });
      if (res.ok) { onDone(); }
      else { const d = await res.json(); setErr(d.message || "Failed"); }
    } catch { setErr("Network error"); }
    finally { setLoading(false); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#0C0C0D] border border-glass-border rounded-lg p-8 w-full max-w-md shadow-2xl">
        <div className="text-xs uppercase tracking-widest font-mono text-aura-gold mb-6">New Referral Code</div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-aura-platinum/40 block mb-1.5">Code *</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} required minLength={3}
              className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-sm font-mono text-aura-gold focus:outline-none focus:border-aura-gold/50 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-aura-platinum/40 block mb-1.5">Campaign Name</label>
            <input value={campaign} onChange={e => setCampaign(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded px-4 py-2.5 text-sm text-aura-platinum focus:outline-none focus:border-aura-gold/50 transition-colors" />
          </div>
          {err && <div className="text-xs text-aura-ruby">{err}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded border border-white/10 text-sm text-aura-platinum/50 hover:border-white/20 hover:text-aura-platinum transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded bg-aura-gold/10 border border-aura-gold/30 text-sm text-aura-gold hover:bg-aura-gold/20 transition-colors disabled:opacity-50">
              {loading ? "Creating…" : "Create Code"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

interface AdvertiserRowProps { adv: Advertiser; onExpand: () => void; isExpanded: boolean; }

const AdvertiserRow: React.FC<AdvertiserRowProps> = ({ adv, onExpand, isExpanded }) => {
  const [stats, setStats] = useState<AdvertiserStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await apiFetch(`/api/v1/advertisers/${adv.id}/stats`);
      if (res.ok) { const d = await res.json(); setStats(d.data); }
    } finally { setStatsLoading(false); }
  }, [adv.id]);

  useEffect(() => {
    if (isExpanded) loadStats();
  }, [isExpanded, loadStats]);

  return (
    <>
      <AnimatePresence>
        {showCodeModal && (
          <AddCodeModal
            advertiserId={adv.id}
            onClose={() => setShowCodeModal(false)}
            onDone={() => { setShowCodeModal(false); loadStats(); }}
          />
        )}
      </AnimatePresence>

      <div className="bg-black/20 border border-white/5 rounded-lg overflow-hidden">
        <button
          onClick={onExpand}
          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors text-left"
        >
          <div className={`w-2 h-2 rounded-full shrink-0 ${adv.isActive ? "bg-aura-emerald shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-aura-platinum/20"}`} />
          <Megaphone className="w-4 h-4 text-aura-gold/60 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">{adv.name}</div>
            {adv.description && <div className="text-[11px] text-aura-platinum/40 truncate mt-0.5">{adv.description}</div>}
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] text-aura-platinum/30 uppercase tracking-widest">Codes</div>
              <div className="text-sm font-mono text-aura-gold">{adv.codes.length}</div>
            </div>
            <div className="text-[10px] text-aura-platinum/30 uppercase tracking-widest hidden md:block">
              {new Date(adv.createdAt).toLocaleDateString()}
            </div>
            <ChevronRight className={`w-4 h-4 text-aura-platinum/30 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="p-6 space-y-6">
                {statsLoading ? (
                  <div className="flex items-center gap-2 text-aura-platinum/30 text-xs">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Loading…
                  </div>
                ) : stats && (
                  <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <StatCard icon={Users}       label="Registrations" value={stats.clients ?? stats.leads ?? stats.totalRegistrations ?? 0} color="blue" />
                      <StatCard icon={Hash}         label="Deposits"      value={stats.totalDeposits ?? 0}      color="emerald" />
                      <StatCard icon={DollarSign}   label="Volume"        value={`$${(stats.totalVolume ?? stats.depositVolume ?? 0).toLocaleString()}`} color="gold" />
                      <StatCard icon={Activity}     label="Active Traders" value={stats.activeTraders ?? 0}     color="ruby" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] uppercase tracking-widest font-mono text-aura-platinum/40 flex items-center gap-2">
                          <Tag className="w-3 h-3" /> Referral Codes
                        </div>
                        <button
                          onClick={() => setShowCodeModal(true)}
                          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono text-aura-gold/60 hover:text-aura-gold transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Add Code
                        </button>
                      </div>
                      <div className="space-y-2">
                        {stats.codes.length === 0 ? (
                          <div className="text-xs text-aura-platinum/30 italic">No referral codes yet</div>
                        ) : stats.codes.map(code => (
                          <div key={code.id} className="flex items-center gap-3 bg-black/30 rounded px-4 py-2.5 border border-white/5">
                            <Hash className="w-3 h-3 text-aura-platinum/30 shrink-0" />
                            <span className="font-mono text-sm text-aura-gold">{code.code}</span>
                            {code.campaignName && (
                              <span className="text-[10px] text-aura-platinum/40 bg-white/5 px-2 py-0.5 rounded">{code.campaignName}</span>
                            )}
                            <span className="ml-auto text-[10px] text-aura-platinum/20">{new Date(code.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export function Advertisers() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await apiFetch("/api/v1/advertisers");
      if (res.ok) { const d = await res.json(); setAdvertisers(d.data); }
      else setError("Failed to load advertisers");
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalCodes = advertisers.reduce((s, a) => s + a.codes.length, 0);
  const activeCount = advertisers.filter(a => a.isActive).length;

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {showNewModal && (
          <AddAdvertiserModal
            onClose={() => setShowNewModal(false)}
            onDone={() => { setShowNewModal(false); load(); }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-light italic">Advertiser Intelligence</h2>
          <p className="text-xs text-aura-platinum/40 mt-1 uppercase tracking-widest font-mono">Traffic Attribution · Phase 5B</p>
        </div>
        <button
          id="advertiser-create-btn"
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded bg-aura-gold/10 border border-aura-gold/30 text-sm text-aura-gold hover:bg-aura-gold/20 transition-all duration-200 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] shrink-0"
        >
          <Plus className="w-4 h-4" /> New Advertiser
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Megaphone} label="Advertisers"       value={advertisers.length} color="gold" />
        <StatCard icon={CheckCircle2} label="Active"         value={activeCount}         color="emerald" />
        <StatCard icon={Tag}        label="Referral Codes"   value={totalCodes}          color="blue" />
        <StatCard icon={Layers}     label="Scope"            value="5B/5C"               sub="MVP Dashboard" color="ruby" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-aura-platinum/30">
          <RefreshCw className="w-5 h-5 animate-spin mr-3" />
          <span className="text-sm uppercase tracking-widest font-mono">Loading…</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 bg-aura-ruby/10 border border-aura-ruby/20 rounded p-4 text-sm text-aura-ruby">
          <XCircle className="w-4 h-4 shrink-0" /> {error}
          <button onClick={load} className="ml-auto text-xs underline hover:no-underline">Retry</button>
        </div>
      ) : advertisers.length === 0 ? (
        <div className="text-center py-20 text-aura-platinum/20">
          <Megaphone className="w-10 h-10 mx-auto mb-4 opacity-30" />
          <div className="text-sm uppercase tracking-widest font-mono">No advertisers yet</div>
          <button onClick={() => setShowNewModal(true)}
            className="mt-4 text-xs text-aura-gold/50 hover:text-aura-gold transition-colors underline">
            Create first advertiser
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {advertisers.map(adv => (
            <AdvertiserRow
              key={adv.id}
              adv={adv}
              isExpanded={expandedId === adv.id}
              onExpand={() => setExpandedId(prev => prev === adv.id ? null : adv.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
