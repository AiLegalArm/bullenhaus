import { useEffect } from 'react';
import { useTradingStore } from '../stores/tradingStore';
import { useForexStore } from '../stores/forexStore';

// Major crypto pairs
const CRYPTO_PAIRS = [
  'btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'xrpusdt', 'adausdt', 'dogeusdt',
  'avaxusdt', 'dotusdt', 'linkusdt', 'ltcusdt', 'trxusdt', 'tonusdt', 'bchusdt',
  'shibusdt', 'pepeusdt', 'aptusdt', 'arbusdt', 'opusdt', 'suiusdt', 'nearusdt',
  'atomusdt', 'filusdt', 'icpusdt', 'uniusdt', 'etcusdt', 'injusdt', 'renderusdt',
  'seiusdt', 'fetusdt'
];

export const useMarketEngine = () => {
  const { updatePrice } = useTradingStore();
  const { tickSimulation, pairs: forexPairs } = useForexStore();

  // Binance WS
  useEffect(() => {
    let ws: WebSocket | null = null;
    
    const connectWS = () => {
      // Connect to combined stream for specific pairs to avoid huge payloads
      const streamUrl = CRYPTO_PAIRS.map(p => `${p}@ticker`).join('/');
      ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streamUrl}`);
      
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.data) {
            const item = payload.data;
            const currentPrice = parseFloat(item.c);
            const priceChangePercent24h = parseFloat(item.P);
            updatePrice(item.s.toUpperCase(), currentPrice, priceChangePercent24h);
          }
        } catch (err) {
          // Ignore parsing errors
        }
      };

      ws.onerror = (e) => {
        console.warn("Binance WS Connection Error - Retrying soon...");
      };
      
      ws.onclose = () => {
         setTimeout(connectWS, 3000); // Reconnect
      }
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
  }, [updatePrice]);

  // Forex Simulation Tick
  useEffect(() => {
    const interval = setInterval(() => {
      tickSimulation();
      
      // Sync forex prices to trading store so charts/orders work seamlessly
      const currentForexPairs = useForexStore.getState().pairs;
      Object.values(currentForexPairs).forEach(fp => {
         updatePrice(fp.symbol, fp.price, fp.change24h);
      });
      
    }, 1000); // 1 second ticks for forex simulation
    
    return () => clearInterval(interval);
  }, [tickSimulation, updatePrice]);
};
