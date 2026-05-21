import React from 'react';
import { motion } from 'motion/react';
import { Zap, TrendingUp } from 'lucide-react';
import { useTradingStore } from '../../stores/tradingStore';

export const ProTraderCard = () => (
  <div className="relative group overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#1a1a1a] to-[#050505] border border-accent-primary/20 mb-8 holo-border">
    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
       <Zap size={64} className="text-accent-primary" />
    </div>
    <div className="relative z-10">
      <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-tertiary mb-2 uppercase tracking-wide">Elite Trader</h4>
      <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
        Unlock institutional tools, deep liquidity and exclusive rewards.
      </p>
      <button className="w-full py-3 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-[10px] font-bold rounded-lg hover:bg-accent-primary hover:text-black hover:shadow-neon-gold active:scale-95 transition-all uppercase tracking-widest">
        Upgrade Now
      </button>
    </div>
  </div>
);

export const SentimentGauge = () => {
  const priceChanges = useTradingStore(s => s.priceChanges);
  
  let sentiment = 50;
  const changeValues = Object.values(priceChanges);
  const hasLiveChanges = changeValues.length > 0;
  if (changeValues.length > 0) {
    const upCount = changeValues.filter(c => c > 0).length;
    sentiment = Math.round((upCount / changeValues.length) * 100);
    sentiment = Math.max(10, Math.min(90, sentiment));
  }

  const isBullish = sentiment >= 50;
  
  // Convert sentiment percentage to gauge rotation (from 0 to 180 degrees)
  // Let's say: 0% = 0 deg, 100% = 180 deg
  const rotation = Math.round((sentiment / 100) * 180);

  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-white/70">Market Sentiment</span>
      </div>
      <div className="gauge-container mb-2">
        <div className="gauge-arc" />
        <motion.div 
          initial={{ rotate: 45 }}
          animate={{ rotate: rotation }}
          transition={{ duration: 1.5, delay: 0.5 }}
          className="gauge-progress" 
        />
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          <div className="text-center">
             <span className="block text-2xl font-bold text-white">{hasLiveChanges ? `${sentiment}%` : '--'}</span>
             <span className={`text-[10px] font-bold ${isBullish ? 'text-accent-secondary' : 'text-accent-quaternary'} flex items-center gap-1 justify-center`}>
               <TrendingUp size={10} className={!isBullish ? "rotate-180" : ""} /> {hasLiveChanges ? (isBullish ? 'Bullish' : 'Bearish') : 'No live data'}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};
