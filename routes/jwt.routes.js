const express = require('express');
const jwt = require('jsonwebtoken');
const { fromNodeHeaders } = require('better-auth/node');
const { auth } = require('../auth');

const router = express.Router();

// Issues an app JWT for the currently authenticated Better Auth session.
// The email/role are taken from the verified session (not from the client),
// so the token cannot be forged — this is the secure version of the old
// "trust any email" JWT route. The client sends this JWT as a Bearer token
// on private APIs (see verifyToken).
router.get('/', async (req, res) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session?.user) return res.status(401).send({ message: 'Unauthorized access' });

  const token = jwt.sign(
    { email: session.user.email, role: session.user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.send({ token });
});

module.exports = router;
