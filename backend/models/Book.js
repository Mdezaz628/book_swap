const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({

  title: String,

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

module.exports = mongoose.model("Book", bookSchema);