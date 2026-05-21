import { MarginService } from './marginService';
import type { AccountBalance, EngineState, Leverage, MarginType, Position, PositionSide, SymbolConfig } from './types';

const makeId = () => crypto.randomUUID();

export class PositionService {
  constructor(private state: EngineState, private margin: MarginService) {}

  getOpenPositions(userId: string, symbol?: string) {
    return this.state.positions.filter((position) => (
      position.userId === userId &&
      position.status === 'OPEN' &&
      (!symbol || position.symbol === symbol)
    ));
  }

  openPosition(params: {
    userId: string;
    symbol: SymbolConfig;
    side: PositionSide;
    entryPrice: number;
    quantity: number;
    leverage: Leverage;
    marginType: MarginType;
    balance: AccountBalance;
    fee: number;
  }) {
    const notional = this.margin.notional(params.entryPrice, params.quantity);
    const initialMargin = this.margin.initialMargin(notional, params.leverage);
    const maintenanceMargin = this.margin.maintenanceMargin(notional, params.symbol.maintenanceMarginRate);
    const now = new Date().toISOString();
    const position: Position = {
      id: makeId(),
      userId: params.userId,
      symbol: params.symbol.symbol,
      side: params.side,
      entryPrice: params.entryPrice,
      quantity: params.quantity,
      leverage: params.leverage,
      marginType: params.marginType,
      initialMargin,
      maintenanceMargin,
      liquidationPrice: 0,
      unrealizedPnl: 0,
      realizedPnl: 0,
      fees: params.fee,
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };
    position.liquidationPrice = params.marginType === 'CROSS'
      ? this.margin.crossLiquidationPrice(position, params.balance, params.symbol)
      : this.margin.isolatedLiquidationPrice(position, params.symbol);
    this.state.positions.push(position);
    return position;
  }

  updateMarkPrice(position: Position, markPrice: number, symbol: SymbolConfig, balance: AccountBalance) {
    position.unrealizedPnl = this.margin.unrealizedPnl(position.side, position.entryPrice, markPrice, position.quantity);
    position.maintenanceMargin = this.margin.maintenanceMargin(markPrice * position.quantity, symbol.maintenanceMarginRate);
    position.liquidationPrice = position.marginType === 'CROSS'
      ? this.margin.crossLiquidationPrice(position, balance, symbol)
      : this.margin.isolatedLiquidationPrice(position, symbol);
    position.updatedAt = new Date().toISOString();
    return position;
  }

  closePosition(position: Position, closePrice: number, quantity: number, fee: number) {
    if (quantity <= 0 || quantity > position.quantity) throw new Error('Invalid close quantity');
    const realizedPnl = this.margin.unrealizedPnl(position.side, position.entryPrice, closePrice, quantity) - fee;
    position.realizedPnl += realizedPnl;
    position.fees += fee;
    position.quantity -= quantity;
    if (position.quantity <= 1e-10) {
      position.quantity = 0;
      position.status = 'CLOSED';
      position.unrealizedPnl = 0;
    }
    position.updatedAt = new Date().toISOString();
    return realizedPnl;
  }

  addIsolatedMargin(position: Position, amount: number) {
    if (position.marginType !== 'ISOLATED') throw new Error('Can only add margin to isolated positions');
    if (amount <= 0) throw new Error('Margin amount must be positive');
    position.initialMargin += amount;
    position.updatedAt = new Date().toISOString();
    return position;
  }

  changeLeverage(position: Position, leverage: Leverage, symbol: SymbolConfig, balance: AccountBalance) {
    this.margin.validateLeverage(leverage, symbol);
    const notional = position.entryPrice * position.quantity;
    const nextInitialMargin = this.margin.initialMargin(notional, leverage);
    if (position.marginType === 'ISOLATED' && nextInitialMargin < position.maintenanceMargin) {
      throw new Error('Leverage change would put isolated margin below maintenance requirement');
    }
    if (position.marginType === 'CROSS') {
      const delta = nextInitialMargin - position.initialMargin;
      const available = balance.walletBalance + balance.crossUnrealizedPnl - balance.crossInitialMargin;
      if (delta > available) throw new Error('Insufficient cross margin for leverage change');
    }
    position.leverage = leverage;
    position.initialMargin = nextInitialMargin;
    position.liquidationPrice = position.marginType === 'CROSS'
      ? this.margin.crossLiquidationPrice(position, balance, symbol)
      : this.margin.isolatedLiquidationPrice(position, symbol);
    position.updatedAt = new Date().toISOString();
    return position;
  }

  changeMarginMode(position: Position, marginType: MarginType, symbol: SymbolConfig, balance: AccountBalance) {
    if (position.marginType === marginType) return position;
    const required = position.initialMargin + position.fees;
    if (marginType === 'ISOLATED' && balance.availableBalance < required) {
      throw new Error('Insufficient available balance to switch to isolated margin');
    }
    position.marginType = marginType;
    position.liquidationPrice = marginType === 'CROSS'
      ? this.margin.crossLiquidationPrice(position, balance, symbol)
      : this.margin.isolatedLiquidationPrice(position, symbol);
    position.updatedAt = new Date().toISOString();
    return position;
  }

  removeIsolatedMargin(position: Position, amount: number, symbol: SymbolConfig) {
    if (position.marginType !== 'ISOLATED') throw new Error('Can only remove margin from isolated positions');
    if (amount <= 0) throw new Error('Margin amount must be positive');
    if (position.initialMargin - amount <= position.maintenanceMargin) {
      throw new Error('Cannot remove margin below maintenance requirement');
    }
    position.initialMargin -= amount;
    position.liquidationPrice = this.margin.isolatedLiquidationPrice(position, symbol);
    position.updatedAt = new Date().toISOString();
    return position;
  }
}
