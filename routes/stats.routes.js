import express from 'express';
import { collections } from '../db.js';
import verifyToken from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = express.Router();

// Public marketplace stats (home page).
router.get('/marketplace', async (req, res) => {
  const [totalProducts, totalSellers, totalBuyers, completedOrders] = await Promise.all([
    collections.products.countDocuments(),
    collections.users.countDocuments({ role: 'seller' }),
    collections.users.countDocuments({ role: 'buyer' }),
    collections.orders.countDocuments({ orderStatus: 'delivered' }),
  ]);
  res.send({ totalProducts, totalSellers, totalBuyers, completedOrders });
});

// Buyer dashboard stats.
router.get('/buyer', verifyToken, async (req, res) => {
  const email = req.decoded.email;
  const [totalOrders, wishlistCount, paid, recentPurchases] = await Promise.all([
    collections.orders.countDocuments({ 'buyerInfo.email': email }),
    collections.wishlist.countDocuments({ userEmail: email }),
    collections.payments.find({ buyerEmail: email }).toArray(),
    collections.orders.find({ 'buyerInfo.email': email }).sort({ createdAt: -1 }).limit(5).toArray(),
  ]);
  const totalSpent = paid.reduce((s, p) => s + (p.amount || 0), 0);
  res.send({ totalOrders, wishlistCount, totalSpent, recentPurchases });
});

// Seller dashboard stats.
router.get('/seller', verifyToken, verifyRole('seller', 'admin'), async (req, res) => {
  const email = req.decoded.email;
  const [totalProducts, orders] = await Promise.all([
    collections.products.countDocuments({ 'sellerInfo.email': email }),
    collections.orders.find({ 'sellerInfo.email': email }).toArray(),
  ]);
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.amount || 0), 0);
  const pendingOrders = orders.filter((o) => o.orderStatus === 'pending').length;
  const recentOrders = [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  res.send({ totalProducts, totalSales: paidOrders.length, totalRevenue, pendingOrders, recentOrders });
});

// Admin dashboard stats.
router.get('/admin', verifyToken, verifyRole('admin'), async (req, res) => {
  const [totalUsers, totalProducts, totalOrders, payments] = await Promise.all([
    collections.users.countDocuments(),
    collections.products.countDocuments(),
    collections.orders.countDocuments(),
    collections.payments.find().toArray(),
  ]);
  const totalRevenue = payments.reduce((s, p) => s + (p.amount || 0), 0);
  res.send({ totalUsers, totalProducts, totalOrders, totalRevenue });
});

export default router;
