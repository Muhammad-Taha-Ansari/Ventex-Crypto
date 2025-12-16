import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useCrypto } from '../context/CryptoContext';
import api from '../services/api';

const SellModal = ({ portfolioItem, isOpen, onClose, onSuccess }) => {
  const { coins } = useCrypto();
  const [quantity, setQuantity] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs to track which field user is editing to prevent circular updates
  const isUpdatingFromQuantity = useRef(false);
  const isUpdatingFromUsd = useRef(false);
  const lastPriceUpdate = useRef(Date.now());

  const availableAmount = portfolioItem?.amount || 0;
  const coin = coins.find((c) => c.id === portfolioItem?.cryptoId);

  // Update price only when coin changes or every 2 seconds (debounce rapid updates)
  useEffect(() => {
    if (coin && coin.priceUsd) {
      const now = Date.now();
      // Only update price if it's been at least 2 seconds since last update
      if (now - lastPriceUpdate.current > 2000) {
        setCurrentPrice(parseFloat(coin.priceUsd) || 0);
        lastPriceUpdate.current = now;
      }
    }
  }, [coin]);

  // Update USD amount when quantity changes (only if user typed quantity)
  useEffect(() => {
    if (isUpdatingFromQuantity.current) {
      isUpdatingFromQuantity.current = false;
      if (quantity && currentPrice) {
        const amount = parseFloat(quantity) * currentPrice;
        if (!isNaN(amount)) {
          setUsdAmount(amount.toFixed(2));
        }
      } else if (!quantity) {
        setUsdAmount('');
      }
    }
  }, [quantity, currentPrice]);

  // Update quantity when USD amount changes (only if user typed USD)
  useEffect(() => {
    if (isUpdatingFromUsd.current) {
      isUpdatingFromUsd.current = false;
      if (usdAmount && currentPrice) {
        const qty = parseFloat(usdAmount) / currentPrice;
        if (!isNaN(qty) && qty > 0) {
          setQuantity(qty.toFixed(6));
        }
      } else if (!usdAmount) {
        setQuantity('');
      }
    }
  }, [usdAmount, currentPrice]);

  const handleSell = async () => {
    const qtyToSell = parseFloat(quantity);
    
    if (!quantity || qtyToSell <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (qtyToSell > availableAmount) {
      setError(`You can only sell up to ${availableAmount.toFixed(6)} ${portfolioItem.cryptoSymbol}`);
      return;
    }

    if (!currentPrice || currentPrice <= 0) {
      setError('Invalid price');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/transactions', {
        type: 'sell',
        cryptoId: portfolioItem.cryptoId,
        cryptoSymbol: portfolioItem.cryptoSymbol,
        cryptoName: portfolioItem.cryptoName,
        amount: qtyToSell,
        price: currentPrice,
      });

      const totalRevenue = qtyToSell * currentPrice;
      const estimatedPnL = totalRevenue - (qtyToSell * avgBuyPrice);
      const estimatedPnLPercent = avgBuyPrice > 0 ? ((estimatedPnL / (qtyToSell * avgBuyPrice)) * 100) : 0;
      const newBalance = response.data.data?.newBalance;

      // Show success notification
      await Swal.fire({
        icon: 'success',
        title: 'Sale Successful!',
        html: `
          <div style="text-align: center;">
            <p style="font-size: 18px; margin-bottom: 10px;">You sold ${qtyToSell.toFixed(6)} ${portfolioItem.cryptoSymbol}</p>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="color: #9ca3af; margin-bottom: 5px;">Quantity Sold</p>
              <p style="font-size: 20px; font-weight: bold; color: white; margin-bottom: 15px;">
                ${qtyToSell.toFixed(6)} ${portfolioItem.cryptoSymbol}
              </p>
              <p style="color: #9ca3af; margin-bottom: 5px;">Revenue</p>
              <p style="font-size: 20px; font-weight: bold; color: #10b981; margin-bottom: 15px;">
                $${totalRevenue.toFixed(2)}
              </p>
              <p style="color: #9ca3af; margin-bottom: 5px;">Profit/Loss</p>
              <p style="font-size: 18px; font-weight: bold; color: ${estimatedPnL >= 0 ? '#10b981' : '#ef4444'};">
                ${estimatedPnL >= 0 ? '+' : ''}$${estimatedPnL.toFixed(2)} (${estimatedPnLPercent >= 0 ? '+' : ''}${estimatedPnLPercent.toFixed(2)}%)
              </p>
            </div>
            ${newBalance !== undefined ? `
              <p style="color: #9ca3af; margin-top: 10px;">
                New Balance: <span style="color: white; font-weight: bold;">$${parseFloat(newBalance).toFixed(2)}</span>
              </p>
            ` : ''}
          </div>
        `,
        confirmButtonColor: '#9333ea',
        confirmButtonText: 'Great!',
        timer: 3000,
        timerProgressBar: true,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error selling coin';
      setError(errorMessage);
      
      // Show error notification
      Swal.fire({
        icon: 'error',
        title: 'Sale Failed',
        text: errorMessage,
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSellAll = () => {
    setQuantity(availableAmount.toFixed(6));
    isUpdatingFromQuantity.current = true;
    isUpdatingFromUsd.current = false;
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    if (num < 0.01) return `$${num.toFixed(6)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    if (num < 1000) return `$${num.toFixed(2)}`;
    return `$${(num / 1000).toFixed(2)}K`;
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && portfolioItem && coin) {
      setQuantity('');
      setUsdAmount('');
      setCurrentPrice(parseFloat(coin.priceUsd) || 0);
      setError('');
      isUpdatingFromQuantity.current = false;
      isUpdatingFromUsd.current = false;
      lastPriceUpdate.current = Date.now();
    }
  }, [isOpen, portfolioItem, coin]);

  if (!isOpen || !portfolioItem) return null;

  const avgBuyPrice = portfolioItem.averagePrice || 0;
  const estimatedRevenue = quantity ? parseFloat(quantity) * currentPrice : 0;
  const estimatedPnL = quantity ? estimatedRevenue - (parseFloat(quantity) * avgBuyPrice) : 0;
  const estimatedPnLPercent = quantity && avgBuyPrice > 0 
    ? ((estimatedPnL / (parseFloat(quantity) * avgBuyPrice)) * 100) 
    : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Sell {portfolioItem.cryptoName}</h2>
          <p className="text-white/60 text-sm mb-2">Current Price: {formatPrice(currentPrice)}</p>
          <p className="text-white/60 text-sm mb-6">
            Available: <span className="text-white font-semibold">{availableAmount.toFixed(6)} {portfolioItem.cryptoSymbol}</span>
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-white/80 text-sm">Quantity</label>
                <button
                  onClick={handleSellAll}
                  className="text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  Sell All
                </button>
              </div>
              <input
                type="number"
                step="0.000001"
                min="0"
                max={availableAmount}
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);
                  // Prevent entering more than available
                  if (value === '' || (numValue >= 0 && numValue <= availableAmount)) {
                    setQuantity(value);
                    isUpdatingFromQuantity.current = true;
                    isUpdatingFromUsd.current = false;
                  }
                }}
                placeholder="0.000000"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
              />
              {quantity && parseFloat(quantity) > availableAmount && (
                <p className="text-red-400 text-xs mt-1">
                  Cannot sell more than {availableAmount.toFixed(6)} {portfolioItem.cryptoSymbol}
                </p>
              )}
            </div>

            <div className="text-center text-white/60">OR</div>

            <div>
              <label className="block text-white/80 text-sm mb-2">USD Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={availableAmount * currentPrice}
                value={usdAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);
                  const maxUsd = availableAmount * currentPrice;
                  // Prevent entering more than available
                  if (value === '' || (numValue >= 0 && numValue <= maxUsd)) {
                    setUsdAmount(value);
                    isUpdatingFromUsd.current = true;
                    isUpdatingFromQuantity.current = false;
                  }
                }}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
              />
            </div>

            {quantity && currentPrice && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Quantity to sell:</span>
                  <span className="text-white">{parseFloat(quantity).toFixed(6)} {portfolioItem.cryptoSymbol}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Current price:</span>
                  <span className="text-white">{formatPrice(currentPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Avg buy price:</span>
                  <span className="text-white">{formatPrice(avgBuyPrice)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-white/10">
                  <span className="text-white">Estimated Revenue:</span>
                  <span className="text-white">{formatPrice(estimatedRevenue)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-white/60">Estimated P&L:</span>
                  <span className={`font-semibold ${estimatedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {estimatedPnL >= 0 ? '+' : ''}{formatPrice(estimatedPnL)} ({estimatedPnLPercent >= 0 ? '+' : ''}{estimatedPnLPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSell}
              disabled={loading || !quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > availableAmount}
              className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Sell'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellModal;

