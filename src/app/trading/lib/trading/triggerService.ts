import { AuditLogService } from './auditLogService';
import { OrderService } from './orderService';
import type { EngineState, Order, Position } from './types';

export class TriggerService {
  private executedTriggerIds = new Set<string>();

  constructor(
    private state: EngineState,
    private orders: OrderService,
    private audit: AuditLogService,
  ) {}

  setStopLoss(position: Position, triggerPrice: number, quantity = position.quantity) {
    this.validateStopLoss(position, triggerPrice);
    return this.createClosingTrigger(position, 'STOP_MARKET', triggerPrice, quantity);
  }

  setTakeProfit(position: Position, triggerPrice: number, quantity = position.quantity) {
    this.validateTakeProfit(position, triggerPrice);
    return this.createClosingTrigger(position, 'TAKE_PROFIT_MARKET', triggerPrice, quantity);
  }

  process(markPrice: number, lastPrice: number, symbols: any) {
    const triggered: Order[] = [];
    for (const order of this.state.orders) {
      if (order.status !== 'NEW' || !order.triggerPrice || this.executedTriggerIds.has(order.id)) continue;
      if (!this.orders.shouldTrigger(order, markPrice, lastPrice)) continue;
      this.executedTriggerIds.add(order.id);
      order.status = 'TRIGGERED';
      order.updatedAt = new Date().toISOString();
      this.orders.executeOrder(order, symbols[order.symbol], order.triggerPriceType === 'MARK_PRICE' ? markPrice : lastPrice);
      this.audit.record(order.userId, 'SLTP_TRIGGERED', order.id, { markPrice, lastPrice });
      triggered.push(order);
      this.cancelIfPositionClosed(order.linkedPositionId);
    }
    return triggered;
  }

  validateStopLoss(position: Position, price: number) {
    if (position.side === 'LONG' && price >= position.entryPrice) throw new Error('Long stop-loss must be below entry price');
    if (position.side === 'SHORT' && price <= position.entryPrice) throw new Error('Short stop-loss must be above entry price');
  }

  validateTakeProfit(position: Position, price: number) {
    if (position.side === 'LONG' && price <= position.entryPrice) throw new Error('Long take-profit must be above entry price');
    if (position.side === 'SHORT' && price >= position.entryPrice) throw new Error('Short take-profit must be below entry price');
  }

  private createClosingTrigger(position: Position, type: 'STOP_MARKET' | 'TAKE_PROFIT_MARKET', triggerPrice: number, quantity: number) {
    if (quantity <= 0 || quantity > position.quantity) throw new Error('Invalid trigger quantity');
    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      userId: position.userId,
      symbol: position.symbol,
      side: position.side === 'LONG' ? 'SHORT' : 'LONG',
      type,
      quantity,
      triggerPrice,
      triggerPriceType: 'MARK_PRICE',
      reduceOnly: true,
      postOnly: false,
      timeInForce: 'GTC',
      status: 'NEW',
      filledQuantity: 0,
      leverage: position.leverage,
      marginType: position.marginType,
      idempotencyKey: `${type}:${position.id}:${triggerPrice}:${quantity}`,
      linkedPositionId: position.id,
      createdAt: now,
      updatedAt: now,
    };
    this.state.orders.push(order);
    this.audit.record(position.userId, 'SLTP_SET', order.id, { positionId: position.id, type, triggerPrice, quantity });
    return order;
  }

  private cancelIfPositionClosed(positionId?: string) {
    if (!positionId) return;
    const position = this.state.positions.find((item) => item.id === positionId);
    if (!position || position.status === 'OPEN') return;
    for (const order of this.state.orders) {
      if (order.linkedPositionId === positionId && order.status === 'NEW') {
        order.status = 'CANCELED';
        order.updatedAt = new Date().toISOString();
      }
    }
  }
}
