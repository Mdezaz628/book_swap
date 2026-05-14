const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

  roomId: String,

  sender: String,

  receiver: String,

  message: String,

  time: String

}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
