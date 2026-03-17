const store = require('../models/store');

/**
 * Simple token-based auth middleware.
 * In production, use JWT verification.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const session = store.getSession(token);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  req.user = session;
  next();
}

/**
 * Optional auth — attaches user if token present, but does not block.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const session = store.getSession(token);
    if (session) req.user = session;
  }

  next();
}

module.exports = { authenticate, optionalAuth };
