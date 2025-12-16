import { useEffect, useRef, useState } from 'react';

// Top cryptocurrencies to track - mapping to CoinDesk instrument format
export const TOP_CRYPTOS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', instrument: 'BTC-USD' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', instrument: 'ETH-USD' },
  { id: 'binance-coin', symbol: 'BNB', name: 'BNB', instrument: 'BNB-USD' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', instrument: 'SOL-USD' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', instrument: 'XRP-USD' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', instrument: 'ADA-USD' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', instrument: 'DOGE-USD' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', instrument: 'DOT-USD' },
  { id: 'polygon', symbol: 'MATIC', name: 'Polygon', instrument: 'MATIC-USD' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', instrument: 'LTC-USD' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', instrument: 'LINK-USD' },
  { id: 'avalanche', symbol: 'AVAX', name: 'Avalanche', instrument: 'AVAX-USD' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', instrument: 'UNI-USD' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', instrument: 'ATOM-USD' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', instrument: 'XLM-USD' }
];

// Get instruments list for API calls
export const getInstruments = () => TOP_CRYPTOS.map(c => c.instrument).join(',');

export const useCoinWebSocket = (assets = TOP_CRYPTOS.map(c => c.id)) => {
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const connectionStableRef = useRef(false);
  const connectionTimeoutRef = useRef(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        // CoinCap WebSocket - free, no API key needed (for real-time price updates)
        // This works with coin IDs like 'bitcoin', 'ethereum', etc.
        const assetsParam = Array.isArray(assets) ? assets.join(',') : assets;
        const wsUrl = `wss://ws.coincap.io/prices?assets=${assetsParam}`;
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          // Only log in development
          if (process.env.NODE_ENV === 'development') {
            console.log('WebSocket connected');
          }
          connectionStableRef.current = true;
          reconnectAttempts.current = 0;
          
          // Only update connection status after a brief delay to avoid flickering
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
          connectionTimeoutRef.current = setTimeout(() => {
            setIsConnected(true);
          }, 500);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setPrices(prevPrices => ({
              ...prevPrices,
              ...data
            }));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Don't immediately set to false - wait to see if it reconnects
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
          connectionTimeoutRef.current = setTimeout(() => {
            if (!connectionStableRef.current) {
              setIsConnected(false);
            }
          }, 2000);
        };

        ws.onclose = () => {
          // Only log in development and if it's not a normal reconnection
          if (process.env.NODE_ENV === 'development' && reconnectAttempts.current === 0) {
            console.log('WebSocket disconnected');
          }
          connectionStableRef.current = false;
          
          // Only set to offline if we've exhausted reconnection attempts
          if (reconnectAttempts.current >= maxReconnectAttempts) {
            setIsConnected(false);
            console.error('Max reconnection attempts reached');
          } else {
            // Reconnect logic - don't change status during reconnection
            reconnectAttempts.current += 1;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            // Only log reconnection attempts in development
            if (process.env.NODE_ENV === 'development' && reconnectAttempts.current <= 3) {
              console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current})`);
            }
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, delay);
          }
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [assets.join(',')]);

  return { prices, isConnected };
};

