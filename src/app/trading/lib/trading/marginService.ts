import { ALLOWED_LEVERAGE, type AccountBalance, type Leverage, type MarginType, type Position, type PositionSide, type SymbolConfig } from './types';

export class MarginService {
  validateLeverage(leverage: number, symbol: SymbolConfig): asserts leverage is Leverage {
    if (!ALLOWED_LEVERAGE.includes(leverage as Leverage)) {
      throw new Error(`Invalid leverage ${leverage}. Allowed: ${ALLOWED_LEVERAGE.join(', ')}`);
    }
    if (leverage > symbol.maxLeverage) {
      throw new Error(`Leverage ${leverage}x exceeds ${symbol.symbol} max leverage ${symbol.maxLeverage}x`);
    }
  }

  notional(price: number, quantity: number) {
    if (price <= 0 || quantity <= 0) throw new Error('Price and quantity must be positive');
    return price * quantity;
  }

  initialMargin(notional: number, leverage: Leverage) {
    return notional / leverage;
  }

  maintenanceMargin(notional: number, maintenanceMarginRate: number) {
    return notional * maintenanceMarginRate;
  }

  fee(notional: number, feeRate: number) {
    return notional * feeRate;
  }

  validateQuantity(quantity: number, price: number, symbol: SymbolConfig) {
    if (quantity < symbol.minQuantity) throw new Error(`Quantity below minimum ${symbol.minQuantity}`);
    const steps = Math.round(quantity / symbol.quantityStep);
    if (Math.abs(steps * symbol.quantityStep - quantity) > 1e-10) {
      throw new Error(`Quantity must match step ${symbol.quantityStep}`);
    }
    if (this.notional(price, quantity) < symbol.minNotional) {
      throw new Error(`Notional below minimum ${symbol.minNotional}`);
    }
  }

  requiredOpeningCost(price: number, quantity: number, leverage: Leverage, symbol: SymbolConfig, liquidity: 'MAKER' | 'TAKER' = 'TAKER') {
    const notional = this.notional(price, quantity);
    const feeRate = liquidity === 'MAKER' ? symbol.makerFeeRate : symbol.takerFeeRate;
    return this.initialMargin(notional, leverage) + this.fee(notional, feeRate);
  }

  validateMargin(balance: AccountBalance, price: number, quantity: number, leverage: Leverage, marginType: MarginType, symbol: SymbolConfig) {
    const required = this.requiredOpeningCost(price, quantity, leverage, symbol);
    const available = marginType === 'CROSS'
      ? balance.walletBalance + balance.crossUnrealizedPnl - balance.crossInitialMargin
      : balance.availableBalance;
    if (available < required) {
      throw new Error(`Insufficient margin. Required ${required.toFixed(8)}, available ${available.toFixed(8)}`);
    }
    return required;
  }

  unrealizedPnl(side: PositionSide, entryPrice: number, markPrice: number, quantity: number) {
    return side === 'LONG'
      ? (markPrice - entryPrice) * quantity
      : (entryPrice - markPrice) * quantity;
  }

  accountEquity(balance: AccountBalance) {
    return Math.max(0, balance.walletBalance + balance.crossUnrealizedPnl);
  }

  isolatedLiquidationPrice(position: Position, symbol: SymbolConfig) {
    const maintenance = position.entryPrice * position.quantity * symbol.maintenanceMarginRate;
    const lossCapacity = Math.max(0, position.initialMargin - maintenance - position.fees);
    const distance = lossCapacity / position.quantity;
    return position.side === 'LONG'
      ? Math.max(0, position.entryPrice - distance)
      : position.entryPrice + distance;
  }

  crossLiquidationPrice(position: Position, balance: AccountBalance, symbol: SymbolConfig) {
    const equityBeforePositionMove = this.accountEquity(balance) - position.unrealizedPnl;
    const maintenance = position.entryPrice * position.quantity * symbol.maintenanceMarginRate;
    if (position.side === 'LONG') {
      return Math.max(0, position.entryPrice + (maintenance - equityBeforePositionMove) / position.quantity);
    }
    return position.entryPrice + (equityBeforePositionMove - maintenance) / position.quantity;
  }
}
