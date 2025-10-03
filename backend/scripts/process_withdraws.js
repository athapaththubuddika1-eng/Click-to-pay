require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const faucet = require('../services/faucetpay');

(async ()=>{
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });
  const pending = await Transaction.find({ type:'withdraw_request', status:'pending' }).limit(20);
  for(const tx of pending){
    try{
      const dest = tx.meta.dest; const method = tx.meta.method;
      if(method === 'faucetpay'){
        // amount stored as negative value e.g. -5000 coins; convert coins -> fiat/crypto value as needed
        // For simplicity assume conversion: 1000 coins = 0.1 USDT (use your conversion)
        const coins = Math.abs(tx.amount);
        const usdtAmount = (coins / 1000) * 0.1; // adjust to your exchange rate
        const res = await faucet.sendToFaucetPay(dest, usdtAmount.toString(), 'withdraw ' + tx._id);
        if(res && (res.status === 'success' || res.success === true)){
          tx.status = 'processed';
          tx.meta.payout = res;
          await tx.save();
        } else {
          console.error('FaucetPay failed', res);
          // leave pending for manual review
        }
      } else {
        console.log('Manual processing required for method', method);
      }
    }catch(e){ console.error('process failed for', tx._id, e); }
  }
  process.exit(0);
})();
