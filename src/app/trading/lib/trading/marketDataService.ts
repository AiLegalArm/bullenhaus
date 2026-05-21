import type { Candle } from './types';

export class MarketDataService {
  private markPrices = new Map<string, number>();
  private candles = new Map<string, Candle[]>();

  updateMarkPrice(symbol: string, price: number) {
    if (price <= 0) throw new Error('Mark price must be positive');
    this.markPrices.set(symbol, price);
    return price;
  }

  getMarkPrice(symbol: string) {
    const price = this.markPrices.get(symbol);
    if (!price) throw new Error(`No mark price for ${symbol}`);
    return price;
  }

  setCandles(symbol: string, candles: Candle[]) {
    this.candles.set(symbol, [...candles].sort((a, b) => a.timestamp - b.timestamp));
  }

  getCandles(symbol: string, from?: number, to?: number) {
    return (this.candles.get(symbol) ?? []).filter((candle) => (
      (from === undefined || candle.timestamp >= from) &&
      (to === undefined || candle.timestamp <= to)
    ));
  }
}
