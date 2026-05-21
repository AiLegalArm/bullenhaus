import React from 'react';
import { MarketControlPanel } from './MarketControlPanel';

export const AdminMarketControl = () => {
  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white uppercase tracking-wider">Market Control</h2>
        <p className="text-sm text-slate-500">Override market trends, volatility, and spreads for simulation pairs.</p>
      </div>
      <MarketControlPanel />
    </div>
  );
};
