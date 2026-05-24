import mongoose from "mongoose";

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

export default mongoose.model("Report", reportSchema);