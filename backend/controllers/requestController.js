const Request = require('../models/Request');
const Book = require('../models/Book');
const Notification = require('../models/Notification');
const Donation = require('../models/Donation');
const { recalculateDonorReputation } = require('../utils/reputation');

exports.createRequest = async (req, res) => {
  try {
    const { bookId, message } = req.body;
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.status !== 'available') return res.status(400).json({ message: 'Book is not available' });
    if (book.donorId.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot request your own book' });

    const existing = await Request.findOne({ bookId, requesterId: req.user._id, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'You already requested this book' });

    const request = await Request.create({
      bookId, requesterId: req.user._id, donorId: book.donorId, message
    });

    book.status = 'requested';
    await book.save();

    await Notification.create({
      userId: book.donorId,
      message: `${req.user.name} requested your book "${book.title}"`,
      type: 'request',
      relatedId: request._id,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserRequests = async (req, res) => {
  try {
    const requests = await Request.find({ requesterId: req.user._id })
      .populate('bookId', 'title author image category ratingsAverage ratingsCount')
      .populate('donorId', 'name profileImage donorReputation')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDonorRequests = async (req, res) => {
  try {
    const requests = await Request.find({ donorId: req.user._id })
      .populate('bookId', 'title author image ratingsAverage ratingsCount')
      .populate('requesterId', 'name profileImage location')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.respondToRequest = async (req, res) => {
  try {
    const { status, responseNote, deliveryMethod } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid request response status' });
    }

    const request = await Request.findById(req.params.id).populate('bookId');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.donorId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Not authorized' });
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been handled' });
    }

    request.status = status;
    request.responseNote = responseNote || '';
    request.responseDate = new Date();
    await request.save();

    const book = await Book.findById(request.bookId);

    if (status === 'approved') {
      book.status = 'adopted';
      await book.save();

      await Donation.create({
        bookId: request.bookId,
        donorId: req.user._id,
        receiverId: request.requesterId,
        requestId: request._id,
        deliveryMethod: deliveryMethod || 'meetup',
      });

      await Notification.create({
        userId: request.requesterId,
        message: `Your request for "${book.title}" has been approved! 🎉`,
        type: 'approval',
        relatedId: request._id,
        link: `/dashboard`,
      });
    } else {
      book.status = 'available';
      await book.save();

      await Notification.create({
        userId: request.requesterId,
        message: `Your request for "${book.title}" was not approved.`,
        type: 'rejection',
        relatedId: request._id,
        link: `/books/${book._id}`,
      });
    }

    await recalculateDonorReputation(req.user._id);

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
