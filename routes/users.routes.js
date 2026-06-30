const express = require('express');
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { verifyRole, verifySelf } = require('../middleware/verifyRole');

const router = express.Router();

// User creation is now handled by Better Auth (POST /api/auth/sign-up/email and
// the Google flow), with role/status/verified defaults applied by the
// `databaseHooks.user.create.before` hook in auth.js. The old upsert route is gone.

// Get a user's role. The client reads role straight off the Better Auth session,
// but this endpoint is kept for any server-to-server / debugging use.
router.get('/role/:email', verifyToken, async (req, res) => {
  const user = await collections.users.findOne({ email: req.params.email });
  res.send({ role: user?.role || 'buyer' });
});

// Trusted (verified) sellers — public, for home page.
router.get('/trusted-sellers', async (req, res) => {
  const sellers = await collections.users
    .find({ role: 'seller', verified: true }).limit(4).toArray();
  res.send(sellers);
});

// All users — admin only.
router.get('/', verifyToken, verifyRole('admin'), async (req, res) => {
  const users = await collections.users.find().sort({ createdAt: -1 }).toArray();
  res.send(users);
});

// Single user by email — owner only.
router.get('/:email', verifyToken, verifySelf, async (req, res) => {
  const user = await collections.users.findOne({ email: req.params.email });
  res.send(user || {});
});

// Update own profile (name / photo).
router.patch('/:email', verifyToken, verifySelf, async (req, res) => {
  const { name, photo } = req.body;
  const result = await collections.users.updateOne(
    { email: req.params.email },
    { $set: { ...(name && { name }), ...(photo && { photo }) } }
  );
  res.send(result);
});

// Admin: change role.
router.patch('/:id/role', verifyToken, verifyRole('admin'), async (req, res) => {
  const result = await collections.users.updateOne(
    { _id: new ObjectId(req.params.id) }, { $set: { role: req.body.role } });
  res.send(result);
});

// Admin: block / unblock.
router.patch('/:id/status', verifyToken, verifyRole('admin'), async (req, res) => {
  const result = await collections.users.updateOne(
    { _id: new ObjectId(req.params.id) }, { $set: { status: req.body.status } });
  res.send(result);
});

// Admin: toggle verified-seller badge.
router.patch('/:id/verify', verifyToken, verifyRole('admin'), async (req, res) => {
  const result = await collections.users.updateOne(
    { _id: new ObjectId(req.params.id) }, { $set: { verified: req.body.verified } });
  res.send(result);
});

// Admin: delete user.
router.delete('/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  const result = await collections.users.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
});

module.exports = router;
