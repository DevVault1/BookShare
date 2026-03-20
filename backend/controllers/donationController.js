const Donation = require('../models/Donation');
const Notification = require('../models/Notification');

exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      $or: [{ donorId: req.user._id }, { receiverId: req.user._id }]
    })
      .populate('bookId', 'title author image ratingsAverage ratingsCount')
      .populate('donorId', 'name profileImage donorReputation')
      .populate('receiverId', 'name profileImage')
      .populate({
        path: 'reviewId',
        populate: [
          { path: 'receiverId', select: 'name profileImage' },
          { path: 'donorId', select: 'name profileImage donorReputation' },
        ],
      })
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDonationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['pending', 'delivered', 'confirmed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid donation status' });
    }

    const donation = await Donation.findById(req.params.id)
      .populate('bookId', 'title')
      .populate('donorId', 'name')
      .populate('receiverId', 'name');

    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    const isDonor = donation.donorId._id.toString() === req.user._id.toString();
    const isReceiver = donation.receiverId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDonor && !isReceiver && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this donation' });
    }

    if (typeof notes === 'string') {
      donation.notes = notes.trim();
    }

    if (status === donation.status) {
      await donation.save();
      return res.json(donation);
    }

    if (status === 'delivered') {
      if (!isDonor && !isAdmin) {
        return res.status(403).json({ message: 'Only the donor can mark a donation as delivered' });
      }
      if (donation.status !== 'pending') {
        return res.status(400).json({ message: 'Only pending donations can be marked as delivered' });
      }
      donation.status = 'delivered';
      donation.deliveredAt = new Date();

      await Notification.create({
        userId: donation.receiverId._id,
        message: `${donation.donorId.name} marked "${donation.bookId.title}" as delivered. Please confirm receipt and leave a review.`,
        type: 'donation',
        relatedId: donation._id,
        link: '/dashboard',
      });
    }

    if (status === 'confirmed') {
      if (!isReceiver && !isAdmin) {
        return res.status(403).json({ message: 'Only the receiver can confirm receipt' });
      }
      if (!['delivered', 'confirmed'].includes(donation.status)) {
        return res.status(400).json({ message: 'The donor should mark the book as delivered first' });
      }
      donation.status = 'confirmed';
      if (!donation.deliveredAt) donation.deliveredAt = new Date();
      if (!donation.confirmedAt) donation.confirmedAt = new Date();

      await Notification.create({
        userId: donation.donorId._id,
        message: `${donation.receiverId.name} confirmed receipt of "${donation.bookId.title}".`,
        type: 'donation',
        relatedId: donation._id,
        link: '/dashboard',
      });
    }

    if (status === 'pending') {
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only an admin can reset a donation back to pending' });
      }
      donation.status = 'pending';
      donation.deliveredAt = undefined;
      donation.confirmedAt = undefined;
    }

    await donation.save();

    const hydratedDonation = await Donation.findById(donation._id)
      .populate('bookId', 'title author image ratingsAverage ratingsCount')
      .populate('donorId', 'name profileImage donorReputation')
      .populate('receiverId', 'name profileImage')
      .populate({
        path: 'reviewId',
        populate: [
          { path: 'receiverId', select: 'name profileImage' },
          { path: 'donorId', select: 'name profileImage donorReputation' },
        ],
      });

    res.json(hydratedDonation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
