import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    default: 'feedback'
  },
  category: String,
  rating: {
    type: Number,
    default: 0
  },
  name: String,
  email: String,
  pageUrl: String,
  targetType: String,
  targetLabel: String,
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'new'
  },
  adminNote: String
}, { timestamps: true });

export default mongoose.model("Feedback", feedbackSchema);