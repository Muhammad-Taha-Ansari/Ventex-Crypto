import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useCrypto } from '../context/CryptoContext';
import api from '../services/api';

const BuyModal = ({ coin, isOpen, onClose, onSuccess }) => {
  const { coins } = useCrypto();
  const [quantity, setQuantity] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState(coin?.priceUsd || '0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Refs to track which field user is editing to prevent circular updates
  const isUpdatingFromQuantity = useRef(false);
  const isUpdatingFromUsd = useRef(false);
  const lastPriceUpdate = useRef(Date.now());

  // Update price only when coin changes or every 2 seconds (debounce rapid updates)
  useEffect(() => {
    if (coin && coins.length > 0) {
      const updatedCoin = coins.find((c) => c.id === coin.id);
      if (updatedCoin && updatedCoin.priceUsd) {
        const now = Date.now();
        // Only update price if it's been at least 2 seconds since last update
        // This prevents flickering from rapid WebSocket updates
        if (now - lastPriceUpdate.current > 2000) {
          setCurrentPrice(updatedCoin.priceUsd);
          lastPriceUpdate.current = now;
        }
      }
    }
  }, [coin, coins]);

  // Update USD amount when quantity changes (only if user typed quantity)
  useEffect(() => {
    if (isUpdatingFromQuantity.current) {
      isUpdatingFromQuantity.current = false;
      if (quantity && currentPrice) {
        const amount = parseFloat(quantity) * parseFloat(currentPrice);
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
        const qty = parseFloat(usdAmount) / parseFloat(currentPrice);
        if (!isNaN(qty) && qty > 0) {
          setQuantity(qty.toFixed(6));
        }
      } else if (!usdAmount) {
        setQuantity('');
      }
    }
  }, [usdAmount, currentPrice]);

  const handleBuy = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (!currentPrice || parseFloat(currentPrice) <= 0) {
      setError('Invalid price');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await api.post('/transactions', {
        type: 'buy',
        cryptoId: coin.id,
        cryptoSymbol: coin.symbol,
        cryptoName: coin.name,
        amount: parseFloat(quantity),
        price: parseFloat(currentPrice),
      });

      const totalCost = parseFloat(quantity) * parseFloat(currentPrice);
      const newBalance = response.data.data?.newBalance;

      // Show success notification
      await Swal.fire({
        icon: 'success',
        title: 'Purchase Successful!',
        html: `
          <div style="text-align: center;">
            <p style="font-size: 18px; margin-bottom: 10px;">You bought ${parseFloat(quantity).toFixed(6)} ${coin.symbol}</p>
            <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="color: #9ca3af; margin-bottom: 5px;">Quantity</p>
              <p style="font-size: 20px; font-weight: bold; color: white; margin-bottom: 15px;">
                ${parseFloat(quantity).toFixed(6)} ${coin.symbol}
              </p>
              <p style="color: #9ca3af; margin-bottom: 5px;">Total Cost</p>
              <p style="font-size: 20px; font-weight: bold; color: #10b981;">
                $${totalCost.toFixed(2)}
              </p>
            </div>
            ${newBalance !== undefined ? `
              <p style="color: #9ca3af; margin-top: 10px;">
                Remaining Balance: <span style="color: white; font-weight: bold;">$${parseFloat(newBalance).toFixed(2)}</span>
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
      const errorMessage = err.response?.data?.message || 'Error purchasing coin';
      setError(errorMessage);
      
      // Show error notification
      Swal.fire({
        icon: 'error',
        title: 'Purchase Failed',
        text: errorMessage,
        confirmButtonColor: '#ef4444',
      });
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && coin) {
      setQuantity('');
      setUsdAmount('');
      setCurrentPrice(coin.priceUsd || '0');
      setError('');
      isUpdatingFromQuantity.current = false;
      isUpdatingFromUsd.current = false;
      lastPriceUpdate.current = Date.now();
    }
  }, [isOpen, coin]);

  if (!isOpen || !coin) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Buy {coin.name}</h2>
          <p className="text-white/60 text-sm mb-6">Current Price: {formatPrice(currentPrice)}</p>

          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm mb-2">Quantity</label>
              <input
                type="number"
                step="0.000001"
                min="0"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  setQuantity(value);
                  // Mark that we're updating from quantity input
                  isUpdatingFromQuantity.current = true;
                  isUpdatingFromUsd.current = false;
                }}
                placeholder="0.000000"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>

            <div className="text-center text-white/60">OR</div>

            <div>
              <label className="block text-white/80 text-sm mb-2">USD Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={usdAmount}
                onChange={(e) => {
                  const value = e.target.value;
                  setUsdAmount(value);
                  // Mark that we're updating from USD input
                  isUpdatingFromUsd.current = true;
                  isUpdatingFromQuantity.current = false;
                }}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              />
            </div>

            {quantity && currentPrice && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Quantity:</span>
                  <span className="text-white">{parseFloat(quantity).toFixed(6)} {coin.symbol}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">Price per coin:</span>
                  <span className="text-white">{formatPrice(currentPrice)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-white/10">
                  <span className="text-white">Total Cost:</span>
                  <span className="text-white">{formatPrice(usdAmount || (parseFloat(quantity) * parseFloat(currentPrice)))}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleBuy}
              disabled={loading || !quantity || parseFloat(quantity) <= 0}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Buy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyModal;

