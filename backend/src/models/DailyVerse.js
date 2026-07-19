const mongoose = require('mongoose');

const dailyVerseSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  verseRef: { type: String },          // e.g. "John 3:16"
  verseTextEn: { type: String },       // English verse
  verseTextTa: { type: String },       // Tamil verse (if available)
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('DailyVerse', dailyVerseSchema);
