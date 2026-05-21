import type { Candle, IndicatorResult } from './types';

const avg = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const assertPeriod = (period: number) => {
  if (!Number.isInteger(period) || period <= 0) throw new Error('Indicator period must be a positive integer');
};

export class IndicatorService {
  sma(candles: Candle[], period = 20): IndicatorResult {
    assertPeriod(period);
    return {
      name: `SMA_${period}`,
      values: candles.map((candle, index) => ({
        timestamp: candle.timestamp,
        value: index + 1 >= period ? avg(candles.slice(index + 1 - period, index + 1).map((item) => item.close)) : null,
      })),
    };
  }

  ma(candles: Candle[], period = 20): IndicatorResult {
    return this.sma(candles, period);
  }

  ema(candles: Candle[], period = 20): IndicatorResult {
    assertPeriod(period);
    const k = 2 / (period + 1);
    let previous: number | null = null;
    return {
      name: `EMA_${period}`,
      values: candles.map((candle, index) => {
        if (index + 1 < period) return { timestamp: candle.timestamp, value: null };
        if (previous === null) previous = avg(candles.slice(index + 1 - period, index + 1).map((item) => item.close));
        else previous = candle.close * k + previous * (1 - k);
        return { timestamp: candle.timestamp, value: previous };
      }),
    };
  }

  wma(candles: Candle[], period = 20): IndicatorResult {
    assertPeriod(period);
    const denominator = (period * (period + 1)) / 2;
    return {
      name: `WMA_${period}`,
      values: candles.map((candle, index) => {
        if (index + 1 < period) return { timestamp: candle.timestamp, value: null };
        const window = candles.slice(index + 1 - period, index + 1);
        const weighted = window.reduce((sum, item, itemIndex) => sum + item.close * (itemIndex + 1), 0);
        return { timestamp: candle.timestamp, value: weighted / denominator };
      }),
    };
  }

  rsi(candles: Candle[], period = 14): IndicatorResult {
    assertPeriod(period);
    const values = candles.map((candle, index) => {
      if (index < period) return { timestamp: candle.timestamp, value: null };
      const window = candles.slice(index + 1 - period, index + 1);
      let gains = 0;
      let losses = 0;
      for (let i = 1; i < window.length; i++) {
        const delta = window[i].close - window[i - 1].close;
        if (delta >= 0) gains += delta;
        else losses += Math.abs(delta);
      }
      if (losses === 0) return { timestamp: candle.timestamp, value: 100 };
      const rs = gains / losses;
      return { timestamp: candle.timestamp, value: 100 - 100 / (1 + rs) };
    });
    return { name: `RSI_${period}`, values };
  }

  macd(candles: Candle[], fast = 12, slow = 26, signal = 9): IndicatorResult {
    assertPeriod(fast);
    assertPeriod(slow);
    assertPeriod(signal);
    if (fast >= slow) throw new Error('MACD fast period must be less than slow period');
    const fastEma = this.ema(candles, fast).values.map((item) => item.value);
    const slowEma = this.ema(candles, slow).values.map((item) => item.value);
    const macdLine = candles.map((candle, index) => ({
      timestamp: candle.timestamp,
      value: fastEma[index] !== null && slowEma[index] !== null ? fastEma[index]! - slowEma[index]! : null,
    }));
    const signalSource = macdLine.map((item, index) => ({ timestamp: item.timestamp, open: 0, high: 0, low: 0, close: item.value ?? 0, volume: candles[index].volume }));
    const signalLine = this.ema(signalSource, signal).values.map((item) => item.value);
    return {
      name: 'MACD',
      values: macdLine.map((item, index) => ({
        ...item,
        signal: item.value === null ? null : signalLine[index],
        histogram: item.value !== null && signalLine[index] !== null ? item.value - signalLine[index]! : null,
      })),
    };
  }

  bollingerBands(candles: Candle[], period = 20, multiplier = 2): IndicatorResult {
    assertPeriod(period);
    if (multiplier <= 0) throw new Error('Bollinger multiplier must be positive');
    return {
      name: `BB_${period}`,
      values: candles.map((candle, index) => {
        if (index + 1 < period) return { timestamp: candle.timestamp, value: null, middle: null, upper: null, lower: null };
        const closes = candles.slice(index + 1 - period, index + 1).map((item) => item.close);
        const middle = avg(closes);
        const variance = avg(closes.map((value) => Math.pow(value - middle, 2)));
        const deviation = Math.sqrt(variance);
        return { timestamp: candle.timestamp, value: middle, middle, upper: middle + multiplier * deviation, lower: middle - multiplier * deviation };
      }),
    };
  }

  volume(candles: Candle[]): IndicatorResult {
    return { name: 'VOLUME', values: candles.map((candle) => ({ timestamp: candle.timestamp, value: candle.volume })) };
  }

  vwap(candles: Candle[]): IndicatorResult {
    let cumulativeTypicalVolume = 0;
    let cumulativeVolume = 0;
    return {
      name: 'VWAP',
      values: candles.map((candle) => {
        const typical = (candle.high + candle.low + candle.close) / 3;
        cumulativeTypicalVolume += typical * candle.volume;
        cumulativeVolume += candle.volume;
        return { timestamp: candle.timestamp, value: cumulativeVolume ? cumulativeTypicalVolume / cumulativeVolume : null };
      }),
    };
  }

  volumeMovingAverage(candles: Candle[], period = 20): IndicatorResult {
    assertPeriod(period);
    return {
      name: `VOLUME_MA_${period}`,
      values: candles.map((candle, index) => ({
        timestamp: candle.timestamp,
        value: index + 1 >= period ? avg(candles.slice(index + 1 - period, index + 1).map((item) => item.volume)) : null,
      })),
    };
  }

  stochasticOscillator(candles: Candle[], kPeriod = 14, dPeriod = 3): IndicatorResult {
    assertPeriod(kPeriod);
    assertPeriod(dPeriod);
    const kValues = candles.map((candle, index) => {
      if (index + 1 < kPeriod) return null;
      const window = candles.slice(index + 1 - kPeriod, index + 1);
      const highestHigh = Math.max(...window.map((item) => item.high));
      const lowestLow = Math.min(...window.map((item) => item.low));
      if (highestHigh === lowestLow) return 0;
      return ((candle.close - lowestLow) / (highestHigh - lowestLow)) * 100;
    });

    return {
      name: `STOCH_${kPeriod}_${dPeriod}`,
      values: candles.map((candle, index) => {
        const k = kValues[index];
        const dWindow = kValues.slice(index + 1 - dPeriod, index + 1).filter((value): value is number => value !== null);
        const d = dWindow.length === dPeriod ? avg(dWindow) : null;
        return {
          timestamp: candle.timestamp,
          value: k,
          k,
          d,
        };
      }),
    };
  }

  stochasticRsi(candles: Candle[], rsiPeriod = 14, stochPeriod = 14): IndicatorResult {
    assertPeriod(rsiPeriod);
    assertPeriod(stochPeriod);
    const rsiValues = this.rsi(candles, rsiPeriod).values.map((item) => item.value);
    return {
      name: 'STOCH_RSI',
      values: candles.map((candle, index) => {
        if (index + 1 < rsiPeriod + stochPeriod) return { timestamp: candle.timestamp, value: null };
        const window = rsiValues.slice(index + 1 - stochPeriod, index + 1).filter((value): value is number => value !== null);
        const min = Math.min(...window);
        const max = Math.max(...window);
        return { timestamp: candle.timestamp, value: max === min ? 0 : ((rsiValues[index]! - min) / (max - min)) * 100 };
      }),
    };
  }

  atr(candles: Candle[], period = 14): IndicatorResult {
    assertPeriod(period);
    const trueRanges = candles.map((candle, index) => {
      if (index === 0) return candle.high - candle.low;
      const prevClose = candles[index - 1].close;
      return Math.max(candle.high - candle.low, Math.abs(candle.high - prevClose), Math.abs(candle.low - prevClose));
    });
    return {
      name: `ATR_${period}`,
      values: candles.map((candle, index) => ({
        timestamp: candle.timestamp,
        value: index + 1 >= period ? avg(trueRanges.slice(index + 1 - period, index + 1)) : null,
      })),
    };
  }

  fibonacciRetracement(candles: Candle[]): IndicatorResult {
    const ratios = [0.236, 0.382, 0.5, 0.618, 0.786];
    return {
      name: 'FIBONACCI_RETRACEMENT',
      values: candles.map((candle, index) => {
        if (index === 0) return { timestamp: candle.timestamp, value: null, levels: null };
        const window = candles.slice(0, index + 1);
        const high = Math.max(...window.map((item) => item.high));
        const low = Math.min(...window.map((item) => item.low));
        const diff = high - low;
        const levels = Object.fromEntries(ratios.map((ratio) => [ratio.toString(), high - diff * ratio]));
        return { timestamp: candle.timestamp, value: candle.close, levels };
      }),
    };
  }
}
