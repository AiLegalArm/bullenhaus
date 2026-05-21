import { AuditLogService } from './auditLogService';
import { MarginService } from './marginService';
import { NotificationService } from './notificationService';
import { PositionService } from './positionService';
import type { AccountBalance, EngineState, Position, SymbolConfig } from './types';

export class LiquidationService {
  constructor(
    private state: EngineState,
    private margin: MarginService,
    private positions: PositionService,
    private audit: AuditLogService,
    private notifications: NotificationService,
  ) {}

  checkUser(userId: string, markPrices: Record<string, number>, symbols: Record<string, SymbolConfig>) {
    const balance = this.state.balances[userId];
    if (!balance) throw new Error('Balance not found');
    const liquidated: Position[] = [];

    for (const position of this.positions.getOpenPositions(userId)) {
      const symbol = symbols[position.symbol];
      const markPrice = markPrices[position.symbol];
      if (!symbol || !markPrice) continue;
      this.positions.updateMarkPrice(position, markPrice, symbol, balance);

      if (this.shouldLiquidate(position, balance, markPrice)) {
        this.liquidate(position, balance, markPrice, symbol);
        liquidated.push(position);
      } else if (this.isWarning(position, markPrice)) {
        this.notifications.emit({
          userId,
          type: 'LIQUIDATION_WARNING',
          message: 'Position is approaching liquidation',
          payload: { positionId: position.id, symbol: position.symbol, markPrice, liquidationPrice: position.liquidationPrice },
        });
      }
    }

    balance.crossUnrealizedPnl = this.positions.getOpenPositions(userId)
      .filter((position) => position.marginType === 'CROSS')
      .reduce((sum, position) => sum + position.unrealizedPnl, 0);
    balance.crossInitialMargin = this.positions.getOpenPositions(userId)
      .filter((position) => position.marginType === 'CROSS')
      .reduce((sum, position) => sum + position.initialMargin, 0);
    balance.crossMaintenanceMargin = this.positions.getOpenPositions(userId)
      .filter((position) => position.marginType === 'CROSS')
      .reduce((sum, position) => sum + position.maintenanceMargin, 0);

    return liquidated;
  }

  shouldLiquidate(position: Position, balance: AccountBalance, markPrice: number) {
    if (position.marginType === 'ISOLATED') {
      return position.side === 'LONG' ? markPrice <= position.liquidationPrice : markPrice >= position.liquidationPrice;
    }
    const equity = this.margin.accountEquity(balance);
    return equity <= balance.crossMaintenanceMargin;
  }

  liquidate(position: Position, balance: AccountBalance, markPrice: number, symbol: SymbolConfig) {
    const notional = markPrice * position.quantity;
    const fee = this.margin.fee(notional, symbol.takerFeeRate);
    const realizedPnl = this.positions.closePosition(position, markPrice, position.quantity, fee);
    position.status = 'LIQUIDATED';
    balance.walletBalance = Math.max(0, balance.walletBalance + realizedPnl);
    this.cancelRelatedTriggers(position.id);
    this.audit.record(position.userId, 'LIQUIDATION', position.id, { markPrice, realizedPnl, fee });
    this.notifications.emit({
      userId: position.userId,
      type: 'LIQUIDATION_WARNING',
      message: 'Position liquidated',
      payload: { positionId: position.id, symbol: position.symbol, markPrice, realizedPnl },
    });
  }

  private isWarning(position: Position, markPrice: number) {
    const distance = Math.abs(markPrice - position.liquidationPrice) / markPrice;
    return distance <= 0.05;
  }

  private cancelRelatedTriggers(positionId: string) {
    for (const order of this.state.orders) {
      if (order.linkedPositionId === positionId && order.status === 'NEW') {
        order.status = 'CANCELED';
        order.updatedAt = new Date().toISOString();
      }
    }
  }
}
