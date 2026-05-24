import mongoose from "mongoose";

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

export default mongoose.model("Message", messageSchema);
