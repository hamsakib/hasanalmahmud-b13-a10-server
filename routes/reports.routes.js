const express = require('express');
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const verifyToken = require('../middleware/verifyToken');
const { verifyRole } = require('../middleware/verifyRole');

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

module.exports = router;
