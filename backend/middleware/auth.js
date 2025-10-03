const jwt = require('jsonwebtoken');
module.exports = function(req,res,next){
  const token = req.headers['authorization'];
  if(!token) return res.status(401).json({ error:'No token' });
  try {
    const payload = jwt.verify(token.replace('Bearer ',''), process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch(e) {
    return res.status(401).json({ error:'Invalid token' });
  }
}
