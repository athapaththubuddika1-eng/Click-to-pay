const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const CLICK_REWARD = 5; // per latest request
const CAPTCHA_REWARD = 10;
const MIN_INTERVAL_MS = 4000; // short server-side anti-abuse

router.post('/open-ad', auth, async (req,res)=>{
  try{
    const userId = req.user.userId;
    const user = await User.findOne({ userId });
    if(!user) return res.status(404).json({ error: 'user not found' });

    const now = Date.now();
    if(user.lastClickAt && (now - user.lastClickAt.getTime()) < MIN_INTERVAL_MS){
      return res.status(429).json({ error: 'clicks too fast' });
    }

    user.lastClickAt = new Date();
    user.balance += CLICK_REWARD;
    await user.save();

    await Transaction.create({ userId, type: 'click', amount: CLICK_REWARD, meta:{}, status:'processed' });
    return res.json({ ok:true, added: CLICK_REWARD, balance: user.balance });
  }catch(err){ console.error(err); res.status(500).json({ error: 'server' }); }
});

router.post('/captcha', auth, async (req,res)=>{
  try{
    const userId = req.user.userId;
    const user = await User.findOne({ userId });
    if(!user) return res.status(404).json({ error:'user not found' });
    user.balance += CAPTCHA_REWARD;
    user.captchaCount = (user.captchaCount || 0) + 1;
    await user.save();
    await Transaction.create({ userId, type:'captcha', amount: CAPTCHA_REWARD, status:'processed' });
    res.json({ ok:true, added: CAPTCHA_REWARD, balance: user.balance });
  }catch(err){ console.error(err); res.status(500).json({ error:'server' }); }
});

module.exports = router;
