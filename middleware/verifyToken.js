const jwt = require('jsonwebtoken');

// Verifies the JWT sent in the Authorization header (Bearer token).
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: 'Invalid or expired token' });
    req.decoded = decoded;
    next();
  });
};

module.exports = verifyToken;
