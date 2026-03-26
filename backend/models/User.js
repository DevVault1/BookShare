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
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: {
    type: String,
    minlength: 6,
    required: function requiredPassword() {
      return !this.googleId && !this.facebookId;
    },
  },
  role: { type: String, enum: ['donor', 'student', 'admin'], default: 'student' },
  location: { type: String, default: '' },
  phoneNumber: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  interests: [{ type: String }],
  bio: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  authProvider: { type: String, enum: ['local', 'google', 'facebook', 'hybrid'], default: 'local' },
  googleId: { type: String, default: '' },
  facebookId: { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorMethod: { type: String, enum: ['email', 'sms'], default: 'email' },
  lastLoginAt: { type: Date },
  donorReputation: { type: donorReputationSchema, default: () => ({}) },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (!this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
