import express from 'express';
import { collections } from '../db.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Reviews for a product — public.
router.get('/product/:id', async (req, res) => {
  const reviews = await collections.reviews
    .find({ productId: req.params.id }).sort({ createdAt: -1 }).toArray();
  res.send(reviews);
});

// Post a review.
router.post('/', verifyToken, async (req, res) => {
  const user = await collections.users.findOne({ email: req.decoded.email });
  const review = {
    reviewerInfo: { userId: user._id.toString(), name: user.name },
    productId: req.body.productId,
    rating: req.body.rating,
    comment: req.body.comment,
    createdAt: new Date(),
  };
  const result = await collections.reviews.insertOne(review);
  res.send(result);
});

export default router;
