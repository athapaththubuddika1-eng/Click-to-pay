require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const clicksRoutes = require('./routes/clicks');
const withdrawRoutes = require('./routes/withdraw');

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors());

const limiter = rateLimit({ windowMs: 15*60*1000, max: 300 });
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/clicks', clicksRoutes);
app.use('/api/withdraw', withdrawRoutes);

const PORT = process.env.PORT || 4000;
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true })
  .then(()=> {
    console.log('Mongo connected');
    app.listen(PORT, ()=> console.log('Server running on', PORT));
  })
  .catch(err => console.error('Mongo connect error', err));

