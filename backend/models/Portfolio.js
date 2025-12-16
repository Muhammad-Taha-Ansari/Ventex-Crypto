const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cryptoId: {
    type: String,
    required: true,
  },
  cryptoSymbol: {
    type: String,
    required: true,
    uppercase: true,
  },
  cryptoName: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative'],
  },
  averagePrice: {
    type: Number,
    required: true,
    min: [0, 'Average price cannot be negative'],
  },
  totalInvested: {
    type: Number,
    required: true,
    min: [0, 'Total invested cannot be negative'],
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster queries
portfolioSchema.index({ userId: 1, cryptoId: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);
