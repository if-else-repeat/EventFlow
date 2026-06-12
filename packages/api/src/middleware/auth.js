const jwt = require('jsonwebtoken');
const SECRET  = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const EXPIRES = process.env.JWT_EXPIRES_IN || '8h';

function signToken(payload) { return jwt.sign(payload, SECRET, { expiresIn: EXPIRES }); }
function verifyToken(token) { return jwt.verify(token, SECRET); }

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ error: 'Authentication required' });
  try {
    req.operator = verifyToken(header.slice(7));
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.operator) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.operator.role))
      return res.status(403).json({ error: `Requires role: ${roles.join(' or ')}` });
    next();
  };
}

module.exports = { signToken, verifyToken, requireAuth, requireRole };
