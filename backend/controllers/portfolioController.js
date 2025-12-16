const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Get user's portfolio with current prices
exports.getPortfolio = async (req, res) => {
  try {
    const userId = req.user.userId;
    const portfolio = await Portfolio.find({ userId });

    res.json({
      success: true,
      count: portfolio.length,
      data: portfolio,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio',
      error: error.message,
    });
  }
};

// Get portfolio summary with totals
exports.getPortfolioSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Don't use .select() - balance is not in select: false, so it's accessible by default
    const user = await User.findById(userId);
    const portfolio = await Portfolio.find({ userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Ensure balance is a number
    const cashBalance = typeof user.balance === 'number' ? user.balance : 0;

    const summary = {
      cashBalance: cashBalance,
      totalCryptos: portfolio.length,
      totalInvested: portfolio.reduce((sum, item) => sum + (item.totalInvested || 0), 0),
      cryptos: portfolio.map((item) => ({
        id: item._id,
        cryptoId: item.cryptoId,
        symbol: item.cryptoSymbol,
        name: item.cryptoName,
        amount: item.amount,
        averagePrice: item.averagePrice,
        totalInvested: item.totalInvested,
      })),
    };

    console.log(`📊 Portfolio summary for user ${userId}: Cash Balance = $${cashBalance}`);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio summary',
      error: error.message,
    });
  }
};

// Add or update portfolio entry (called after transaction)
exports.updatePortfolio = async (userId, cryptoData, transactionType, amount, price) => {
  try {
    const { id: cryptoId, symbol: cryptoSymbol, name: cryptoName } = cryptoData;

    let portfolio = await Portfolio.findOne({ userId, cryptoId });

    if (transactionType === 'buy') {
      if (portfolio) {
        // Update existing portfolio
        const newTotalInvested = portfolio.totalInvested + (amount * price);
        const newAmount = portfolio.amount + amount;
        const newAveragePrice = newTotalInvested / newAmount;

        portfolio.amount = newAmount;
        portfolio.averagePrice = newAveragePrice;
        portfolio.totalInvested = newTotalInvested;
        portfolio.lastUpdated = new Date();
        await portfolio.save();
      } else {
        // Create new portfolio entry
        portfolio = await Portfolio.create({
          userId,
          cryptoId,
          cryptoSymbol: cryptoSymbol.toUpperCase(),
          cryptoName,
          amount,
          averagePrice: price,
          totalInvested: amount * price,
        });
      }
    } else if (transactionType === 'sell') {
      if (portfolio && portfolio.amount >= amount) {
        portfolio.amount -= amount;
        portfolio.totalInvested = portfolio.amount * portfolio.averagePrice;
        portfolio.lastUpdated = new Date();

        if (portfolio.amount === 0) {
          await Portfolio.findByIdAndDelete(portfolio._id);
          return null;
        }

        await portfolio.save();
      } else {
        throw new Error('Insufficient amount in portfolio');
      }
    }

    return portfolio;
  } catch (error) {
    throw error;
  }
};
