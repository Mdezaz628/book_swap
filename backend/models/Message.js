const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

  roomId: String,

  sender: String,

  receiver: String,

  message: String,

  time: String,

  unread: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
