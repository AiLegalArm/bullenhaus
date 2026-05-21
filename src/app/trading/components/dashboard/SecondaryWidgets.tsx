import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Clock, Search, Filter } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';
import { useTradingContext } from '../../contexts/TradingContext';

export const Watchlist = () => {
  const { setCurrentPair } = useTradingContext();
  const prices = useTradingStore(s => s.prices);
  const priceChanges = useTradingStore(s => s.priceChanges);

  const defaultSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'EURUSD', 'GBPUSD', 'XAUUSD'];
  
  const items = defaultSymbols.map(sym => {
    // Determine the store key (crypto is lowercase from Binance, forex is whatever ForexStore provides)
    const storeKey = sym.endsWith('USDT') ? sym.toLowerCase() : sym;
    const p = prices[storeKey] || prices[sym]; // fallback just in case
    const c = priceChanges[storeKey] || priceChanges[sym];
    const isCrypto = sym.endsWith('USDT');
    // Format presentation symbol
    const displaySym = isCrypto ? sym.replace('USDT', ' / USDT') : `${sym.substring(0,3)} / ${sym.substring(3)}`;
    
    return {
      id: sym,
      symbol: displaySym,
      price: p != null ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: isCrypto ? 2 : 4 }) : '.',
      change: c != null ? `${c > 0 ? '+' : ''}${c.toFixed(2)}%` : '.',
      trend: c && c >= 0 ? 'up' : 'down'
    };
  });

  return (
    <div className="glass-card p-6 min-w-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-white tracking-wide">Watchlist</h3>
        <div className="flex gap-2">
           <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"><Search size={14}/></button>
           <button className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"><Filter size={14}/></button>
        </div>
      </div>
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest grid grid-cols-12 mb-4 px-2">
         <span className="col-span-6">Symbol</span>
         <span className="col-span-3 text-right">Price</span>
         <span className="col-span-3 text-right">Change</span>
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <motion.div 
            key={item.id}
            onClick={() => setCurrentPair(item.id)}
            whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
            className="grid grid-cols-12 items-center px-2 py-3 rounded-xl cursor-pointer transition-all border border-transparent hover:border-white/5"
          >
            <div className="col-span-6 flex items-center gap-3 min-w-0">
               <div className="w-8 h-8 rounded-lg bg-[#111] border border-white/5 flex items-center justify-center text-xs font-bold text-accent-primary">
                  {item.symbol.charAt(0)}
               </div>
               <span className="text-xs font-bold text-slate-200 truncate">{item.symbol}</span>
            </div>
            <span className="col-span-3 text-right text-xs font-mono text-slate-300 truncate">{item.price}</span>
            <span className={`col-span-3 text-right text-xs font-bold ${item.trend === 'up' ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>
               {item.change}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const MarketMovers = () => {
  const tabs = ['Top Gainers', 'Top Losers', 'Top Volume'];
  const prices = useTradingStore(s => s.prices);
  const priceChanges = useTradingStore(s => s.priceChanges);

  // Compute movers dynamically
  const moversList = Object.entries(priceChanges).map(([symbol, change]) => {
    const isCrypto = symbol.toLowerCase().endsWith('usdt');
    const upperSym = symbol.toUpperCase();
    const displaySym = isCrypto ? upperSym.replace('USDT', ' / USDT') : `${upperSym.substring(0,3)} / ${upperSym.substring(3)}`;
    const currPrice = prices[symbol];
    
    return {
      symbol: displaySym,
      rawSymbol: symbol,
      priceStr: currPrice != null ? currPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: isCrypto ? 2 : 4 }) : '.',
      changeStr: change != null ? `${change > 0 ? '+' : ''}${change.toFixed(2)}%` : '.',
      changeVal: change,
      trend: change >= 0 ? 'up' : 'down'
    };
  }).sort((a, b) => b.changeVal - a.changeVal).slice(0, 4);

  // Fallback if no prices exist yet
  const movers = moversList.length > 0 ? moversList : [
    { rawSymbol: 'SOLUSDT', symbol: 'SOL / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
    { rawSymbol: 'ADAUSDT', symbol: 'ADA / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
    { rawSymbol: 'AVAXUSDT', symbol: 'AVAX / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
    { rawSymbol: 'LINKUSDT', symbol: 'LINK / USDT', priceStr: '.', changeStr: '.', trend: 'up' },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-bold text-white tracking-wide">Market Movers</h3>
         <select className="bg-transparent text-[10px] font-bold text-slate-500 outline-none">
            <option>24h</option>
         </select>
      </div>
      <div className="flex p-1 bg-[#111] rounded-xl mb-6">
         {tabs.map((tab, i) => (
           <button key={tab} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${i === 0 ? 'bg-accent-primary/20 text-accent-primary' : 'text-slate-500 hover:text-white'}`}>
              {tab}
           </button>
         ))}
      </div>
      <div className="space-y-4">
        {movers.map((mover) => (
          <div key={mover.rawSymbol} className="flex items-center justify-between group cursor-pointer p-2 rounded-lg hover:bg-white/5 transition-all">
             <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${mover.trend === 'up' ? 'bg-accent-secondary shadow-neon-emerald' : 'bg-accent-quaternary shadow-neon-rose'} group-hover:scale-150 transition-transform`} />
                <span className="text-xs font-bold text-slate-200 group-hover:text-accent-primary transition-colors">{mover.symbol}</span>
             </div>
             <div className="text-right">
                <p className="text-xs font-bold text-white">{mover.priceStr}</p>
                <p className={`text-[10px] font-bold ${mover.trend === 'up' ? 'text-accent-secondary' : 'text-accent-quaternary'}`}>{mover.changeStr}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const RecentActivity = () => {
  const activities: Array<{ label: string; time: string; value: string; color: string }> = [];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
         <h3 className="text-sm font-bold text-white tracking-wide">Recent Activity</h3>
         <button className="text-[10px] font-bold text-accent-primary hover:underline">View All</button>
      </div>
      <div className="space-y-6">
        {activities.length === 0 ? (
          <div className="text-center text-xs text-slate-500 py-6">No recent account activity.</div>
        ) : activities.map((act, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0">
               <Clock size={14} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-white mb-0.5 truncate">{act.label}</p>
               <p className="text-[10px] font-bold text-slate-500">{act.time}</p>
            </div>
            <span className={`text-[10px] font-bold ${act.color}`}>{act.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
