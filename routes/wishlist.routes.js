import express from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../db.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Add to wishlist.
router.post('/', verifyToken, async (req, res) => {
  const { productId } = req.body;
  const exists = await collections.wishlist.findOne({ productId, userEmail: req.decoded.email });
  if (exists) return res.status(400).send({ message: 'Already in wishlist' });
  const result = await collections.wishlist.insertOne({
    ...req.body, userEmail: req.decoded.email, createdAt: new Date(),
  });
  res.send(result);
});

// Get current user's wishlist.
router.get('/', verifyToken, async (req, res) => {
  const items = await collections.wishlist
    .find({ userEmail: req.decoded.email }).sort({ createdAt: -1 }).toArray();
  res.send(items);
});

// Remove from wishlist.
router.delete('/:id', verifyToken, async (req, res) => {
  const result = await collections.wishlist.deleteOne({
    _id: new ObjectId(req.params.id), userEmail: req.decoded.email,
  });
  res.send(result);
});

export default router;
