import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCrypto } from '../context/CryptoContext';
import CandlestickChart from '../components/CandlestickChart';

const CoinDetail = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { coins, fetchCoinHistory, isConnected } = useCrypto();
  const [coin, setCoin] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    if (coins.length > 0 && symbol) {
      const foundCoin = coins.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
      if (foundCoin) {
        setCoin(foundCoin);
        loadHistory(foundCoin.id);
      } else {
        setLoading(false);
      }
    }
  }, [coins, symbol]);

  const loadHistory = async (coinId) => {
    try {
      setLoading(true);
      const data = await fetchCoinHistory(coinId, timeRange);
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coin) {
      loadHistory(coin.id);
    }
  }, [timeRange, coin]);

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

  if (loading && !coin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <div className="text-white/60">Loading coin data...</div>
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Coin not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isPositive = parseFloat(coin.changePercent24Hr || 0) >= 0;
  const priceChange = parseFloat(coin.changePercent24Hr || 0);
  const currentPrice = coin.priceUsd;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with Back Button */}
      <div className="bg-[#0B0E11] border-b border-[#1E2329] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center gap-4">
            <img
              src={getCoinIcon(coin.symbol)}
              alt={coin.name}
              className="w-12 h-12 rounded-full"
              onError={(e) => {
                e.target.src = `https://cryptoicons.org/api/icon/${coin.symbol.toLowerCase()}/200`;
              }}
            />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{coin.name}</h1>
              <p className="text-white/60 text-sm uppercase">{coin.symbol}/USD</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-white/60 text-sm mb-1">Last Price</p>
              <p className={`text-2xl sm:text-3xl font-bold ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {formatPrice(currentPrice)}
              </p>
              <p className={`text-sm font-semibold mt-1 ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                <span className="ml-2 text-white/60 text-xs">24h</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
            <p className="text-white/60 text-xs mb-1">24h High</p>
            <p className="text-white font-semibold">{formatPrice(coin.high24h || coin.priceUsd)}</p>
          </div>
          <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
            <p className="text-white/60 text-xs mb-1">24h Low</p>
            <p className="text-white font-semibold">{formatPrice(coin.low24h || coin.priceUsd)}</p>
          </div>
          <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
            <p className="text-white/60 text-xs mb-1">24h Volume</p>
            <p className="text-white font-semibold">${formatNumber(parseFloat(coin.volumeUsd24Hr || 0))}</p>
          </div>
          <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
            <p className="text-white/60 text-xs mb-1">Market Cap</p>
            <p className="text-white font-semibold">${formatNumber(parseFloat(coin.marketCapUsd || 0))}</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="bg-[#0B0E11] rounded-lg p-4 border border-[#1E2329] mb-6 flex flex-wrap items-center justify-between gap-3">
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

        {/* Chart */}
        <div className="bg-[#0B0E11] rounded-lg p-4 sm:p-6 border border-[#1E2329] mb-6">
          <div className="w-full h-[500px] sm:h-[600px]">
            <CandlestickChart data={history} loading={loading} />
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
            <p className="text-white/60 text-xs mb-2">24h Change</p>
            <p className={`text-lg font-semibold ${isPositive ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </p>
          </div>
          <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
            <p className="text-white/60 text-xs mb-2">24h High</p>
            <p className="text-white text-lg font-semibold">{formatPrice(coin.high24h || coin.priceUsd)}</p>
          </div>
          <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
            <p className="text-white/60 text-xs mb-2">24h Low</p>
            <p className="text-white text-lg font-semibold">{formatPrice(coin.low24h || coin.priceUsd)}</p>
          </div>
          <div className="bg-[#1E2329] rounded-lg p-4 border border-[#2B3139]">
            <p className="text-white/60 text-xs mb-2">24h Volume</p>
            <p className="text-white text-lg font-semibold">${formatNumber(parseFloat(coin.volumeUsd24Hr || 0))}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinDetail;

