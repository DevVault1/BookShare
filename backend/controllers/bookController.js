const Book = require('../models/Book');
const path = require('path');
const { enrichBookDataFromIsbn, lookupBookMetadataByIsbn, isValidHttpUrl, normalizeIsbn } = require('../utils/bookMetadata');

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

exports.lookupBookByIsbn = async (req, res) => {
  try {
    const metadata = await lookupBookMetadataByIsbn(req.params.isbn || req.query.isbn || '');
    res.json(metadata);
  } catch (err) {
    res.status(err.status || 500).json({ message: err.message, details: err.details || [] });
  }
};

exports.createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      condition,
      description,
      location,
      isbn,
      language,
      pages,
      tags,
      publishedYear,
      externalImageUrl,
    } = req.body;

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
    } else if (isValidHttpUrl(externalImageUrl || '')) {
      image = externalImageUrl;
    }

    let bookData = {
      title,
      author,
      category,
      condition,
      description,
      location: location || req.user.location,
      isbn: normalizeIsbn(isbn || ''),
      language,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      image,
      donorId: req.user._id,
      metadataSource: image ? '' : 'manual',
    };

    if (pages && pages !== '') {
      bookData.pages = Number(pages);
    }
    if (publishedYear && publishedYear !== '') {
      bookData.publishedYear = Number(publishedYear);
    }

    if (bookData.isbn) {
      try {
        bookData = await enrichBookDataFromIsbn(bookData, { overwrite: false });
      } catch (lookupError) {
        console.warn('ISBN lookup during createBook failed:', lookupError.message);
      }
    }

    if (!bookData.title || !bookData.author || !bookData.category || !bookData.condition) {
      return res.status(400).json({ message: 'Missing required fields: title, author, category, condition' });
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

    const updates = { ...req.body };
    if (updates.isbn) updates.isbn = normalizeIsbn(updates.isbn);
    if (req.file) {
      const normalized = String(req.file.path || '').replace(/\\/g, '/');
      updates.image = /^https?:\/\//i.test(normalized)
        ? normalized
        : `${req.protocol}://${req.get('host')}${normalized.lastIndexOf('/uploads/') >= 0 ? normalized.slice(normalized.lastIndexOf('/uploads/')) : `/uploads/${path.basename(normalized)}`}`;
    } else if (isValidHttpUrl(updates.externalImageUrl || '')) {
      updates.image = updates.externalImageUrl;
    }
    delete updates.externalImageUrl;
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
