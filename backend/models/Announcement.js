import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: String,
  message: String,
  active: {
    type: Boolean,
    default: true
  },
  createdBy: String
}, { timestamps: true });

export default mongoose.model("Announcement", announcementSchema);