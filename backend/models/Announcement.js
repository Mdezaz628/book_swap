const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: String,
  message: String,
  active: {
    type: Boolean,
    default: true
  },
  createdBy: String
}, { timestamps: true });

module.exports = mongoose.model('Announcement', announcementSchema);