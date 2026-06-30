require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { toNodeHandler } = require('better-auth/node');
const { connectDB } = require('./db');
const { auth } = require('./auth');

const app = express();
const port = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));

// Better Auth owns all /api/auth/* routes (sign-up, sign-in, Google, session…).
// It MUST be mounted before express.json() so it can read the raw request body.
// Note the Express 5 splat syntax (`*splat`).
app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());

// Ensure the database is connected before any route runs.
// In serverless (Vercel) this runs per cold start and is memoized in db.js.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('DB connection error:', err);
    res.status(503).send({ message: 'Database unavailable' });
  }
});

// ---------- Routes ----------
app.use('/api/jwt', require('./routes/jwt.routes'));
app.use('/api/users', require('./routes/users.routes'));
app.use('/api/products', require('./routes/products.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/wishlist', require('./routes/wishlist.routes'));
app.use('/api/reviews', require('./routes/reviews.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/payments', require('./routes/payments.routes'));
app.use('/api/stats', require('./routes/stats.routes'));

app.get('/', (req, res) => {
  res.send('🔄 ReSell Hub API is running');
});

// Centralized error handler — log details server-side, return a generic message.
app.use((err, req, res, next) => {
  console.error('Unhandled route error:', err);
  res.status(500).send({ message: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

// ---------- Start (local only; Vercel imports the app as a handler) ----------
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 ReSell Hub server listening on port ${port}`);
  });
}

module.exports = app;
