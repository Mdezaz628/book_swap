import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: String,
  isVerified: {
    type: Boolean,
    default: false
  },
  verifyToken: String,
  verifyTokenExpiresAt: Date,
  resetPasswordToken: String,
  resetPasswordExpiresAt: Date,
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

export default mongoose.model("User", userSchema);