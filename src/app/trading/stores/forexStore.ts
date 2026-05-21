import { create } from 'zustand';

export type ForexTrend = 'bull' | 'bear' | 'sideways' | 'crash' | 'news';

export interface ForexPairConfig {
  symbol: string;
  price: number;
  basePrice: number;
  change24h: number;
  volatility: number;
  spread: number;
  trend: ForexTrend;
  isPaused: boolean;
}

// Major, Minor, Exotic and Metal pairs
const forexPairList = [
  // Majors
  'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
  // Minors
  'EURGBP', 'EURJPY', 'EURCHF', 'EURAUD', 'EURCAD', 'EURNZD', 
  'GBPJPY', 'GBPCHF', 'GBPAUD', 'GBPCAD', 'GBPNZD', 
  'AUDJPY', 'AUDCHF', 'AUDCAD', 'AUDNZD', 
  'CADJPY', 'CADCHF', 'NZDJPY', 'NZDCHF', 'NZDCAD', 'CHFJPY',
  // Exotics
  'USDTRY', 'USDMXN', 'USDZAR', 'USDSEK', 'USDNOK', 'USDDKK', 'USDPLN', 'USDCNH', 
  'EURTRY', 'EURSEK', 'EURNOK', 'GBPTRY', 'GBPZAR', 'AUDSGD', 'SGDJPY',
  // Metals
  'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD'
];

const defaultPairs: Record<string, ForexPairConfig> = {};
forexPairList.forEach(symbol => {
  let price = 1.0;
  let volatility = 0.0001;
  let spread = 0.0001;
  
  if (symbol.includes('JPY')) {
    price = 150.0;
    volatility = 0.01;
    spread = 0.01;
  } else if (symbol === 'XAUUSD') {
    price = 2300.0;
    volatility = 0.5;
    spread = 0.2;
  } else if (symbol === 'XAGUSD') {
    price = 28.0;
    volatility = 0.05;
    spread = 0.02;
  } else if (symbol === 'XPTUSD') {
    price = 950.0;
    volatility = 0.5;
    spread = 0.2;
  } else if (symbol === 'XPDUSD') {
    price = 1050.0;
    volatility = 0.5;
    spread = 0.2;
  } else if (symbol.includes('TRY') || symbol.includes('MXN') || symbol.includes('ZAR') || symbol.includes('SEK') || symbol.includes('NOK') || symbol.includes('DKK') || symbol.includes('PLN') || symbol.includes('CNH')) {
    price = 15.0; // dummy price for exotics
    volatility = 0.01;
    spread = 0.005;
  }

  defaultPairs[symbol] = {
    symbol,
    price,
    basePrice: price,
    change24h: 0,
    volatility,
    spread,
    trend: 'sideways',
    isPaused: false
  };
});

interface ForexState {
  pairs: Record<string, ForexPairConfig>;
  globalVolatilityMultiplier: number;
  
  // Admin Actions
  updatePrice: (symbol: string, newPrice: number) => void;
  setVolatility: (symbol: string, vol: number) => void;
  setSpread: (symbol: string, spread: number) => void;
  setTrend: (symbol: string, trend: ForexTrend) => void;
  togglePause: (symbol: string) => void;
  resetMarket: (symbol: string) => void;
  tickSimulation: () => void;
}

export const useForexStore = create<ForexState>((set, get) => ({
  pairs: defaultPairs,
  globalVolatilityMultiplier: 1.0,

  updatePrice: (symbol, newPrice) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...state.pairs[symbol], price: newPrice } }
  })),

  setVolatility: (symbol, volatility) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...state.pairs[symbol], volatility } }
  })),

  setSpread: (symbol, spread) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...state.pairs[symbol], spread } }
  })),

  setTrend: (symbol, trend) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...state.pairs[symbol], trend } }
  })),

  togglePause: (symbol) => set(state => ({
    pairs: { ...state.pairs, [symbol]: { ...state.pairs[symbol], isPaused: !state.pairs[symbol].isPaused } }
  })),

  resetMarket: (symbol) => set(state => ({
    pairs: { 
      ...state.pairs, 
      [symbol]: { ...defaultPairs[symbol] } 
    }
  })),

  tickSimulation: () => set(state => {
    const newPairs = { ...state.pairs };
    let changed = false;

    Object.keys(newPairs).forEach(sym => {
      const p = newPairs[sym];
      if (p.isPaused) return;

      let move = (Math.random() - 0.5) * p.volatility * state.globalVolatilityMultiplier;
      
      if (p.trend === 'bull') {
        move += (Math.random() * p.volatility * 0.5);
      } else if (p.trend === 'bear') {
        move -= (Math.random() * p.volatility * 0.5);
      } else if (p.trend === 'crash') {
        move -= (Math.random() * p.volatility * 5); // Huge drop
      } else if (p.trend === 'news') {
        move += (Math.random() - 0.5) * p.volatility * 10; // Huge swings both ways
      }

      const newPrice = p.price + move;
      const change24h = ((newPrice - p.basePrice) / p.basePrice) * 100;
      
      if (newPrice !== p.price) {
        newPairs[sym] = { ...p, price: newPrice, change24h };
        changed = true;
      }
    });

    if (changed) {
       return { pairs: newPairs };
    }
    return state;
  })
}));
