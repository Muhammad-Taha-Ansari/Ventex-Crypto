const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['buy', 'sell'],
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
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative'],
  },
  totalValue: {
    type: Number,
    required: true,
    min: [0, 'Total value cannot be negative'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster queries
transactionSchema.index({ userId: 1, timestamp: -1 });
transactionSchema.index({ userId: 1, cryptoId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);

