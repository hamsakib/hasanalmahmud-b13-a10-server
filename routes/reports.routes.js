import express from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../db.js';
import verifyToken from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = express.Router();

// Report a product (optional feature: product reporting system).
router.post('/', verifyToken, async (req, res) => {
  const { productId, reason } = req.body;
  await collections.reports.insertOne({
    productId, reason, reporterEmail: req.decoded.email,
    status: 'pending', createdAt: new Date(),
  });
  await collections.products.updateOne(
    { _id: new ObjectId(productId) }, { $inc: { reportCount: 1 } });
  res.send({ message: 'Reported' });
});

// Admin: view all reports.
router.get('/', verifyToken, verifyRole('admin'), async (req, res) => {
  const reports = await collections.reports.find().sort({ createdAt: -1 }).toArray();
  res.send(reports);
});

export default router;
