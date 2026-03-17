const { v4: uuidv4 } = require('uuid');
const store = require('../models/store');

/**
 * POST /api/auth/login
 * Simulates JWT authentication.
 * In production: verify credentials against DB, issue signed JWT.
 */
function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }
  if (!email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  // Simulate auth — any valid email/password combo succeeds
  const nameParts = email.split('@')[0].replace(/[._]/g, ' ').split(' ');
  const name = nameParts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

  const user = {
    id: uuidv4(),
    name: 'Prof. ' + name,
    email,
    role: 'Senior Examiner',
  };

  const token = `token-${uuidv4()}`;
  store.createSession(token, user);

  res.json({
    success: true,
    message: 'Login successful',
    data: { user, token },
  });
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) store.deleteSession(token);
  res.json({ success: true, message: 'Logged out' });
}

/**
 * GET /api/auth/me
 */
function me(req, res) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

  const session = store.getSession(token);
  if (!session) return res.status(401).json({ success: false, message: 'Session expired' });

  const { token: _t, ...user } = session;
  res.json({ success: true, data: user });
}

module.exports = { login, logout, me };
