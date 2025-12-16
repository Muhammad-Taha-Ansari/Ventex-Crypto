import { useState, useEffect } from 'react';

const CoinCard = ({ coin, onClick, onBuy }) => {
  const [priceChange, setPriceChange] = useState(null);
  const isPositive = coin.changePercent24Hr ? parseFloat(coin.changePercent24Hr) >= 0 : null;

  useEffect(() => {
    if (coin.previousPrice && coin.priceUsd) {
      const change = ((parseFloat(coin.priceUsd) - parseFloat(coin.previousPrice)) / parseFloat(coin.previousPrice)) * 100;
      setPriceChange(change);
    }
  }, [coin.priceUsd, coin.previousPrice]);

  const formatPrice = (price) => {
    const num = parseFloat(price);
    if (num < 0.01) return `$${num.toFixed(6)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    if (num < 1000) return `$${num.toFixed(2)}`;
    return `$${(num / 1000).toFixed(2)}K`;
  };

  const formatMarketCap = (cap) => {
    const num = parseFloat(cap);
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(0)}`;
  };

  const getCoinIcon = (symbol) => {
    return `https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`;
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10"
    >
      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/0 via-blue-500/0 to-pink-500/0 group-hover:from-purple-500/20 group-hover:via-blue-500/20 group-hover:to-pink-500/20 transition-all duration-300 -z-10 blur-xl"></div>

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={getCoinIcon(coin.symbol)}
              alt={coin.name}
              className="w-12 h-12 rounded-full"
              onError={(e) => {
                e.target.src = `https://cryptoicons.org/api/icon/${coin.symbol.toLowerCase()}/200`;
              }}
            />
            {coin.priceChange !== undefined && (
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${
                coin.priceChange > 0 ? 'bg-green-500' : coin.priceChange < 0 ? 'bg-red-500' : 'bg-gray-500'
              } animate-pulse`}></div>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{coin.name}</h3>
            <p className="text-white/60 text-sm uppercase">{coin.symbol}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-white/60 text-xs mb-1">Price</p>
          <p className="text-white font-bold text-xl">
            {formatPrice(coin.priceUsd)}
            {coin.priceChange !== undefined && coin.priceChange !== 0 && (
              <span className={`ml-2 text-xs ${coin.priceChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {coin.priceChange > 0 ? '↑' : '↓'} {Math.abs(coin.priceChange).toFixed(2)}%
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs mb-1">24h Change</p>
            <p className={`font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{parseFloat(coin.changePercent24Hr || 0).toFixed(2)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs mb-1">Market Cap</p>
            <p className="text-white font-semibold text-sm">{formatMarketCap(coin.marketCapUsd)}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex-1 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all duration-200 text-sm font-medium"
        >
          View Details
        </button>
        {onBuy && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onBuy(coin);
            }}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 text-sm font-medium"
          >
            Buy
          </button>
        )}
      </div>
    </div>
  );
};

export default CoinCard;

