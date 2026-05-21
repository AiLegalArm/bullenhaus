import React, { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import { MousePointer2, Settings, Type, Crosshair, Pencil, Move, Crop, Plus } from 'lucide-react';
import { useTradingContext } from '../../contexts/TradingContext';
import { useTradingStore } from '../../stores/tradingStore';
import { AssetSelector } from './AssetSelector';

export const TradingChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<{
    candlestick: any;
    volume: any;
    ema: any;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const { currentPair, currentTimeframe, setCurrentTimeframe } = useTradingContext();

  const timeframes = ['1m', '5m', '15m', '30m', '1h', '4h', '1D', '1W'];

  const buildDemoCandles = (basePrice: number, tfSeconds: number, points = 120) => {
    const cData = [];
    const vData = [];
    const eData = [];
    const now = Math.floor(Date.now() / 1000);
    let currentVal = basePrice;
    let sum = 0;

    for (let i = points - 1; i >= 0; i--) {
      const index = points - 1 - i;
      const time = (now - i * tfSeconds) as any;
      const volatility = Math.max(basePrice * 0.001, 0.00001);
      const wave = Math.sin(index * 0.7) * volatility;
      const drift = Math.cos(index * 0.23) * volatility * 0.45;
      const open = currentVal;
      const close = Math.max(0.00001, open + wave + drift);
      const high = Math.max(open, close) + volatility * (0.35 + (index % 5) * 0.08);
      const low = Math.max(0.00001, Math.min(open, close) - volatility * (0.3 + (index % 3) * 0.08));

      currentVal = close;
      cData.push({ time, open, high, low, close, isDemo: true });

      const isUp = close >= open;
      vData.push({
        time,
        value: Math.round(500 + index * 7 + Math.abs(Math.sin(index)) * 900),
        color: isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 0, 0.3)',
        isDemo: true,
      });

      sum += close;
      const emaVal = index >= 8 ? (sum / 9) : (sum / (index + 1));
      eData.push({ time, value: emaVal, isDemo: true });
      if (index >= 8) sum -= cData[index - 8].close;
    }

    return { cData, vData, eData };
  };

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: 'Outfit, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        rightOffset: 12,
        barSpacing: 8,
        fixLeftEdge: true,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 480,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00E676',
      downColor: '#FF3D00',
      borderVisible: false,
      wickUpColor: '#00E676',
      wickDownColor: '#FF3D00',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', 
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    const emaSeries = chart.addSeries(LineSeries, { color: '#D4AF37', lineWidth: 2 });

    chartRef.current = chart;
    seriesRef.current = {
      candlestick: candlestickSeries,
      volume: volumeSeries,
      ema: emaSeries,
    };

    const resizeChart = () => {
      const container = chartContainerRef.current;
      if (!container) return;
      chart.applyOptions({ 
        width: Math.max(1, container.clientWidth),
        height: Math.max(320, container.clientHeight), 
      });
    };

    const resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(chartContainerRef.current);
    window.addEventListener('resize', resizeChart);
    resizeChart();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', resizeChart);
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // Handle data updates
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    if (wsRef.current) {
       wsRef.current.close();
       wsRef.current = null;
    }
    if (unsubRef.current) {
       unsubRef.current();
       unsubRef.current = null;
    }

    const { candlestick, volume, ema } = seriesRef.current;

    const getTfSeconds = (tf: string) => {
      const value = parseInt(tf);
      if (tf.endsWith('m')) return value * 60;
      if (tf.endsWith('h')) return value * 3600;
      if (tf.endsWith('D')) return value * 86400;
      if (tf.endsWith('W')) return value * 604800;
      return 60;
    };
    const tfSeconds = getTfSeconds(currentTimeframe);

    // Update precision dynamically without recreating series
    candlestick.applyOptions({
      priceFormat: { 
         type: 'price', 
         precision: currentPair.includes('JPY') ? 3 : currentPair.endsWith('USDT') ? 2 : 5, 
         minMove: currentPair.includes('JPY') ? 0.001 : currentPair.endsWith('USDT') ? 0.01 : 0.00001
      }
    });

    const isForex = !currentPair.endsWith('USDT');

    if (isForex) {
       const generateDummyForex = (basePrice: number) => {
         const cData = [];
         const vData = [];
         const eData = [];
         let currentVal = basePrice;
         const now = Math.floor(Date.now() / 1000);
         let sum = 0;

         for (let i = 500; i >= 0; i--) {
           const time = (now - i * tfSeconds) as any;
           const volatility = basePrice * 0.001;
           const open = currentVal + (Math.random() - 0.5) * volatility;
           const close = open + (Math.random() - 0.5) * volatility * 2;
           const high = Math.max(open, close) + Math.random() * volatility;
           const low = Math.min(open, close) - Math.random() * volatility;
           
           currentVal = close;

           cData.push({ time, open, high, low, close, isDemo: true });

           const isUp = close >= open;
           vData.push({ time, value: Math.random() * 1000 + 500, color: isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 0, 0.3)', isDemo: true });

           sum += close;
           const emaVal = i >= 8 ? (sum / 9) : (sum / (i + 1));
           eData.push({ time, value: emaVal, isDemo: true });
           if (500 - i >= 8) sum -= cData[500 - i - 8].close;
         }
         return { cData, vData, eData };
       };

       const curPrice = useTradingStore.getState().prices[currentPair] || 1.1;
       const { cData, vData, eData } = generateDummyForex(curPrice);
       candlestick.setData(cData as any);
       volume.setData(vData as any);
       ema.setData(eData as any);

       let lastPrice = curPrice;
       unsubRef.current = useTradingStore.subscribe(
          (state) => {
             const newPrice = state.prices[currentPair];
             if (!newPrice || newPrice === lastPrice) return;
             lastPrice = newPrice;
             
             const now = Math.floor(Date.now() / 1000);
             const candleTime = now - (now % tfSeconds);

             candlestick.update({
                time: candleTime as any,
                open: newPrice,
                high: newPrice * 1.0001,
                low: newPrice * 0.9999,
                close: newPrice
             });
          }
       );
    } else {
       // Binance Crypto logic
       const fetchHistoricalData = async () => {
         try {
           const symbol = currentPair.toUpperCase();
           const binanceInterval = currentTimeframe.toLowerCase();
           const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${binanceInterval}&limit=500`);
           const data = await res.json();
           if (!Array.isArray(data) || data.length === 0) {
             const fallbackPrice = useTradingStore.getState().prices[currentPair] || 100;
             const { cData, vData, eData } = buildDemoCandles(fallbackPrice, tfSeconds);
             candlestick.setData(cData as any);
             volume.setData(vData as any);
             ema.setData(eData as any);
             return;
           }
           
           const cData = [];
           const vData = [];
           const eData = [];
           let sum = 0;
           
           for(let i = 0; i < data.length; i++) {
             const d = data[i];
             const time = d[0] / 1000;
             const open = parseFloat(d[1]);
             const high = parseFloat(d[2]);
             const low = parseFloat(d[3]);
             const close = parseFloat(d[4]);
             const vol = parseFloat(d[5]);
             
             cData.push({ time, open, high, low, close });
             
             const isUp = close >= open;
             vData.push({ time, value: vol, color: isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 0, 0.3)' });
             
             sum += close;
             const emaVal = i >= 8 ? (sum / 9) : (sum / (i + 1));
             eData.push({ time, value: emaVal });
             if(i >= 8) sum -= parseFloat(data[i-8][4]);
           }
           
           candlestick.setData(cData as any);
           volume.setData(vData as any);
           ema.setData(eData as any);
           
           const lowerSymbol = symbol.toLowerCase();
           wsRef.current = new WebSocket(`wss://stream.binance.com:9443/ws/${lowerSymbol}@kline_${binanceInterval}`);
           
           wsRef.current.onmessage = (event) => {
             const msg = JSON.parse(event.data);
             if (msg && msg.k) {
               const k = msg.k;
               const time = k.t / 1000;
               const open = parseFloat(k.o);
               const high = parseFloat(k.h);
               const low = parseFloat(k.l);
               const close = parseFloat(k.c);
               const vol = parseFloat(k.v);
               
               candlestick.update({ time: time as any, open, high, low, close });
               const isUp = close >= open;
               volume.update({ time: time as any, value: vol, color: isUp ? 'rgba(0, 230, 118, 0.3)' : 'rgba(255, 61, 0, 0.3)' });
             }
           };
         } catch (err) {
           console.error("Failed to load historical data", err);
           const fallbackPrice = useTradingStore.getState().prices[currentPair] || 100;
           const { cData, vData, eData } = buildDemoCandles(fallbackPrice, tfSeconds);
           candlestick.setData(cData as any);
           volume.setData(vData as any);
           ema.setData(eData as any);
         }
       };
       fetchHistoricalData();
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (unsubRef.current) unsubRef.current();
    };
  }, [currentPair, currentTimeframe]);

  return (
    <div className="relative w-full h-full min-h-[420px] flex flex-col sm:flex-row bg-[#0a0a0a]">
      {/* Top Toolbar */}
       <div className="relative sm:absolute sm:top-0 sm:left-12 sm:right-0 min-h-12 sm:h-10 border-b border-white/5 bg-surface-bg/95 sm:bg-surface-bg/80 backdrop-blur z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 sm:px-0 sm:py-0">
          <div className="flex flex-col sm:flex-row sm:items-center min-w-0 sm:h-full gap-2 sm:gap-0">
             <AssetSelector />
             <div className="flex gap-1 sm:px-4 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
               {timeframes.map(tf => (
                  <button
                     key={tf}
                     onClick={() => setCurrentTimeframe(tf)}
                     className={`shrink-0 px-3 py-1 rounded text-[10px] font-bold transition-all ${currentTimeframe === tf ? 'bg-accent-primary text-black' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                     {tf}
                  </button>
               ))}
             </div>
          </div>
          <div className="flex items-center gap-4 px-4">
          </div>
       </div>

      {/* Left Drawing Tools Sidebar */}
      <div className="hidden sm:flex w-12 h-full border-r border-white/5 flex-col items-center py-4 gap-4 z-10 bg-surface-bg/50 pt-14">
        {[MousePointer2, Crosshair, Pencil, Move, Crop, Type, Plus].map((Icon, idx) => (
          <button key={idx} className="p-2 text-slate-500 hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-all">
            <Icon size={16} />
          </button>
        ))}
      </div>

      <div className="flex-1 relative overflow-hidden min-h-[340px]">
        <div ref={chartContainerRef} className="w-full h-full absolute inset-0" />
        
        {/* Indicators Toolbar */}
        <div className="hidden md:flex absolute top-4 left-4 gap-2 z-10 pointer-events-none">
          <div className="px-3 py-1.5 bg-surface-bg/80 backdrop-blur border border-white/10 rounded-lg text-[10px] font-bold flex items-center gap-2 text-white pointer-events-auto cursor-pointer hover:border-accent-primary/50 transition-colors">
             <Settings size={12} className="text-accent-primary" /> Indicators <span className="text-slate-500 ml-2">3 Active</span>
          </div>
          <div className="px-3 py-1.5 bg-surface-bg/80 backdrop-blur border border-white/10 rounded-lg text-[10px] font-bold flex items-center gap-2 pointer-events-auto cursor-pointer hover:bg-white/5 transition-colors text-accent-primary">
             EMA (9)
          </div>
          <div className="px-3 py-1.5 bg-surface-bg/80 backdrop-blur border border-white/10 rounded-lg text-[10px] font-bold flex items-center gap-2 pointer-events-auto cursor-pointer test-slate-300 hover:bg-white/5 transition-colors text-white">
             MACD (12, 26, 9)
          </div>
          <div className="px-3 py-1.5 bg-surface-bg/80 backdrop-blur border border-white/10 rounded-lg text-[10px] font-bold flex items-center gap-2 pointer-events-auto cursor-pointer test-slate-300 hover:bg-white/5 transition-colors text-white">
             RSI (14)
          </div>
        </div>
      </div>
    </div>
  );
};

