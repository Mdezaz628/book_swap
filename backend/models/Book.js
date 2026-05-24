import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({

  title: String,

  author: String,

  writer: String,

  price: Number,

  seller: String,

  category: String,

  location: String,

  images: [String],
  featured: {
    type: String,
    default: ''
  },
  reviewStatus: {
    type: String,
    default: 'pending'
  },
  reportCount: {
    type: Number,
    default: 0
  },
  suspiciousScore: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

export default mongoose.model("Book", bookSchema);