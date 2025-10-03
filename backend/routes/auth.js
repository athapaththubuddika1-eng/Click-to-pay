const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/register', async (req,res)=>{
  try{
    const { userId, password, referredBy } = req.body;
    if(!userId) return res.status(400).json({ error: 'userId required' });
    const existing = await User.findOne({ userId });
    if(existing) return res.status(400).json({ error: 'userId taken' });

    const u = new User({ userId, referredBy: referredBy || null });
    if(password) u.passwordHash = await bcrypt.hash(password, 10);
    u.balance += 50; // welcome bonus
    await u.save();

    if(referredBy){
      const ref = await User.findOne({ userId: referredBy });
      if(ref){
        ref.balance += 10; // referral reward per your request: 10 coins
        ref.referrals = (ref.referrals || 0) + 1;
        await ref.save();
        await Transaction.create({ userId: referredBy, type:'referral', amount:10, meta:{ referredUser: u.userId }, status:'processed' });
      }
    }

    const token = jwt.sign({ userId: u.userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, user: { userId: u.userId, balance: u.balance } });
  }catch(err){ console.error(err); res.status(500).json({ error: 'server' }); }
});

// login
router.post('/login', async (req,res)=>{
  try{
    const { userId, password } = req.body;
    const u = await User.findOne({ userId });
    if(!u) return res.status(400).json({ error: 'No such user' });
    if(!u.passwordHash) return res.status(400).json({ error: 'Password not set' });
    const ok = await bcrypt.compare(password, u.passwordHash);
    if(!ok) return res.status(400).json({ error: 'Wrong password' });
    const token = jwt.sign({ userId: u.userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return res.json({ token, user: { userId: u.userId, balance: u.balance }});
  }catch(err){ console.error(err); res.status(500).json({ error: 'server' }); }
});

// me endpoint
router.get('/me', async (req,res)=>{
  const auth = req.headers['authorization'];
  if(!auth) return res.status(401).json({ error:'No token' });
  try{
    const payload = jwt.verify(auth.replace('Bearer ',''), process.env.JWT_SECRET);
    const u = await User.findOne({ userId: payload.userId });
    if(!u) return res.status(404).json({ error:'no user' });
    res.json({ user:{ userId:u.userId, balance:u.balance } });
  }catch(e){ res.status(401).json({ error:'invalid' }); }
});

module.exports = router;
