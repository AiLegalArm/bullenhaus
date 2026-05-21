import React, { useState } from 'react';
import { useForexStore, ForexTrend } from '../../stores/forexStore';
import { useTradingStore } from '../../stores/tradingStore';
import { Activity, Play, Pause, Zap, BarChart2, Hash, Edit3 } from 'lucide-react';
import { toast } from 'sonner';

export const MarketControlPanel = () => {
   const { pairs, updatePrice: updateForexPrice, setVolatility, setSpread, setTrend, togglePause, resetMarket } = useForexStore();
   const { priceOverrides, setPriceOverride } = useTradingStore();
   
   const [globalSymbol, setGlobalSymbol] = useState('');
   const [globalPrice, setGlobalPrice] = useState('');

   const handleSetGlobalOverride = () => {
     if (!globalSymbol.trim()) {
       toast.error('Symbol required');
       return;
     }
     if (!globalPrice) {
       setPriceOverride(globalSymbol.trim().toUpperCase(), null);
       toast.success(`Removed override for ${globalSymbol.trim().toUpperCase()}`);
     } else {
       setPriceOverride(globalSymbol.trim().toUpperCase(), parseFloat(globalPrice));
       toast.success(`Override set for ${globalSymbol.trim().toUpperCase()} to ${globalPrice}`);
     }
     setGlobalSymbol('');
     setGlobalPrice('');
   };

   return (
      <div className="col-span-12 glass-card p-6 border-white/5 space-y-8 animate-in fade-in">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Zap size={18} className="text-accent-secondary" /> Global Market Overrides
           </h3>
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1 bg-white/5 rounded border border-white/10">Admin Manipulation Tool</span>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap items-end gap-4">
           <div className="flex-1 min-w-[200px]">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Asset Symbol (e.g. btcusdt)</label>
             <input 
               type="text" 
               value={globalSymbol}
               onChange={(e) => setGlobalSymbol(e.target.value)}
               placeholder="btcusdt"
               className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent-primary uppercase"
             />
           </div>
           <div className="flex-1 min-w-[200px]">
             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Fixed Price (leave empty to remove)</label>
             <input 
               type="number" 
               step="0.0001"
               value={globalPrice}
               onChange={(e) => setGlobalPrice(e.target.value)}
               placeholder="e.g. 150000"
               className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent-primary"
             />
           </div>
           <button 
             onClick={handleSetGlobalOverride}
             className="px-6 py-2 h-[38px] bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary font-bold rounded-lg text-xs transition-colors flex items-center gap-2"
           >
             <Edit3 size={14} /> Apply Override
           </button>
        </div>
        
        {Object.keys(priceOverrides).length > 0 && (
          <div className="flex flex-wrap gap-2">
             {Object.entries(priceOverrides).map(([sym, pr]) => (
                <div key={sym} className="flex items-center gap-2 bg-accent-primary/10 border border-accent-primary/20 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-accent-primary">
                  <span className="uppercase">{sym}</span> = {pr}
                  <button onClick={() => setPriceOverride(sym, null)} className="ml-2 hover:text-white">&times;</button>
                </div>
             ))}
          </div>
        )}

        <hr className="border-white/5" />

        <div className="flex items-center justify-between">
           <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <Zap size={18} className="text-slate-400" /> Forex Volatility Engine
           </h3>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
           {Object.values(pairs).map(pair => (
             <div key={pair.symbol} className={`p-5 rounded-2xl border transition-all ${pair.isPaused ? 'bg-black/40 border-white/5 grayscale' : 'bg-[#111] border-white/10 hover:border-white/20'}`}>
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h4 className="text-xl font-bold text-white tracking-tight mb-1">{pair.symbol.substring(0,3)} / {pair.symbol.substring(3)}</h4>
                      <p className={`text-2xl font-mono font-bold leading-none ${pair.change24h >= 0 ? 'text-accent-secondary drop-shadow-[0_0_8px_rgba(0,230,118,0.3)]' : 'text-accent-quaternary drop-shadow-[0_0_8px_rgba(255,61,0,0.3)]'}`}>
                        {pair.price.toFixed(5)}
                      </p>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                     <div className="flex gap-2">
                       <button 
                         onClick={() => {
                           if(window.confirm("Reset market to default?")) {
                             resetMarket(pair.symbol);
                             toast.success(`${pair.symbol} market reset to default`);
                           }
                         }}
                         className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all shadow-lg text-[10px] font-bold uppercase tracking-widest"
                         title="Reset to default"
                       >
                         Reset
                       </button>
                       <button 
                         onClick={() => {
                           togglePause(pair.symbol);
                           toast.success(`${pair.symbol} market ${pair.isPaused ? 'resumed' : 'paused'}`);
                         }}
                         className={`p-2 rounded-lg text-white transition-all shadow-lg ${pair.isPaused ? 'bg-orange-500 hover:bg-orange-400' : 'bg-slate-700 hover:bg-slate-600'}`}
                         title={pair.isPaused ? 'Resume Market' : 'Pause Market'}
                       >
                         {pair.isPaused ? <Play size={16} /> : <Pause size={16} />}
                       </button>
                     </div>
                   </div>
                </div>

                <div className="space-y-4">
                   {/* Manual Override */}
                   <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-1"><Hash size={12}/> Manual Price Override</label>
                      <div className="flex gap-2">
                         <input 
                           type="number" 
                           step="0.0001"
                           placeholder="Enter new price..."
                           id={`override-${pair.symbol}`}
                           className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-accent-primary"
                         />
                         <button 
                           onClick={() => {
                             const el = document.getElementById(`override-${pair.symbol}`) as HTMLInputElement;
                             if(el && el.value) {
                               updateForexPrice(pair.symbol, parseFloat(el.value));
                               toast.success(`${pair.symbol} price updated to ${el.value}`);
                               el.value = '';
                             } else {
                               toast.error('Please enter a valid price');
                             }
                           }}
                           className="px-4 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 text-accent-primary font-bold rounded-lg text-xs transition-colors"
                         >
                           Set
                         </button>
                      </div>
                   </div>

                   {/* Volatility & Spread */}
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-1"><Activity size={12}/> Volatility</label>
                        <input 
                          type="range" 
                          min="0.0001" 
                          max="0.05" 
                          step="0.0001"
                          value={pair.volatility}
                          onChange={(e) => setVolatility(pair.symbol, parseFloat(e.target.value))}
                          className="w-full accent-white" 
                        />
                        <div className="text-right text-[10px] text-slate-400 font-mono mt-1">{pair.volatility.toFixed(4)}</div>
                      </div>
                      <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block flex items-center gap-1"><BarChart2 size={12}/> Spread</label>
                        <input 
                          type="range" 
                          min="0" 
                          max="0.01" 
                          step="0.0001"
                          value={pair.spread}
                          onChange={(e) => setSpread(pair.symbol, parseFloat(e.target.value))}
                          className="w-full accent-white" 
                        />
                        <div className="text-right text-[10px] text-slate-400 font-mono mt-1">{pair.spread.toFixed(4)}</div>
                      </div>
                   </div>

                   {/* Scenarios / Trends */}
                   <div>
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Market Scenarios</label>
                     <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'bull', label: 'Bull Run', col: 'text-accent-secondary border-accent-secondary/50 hover:bg-accent-secondary/10' },
                          { id: 'bear', label: 'Bear Drop', col: 'text-rose-500 border-rose-500/50 hover:bg-rose-500/10' },
                          { id: 'sideways', label: 'Sideways', col: 'text-slate-400 border-slate-600 hover:bg-white/10' },
                          { id: 'crash', label: 'Flash Crash', col: 'text-orange-500 border-orange-500/50 hover:bg-orange-500/10 font-black tracking-widest animate-pulse' },
                          { id: 'news', label: 'News Spike', col: 'text-accent-primary border-accent-primary/50 hover:bg-accent-primary/10' }
                        ].map(t => (
                          <button 
                            key={t.id}
                            onClick={() => {
                               if (t.id === 'crash') {
                                 if (!window.confirm("Trigger Flash Crash for " + pair.symbol + "?")) return;
                               }
                               setTrend(pair.symbol, t.id as ForexTrend);
                               toast.success(`${pair.symbol} trend set to ${t.label}`);
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                              pair.trend === t.id ? t.col.replace('hover:bg', 'bg').replace('/10', '/30') : `bg-transparent ${t.col}`
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                     </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>
   );
};
