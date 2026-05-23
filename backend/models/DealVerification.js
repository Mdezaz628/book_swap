const mongoose = require('mongoose');

const dealVerificationSchema = new mongoose.Schema({
  roomId: String,
  buyer: String,
  seller: String,
  price: Number,
  date: String,
  time: String,
  code: String,
  confirmedBy: String,
  confirmedAt: String,
  status: {
    type: String,
    default: 'completed'
  },
  riskScore: {
    type: Number,
    default: 0
  },
  confirmations: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('DealVerification', dealVerificationSchema);