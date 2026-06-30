import express from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../db.js';
import verifyToken from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = express.Router();

// Create an order (after "Buy Now").
router.post('/', verifyToken, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await collections.products.findOne({ _id: new ObjectId(productId) });
  if (!product) return res.status(404).send({ message: 'Product not found' });
  const buyer = await collections.users.findOne({ email: req.decoded.email });

  const order = {
    buyerInfo: { userId: buyer._id.toString(), name: buyer.name, email: buyer.email },
    sellerInfo: {
      userId: product.sellerInfo.userId,
      name: product.sellerInfo.name,
      email: product.sellerInfo.email,
    },
    productId,
    productTitle: product.title,
    productImage: product.images?.[0] || '',
    quantity,
    amount: product.price * quantity,
    paymentStatus: 'pending',
    orderStatus: 'pending',
    createdAt: new Date(),
  };
  const result = await collections.orders.insertOne(order);
  res.send({ orderId: result.insertedId });
});

// Buyer's orders.
router.get('/my-orders', verifyToken, async (req, res) => {
  const orders = await collections.orders
    .find({ 'buyerInfo.email': req.decoded.email }).sort({ createdAt: -1 }).toArray();
  res.send(orders);
});

// Seller's incoming orders.
router.get('/seller-orders', verifyToken, verifyRole('seller', 'admin'), async (req, res) => {
  const orders = await collections.orders
    .find({ 'sellerInfo.email': req.decoded.email }).sort({ createdAt: -1 }).toArray();
  res.send(orders);
});

// Admin: all orders.
router.get('/all', verifyToken, verifyRole('admin'), async (req, res) => {
  const orders = await collections.orders.find().sort({ createdAt: -1 }).toArray();
  res.send(orders);
});

// Single order.
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await collections.orders.findOne({ _id: new ObjectId(req.params.id) });
    if (!order) return res.status(404).send({ message: 'Order not found' });
    res.send(order);
  } catch {
    res.status(400).send({ message: 'Invalid order id' });
  }
});

// Buyer: cancel order before shipment.
router.patch('/:id/cancel', verifyToken, async (req, res) => {
  const order = await collections.orders.findOne({ _id: new ObjectId(req.params.id) });
  if (!order) return res.status(404).send({ message: 'Not found' });
  if (order.buyerInfo.email !== req.decoded.email) return res.status(403).send({ message: 'Forbidden' });
  if (!['pending', 'accepted'].includes(order.orderStatus)) {
    return res.status(400).send({ message: 'Cannot cancel after processing' });
  }
  const result = await collections.orders.updateOne(
    { _id: new ObjectId(req.params.id) }, { $set: { orderStatus: 'cancelled' } });
  res.send(result);
});

// Seller / Admin: update order status (Pending → Accepted → Processing → Shipped → Delivered).
router.patch('/:id/status', verifyToken, verifyRole('seller', 'admin'), async (req, res) => {
  const result = await collections.orders.updateOne(
    { _id: new ObjectId(req.params.id) }, { $set: { orderStatus: req.body.orderStatus } });
  res.send(result);
});

export default router;
