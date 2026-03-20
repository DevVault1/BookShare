const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const donorReputationSchema = new mongoose.Schema({
  overallScore: { type: Number, default: 0 },
  responseSpeedScore: { type: Number, default: 0 },
  accuracyScore: { type: Number, default: 0 },
  receiverFeedbackScore: { type: Number, default: 0 },
  totalReviewedDonations: { type: Number, default: 0 },
  respondedRequests: { type: Number, default: 0 },
  avgResponseHours: { type: Number, default: 0 },
  lastCalculatedAt: { type: Date },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['donor', 'student', 'admin'], default: 'student' },
  location: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  interests: [{ type: String }],
  bio: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  donorReputation: { type: donorReputationSchema, default: () => ({}) },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
