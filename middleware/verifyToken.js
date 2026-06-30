const jwt = require('jsonwebtoken');
const { fromNodeHeaders } = require('better-auth/node');
const { auth } = require('../auth');

// Authenticates a request against a private API.
// 1) Prefers a JWT in the Authorization header (issued by GET /api/jwt from a
//    verified Better Auth session) — this is the "verify JWT in backend" path.
// 2) Falls back to the Better Auth session cookie, so requests still work even
//    before the client has fetched its JWT.
// Either way it sets req.decoded.email so verifyRole / verifySelf are unchanged.
// Note: verifyRole re-reads the role from the database, so role checks are never
// based on a stale token claim.
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1) JWT bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      req.decoded = { email: decoded.email, role: decoded.role };
      return next();
    } catch {
      // Not a valid app JWT — fall through to the session check below.
    }
  }

  // 2) Better Auth session
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session?.user) {
      return res.status(401).send({ message: 'Unauthorized access' });
    }
    req.decoded = { email: session.user.email, id: session.user.id };
    req.user = session.user;
    return next();
  } catch (err) {
    return res.status(401).send({ message: 'Invalid or expired session' });
  }
};

module.exports = verifyToken;
