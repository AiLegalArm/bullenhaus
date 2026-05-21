import React, { useEffect, useState } from 'react';
import { useTradingStore } from '../../stores/tradingStore';
import { crmService } from '../../services/crmService';
import { supabase } from '../../lib/supabase';

export const OpenPositionsTable = () => {
  const positions = useTradingStore(s => s.positions.filter(p => p.status === 'open'));
  const closePosition = useTradingStore(s => s.closePosition);
  const prices = useTradingStore(s => s.prices);

  const setPositions = useTradingStore(s => s.closePosition);
  
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleClose = async (pos: any, currentPrice: number) => {
    closePosition(pos.id, currentPrice);

    if (user) {
      try {
        await crmService.activity({
          external_trader_id: user.id,
          external_trade_id: pos.id,
          symbol: pos.symbol,
          side: pos.type === 'Long' ? 'buy' : 'sell',
          volume: pos.size,
          open_price: pos.entryPrice,
          close_price: currentPrice,
          pnl: pos.unrealizedPnL,
          closed_at: new Date().toISOString()
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (positions.length === 0) {
     return <div className="p-4 text-center text-slate-500 text-sm">No open positions</div>;
  }

  return (
    <table className="w-full">
      <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">
        <tr>
          <th className="text-left pb-4">Market</th>
          <th className="text-left pb-4">Size/Lev</th>
          <th className="text-left pb-4">Entry / Mark</th>
          <th className="text-right pb-4">Unrealized P&L</th>
          <th className="text-right pb-4">Actions</th>
        </tr>
      </thead>
      <tbody className="text-sm">
        {positions.map((pos) => {
          const currentPrice = prices[pos.symbol] || pos.entryPrice;
          const pnlPct = (pos.unrealizedPnL / pos.margin) * 100;
          const isPositive = pos.unrealizedPnL >= 0;
          
          return (
            <tr key={pos.id} className="group hover:bg-white/5 transition-all duration-200">
              <td className="py-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center font-bold text-white text-[10px]">
                        {pos.symbol.substring(0, 3)}
                    </div>
                    <div>
                      <p className="font-bold text-white text-xs leading-none mb-1 group-hover:text-accent-primary transition-colors">{pos.symbol}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{pos.marginType}</p>
                    </div>
                </div>
              </td>
              <td className="py-4">
                <div className="text-xs font-bold transition-all flex flex-col">
                    <div>
                        <span className={`${pos.type === 'Long' ? 'text-accent-secondary' : 'text-accent-quaternary'} mr-2`}>{pos.type}</span>
                        <span className="text-slate-300">{pos.size}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{pos.leverage}x</span>
                </div>
              </td>
              <td className="py-4">
                <div className="flex flex-col">
                    <p className="text-xs font-mono font-bold text-slate-400">{pos.entryPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                    <p className="text-[10px] font-mono text-slate-500">{currentPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}</p>
                </div>
              </td>
              <td className="py-4 text-right">
                <div className="flex flex-col items-end">
                    <span className={`text-xs font-bold ${isPositive ? 'text-accent-secondary drop-shadow-[0_0_5px_rgba(0,230,118,0.3)]' : 'text-accent-quaternary drop-shadow-[0_0_5px_rgba(255,61,0,0.3)]'}`}>
                       {isPositive ? '+' : ''}{pos.unrealizedPnL.toFixed(2)} USDT
                    </span>
                    <span className={`text-[10px] font-bold ${isPositive ? 'text-accent-secondary/60' : 'text-accent-quaternary/60'}`}>
                       {isPositive ? '+' : ''}{pnlPct.toFixed(2)}%
                    </span>
                </div>
              </td>
              <td className="py-4 text-right">
                <button 
                  onClick={() => handleClose(pos, currentPrice)}
                  className="px-3 py-1.5 bg-white/5 hover:bg-accent-quaternary hover:text-white border border-white/10 rounded text-[10px] font-bold text-slate-400 transition-colors"
                >
                  Close
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
