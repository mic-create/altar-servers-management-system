const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    // Extract token securely from HttpOnly cookie
    const token = req.cookies && req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.'
      });
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = verified;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
};

module.exports = verifyToken;