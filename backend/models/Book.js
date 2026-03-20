const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Technology', 'Literature', 'Arts', 'Children', 'Other']
  },
  description: { type: String, default: '' },
  condition: { type: String, enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'], required: true },
  image: { type: String, default: '' },
  donorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['available', 'requested', 'adopted'], default: 'available' },
  location: { type: String, default: '' },
  isbn: { type: String, default: '' },
  language: { type: String, default: 'English' },
  pages: { type: Number },
  tags: [{ type: String }],
  views: { type: Number, default: 0 },
  ratingsAverage: { type: Number, default: 0 },
  ratingsCount: { type: Number, default: 0 },
  latestReviewAt: { type: Date },
}, { timestamps: true });

bookSchema.index({ title: 'text', author: 'text', category: 'text', description: 'text' });

module.exports = mongoose.model('Book', bookSchema);
