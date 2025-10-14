// JWT authentication middleware
const jwt = require('jsonwebtoken');

// Protect routes by verifying JWT token passed in Authorization header
function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const secret = process.env.JWT_SECRET || 'devsecret';
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = { auth };


