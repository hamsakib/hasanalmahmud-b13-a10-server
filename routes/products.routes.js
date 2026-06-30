import express from 'express';
import { ObjectId } from 'mongodb';
import { collections } from '../db.js';
import verifyToken from '../middleware/verifyToken.js';
import { verifyRole } from '../middleware/verifyRole.js';

const router = express.Router();

// Featured (latest available) products — public.
router.get('/featured', async (req, res) => {
  const products = await collections.products
    .find({ approvalStatus: { $ne: 'rejected' }, status: 'available' })
    .sort({ createdAt: -1 }).limit(8).toArray();
  res.send(products);
});

// Seller's own products. (Declared before '/:id' to avoid route clash.)
router.get('/my-products', verifyToken, verifyRole('seller', 'admin'), async (req, res) => {
  const products = await collections.products
    .find({ 'sellerInfo.email': req.decoded.email }).sort({ createdAt: -1 }).toArray();
  res.send(products);
});

// Admin: every product (incl. report counts).
router.get('/all-admin', verifyToken, verifyRole('admin'), async (req, res) => {
  const products = await collections.products.find().sort({ createdAt: -1 }).toArray();
  res.send(products);
});

// Public list with search / filter / sort / pagination.
router.get('/', async (req, res) => {
  const { search, category, condition, sort, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
  const query = { approvalStatus: { $ne: 'rejected' } };

  if (search) query.title = { $regex: search, $options: 'i' };
  if (category) query.category = category;
  if (condition) query.condition = condition;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = parseFloat(minPrice);
    if (maxPrice) query.price.$lte = parseFloat(maxPrice);
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price-asc') sortOption = { price: 1 };
  else if (sort === 'price-desc') sortOption = { price: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await collections.products.countDocuments(query);
  const products = await collections.products
    .find(query).sort(sortOption).skip(skip).limit(parseInt(limit)).toArray();

  res.send({ products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
});

// Single product — public.
router.get('/:id', async (req, res) => {
  try {
    const product = await collections.products.findOne({ _id: new ObjectId(req.params.id) });
    if (!product) return res.status(404).send({ message: 'Product not found' });
    res.send(product);
  } catch {
    res.status(400).send({ message: 'Invalid product id' });
  }
});

// Create product — seller.
router.post('/', verifyToken, verifyRole('seller', 'admin'), async (req, res) => {
  const seller = req.currentUser;
  const product = {
    ...req.body,
    sellerInfo: {
      userId: seller._id.toString(),
      name: seller.name,
      email: seller.email,
      phone: seller.phone || '',
      photo: seller.photo || '',
      verified: seller.verified || false,
      location: seller.location || req.body.location || '',
    },
    status: 'available',
    approvalStatus: 'approved', // visible immediately; admin can still reject
    reportCount: 0,
    createdAt: new Date(),
  };
  const result = await collections.products.insertOne(product);
  res.send({ insertedId: result.insertedId });
});

// Update product — owner seller (or admin).
router.patch('/:id', verifyToken, verifyRole('seller', 'admin'), async (req, res) => {
  const product = await collections.products.findOne({ _id: new ObjectId(req.params.id) });
  if (!product) return res.status(404).send({ message: 'Not found' });
  if (product.sellerInfo.email !== req.decoded.email && req.currentUser.role !== 'admin') {
    return res.status(403).send({ message: 'Forbidden' });
  }
  const { title, price, category, condition, stock, description, images, location } = req.body;
  const result = await collections.products.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: {
      ...(title && { title }), ...(price !== undefined && { price }),
      ...(category && { category }), ...(condition && { condition }),
      ...(stock !== undefined && { stock }), ...(description && { description }),
      ...(images && { images }), ...(location && { location }),
    } }
  );
  res.send(result);
});

// Delete product — owner seller (or admin).
router.delete('/:id', verifyToken, verifyRole('seller', 'admin'), async (req, res) => {
  const product = await collections.products.findOne({ _id: new ObjectId(req.params.id) });
  if (!product) return res.status(404).send({ message: 'Not found' });
  if (product.sellerInfo.email !== req.decoded.email && req.currentUser.role !== 'admin') {
    return res.status(403).send({ message: 'Forbidden' });
  }
  const result = await collections.products.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
});

// Admin: approve / reject product.
router.patch('/:id/approval', verifyToken, verifyRole('admin'), async (req, res) => {
  const result = await collections.products.updateOne(
    { _id: new ObjectId(req.params.id) }, { $set: { approvalStatus: req.body.approvalStatus } });
  res.send(result);
});

// Admin: delete any product.
router.delete('/admin/:id', verifyToken, verifyRole('admin'), async (req, res) => {
  const result = await collections.products.deleteOne({ _id: new ObjectId(req.params.id) });
  res.send(result);
});

export default router;
