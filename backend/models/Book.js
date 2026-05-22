const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({

  title: String,

  price: Number,

  seller: String,

  category: String,

  location: String,

  images: [String]

});

module.exports = mongoose.model("Book", bookSchema);