const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: { version: ServerApiVersion.v1, strict: true, deprecationErrors: true },
});

const collections = {};

async function connectDB() {
  const db = client.db('resellHub');
  collections.users = db.collection('users');
  collections.products = db.collection('products');
  collections.orders = db.collection('orders');
  collections.reviews = db.collection('reviews');
  collections.payments = db.collection('payments');
  collections.wishlist = db.collection('wishlist');
  collections.reports = db.collection('reports');

  await client.db('admin').command({ ping: 1 });
  console.log('✅ Connected to MongoDB. ReSell Hub database is ready.');
  return collections;
}

module.exports = { connectDB, collections };
