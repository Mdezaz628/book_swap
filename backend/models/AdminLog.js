import mongoose from "mongoose";

const adminLogSchema = new mongoose.Schema({
  adminEmail: String,
  action: String,
  targetType: String,
  targetId: String,
  meta: mongoose.Schema.Types.Mixed,
  ip: String
}, { timestamps: true });

export default mongoose.model("AdminLog", adminLogSchema);