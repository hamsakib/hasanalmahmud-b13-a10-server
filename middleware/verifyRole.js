import { collections } from '../db.js';

// Role-based authorization. Pass allowed roles, e.g. verifyRole('admin', 'seller').
// Must run after verifyToken so req.decoded.email is available.
const verifyRole = (...roles) => async (req, res, next) => {
  const email = req.decoded?.email;
  const user = await collections.users.findOne({ email });
  if (!user || !roles.includes(user.role)) {
    return res.status(403).send({ message: 'Forbidden: insufficient permissions' });
  }
  req.currentUser = user;
  next();
};

// Ensures the token's email matches the :email route param.
const verifySelf = (req, res, next) => {
  if (req.decoded.email !== req.params.email) {
    return res.status(403).send({ message: 'Forbidden access' });
  }
  next();
};

export { verifyRole, verifySelf };
