import express from 'express';
import { ObjectId } from 'mongodb';
import Stripe from 'stripe';
import { collections } from '../db.js';
import verifyToken from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = express.Router();

// Lazily create the Stripe client so a missing key doesn't crash the whole
// server at startup — it only errors when a payment endpoint is actually used.
let stripeClient = null;
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
};

// Create a Stripe payment intent.
router.post('/create-payment-intent', verifyToken, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).send({ message: 'Payment service not configured' });
  const { amount } = req.body;
  if (!amount || amount < 1) return res.status(400).send({ message: 'Invalid amount' });
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'bdt',
    payment_method_types: ['card'],
  });
  res.send({ clientSecret: paymentIntent.client_secret });
});

// Save payment, mark order paid + processing, and mark product sold.
router.post('/', verifyToken, async (req, res) => {
  const { orderId, transactionId, amount, paymentMethod, buyerEmail } = req.body;
  const order = await collections.orders.findOne({ _id: new ObjectId(orderId) });
  if (!order) return res.status(404).send({ message: 'Order not found' });

  const payment = {
    orderId,
    transactionId,
    buyerId: order.buyerInfo.userId,
    buyerEmail: buyerEmail || req.decoded.email,
    sellerEmail: order.sellerInfo.email,
    productTitle: order.productTitle,
    amount,
    paymentMethod: paymentMethod || 'card',
    paymentStatus: 'success',
    paymentDate: new Date(),
    createdAt: new Date(),
  };
  const result = await collections.payments.insertOne(payment);

  await collections.orders.updateOne(
    { _id: new ObjectId(orderId) },
    { $set: { paymentStatus: 'paid', orderStatus: 'processing', transactionId } }
  );
  await collections.products.updateOne(
    { _id: new ObjectId(order.productId) }, { $set: { status: 'sold' } });

  res.send({ insertedId: result.insertedId, transactionId });
});

// Buyer payment history.
router.get('/my-payments', verifyToken, async (req, res) => {
  const payments = await collections.payments
    .find({ buyerEmail: req.decoded.email }).sort({ createdAt: -1 }).toArray();
  res.send(payments);
});

// Admin: all payments / transaction monitoring.
router.get('/', verifyToken, verifyRole('admin'), async (req, res) => {
  const payments = await collections.payments.find().sort({ createdAt: -1 }).toArray();
  res.send(payments);
});

export default router;
