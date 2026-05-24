import mongoose from "mongoose";

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

export default mongoose.model("DealVerification", dealVerificationSchema);