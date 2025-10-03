const mongoose = require('mongoose');
const txSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['click','captcha','referral','withdraw_request','admin_adjust'], required: true },
  amount: { type: Number, required: true },
  meta: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending','processed','rejected'], default: 'pending' }
});
module.exports = mongoose.model('Transaction', txSchema);
