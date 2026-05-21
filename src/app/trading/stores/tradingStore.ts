import { create } from 'zustand';

export type PositionType = 'Long' | 'Short';
export type OrderType = 'Market' | 'Limit' | 'Stop';
export type MarginType = 'Cross' | 'Isolated';

export interface Position {
  id: string;
  symbol: string;
  type: PositionType;
  entryPrice: number;
  size: number; // in base currency or quote? Let's say base crypto.
  leverage: number;
  marginType: MarginType;
  margin: number;
  liquidationPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  unrealizedPnL: number;
  status: 'open' | 'closed';
}

export interface Order {
  id: string;
  symbol: string;
  type: OrderType;
  positionType: PositionType;
  price: number; // target price for limit/stop
  size: number;
  leverage: number;
  marginType: MarginType;
  stopLoss: number | null;
  takeProfit: number | null;
  status: 'pending' | 'filled' | 'canceled';
}

export interface Wallet {
  balance: number; // in USD
  realizedPnL: number;
  marginUsed: number;
}

interface TradingState {
  wallet: Wallet;
  positions: Position[];
  orders: Order[];
  prices: Record<string, number>;
  priceChanges: Record<string, number>;
  priceOverrides: Record<string, number>;
  
  // Actions
  setPriceOverride: (symbol: string, price: number | null) => void;
  setWallet: (wallet: Partial<Wallet>) => void;
  updatePrice: (symbol: string, price: number, change24h: number) => void;
  openPosition: (pos: Omit<Position, 'id' | 'unrealizedPnL' | 'status'>) => void;
  closePosition: (id: string, closePrice: number) => void;
  updatePositionPnL: (symbol: string, currentPrice: number) => void;
  placeOrder: (order: Omit<Order, 'id' | 'status'>) => void;
  cancelOrder: (id: string) => void;
  checkOrders: () => void; // checks limit/stop orders against current prices
  addBalance: (amount: number) => void;
  setWalletBalance: (amount: number) => void;
}

export const useTradingStore = create<TradingState>((set, get) => ({
  wallet: {
    balance: 0, // starting balance
    realizedPnL: 0,
    marginUsed: 0,
  },
  positions: [],
  orders: [],
  prices: {},
  priceChanges: {},
  priceOverrides: {},

  setWallet: (wallet) => {
    set((state) => ({
      wallet: {
        ...state.wallet,
        ...wallet,
      },
    }));
  },

  setPriceOverride: (symbol, price) => {
    set((state) => {
      const overrides = { ...state.priceOverrides };
      if (price === null) {
        delete overrides[symbol];
      } else {
        overrides[symbol] = price;
      }
      return { priceOverrides: overrides };
    });
  },

  updatePrice: (symbol, price, change) => {
    set((state) => {
      const actualPrice = state.priceOverrides[symbol] !== undefined ? state.priceOverrides[symbol] : price;
      const newPrices = { ...state.prices, [symbol]: actualPrice };
      const newChanges = { ...state.priceChanges, [symbol]: change };
      
      return { prices: newPrices, priceChanges: newChanges };
    });
    // Triggers side effects like PnL update or liqudation checks
    const finalPrice = get().prices[symbol];
    get().updatePositionPnL(symbol, finalPrice);
    get().checkOrders();
  },

  openPosition: (posData) => {
    set((state) => {
      // Basic check if enough balance
      if (state.wallet.balance - state.wallet.marginUsed < posData.margin) {
        return state; // In real app, throw error
      }
      
      const newPos: Position = {
        ...posData,
        id: crypto.randomUUID(),
        unrealizedPnL: 0,
        status: 'open',
      };
      
      return {
        positions: [...state.positions, newPos],
        wallet: {
          ...state.wallet,
          marginUsed: state.wallet.marginUsed + posData.margin,
        }
      };
    });
  },

  closePosition: (id, closePrice) => {
    set((state) => {
      const pos = state.positions.find(p => p.id === id);
      if (!pos || pos.status === 'closed') return state;

      const pnl = pos.type === 'Long' 
        ? (closePrice - pos.entryPrice) * pos.size
        : (pos.entryPrice - closePrice) * pos.size;

      return {
        positions: state.positions.map(p => 
          p.id === id ? { ...p, status: 'closed', unrealizedPnL: pnl } : p
        ),
        wallet: {
          ...state.wallet,
          balance: state.wallet.balance + pnl,
          realizedPnL: state.wallet.realizedPnL + pnl,
          marginUsed: state.wallet.marginUsed - pos.margin,
        }
      };
    });
  },

  updatePositionPnL: (symbol, currentPrice) => {
    set((state) => {
      let marginFreed = 0;
      let balanceChange = 0;
      let realizedPnLChange = 0;

      const updatedPositions = state.positions.map(pos => {
        if (pos.symbol !== symbol || pos.status !== 'open') return pos;

        const pnl = pos.type === 'Long' 
          ? (currentPrice - pos.entryPrice) * pos.size
          : (pos.entryPrice - currentPrice) * pos.size;

        // Liquidation check
        let isLiquidated = false;
        if (pos.type === 'Long' && currentPrice <= pos.liquidationPrice) isLiquidated = true;
        if (pos.type === 'Short' && currentPrice >= pos.liquidationPrice) isLiquidated = true;

        // SL / TP check
        if (pos.stopLoss && pos.type === 'Long' && currentPrice <= pos.stopLoss) isLiquidated = true;
        if (pos.stopLoss && pos.type === 'Short' && currentPrice >= pos.stopLoss) isLiquidated = true;
        if (pos.takeProfit && pos.type === 'Long' && currentPrice >= pos.takeProfit) isLiquidated = true;
        if (pos.takeProfit && pos.type === 'Short' && currentPrice <= pos.takeProfit) isLiquidated = true;

        if (isLiquidated) {
           marginFreed += pos.margin;
           balanceChange += pnl;
           realizedPnLChange += pnl;
           return { ...pos, unrealizedPnL: pnl, status: 'closed' as const };
        }

        return { ...pos, unrealizedPnL: pnl };
      });

      if (marginFreed > 0 || balanceChange !== 0) {
        return {
          positions: updatedPositions,
          wallet: {
            ...state.wallet,
            balance: state.wallet.balance + balanceChange,
            realizedPnL: state.wallet.realizedPnL + realizedPnLChange,
            marginUsed: state.wallet.marginUsed - marginFreed,
          }
        }
      }

      return { positions: updatedPositions };
    });
  },

  placeOrder: (orderData) => {
    set((state) => ({
      orders: [...state.orders, { ...orderData, id: crypto.randomUUID(), status: 'pending' }]
    }));
  },

  cancelOrder: (id) => {
    set((state) => ({
      orders: state.orders.map(o => o.id === id ? { ...o, status: 'canceled' } : o)
    }));
  },

  checkOrders: () => {
    set((state) => {
      let ordersChanged = false;
      let positionsChanged = false;
      const newOrders = [...state.orders];
      const newPositions = [...state.positions];
      let newMarginUsed = state.wallet.marginUsed;

      for (let i = 0; i < newOrders.length; i++) {
        const order = newOrders[i];
        if (order.status !== 'pending') continue;

        const currentPrice = state.prices[order.symbol];
        if (!currentPrice) continue;

        let shouldExecute = false;
        if (order.type === 'Limit') {
          if (order.positionType === 'Long' && currentPrice <= order.price) shouldExecute = true;
          if (order.positionType === 'Short' && currentPrice >= order.price) shouldExecute = true;
        } else if (order.type === 'Stop') {
          if (order.positionType === 'Long' && currentPrice >= order.price) shouldExecute = true;
          if (order.positionType === 'Short' && currentPrice <= order.price) shouldExecute = true;
        }

        if (shouldExecute) {
          const marginRequired = (order.size * currentPrice) / order.leverage;
          if (state.wallet.balance - newMarginUsed >= marginRequired) {
             order.status = 'filled';
             ordersChanged = true;
             positionsChanged = true;
             newMarginUsed += marginRequired;

             // Calculate liquidation price simplified
             const isLong = order.positionType === 'Long';
             const liqPrice = isLong 
               ? order.price * (1 - 1/order.leverage + 0.005) // maintenance margin simplified
               : order.price * (1 + 1/order.leverage - 0.005);

             newPositions.push({
               id: crypto.randomUUID(),
               symbol: order.symbol,
               type: order.positionType,
               entryPrice: order.price, // executed at order price for logic
               size: order.size,
               leverage: order.leverage,
               marginType: order.marginType,
               margin: marginRequired,
               liquidationPrice: liqPrice,
               stopLoss: order.stopLoss,
               takeProfit: order.takeProfit,
               unrealizedPnL: 0,
               status: 'open'
             });
          }
        }
      }

      if (ordersChanged || positionsChanged) {
        return {
          orders: newOrders,
          positions: newPositions,
          wallet: { ...state.wallet, marginUsed: newMarginUsed }
        };
      }
      return state;
    });
  },

  addBalance: (amount) => {
    set((state) => ({
      wallet: {
        ...state.wallet,
        balance: state.wallet.balance + amount
      }
    }));
  },
  
  setWalletBalance: (amount) => {
    set((state) => ({
      wallet: {
        ...state.wallet,
        balance: amount
      }
    }));
  }
}));
