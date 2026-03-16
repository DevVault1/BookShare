const User = require('../models/User');
const Book = require('../models/Book');
const Request = require('../models/Request');
const Donation = require('../models/Donation');

exports.getStats = async (req, res) => {
  try {
    const [users, books, requests, donations] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      Request.countDocuments(),
      Donation.countDocuments(),
    ]);

    const booksByStatus = await Book.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const booksByCategory = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentBooks = await Book.find().populate('donorId', 'name').sort({ createdAt: -1 }).limit(5);

    res.json({ users, books, requests, donations, booksByStatus, booksByCategory, recentUsers, recentBooks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = search ? { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] } : {};
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const total = await Book.countDocuments();
    const books = await Book.find().populate('donorId', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    res.json({ books, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate('bookId', 'title author')
      .populate('requesterId', 'name email')
      .populate('donorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
