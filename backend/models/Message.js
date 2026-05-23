const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

  roomId: String,

  sender: String,

  receiver: String,

  message: String,

  time: String,

  moderatedStatus: {
    type: String,
    default: 'pending'
  },

  flaggedReason: String,

  isRead: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
