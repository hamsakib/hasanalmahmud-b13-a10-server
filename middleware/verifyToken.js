const { fromNodeHeaders } = require('better-auth/node');
const { auth } = require('../auth');

// Authenticates the request using the Better Auth session.
// Works with the session cookie or an `Authorization: Bearer <token>` header.
// On success, exposes the user the same way the old JWT middleware did, so
// downstream middleware (verifyRole / verifySelf) keeps working unchanged.
const verifyToken = async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user) {
      return res.status(401).send({ message: 'Unauthorized access' });
    }
    req.decoded = { email: session.user.email, id: session.user.id };
    req.user = session.user;
    next();
  } catch (err) {
    return res.status(401).send({ message: 'Invalid or expired session' });
  }
};

module.exports = verifyToken;
