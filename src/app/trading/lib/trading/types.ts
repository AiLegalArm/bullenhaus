export const ALLOWED_LEVERAGE = [1, 2, 5, 10, 20, 30, 50, 75, 100] as const;

export type Leverage = (typeof ALLOWED_LEVERAGE)[number];
export type PositionSide = 'LONG' | 'SHORT';
export type MarginType = 'CROSS' | 'ISOLATED';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET';
export type TriggerPriceType = 'MARK_PRICE' | 'LAST_PRICE';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK';
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'TRIGGERED';
export type PositionStatus = 'OPEN' | 'CLOSED' | 'LIQUIDATED';
export type AuditAction =
  | 'ORDER_CREATED'
  | 'ORDER_CANCELED'
  | 'ORDER_FILLED'
  | 'POSITION_OPENED'
  | 'POSITION_CLOSED'
  | 'POSITION_MARGIN_CHANGED'
  | 'LEVERAGE_CHANGED'
  | 'MARGIN_MODE_CHANGED'
  | 'SLTP_SET'
  | 'SLTP_TRIGGERED'
  | 'LIQUIDATION';

export interface SymbolConfig {
  symbol: string;
  minQuantity: number;
  quantityStep: number;
  priceStep: number;
  minNotional: number;
  maxLeverage: Leverage;
  takerFeeRate: number;
  makerFeeRate: number;
  maintenanceMarginRate: number;
}

export interface AccountBalance {
  userId: string;
  walletBalance: number;
  availableBalance: number;
  crossUnrealizedPnl: number;
  crossInitialMargin: number;
  crossMaintenanceMargin: number;
}

export interface Position {
  id: string;
  userId: string;
  symbol: string;
  side: PositionSide;
  entryPrice: number;
  quantity: number;
  leverage: Leverage;
  marginType: MarginType;
  initialMargin: number;
  maintenanceMargin: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  fees: number;
  status: PositionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  symbol: string;
  side: PositionSide;
  type: OrderType;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  triggerPriceType: TriggerPriceType;
  reduceOnly: boolean;
  postOnly: boolean;
  timeInForce: TimeInForce;
  status: OrderStatus;
  filledQuantity: number;
  averageFillPrice?: number;
  leverage: Leverage;
  marginType: MarginType;
  idempotencyKey: string;
  linkedPositionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeFill {
  id: string;
  orderId: string;
  positionId?: string;
  userId: string;
  symbol: string;
  side: PositionSide;
  quantity: number;
  price: number;
  fee: number;
  realizedPnl: number;
  liquidity: 'MAKER' | 'TAKER';
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationEvent {
  id: string;
  userId: string;
  type: 'ORDER' | 'POSITION' | 'LIQUIDATION_WARNING' | 'BALANCE' | 'INDICATOR';
  message: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface EngineState {
  balances: Record<string, AccountBalance>;
  positions: Position[];
  orders: Order[];
  fills: TradeFill[];
  auditLogs: AuditLogEntry[];
  notifications: NotificationEvent[];
  processedExecutionKeys: Set<string>;
}

export interface CreateOrderInput {
  userId: string;
  symbol: string;
  side: PositionSide;
  type: OrderType;
  quantity: number;
  price?: number;
  triggerPrice?: number;
  triggerPriceType?: TriggerPriceType;
  reduceOnly?: boolean;
  postOnly?: boolean;
  timeInForce?: TimeInForce;
  leverage: Leverage;
  marginType: MarginType;
  stopLoss?: number;
  takeProfit?: number;
  idempotencyKey: string;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorPoint {
  timestamp: number;
  value: number | null;
  signal?: number | null;
  histogram?: number | null;
  upper?: number | null;
  lower?: number | null;
  middle?: number | null;
  k?: number | null;
  d?: number | null;
  levels?: Record<string, number> | null;
}

export interface IndicatorResult {
  name: string;
  values: IndicatorPoint[];
}
