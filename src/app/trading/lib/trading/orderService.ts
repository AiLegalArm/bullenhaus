import { AuditLogService } from './auditLogService';
import { MarginService } from './marginService';
import { NotificationService } from './notificationService';
import { PositionService } from './positionService';
import type { CreateOrderInput, EngineState, Order, Position, SymbolConfig, TradeFill } from './types';

const makeId = () => crypto.randomUUID();

export class OrderService {
  constructor(
    private state: EngineState,
    private margin: MarginService,
    private positions: PositionService,
    private audit: AuditLogService,
    private notifications: NotificationService,
  ) {}

  createOrder(input: CreateOrderInput, symbol: SymbolConfig, markPrice: number) {
    if (this.state.processedExecutionKeys.has(input.idempotencyKey)) {
      throw new Error('Duplicate idempotency key');
    }
    if (this.state.orders.some((order) => order.idempotencyKey === input.idempotencyKey)) {
      throw new Error('Duplicate idempotency key');
    }
    this.margin.validateLeverage(input.leverage, symbol);
    const validationPrice = input.type === 'MARKET' ? markPrice : input.price ?? input.triggerPrice ?? markPrice;
    this.margin.validateQuantity(input.quantity, validationPrice, symbol);
    this.validateConditionalPrices(input, markPrice);

    const now = new Date().toISOString();
    const order: Order = {
      id: makeId(),
      userId: input.userId,
      symbol: symbol.symbol,
      side: input.side,
      type: input.type,
      quantity: input.quantity,
      price: input.price,
      triggerPrice: input.triggerPrice,
      triggerPriceType: input.triggerPriceType ?? 'MARK_PRICE',
      reduceOnly: input.reduceOnly ?? false,
      postOnly: input.postOnly ?? false,
      timeInForce: input.timeInForce ?? 'GTC',
      status: 'NEW',
      filledQuantity: 0,
      leverage: input.leverage,
      marginType: input.marginType,
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };

    this.state.orders.push(order);
    this.audit.record(input.userId, 'ORDER_CREATED', order.id, { order });
    this.notifications.emit({ userId: input.userId, type: 'ORDER', message: 'Order created', payload: { orderId: order.id } });
    return order;
  }

  cancelOrder(userId: string, orderId: string) {
    const order = this.state.orders.find((item) => item.id === orderId && item.userId === userId);
    if (!order) throw new Error('Order not found');
    if (order.status === 'FILLED') throw new Error('Cannot cancel filled order');
    order.status = 'CANCELED';
    order.updatedAt = new Date().toISOString();
    this.audit.record(userId, 'ORDER_CANCELED', orderId, {});
    return order;
  }

  executeOrder(order: Order, symbol: SymbolConfig, price: number, balance = this.state.balances[order.userId]) {
    if (this.state.processedExecutionKeys.has(order.idempotencyKey)) return [];
    if (!balance) throw new Error('Balance not found');

    const notional = this.margin.notional(price, order.quantity);
    const fee = this.margin.fee(notional, order.postOnly ? symbol.makerFeeRate : symbol.takerFeeRate);
    const fills: TradeFill[] = [];

    if (order.reduceOnly) {
      const open = this.positions.getOpenPositions(order.userId, order.symbol)
        .filter((position) => position.side !== order.side);
      let remaining = order.quantity;
      for (const position of open) {
        if (remaining <= 0) break;
        const closeQty = Math.min(position.quantity, remaining);
        const allocatedFee = fee * (closeQty / order.quantity);
        const realizedPnl = this.positions.closePosition(position, price, closeQty, allocatedFee);
        balance.walletBalance = Math.max(0, balance.walletBalance + realizedPnl);
        remaining -= closeQty;
        fills.push(this.makeFill(order, position, closeQty, price, allocatedFee, realizedPnl));
      }
      if (remaining > 0) throw new Error('Reduce-only quantity exceeds open opposite position');
    } else {
      this.margin.validateMargin(balance, price, order.quantity, order.leverage, order.marginType, symbol);
      const position = this.positions.openPosition({
        userId: order.userId,
        symbol,
        side: order.side,
        entryPrice: price,
        quantity: order.quantity,
        leverage: order.leverage,
        marginType: order.marginType,
        balance,
        fee,
      });
      balance.walletBalance = Math.max(0, balance.walletBalance - fee);
      balance.crossInitialMargin += position.marginType === 'CROSS' ? position.initialMargin : 0;
      balance.crossMaintenanceMargin += position.marginType === 'CROSS' ? position.maintenanceMargin : 0;
      fills.push(this.makeFill(order, position, order.quantity, price, fee, 0));
      this.audit.record(order.userId, 'POSITION_OPENED', position.id, { position });
    }

    order.status = 'FILLED';
    order.filledQuantity = order.quantity;
    order.averageFillPrice = price;
    order.updatedAt = new Date().toISOString();
    this.state.processedExecutionKeys.add(order.idempotencyKey);
    this.state.fills.push(...fills);
    this.audit.record(order.userId, 'ORDER_FILLED', order.id, { price, fills });
    this.notifications.emit({ userId: order.userId, type: 'ORDER', message: 'Order filled', payload: { orderId: order.id, price } });
    return fills;
  }

  shouldTrigger(order: Order, markPrice: number, lastPrice: number) {
    if (!order.triggerPrice || order.status !== 'NEW') return false;
    const triggerSource = order.triggerPriceType === 'MARK_PRICE' ? markPrice : lastPrice;
    if (order.type === 'STOP_MARKET') return order.side === 'LONG' ? triggerSource >= order.triggerPrice : triggerSource <= order.triggerPrice;
    if (order.type === 'TAKE_PROFIT_MARKET') return order.side === 'LONG' ? triggerSource <= order.triggerPrice : triggerSource >= order.triggerPrice;
    return false;
  }

  shouldFillLimit(order: Order, markPrice: number) {
    if (order.type !== 'LIMIT' || order.status !== 'NEW' || !order.price) return false;
    return order.side === 'LONG' ? markPrice <= order.price : markPrice >= order.price;
  }

  private validateConditionalPrices(input: CreateOrderInput, markPrice: number) {
    if (input.type === 'LIMIT' && !input.price) throw new Error('Limit order requires price');
    if ((input.type === 'STOP_MARKET' || input.type === 'TAKE_PROFIT_MARKET') && !input.triggerPrice) {
      throw new Error('Conditional order requires triggerPrice');
    }
    if (input.stopLoss) {
      if (input.side === 'LONG' && input.stopLoss >= markPrice) throw new Error('Long stop-loss must be below mark price');
      if (input.side === 'SHORT' && input.stopLoss <= markPrice) throw new Error('Short stop-loss must be above mark price');
    }
    if (input.takeProfit) {
      if (input.side === 'LONG' && input.takeProfit <= markPrice) throw new Error('Long take-profit must be above mark price');
      if (input.side === 'SHORT' && input.takeProfit >= markPrice) throw new Error('Short take-profit must be below mark price');
    }
  }

  private makeFill(order: Order, position: Position | undefined, quantity: number, price: number, fee: number, realizedPnl: number): TradeFill {
    return {
      id: makeId(),
      orderId: order.id,
      positionId: position?.id,
      userId: order.userId,
      symbol: order.symbol,
      side: order.side,
      quantity,
      price,
      fee,
      realizedPnl,
      liquidity: order.postOnly ? 'MAKER' : 'TAKER',
      createdAt: new Date().toISOString(),
    };
  }
}
