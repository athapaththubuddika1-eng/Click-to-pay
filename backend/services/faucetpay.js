const axios = require('axios');

module.exports = {
  async sendToFaucetPay(destEmail, amount, note){
    // FaucetPay merchant API: read docs carefully.
    // This example uses 'merchant_send' endpoint with form-encoded body.
    const payload = new URLSearchParams();
    payload.append('merchant_id', process.env.FAUCETPAY_MERCHANT_ID);
    payload.append('merchant_secret', process.env.FAUCETPAY_API_KEY);
    payload.append('to', destEmail);
    payload.append('amount', amount); // decimal as string
    payload.append('currency', 'USDT'); // pick currency supported
    payload.append('note', note || 'withdraw');

    const res = await axios.post('https://faucetpay.io/api/v1/merchant_send', payload.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return res.data;
  }
};
