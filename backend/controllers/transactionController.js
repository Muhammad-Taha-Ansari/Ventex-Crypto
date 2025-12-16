const Transaction = require('../models/Transaction');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const portfolioController = require('./portfolioController');

// Get all transactions
exports.getTransactions = async (req, res) => {
  try {
    const { cryptoId, type, limit = 50, page = 1 } = req.query;
    const userId = req.user.userId;

    const query = { userId };
    if (cryptoId) query.cryptoId = cryptoId;
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message,
    });
  }
};

// Create transaction (buy/sell)
exports.createTransaction = async (req, res) => {
  try {
    const { type, cryptoId, cryptoSymbol, cryptoName, amount, price } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!type || !cryptoId || !cryptoSymbol || !cryptoName || amount === undefined || !price) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (amount <= 0 || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount and price must be greater than 0',
      });
    }

    if (!['buy', 'sell'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction type must be either "buy" or "sell"',
      });
    }

    const totalValue = amount * price;

    // Get user balance
    const user = await User.findById(userId).select('balance');

    if (type === 'buy') {
      // Check if user has enough balance
      if (user.balance < totalValue) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance',
        });
      }

      // Deduct from balance
      user.balance -= totalValue;
      await user.save();
    } else if (type === 'sell') {
      // Check if user has enough coins
      const portfolio = await Portfolio.findOne({ userId, cryptoId });
      if (!portfolio || portfolio.amount < amount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient coins in portfolio',
        });
      }

      // Add to balance
      user.balance += totalValue;
      await user.save();
    }

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      type,
      cryptoId,
      cryptoSymbol: cryptoSymbol.toUpperCase(),
      cryptoName,
      amount,
      price,
      totalValue,
    });

    // Update portfolio
    try {
      await portfolioController.updatePortfolio(
        userId,
        { id: cryptoId, symbol: cryptoSymbol, name: cryptoName },
        type,
        amount,
        price
      );
    } catch (portfolioError) {
      // Rollback transaction
      if (type === 'buy') {
        user.balance += totalValue;
      } else {
        user.balance -= totalValue;
      }
      await user.save();
      await Transaction.findByIdAndDelete(transaction._id);
      
      return res.status(400).json({
        success: false,
        message: portfolioError.message,
      });
    }

    // Get updated user balance
    const updatedUser = await User.findById(userId).select('balance');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction,
        newBalance: updatedUser.balance,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message,
    });
  }
};

// Get transaction by ID
exports.getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message,
    });
  }
};
