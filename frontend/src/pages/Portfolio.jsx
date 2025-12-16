import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCrypto } from '../context/CryptoContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AddFundsModal from '../components/AddFundsModal';
import SellModal from '../components/SellModal';
import vantexLogo from '../assets/WhatsApp_Image_2025-12-06_at_11.10.34_PM-removebg-preview.png';

const Portfolio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { coins, isConnected } = useCrypto();
  const { user, fetchUser } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [summary, setSummary] = useState({
    cashBalance: 0,
    totalInvested: 0,
    totalValue: 0,
    totalPnL: 0,
    totalPnLPercent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [sellItem, setSellItem] = useState(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  
  // Use refs to track portfolio and summary to avoid infinite loops
  const portfolioRef = useRef(portfolio);
  const summaryRef = useRef(summary);
  
  // Update refs when state changes
  useEffect(() => {
    portfolioRef.current = portfolio;
  }, [portfolio]);
  
  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Update portfolio values when coin prices change
  useEffect(() => {
    const currentPortfolio = portfolioRef.current;
    const currentSummary = summaryRef.current;
    
    if (currentPortfolio.length > 0 && coins.length > 0) {
      // Only recalculate when coins change, not when portfolio changes
      // This prevents infinite loop
      calculatePortfolioValue(currentPortfolio, currentSummary);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coins]); // Only depend on coins, not portfolio

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching portfolio data...');
      const [portfolioRes, summaryRes, transactionsRes] = await Promise.all([
        api.get('/portfolio'),
        api.get('/portfolio/summary'),
        api.get('/transactions?limit=50'),
      ]);

      const portfolioData = portfolioRes.data.data || [];
      setPortfolio(portfolioData);
      const summaryData = summaryRes.data.data || {};
      setTransactions(transactionsRes.data.data || []);
      
      console.log('📊 Portfolio summary data:', summaryData);
      console.log(`💰 Cash balance from API: $${summaryData.cashBalance}`);
      
      // Initialize summary with actual data (no hardcoded values)
      const cashBalance = parseFloat(summaryData.cashBalance) || 0;
      const initialSummary = {
        cashBalance: cashBalance,
        totalInvested: parseFloat(summaryData.totalInvested) || 0,
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercent: 0,
      };
      
      console.log(`💰 Setting cash balance to: $${cashBalance}`);
      setSummary(initialSummary);

      // Calculate current values from actual portfolio data
      if (portfolioData.length > 0 && coins.length > 0) {
        calculatePortfolioValue(portfolioData, summaryData);
      }
    } catch (error) {
      console.error('❌ Error fetching portfolio:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioValue = (portfolioData, summaryData) => {
    if (!portfolioData || !portfolioData.length || !coins.length) {
      return;
    }

    let totalValue = 0;
    const portfolioWithPrices = portfolioData.map((item) => {
      const coin = coins.find((c) => c.id === item.cryptoId);
      const currentPrice = parseFloat(coin?.priceUsd || 0);
      const value = item.amount * currentPrice;
      const pnl = value - item.totalInvested;
      const pnlPercent = item.totalInvested > 0 ? (pnl / item.totalInvested) * 100 : 0;

      totalValue += value;

      return {
        ...item,
        currentPrice,
        value,
        pnl,
        pnlPercent,
      };
    });

    const totalPnL = totalValue - (summaryData.totalInvested || 0);
    const totalPnLPercent =
      summaryData.totalInvested > 0 ? (totalPnL / summaryData.totalInvested) * 100 : 0;

    setPortfolio(portfolioWithPrices);
    setSummary((prev) => ({
      ...prev,
      totalValue,
      totalPnL,
      totalPnLPercent,
    }));
  };

  const handleSellClick = (portfolioItem) => {
    setSellItem(portfolioItem);
    setIsSellModalOpen(true);
  };

  const handleSellSuccess = () => {
    setIsSellModalOpen(false);
    setSellItem(null);
    fetchPortfolio();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <div className="text-white/60">Loading portfolio...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <img 
                  src={vantexLogo} 
                  alt="VANTEX Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                VANTEX
              </h1>
              <span className="text-white/60 text-xl">•</span>
              <h2 className="text-2xl font-bold text-white">Portfolio</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-white/60 text-sm">{isConnected ? 'Live' : 'Offline'}</span>
              </div>
              <button
                onClick={() => setShowAddFunds(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
              >
                Add Funds
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                navigate('/dashboard', { replace: false });
                setTimeout(() => window.scrollTo(0, 0), 100);
              }}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                location.pathname === '/dashboard'
                  ? 'text-white border-purple-500'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/portfolio', { replace: false });
                setTimeout(() => window.scrollTo(0, 0), 100);
              }}
              className={`px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 ${
                location.pathname === '/portfolio'
                  ? 'text-white border-purple-500'
                  : 'text-white/60 border-transparent hover:text-white hover:border-white/30'
              }`}
            >
              Portfolio
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm mb-2">Total Portfolio Value</p>
            <p className="text-white font-bold text-2xl">{formatPrice(summary.totalValue + summary.cashBalance)}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm mb-2">Cash Balance</p>
            <p className="text-white font-bold text-2xl">{formatPrice(summary.cashBalance)}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm mb-2">Total P&L</p>
            <p className={`font-bold text-2xl ${summary.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.totalPnL >= 0 ? '+' : ''}{formatPrice(summary.totalPnL)}
            </p>
            <p className={`text-sm mt-1 ${summary.totalPnLPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {summary.totalPnLPercent >= 0 ? '+' : ''}{summary.totalPnLPercent.toFixed(2)}%
            </p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm mb-2">Total Invested</p>
            <p className="text-white font-bold text-2xl">{formatPrice(summary.totalInvested)}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <p className="text-white/60 text-sm mb-2">Buying Power</p>
            <p className="text-white font-bold text-2xl">{formatPrice(summary.cashBalance)}</p>
          </div>
        </div>

        {/* Portfolio Table */}
        {portfolio.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-12 border border-white/10 text-center">
            <p className="text-white/60 text-lg mb-4">Your portfolio is empty</p>
            <p className="text-white/40 text-sm">Start buying cryptocurrencies to build your portfolio</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase">Coin</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">Quantity</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">Avg Buy Price</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">Current Price</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">Value</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">P&L</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-white/60 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {portfolio.map((item) => (
                    <tr key={item._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getCoinIcon(item.cryptoSymbol)}
                            alt={item.cryptoName}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              e.target.src = `https://cryptoicons.org/api/icon/${item.cryptoSymbol.toLowerCase()}/200`;
                            }}
                          />
                          <div>
                            <p className="text-white font-semibold">{item.cryptoName}</p>
                            <p className="text-white/60 text-sm">{item.cryptoSymbol}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-white">{item.amount.toFixed(6)}</td>
                      <td className="px-6 py-4 text-right text-white">{formatPrice(item.averagePrice)}</td>
                      <td className="px-6 py-4 text-right text-white">{formatPrice(item.currentPrice || 0)}</td>
                      <td className="px-6 py-4 text-right text-white font-semibold">{formatPrice(item.value || 0)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <p className={`font-semibold ${item.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {item.pnl >= 0 ? '+' : ''}{formatPrice(item.pnl || 0)}
                          </p>
                          <p className={`text-sm ${item.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {item.pnlPercent >= 0 ? '+' : ''}{(item.pnlPercent || 0).toFixed(2)}%
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleSellClick(item)}
                          className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 text-sm"
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Transaction History</h2>
            <button
              onClick={() => setShowTransactions(!showTransactions)}
              className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg hover:bg-white/10 transition-all duration-200 text-sm"
            >
              {showTransactions ? 'Hide' : 'Show'} Transactions
            </button>
          </div>

          {showTransactions && (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-white/60 text-lg mb-4">No transactions yet</p>
                  <p className="text-white/40 text-sm">Your buy and sell transactions will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase">Coin</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">Quantity</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">Price</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-white/60 uppercase">Total Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {transactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-white/80 text-sm">
                            {new Date(transaction.timestamp || transaction.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              transaction.type === 'buy' 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/50'
                            }`}>
                              {transaction.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-semibold">{transaction.cryptoName}</span>
                              <span className="text-white/60 text-sm">({transaction.cryptoSymbol})</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right text-white">{parseFloat(transaction.amount).toFixed(6)}</td>
                          <td className="px-6 py-4 text-right text-white">{formatPrice(transaction.price)}</td>
                          <td className="px-6 py-4 text-right text-white font-semibold">{formatPrice(transaction.totalValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddFunds && (
        <AddFundsModal
          isOpen={showAddFunds}
          onClose={() => setShowAddFunds(false)}
          onSuccess={async () => {
            setShowAddFunds(false);
            // Refresh user data to get updated balance
            await fetchUser();
            // Refresh portfolio to show updated balance
            await fetchPortfolio();
          }}
        />
      )}

      {isSellModalOpen && sellItem && (
        <SellModal
          portfolioItem={sellItem}
          isOpen={isSellModalOpen}
          onClose={() => {
            setIsSellModalOpen(false);
            setSellItem(null);
          }}
          onSuccess={handleSellSuccess}
        />
      )}
    </div>
  );
};

export default Portfolio;

