const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  blocked: {
    type: Boolean,
    default: false
  },
  shadowBanned: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    default: 'user'
  },
  collegeVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    default: 'pending'
  },
  lastLoginAt: String,
  lastLoginIp: String,
  reportCount: {
    type: Number,
    default: 0
  },
  riskScore: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model("User", userSchema);