const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  email: { type: String, default: '' },
  passwordHash: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  referrals: { type: Number, default: 0 },
  referredBy: { type: String, default: null },
  lastClickAt: { type: Date, default: null },
  captchaCount: { type: Number, default: 0 }
});
module.exports = mongoose.model('User', userSchema);

