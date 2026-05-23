const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  targetId: String,
  targetLabel: String,
  reporterName: String,
  reporterEmail: String,
  reason: String,
  details: String,
  status: {
    type: String,
    default: 'pending'
  },
  adminAction: String,
  riskScore: {
    type: Number,
    default: 0
  },
  createdBy: String
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);