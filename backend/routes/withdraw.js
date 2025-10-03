const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const WITHDRAW_MIN = 5000;

router.post('/request', auth, async (req,res)=>{
  try{
    const { method, dest } = req.body;
    if(method !== 'faucetpay') return res.status(400).json({ error:'Only faucetpay withdrawals allowed in this setup' });

    const userId = req.user.userId;
    const u = await User.findOne({ userId });
    if(!u) return res.status(404).json({ error:'no user' });
    if(u.balance < WITHDRAW_MIN) return res.status(400).json({ error:'min withdraw ' + WITHDRAW_MIN });

    // deduct and create pending tx
    u.balance -= WITHDRAW_MIN;
    await u.save();
    const tx = await Transaction.create({ userId, type:'withdraw_request', amount:-WITHDRAW_MIN, meta:{ method, dest }, status:'pending' });
    return res.json({ ok:true, txId: tx._id });
  }catch(err){ console.error(err); res.status(500).json({ error:'server' }); }
});

// withdraw history for user
router.get('/history', auth, async (req,res)=>{
  try{
    const userId = req.user.userId;
    const rows = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(200);
    res.json({ list: rows });
  }catch(e){ console.error(e); res.status(500).json({ error:'server' }); }
});

// admin list & process (admin header x-admin-key)
router.get('/admin/list', async (req,res)=>{
  const key = req.headers['x-admin-key'];
  if(key !== process.env.ADMIN_KEY) return res.status(403).json({ error:'forbidden' });
  const rows = await Transaction.find({ type:'withdraw_request' }).sort({ createdAt:-1 }).limit(200);
  res.json({ list: rows });
});

router.post('/admin/process', async (req,res)=>{
  const key = req.headers['x-admin-key'];
  if(key !== process.env.ADMIN_KEY) return res.status(403).json({ error:'forbidden' });
  const { txId, action } = req.body;
  const tx = await Transaction.findById(txId);
  if(!tx) return res.status(404).json({ error:'not found' });
  tx.status = (action === 'processed') ? 'processed' : 'rejected';
  await tx.save();
  if(tx.status === 'rejected'){
    const user = await User.findOne({ userId: tx.userId });
    user.balance += Math.abs(tx.amount);
    await user.save();
  }
  res.json({ ok:true });
});

module.exports = router;
