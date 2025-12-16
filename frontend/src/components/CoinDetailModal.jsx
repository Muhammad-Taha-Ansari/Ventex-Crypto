import { useState, useEffect } from 'react';
import { useCrypto } from '../context/CryptoContext';
import CandlestickChart from './CandlestickChart';

const CoinDetailModal = ({ coin, isOpen, onClose }) => {
  const { fetchCoinHistory, isConnected } = useCrypto();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // days
  const [currentPrice, setCurrentPrice] = useState(coin?.priceUsd || '0');

  useEffect(() => {
    if (isOpen && coin) {
      loadHistory();
    }
  }, [isOpen, coin, timeRange]);

  useEffect(() => {
    if (coin?.priceUsd) {
      setCurrentPrice(coin.priceUsd);
    }
  }, [coin?.priceUsd]);

  const loadHistory = async () => {
    if (!coin?.id) return;
    try {
      setLoading(true);
      const data = await fetchCoinHistory(coin.id, timeRange);
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    if (num < 0.01) return `$${num.toFixed(6)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    if (num < 1000) return `$${num.toFixed(2)}`;
    return `$${(num / 1000).toFixed(2)}K`;
  };

  const formatNumber = (num) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const getCoinIcon = (symbol) => {
    return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
  };

  if (!isOpen || !coin) return null;

  const isPositive = parseFloat(coin.changePercent24Hr || 0) >= 0;
  const priceChange = parseFloat(coin.changePercent24Hr || 0);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-7xl my-4 bg-[#0B0E11] rounded-2xl border border-[#1E2329] overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-[#1E2329] hover:bg-[#2B3139] rounded-lg text-white/70 hover:text-white transition-all duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Binance-style Header */}
        <div className="p-4 sm:p-6 border-b border-[#1E2329] bg-[#0B0E11]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <img
                src={getCoinIcon(coin.symbol)}
                alt={coin.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                onError={(e) => {
                  e.target.src = `https://cryptoicons.org/api/icon/${coin.symbol.toLowerCase()}/200`;
                }}
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white">{coin.name}</h2>
                <p className="text-white/60 text-xs sm:text-sm uppercase">{coin.symbol}/USD</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-white/60 text-xs sm:text-sm mb-1">Last Price</p>
              <p className={`text-2xl sm:text-3xl font-bold ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {formatPrice(currentPrice)}
              </p>
              <p className={`text-xs sm:text-sm font-semibold mt-1 ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                <span className="ml-2 text-white/60 text-xs">24h</span>
              </p>
            </div>
          </div>
        </div>

        {/* Binance-style Stats Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#1E2329] bg-[#0B0E11] grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <p className="text-white/60 text-xs mb-1">24h High</p>
            <p className="text-white font-semibold text-sm">{formatPrice(coin.high24h || coin.priceUsd)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">24h Low</p>
            <p className="text-white font-semibold text-sm">{formatPrice(coin.low24h || coin.priceUsd)}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">24h Volume</p>
            <p className="text-white font-semibold text-sm">${formatNumber(parseFloat(coin.volumeUsd24Hr || 0))}</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Market Cap</p>
            <p className="text-white font-semibold text-sm">${formatNumber(parseFloat(coin.marketCapUsd || 0))}</p>
          </div>
        </div>

        {/* Time Range Selector - Binance Style */}
        <div className="px-4 sm:px-6 py-3 border-b border-[#1E2329] bg-[#0B0E11] flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {[
              { label: '1H', value: 1/24 },
              { label: '4H', value: 4/24 },
              { label: '1D', value: 1 },
              { label: '1W', value: 7 },
              { label: '1M', value: 30 },
            ].map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`px-3 sm:px-4 py-1.5 rounded text-xs sm:text-sm font-medium transition-all duration-200 ${
                  timeRange === range.value
                    ? 'bg-[#F0B90B] text-[#0B0E11] font-semibold'
                    : 'bg-[#1E2329] text-white/70 hover:bg-[#2B3139] hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#26a69a] animate-pulse' : 'bg-[#ef5350]'}`}></div>
            <span className="text-white/60 text-xs">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Chart Container - Binance Style */}
        <div className="p-4 sm:p-6 bg-[#0B0E11]">
          <div className="w-full h-[500px] sm:h-[600px] mb-6">
            <CandlestickChart data={history} loading={loading} />
          </div>

          {/* Additional Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
              <p className="text-white/60 text-xs mb-2">24h Change</p>
              <p className={`text-base sm:text-lg font-semibold ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </p>
            </div>
            <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
              <p className="text-white/60 text-xs mb-2">24h High</p>
              <p className="text-white text-base sm:text-lg font-semibold">{formatPrice(coin.high24h || coin.priceUsd)}</p>
            </div>
            <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
              <p className="text-white/60 text-xs mb-2">24h Low</p>
              <p className="text-white text-base sm:text-lg font-semibold">{formatPrice(coin.low24h || coin.priceUsd)}</p>
            </div>
            <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
              <p className="text-white/60 text-xs mb-2">24h Volume</p>
              <p className="text-white text-base sm:text-lg font-semibold">${formatNumber(parseFloat(coin.volumeUsd24Hr || 0))}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinDetailModal;
