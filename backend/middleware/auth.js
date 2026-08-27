const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token missing or invalid format.' });
  }

  const token = authHeader.split(' ')[1];

  if (!token || token === 'undefined' || token === 'null' || token === '[object Object]' || token.split('.').length !== 3) {
    return res.status(401).json({ success: false, message: 'Malformed authentication token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token verification failed: ' + err.message });
  }
};

module.exports = verifyToken;