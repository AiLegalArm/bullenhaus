import React, { useState, useEffect } from "react";
import { Search, Filter, MoreVertical, ShieldAlert, Star, Phone, Mail, ChevronRight, LayoutList, CheckCircle2, AlertTriangle, TrendingUp, Sparkles, MessageSquare, ShieldCheck, PlayCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Drawer } from "../components/ui/Drawer";
import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { useClients } from "../hooks/useClients";
import { useI18n } from "../lib/i18n";

const generatedClientEmails = new Set([
  "apembroke@pembroke-holdings.co.uk",
  "evance@vancecap.ch",
]);

const generatedClientCompanies = new Set([
  "Pembroke Global Holdings",
  "Vance Capital Alliance",
]);

const isGeneratedClient = (client: any) => {
  const email = String(client?.email || "").toLowerCase();
  const company = String(client?.company || "");
  return generatedClientEmails.has(email) || generatedClientCompanies.has(company);
};

function ClientDrawer({ client, isOpen, onClose }: { client: any, isOpen: boolean, onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'trading' | 'intelligence' | 'kyc'>('overview');
  const [unmasked, setUnmasked] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab('overview');
      setUnmasked(false);
    }
  }, [isOpen]);

  if (!client) return null;

  const clientName = `${client.firstName} ${client.lastName}`;
  const getAvatarInitials = (first: string, last: string) => `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  const avatarInitials = getAvatarInitials(client.firstName, client.lastName);
  const tier = client.tier || "Silver";
  const balance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(client.totalBalance) || 0);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={clientName}
      subtitle={`${tier} Tier Client`}
    >
      <div className="flex border-b border-glass-border">
         {['overview', 'trading', 'intelligence', 'kyc'].map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab as any)}
             className={`flex-1 overflow-hidden py-3 text-[10px] uppercase tracking-widest font-bold transition-colors border-b-2 ${activeTab === tab ? 'border-aura-gold text-aura-gold' : 'border-transparent text-aura-platinum/50 hover:text-aura-platinum'}`}
           >
             {tab}
           </button>
         ))}
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar">
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="flex items-center gap-4 border-b border-glass-border pb-6">
               <div className="h-16 w-16 rounded border border-white/5 bg-gradient-to-br from-[#121214] to-[#0A0A0B] flex items-center justify-center font-display text-2xl text-aura-gold shadow-inner shrink-0">
                 {avatarInitials}
               </div>
               <div className="w-full flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-medium text-aura-platinum">{clientName}</h3>
                    <div className="text-xs text-aura-platinum/50 mt-1">{client.company}</div>
                    <div className="mt-2 flex gap-4">
                       <span className="text-[10px] font-mono text-aura-platinum/40">ID: {String(client.id).substring(0, 8)}</span>
                    </div>
                  </div>
               </div>
             </div>
             
             <div className="space-y-4">
                <div className="bg-[#121214] border border-glass-border rounded p-4 flex justify-between items-center group cursor-pointer hover:border-aura-gold/30 transition-colors" onClick={() => setUnmasked(!unmasked)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center border border-white/5"><Phone className="w-3.5 h-3.5 text-aura-platinum/60" /></div>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">Primary Phone</div>
                      <div className="font-mono text-sm text-aura-platinum mt-1">{unmasked ? client.phone : client.phone?.replace(/(\d{3})\s?(\d{2})?\s?(\d{2})?/, '*** ** **') || 'N/A'}</div>
                    </div>
                  </div>
                  <span className="text-[9px] text-aura-gold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Toggle</span>
                </div>
                
                <div className="bg-[#121214] border border-glass-border rounded p-4 flex justify-between items-center group cursor-pointer hover:border-aura-gold/30 transition-colors" onClick={() => setUnmasked(!unmasked)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-black/40 flex items-center justify-center border border-white/5"><Mail className="w-3.5 h-3.5 text-aura-platinum/60" /></div>
                    <div>
                      <div className="text-[9px] uppercase tracking-widest text-aura-platinum/40">Secure Email</div>
                      <div className="font-mono text-sm text-aura-platinum mt-1">{unmasked ? client.email : client.email?.replace(/(.{2})(.*)(?=@)/, '$1***')}</div>
                    </div>
                  </div>
                  <span className="text-[9px] text-aura-gold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Toggle</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-black/40 p-4 rounded border border-glass-border">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-aura-platinum/40 mb-1">AUM / Total Balance</div>
                  <div className="text-lg font-mono text-aura-platinum">{balance}</div>
                </div>
                <div className="bg-black/40 p-4 rounded border border-glass-border">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-aura-platinum/40 mb-2">AI Risk Assessment</div>
                  <Badge variant={client.riskScore === 'LOW' ? 'success' : client.riskScore === 'MEDIUM' ? 'warning' : 'danger'}>
                    {client.riskScore} Risk
                  </Badge>
                </div>
             </div>

             <div className="space-y-3 pt-6 border-t border-glass-border">
               <Button variant="primary" className="w-full justify-start py-4">
                  <Phone className="w-4 h-4" /> Start Secure Call
               </Button>
               <Button variant="secondary" className="w-full justify-start py-4">
                  <Mail className="w-4 h-4" /> Draft Encrypted Email
               </Button>
             </div>
          </div>
        )}

        {/* Keeping other tabs static for now or can hydrate them similarly */}
        {activeTab === 'trading' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
             <div className="grid grid-cols-3 gap-4 mb-4">
               <div>
                  <div className="text-[9px] text-aura-platinum/40 uppercase tracking-widest">Equity</div>
                  <div className="font-mono text-aura-platinum text-sm mt-1">{balance}</div>
               </div>
               <div>
                  <div className="text-[9px] text-aura-platinum/40 uppercase tracking-widest">Margin Lvl</div>
                  <div className={`font-mono text-sm mt-1 ${client.riskScore === 'HIGH' ? 'text-aura-ruby' : 'text-aura-emerald'}`}>{client.riskScore === 'HIGH' ? '85.4%' : '3,450%'}</div>
               </div>
               <div>
                  <div className="text-[9px] text-aura-platinum/40 uppercase tracking-widest">Open Pos.</div>
                  <div className="font-mono text-aura-platinum text-sm mt-1">0</div>
               </div>
             </div>
          </div>
        )}
      </div>
    </Drawer>
  )
}

export function VIPClients() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const { clients, loading: isLoading, error } = useClients(1, 100, search);

  const realClients = clients.filter(vip => !isGeneratedClient(vip));

  const filteredVIPs = realClients.filter(vip => {
    const matchesTier = filterTier ? vip.tier === filterTier : true;
    return matchesTier;
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-glass-border pb-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-light italic tracking-tight text-aura-platinum">{t('vipTitle')}</h2>
          <p className="text-[10px] font-bold tracking-[0.2em] text-aura-platinum/40 mt-2 uppercase">{t('vipSubtitle')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-aura-platinum/40" />
            <input 
              type="text" 
              placeholder={t('searchVips')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#121214] border border-glass-border rounded pl-9 pr-4 py-2 flex items-center gap-2 text-xs text-aura-platinum outline-none focus:border-aura-gold/50 transition-colors w-full sm:w-64 focus:shadow-[0_0_15px_rgba(212,175,55,0.1)]"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
            <Button variant={filterTier === null ? "outline" : "secondary"} size="sm" onClick={() => setFilterTier(null)}>{t('all')}</Button>
            <Button variant={filterTier === 'Titanium' ? "outline" : "secondary"} size="sm" onClick={() => setFilterTier('Titanium')}>Titanium</Button>
            <Button variant={filterTier === 'Platinum' ? "outline" : "secondary"} size="sm" onClick={() => setFilterTier('Platinum')}>Platinum</Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-aura-ruby/30 bg-aura-ruby/5 text-aura-ruby text-sm flex items-center gap-2">
           <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* VIP List grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <ClientCardSkeleton key={i} />)}
        </div>
      ) : filteredVIPs.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredVIPs.map((vip) => (
            <ClientCard key={vip.id} client={vip} onViewProfile={() => setSelectedClient(vip)} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-glass-border bg-[#121214] min-h-[40vh] flex items-center justify-center">
          <EmptyState 
            icon={<LayoutList />}
            title={t('noVipTitle')}
            description={t('noVipDescription')}
            action={<Button variant="secondary" onClick={() => { setSearch(""); setFilterTier(null); }}>{t('clearFilters')}</Button>}
          />
        </div>
      )}

      {/* Drawers */}
      <ClientDrawer 
        isOpen={!!selectedClient} 
        onClose={() => setSelectedClient(null)} 
        client={selectedClient} 
      />
    </div>
  );
}

function ClientCardSkeleton() {
  return (
    <div className="rounded-xl border border-glass-border bg-[#121214] p-6 relative">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
        <div className="bg-black/40 px-4 py-3 rounded border border-glass-border">
          <Skeleton className="h-2 w-16 mb-2" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="bg-black/40 px-4 py-3 rounded border border-glass-border">
          <Skeleton className="h-2 w-16 mb-2" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-glass-border pt-4">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
      </div>
    </div>
  )
}

function ClientCard({ client, onViewProfile }: any) {
  const clientName = `${client.firstName} ${client.lastName}`;
  const getAvatarInitials = (first: string, last: string) => `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  const avatarInitials = getAvatarInitials(client.firstName, client.lastName);
  const tier = client.tier || "Silver";
  const balance = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(client.totalBalance) || 0);

  return (
    <div className={`rounded-xl border border-glass-border bg-[#121214] p-6 relative group transition-all duration-300 ${client.riskScore === 'CRITICAL' ? 'border-aura-ruby/30 hover:border-aura-ruby/50' : 'hover:bg-white/5'}`}>
      
      {client.riskScore === 'CRITICAL' && (
        <div className="absolute top-0 right-0 bg-aura-ruby text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl flex items-center gap-1 shadow-[0_0_10px_rgba(251,113,133,0.3)]">
          <ShieldAlert className="w-3 h-3" /> Churn Risk VIP
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 shrink-0 rounded border border-white/5 bg-gradient-to-br from-[#121214] to-[#0A0A0B] flex items-center justify-center font-display text-aura-gold shadow-inner">
            {avatarInitials}
          </div>
          <div>
            <h3 className="text-sm font-medium text-aura-platinum flex items-center gap-2">
              {clientName}
              {tier === 'Titanium' && <Star className="w-3 h-3 text-aura-gold fill-aura-gold" />}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-[9px] uppercase tracking-wider">
               <span className="text-aura-gold-light">{tier}</span>
               <span className="text-aura-platinum/30">•</span>
               <span className="text-aura-platinum/50">{new Date(client.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-white/5 rounded transition-colors text-aura-platinum/50 hover:text-aura-platinum opacity-0 group-hover:opacity-100">
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
        <div className="bg-black/40 px-4 py-3 rounded border border-glass-border">
          <div className="text-[9px] text-aura-platinum/40 uppercase tracking-[0.2em] mb-1">Total Balance</div>
          <div className="text-lg font-light font-mono text-aura-platinum">{balance}</div>
        </div>
        <div className="bg-black/40 px-4 py-3 rounded border border-glass-border">
          <div className="text-[9px] text-aura-platinum/40 uppercase tracking-[0.2em] mb-2">AI Risk Assessment</div>
          <Badge variant={client.riskScore === 'LOW' ? 'success' : client.riskScore === 'MEDIUM' ? 'warning' : 'danger'}>
            {client.riskScore} Risk
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-glass-border pt-4">
        <Button variant="secondary" className="flex-1 text-[10px]">
           <Phone className="w-3.5 h-3.5" /> Call
        </Button>
        <Button variant="secondary" className="flex-1 text-[10px]">
           <Mail className="w-3.5 h-3.5" /> Email
        </Button>
        <Button variant="outline" className="flex-1 text-[10px]" onClick={onViewProfile}>
           Profile <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
