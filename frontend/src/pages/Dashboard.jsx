import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCrypto } from '../context/CryptoContext';
import CoinCard from '../components/CoinCard';
import CoinDetailModal from '../components/CoinDetailModal';
import BuyModal from '../components/BuyModal';
import vantexLogo from '../assets/WhatsApp_Image_2025-12-06_at_11.10.34_PM-removebg-preview.png';

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { coins, loading, error, isConnected } = useCrypto();
  const [selectedCoin, setSelectedCoin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [buyCoin, setBuyCoin] = useState(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleCoinClick = (coin) => {
    setSelectedCoin(coin);
    setIsModalOpen(true);
  };

  const handleBuyClick = (coin) => {
    setBuyCoin(coin);
    setIsBuyModalOpen(true);
  };

  const handleBuySuccess = () => {
    // Optionally refresh data or show success message
    setIsBuyModalOpen(false);
    setBuyCoin(null);
  };

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navbar */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <img 
                  src={vantexLogo} 
                  alt="VANTEX Logo" 
                  className="w-10 h-10 object-contain"
                />
              </div>
              <div>
                <h1 className="text-white font-bold text-xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  VANTEX
                </h1>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-white/60 text-xs">{isConnected ? 'Live' : 'Offline'}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-white/80 hidden sm:block">Welcome, {user?.firstName}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-white rounded-lg hover:bg-red-500/30 transition-all duration-200"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-2 border-t border-white/10 pt-4 mt-4">
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
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
            Top Cryptocurrencies
          </h2>
          <p className="text-white/60">Real-time prices and market data</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-white/60">Loading cryptocurrencies...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 text-center">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Coins Grid */}
        {!loading && !error && (
          <>
            {filteredCoins.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-white/60 text-lg">No cryptocurrencies found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCoins.map((coin) => (
                  <CoinCard
                    key={coin.id}
                    coin={coin}
                    onClick={() => handleCoinClick(coin)}
                    onBuy={handleBuyClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Stats Footer */}
        {!loading && !error && coins.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-white/60 text-sm mb-2">Total Market Cap</p>
              <p className="text-white font-bold text-2xl">
                ${(coins.reduce((sum, coin) => sum + parseFloat(coin.marketCapUsd || 0), 0) / 1e12).toFixed(2)}T
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-white/60 text-sm mb-2">Total Volume (24h)</p>
              <p className="text-white font-bold text-2xl">
                ${(coins.reduce((sum, coin) => sum + parseFloat(coin.volumeUsd24Hr || 0), 0) / 1e9).toFixed(2)}B
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <p className="text-white/60 text-sm mb-2">Active Coins</p>
              <p className="text-white font-bold text-2xl">{coins.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Coin Detail Modal */}
      {selectedCoin && (
        <CoinDetailModal
          coin={selectedCoin}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedCoin(null);
          }}
        />
      )}

      {/* Buy Modal */}
      {buyCoin && (
        <BuyModal
          coin={buyCoin}
          isOpen={isBuyModalOpen}
          onClose={() => {
            setIsBuyModalOpen(false);
            setBuyCoin(null);
          }}
          onSuccess={handleBuySuccess}
        />
      )}
    </div>
  );
};

export default Dashboard;

