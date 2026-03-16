const Donation = require('../models/Donation');

exports.getDonations = async (req, res) => {
  try {
    const donations = await Donation.find({
      $or: [{ donorId: req.user._id }, { receiverId: req.user._id }]
    })
      .populate('bookId', 'title author image')
      .populate('donorId', 'name profileImage')
      .populate('receiverId', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDonationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    donation.status = status;
    await donation.save();
    res.json(donation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
