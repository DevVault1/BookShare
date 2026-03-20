const Book = require('../models/Book');
const path = require('path');

exports.getBooks = async (req, res) => {
  try {
    const { search, category, condition, status = 'available', page = 1, limit = 12 } = req.query;
    const query = { status };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (condition) query.condition = condition;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .populate('donorId', 'name profileImage location donorReputation')
      .sort({ ratingsAverage: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ books, total, pages: Math.ceil(total / limit), page: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('donorId', 'name profileImage location email donorReputation');
    if (!book) return res.status(404).json({ message: 'Book not found' });
    book.views += 1;
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, author, category, condition, description, location, isbn, language, pages, tags } = req.body;

    if (!title || !author || !category || !condition) {
      return res.status(400).json({ message: 'Missing required fields: title, author, category, condition' });
    }

    let image = '';
    if (req.file) {
      const filePath = String(req.file.path || '');
      const normalized = filePath.replace(/\\/g, '/');
      if (/^https?:\/\//i.test(normalized)) {
        image = normalized;
      } else {
        const idx = normalized.lastIndexOf('/uploads/');
        const rel = idx >= 0 ? normalized.slice(idx) : `/uploads/${path.basename(normalized)}`;
        image = `${req.protocol}://${req.get('host')}${rel}`;
      }
    }

    const bookData = {
      title, author, category, condition, description,
      location: location || req.user.location,
      isbn, language,
      tags: tags ? tags.split(',').map((t) => t.trim()) : [],
      image,
      donorId: req.user._id,
    };

    if (pages && pages !== '') {
      bookData.pages = Number(pages);
    }

    const book = await Book.create(bookData);

    res.status(201).json(book);
  } catch (err) {
    console.error('Create book error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    const updates = req.body;
    if (req.file) updates.image = req.file.path;
    const updated = await Book.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.donorId.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });

    await book.deleteOne();
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserBooks = async (req, res) => {
  try {
    const books = await Book.find({ donorId: req.user._id }).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const interests = req.user.interests || [];
    const query = interests.length > 0
      ? { status: 'available', $or: [{ category: { $in: interests } }, { tags: { $in: interests } }] }
      : { status: 'available' };

    const books = await Book.find(query)
      .populate('donorId', 'name profileImage location donorReputation')
      .sort({ ratingsAverage: -1, views: -1, createdAt: -1 })
      .limit(8);

    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
